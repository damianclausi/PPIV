--
-- PostgreSQL database dump
--

\restrict gvfUFZEabDtx4zEAwmcFz1l6uLwmKTvS5dXiJ9Xj70JcDw1PijlvNQtNsGnqzT6

-- Dumped from database version 15.14
-- Dumped by pg_dump version 15.14

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: actualizar_stock_material(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.actualizar_stock_material() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Actualizar stock según el tipo de movimiento
        IF NEW.tipo = 'INGRESO' THEN
            UPDATE material 
            SET stock_actual = stock_actual + NEW.cantidad 
            WHERE material_id = NEW.material_id;
        ELSIF NEW.tipo = 'EGRESO' THEN
            UPDATE material 
            SET stock_actual = stock_actual - NEW.cantidad 
            WHERE material_id = NEW.material_id;
        ELSIF NEW.tipo = 'AJUSTE' THEN
            UPDATE material 
            SET stock_actual = NEW.cantidad 
            WHERE material_id = NEW.material_id;
        END IF;
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$;


--
-- Name: calcular_proximo_vencimiento(integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.calcular_proximo_vencimiento(p_cuenta_id integer) RETURNS date
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_ultimo_periodo DATE;
    v_proximo_periodo DATE;
BEGIN
    SELECT MAX(periodo) INTO v_ultimo_periodo
    FROM factura 
    WHERE cuenta_id = p_cuenta_id;
    
    IF v_ultimo_periodo IS NULL THEN
        v_proximo_periodo := DATE_TRUNC('month', CURRENT_DATE);
    ELSE
        v_proximo_periodo := v_ultimo_periodo + INTERVAL '1 month';
    END IF;
    
    -- Vencimiento a los 15 días del mes siguiente
    RETURN v_proximo_periodo + INTERVAL '1 month' + INTERVAL '15 days';
END;
$$;


--
-- Name: clientes_administracion(boolean, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.clientes_administracion(p_activo boolean DEFAULT NULL::boolean, p_busqueda text DEFAULT NULL::text) RETURNS TABLE(socio_id integer, nombre_completo text, dni character varying, email character varying, telefono character varying, activo boolean, fecha_alta date, total_cuentas integer, ultimo_pago date)
    LANGUAGE plpgsql
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.socio_id,
        s.nombre || ' ' || s.apellido as nombre_completo,
        s.dni,
        s.email,
        s.telefono,
        s.activo,
        s.fecha_alta,
        COUNT(DISTINCT c.cuenta_id)::INTEGER as total_cuentas,
        MAX(pago.fecha)::DATE as ultimo_pago
    FROM socio s
    LEFT JOIN cuenta c ON s.socio_id = c.socio_id
    LEFT JOIN factura f ON c.cuenta_id = f.cuenta_id
    LEFT JOIN pago ON f.factura_id = pago.factura_id
    WHERE (p_activo IS NULL OR s.activo = p_activo)
    AND (p_busqueda IS NULL OR 
         LOWER(s.nombre || ' ' || s.apellido) LIKE LOWER('%' || p_busqueda || '%') OR
         s.dni LIKE '%' || p_busqueda || '%' OR
         LOWER(s.email) LIKE LOWER('%' || p_busqueda || '%'))
    GROUP BY s.socio_id, s.nombre, s.apellido, s.dni, s.email, s.telefono, s.activo, s.fecha_alta
    ORDER BY s.apellido, s.nombre;
END;
$$;


--
-- Name: completar_orden_trabajo(integer, text, json); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.completar_orden_trabajo(p_ot_id integer, p_observaciones text DEFAULT NULL::text, p_materiales_usados json DEFAULT NULL::json) RETURNS boolean
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_reclamo_id INTEGER;
    v_ot_existe BOOLEAN;
    v_material JSON;
BEGIN
    -- Verificar que la OT existe y no está completada
    SELECT EXISTS(
        SELECT 1 FROM orden_trabajo 
        WHERE ot_id = p_ot_id AND estado NOT IN ('COMPLETADA', 'CANCELADA')
    ) INTO v_ot_existe;
    
    IF NOT v_ot_existe THEN
        RAISE EXCEPTION 'La orden de trabajo con ID % no existe o ya está completada/cancelada', p_ot_id;
    END IF;
    
    -- Obtener el reclamo asociado
    SELECT reclamo_id INTO v_reclamo_id FROM orden_trabajo WHERE ot_id = p_ot_id;
    
    -- Procesar materiales usados si se proporcionaron
    IF p_materiales_usados IS NOT NULL THEN
        FOR v_material IN SELECT * FROM json_array_elements(p_materiales_usados)
        LOOP
            INSERT INTO uso_material (ot_id, material_id, cantidad)
            VALUES (
                p_ot_id,
                (v_material->>'material_id')::INTEGER,
                (v_material->>'cantidad')::INTEGER
            );
            
            -- Registrar egreso de stock
            INSERT INTO mov_stock (material_id, tipo, cantidad, referencia, observaciones)
            VALUES (
                (v_material->>'material_id')::INTEGER,
                'EGRESO',
                (v_material->>'cantidad')::INTEGER,
                'OT-' || p_ot_id::text,
                'Uso en orden de trabajo'
            );
        END LOOP;
    END IF;
    
    -- Completar la orden de trabajo
    UPDATE orden_trabajo 
    SET estado = 'COMPLETADA',
        fecha_cierre = CURRENT_TIMESTAMP,
        observaciones = COALESCE(p_observaciones, observaciones)
    WHERE ot_id = p_ot_id;
    
    -- Actualizar el reclamo
    UPDATE reclamo 
    SET estado = 'RESUELTO',
        fecha_cierre = CURRENT_TIMESTAMP
    WHERE reclamo_id = v_reclamo_id;
    
    RETURN TRUE;
END;
$$;


--
-- Name: crear_nueva_cuenta(integer, character varying, text, character varying, integer, boolean); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.crear_nueva_cuenta(p_socio_id integer, p_numero_cuenta character varying, p_direccion text, p_localidad character varying, p_servicio_id integer, p_es_principal boolean DEFAULT false) RETURNS integer
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_cuenta_id INTEGER;
    v_socio_existe BOOLEAN;
    v_servicio_existe BOOLEAN;
    v_numero_existe BOOLEAN;
BEGIN
    -- Verificar que el socio existe
    SELECT EXISTS(SELECT 1 FROM socio WHERE socio_id = p_socio_id AND activo = true) INTO v_socio_existe;
    IF NOT v_socio_existe THEN
        RAISE EXCEPTION 'El socio con ID % no existe o no está activo', p_socio_id;
    END IF;
    
    -- Verificar que el servicio existe
    SELECT EXISTS(SELECT 1 FROM servicio WHERE servicio_id = p_servicio_id AND activo = true) INTO v_servicio_existe;
    IF NOT v_servicio_existe THEN
        RAISE EXCEPTION 'El servicio con ID % no existe o no está activo', p_servicio_id;
    END IF;
    
    -- Verificar que el número de cuenta no existe
    SELECT EXISTS(SELECT 1 FROM cuenta WHERE numero_cuenta = p_numero_cuenta) INTO v_numero_existe;
    IF v_numero_existe THEN
        RAISE EXCEPTION 'El número de cuenta % ya existe', p_numero_cuenta;
    END IF;
    
    -- Si es principal, desmarcar otras cuentas principales del mismo socio
    IF p_es_principal THEN
        UPDATE cuenta SET principal = false 
        WHERE socio_id = p_socio_id AND principal = true;
    END IF;
    
    -- Crear la cuenta
    INSERT INTO cuenta (socio_id, numero_cuenta, direccion, localidad, servicio_id, principal)
    VALUES (p_socio_id, p_numero_cuenta, p_direccion, p_localidad, p_servicio_id, p_es_principal)
    RETURNING cuenta_id INTO v_cuenta_id;
    
    RETURN v_cuenta_id;
END;
$$;


--
-- Name: crear_reclamo_con_ot(integer, integer, integer, text, character varying, integer, timestamp without time zone); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.crear_reclamo_con_ot(p_cuenta_id integer, p_tipo_id integer, p_prioridad_id integer, p_descripcion text, p_canal character varying DEFAULT 'WEB'::character varying, p_empleado_id integer DEFAULT NULL::integer, p_fecha_programada timestamp without time zone DEFAULT NULL::timestamp without time zone) RETURNS json
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_reclamo_id INTEGER;
    v_ot_id INTEGER;
    v_cuenta_existe BOOLEAN;
    v_direccion TEXT;
    v_resultado JSON;
BEGIN
    -- Verificar que la cuenta existe
    SELECT EXISTS(SELECT 1 FROM cuenta WHERE cuenta_id = p_cuenta_id AND activa = true) INTO v_cuenta_existe;
    IF NOT v_cuenta_existe THEN
        RAISE EXCEPTION 'La cuenta con ID % no existe o no está activa', p_cuenta_id;
    END IF;
    
    -- Obtener dirección de la cuenta
    SELECT direccion INTO v_direccion FROM cuenta WHERE cuenta_id = p_cuenta_id;
    
    -- Crear el reclamo
    INSERT INTO reclamo (cuenta_id, tipo_id, prioridad_id, descripcion, canal)
    VALUES (p_cuenta_id, p_tipo_id, p_prioridad_id, p_descripcion, p_canal)
    RETURNING reclamo_id INTO v_reclamo_id;
    
    -- Crear la orden de trabajo
    INSERT INTO orden_trabajo (reclamo_id, empleado_id, fecha_programada, direccion_intervencion)
    VALUES (v_reclamo_id, p_empleado_id, p_fecha_programada, v_direccion)
    RETURNING ot_id INTO v_ot_id;
    
    -- Actualizar estado del reclamo si se asignó empleado
    IF p_empleado_id IS NOT NULL THEN
        UPDATE reclamo SET estado = 'EN CURSO' WHERE reclamo_id = v_reclamo_id;
        UPDATE orden_trabajo SET estado = 'ASIGNADA' WHERE ot_id = v_ot_id;
    END IF;
    
    -- Retornar información
    SELECT json_build_object(
        'reclamo_id', v_reclamo_id,
        'ot_id', v_ot_id,
        'estado_reclamo', CASE WHEN p_empleado_id IS NOT NULL THEN 'EN CURSO' ELSE 'PENDIENTE' END,
        'estado_ot', CASE WHEN p_empleado_id IS NOT NULL THEN 'ASIGNADA' ELSE 'PENDIENTE' END
    ) INTO v_resultado;
    
    RETURN v_resultado;
END;
$$;


--
-- Name: crear_usuario_sistema(character varying, text, integer, integer, character varying[]); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.crear_usuario_sistema(p_email character varying, p_hash_pass text, p_socio_id integer DEFAULT NULL::integer, p_empleado_id integer DEFAULT NULL::integer, p_roles character varying[] DEFAULT ARRAY['CLIENTE'::character varying(50)]) RETURNS integer
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_usuario_id INTEGER;
    v_rol_id INTEGER;
    v_rol VARCHAR(50);
    v_existing_user INTEGER;
BEGIN
    -- Verificar si el usuario ya existe
    SELECT usuario_id INTO v_existing_user FROM usuario WHERE email = p_email;
    
    IF v_existing_user IS NOT NULL THEN
        RAISE NOTICE '⚠️ Usuario ya existe: % (ID: %)', p_email, v_existing_user;
        RETURN v_existing_user;
    END IF;
    
    -- Insertar usuario
    INSERT INTO usuario (email, hash_pass, socio_id, empleado_id, activo)
    VALUES (p_email, p_hash_pass, p_socio_id, p_empleado_id, TRUE)
    RETURNING usuario_id INTO v_usuario_id;
    
    -- Asignar roles
    FOREACH v_rol IN ARRAY p_roles LOOP
        SELECT rol_id INTO v_rol_id FROM rol WHERE nombre = v_rol;
        
        IF v_rol_id IS NOT NULL THEN
            INSERT INTO usuario_rol (usuario_id, rol_id)
            VALUES (v_usuario_id, v_rol_id)
            ON CONFLICT (usuario_id, rol_id) DO NOTHING;
        END IF;
    END LOOP;
    
    RAISE NOTICE '✅ Usuario creado: % (ID: %)', p_email, v_usuario_id;
    RETURN v_usuario_id;
END;
$$;


--
-- Name: dashboard_cliente(integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.dashboard_cliente(p_socio_id integer) RETURNS json
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_resultado JSON;
BEGIN
    SELECT json_build_object(
        'estado_servicio', (
            SELECT json_build_object(
                'activo', bool_and(c.activa),
                'total_cuentas', count(c.cuenta_id),
                'ultimo_consumo', (
                    SELECT l.consumo 
                    FROM lectura l 
                    JOIN medidor m ON l.medidor_id = m.medidor_id
                    JOIN cuenta ct ON m.cuenta_id = ct.cuenta_id
                    WHERE ct.socio_id = p_socio_id
                    ORDER BY l.fecha DESC 
                    LIMIT 1
                )
            )
            FROM cuenta c
            WHERE c.socio_id = p_socio_id
        ),
        'ultimas_facturas', (
            SELECT json_agg(factura_data ORDER BY periodo DESC)
            FROM (
                SELECT json_build_object(
                    'factura_id', f.factura_id,
                    'numero_externo', f.numero_externo,
                    'periodo', f.periodo,
                    'importe', f.importe,
                    'vencimiento', f.vencimiento,
                    'estado', f.estado
                ) as factura_data, f.periodo
                FROM factura f
                JOIN cuenta c ON f.cuenta_id = c.cuenta_id
                WHERE c.socio_id = p_socio_id
                ORDER BY f.periodo DESC
                LIMIT 5
            ) facturas_ordenadas
        ),
        'reclamos_activos', (
            SELECT json_agg(reclamo_data ORDER BY fecha_alta DESC)
            FROM (
                SELECT json_build_object(
                    'reclamo_id', r.reclamo_id,
                    'tipo', tr.nombre,
                    'estado', r.estado,
                    'fecha_alta', r.fecha_alta,
                    'prioridad', p.nombre
                ) as reclamo_data, r.fecha_alta
                FROM reclamo r
                JOIN cuenta c ON r.cuenta_id = c.cuenta_id
                JOIN detalle_tipo_reclamo d ON r.detalle_id = d.detalle_id
    JOIN tipo_reclamo t ON d.tipo_id = t.tipo_id
                JOIN prioridad p ON r.prioridad_id = p.prioridad_id
                WHERE c.socio_id = p_socio_id
                AND r.estado != 'RESUELTO'
                ORDER BY r.fecha_alta DESC
            ) reclamos_ordenados
        )
    ) INTO v_resultado;
    
    RETURN v_resultado;
END;
$$;


--
-- Name: dashboard_reclamos(date, date); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.dashboard_reclamos(p_fecha_desde date DEFAULT (CURRENT_DATE - '30 days'::interval), p_fecha_hasta date DEFAULT CURRENT_DATE) RETURNS json
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_resultado JSON;
BEGIN
    SELECT json_build_object(
        'periodo', json_build_object(
            'desde', p_fecha_desde,
            'hasta', p_fecha_hasta
        ),
        'totales', json_build_object(
            'total_reclamos', (
                SELECT COUNT(*) 
                FROM reclamo 
                WHERE fecha_alta::date BETWEEN p_fecha_desde AND p_fecha_hasta
            ),
            'pendientes', (
                SELECT COUNT(*) 
                FROM reclamo 
                WHERE estado = 'PENDIENTE' 
                AND fecha_alta::date BETWEEN p_fecha_desde AND p_fecha_hasta
            ),
            'en_proceso', (
                SELECT COUNT(*) 
                FROM reclamo 
                WHERE estado = 'EN CURSO' 
                AND fecha_alta::date BETWEEN p_fecha_desde AND p_fecha_hasta
            ),
            'resueltos', (
                SELECT COUNT(*) 
                FROM reclamo 
                WHERE estado = 'RESUELTO'
                AND fecha_alta::date BETWEEN p_fecha_desde AND p_fecha_hasta
            )
        ),
        'por_tipo', (
            SELECT json_agg(json_build_object(
                'tipo', tr.nombre,
                'cantidad', COUNT(*),
                'porcentaje', ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2)
            ))
            FROM reclamo r
            JOIN tipo_reclamo tr ON r.tipo_id = tr.tipo_id
            WHERE r.fecha_alta::date BETWEEN p_fecha_desde AND p_fecha_hasta
            GROUP BY tr.nombre
            ORDER BY COUNT(*) DESC
        ),
        'por_prioridad', (
            SELECT json_agg(json_build_object(
                'prioridad', p.nombre,
                'cantidad', COUNT(*),
                'porcentaje', ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2)
            ))
            FROM reclamo r
            JOIN prioridad p ON r.prioridad_id = p.prioridad_id
            WHERE r.fecha_alta::date BETWEEN p_fecha_desde AND p_fecha_hasta
            GROUP BY p.nombre, p.orden
            ORDER BY p.orden
        ),
        'tiempo_promedio_resolucion', (
            SELECT ROUND(AVG(EXTRACT(DAYS FROM (fecha_cierre - fecha_alta))), 2)
            FROM reclamo 
            WHERE estado = 'RESUELTO'
            AND fecha_cierre IS NOT NULL
            AND fecha_alta::date BETWEEN p_fecha_desde AND p_fecha_hasta
        )
    ) INTO v_resultado;
    
    RETURN v_resultado;
END;
$$;


--
-- Name: detalle_factura(integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.detalle_factura(p_factura_id integer) RETURNS json
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_resultado JSON;
BEGIN
    SELECT json_build_object(
        'factura', json_build_object(
            'factura_id', f.factura_id,
            'numero_externo', f.numero_externo,
            'periodo', f.periodo,
            'vencimiento', f.vencimiento,
            'importe', f.importe,
            'estado', f.estado
        ),
        'cuenta', json_build_object(
            'numero_cuenta', c.numero_cuenta,
            'direccion', c.direccion,
            'localidad', c.localidad,
            'servicio', srv.nombre
        ),
        'socio', json_build_object(
            'nombre_completo', s.nombre || ' ' || s.apellido,
            'dni', s.dni,
            'email', s.email
        ),
        'consumo', (
            SELECT json_build_object(
                'kwh_consumidos', l.consumo,
                'fecha_lectura', l.fecha,
                'estado_anterior', l.estado_anterior,
                'estado_actual', l.estado_actual
            )
            FROM lectura l
            JOIN medidor m ON l.medidor_id = m.medidor_id
            WHERE m.cuenta_id = c.cuenta_id
            AND DATE_TRUNC('month', l.fecha) = f.periodo
            LIMIT 1
        ),
        'pagos', (
            SELECT COALESCE(json_agg(json_build_object(
                'fecha', p.fecha,
                'monto', p.monto,
                'medio', p.medio,
                'estado', p.estado
            )), '[]'::json)
            FROM pago p
            WHERE p.factura_id = f.factura_id
        )
    ) INTO v_resultado
    FROM factura f
    JOIN cuenta c ON f.cuenta_id = c.cuenta_id
    JOIN socio s ON c.socio_id = s.socio_id
    JOIN servicio srv ON c.servicio_id = srv.servicio_id
    WHERE f.factura_id = p_factura_id;
    
    RETURN v_resultado;
END;
$$;


--
-- Name: detalle_reclamo_operario(integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.detalle_reclamo_operario(p_ot_id integer) RETURNS json
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_resultado JSON;
BEGIN
    SELECT json_build_object(
        'orden_trabajo', json_build_object(
            'ot_id', ot.ot_id,
            'estado', ot.estado,
            'fecha_programada', ot.fecha_programada,
            'direccion_intervencion', ot.direccion_intervencion,
            'observaciones', ot.observaciones
        ),
        'reclamo', json_build_object(
            'reclamo_id', r.reclamo_id,
            'descripcion', r.descripcion,
            'fecha_alta', r.fecha_alta,
            'canal', r.canal,
            'tipo', tr.nombre,
            'prioridad', p.nombre
        ),
        'cliente', json_build_object(
            'nombre_completo', s.nombre || ' ' || s.apellido,
            'telefono', s.telefono,
            'numero_cuenta', c.numero_cuenta,
            'direccion', c.direccion
        ),
        'materiales_usados', (
            SELECT COALESCE(json_agg(json_build_object(
                'material', m.descripcion,
                'codigo', m.codigo,
                'cantidad', um.cantidad,
                'unidad', m.unidad
            )), '[]'::json)
            FROM uso_material um
            JOIN material m ON um.material_id = m.material_id
            WHERE um.ot_id = ot.ot_id
        )
    ) INTO v_resultado
    FROM orden_trabajo ot
    JOIN reclamo r ON ot.reclamo_id = r.reclamo_id
    JOIN cuenta c ON r.cuenta_id = c.cuenta_id
    JOIN socio s ON c.socio_id = s.socio_id
    JOIN detalle_tipo_reclamo d ON r.detalle_id = d.detalle_id
    JOIN tipo_reclamo t ON d.tipo_id = t.tipo_id
    JOIN prioridad p ON r.prioridad_id = p.prioridad_id
    WHERE ot.ot_id = p_ot_id;
    
    RETURN v_resultado;
END;
$$;


--
-- Name: facturas_cliente(integer, character varying, date, date); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.facturas_cliente(p_socio_id integer, p_estado character varying DEFAULT NULL::character varying, p_desde date DEFAULT NULL::date, p_hasta date DEFAULT NULL::date) RETURNS TABLE(factura_id integer, numero_externo character varying, numero_cuenta character varying, periodo date, vencimiento date, importe numeric, estado character varying, dias_vencimiento integer)
    LANGUAGE plpgsql
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        f.factura_id,
        f.numero_externo,
        c.numero_cuenta,
        f.periodo,
        f.vencimiento,
        f.importe,
        f.estado,
        CASE 
            WHEN f.estado = 'PENDIENTE' THEN 
                EXTRACT(DAYS FROM (CURRENT_DATE - f.vencimiento))::INTEGER
            ELSE NULL
        END as dias_vencimiento
    FROM factura f
    JOIN cuenta c ON f.cuenta_id = c.cuenta_id
    WHERE c.socio_id = p_socio_id
    AND (p_estado IS NULL OR f.estado = p_estado)
    AND (p_desde IS NULL OR f.periodo >= p_desde)
    AND (p_hasta IS NULL OR f.periodo <= p_hasta)
    ORDER BY f.periodo DESC, f.vencimiento DESC;
END;
$$;


--
-- Name: generar_factura(integer, date, numeric, integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.generar_factura(p_cuenta_id integer, p_periodo date, p_importe numeric, p_dias_vencimiento integer DEFAULT 30) RETURNS integer
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_factura_id INTEGER;
    v_cuenta_existe BOOLEAN;
    v_numero_externo VARCHAR(50);
    v_vencimiento DATE;
BEGIN
    -- Verificar que la cuenta existe
    SELECT EXISTS(SELECT 1 FROM cuenta WHERE cuenta_id = p_cuenta_id AND activa = true) INTO v_cuenta_existe;
    IF NOT v_cuenta_existe THEN
        RAISE EXCEPTION 'La cuenta con ID % no existe o no está activa', p_cuenta_id;
    END IF;
    
    -- Verificar que no existe factura para el mismo período
    IF EXISTS(SELECT 1 FROM factura WHERE cuenta_id = p_cuenta_id AND periodo = p_periodo) THEN
        RAISE EXCEPTION 'Ya existe una factura para la cuenta % en el período %', p_cuenta_id, p_periodo;
    END IF;
    
    -- Generar número externo
    v_numero_externo := 'FAC-' || LPAD(p_cuenta_id::text, 6, '0') || '-' || TO_CHAR(p_periodo, 'MMYYYY');
    
    -- Calcular vencimiento
    v_vencimiento := p_periodo + INTERVAL '1 month' + (p_dias_vencimiento || ' days')::INTERVAL;
    
    -- Crear la factura
    INSERT INTO factura (cuenta_id, periodo, importe, vencimiento, numero_externo)
    VALUES (p_cuenta_id, p_periodo, p_importe, v_vencimiento, v_numero_externo)
    RETURNING factura_id INTO v_factura_id;
    
    RETURN v_factura_id;
END;
$$;


--
-- Name: itinerarios_cuadrillas(date); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.itinerarios_cuadrillas(p_fecha date DEFAULT CURRENT_DATE) RETURNS TABLE(cuadrilla_id integer, nombre_cuadrilla character varying, zona character varying, total_ordenes integer, ordenes_pendientes integer, empleados json)
    LANGUAGE plpgsql
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.cuadrilla_id,
        c.nombre as nombre_cuadrilla,
        c.zona,
        COUNT(DISTINCT id.ot_id)::INTEGER as total_ordenes,
        COUNT(DISTINCT CASE WHEN NOT COALESCE(id.completada, false) THEN id.ot_id END)::INTEGER as ordenes_pendientes,
        (
            SELECT json_agg(json_build_object(
                'empleado_id', e.empleado_id,
                'nombre_completo', e.nombre || ' ' || e.apellido,
                'rol', e.rol_interno
            ))
            FROM empleado_cuadrilla ec
            JOIN empleado e ON ec.empleado_id = e.empleado_id
            WHERE ec.cuadrilla_id = c.cuadrilla_id
            AND ec.activa = true
        ) as empleados
    FROM cuadrilla c
    LEFT JOIN itinerario i ON c.cuadrilla_id = i.cuadrilla_id AND i.fecha = p_fecha
    LEFT JOIN itinerario_det id ON i.itinerario_id = id.itinerario_id
    WHERE c.activa = true
    GROUP BY c.cuadrilla_id, c.nombre, c.zona
    ORDER BY c.nombre;
END;
$$;


--
-- Name: materiales_disponibles(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.materiales_disponibles() RETURNS TABLE(material_id integer, codigo character varying, descripcion text, stock_actual integer, unidad character varying)
    LANGUAGE plpgsql
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        m.material_id,
        m.codigo,
        m.descripcion,
        m.stock_actual,
        m.unidad
    FROM material m
    WHERE m.activo = true
    AND m.stock_actual > 0
    ORDER BY m.descripcion;
END;
$$;


--
-- Name: metricas_administrativas(date, date); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.metricas_administrativas(p_fecha_desde date DEFAULT (CURRENT_DATE - '30 days'::interval), p_fecha_hasta date DEFAULT CURRENT_DATE) RETURNS json
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_resultado JSON;
BEGIN
    SELECT json_build_object(
        'reclamos', json_build_object(
            'total_periodo', (
                SELECT COUNT(*) 
                FROM reclamo 
                WHERE fecha_alta::date BETWEEN p_fecha_desde AND p_fecha_hasta
            ),
            'por_estado', (
                SELECT json_object_agg(estado, cantidad)
                FROM (
                    SELECT estado, COUNT(*) as cantidad
                    FROM reclamo 
                    WHERE fecha_alta::date BETWEEN p_fecha_desde AND p_fecha_hasta
                    GROUP BY estado
                ) sub
            ),
            'por_tipo', (
                SELECT json_agg(json_build_object(
                    'tipo', tr.nombre,
                    'cantidad', COUNT(*),
                    'porcentaje', ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 1)
                ))
                FROM reclamo r
                JOIN detalle_tipo_reclamo d ON r.detalle_id = d.detalle_id
    JOIN tipo_reclamo t ON d.tipo_id = t.tipo_id
                WHERE r.fecha_alta::date BETWEEN p_fecha_desde AND p_fecha_hasta
                GROUP BY tr.nombre
                ORDER BY COUNT(*) DESC
            ),
            'por_prioridad', (
                SELECT json_agg(json_build_object(
                    'prioridad', p.nombre,
                    'cantidad', COUNT(*),
                    'porcentaje', ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 1)
                ))
                FROM reclamo r
                JOIN prioridad p ON r.prioridad_id = p.prioridad_id
                WHERE r.fecha_alta::date BETWEEN p_fecha_desde AND p_fecha_hasta
                GROUP BY p.nombre, p.orden
                ORDER BY p.orden
            ),
            'tiempo_promedio_resolucion', (
                SELECT ROUND(AVG(EXTRACT(HOURS FROM (fecha_cierre - fecha_alta))), 1)
                FROM reclamo 
                WHERE estado = 'RESUELTO'
                AND fecha_cierre IS NOT NULL
                AND fecha_alta::date BETWEEN p_fecha_desde AND p_fecha_hasta
            )
        ),
        'operaciones', json_build_object(
            'ordenes_completadas', (
                SELECT COUNT(*)
                FROM orden_trabajo
                WHERE estado = 'COMPLETADA'
                AND fecha_cierre::date BETWEEN p_fecha_desde AND p_fecha_hasta
            ),
            'ordenes_pendientes', (
                SELECT COUNT(*)
                FROM orden_trabajo
                WHERE estado IN ('PENDIENTE', 'ASIGNADA', 'EN CURSO')
            ),
            'cuadrillas_activas', (
                SELECT COUNT(*)
                FROM cuadrilla
                WHERE activa = true
            )
        ),
        'facturacion', json_build_object(
            'facturas_emitidas', (
                SELECT COUNT(*)
                FROM factura
                WHERE periodo BETWEEN p_fecha_desde AND p_fecha_hasta
            ),
            'importe_facturado', (
                SELECT COALESCE(SUM(importe), 0)
                FROM factura
                WHERE periodo BETWEEN p_fecha_desde AND p_fecha_hasta
            ),
            'importe_cobrado', (
                SELECT COALESCE(SUM(p.monto), 0)
                FROM pago p
                JOIN factura f ON p.factura_id = f.factura_id
                WHERE p.fecha::date BETWEEN p_fecha_desde AND p_fecha_hasta
            ),
            'porcentaje_cobranza', (
                SELECT CASE 
                    WHEN SUM(f.importe) > 0 THEN 
                        ROUND(SUM(COALESCE(p.monto, 0)) * 100.0 / SUM(f.importe), 1)
                    ELSE 0 
                END
                FROM factura f
                LEFT JOIN pago p ON f.factura_id = p.factura_id 
                    AND p.fecha::date BETWEEN p_fecha_desde AND p_fecha_hasta
                WHERE f.periodo BETWEEN p_fecha_desde AND p_fecha_hasta
            )
        )
    ) INTO v_resultado;
    
    RETURN v_resultado;
END;
$$;


--
-- Name: obtener_consumo_promedio(integer, integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.obtener_consumo_promedio(p_medidor_id integer, p_meses integer DEFAULT 6) RETURNS numeric
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_promedio DECIMAL;
BEGIN
    SELECT AVG(consumo) INTO v_promedio
    FROM lectura 
    WHERE medidor_id = p_medidor_id 
    AND fecha >= CURRENT_DATE - INTERVAL '1 month' * p_meses;
    
    RETURN COALESCE(v_promedio, 0);
END;
$$;


--
-- Name: ordenes_asignadas_operario(integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.ordenes_asignadas_operario(p_empleado_id integer) RETURNS TABLE(ot_id integer, reclamo_id integer, tipo_reclamo character varying, prioridad character varying, prioridad_orden integer, direccion text, fecha_programada timestamp without time zone, estado character varying, descripcion text, zona character varying)
    LANGUAGE plpgsql
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ot.ot_id,
        r.reclamo_id,
        d.nombre as detalle_reclamo, t.nombre as tipo_reclamo,
        p.nombre as prioridad,
        p.orden as prioridad_orden,
        ot.direccion_intervencion as direccion,
        ot.fecha_programada,
        ot.estado,
        r.descripcion,
        'Gobernador Ugarte' as zona
    FROM orden_trabajo ot
    JOIN reclamo r ON ot.reclamo_id = r.reclamo_id
    JOIN detalle_tipo_reclamo d ON r.detalle_id = d.detalle_id
    JOIN tipo_reclamo t ON d.tipo_id = t.tipo_id
    JOIN prioridad p ON r.prioridad_id = p.prioridad_id
    WHERE ot.empleado_id = p_empleado_id
    AND ot.estado IN ('ASIGNADA', 'EN CURSO')
    ORDER BY p.orden, ot.fecha_programada;
END;
$$;


--
-- Name: planificar_itinerario(integer, date, integer[], text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.planificar_itinerario(p_cuadrilla_id integer, p_fecha date, p_ordenes_trabajo integer[], p_observaciones text DEFAULT NULL::text) RETURNS integer
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_itinerario_id INTEGER;
    v_ot_id INTEGER;
    v_orden INTEGER := 1;
    v_hora_estimada TIME := '08:00:00';
BEGIN
    -- Verificar que la cuadrilla existe
    IF NOT EXISTS(SELECT 1 FROM cuadrilla WHERE cuadrilla_id = p_cuadrilla_id AND activa = true) THEN
        RAISE EXCEPTION 'La cuadrilla con ID % no existe o no está activa', p_cuadrilla_id;
    END IF;
    
    -- Crear el itinerario
    INSERT INTO itinerario (cuadrilla_id, fecha, observaciones)
    VALUES (p_cuadrilla_id, p_fecha, p_observaciones)
    RETURNING itinerario_id INTO v_itinerario_id;
    
    -- Agregar órdenes de trabajo al itinerario
    FOREACH v_ot_id IN ARRAY p_ordenes_trabajo
    LOOP
        -- Verificar que la OT existe y está disponible
        IF NOT EXISTS(
            SELECT 1 FROM orden_trabajo 
            WHERE ot_id = v_ot_id AND estado IN ('PENDIENTE', 'ASIGNADA')
        ) THEN
            RAISE EXCEPTION 'La orden de trabajo % no existe o no está disponible para planificar', v_ot_id;
        END IF;
        
        -- Agregar al detalle del itinerario
        INSERT INTO itinerario_det (itinerario_id, ot_id, orden, hora_estimada)
        VALUES (v_itinerario_id, v_ot_id, v_orden, v_hora_estimada);
        
        -- Actualizar estado de la OT
        UPDATE orden_trabajo SET estado = 'ASIGNADA' WHERE ot_id = v_ot_id;
        
        -- Incrementar orden y hora estimada
        v_orden := v_orden + 1;
        v_hora_estimada := v_hora_estimada + INTERVAL '2 hours';
    END LOOP;
    
    RETURN v_itinerario_id;
END;
$$;


--
-- Name: reclamos_cliente(integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.reclamos_cliente(p_socio_id integer) RETURNS TABLE(reclamo_id integer, fecha_alta timestamp without time zone, tipo_reclamo character varying, descripcion text, estado character varying, prioridad character varying, canal character varying, numero_cuenta character varying)
    LANGUAGE plpgsql
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        r.reclamo_id,
        r.fecha_alta,
        d.nombre as detalle_reclamo, t.nombre as tipo_reclamo,
        r.descripcion,
        r.estado,
        p.nombre as prioridad,
        r.canal,
        c.numero_cuenta
    FROM reclamo r
    JOIN cuenta c ON r.cuenta_id = c.cuenta_id
    JOIN detalle_tipo_reclamo d ON r.detalle_id = d.detalle_id
    JOIN tipo_reclamo t ON d.tipo_id = t.tipo_id
    JOIN prioridad p ON r.prioridad_id = p.prioridad_id
    WHERE c.socio_id = p_socio_id
    ORDER BY r.fecha_alta DESC;
END;
$$;


--
-- Name: registrar_lectura(integer, integer, date, character varying, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.registrar_lectura(p_medidor_id integer, p_estado_actual integer, p_fecha date DEFAULT CURRENT_DATE, p_ruta character varying DEFAULT NULL::character varying, p_observaciones text DEFAULT NULL::text) RETURNS integer
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_lectura_id INTEGER;
    v_ultimo_estado INTEGER;
    v_medidor_existe BOOLEAN;
BEGIN
    -- Verificar que el medidor existe
    SELECT EXISTS(SELECT 1 FROM medidor WHERE medidor_id = p_medidor_id AND activo = true) INTO v_medidor_existe;
    IF NOT v_medidor_existe THEN
        RAISE EXCEPTION 'El medidor con ID % no existe o no está activo', p_medidor_id;
    END IF;
    
    -- Obtener el último estado
    SELECT COALESCE(MAX(estado_actual), 0) INTO v_ultimo_estado
    FROM lectura 
    WHERE medidor_id = p_medidor_id;
    
    -- Validar que el nuevo estado sea mayor al anterior
    IF p_estado_actual < v_ultimo_estado THEN
        RAISE EXCEPTION 'El estado actual (%) no puede ser menor al último estado registrado (%)', 
                        p_estado_actual, v_ultimo_estado;
    END IF;
    
    -- Insertar la lectura
    INSERT INTO lectura (medidor_id, fecha, estado_anterior, estado_actual, ruta, observaciones)
    VALUES (p_medidor_id, p_fecha, v_ultimo_estado, p_estado_actual, p_ruta, p_observaciones)
    RETURNING lectura_id INTO v_lectura_id;
    
    RETURN v_lectura_id;
END;
$$;


--
-- Name: registrar_pago(integer, numeric, character varying, character varying, timestamp without time zone); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.registrar_pago(p_factura_id integer, p_monto numeric, p_medio character varying, p_external_ref character varying DEFAULT NULL::character varying, p_fecha timestamp without time zone DEFAULT CURRENT_TIMESTAMP) RETURNS integer
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_pago_id INTEGER;
    v_factura_existe BOOLEAN;
    v_importe_factura DECIMAL(10,2);
    v_total_pagado DECIMAL(10,2);
BEGIN
    -- Verificar que la factura existe y está pendiente
    SELECT EXISTS(SELECT 1 FROM factura WHERE factura_id = p_factura_id AND estado = 'PENDIENTE') INTO v_factura_existe;
    IF NOT v_factura_existe THEN
        RAISE EXCEPTION 'La factura con ID % no existe o no está pendiente de pago', p_factura_id;
    END IF;
    
    -- Obtener importe de la factura
    SELECT importe INTO v_importe_factura FROM factura WHERE factura_id = p_factura_id;
    
    -- Calcular total ya pagado
    SELECT COALESCE(SUM(monto), 0) INTO v_total_pagado 
    FROM pago 
    WHERE factura_id = p_factura_id AND estado = 'CONFIRMADO';
    
    -- Verificar que no se exceda el importe
    IF (v_total_pagado + p_monto) > v_importe_factura THEN
        RAISE EXCEPTION 'El pago de % excede el saldo pendiente de %', 
                        p_monto, (v_importe_factura - v_total_pagado);
    END IF;
    
    -- Registrar el pago
    INSERT INTO pago (factura_id, fecha, monto, medio, external_ref)
    VALUES (p_factura_id, p_fecha, p_monto, p_medio, p_external_ref)
    RETURNING pago_id INTO v_pago_id;
    
    -- Actualizar estado de la factura si está completamente pagada
    IF (v_total_pagado + p_monto) = v_importe_factura THEN
        UPDATE factura SET estado = 'PAGADA' WHERE factura_id = p_factura_id;
    END IF;
    
    RETURN v_pago_id;
END;
$$;


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;


--
-- Name: validar_reclamo_para_valoracion(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.validar_reclamo_para_valoracion() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_estado VARCHAR(50);
    v_cuenta_id INTEGER;
    v_socio_id_reclamo INTEGER;
BEGIN
    -- Obtener el estado del reclamo y el socio titular de la cuenta
    SELECT r.estado, c.socio_id INTO v_estado, v_socio_id_reclamo
    FROM reclamo r
    JOIN cuenta c ON r.cuenta_id = c.cuenta_id
    WHERE r.reclamo_id = NEW.reclamo_id;
    
    -- Verificar que el reclamo existe
    IF NOT FOUND THEN
        RAISE EXCEPTION 'El reclamo % no existe', NEW.reclamo_id;
    END IF;
    
    -- Verificar que el reclamo está resuelto o cerrado
    IF v_estado NOT IN ('RESUELTO', 'CERRADO') THEN
        RAISE EXCEPTION 'Solo se pueden valorar reclamos en estado RESUELTO o CERRADO. Estado actual: %', v_estado;
    END IF;
    
    -- Verificar que el socio que valora es el titular de la cuenta del reclamo
    IF NEW.socio_id != v_socio_id_reclamo THEN
        RAISE EXCEPTION 'Solo el socio titular de la cuenta puede valorar el reclamo';
    END IF;
    
    RETURN NEW;
END;
$$;


--
-- Name: FUNCTION validar_reclamo_para_valoracion(); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.validar_reclamo_para_valoracion() IS 'Trigger function que valida que: 1) El reclamo esté en estado RESUELTO o CERRADO, 2) El socio que valora sea el titular de la cuenta del reclamo';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: cuadrilla; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cuadrilla (
    cuadrilla_id integer NOT NULL,
    nombre character varying(100) NOT NULL,
    zona character varying(100),
    activa boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: cuadrilla_cuadrilla_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.cuadrilla_cuadrilla_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: cuadrilla_cuadrilla_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.cuadrilla_cuadrilla_id_seq OWNED BY public.cuadrilla.cuadrilla_id;


--
-- Name: cuenta; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cuenta (
    cuenta_id integer NOT NULL,
    socio_id integer NOT NULL,
    numero_cuenta character varying(50) NOT NULL,
    direccion text NOT NULL,
    localidad character varying(100) NOT NULL,
    servicio_id integer NOT NULL,
    principal boolean DEFAULT false,
    activa boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: TABLE cuenta; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.cuenta IS 'Cuentas de servicios asociadas a socios';


--
-- Name: cuenta_cuenta_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.cuenta_cuenta_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: cuenta_cuenta_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.cuenta_cuenta_id_seq OWNED BY public.cuenta.cuenta_id;


--
-- Name: detalle_tipo_reclamo; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.detalle_tipo_reclamo (
    detalle_id integer NOT NULL,
    nombre character varying(100) NOT NULL,
    tipo_id integer NOT NULL,
    activo boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: detalle_tipo_reclamo_detalle_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.detalle_tipo_reclamo_detalle_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: detalle_tipo_reclamo_detalle_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.detalle_tipo_reclamo_detalle_id_seq OWNED BY public.detalle_tipo_reclamo.detalle_id;


--
-- Name: empleado; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.empleado (
    empleado_id integer NOT NULL,
    nombre character varying(100) NOT NULL,
    apellido character varying(100) NOT NULL,
    legajo character varying(20) NOT NULL,
    rol_interno character varying(100),
    activo boolean DEFAULT true,
    fecha_ingreso date DEFAULT CURRENT_DATE,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: empleado_cuadrilla; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.empleado_cuadrilla (
    empleado_id integer NOT NULL,
    cuadrilla_id integer NOT NULL,
    fecha_asignacion date DEFAULT CURRENT_DATE NOT NULL,
    fecha_desasignacion date,
    activa boolean DEFAULT true
);


--
-- Name: empleado_empleado_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.empleado_empleado_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: empleado_empleado_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.empleado_empleado_id_seq OWNED BY public.empleado.empleado_id;


--
-- Name: factura; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.factura (
    factura_id integer NOT NULL,
    cuenta_id integer NOT NULL,
    periodo date NOT NULL,
    importe numeric(10,2) NOT NULL,
    vencimiento date NOT NULL,
    estado character varying(50) DEFAULT 'PENDIENTE'::character varying,
    numero_externo character varying(50),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: TABLE factura; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.factura IS 'Facturas emitidas a las cuentas';


--
-- Name: factura_factura_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.factura_factura_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: factura_factura_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.factura_factura_id_seq OWNED BY public.factura.factura_id;


--
-- Name: itinerario; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.itinerario (
    itinerario_id integer NOT NULL,
    cuadrilla_id integer NOT NULL,
    fecha date NOT NULL,
    observaciones text,
    estado character varying(50) DEFAULT 'PLANIFICADO'::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: itinerario_det; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.itinerario_det (
    itdet_id integer NOT NULL,
    itinerario_id integer NOT NULL,
    ot_id integer NOT NULL,
    orden integer NOT NULL,
    hora_estimada time without time zone,
    completada boolean DEFAULT false,
    observaciones text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: itinerario_det_itdet_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.itinerario_det_itdet_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: itinerario_det_itdet_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.itinerario_det_itdet_id_seq OWNED BY public.itinerario_det.itdet_id;


--
-- Name: itinerario_itinerario_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.itinerario_itinerario_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: itinerario_itinerario_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.itinerario_itinerario_id_seq OWNED BY public.itinerario.itinerario_id;


--
-- Name: lectura; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.lectura (
    lectura_id integer NOT NULL,
    medidor_id integer NOT NULL,
    fecha date NOT NULL,
    estado_anterior integer DEFAULT 0 NOT NULL,
    estado_actual integer NOT NULL,
    consumo integer GENERATED ALWAYS AS ((estado_actual - estado_anterior)) STORED,
    ruta character varying(100),
    observaciones text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: TABLE lectura; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.lectura IS 'Lecturas periódicas de los medidores';


--
-- Name: lectura_lectura_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.lectura_lectura_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: lectura_lectura_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.lectura_lectura_id_seq OWNED BY public.lectura.lectura_id;


--
-- Name: material; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.material (
    material_id integer NOT NULL,
    codigo character varying(50) NOT NULL,
    descripcion text NOT NULL,
    unidad character varying(20) NOT NULL,
    stock_actual integer DEFAULT 0,
    stock_minimo integer DEFAULT 0,
    costo_unitario numeric(10,2) DEFAULT 0.00,
    activo boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: TABLE material; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.material IS 'Inventario de materiales';


--
-- Name: material_material_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.material_material_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: material_material_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.material_material_id_seq OWNED BY public.material.material_id;


--
-- Name: medidor; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.medidor (
    medidor_id integer NOT NULL,
    cuenta_id integer NOT NULL,
    numero_medidor character varying(50) NOT NULL,
    lat numeric(10,8),
    lng numeric(11,8),
    fecha_instalacion date,
    activo boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: TABLE medidor; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.medidor IS 'Medidores instalados en las cuentas';


--
-- Name: medidor_medidor_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.medidor_medidor_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: medidor_medidor_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.medidor_medidor_id_seq OWNED BY public.medidor.medidor_id;


--
-- Name: mov_stock; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.mov_stock (
    mov_id integer NOT NULL,
    material_id integer NOT NULL,
    fecha timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    tipo character varying(20) NOT NULL,
    cantidad integer NOT NULL,
    referencia character varying(100),
    observaciones text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: TABLE mov_stock; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.mov_stock IS 'Movimientos de stock de materiales';


--
-- Name: mov_stock_mov_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.mov_stock_mov_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: mov_stock_mov_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.mov_stock_mov_id_seq OWNED BY public.mov_stock.mov_id;


--
-- Name: orden_trabajo; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.orden_trabajo (
    ot_id integer NOT NULL,
    reclamo_id integer NOT NULL,
    empleado_id integer,
    fecha_programada timestamp without time zone,
    fecha_cierre timestamp without time zone,
    observaciones text,
    estado character varying(50) DEFAULT 'PENDIENTE'::character varying,
    direccion_intervencion text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: TABLE orden_trabajo; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.orden_trabajo IS 'Órdenes de trabajo generadas por reclamos';


--
-- Name: orden_trabajo_ot_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.orden_trabajo_ot_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: orden_trabajo_ot_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.orden_trabajo_ot_id_seq OWNED BY public.orden_trabajo.ot_id;


--
-- Name: pago; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.pago (
    pago_id integer NOT NULL,
    factura_id integer NOT NULL,
    fecha timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    monto numeric(10,2) NOT NULL,
    medio character varying(50) NOT NULL,
    external_ref character varying(100),
    estado character varying(50) DEFAULT 'CONFIRMADO'::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: TABLE pago; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.pago IS 'Pagos recibidos de las facturas';


--
-- Name: pago_pago_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.pago_pago_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: pago_pago_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.pago_pago_id_seq OWNED BY public.pago.pago_id;


--
-- Name: prioridad; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.prioridad (
    prioridad_id integer NOT NULL,
    nombre character varying(50) NOT NULL,
    orden integer NOT NULL,
    color character varying(7),
    activo boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: prioridad_prioridad_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.prioridad_prioridad_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: prioridad_prioridad_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.prioridad_prioridad_id_seq OWNED BY public.prioridad.prioridad_id;


--
-- Name: reclamo; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.reclamo (
    reclamo_id integer NOT NULL,
    cuenta_id integer NOT NULL,
    detalle_id integer NOT NULL,
    prioridad_id integer NOT NULL,
    fecha_alta timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    canal character varying(50) DEFAULT 'WEB'::character varying,
    estado character varying(50) DEFAULT 'PENDIENTE'::character varying,
    descripcion text NOT NULL,
    adjunto_url text,
    fecha_cierre timestamp without time zone,
    observaciones_cierre text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: TABLE reclamo; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.reclamo IS 'Reclamos realizados por los socios';


--
-- Name: reclamo_reclamo_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.reclamo_reclamo_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: reclamo_reclamo_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.reclamo_reclamo_id_seq OWNED BY public.reclamo.reclamo_id;


--
-- Name: rol; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.rol (
    rol_id integer NOT NULL,
    nombre character varying(50) NOT NULL,
    descripcion text,
    activo boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: rol_rol_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.rol_rol_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: rol_rol_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.rol_rol_id_seq OWNED BY public.rol.rol_id;


--
-- Name: servicio; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.servicio (
    servicio_id integer NOT NULL,
    nombre character varying(100) NOT NULL,
    categoria character varying(50) NOT NULL,
    descripcion text,
    activo boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: servicio_servicio_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.servicio_servicio_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: servicio_servicio_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.servicio_servicio_id_seq OWNED BY public.servicio.servicio_id;


--
-- Name: socio; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.socio (
    socio_id integer NOT NULL,
    nombre character varying(100) NOT NULL,
    apellido character varying(100) NOT NULL,
    dni character varying(20) NOT NULL,
    email character varying(150),
    telefono character varying(20),
    activo boolean DEFAULT true,
    fecha_alta date DEFAULT CURRENT_DATE,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: TABLE socio; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.socio IS 'Tabla de socios/clientes del sistema';


--
-- Name: socio_socio_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.socio_socio_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: socio_socio_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.socio_socio_id_seq OWNED BY public.socio.socio_id;


--
-- Name: tipo_reclamo; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tipo_reclamo (
    tipo_id integer NOT NULL,
    nombre character varying(50) NOT NULL,
    descripcion text,
    activo boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: tipo_reclamo_tipo_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.tipo_reclamo_tipo_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: tipo_reclamo_tipo_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.tipo_reclamo_tipo_id_seq OWNED BY public.tipo_reclamo.tipo_id;


--
-- Name: uso_material; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.uso_material (
    uso_id integer NOT NULL,
    ot_id integer NOT NULL,
    material_id integer NOT NULL,
    cantidad integer NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uso_material_cantidad_check CHECK ((cantidad > 0))
);


--
-- Name: uso_material_uso_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.uso_material_uso_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: uso_material_uso_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.uso_material_uso_id_seq OWNED BY public.uso_material.uso_id;


--
-- Name: usuario; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.usuario (
    usuario_id integer NOT NULL,
    socio_id integer,
    empleado_id integer,
    email character varying(150) NOT NULL,
    hash_pass character varying(255) NOT NULL,
    activo boolean DEFAULT true,
    ultimo_login timestamp without time zone,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_usuario_xor CHECK ((((socio_id IS NOT NULL) AND (empleado_id IS NULL)) OR ((socio_id IS NULL) AND (empleado_id IS NOT NULL))))
);


--
-- Name: TABLE usuario; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.usuario IS 'Usuarios del sistema (socios y empleados)';


--
-- Name: usuario_rol; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.usuario_rol (
    usuario_id integer NOT NULL,
    rol_id integer NOT NULL,
    asignado_en timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: usuario_usuario_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.usuario_usuario_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: usuario_usuario_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.usuario_usuario_id_seq OWNED BY public.usuario.usuario_id;


--
-- Name: v_cuentas_completas; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.v_cuentas_completas AS
 SELECT c.cuenta_id,
    c.numero_cuenta,
    c.direccion,
    c.localidad,
    c.principal,
    (((s.nombre)::text || ' '::text) || (s.apellido)::text) AS titular,
    s.dni,
    s.email,
    s.telefono,
    srv.nombre AS servicio,
    c.activa
   FROM ((public.cuenta c
     JOIN public.socio s ON ((c.socio_id = s.socio_id)))
     JOIN public.servicio srv ON ((c.servicio_id = srv.servicio_id)));


--
-- Name: valoracion; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.valoracion (
    valoracion_id integer NOT NULL,
    reclamo_id integer NOT NULL,
    socio_id integer NOT NULL,
    calificacion integer NOT NULL,
    comentario text,
    fecha_valoracion timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT valoracion_calificacion_check CHECK (((calificacion >= 1) AND (calificacion <= 5)))
);


--
-- Name: TABLE valoracion; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.valoracion IS 'Tabla de valoraciones de reclamos resueltos. Permite a los socios calificar la atención recibida con calificación de 1-5 estrellas y comentario opcional. Un socio puede valorar cada reclamo una sola vez.';


--
-- Name: COLUMN valoracion.valoracion_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.valoracion.valoracion_id IS 'Identificador único de la valoración (clave primaria)';


--
-- Name: COLUMN valoracion.reclamo_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.valoracion.reclamo_id IS 'Referencia al reclamo valorado. Solo reclamos en estado RESUELTO o CERRADO deberían ser valorados.';


--
-- Name: COLUMN valoracion.socio_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.valoracion.socio_id IS 'Referencia al socio que realiza la valoración. Debe corresponder al titular de la cuenta del reclamo.';


--
-- Name: COLUMN valoracion.calificacion; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.valoracion.calificacion IS 'Calificación numérica de 1 a 5 estrellas (1=Muy malo, 2=Malo, 3=Regular, 4=Bueno, 5=Excelente)';


--
-- Name: COLUMN valoracion.comentario; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.valoracion.comentario IS 'Comentario opcional del socio sobre la atención recibida. Puede contener sugerencias, agradecimientos o quejas.';


--
-- Name: COLUMN valoracion.fecha_valoracion; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.valoracion.fecha_valoracion IS 'Fecha y hora en que se realizó la valoración';


--
-- Name: COLUMN valoracion.created_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.valoracion.created_at IS 'Fecha y hora de creación del registro (auditoría)';


--
-- Name: v_estadisticas_valoraciones; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.v_estadisticas_valoraciones AS
 SELECT count(*) AS total_valoraciones,
    (avg(valoracion.calificacion))::numeric(3,2) AS promedio_general,
    count(
        CASE
            WHEN (valoracion.calificacion = 5) THEN 1
            ELSE NULL::integer
        END) AS cinco_estrellas,
    count(
        CASE
            WHEN (valoracion.calificacion = 4) THEN 1
            ELSE NULL::integer
        END) AS cuatro_estrellas,
    count(
        CASE
            WHEN (valoracion.calificacion = 3) THEN 1
            ELSE NULL::integer
        END) AS tres_estrellas,
    count(
        CASE
            WHEN (valoracion.calificacion = 2) THEN 1
            ELSE NULL::integer
        END) AS dos_estrellas,
    count(
        CASE
            WHEN (valoracion.calificacion = 1) THEN 1
            ELSE NULL::integer
        END) AS una_estrella,
    count(
        CASE
            WHEN ((valoracion.comentario IS NOT NULL) AND (valoracion.comentario <> ''::text)) THEN 1
            ELSE NULL::integer
        END) AS con_comentario,
    count(
        CASE
            WHEN ((valoracion.comentario IS NULL) OR (valoracion.comentario = ''::text)) THEN 1
            ELSE NULL::integer
        END) AS sin_comentario,
    min(valoracion.fecha_valoracion) AS primera_valoracion,
    max(valoracion.fecha_valoracion) AS ultima_valoracion
   FROM public.valoracion;


--
-- Name: VIEW v_estadisticas_valoraciones; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON VIEW public.v_estadisticas_valoraciones IS 'Vista con estadísticas generales del sistema de valoraciones';


--
-- Name: v_ordenes_trabajo_completas; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.v_ordenes_trabajo_completas AS
 SELECT ot.ot_id,
    ot.fecha_programada,
    ot.estado,
    (((e.nombre)::text || ' '::text) || (e.apellido)::text) AS tecnico_asignado,
    r.reclamo_id,
    d.nombre AS detalle_reclamo,
    t.nombre AS tipo_reclamo,
    c.numero_cuenta,
    (((s.nombre)::text || ' '::text) || (s.apellido)::text) AS solicitante,
    ot.direccion_intervencion
   FROM ((((((public.orden_trabajo ot
     JOIN public.reclamo r ON ((ot.reclamo_id = r.reclamo_id)))
     JOIN public.cuenta c ON ((r.cuenta_id = c.cuenta_id)))
     JOIN public.socio s ON ((c.socio_id = s.socio_id)))
     JOIN public.detalle_tipo_reclamo d ON ((r.detalle_id = d.detalle_id)))
     JOIN public.tipo_reclamo t ON ((d.tipo_id = t.tipo_id)))
     LEFT JOIN public.empleado e ON ((ot.empleado_id = e.empleado_id)));


--
-- Name: v_reclamos_completos; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.v_reclamos_completos AS
 SELECT r.reclamo_id,
    r.fecha_alta,
    c.numero_cuenta,
    (((s.nombre)::text || ' '::text) || (s.apellido)::text) AS solicitante,
    d.nombre AS detalle_reclamo,
    t.nombre AS tipo_reclamo,
    p.nombre AS prioridad,
    r.estado,
    r.descripcion,
    r.canal
   FROM (((((public.reclamo r
     JOIN public.cuenta c ON ((r.cuenta_id = c.cuenta_id)))
     JOIN public.socio s ON ((c.socio_id = s.socio_id)))
     JOIN public.detalle_tipo_reclamo d ON ((r.detalle_id = d.detalle_id)))
     JOIN public.tipo_reclamo t ON ((d.tipo_id = t.tipo_id)))
     JOIN public.prioridad p ON ((r.prioridad_id = p.prioridad_id)));


--
-- Name: v_stock_materiales; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.v_stock_materiales AS
 SELECT m.material_id,
    m.codigo,
    m.descripcion,
    m.unidad,
    m.stock_actual,
    m.stock_minimo,
        CASE
            WHEN (m.stock_actual <= m.stock_minimo) THEN 'CRÍTICO'::text
            WHEN ((m.stock_actual)::numeric <= ((m.stock_minimo)::numeric * 1.5)) THEN 'BAJO'::text
            ELSE 'NORMAL'::text
        END AS estado_stock,
    m.costo_unitario
   FROM public.material m
  WHERE (m.activo = true);


--
-- Name: v_usuarios_completos; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.v_usuarios_completos AS
 SELECT u.usuario_id,
    u.email,
    u.activo,
    COALESCE(s.nombre, e.nombre) AS nombre,
    COALESCE(s.apellido, e.apellido) AS apellido,
    s.dni AS socio_dni,
    e.legajo AS empleado_legajo,
    e.rol_interno AS empleado_rol,
    array_agg(r.nombre) AS roles,
    u.created_at
   FROM ((((public.usuario u
     LEFT JOIN public.socio s ON ((u.socio_id = s.socio_id)))
     LEFT JOIN public.empleado e ON ((u.empleado_id = e.empleado_id)))
     LEFT JOIN public.usuario_rol ur ON ((u.usuario_id = ur.usuario_id)))
     LEFT JOIN public.rol r ON ((ur.rol_id = r.rol_id)))
  GROUP BY u.usuario_id, u.email, u.activo, s.nombre, s.apellido, e.nombre, e.apellido, s.dni, e.legajo, e.rol_interno, u.created_at;


--
-- Name: v_valoraciones_detalle; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.v_valoraciones_detalle AS
 SELECT v.valoracion_id,
    v.reclamo_id,
    r.descripcion AS reclamo_descripcion,
    r.estado AS reclamo_estado,
    r.fecha_alta AS reclamo_fecha_alta,
    r.fecha_cierre AS reclamo_fecha_cierre,
    dtr.nombre AS tipo_reclamo,
    v.socio_id,
    (((s.nombre)::text || ' '::text) || (s.apellido)::text) AS socio_nombre_completo,
    s.email AS socio_email,
    c.numero_cuenta,
    c.direccion,
    v.calificacion,
    v.comentario,
    v.fecha_valoracion,
    EXTRACT(day FROM (v.fecha_valoracion - r.fecha_cierre)) AS dias_hasta_valoracion
   FROM ((((public.valoracion v
     JOIN public.reclamo r ON ((v.reclamo_id = r.reclamo_id)))
     JOIN public.socio s ON ((v.socio_id = s.socio_id)))
     JOIN public.cuenta c ON ((r.cuenta_id = c.cuenta_id)))
     JOIN public.detalle_tipo_reclamo dtr ON ((r.detalle_id = dtr.detalle_id)))
  ORDER BY v.fecha_valoracion DESC;


--
-- Name: VIEW v_valoraciones_detalle; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON VIEW public.v_valoraciones_detalle IS 'Vista completa de valoraciones con información contextual del reclamo, socio y cuenta';


--
-- Name: v_valoraciones_por_empleado; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.v_valoraciones_por_empleado AS
 SELECT e.empleado_id,
    (((e.nombre)::text || ' '::text) || (e.apellido)::text) AS empleado_nombre_completo,
    e.rol_interno,
    count(DISTINCT v.valoracion_id) AS total_valoraciones,
    (avg(v.calificacion))::numeric(3,2) AS promedio_calificacion,
    count(
        CASE
            WHEN (v.calificacion = 5) THEN 1
            ELSE NULL::integer
        END) AS cinco_estrellas,
    count(
        CASE
            WHEN (v.calificacion >= 4) THEN 1
            ELSE NULL::integer
        END) AS satisfactorias,
    count(
        CASE
            WHEN (v.calificacion <= 2) THEN 1
            ELSE NULL::integer
        END) AS insatisfactorias,
    count(DISTINCT ot.reclamo_id) AS total_reclamos_atendidos,
    count(DISTINCT v.reclamo_id) AS reclamos_valorados
   FROM (((public.empleado e
     JOIN public.orden_trabajo ot ON ((e.empleado_id = ot.empleado_id)))
     JOIN public.reclamo r ON ((ot.reclamo_id = r.reclamo_id)))
     LEFT JOIN public.valoracion v ON ((r.reclamo_id = v.reclamo_id)))
  WHERE ((ot.estado)::text = 'COMPLETADA'::text)
  GROUP BY e.empleado_id, e.nombre, e.apellido, e.rol_interno
 HAVING (count(v.valoracion_id) > 0)
  ORDER BY ((avg(v.calificacion))::numeric(3,2)) DESC, (count(DISTINCT v.valoracion_id)) DESC;


--
-- Name: VIEW v_valoraciones_por_empleado; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON VIEW public.v_valoraciones_por_empleado IS 'Vista de empleados con estadísticas de valoraciones basadas en los reclamos que atendieron';


--
-- Name: v_valoraciones_por_tipo_reclamo; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.v_valoraciones_por_tipo_reclamo AS
 SELECT dtr.detalle_id,
    dtr.nombre AS tipo_reclamo,
    tr.nombre AS categoria,
    count(v.valoracion_id) AS total_valoraciones,
    (avg(v.calificacion))::numeric(3,2) AS promedio_calificacion,
    count(
        CASE
            WHEN (v.calificacion >= 4) THEN 1
            ELSE NULL::integer
        END) AS satisfactorias,
    count(
        CASE
            WHEN (v.calificacion <= 2) THEN 1
            ELSE NULL::integer
        END) AS insatisfactorias
   FROM (((public.detalle_tipo_reclamo dtr
     LEFT JOIN public.reclamo r ON ((dtr.detalle_id = r.detalle_id)))
     LEFT JOIN public.valoracion v ON ((r.reclamo_id = v.reclamo_id)))
     LEFT JOIN public.tipo_reclamo tr ON ((dtr.tipo_id = tr.tipo_id)))
  GROUP BY dtr.detalle_id, dtr.nombre, tr.nombre
 HAVING (count(v.valoracion_id) > 0)
  ORDER BY ((avg(v.calificacion))::numeric(3,2)) DESC, (count(v.valoracion_id)) DESC;


--
-- Name: VIEW v_valoraciones_por_tipo_reclamo; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON VIEW public.v_valoraciones_por_tipo_reclamo IS 'Vista de estadísticas de valoraciones agrupadas por tipo de reclamo';


--
-- Name: valoracion_valoracion_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.valoracion_valoracion_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: valoracion_valoracion_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.valoracion_valoracion_id_seq OWNED BY public.valoracion.valoracion_id;


--
-- Name: cuadrilla cuadrilla_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cuadrilla ALTER COLUMN cuadrilla_id SET DEFAULT nextval('public.cuadrilla_cuadrilla_id_seq'::regclass);


--
-- Name: cuenta cuenta_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cuenta ALTER COLUMN cuenta_id SET DEFAULT nextval('public.cuenta_cuenta_id_seq'::regclass);


--
-- Name: detalle_tipo_reclamo detalle_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.detalle_tipo_reclamo ALTER COLUMN detalle_id SET DEFAULT nextval('public.detalle_tipo_reclamo_detalle_id_seq'::regclass);


--
-- Name: empleado empleado_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.empleado ALTER COLUMN empleado_id SET DEFAULT nextval('public.empleado_empleado_id_seq'::regclass);


--
-- Name: factura factura_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.factura ALTER COLUMN factura_id SET DEFAULT nextval('public.factura_factura_id_seq'::regclass);


--
-- Name: itinerario itinerario_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.itinerario ALTER COLUMN itinerario_id SET DEFAULT nextval('public.itinerario_itinerario_id_seq'::regclass);


--
-- Name: itinerario_det itdet_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.itinerario_det ALTER COLUMN itdet_id SET DEFAULT nextval('public.itinerario_det_itdet_id_seq'::regclass);


--
-- Name: lectura lectura_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lectura ALTER COLUMN lectura_id SET DEFAULT nextval('public.lectura_lectura_id_seq'::regclass);


--
-- Name: material material_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.material ALTER COLUMN material_id SET DEFAULT nextval('public.material_material_id_seq'::regclass);


--
-- Name: medidor medidor_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.medidor ALTER COLUMN medidor_id SET DEFAULT nextval('public.medidor_medidor_id_seq'::regclass);


--
-- Name: mov_stock mov_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mov_stock ALTER COLUMN mov_id SET DEFAULT nextval('public.mov_stock_mov_id_seq'::regclass);


--
-- Name: orden_trabajo ot_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orden_trabajo ALTER COLUMN ot_id SET DEFAULT nextval('public.orden_trabajo_ot_id_seq'::regclass);


--
-- Name: pago pago_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pago ALTER COLUMN pago_id SET DEFAULT nextval('public.pago_pago_id_seq'::regclass);


--
-- Name: prioridad prioridad_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.prioridad ALTER COLUMN prioridad_id SET DEFAULT nextval('public.prioridad_prioridad_id_seq'::regclass);


--
-- Name: reclamo reclamo_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reclamo ALTER COLUMN reclamo_id SET DEFAULT nextval('public.reclamo_reclamo_id_seq'::regclass);


--
-- Name: rol rol_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rol ALTER COLUMN rol_id SET DEFAULT nextval('public.rol_rol_id_seq'::regclass);


--
-- Name: servicio servicio_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.servicio ALTER COLUMN servicio_id SET DEFAULT nextval('public.servicio_servicio_id_seq'::regclass);


--
-- Name: socio socio_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.socio ALTER COLUMN socio_id SET DEFAULT nextval('public.socio_socio_id_seq'::regclass);


--
-- Name: tipo_reclamo tipo_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tipo_reclamo ALTER COLUMN tipo_id SET DEFAULT nextval('public.tipo_reclamo_tipo_id_seq'::regclass);


--
-- Name: uso_material uso_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.uso_material ALTER COLUMN uso_id SET DEFAULT nextval('public.uso_material_uso_id_seq'::regclass);


--
-- Name: usuario usuario_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuario ALTER COLUMN usuario_id SET DEFAULT nextval('public.usuario_usuario_id_seq'::regclass);


--
-- Name: valoracion valoracion_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.valoracion ALTER COLUMN valoracion_id SET DEFAULT nextval('public.valoracion_valoracion_id_seq'::regclass);


--
-- Name: cuadrilla cuadrilla_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cuadrilla
    ADD CONSTRAINT cuadrilla_pkey PRIMARY KEY (cuadrilla_id);


--
-- Name: cuenta cuenta_numero_cuenta_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cuenta
    ADD CONSTRAINT cuenta_numero_cuenta_key UNIQUE (numero_cuenta);


--
-- Name: cuenta cuenta_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cuenta
    ADD CONSTRAINT cuenta_pkey PRIMARY KEY (cuenta_id);


--
-- Name: detalle_tipo_reclamo detalle_tipo_reclamo_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.detalle_tipo_reclamo
    ADD CONSTRAINT detalle_tipo_reclamo_pkey PRIMARY KEY (detalle_id);


--
-- Name: empleado_cuadrilla empleado_cuadrilla_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.empleado_cuadrilla
    ADD CONSTRAINT empleado_cuadrilla_pkey PRIMARY KEY (empleado_id, cuadrilla_id, fecha_asignacion);


--
-- Name: empleado empleado_legajo_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.empleado
    ADD CONSTRAINT empleado_legajo_key UNIQUE (legajo);


--
-- Name: empleado empleado_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.empleado
    ADD CONSTRAINT empleado_pkey PRIMARY KEY (empleado_id);


--
-- Name: factura factura_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.factura
    ADD CONSTRAINT factura_pkey PRIMARY KEY (factura_id);


--
-- Name: itinerario_det itinerario_det_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.itinerario_det
    ADD CONSTRAINT itinerario_det_pkey PRIMARY KEY (itdet_id);


--
-- Name: itinerario itinerario_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.itinerario
    ADD CONSTRAINT itinerario_pkey PRIMARY KEY (itinerario_id);


--
-- Name: lectura lectura_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lectura
    ADD CONSTRAINT lectura_pkey PRIMARY KEY (lectura_id);


--
-- Name: material material_codigo_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.material
    ADD CONSTRAINT material_codigo_key UNIQUE (codigo);


--
-- Name: material material_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.material
    ADD CONSTRAINT material_pkey PRIMARY KEY (material_id);


--
-- Name: medidor medidor_numero_medidor_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.medidor
    ADD CONSTRAINT medidor_numero_medidor_key UNIQUE (numero_medidor);


--
-- Name: medidor medidor_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.medidor
    ADD CONSTRAINT medidor_pkey PRIMARY KEY (medidor_id);


--
-- Name: mov_stock mov_stock_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mov_stock
    ADD CONSTRAINT mov_stock_pkey PRIMARY KEY (mov_id);


--
-- Name: orden_trabajo orden_trabajo_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orden_trabajo
    ADD CONSTRAINT orden_trabajo_pkey PRIMARY KEY (ot_id);


--
-- Name: pago pago_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pago
    ADD CONSTRAINT pago_pkey PRIMARY KEY (pago_id);


--
-- Name: prioridad prioridad_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.prioridad
    ADD CONSTRAINT prioridad_pkey PRIMARY KEY (prioridad_id);


--
-- Name: reclamo reclamo_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reclamo
    ADD CONSTRAINT reclamo_pkey PRIMARY KEY (reclamo_id);


--
-- Name: rol rol_nombre_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rol
    ADD CONSTRAINT rol_nombre_key UNIQUE (nombre);


--
-- Name: rol rol_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rol
    ADD CONSTRAINT rol_pkey PRIMARY KEY (rol_id);


--
-- Name: servicio servicio_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.servicio
    ADD CONSTRAINT servicio_pkey PRIMARY KEY (servicio_id);


--
-- Name: socio socio_dni_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.socio
    ADD CONSTRAINT socio_dni_key UNIQUE (dni);


--
-- Name: socio socio_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.socio
    ADD CONSTRAINT socio_email_key UNIQUE (email);


--
-- Name: socio socio_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.socio
    ADD CONSTRAINT socio_pkey PRIMARY KEY (socio_id);


--
-- Name: tipo_reclamo tipo_reclamo_nombre_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tipo_reclamo
    ADD CONSTRAINT tipo_reclamo_nombre_key UNIQUE (nombre);


--
-- Name: tipo_reclamo tipo_reclamo_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tipo_reclamo
    ADD CONSTRAINT tipo_reclamo_pkey PRIMARY KEY (tipo_id);


--
-- Name: valoracion uq_valoracion_reclamo_socio; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.valoracion
    ADD CONSTRAINT uq_valoracion_reclamo_socio UNIQUE (reclamo_id, socio_id);


--
-- Name: CONSTRAINT uq_valoracion_reclamo_socio ON valoracion; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON CONSTRAINT uq_valoracion_reclamo_socio ON public.valoracion IS 'Garantiza que un socio solo pueda valorar un mismo reclamo una vez';


--
-- Name: uso_material uso_material_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.uso_material
    ADD CONSTRAINT uso_material_pkey PRIMARY KEY (uso_id);


--
-- Name: usuario usuario_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuario
    ADD CONSTRAINT usuario_email_key UNIQUE (email);


--
-- Name: usuario usuario_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuario
    ADD CONSTRAINT usuario_pkey PRIMARY KEY (usuario_id);


--
-- Name: usuario_rol usuario_rol_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuario_rol
    ADD CONSTRAINT usuario_rol_pkey PRIMARY KEY (usuario_id, rol_id);


--
-- Name: valoracion valoracion_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.valoracion
    ADD CONSTRAINT valoracion_pkey PRIMARY KEY (valoracion_id);


--
-- Name: idx_cuenta_numero; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cuenta_numero ON public.cuenta USING btree (numero_cuenta);


--
-- Name: idx_cuenta_servicio_activa; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cuenta_servicio_activa ON public.cuenta USING btree (servicio_id, activa);


--
-- Name: idx_cuenta_socio; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cuenta_socio ON public.cuenta USING btree (socio_id);


--
-- Name: idx_factura_cuenta_estado; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_factura_cuenta_estado ON public.factura USING btree (cuenta_id, estado);


--
-- Name: idx_factura_estado; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_factura_estado ON public.factura USING btree (estado);


--
-- Name: idx_factura_periodo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_factura_periodo ON public.factura USING btree (periodo);


--
-- Name: idx_lectura_fecha; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_lectura_fecha ON public.lectura USING btree (fecha);


--
-- Name: idx_lectura_medidor; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_lectura_medidor ON public.lectura USING btree (medidor_id);


--
-- Name: idx_material_codigo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_material_codigo ON public.material USING btree (codigo);


--
-- Name: idx_medidor_numero; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_medidor_numero ON public.medidor USING btree (numero_medidor);


--
-- Name: idx_ot_estado; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ot_estado ON public.orden_trabajo USING btree (estado);


--
-- Name: idx_ot_fecha_programada; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ot_fecha_programada ON public.orden_trabajo USING btree (fecha_programada);


--
-- Name: idx_pago_fecha; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pago_fecha ON public.pago USING btree (fecha);


--
-- Name: idx_reclamo_cuenta_estado; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_reclamo_cuenta_estado ON public.reclamo USING btree (cuenta_id, estado);


--
-- Name: idx_reclamo_estado; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_reclamo_estado ON public.reclamo USING btree (estado);


--
-- Name: idx_reclamo_fecha; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_reclamo_fecha ON public.reclamo USING btree (fecha_alta);


--
-- Name: idx_socio_dni; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_socio_dni ON public.socio USING btree (dni);


--
-- Name: idx_socio_email; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_socio_email ON public.socio USING btree (email);


--
-- Name: idx_usuario_email; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_usuario_email ON public.usuario USING btree (email);


--
-- Name: idx_valoracion_calificacion; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_valoracion_calificacion ON public.valoracion USING btree (calificacion);


--
-- Name: INDEX idx_valoracion_calificacion; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON INDEX public.idx_valoracion_calificacion IS 'Optimiza consultas estadísticas por calificación (reportes de satisfacción)';


--
-- Name: idx_valoracion_fecha; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_valoracion_fecha ON public.valoracion USING btree (fecha_valoracion DESC);


--
-- Name: INDEX idx_valoracion_fecha; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON INDEX public.idx_valoracion_fecha IS 'Optimiza consultas de valoraciones recientes ordenadas por fecha';


--
-- Name: idx_valoracion_reclamo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_valoracion_reclamo ON public.valoracion USING btree (reclamo_id);


--
-- Name: INDEX idx_valoracion_reclamo; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON INDEX public.idx_valoracion_reclamo IS 'Optimiza consultas de valoraciones por reclamo específico';


--
-- Name: idx_valoracion_reclamo_fecha; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_valoracion_reclamo_fecha ON public.valoracion USING btree (reclamo_id, fecha_valoracion DESC);


--
-- Name: INDEX idx_valoracion_reclamo_fecha; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON INDEX public.idx_valoracion_reclamo_fecha IS 'Optimiza consultas de valoraciones de un reclamo ordenadas cronológicamente';


--
-- Name: idx_valoracion_socio; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_valoracion_socio ON public.valoracion USING btree (socio_id);


--
-- Name: INDEX idx_valoracion_socio; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON INDEX public.idx_valoracion_socio IS 'Optimiza consultas de valoraciones realizadas por un socio';


--
-- Name: mov_stock trg_actualizar_stock; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_actualizar_stock AFTER INSERT ON public.mov_stock FOR EACH ROW EXECUTE FUNCTION public.actualizar_stock_material();


--
-- Name: valoracion trg_validar_valoracion; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_validar_valoracion BEFORE INSERT ON public.valoracion FOR EACH ROW EXECUTE FUNCTION public.validar_reclamo_para_valoracion();


--
-- Name: TRIGGER trg_validar_valoracion ON valoracion; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TRIGGER trg_validar_valoracion ON public.valoracion IS 'Valida que el reclamo esté resuelto/cerrado y que el socio sea el titular antes de permitir la valoración';


--
-- Name: cuadrilla update_cuadrilla_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_cuadrilla_updated_at BEFORE UPDATE ON public.cuadrilla FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: cuenta update_cuenta_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_cuenta_updated_at BEFORE UPDATE ON public.cuenta FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: empleado update_empleado_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_empleado_updated_at BEFORE UPDATE ON public.empleado FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: factura update_factura_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_factura_updated_at BEFORE UPDATE ON public.factura FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: itinerario update_itinerario_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_itinerario_updated_at BEFORE UPDATE ON public.itinerario FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: material update_material_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_material_updated_at BEFORE UPDATE ON public.material FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: medidor update_medidor_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_medidor_updated_at BEFORE UPDATE ON public.medidor FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: orden_trabajo update_orden_trabajo_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_orden_trabajo_updated_at BEFORE UPDATE ON public.orden_trabajo FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: reclamo update_reclamo_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_reclamo_updated_at BEFORE UPDATE ON public.reclamo FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: socio update_socio_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_socio_updated_at BEFORE UPDATE ON public.socio FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: usuario update_usuario_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_usuario_updated_at BEFORE UPDATE ON public.usuario FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: cuenta cuenta_servicio_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cuenta
    ADD CONSTRAINT cuenta_servicio_id_fkey FOREIGN KEY (servicio_id) REFERENCES public.servicio(servicio_id);


--
-- Name: cuenta cuenta_socio_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cuenta
    ADD CONSTRAINT cuenta_socio_id_fkey FOREIGN KEY (socio_id) REFERENCES public.socio(socio_id) ON DELETE CASCADE;


--
-- Name: detalle_tipo_reclamo detalle_tipo_reclamo_tipo_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.detalle_tipo_reclamo
    ADD CONSTRAINT detalle_tipo_reclamo_tipo_id_fkey FOREIGN KEY (tipo_id) REFERENCES public.tipo_reclamo(tipo_id);


--
-- Name: empleado_cuadrilla empleado_cuadrilla_cuadrilla_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.empleado_cuadrilla
    ADD CONSTRAINT empleado_cuadrilla_cuadrilla_id_fkey FOREIGN KEY (cuadrilla_id) REFERENCES public.cuadrilla(cuadrilla_id) ON DELETE CASCADE;


--
-- Name: empleado_cuadrilla empleado_cuadrilla_empleado_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.empleado_cuadrilla
    ADD CONSTRAINT empleado_cuadrilla_empleado_id_fkey FOREIGN KEY (empleado_id) REFERENCES public.empleado(empleado_id) ON DELETE CASCADE;


--
-- Name: factura factura_cuenta_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.factura
    ADD CONSTRAINT factura_cuenta_id_fkey FOREIGN KEY (cuenta_id) REFERENCES public.cuenta(cuenta_id);


--
-- Name: itinerario itinerario_cuadrilla_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.itinerario
    ADD CONSTRAINT itinerario_cuadrilla_id_fkey FOREIGN KEY (cuadrilla_id) REFERENCES public.cuadrilla(cuadrilla_id);


--
-- Name: itinerario_det itinerario_det_itinerario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.itinerario_det
    ADD CONSTRAINT itinerario_det_itinerario_id_fkey FOREIGN KEY (itinerario_id) REFERENCES public.itinerario(itinerario_id) ON DELETE CASCADE;


--
-- Name: itinerario_det itinerario_det_ot_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.itinerario_det
    ADD CONSTRAINT itinerario_det_ot_id_fkey FOREIGN KEY (ot_id) REFERENCES public.orden_trabajo(ot_id);


--
-- Name: lectura lectura_medidor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lectura
    ADD CONSTRAINT lectura_medidor_id_fkey FOREIGN KEY (medidor_id) REFERENCES public.medidor(medidor_id) ON DELETE CASCADE;


--
-- Name: medidor medidor_cuenta_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.medidor
    ADD CONSTRAINT medidor_cuenta_id_fkey FOREIGN KEY (cuenta_id) REFERENCES public.cuenta(cuenta_id) ON DELETE CASCADE;


--
-- Name: mov_stock mov_stock_material_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mov_stock
    ADD CONSTRAINT mov_stock_material_id_fkey FOREIGN KEY (material_id) REFERENCES public.material(material_id);


--
-- Name: orden_trabajo orden_trabajo_empleado_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orden_trabajo
    ADD CONSTRAINT orden_trabajo_empleado_id_fkey FOREIGN KEY (empleado_id) REFERENCES public.empleado(empleado_id);


--
-- Name: orden_trabajo orden_trabajo_reclamo_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orden_trabajo
    ADD CONSTRAINT orden_trabajo_reclamo_id_fkey FOREIGN KEY (reclamo_id) REFERENCES public.reclamo(reclamo_id);


--
-- Name: pago pago_factura_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pago
    ADD CONSTRAINT pago_factura_id_fkey FOREIGN KEY (factura_id) REFERENCES public.factura(factura_id);


--
-- Name: reclamo reclamo_cuenta_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reclamo
    ADD CONSTRAINT reclamo_cuenta_id_fkey FOREIGN KEY (cuenta_id) REFERENCES public.cuenta(cuenta_id);


--
-- Name: reclamo reclamo_detalle_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reclamo
    ADD CONSTRAINT reclamo_detalle_id_fkey FOREIGN KEY (detalle_id) REFERENCES public.detalle_tipo_reclamo(detalle_id);


--
-- Name: reclamo reclamo_prioridad_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reclamo
    ADD CONSTRAINT reclamo_prioridad_id_fkey FOREIGN KEY (prioridad_id) REFERENCES public.prioridad(prioridad_id);


--
-- Name: uso_material uso_material_material_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.uso_material
    ADD CONSTRAINT uso_material_material_id_fkey FOREIGN KEY (material_id) REFERENCES public.material(material_id);


--
-- Name: uso_material uso_material_ot_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.uso_material
    ADD CONSTRAINT uso_material_ot_id_fkey FOREIGN KEY (ot_id) REFERENCES public.orden_trabajo(ot_id) ON DELETE CASCADE;


--
-- Name: usuario usuario_empleado_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuario
    ADD CONSTRAINT usuario_empleado_id_fkey FOREIGN KEY (empleado_id) REFERENCES public.empleado(empleado_id);


--
-- Name: usuario_rol usuario_rol_rol_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuario_rol
    ADD CONSTRAINT usuario_rol_rol_id_fkey FOREIGN KEY (rol_id) REFERENCES public.rol(rol_id) ON DELETE CASCADE;


--
-- Name: usuario_rol usuario_rol_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuario_rol
    ADD CONSTRAINT usuario_rol_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuario(usuario_id) ON DELETE CASCADE;


--
-- Name: usuario usuario_socio_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuario
    ADD CONSTRAINT usuario_socio_id_fkey FOREIGN KEY (socio_id) REFERENCES public.socio(socio_id);


--
-- Name: valoracion valoracion_reclamo_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.valoracion
    ADD CONSTRAINT valoracion_reclamo_id_fkey FOREIGN KEY (reclamo_id) REFERENCES public.reclamo(reclamo_id) ON DELETE CASCADE;


--
-- Name: valoracion valoracion_socio_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.valoracion
    ADD CONSTRAINT valoracion_socio_id_fkey FOREIGN KEY (socio_id) REFERENCES public.socio(socio_id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict gvfUFZEabDtx4zEAwmcFz1l6uLwmKTvS5dXiJ9Xj70JcDw1PijlvNQtNsGnqzT6

