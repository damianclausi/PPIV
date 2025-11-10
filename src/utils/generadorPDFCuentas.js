/**
 * Generador de PDF para Reporte de Cuentas
 * Genera un reporte completo del listado de cuentas del sistema
 */

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import logoCooperativa from '../assets/brand/logo.jpeg';

/**
 * Genera el PDF del reporte de cuentas
 */
export const generarPDFCuentas = (cuentas) => {
  const doc = new jsPDF('l', 'mm', 'a4'); // Formato horizontal para más columnas
  
  // Configuración de colores
  const colorPrimario = [41, 128, 185]; // Azul
  const colorSecundario = [52, 73, 94]; // Gris oscuro
  const colorExito = [39, 174, 96]; // Verde
  const colorPeligro = [231, 76, 60]; // Rojo
  
  let yPos = 20;
  
  // ===== ENCABEZADO =====
  doc.setFillColor(...colorPrimario);
  doc.rect(0, 0, 297, 45, 'F'); // Ancho de A4 horizontal
  
  // Logo de la cooperativa
  try {
    doc.addImage(logoCooperativa, 'JPEG', 15, 8, 30, 30);
  } catch (error) {
    console.warn('No se pudo cargar el logo:', error);
  }
  
  // Nombre de la cooperativa
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('COOPERATIVA ELÉCTRICA', 148.5, 18, { align: 'center' });
  doc.setFontSize(14);
  doc.text('GOBERNADOR UGARTE', 148.5, 28, { align: 'center' });
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Reporte de Cuentas del Sistema', 148.5, 36, { align: 'center' });
  
  yPos = 55;
  
  // ===== INFORMACIÓN DEL REPORTE =====
  doc.setTextColor(...colorSecundario);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  
  const fechaActual = new Date().toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  
  doc.text(`Fecha de generación: ${fechaActual}`, 15, yPos);
  doc.text(`Total de cuentas en el reporte: ${cuentas.length}`, 15, yPos + 5);
  
  yPos += 15;
  
  // ===== RESUMEN ESTADÍSTICO =====
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...colorPrimario);
  doc.text('RESUMEN ESTADÍSTICO', 15, yPos);
  
  yPos += 8;
  
  // Calcular estadísticas
  const totalCuentas = cuentas.length;
  const cuentasActivas = cuentas.filter(c => c.activa).length;
  const cuentasInactivas = cuentas.filter(c => !c.activa).length;
  const cuentasPrincipales = cuentas.filter(c => c.principal).length;
  const totalDeuda = cuentas.reduce((sum, c) => sum + (parseFloat(c.deuda) || 0), 0);
  const cuentasConDeuda = cuentas.filter(c => parseFloat(c.deuda) > 0).length;
  
  // Tabla de resumen
  autoTable(doc, {
    startY: yPos,
    head: [['Métrica', 'Valor', 'Porcentaje']],
    body: [
      ['Total de Cuentas', totalCuentas.toString(), '100%'],
      ['Cuentas Activas', cuentasActivas.toString(), `${((cuentasActivas / totalCuentas) * 100).toFixed(1)}%`],
      ['Cuentas Inactivas', cuentasInactivas.toString(), `${((cuentasInactivas / totalCuentas) * 100).toFixed(1)}%`],
      ['Cuentas Principales', cuentasPrincipales.toString(), `${((cuentasPrincipales / totalCuentas) * 100).toFixed(1)}%`],
      ['Cuentas con Deuda', cuentasConDeuda.toString(), `${((cuentasConDeuda / totalCuentas) * 100).toFixed(1)}%`],
      ['Deuda Total Acumulada', `$${totalDeuda.toFixed(2)}`, '-']
    ],
    headStyles: {
      fillColor: colorPrimario,
      textColor: 255,
      fontSize: 10,
      fontStyle: 'bold'
    },
    bodyStyles: {
      fontSize: 9
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245]
    },
    margin: { left: 15, right: 15 }
  });
  
  yPos = doc.lastAutoTable.finalY + 15;
  
  // ===== LISTADO DETALLADO DE CUENTAS =====
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...colorPrimario);
  doc.text('LISTADO DETALLADO DE CUENTAS', 15, yPos);
  
  yPos += 8;
  
  // Preparar datos para la tabla
  const datosCuentas = cuentas.map(cuenta => {
    return [
      cuenta.numero_cuenta || '-',
      `${cuenta.socio_nombre || ''} ${cuenta.socio_apellido || ''}`.trim(),
      cuenta.direccion || '-',
      (cuenta.localidad || 'Gobernador Ugarte').substring(0, 20),
      cuenta.servicio_nombre || '-',
      cuenta.activa ? 'Activa' : 'Inactiva',
      cuenta.principal ? 'Sí' : 'No',
      `$${parseFloat(cuenta.deuda || 0).toFixed(2)}`
    ];
  });
  
  // Tabla de cuentas
  autoTable(doc, {
    startY: yPos,
    head: [['N° Cuenta', 'Socio', 'Dirección', 'Localidad', 'Servicio', 'Estado', 'Principal', 'Deuda']],
    body: datosCuentas,
    headStyles: {
      fillColor: colorPrimario,
      textColor: 255,
      fontSize: 9,
      fontStyle: 'bold',
      halign: 'center'
    },
    bodyStyles: {
      fontSize: 8,
      cellPadding: 2
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 22 },  // N° Cuenta
      1: { halign: 'left', cellWidth: 40 },    // Socio
      2: { halign: 'left', cellWidth: 50 },    // Dirección
      3: { halign: 'left', cellWidth: 30 },    // Localidad
      4: { halign: 'left', cellWidth: 30 },    // Servicio
      5: { halign: 'center', cellWidth: 20 },  // Estado
      6: { halign: 'center', cellWidth: 18 },  // Principal
      7: { halign: 'right', cellWidth: 25 }    // Deuda
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245]
    },
    margin: { left: 15, right: 15 },
    // Estilos condicionales para filas
    didParseCell: function(data) {
      // Colorear celdas de estado
      if (data.column.index === 5 && data.cell.section === 'body') {
        if (data.cell.raw === 'Activa') {
          data.cell.styles.textColor = colorExito;
          data.cell.styles.fontStyle = 'bold';
        } else if (data.cell.raw === 'Inactiva') {
          data.cell.styles.textColor = colorPeligro;
          data.cell.styles.fontStyle = 'bold';
        }
      }
      
      // Colorear celdas de deuda
      if (data.column.index === 7 && data.cell.section === 'body') {
        const deuda = parseFloat(data.cell.raw.replace('$', ''));
        if (deuda > 0) {
          data.cell.styles.textColor = colorPeligro;
          data.cell.styles.fontStyle = 'bold';
        } else {
          data.cell.styles.textColor = colorExito;
        }
      }
      
      // Resaltar cuentas principales
      if (data.column.index === 6 && data.cell.section === 'body' && data.cell.raw === 'Sí') {
        data.cell.styles.textColor = colorPrimario;
        data.cell.styles.fontStyle = 'bold';
      }
    }
  });
  
  // ===== PIE DE PÁGINA EN TODAS LAS PÁGINAS =====
  const totalPaginas = doc.internal.getNumberOfPages();
  
  for (let i = 1; i <= totalPaginas; i++) {
    doc.setPage(i);
    
    // Línea separadora
    doc.setDrawColor(...colorSecundario);
    doc.setLineWidth(0.5);
    doc.line(15, 195, 282, 195);
    
    // Pie de página
    doc.setFontSize(8);
    doc.setTextColor(...colorSecundario);
    doc.setFont('helvetica', 'normal');
    doc.text('Cooperativa Eléctrica Gobernador Ugarte', 15, 200);
    doc.text(`Página ${i} de ${totalPaginas}`, 282, 200, { align: 'right' });
  }
  
  // ===== GUARDAR PDF =====
  const nombreArchivo = `Reporte_Cuentas_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(nombreArchivo);
};

/**
 * Genera un PDF filtrado por estado de cuenta
 */
export const generarPDFCuentasPorEstado = (cuentas, estado) => {
  const cuentasFiltradas = cuentas.filter(c => 
    estado === 'todas' ? true : c.activa === (estado === 'activas')
  );
  generarPDFCuentas(cuentasFiltradas);
};

/**
 * Genera un PDF solo con cuentas que tienen deuda
 */
export const generarPDFCuentasConDeuda = (cuentas) => {
  const cuentasConDeuda = cuentas.filter(c => parseFloat(c.deuda) > 0);
  generarPDFCuentas(cuentasConDeuda);
};
