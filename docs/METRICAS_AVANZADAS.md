# DOCUMENTACIÓN DE MÉTRICAS AVANZADAS
## Sistema de Gestión de Cooperativa Eléctrica - PPIV

**Versión:** 1.0  
**Fecha:** Octubre 2025  
**Autor:** Sistema PPIV - El Quinto Elemento  

---

## 1. INTRODUCCIÓN

Este documento describe las métricas avanzadas implementadas en el Panel de Reportes del sistema administrativo. Estas métricas permiten medir el desempeño operativo de la cooperativa y la calidad del servicio brindado a los socios.

---

## 2. MÉTRICAS IMPLEMENTADAS

### 2.1. TIEMPO PROMEDIO DE RESOLUCIÓN

**Definición:**  
Mide el tiempo promedio (en días) que transcurre desde que se registra un reclamo hasta que se resuelve completamente.

**Método de Cálculo:**
```sql
Promedio = Σ (fecha_modificación - fecha_alta) / Total de reclamos resueltos
```

**Fórmula Específica:**
- Se consideran reclamos con estado 'RESUELTO' o 'CERRADO'
- Se calcula la diferencia entre `fecha_modificacion` y `fecha_alta` en días
- Se obtiene el promedio de los últimos 30 días
- Se compara con el promedio del período anterior (días 30-60)

**Interpretación:**
- **Valores Bajos (1-3 días):** Excelente tiempo de respuesta
- **Valores Medios (4-7 días):** Tiempo de respuesta aceptable
- **Valores Altos (>7 días):** Requiere atención y mejora de procesos

**Indicador de Tendencia:**
- Porcentaje negativo indica MEJORA (menos tiempo de resolución)
- Porcentaje positivo indica DETERIORO (más tiempo de resolución)

**Campos de BD Utilizados:**
- `reclamo.fecha_alta`
- `reclamo.fecha_modificacion`
- `reclamo.estado`

---

### 2.2. EFICIENCIA OPERATIVA

**Definición:**  
Porcentaje de reclamos resueltos exitosamente respecto al total de reclamos recibidos en el período evaluado.

**Método de Cálculo:**
```
Eficiencia (%) = (Reclamos Resueltos / Total de Reclamos) × 100
```

**Fórmula Específica:**
- Numerador: COUNT de reclamos con estado 'RESUELTO' o 'CERRADO'
- Denominador: COUNT de todos los reclamos del período
- Período evaluado: Últimos 30 días
- Se compara con el mismo cálculo del período anterior

**Interpretación:**
- **80-100%:** Excelente eficiencia operativa
- **60-79%:** Eficiencia aceptable, con margen de mejora
- **< 60%:** Requiere revisión de procesos y asignación de recursos

**Indicador de Tendencia:**
- Porcentaje positivo indica MEJORA en la capacidad de resolución
- Porcentaje negativo indica DETERIORO en la eficiencia

**Campos de BD Utilizados:**
- `reclamo.estado`
- `reclamo.fecha_alta`

---

### 2.3. SATISFACCIÓN DEL SOCIO

**Definición:**  
Indicador proxy de la satisfacción del socio basado en la tasa de reclamos resueltos sin reincidencia en el corto plazo.

**Método de Cálculo (Proxy):**
```
Base = Reclamos sin reincidencia / Total de reclamos cerrados
Satisfacción = 3.0 + (Base × 2.0)
```

Esto genera una escala de 3.0 a 5.0 puntos.

**Lógica del Cálculo:**
1. Se identifican reclamos RESUELTOS o CERRADOS
2. Para cada uno, se verifica si hubo un nuevo reclamo del mismo tipo:
   - En la misma cuenta
   - Con el mismo detalle de tipo de reclamo
   - Dentro de los 7 días siguientes
3. Los reclamos SIN reincidencia indican resolución efectiva
4. Se convierte el ratio a una escala de satisfacción 1-5

**Interpretación:**
- **4.5 - 5.0:** Satisfacción excelente
- **4.0 - 4.4:** Satisfacción buena
- **3.5 - 3.9:** Satisfacción aceptable
- **< 3.5:** Requiere atención urgente

**Limitaciones:**
- No existe tabla de calificaciones directas de socios (futura mejora)
- Se utiliza la reincidencia como indicador indirecto
- La reincidencia en 7 días puede ser un período corto/largo según el tipo de reclamo

**Indicador de Tendencia:**
- Se compara con el trimestre anterior (90 días previos)
- Porcentaje positivo indica MEJORA en satisfacción
- Porcentaje negativo indica DETERIORO

**Campos de BD Utilizados:**
- `reclamo.estado`
- `reclamo.cuenta_id`
- `reclamo.detalle_id`
- `reclamo.fecha_alta`

---

## 3. PERÍODO DE EVALUACIÓN

**Período Principal:** Últimos 30 días  
**Período de Comparación:**
- Tiempo de Resolución: Días 30-60 (mes anterior)
- Eficiencia Operativa: Días 30-60 (mes anterior)
- Satisfacción del Socio: Días 30-120 (trimestre anterior)

---

## 4. IMPLEMENTACIÓN TÉCNICA

### 4.1. Backend

**Archivo:** `backend/controllers/MetricasController.js`

**Endpoint:** `GET /api/administradores/metricas-avanzadas`

**Tecnología:** PostgreSQL con funciones de ventana y agregación

**Optimizaciones:**
- Uso de `FILTER (WHERE ...)` para cálculos condicionales
- Subconsultas correlacionadas para detectar reincidencias
- Índices en `fecha_alta` y `estado` para mejorar rendimiento

### 4.2. Frontend

**Archivo:** `src/components/admin/Reportes.jsx`

**Hook:** `useMetricasAvanzadas()` en `src/hooks/useAdministrador.js`

**Servicio:** `administradorService.obtenerMetricasAvanzadas()`

---

## 5. VISUALIZACIÓN

Cada métrica se presenta en una tarjeta con:
- **Valor Principal:** Número grande y destacado
- **Indicador de Tendencia:** Flecha y porcentaje de cambio
- **Color Semántico:**
  - Verde: Mejora o valor positivo
  - Rojo: Deterioro o valor negativo
- **Texto Explicativo:** Contexto del cambio

---

## 6. CASOS DE USO

### 6.1. Monitoreo de Desempeño
El administrador puede visualizar el desempeño operativo actual y compararlo con períodos anteriores.

### 6.2. Toma de Decisiones
Las métricas ayudan a identificar:
- Necesidad de contratar más personal
- Capacitación de operarios
- Mejora de procesos internos
- Priorización de tipos de reclamos

### 6.3. Reportes Gerenciales
Los valores pueden exportarse (función futura) para presentaciones a directivos.

---

## 7. FUTURAS MEJORAS

### 7.1. Tabla de Calificaciones
Implementar una tabla `calificaciones` para registrar satisfacción directa de socios:
```sql
CREATE TABLE calificacion (
  calificacion_id SERIAL PRIMARY KEY,
  reclamo_id INT REFERENCES reclamo(reclamo_id),
  socio_id INT REFERENCES socio(socio_id),
  calificacion INT CHECK (calificacion BETWEEN 1 AND 5),
  comentario TEXT,
  fecha_calificacion TIMESTAMP DEFAULT NOW()
);
```

### 7.2. Métricas Adicionales
- Tiempo promedio por tipo de reclamo
- Tasa de reasignación de operarios
- Costos operativos por reclamo
- Predicción de demanda con machine learning

### 7.3. Exportación
- PDF con gráficos
- Excel con datos tabulares
- Dashboard en tiempo real con WebSockets

---

## 8. CONCLUSIONES

Las métricas avanzadas implementadas proporcionan una visión cuantitativa del desempeño operativo de la cooperativa. Aunque algunas métricas utilizan indicadores proxy (como satisfacción basada en reincidencia), ofrecen información valiosa para la gestión y mejora continua del servicio.

La implementación permite:
1. Monitoreo continuo del desempeño
2. Identificación temprana de problemas
3. Evaluación objetiva de mejoras
4. Justificación de decisiones operativas

---

## 9. REFERENCIAS

- Modelo de Base de Datos: `docs/MODELO_DE_DATOS.md`
- API Documentation: `docs/API.md`
- Casos de Uso: `docs/VERIFICACION_CASOS_DE_USO.md`

---

**Documento generado para:** Evaluación Académica - Práctica Profesional IV  
**Institución:** IFTS 29 (Instituto de Formación Técnica Superior Número 29)  
**Carrera:** Tecnicatura Superior en Desarrollo de Software a Distancia
