/**
 * Generador de PDF para facturas de servicio eléctrico
 * Genera facturas con formato estándar incluyendo código de barras
 */

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import logoCooperativa from '../assets/brand/logo.jpeg';

/**
 * Genera un código de barras simple (simulado con texto)
 * En producción se debería usar una librería como JsBarcode
 */
const generarCodigoBarras = (numeroFactura, monto) => {
  // Formato estándar: empresa + factura + monto
  const codigo = `2501${numeroFactura.padStart(10, '0')}${Math.round(monto * 100).toString().padStart(10, '0')}`;
  return codigo;
};

/**
 * Genera el PDF de la factura
 */
export const generarPDFFactura = (factura) => {
  const doc = new jsPDF();
  
  // Configuración de colores
  const colorPrimario = [41, 128, 185]; // Azul
  const colorSecundario = [52, 73, 94]; // Gris oscuro
  const colorTexto = [44, 62, 80];
  
  let yPos = 20;
  
  // ===== ENCABEZADO =====
  doc.setFillColor(...colorPrimario);
  doc.rect(0, 0, 210, 45, 'F');
  
  // Logo de la cooperativa
  try {
    doc.addImage(logoCooperativa, 'JPEG', 15, 8, 30, 30);
  } catch (error) {
    console.warn('No se pudo cargar el logo:', error);
  }
  
  // Nombre de la cooperativa
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('COOPERATIVA ELÉCTRICA', 105, 18, { align: 'center' });
  doc.setFontSize(16);
  doc.text('GOBERNADOR UGARTE', 105, 28, { align: 'center' });
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Servicio de Energía Eléctrica', 105, 36, { align: 'center' });
  
  yPos = 55;
  
  // ===== INFORMACIÓN DE LA FACTURA =====
  doc.setTextColor(...colorSecundario);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('FACTURA DE SERVICIO ELÉCTRICO', 15, yPos);
  
  yPos += 10;
  
  // Número de factura y fecha
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...colorTexto);
  
  const infoFactura = [
    ['Número de Factura:', factura.numero],
    ['Fecha de Emisión:', factura.fecha_emision],
    ['Período Facturado:', factura.periodo],
    ['Fecha de Vencimiento:', factura.vencimiento]
  ];
  
  infoFactura.forEach(([label, value]) => {
    doc.setFont('helvetica', 'bold');
    doc.text(label, 15, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(value, 80, yPos);
    yPos += 7;
  });
  
  yPos += 5;
  
  // ===== DATOS DEL CLIENTE =====
  doc.setFillColor(240, 240, 240);
  doc.rect(15, yPos, 180, 30, 'F');
  
  yPos += 8;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('DATOS DEL CLIENTE', 20, yPos);
  
  yPos += 7;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  
  const datosCliente = [
    ['Cliente:', factura.cliente.nombre],
    ['N° de Cliente/Cuenta:', factura.cliente.numero_cliente],
    ['Dirección de Suministro:', factura.cliente.direccion]
  ];
  
  datosCliente.forEach(([label, value]) => {
    doc.setFont('helvetica', 'bold');
    doc.text(label, 20, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(value, 80, yPos);
    yPos += 6;
  });
  
  yPos += 10;
  
  // ===== CONSUMO Y LECTURAS =====
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...colorSecundario);
  doc.text('CONSUMO DE ENERGÍA', 15, yPos);
  
  yPos += 8;
  
  // Tabla de lecturas
  autoTable(doc, {
    startY: yPos,
    head: [['Lectura Anterior', 'Lectura Actual', 'Consumo (kWh)']],
    body: [
      [
        `${factura.lecturas.anterior} kWh`,
        `${factura.lecturas.actual} kWh`,
        `${factura.lecturas.consumo} kWh`
      ]
    ],
    theme: 'grid',
    headStyles: {
      fillColor: colorPrimario,
      fontSize: 10,
      fontStyle: 'bold',
      halign: 'center'
    },
    bodyStyles: {
      fontSize: 10,
      halign: 'center'
    },
    margin: { left: 15, right: 15 }
  });
  
  yPos = doc.lastAutoTable.finalY + 10;
  
  // ===== DETALLE DE COBROS =====
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('DETALLE DE COBROS', 15, yPos);
  
  yPos += 8;
  
  // Tabla de cobros
  const detallesCobros = [
    ['Cargo Fijo', `$ ${factura.detalles.cargo_fijo.toFixed(2)}`],
    [`Cargo Variable (${factura.lecturas.consumo} kWh)`, `$ ${factura.detalles.cargo_variable.toFixed(2)}`],
    ['Impuestos y Tasas', `$ ${factura.detalles.impuestos.toFixed(2)}`]
  ];
  
  autoTable(doc, {
    startY: yPos,
    body: detallesCobros,
    theme: 'plain',
    styles: {
      fontSize: 10,
      cellPadding: 3
    },
    columnStyles: {
      0: { cellWidth: 140 },
      1: { halign: 'right', cellWidth: 40 }
    },
    margin: { left: 15, right: 15 }
  });
  
  yPos = doc.lastAutoTable.finalY + 5;
  
  // Total
  doc.setFillColor(...colorPrimario);
  doc.rect(15, yPos, 180, 12, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('TOTAL A PAGAR:', 20, yPos + 8);
  doc.text(`$ ${factura.detalles.total.toFixed(2)}`, 175, yPos + 8, { align: 'right' });
  
  yPos += 20;
  
  // ===== CÓDIGO DE BARRAS =====
  const codigoBarras = generarCodigoBarras(
    factura.numero.replace(/\D/g, ''),
    factura.detalles.total
  );
  
  doc.setTextColor(...colorTexto);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Código de Pago Electrónico:', 15, yPos);
  yPos += 5;
  
  // Simular código de barras con rectángulos
  doc.setFillColor(0, 0, 0);
  let xBarras = 15;
  for (let i = 0; i < codigoBarras.length; i++) {
    const ancho = codigoBarras[i] === '1' ? 2 : 1;
    if (i % 2 === 0) {
      doc.rect(xBarras, yPos, ancho, 15, 'F');
    }
    xBarras += ancho + 0.5;
  }
  
  yPos += 20;
  doc.setFontSize(8);
  doc.text(codigoBarras, 105, yPos, { align: 'center' });
  
  yPos += 10;
  
  // ===== PIE DE PÁGINA =====
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text('Conserve esta factura para futuras consultas.', 105, yPos, { align: 'center' });
  yPos += 4;
  doc.text('Ante cualquier consulta comuníquese al 3804-XXXXXX o visite nuestra oficina.', 105, yPos, { align: 'center' });
  yPos += 4;
  doc.text('Cooperativa Eléctrica Gobernador Ugarte Ltda. - www.cooperativa-ugarte.coop', 105, yPos, { align: 'center' });
  
  // ===== NOTA DE VENCIMIENTO =====
  if (factura.estado === 'vencida') {
    doc.setFillColor(255, 200, 200);
    doc.rect(15, 265, 180, 15, 'F');
    doc.setTextColor(200, 0, 0);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('⚠ FACTURA VENCIDA - Por favor regularice su situación', 105, 273, { align: 'center' });
  } else if (factura.estado === 'pagada') {
    doc.setFillColor(200, 255, 200);
    doc.rect(15, 265, 180, 15, 'F');
    doc.setTextColor(0, 150, 0);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(`✓ PAGADA - Fecha de pago: ${factura.fecha_pago}`, 105, 273, { align: 'center' });
  }
  
  return doc;
};

/**
 * Descarga el PDF de la factura
 */
export const descargarPDFFactura = (factura) => {
  try {
    const doc = generarPDFFactura(factura);
    const nombreArchivo = `Factura_${factura.numero}_${factura.periodo.replace(/\s/g, '_')}.pdf`;
    doc.save(nombreArchivo);
    return { exito: true };
  } catch (error) {
    console.error('Error al generar PDF:', error);
    return { exito: false, error: error.message };
  }
};
