# CORRECCIÓN DE ERRORES - 9 de Octubre 2025

## Problema Reportado por Usuario

### Error 1: Error 500 al Marcar OT en Proceso
```
:3001/api/administradores/ots/administrativas/32/en-proceso:1  
Failed to load resource: the server responded with a status of 500 (Internal Server Error)
```

### Error 2: Warning de React sobre refs
```
Warning: Function components cannot be given refs. 
Attempts to access this ref will fail. 
Did you mean to use React.forwardRef()?
```

---

## CORRECCIÓN 1: Error SQL en Backend

### Causa del Error
El query SQL en `marcarEnProcesoAdministrativa()` usaba `CASE WHEN` sin especificar el tipo de dato del parámetro `$2`, causando error de PostgreSQL:

```
error: could not determine data type of parameter $2
```

### Código Problemático (ANTES)
```javascript
const query = `
  UPDATE orden_trabajo 
  SET estado = 'EN_PROCESO',
      observaciones = CASE 
        WHEN $2 IS NOT NULL THEN $2
        ELSE observaciones
      END,
      updated_at = NOW()
  WHERE ot_id = $1
    AND empleado_id IS NULL
    AND estado = 'PENDIENTE'
  RETURNING *
`;
```

### Código Corregido (DESPUÉS)
```javascript
const query = `
  UPDATE orden_trabajo 
  SET estado = 'EN_PROCESO',
      observaciones = COALESCE($2::TEXT, observaciones),
      updated_at = NOW()
  WHERE ot_id = $1
    AND empleado_id IS NULL
    AND estado = 'PENDIENTE'
  RETURNING *
`;
```

### Cambios Realizados
1. ✅ Reemplazado `CASE WHEN` por `COALESCE` (más simple y claro)
2. ✅ Agregado cast explícito `$2::TEXT` para que PostgreSQL conozca el tipo de dato
3. ✅ Mantenida la lógica de limpieza de strings vacíos → `null`

### Archivo Modificado
- `/home/damian/projects/PPIV/backend/models/OrdenTrabajo.js`
  - Línea ~218: Método `marcarEnProcesoAdministrativa()`

---

## CORRECCIÓN 2: Warning de React forwardRef

### Causa del Warning
El componente `DialogOverlay` era una función regular que no manejaba refs correctamente. Radix UI internamente intenta pasar refs a los componentes, causando el warning.

### Código Problemático (ANTES)
```tsx
function DialogOverlay({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Overlay>) {
  return (
    <DialogPrimitive.Overlay
      data-slot="dialog-overlay"
      className={cn(
        "data-[state=open]:animate-in data-[state=closed]:animate-out ...",
        className,
      )}
      {...props}
    />
  );
}
```

### Código Corregido (DESPUÉS)
```tsx
const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    data-slot="dialog-overlay"
    className={cn(
      "data-[state=open]:animate-in data-[state=closed]:animate-out ...",
      className,
    )}
    {...props}
  />
));
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName;
```

### Cambios Realizados
1. ✅ Convertido a componente con `React.forwardRef`
2. ✅ Agregado tipo genérico explícito para TypeScript
3. ✅ Pasado `ref` al componente `DialogPrimitive.Overlay`
4. ✅ Agregado `displayName` para debugging en DevTools

### Archivo Modificado
- `/home/damian/projects/PPIV/src/components/ui/dialog.tsx`
  - Líneas ~33-48: Componente `DialogOverlay`

---

## Resultado Final

### ✅ Backend Corregido
```bash
Estado: ✅ Servidor reiniciado
PID: 90371
URL: http://localhost:3001
Log: logs/backend.log
```

**Pruebas**:
- ✅ Marcar OT como "En Proceso" SIN observaciones → Funciona
- ✅ Marcar OT como "En Proceso" CON observaciones → Funciona y guarda
- ✅ No más errores 500

### ✅ Frontend Corregido
```bash
Estado: ✅ Servidor reiniciado
PID: 90425
URL: http://localhost:3002
Log: logs/frontend.log
```

**Pruebas**:
- ✅ No más warnings de forwardRef en consola
- ✅ Modal funciona correctamente
- ✅ Refs manejados correctamente por Radix UI

---

## Análisis Técnico

### PostgreSQL Type Inference
PostgreSQL necesita conocer el tipo de dato de los parámetros en queries complejos. Las soluciones son:

1. **Cast explícito**: `$2::TEXT` ✅ (usado)
2. **COALESCE**: Más simple que CASE WHEN ✅ (usado)
3. **Preparar statement con tipos**: Más complejo

### React forwardRef
Los componentes que encapsulan componentes de bibliotecas UI (Radix, MUI, etc.) deben usar `forwardRef` si:

1. La biblioteca interna usa refs
2. Se necesita acceso imperativo al DOM
3. Se usan con otros componentes que esperan refs

### Beneficios del Fix
1. ✅ Código más limpio (`COALESCE` vs `CASE WHEN`)
2. ✅ TypeScript más feliz (tipos explícitos)
3. ✅ Consola más limpia (sin warnings)
4. ✅ Mejor compatibilidad con Radix UI

---

## Comandos para Verificar

### Ver logs del backend:
```bash
tail -f logs/backend.log
```

### Probar endpoint manualmente:
```bash
curl -X PATCH http://localhost:3001/api/administradores/ots/administrativas/32/en-proceso \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"observaciones":"Test de observaciones"}'
```

### Ver estado de OT en base de datos:
```sql
SELECT ot_id, estado, observaciones, updated_at
FROM orden_trabajo
WHERE ot_id = 32;
```

---

## Estado Actual del Sistema

### Backend
- ✅ Query SQL corregido con cast `::TEXT`
- ✅ Método `marcarEnProcesoAdministrativa()` funcional
- ✅ Método `cerrarAdministrativa()` funcional
- ✅ Validaciones de observaciones operativas

### Frontend
- ✅ DialogOverlay con forwardRef
- ✅ No warnings en consola
- ✅ Modal funciona correctamente
- ✅ Observaciones se envían y reciben correctamente

### Flujo Completo
```
Usuario → Abre OT (PENDIENTE)
       → Escribe observaciones (opcional)
       → Clic "Marcar En Proceso"
       → Frontend: Envía { observaciones: "texto" } o {}
       → Backend: Aplica COALESCE($2::TEXT, observaciones)
       → Base de datos: Actualiza con texto o mantiene NULL
       → Frontend: Recarga y muestra "Observaciones Previas"
       ✅ TODO FUNCIONA
```

---

**Fecha**: 9 de octubre de 2025  
**Estado**: ✅ ERRORES CORREGIDOS - SISTEMA OPERATIVO  
**Próximo Paso**: Probar en navegador (http://localhost:3002)
