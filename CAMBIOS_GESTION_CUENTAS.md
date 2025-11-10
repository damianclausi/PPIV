# Reporte de Cambios - Exportar PDF Cuentas

## Resumen
Se implementó un sistema completo de gestión y exportación de cuentas a PDF, incluyendo:
- Nuevo endpoint backend para listar cuentas
- Componente frontend de gestión de cuentas
- Generador de PDF profesional para reportes de cuentas
- Integración con el panel de reportes

## Cambios Realizados

### Backend

#### 1. `/backend/models/Cuenta.js`
**Agregado:** Método `listar()` para obtener todas las cuentas con información completa
- Incluye datos de socio, servicio y deuda
- Soporta paginación (límite, offset)
- Filtros: estado activa/inactiva, búsqueda por texto
- Ordenamiento configurable por cualquier campo
- Retorna: `{ cuentas: [], total, pagina, totalPaginas }`

**Características:**
```javascript
static async listar({ 
  limite = 50, 
  offset = 0, 
  activa = null, 
  busqueda = null, 
  orden = 'numero_cuenta', 
  direccion = 'ASC' 
})
```

#### 2. `/backend/controllers/AdministradorController.js`
**Agregado:** Método `listarCuentas(req, res)`
- Procesa parámetros de query: activa, pagina, limite, busqueda, orden, direccion
- Llama al modelo Cuenta.listar()
- Retorna respuesta exitosa con datos paginados

#### 3. `/backend/routes/administradores.js`
**Agregado:** Ruta `GET /api/administradores/cuentas`
- Ubicada antes de las rutas POST/PUT de cuentas específicas
- Requiere autenticación y rol de administrador

### Frontend

#### 4. `/src/services/administradorService.js`
**Agregado:** Método `listarCuentas(filtros)`
- Construye query params dinámicamente
- Soporta todos los filtros: activa, pagina, limite, busqueda, orden, direccion
- Retorna response completa del backend

#### 5. `/src/components/admin/GestionCuentas.jsx` (NUEVO)
**Componente completo de gestión de cuentas con:**

**Características principales:**
- Tabla completa con todas las cuentas del sistema
- Columnas: N° Cuenta, Socio, Dirección, Servicio, Estado, Deuda, Principal
- Ordenamiento por cualquier columna (click en header)
- Búsqueda en tiempo real (numero_cuenta, dirección, socio, DNI, servicio)
- Filtro por estado (todas, activas, inactivas)
- Paginación completa
- Estadísticas en tiempo real:
  - Total de cuentas
  - Cuentas activas/inactivas
  - Deuda total acumulada
  - Cuentas con deuda
- Botón "Exportar PDF" integrado
- Diseño responsive con Tailwind CSS
- Iconos visuales para estados (CheckCircle, XCircle, AlertCircle)
- Colores condicionales (verde para sin deuda, rojo para con deuda)
- Loading states y error handling

**Estructura del componente:**
```jsx
- Header con botón volver y exportar PDF
- 4 Cards de estadísticas (Total, Activas, Inactivas, Deuda)
- Panel de filtros (búsqueda y estado)
- Tabla con ordenamiento y paginación
- Skeleton loaders para estados de carga
```

#### 6. `/src/utils/generadorPDFCuentas.js` (NUEVO)
**Generador profesional de PDF para reportes de cuentas**

**Características:**
- Formato horizontal (landscape) A4 para más columnas
- Header con logo de cooperativa
- Fecha y hora de generación
- Resumen estadístico con tabla:
  - Total de cuentas
  - Cuentas activas/inactivas (con porcentajes)
  - Cuentas principales
  - Cuentas con deuda
  - Deuda total acumulada
- Listado detallado de todas las cuentas en tabla
- Columnas: N° Cuenta, Socio, Dirección, Localidad, Servicio, Estado, Principal, Deuda
- Estilos condicionales:
  - Verde para estados activos y sin deuda
  - Rojo para estados inactivos y con deuda
  - Azul para cuentas principales
- Pie de página en todas las páginas con número de página
- Nombre de archivo: `Reporte_Cuentas_YYYY-MM-DD.pdf`

**Funciones exportadas:**
- `generarPDFCuentas(cuentas)` - Principal
- `generarPDFCuentasPorEstado(cuentas, estado)` - Filtrado por estado
- `generarPDFCuentasConDeuda(cuentas)` - Solo cuentas con deuda

#### 7. `/src/components/admin/Reportes.jsx`
**Modificado:** Agregado botón "Gestión de Cuentas"
- Ubicación: Header del panel de reportes
- Icono: CreditCard
- Navega a: `/dashboard/admin/gestion-cuentas`
- Agregado import de `CreditCard` de lucide-react

#### 8. `/src/components/DashboardAdministrador.jsx`
**Modificado:** Agregado botón de acceso rápido
- Ubicación: Card de "Acciones Rápidas"
- Icono: CreditCard
- Texto: "Gestión de Cuentas"
- Navega a: `/dashboard/admin/gestion-cuentas`
- Agregado import de `CreditCard` de lucide-react

#### 9. `/src/App.tsx`
**Agregado:** Ruta de navegación
```tsx
<Route
  path="/dashboard/admin/gestion-cuentas"
  element={
    <RutaProtegida>
      <GestionCuentas />
    </RutaProtegida>
  }
/>
```
- Import del componente `GestionCuentas`
- Ruta protegida solo para administradores

## Flujo de Uso

### Para el Administrador:

1. **Acceso:**
   - Desde Dashboard Admin → Click en "Gestión de Cuentas"
   - O desde Panel de Reportes → Click en "Gestión de Cuentas"

2. **Visualización:**
   - Ver listado completo de todas las cuentas
   - Ver estadísticas en tiempo real (totales, activas, inactivas, deuda)
   - Ordenar por cualquier columna (click en header)

3. **Búsqueda y Filtrado:**
   - Buscar por: número de cuenta, dirección, nombre de socio, DNI, servicio
   - Filtrar por estado: todas, activas, inactivas
   - Navegar por páginas (50 cuentas por página por defecto)

4. **Exportación:**
   - Click en "Exportar PDF"
   - Se descarga automáticamente `Reporte_Cuentas_YYYY-MM-DD.pdf`
   - PDF incluye resumen estadístico y listado completo
   - Formato profesional con logo y estilos corporativos

## Estructura de Datos

### Cuenta (modelo completo devuelto por la API):
```javascript
{
  cuenta_id: number,
  numero_cuenta: string,
  direccion: string,
  localidad: string,
  servicio_id: number,
  principal: boolean,
  activa: boolean,
  socio_id: number,
  servicio_nombre: string,
  servicio_descripcion: string,
  socio_nombre: string,
  socio_apellido: string,
  socio_dni: string,
  socio_telefono: string,
  socio_email: string,
  socio_activo: boolean,
  deuda: number // Suma de facturas PENDIENTES
}
```

### Response del endpoint:
```javascript
{
  exito: true,
  datos: {
    cuentas: [...],
    total: number,
    pagina: number,
    totalPaginas: number
  }
}
```

## Mejoras Implementadas

1. **Performance:**
   - Consulta SQL optimizada con JOINs
   - Cálculo de deuda en la misma query (no múltiples consultas)
   - Paginación para no cargar todas las cuentas a la vez

2. **UX/UI:**
   - Skeleton loaders durante carga
   - Feedback visual inmediato en acciones
   - Iconos intuitivos para estados
   - Colores semánticos (verde/rojo para estados)
   - Búsqueda en tiempo real
   - Ordenamiento con feedback visual

3. **Código:**
   - Separación de responsabilidades (modelo, controlador, servicio, componente)
   - Reutilización del layout CooperativaLayout
   - Uso de componentes UI existentes (Button, Card, Skeleton)
   - Validación de parámetros en backend
   - Error handling completo

4. **PDF:**
   - Logo corporativo
   - Formato profesional
   - Resumen estadístico antes del listado
   - Estilos condicionales para mejor lectura
   - Paginación automática

## Testing Recomendado

1. **Backend:**
   ```bash
   # Verificar endpoint (requiere token de admin)
   curl -H "Authorization: Bearer TOKEN" \
        "http://localhost:3001/api/administradores/cuentas?pagina=1&limite=10"
   ```

2. **Frontend:**
   - Login como administrador
   - Navegar a Gestión de Cuentas
   - Probar búsqueda con diferentes términos
   - Probar filtro de estado
   - Probar ordenamiento por diferentes columnas
   - Exportar PDF y verificar contenido
   - Verificar paginación con más de 50 cuentas

3. **Edge Cases:**
   - Cuentas sin deuda (deuda = 0)
   - Cuentas inactivas
   - Búsqueda sin resultados
   - Exportar PDF con listado vacío
   - Ordenamiento ascendente/descendente

## Archivos Modificados

**Backend (3):**
- backend/models/Cuenta.js
- backend/controllers/AdministradorController.js
- backend/routes/administradores.js

**Frontend (6):**
- src/services/administradorService.js
- src/components/admin/GestionCuentas.jsx (NUEVO)
- src/utils/generadorPDFCuentas.js (NUEVO)
- src/components/admin/Reportes.jsx
- src/components/DashboardAdministrador.jsx
- src/App.tsx

**Total: 9 archivos (7 modificados + 2 nuevos)**

## Próximos Pasos Sugeridos

1. **Funcionalidad adicional:**
   - Agregar opción de exportar solo cuentas con deuda
   - Agregar opción de exportar por servicio
   - Agregar gráficos en el PDF (deuda por servicio, etc.)
   - Agregar filtro por rango de fechas de alta

2. **Mejoras de UX:**
   - Agregar vista de detalles de cuenta al hacer click en una fila
   - Agregar indicador de cuentas con mora (deuda > X días)
   - Agregar totales por servicio en el resumen

3. **Optimizaciones:**
   - Implementar caché en frontend para reducir llamadas a API
   - Agregar índices en la base de datos para búsquedas más rápidas
   - Implementar exportación en background para listados muy grandes

## Conclusión

Se ha implementado exitosamente un sistema completo de gestión y exportación de cuentas a PDF. El sistema está totalmente integrado con la arquitectura existente, sigue los patrones establecidos en el proyecto, y proporciona una interfaz intuitiva y profesional para administradores.

El reporte PDF generado es de calidad profesional, incluye todos los datos relevantes, y utiliza estilos visuales para facilitar la lectura e interpretación de la información.
