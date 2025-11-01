/**
 * Panel de Reportes y Métricas - Administrador
 * Diseño basado en Figma con gráficos y estadísticas del sistema
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDashboard, useMetricasAvanzadas } from '../../hooks/useAdministrador.js';
import CooperativaLayout from '../layout/CooperativaLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Skeleton } from '../ui/skeleton';
import { 
  Users, 
  AlertCircle, 
  DollarSign,
  TrendingUp,
  TrendingDown,
  Calendar,
  FileText,
  CheckCircle,
  Clock,
  XCircle,
  Activity,
  BarChart3
} from 'lucide-react';

export default function Reportes() {
  const navigate = useNavigate();
  const { dashboard, cargando } = useDashboard();
  const [periodoSeleccionado, setPeriodoSeleccionado] = useState('mes_actual');
  const { metricas: metricasAvanzadas, cargando: cargandoMetricas } = useMetricasAvanzadas(periodoSeleccionado);

  // Calcular métricas y porcentajes
  const calcularCambio = (actual, anterior) => {
    if (!anterior || anterior === 0) return 0;
    return ((actual - anterior) / anterior * 100).toFixed(1);
  };

  // Obtener texto descriptivo del período
  const obtenerTextoPeriodo = () => {
    switch(periodoSeleccionado) {
      case 'mes_actual': return 'mes actual';
      case '7dias': return 'últimos 7 días';
      case '30dias': return 'últimos 30 días';
      case '90dias': return 'últimos 90 días';
      case 'año': return 'este año';
      default: return periodoSeleccionado;
    }
  };

  const obtenerTextoPeriodoAnterior = () => {
    switch(periodoSeleccionado) {
      case 'mes_actual': return 'mes anterior';
      case '7dias': return '7 días anteriores';
      case '30dias': return '30 días anteriores';
      case '90dias': return '90 días anteriores';
      case 'año': return 'año anterior';
      default: return 'período anterior';
    }
  };

  if (cargando || cargandoMetricas) {
    return (
      <CooperativaLayout titulo="Panel de Métricas">
        <div className="min-h-screen p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            <Skeleton className="h-12 w-64" />
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Skeleton className="h-40" />
              <Skeleton className="h-40" />
              <Skeleton className="h-40" />
              <Skeleton className="h-40" />
            </div>
          </div>
        </div>
      </CooperativaLayout>
    );
  }

  // Usar métricas reales calculadas en el backend
  const tiempoResolucion = metricasAvanzadas?.tiempo_resolucion || {};
  const eficiencia = metricasAvanzadas?.eficiencia_operativa || {};
  const satisfaccion = metricasAvanzadas?.satisfaccion_socio || {};
  const operariosActivos = metricasAvanzadas?.operarios_activos || {};

  // Datos de ejemplo para las métricas (integrar con API real)
  const metricas = {
    socios: {
      total: dashboard?.socios?.total || 0,
      activos: dashboard?.socios?.activos || 0,
      nuevos: dashboard?.socios?.nuevos_ultimo_mes || 0,
      cambio: calcularCambio(dashboard?.socios?.nuevos_ultimo_mes || 0, 5) // Comparar con mes anterior
    },
    reclamos: {
      total: dashboard?.reclamos?.total || 0,
      pendientes: dashboard?.reclamos?.pendientes || 0,
      enProceso: dashboard?.reclamos?.en_proceso || 0,
      resueltos: dashboard?.reclamos?.resueltos || 0,
      cambio: calcularCambio(dashboard?.reclamos?.resueltos || 0, dashboard?.reclamos?.total || 1)
    },
    facturacion: {
      totalMes: dashboard?.facturacion?.recaudado_ultimo_mes || 0,
      pendiente: dashboard?.facturacion?.monto_pendiente || 0,
      facturasPendientes: dashboard?.facturacion?.pendientes || 0,
      totalFacturas: dashboard?.facturacion?.total || 0,
      cambio: 12.5 // Calcular con datos reales
    },
    empleados: {
      total: dashboard?.empleados?.total || 0,
      operarios: dashboard?.empleados?.operarios || 0,
      supervisores: dashboard?.empleados?.supervisores || 0,
      inactivos: operariosActivos?.inactivos || 0, // Operarios sin OTs asignadas
      conOrdenes: operariosActivos?.con_ordenes || 0,
      totalOtsActivas: operariosActivos?.total_ots_activas || 0
    }
  };

  return (
    <CooperativaLayout titulo="Panel de Métricas">
      <div className="min-h-screen p-8">
        <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Panel de Métricas</h1>
            <p className="text-gray-600 mt-1">
              Estadísticas y reportes del sistema - 
              <span className="font-semibold text-blue-600 ml-1">
                {obtenerTextoPeriodo()}
              </span>
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Calendar className="h-4 w-4 mr-2" />
              Exportar PDF
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigate('/dashboard/administrador')}>
              Volver
            </Button>
          </div>
        </div>

        {/* Selector de Período */}
        <div className="flex gap-2 items-center">
          <span className="text-sm font-medium text-gray-700 mr-2">Período:</span>
          <Button 
            variant={periodoSeleccionado === 'mes_actual' ? 'default' : 'outline'} 
            size="sm"
            onClick={() => setPeriodoSeleccionado('mes_actual')}
          >
            Mes actual
          </Button>
          <Button 
            variant={periodoSeleccionado === '7dias' ? 'default' : 'outline'} 
            size="sm"
            onClick={() => setPeriodoSeleccionado('7dias')}
          >
            Últimos 7 días
          </Button>
          <Button 
            variant={periodoSeleccionado === '30dias' ? 'default' : 'outline'} 
            size="sm"
            onClick={() => setPeriodoSeleccionado('30dias')}
          >
            Últimos 30 días
          </Button>
          <Button 
            variant={periodoSeleccionado === '90dias' ? 'default' : 'outline'} 
            size="sm"
            onClick={() => setPeriodoSeleccionado('90dias')}
          >
            Últimos 90 días
          </Button>
          <Button 
            variant={periodoSeleccionado === 'año' ? 'default' : 'outline'} 
            size="sm"
            onClick={() => setPeriodoSeleccionado('año')}
          >
            Este año
          </Button>
        </div>

        {/* Métricas Principales - 4 columnas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Socios */}
          <Card className="relative overflow-hidden border-l-4 border-l-blue-500">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-500">
                  Total Socios
                </CardTitle>
                <div className="p-2 bg-blue-50 rounded-lg">
                  <Users className="h-5 w-5 text-blue-600" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-3xl font-bold text-gray-900 mb-2">{metricas.socios.total}</div>
              <div className="flex items-center gap-1 text-sm">
                <TrendingUp className="h-4 w-4 text-green-600" />
                <span className="text-green-600 font-medium">+{metricas.socios.nuevos}</span>
                <span className="text-gray-500">nuevos este mes</span>
              </div>
              <div className="mt-3 text-xs text-gray-600">
                <span className="font-semibold text-blue-600">{metricas.socios.activos}</span> activos
              </div>
            </CardContent>
          </Card>

          {/* Reclamos */}
          <Card className="relative overflow-hidden border-l-4 border-l-orange-500">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-500">
                  Reclamos
                </CardTitle>
                <div className="p-2 bg-orange-50 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-orange-600" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-3xl font-bold text-gray-900 mb-2">{metricas.reclamos.total}</div>
              <div className="flex items-center gap-1 text-sm">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-green-600 font-medium">{metricas.reclamos.resueltos}</span>
                <span className="text-gray-500">resueltos</span>
              </div>
              <div className="mt-3 flex gap-4 text-xs text-gray-600">
                <div>
                  <span className="font-semibold text-orange-600">{metricas.reclamos.pendientes}</span> pendientes
                </div>
                <div>
                  <span className="font-semibold text-yellow-600">{metricas.reclamos.enProceso}</span> en proceso
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Facturación */}
          <Card className="relative overflow-hidden border-l-4 border-l-green-500">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-500">
                  Recaudación Mensual
                </CardTitle>
                <div className="p-2 bg-green-50 rounded-lg">
                  <DollarSign className="h-5 w-5 text-green-600" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-3xl font-bold text-gray-900 mb-2">
                ${metricas.facturacion.totalMes.toLocaleString('es-AR')}
              </div>
              <div className="flex items-center gap-1 text-sm">
                <TrendingUp className="h-4 w-4 text-green-600" />
                <span className="text-green-600 font-medium">+{metricas.facturacion.cambio}%</span>
                <span className="text-gray-500">vs mes anterior</span>
              </div>
              <div className="mt-3 text-xs text-gray-600">
                <span className="font-semibold text-orange-600">${metricas.facturacion.pendiente.toLocaleString('es-AR')}</span> pendiente
              </div>
            </CardContent>
          </Card>

          {/* Empleados */}
          <Card 
            className="relative overflow-hidden border-l-4 border-l-purple-500 cursor-pointer transition-all hover:shadow-lg hover:scale-[1.02]"
            onClick={() => navigate('/dashboard/admin/operarios-estado')}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-500">
                  Operarios Inactivos
                </CardTitle>
                <div className="p-2 bg-purple-50 rounded-lg">
                  <Activity className="h-5 w-5 text-purple-600" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-3xl font-bold text-gray-900 mb-2">{metricas.empleados.inactivos}</div>
              <div className="flex items-center gap-1 text-sm">
                <Clock className="h-4 w-4 text-gray-600" />
                <span className="text-gray-600 font-medium">sin órdenes asignadas</span>
              </div>
              <div className="mt-3 flex gap-4 text-xs text-gray-600">
                <div>
                  <span className="font-semibold text-purple-600">{metricas.empleados.conOrdenes}</span> con OTs
                </div>
                <div>
                  <span className="font-semibold text-gray-500">{metricas.empleados.totalOtsActivas}</span> OTs activas
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Gráficos y Análisis - 2 columnas */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Estado de Reclamos - Gráfico */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-base">
                <div className="p-2 bg-orange-50 rounded-lg">
                  <BarChart3 className="h-4 w-4 text-orange-600" />
                </div>
                Estado de Reclamos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-5">
                {/* Barra Pendientes */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-red-500"></div>
                      <span className="text-sm text-gray-700">Pendientes</span>
                    </div>
                    <span className="text-sm font-bold text-gray-900">{metricas.reclamos.pendientes}</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2.5">
                    <div 
                      className="bg-red-500 h-2.5 rounded-full transition-all duration-500"
                      style={{ 
                        width: `${(metricas.reclamos.pendientes / metricas.reclamos.total * 100) || 0}%` 
                      }}
                    ></div>
                  </div>
                </div>

                {/* Barra En Proceso */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                      <span className="text-sm text-gray-700">En Proceso</span>
                    </div>
                    <span className="text-sm font-bold text-gray-900">{metricas.reclamos.enProceso}</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2.5">
                    <div 
                      className="bg-yellow-500 h-2.5 rounded-full transition-all duration-500"
                      style={{ 
                        width: `${(metricas.reclamos.enProceso / metricas.reclamos.total * 100) || 0}%` 
                      }}
                    ></div>
                  </div>
                </div>

                {/* Barra Resueltos */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-500"></div>
                      <span className="text-sm text-gray-700">Resueltos</span>
                    </div>
                    <span className="text-sm font-bold text-gray-900">{metricas.reclamos.resueltos}</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2.5">
                    <div 
                      className="bg-green-500 h-2.5 rounded-full transition-all duration-500"
                      style={{ 
                        width: `${(metricas.reclamos.resueltos / metricas.reclamos.total * 100) || 0}%` 
                      }}
                    ></div>
                  </div>
                </div>

                {/* Resumen */}
                <div className="pt-4 border-t border-gray-100 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Total de reclamos</span>
                    <span className="font-bold text-gray-900">{metricas.reclamos.total}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Tasa de resolución</span>
                    <span className="font-bold text-green-600">
                      {((metricas.reclamos.resueltos / metricas.reclamos.total * 100) || 0).toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Facturación - Análisis */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-base">
                <div className="p-2 bg-green-50 rounded-lg">
                  <DollarSign className="h-4 w-4 text-green-600" />
                </div>
                Análisis de Facturación
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Recaudado */}
                <div className="flex items-center justify-between p-4 bg-green-50 rounded-xl border border-green-100">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Recaudado este mes</p>
                    <p className="text-2xl font-bold text-green-700">
                      ${metricas.facturacion.totalMes.toLocaleString('es-AR')}
                    </p>
                  </div>
                  <div className="p-3 bg-white rounded-lg shadow-sm">
                    <TrendingUp className="h-6 w-6 text-green-600" />
                  </div>
                </div>

                {/* Pendiente */}
                <div className="flex items-center justify-between p-4 bg-orange-50 rounded-xl border border-orange-100">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Pendiente de cobro</p>
                    <p className="text-2xl font-bold text-orange-700">
                      ${metricas.facturacion.pendiente.toLocaleString('es-AR')}
                    </p>
                  </div>
                  <div className="p-3 bg-white rounded-lg shadow-sm">
                    <Clock className="h-6 w-6 text-orange-600" />
                  </div>
                </div>

                {/* Estadísticas */}
                <div className="pt-4 border-t border-gray-100 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Facturas emitidas</span>
                    <span className="font-bold text-gray-900">{metricas.facturacion.totalFacturas}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Facturas pendientes</span>
                    <span className="font-bold text-orange-600">{metricas.facturacion.facturasPendientes}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Tasa de cobro</span>
                    <span className="font-bold text-green-600">
                      {(((metricas.facturacion.totalFacturas - metricas.facturacion.facturasPendientes) / metricas.facturacion.totalFacturas * 100) || 0).toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Indicadores Adicionales - 3 columnas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Promedio de Resolución */}
          <Card className={`border-t-4 border-t-blue-500 transition-opacity duration-200 ${cargandoMetricas ? 'opacity-50' : 'opacity-100'}`}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-500 flex items-center justify-between">
                Tiempo Promedio de Resolución
                {cargandoMetricas && <Clock className="h-4 w-4 animate-spin text-blue-500" />}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900 mb-3">
                {tiempoResolucion.promedio_dias || 0} días
              </div>
              <div className="flex items-center gap-1 text-sm">
                {tiempoResolucion.mejor ? (
                  <>
                    <TrendingDown className="h-4 w-4 text-green-600" />
                    <span className="text-green-600 font-medium">
                      {Math.abs(tiempoResolucion.cambio_porcentual || 0)}%
                    </span>
                    <span className="text-gray-500">mejor que {obtenerTextoPeriodoAnterior()}</span>
                  </>
                ) : (
                  <>
                    <TrendingUp className="h-4 w-4 text-red-600" />
                    <span className="text-red-600 font-medium">
                      +{Math.abs(tiempoResolucion.cambio_porcentual || 0)}%
                    </span>
                    <span className="text-gray-500">vs {obtenerTextoPeriodoAnterior()}</span>
                  </>
                )}
              </div>
              <div className="mt-2 text-xs text-gray-500">
                {tiempoResolucion.total_resueltos || 0} reclamos resueltos
              </div>
            </CardContent>
          </Card>

          {/* Satisfacción */}
          <Card className={`border-t-4 border-t-yellow-500 transition-opacity duration-200 ${cargandoMetricas ? 'opacity-50' : 'opacity-100'}`}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-500 flex items-center justify-between">
                Satisfacción del Socio
                {cargandoMetricas && <Clock className="h-4 w-4 animate-spin text-yellow-500" />}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900 mb-3">
                {satisfaccion.calificacion || 0}/5.0
              </div>
              <div className="flex items-center gap-1 text-sm">
                {(satisfaccion.cambio_porcentual || 0) >= 0 ? (
                  <>
                    <TrendingUp className="h-4 w-4 text-green-600" />
                    <span className="text-green-600 font-medium">
                      +{Math.abs(satisfaccion.cambio_porcentual || 0)}%
                    </span>
                  </>
                ) : (
                  <>
                    <TrendingDown className="h-4 w-4 text-red-600" />
                    <span className="text-red-600 font-medium">
                      {satisfaccion.cambio_porcentual}%
                    </span>
                  </>
                )}
                <span className="text-gray-500">vs {obtenerTextoPeriodoAnterior()}</span>
              </div>
              <div className="mt-2 text-xs text-gray-500">
                {satisfaccion.total_valoraciones || 0} valoraciones
              </div>
            </CardContent>
          </Card>

          {/* Eficiencia Operativa */}
          <Card className={`border-t-4 border-t-purple-500 transition-opacity duration-200 ${cargandoMetricas ? 'opacity-50' : 'opacity-100'}`}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-500 flex items-center justify-between">
                Eficiencia Operativa
                {cargandoMetricas && <Clock className="h-4 w-4 animate-spin text-purple-500" />}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900 mb-3">
                {eficiencia.porcentaje || 0}%
              </div>
              <div className="flex items-center gap-1 text-sm">
                {(eficiencia.cambio_porcentual || 0) >= 0 ? (
                  <>
                    <TrendingUp className="h-4 w-4 text-green-600" />
                    <span className="text-green-600 font-medium">
                      +{eficiencia.cambio_porcentual || 0}%
                    </span>
                  </>
                ) : (
                  <>
                    <TrendingDown className="h-4 w-4 text-red-600" />
                    <span className="text-red-600 font-medium">
                      {eficiencia.cambio_porcentual}%
                    </span>
                  </>
                )}
                <span className="text-gray-500">vs {obtenerTextoPeriodoAnterior()}</span>
              </div>
              <div className="mt-2 text-xs text-gray-500">
                {eficiencia.reclamos_resueltos || 0} de {eficiencia.total_reclamos || 0} reclamos
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
    </CooperativaLayout>
  );
}
