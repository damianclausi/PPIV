# Generador de PDF de Facturas - Servicio Eléctrico

## Descripción

Sistema de generación de facturas en formato PDF para servicios eléctricos con formato estándar profesional.

## Características Implementadas

### ✅ Datos Incluidos en la Factura

1. **Información de la Empresa**
   - Nombre: Cooperativa Eléctrica Gobernador Ugarte Ltda.
   - Descripción del servicio

2. **Información del Cliente**
   - Nombre completo del cliente
   - Dirección del suministro
   - Número de cliente/cuenta

3. **Período y Fechas**
   - Período facturado (ej: Octubre 2025)
   - Fecha de emisión
   - Fecha de vencimiento
   - Fecha de pago (si aplica)

4. **Lecturas y Consumo**
   - Lectura anterior (kWh)
   - Lectura actual (kWh)
   - Consumo total del período (kWh)

5. **Detalle de Costos**
   - Cargo fijo
   - Cargo variable (basado en consumo)
   - Impuestos y tasas
   - **Total a pagar**

6. **Código de Barras**
   - Código de pago electrónico
   - Representación visual del código

7. **Estado de la Factura**
   - Indicador visual de estado (Pagada/Pendiente/Vencida)
   - Alertas visuales según estado

## Estructura de Archivos

```
src/
├── utils/
│   └── generadorPDFFactura.js    # Lógica de generación del PDF
└── components/
    └── cliente/
        └── FacturaDetalle.jsx     # Componente con botón de descarga
```

## Uso

### En el Componente FacturaDetalle

1. El usuario visualiza la factura en pantalla
2. Hace clic en el botón "Descargar PDF"
3. Se genera y descarga automáticamente el PDF

### Ejemplo de Datos Necesarios

```javascript
const factura = {
  id: 1,
  numero: "F-000001",
  periodo: "Octubre 2025",
  fecha_emision: "01/10/2025",
  vencimiento: "15/10/2025",
  monto: 5000.00,
  estado: "pendiente",
  fecha_pago: null,
  detalles: {
    consumo_kwh: 350,
    cargo_fijo: 1500.00,
    cargo_variable: 3000.00,
    impuestos: 500.00,
    total: 5000.00
  },
  cliente: {
    nombre: "Juan Pérez",
    direccion: "Calle Principal 123, Ugarte",
    numero_cliente: "12345"
  },
  lecturas: {
    anterior: 8000,
    actual: 8350,
    consumo: 350
  }
};
```

## Tecnologías Utilizadas

- **jsPDF**: Librería para generación de PDFs
- **jspdf-autotable**: Plugin para tablas en PDF
- **React**: Framework del frontend

## Instalación de Dependencias

```bash
npm install jspdf jspdf-autotable
```

## Formato del PDF

El PDF generado incluye:

1. **Encabezado azul** con logo y nombre de la cooperativa
2. **Sección de información** con datos de factura y cliente
3. **Tabla de consumo** con lecturas anterior, actual y consumo
4. **Detalle de cobros** con desglose de cargos
5. **Total destacado** en banner azul
6. **Código de barras** para pago electrónico
7. **Pie de página** con información de contacto
8. **Alertas visuales** según estado de la factura

## Mejoras Futuras

- [ ] Integrar librería JsBarcode para códigos de barras reales
- [ ] Agregar QR code para pago rápido
- [ ] Incluir gráfico de consumo histórico
- [ ] Agregar términos y condiciones
- [ ] Opción de envío por email
- [ ] Múltiples idiomas
- [ ] Personalización de colores por cooperativa

## Notas Técnicas

- El código de barras actualmente es una simulación visual
- Los datos se obtienen dinámicamente de la base de datos
- El PDF se genera en el navegador del cliente
- No requiere procesamiento en el servidor

## Ruta de Acceso

Para probar la funcionalidad:

```
http://localhost:3002/dashboard/cliente/factura/2
```

Reemplazar `2` con el ID de cualquier factura existente en la base de datos.

## Soporte

Para consultas o problemas, contactar al equipo de desarrollo.
