# Análisis: Gestión de Reclamos Administrativos

## 📋 Contexto Actual

### Base de Datos
La estructura actual ya diferencia entre reclamos TÉCNICOS y ADMINISTRATIVOS:

```
tipo_reclamo:
├── 1 - TECNICO (requiere cuadrilla, OT, itinerario)
└── 2 - ADMINISTRATIVO (solo gestión administrativa)

detalle_tipo_reclamo (ADMINISTRATIVOS):
├── 5 - Facturación
└── 6 - Conexión Nueva
```

### Diferencias Clave

| Aspecto | Reclamo Técnico | Reclamo Administrativo |
|---------|----------------|------------------------|
| **Requiere OT** | ✅ Siempre | ❌ Nunca |
| **Asignación** | A empleado operario (cuadrilla) | Al administrador |
| **Itinerario** | ✅ Sí | ❌ No |
| **Materiales** | ✅ Sí | ❌ No |
| **Resolución** | En terreno | Desde oficina |

## 🎯 Propuesta de Implementación

### 1. Estados Específicos para Reclamos Administrativos

```
PENDIENTE → EN REVISIÓN → RESUELTO / RECHAZADO
```

**Estados posibles:**
- `PENDIENTE`: Recién creado, sin revisar
- `EN REVISIÓN`: El administrador está trabajando en él
- `EN ESPERA`: Requiere documentación adicional del cliente
- `RESUELTO`: Completado exitosamente
- `RECHAZADO`: No procede el reclamo

### 2. Campos Adicionales Necesarios

#### Tabla `reclamo` (ya existente, agregar campos opcionales):
- `resolucion_administrativa` (TEXT): Descripción de cómo se resolvió
- `monto_ajuste` (DECIMAL): Si hay ajuste de facturación
- `documentos_adjuntos` (TEXT[]): URLs de documentos adicionales
- `requiere_respuesta_cliente` (BOOLEAN): Si se necesita más info del cliente

#### Nueva Tabla: `historial_reclamo_admin`
```sql
CREATE TABLE historial_reclamo_admin (
  historial_id SERIAL PRIMARY KEY,
  reclamo_id INT REFERENCES reclamo(reclamo_id),
  empleado_id INT REFERENCES empleado(empleado_id), -- Administrador
  accion VARCHAR(50), -- 'EN_REVISION', 'SOLICITAR_INFO', 'RESOLVER', etc.
  observacion TEXT,
  fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 3. Detección Automática del Tipo de Reclamo

Al crear/listar reclamos, detectar automáticamente:

```javascript
const esAdministrativo = (detalle_id) => {
  // detalle_id 5 = Facturación
  // detalle_id 6 = Conexión Nueva
  return [5, 6].includes(detalle_id);
};
```

### 4. Flujo de Trabajo

#### Crear Reclamo Administrativo (Cliente)
1. Cliente selecciona tipo: Facturación o Conexión Nueva
2. Completa descripción y adjunta documentos
3. Estado inicial: `PENDIENTE`
4. **NO se crea orden de trabajo**

#### Gestionar Reclamo (Administrador)
1. Ve listado de reclamos administrativos pendientes
2. Puede:
   - Tomar en revisión (`EN REVISIÓN`)
   - Solicitar más información (`EN ESPERA`)
   - Resolver con ajuste (`RESUELTO` + monto_ajuste)
   - Rechazar con motivo (`RECHAZADO`)
3. Cada acción queda registrada en historial

#### Seguimiento (Cliente)
1. Ve estado actualizado en tiempo real
2. Recibe notificaciones de cambios
3. Puede responder si se solicita más información

## 🚀 Plan de Implementación

### Fase 1: Base de Datos ✅ (Ya existe base)
- [x] Tablas tipo_reclamo y detalle_tipo_reclamo
- [ ] Agregar campos opcionales a tabla reclamo
- [ ] Crear tabla historial_reclamo_admin
- [ ] Script de migración

### Fase 2: Backend
- [ ] Modelo: ReclamoAdministrativo.js
- [ ] Controlador: reclamosAdministrativos.controller.js
- [ ] Rutas: /api/reclamos/administrativos
  - GET /administrativos (listar con filtros)
  - GET /administrativos/:id (detalle)
  - PATCH /administrativos/:id/tomar (tomar en revisión)
  - PATCH /administrativos/:id/resolver (resolver)
  - PATCH /administrativos/:id/rechazar (rechazar)
  - POST /administrativos/:id/solicitar-info (pedir más datos)
  - GET /administrativos/:id/historial (ver historial)

### Fase 3: Frontend
- [ ] Vista Administrador: /admin/reclamos-administrativos
  - Tabla con filtros (estado, tipo, fecha)
  - Detalle expandible
  - Acciones rápidas (tomar, resolver, rechazar)
  - Adjuntar documentos de respuesta
- [ ] Vista Cliente: Mejoras en /mis-reclamos
  - Indicador visual diferenciando tipo
  - Para reclamos admin: historial de acciones
  - Cargar documentos adicionales si se solicita

### Fase 4: Mejoras Opcionales
- [ ] Notificaciones por email/push
- [ ] SLA (tiempo máximo de resolución)
- [ ] Reportes y estadísticas
- [ ] Template de respuestas comunes

## 📊 Datos de Prueba Actuales

```
Reclamos Administrativos Existentes:
├── #5: "Consulta sobre facturación de período agosto 2024"
│   └── Estado: PENDIENTE | Detalle: Facturación | Socio: José Luis Morales
└── #7: "Solicitud de nueva conexión para ampliación"
    └── Estado: PENDIENTE | Detalle: Conexión Nueva | Socio: Ana Sofía Rodríguez
```

## 🔍 Consultas SQL Útiles

### Listar reclamos administrativos pendientes
```sql
SELECT 
  r.reclamo_id,
  r.descripcion,
  r.estado,
  r.fecha_alta,
  d.nombre as tipo_detalle,
  c.numero_cuenta,
  s.nombre || ' ' || s.apellido as socio,
  s.telefono,
  s.email
FROM reclamo r
JOIN detalle_tipo_reclamo d ON r.detalle_id = d.detalle_id
JOIN tipo_reclamo t ON d.tipo_id = t.tipo_id
JOIN cuenta c ON r.cuenta_id = c.cuenta_id
JOIN socio s ON c.socio_id = s.socio_id
WHERE t.nombre = 'ADMINISTRATIVO'
  AND r.estado IN ('PENDIENTE', 'EN REVISIÓN')
ORDER BY r.fecha_alta;
```

### Verificar que no tengan OT (nunca deberían tener)
```sql
SELECT r.reclamo_id, ot.ot_id
FROM reclamo r
JOIN detalle_tipo_reclamo d ON r.detalle_id = d.detalle_id
JOIN tipo_reclamo t ON d.tipo_id = t.tipo_id
LEFT JOIN orden_trabajo ot ON r.reclamo_id = ot.reclamo_id
WHERE t.nombre = 'ADMINISTRATIVO' AND ot.ot_id IS NOT NULL;
-- Debe devolver 0 filas
```

## ⚠️ Validaciones Importantes

1. **Al crear OT**: Verificar que el reclamo NO sea administrativo
2. **Al asignar cuadrilla**: Solo reclamos técnicos
3. **Al crear itinerario**: Excluir reclamos administrativos
4. **Estados específicos**: Validar transiciones según tipo

## 🎨 UI/UX Recomendaciones

### Vista Administrador
```
┌─────────────────────────────────────────────────┐
│ 📋 Reclamos Administrativos                     │
├─────────────────────────────────────────────────┤
│ [Pendientes: 2] [En Revisión: 0] [Hoy: 0]      │
│                                                  │
│ 🔍 [Buscar...] [Tipo▾] [Estado▾] [Fecha▾]      │
├─────────────────────────────────────────────────┤
│ #5 | Facturación | PENDIENTE | José Luis        │
│     "Consulta sobre facturación agosto 2024"    │
│     📅 09/10/2025 08:12 | 📞 2616-123456        │
│     [👁️ Ver] [✅ Tomar] [📄 Documentos]         │
├─────────────────────────────────────────────────┤
│ #7 | Conexión Nueva | PENDIENTE | Ana Sofía     │
│     "Solicitud de nueva conexión ampliación"    │
│     📅 09/10/2025 08:12 | 📞 2616-789012        │
│     [👁️ Ver] [✅ Tomar] [📄 Documentos]         │
└─────────────────────────────────────────────────┘
```

### Panel de Detalle/Resolución
```
┌─────────────────────────────────────────────────┐
│ Reclamo #5 - Facturación                        │
├─────────────────────────────────────────────────┤
│ Cliente: José Luis Morales                      │
│ Cuenta: 001009 | Tel: 2616-123456               │
│                                                  │
│ Descripción:                                     │
│ "Consulta sobre facturación de período agosto"  │
│                                                  │
│ 📎 Documentos Adjuntos:                         │
│   - factura_agosto.pdf                          │
│                                                  │
│ 📝 Resolución:                                  │
│ [Textarea para escribir resolución]             │
│                                                  │
│ 💰 Ajuste de Monto (opcional):                  │
│ $[         ]                                     │
│                                                  │
│ [❌ Rechazar] [⏸️ Solicitar Info] [✅ Resolver] │
└─────────────────────────────────────────────────┘
```

---

## 🚀 Próximos Pasos

1. ¿Quieres que empiece con la migración de base de datos?
2. ¿Prefieres primero crear el backend completo?
3. ¿O vamos directo a una interfaz funcional con la estructura actual?

**Recomendación**: Empezar con la migración DB + backend, y luego frontend.
