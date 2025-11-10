/**
 * Generador de PDF para Reportes y Métricas
 * Genera un reporte completo de las estadísticas del sistema
 */

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import logoCooperativa from '../assets/brand/logo.jpeg';

/**
 * Genera el PDF del reporte de métricas
 */
export const generarPDFMetricas = (dashboard, metricasAvanzadas, periodo) => {
  const doc = new jsPDF();
  
  // Configuración de colores
  const colorPrimario = [41, 128, 185]; // Azul
  const colorSecundario = [52, 73, 94]; // Gris oscuro
  const colorExito = [39, 174, 96]; // Verde
  const colorAdvertencia = [243, 156, 18]; // Naranja
  const colorPeligro = [231, 76, 60]; // Rojo
  const colorMorado = [155, 89, 182]; // Morado
  
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
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('COOPERATIVA ELÉCTRICA', 105, 18, { align: 'center' });
  doc.setFontSize(14);
  doc.text('GOBERNADOR UGARTE', 105, 28, { align: 'center' });
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Reporte de Métricas y Estadísticas', 105, 36, { align: 'center' });
  
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
  doc.text(`Período: ${obtenerTextoPeriodo(periodo)}`, 15, yPos + 5);
  
  yPos += 15;
  
  // ===== RESUMEN GENERAL =====
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...colorPrimario);
  doc.text('RESUMEN GENERAL', 15, yPos);
  
  yPos += 8;
  
  // Tabla de métricas principales
  const metricas = dashboard || {};
  const operariosActivos = metricasAvanzadas?.operarios_activos || {};
  const estadosReclamos = metricasAvanzadas?.estados_reclamos || {};
  
  // Usar datos de metricasAvanzadas si están disponibles Y tienen datos, sino del dashboard
  // Verificar que no solo exista sino que tenga valor > 0 o usar siempre dashboard para consistencia
  const totalReclamosResumen = (estadosReclamos?.total !== undefined && estadosReclamos.total > 0) 
    ? estadosReclamos.total 
    : (metricas.reclamos?.total || 0);
  const reclamosResueltosResumen = (estadosReclamos?.total !== undefined && estadosReclamos.total > 0) 
    ? estadosReclamos.resueltos 
    : (metricas.reclamos?.resueltos || 0);
  const reclamosPendientesResumen = (estadosReclamos?.total !== undefined && estadosReclamos.total > 0) 
    ? estadosReclamos.pendientes 
    : (metricas.reclamos?.pendientes || 0);
  const reclamosEnProcesoResumen = (estadosReclamos?.total !== undefined && estadosReclamos.total > 0) 
    ? estadosReclamos.en_proceso 
    : (metricas.reclamos?.en_proceso || 0);
  
  autoTable(doc, {
    startY: yPos,
    head: [['Categoría', 'Total', 'Activos/Resueltos', 'Pendientes/En Proceso']],
    body: [
      [
        'Socios',
        `${metricas.socios?.total || 0}`,
        `${metricas.socios?.activos || 0} activos`,
        `+${metricas.socios?.nuevos_ultimo_mes || 0} nuevos`
      ],
      [
        'Reclamos',
        `${totalReclamosResumen}`,
        `${reclamosResueltosResumen} resueltos`,
        `${reclamosPendientesResumen} pend. / ${reclamosEnProcesoResumen} proc.`
      ],
      [
        'Operarios',
        `${operariosActivos.total_operarios || 0}`,
        `${operariosActivos.con_ordenes || 0} con OTs`,
        `${operariosActivos.inactivos || 0} disponibles`
      ]
    ],
    theme: 'striped',
    headStyles: {
      fillColor: colorPrimario,
      fontSize: 10,
      fontStyle: 'bold'
    },
    bodyStyles: {
      fontSize: 9
    },
    columnStyles: {
      0: { cellWidth: 50, fontStyle: 'bold' },
      1: { cellWidth: 35, halign: 'center' },
      2: { cellWidth: 50, halign: 'center' },
      3: { cellWidth: 45, halign: 'center' }
    },
    margin: { left: 15, right: 15 }
  });
  
  yPos = doc.lastAutoTable.finalY + 12;
  
  // ===== FACTURACIÓN =====
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...colorExito);
  doc.text('ANÁLISIS DE FACTURACIÓN', 15, yPos);
  
  yPos += 8;
  
  const facturacion = metricas.facturacion || {};
  const facturacionAvanzada = metricasAvanzadas?.facturacion || {};
  
  // Usar datos de metricasAvanzadas si están disponibles Y tienen datos, sino del dashboard (general)
  const recaudado = (facturacionAvanzada.total_facturas !== undefined && facturacionAvanzada.total_facturas > 0) 
    ? facturacionAvanzada.recaudado 
    : (facturacion.recaudado_ultimo_mes || 0);
  const pendiente = (facturacionAvanzada.total_facturas !== undefined && facturacionAvanzada.total_facturas > 0) 
    ? facturacionAvanzada.pendiente_cobro 
    : (facturacion.monto_pendiente || 0);
  const totalFacturas = (facturacionAvanzada.total_facturas !== undefined && facturacionAvanzada.total_facturas > 0) 
    ? facturacionAvanzada.total_facturas 
    : (facturacion.total || 0);
  const facturasPendientes = (facturacionAvanzada.total_facturas !== undefined && facturacionAvanzada.total_facturas > 0) 
    ? facturacionAvanzada.facturas_pendientes 
    : (facturacion.pendientes || 0);
  const tasaCobro = (facturacionAvanzada.total_facturas !== undefined && facturacionAvanzada.total_facturas > 0) 
    ? facturacionAvanzada.tasa_cobro 
    : (totalFacturas > 0 ? (((totalFacturas - facturasPendientes) / totalFacturas) * 100).toFixed(1) : 0);
  
  autoTable(doc, {
    startY: yPos,
    body: [
      ['Recaudado este mes', `$ ${recaudado.toLocaleString('es-AR')}`],
      ['Pendiente de cobro', `$ ${pendiente.toLocaleString('es-AR')}`],
      ['Facturas emitidas', `${totalFacturas}`],
      ['Facturas pendientes', `${facturasPendientes}`],
      ['Tasa de cobro', `${tasaCobro}%`]
    ],
    theme: 'plain',
    styles: {
      fontSize: 10,
      cellPadding: 3
    },
    columnStyles: {
      0: { cellWidth: 90, fontStyle: 'bold' },
      1: { cellWidth: 90, halign: 'right', fontStyle: 'bold', textColor: colorExito }
    },
    margin: { left: 15, right: 15 }
  });
  
  yPos = doc.lastAutoTable.finalY + 12;
  
  // ===== ESTADO DE RECLAMOS =====
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...colorAdvertencia);
  doc.text('ESTADO DE RECLAMOS', 15, yPos);
  
  yPos += 8;
  
  // Usar los mismos datos consolidados que en el resumen
  const totalReclamos = totalReclamosResumen || 1;
  const pendientes = reclamosPendientesResumen || 0;
  const enProceso = reclamosEnProcesoResumen || 0;
  const resueltos = reclamosResueltosResumen || 0;
  const tasaResolucion = ((resueltos / totalReclamos) * 100).toFixed(1);
  
  autoTable(doc, {
    startY: yPos,
    head: [['Estado', 'Cantidad', 'Porcentaje']],
    body: [
      ['Pendientes', `${pendientes}`, `${((pendientes / totalReclamos) * 100).toFixed(1)}%`],
      ['En Proceso', `${enProceso}`, `${((enProceso / totalReclamos) * 100).toFixed(1)}%`],
      ['Resueltos', `${resueltos}`, `${tasaResolucion}%`],
      ['TOTAL', `${totalReclamos}`, '100%']
    ],
    theme: 'grid',
    headStyles: {
      fillColor: colorAdvertencia,
      fontSize: 10,
      fontStyle: 'bold'
    },
    bodyStyles: {
      fontSize: 9
    },
    columnStyles: {
      0: { cellWidth: 60 },
      1: { cellWidth: 60, halign: 'center' },
      2: { cellWidth: 60, halign: 'center', fontStyle: 'bold' }
    },
    margin: { left: 15, right: 15 },
    didParseCell: function(data) {
      if (data.row.index === 3) {
        data.cell.styles.fontStyle = 'bold';
        data.cell.styles.fillColor = [240, 240, 240];
      }
    }
  });
  
  yPos = doc.lastAutoTable.finalY + 12;
  
  // Verificar si necesitamos nueva página
  if (yPos > 240) {
    doc.addPage();
    yPos = 20;
  }
  
  // ===== MÉTRICAS DE DESEMPEÑO =====
  if (metricasAvanzadas) {
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...colorPrimario);
    doc.text('INDICADORES DE DESEMPEÑO', 15, yPos);
    
    yPos += 8;
    
    const tiempoResolucion = metricasAvanzadas.tiempo_resolucion || {};
    const eficiencia = metricasAvanzadas.eficiencia_operativa || {};
    const satisfaccion = metricasAvanzadas.satisfaccion_socio || {};
    
    autoTable(doc, {
      startY: yPos,
      head: [['Indicador', 'Valor Actual', 'Cambio', 'Evaluación']],
      body: [
        [
          'Tiempo Promedio Resolución',
          `${tiempoResolucion.promedio_dias || 0} días`,
          `${tiempoResolucion.cambio_porcentual || 0}%`,
          tiempoResolucion.promedio_dias <= 2 ? 'Excelente' : tiempoResolucion.promedio_dias <= 5 ? 'Bueno' : 'Mejorable'
        ],
        [
          'Eficiencia Operativa',
          `${eficiencia.porcentaje || 0}%`,
          `${eficiencia.cambio_porcentual || 0}%`,
          eficiencia.porcentaje >= 80 ? 'Excelente' : eficiencia.porcentaje >= 60 ? 'Bueno' : 'Bajo'
        ],
        [
          'Satisfacción de Socios',
          `${satisfaccion.calificacion || 0}/5.0`,
          `${satisfaccion.cambio_porcentual || 0}%`,
          satisfaccion.calificacion >= 4 ? 'Muy Bueno' : satisfaccion.calificacion >= 3 ? 'Aceptable' : 'Mejorar'
        ]
      ],
      theme: 'striped',
      headStyles: {
        fillColor: colorPrimario,
        fontSize: 9,
        fontStyle: 'bold'
      },
      bodyStyles: {
        fontSize: 9
      },
      columnStyles: {
        0: { cellWidth: 60 },
        1: { cellWidth: 35, halign: 'center', fontStyle: 'bold' },
        2: { cellWidth: 25, halign: 'center' },
        3: { cellWidth: 35, halign: 'center' }
      },
      margin: { left: 15, right: 15 }
    });
    
    yPos = doc.lastAutoTable.finalY + 8;
    
    // Detalles adicionales
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text(`• Reclamos resueltos en el período: ${tiempoResolucion.total_resueltos || 0}`, 15, yPos);
    yPos += 5;
    doc.text(`• Total de valoraciones recibidas: ${satisfaccion.total_valoraciones || 0}`, 15, yPos);
    yPos += 5;
    doc.text(`• Reclamos procesados: ${eficiencia.reclamos_resueltos || 0} de ${eficiencia.total_reclamos || 0}`, 15, yPos);
    
    yPos += 12;
  }
  
  // ===== OPERARIOS Y RECURSOS =====
  if (yPos > 240) {
    doc.addPage();
    yPos = 20;
  }
  
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...colorMorado);
  doc.text('GESTIÓN DE OPERARIOS', 15, yPos);
  
  yPos += 8;
  
  autoTable(doc, {
    startY: yPos,
    body: [
      ['Total de operarios', `${operariosActivos.total_operarios || 0}`],
      ['Operarios disponibles (sin OTs)', `${operariosActivos.inactivos || 0}`],
      ['Operarios con OTs activas', `${operariosActivos.con_ordenes || 0}`],
      ['Total de OTs activas', `${operariosActivos.total_ots_activas || 0}`]
    ],
    theme: 'plain',
    styles: {
      fontSize: 10,
      cellPadding: 3
    },
    columnStyles: {
      0: { cellWidth: 100, fontStyle: 'bold' },
      1: { cellWidth: 80, halign: 'right', fontStyle: 'bold', textColor: colorMorado }
    },
    margin: { left: 15, right: 15 }
  });
  
  yPos = doc.lastAutoTable.finalY + 12;
  
  // ===== DISTRIBUCIÓN DE RECLAMOS POR TIPO =====
  if (metricas.reclamos_por_tipo && metricas.reclamos_por_tipo.length > 0) {
    // Verificar si necesitamos una nueva página
    if (yPos > 230) {
      doc.addPage();
      yPos = 20;
    }
    
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...colorPrimario);
    doc.text('DISTRIBUCIÓN DE RECLAMOS POR TIPO', 15, yPos);
    
    yPos += 8;
    
    const reclamosPorTipo = metricas.reclamos_por_tipo.map(item => [
      item.tipo || 'Sin categoría',
      `${item.cantidad || 0}`,
      `${((item.cantidad / metricas.reclamos?.total || 1) * 100).toFixed(1)}%`
    ]);
    
    autoTable(doc, {
      startY: yPos,
      head: [['Tipo de Reclamo', 'Cantidad', 'Porcentaje']],
      body: reclamosPorTipo,
      theme: 'striped',
      headStyles: {
        fillColor: colorSecundario,
        fontSize: 10,
        fontStyle: 'bold'
      },
      bodyStyles: {
        fontSize: 9
      },
      columnStyles: {
        0: { cellWidth: 100 },
        1: { cellWidth: 40, halign: 'center' },
        2: { cellWidth: 40, halign: 'center' }
      },
      margin: { left: 15, right: 15 }
    });
    
    yPos = doc.lastAutoTable.finalY + 10;
  }
  
  // ===== PIE DE PÁGINA =====
  const totalPaginas = doc.internal.pages.length - 1;
  for (let i = 1; i <= totalPaginas; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text(
      `Página ${i} de ${totalPaginas}`,
      105,
      287,
      { align: 'center' }
    );
    doc.text(
      'Este documento es generado automáticamente por el Sistema de Gestión de la Cooperativa',
      105,
      292,
      { align: 'center' }
    );
  }
  
  // Guardar el PDF
  const nombreArchivo = `Reporte_Metricas_${periodo}_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(nombreArchivo);
};

/**
 * Obtener texto descriptivo del período
 */
const obtenerTextoPeriodo = (periodo) => {
  switch(periodo) {
    case 'mes_actual': return 'Mes Actual';
    case '7dias': return 'Últimos 7 Días';
    case '30dias': return 'Últimos 30 Días';
    case '90dias': return 'Últimos 90 Días';
    case 'año': return 'Este Año';
    default: return periodo;
  }
};
