/**
 * Dashboard para Operarios
 * Vista Kanban con drag & drop para gestionar reclamos
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePerfil, useDashboard, useReclamos } from '../hooks/useOperario.js';
import { useAuth } from '../contexts/AuthContext.jsx';
import CooperativaLayout from './layout/CooperativaLayout';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Clock, MapPin, AlertTriangle, CheckCircle, LayoutGrid, List, Wrench } from 'lucide-react';
import operarioService from '../services/operarioService.js';
import { formatearFecha } from '../utils/formatters.js';

export default function DashboardOperario() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { perfil } = usePerfil();
  const { dashboard } = useDashboard();
  const { reclamos: reclamosOriginales, cargando: cargandoReclamos, recargar: recargarReclamos } = useReclamos({ limite: 50 });
  
  const [vistaKanban, setVistaKanban] = useState(true);
  const [reclamos, setReclamos] = useState([]);
  const [draggedItem, setDraggedItem] = useState(null);
  const [filtroPrioridad, setFiltroPrioridad] = useState('todas'); // 'todas', 'alta', 'media', 'baja'

  // Actualizar reclamos cuando cambian los originales
  React.useEffect(() => {
    if (reclamosOriginales) {
      console.log('📋 Reclamos recibidos:', reclamosOriginales.length);
      const otsItinerario = reclamosOriginales.filter(r => r.es_itinerario);
      console.log('🔍 OTs del itinerario:', otsItinerario.length);
      console.log('📊 Primera OT itinerario:', otsItinerario[0]);
      
      // Ver estados únicos de OTs itinerario
      const estadosOT = [...new Set(otsItinerario.map(r => r.estado_orden))];
      const estadosReclamo = [...new Set(otsItinerario.map(r => r.estado))];
      console.log('🎯 Estados de orden_trabajo en itinerarios:', estadosOT);
      console.log('🎯 Estados de reclamo en itinerarios:', estadosReclamo);
      
      // Contar por estado
      const asignadas = otsItinerario.filter(r => r.estado_orden === 'ASIGNADA').length;
      const enCurso = otsItinerario.filter(r => r.estado_orden === 'EN CURSO').length;
      console.log('📊 Distribución itinerarios - ASIGNADA:', asignadas, '| EN CURSO:', enCurso);
      
      // Contar reclamos NO itinerario
      const noItinerario = reclamosOriginales.filter(r => !r.es_itinerario).length;
      console.log('📋 Reclamos regulares (NO itinerario):', noItinerario);
      
      setReclamos(reclamosOriginales);
    }
  }, [reclamosOriginales]);

  const getPriorityBadge = (prioridad) => {
    const badges = {
      alta: <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Alta</Badge>,
      media: <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Media</Badge>,
      baja: <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Baja</Badge>
    };
    return badges[prioridad?.toLowerCase()] || badges.media;
  };

  const getStatusBadge = (estado) => {
    const estadoNormalizado = estado?.toLowerCase();
    const badges = {
      pendiente: <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Pendiente</Badge>,
      asignada: <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100">Asignada</Badge>,
      en_curso: <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">En Curso</Badge>,
      en_proceso: <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">En Curso</Badge>,
      resuelto: <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Resuelto</Badge>
    };
    return badges[estadoNormalizado] || badges.pendiente;
  };

  // Funciones de Drag & Drop
  const handleDragStart = (e, reclamo) => {
    setDraggedItem(reclamo);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e, nuevoEstado) => {
    e.preventDefault();
    if (!draggedItem) return;

    const estadoAnterior = draggedItem.estado;
    const estadoNuevo = nuevoEstado.toUpperCase();

    // Actualizar el estado localmente de forma optimista
    // Agregar timestamp de cambio para ordenar al final
    const ahora = new Date().toISOString();
    const reclamosActualizados = reclamos.map(r => 
      r.reclamo_id === draggedItem.reclamo_id 
        ? { ...r, estado: estadoNuevo, ultima_actualizacion: ahora }
        : r
    );

    // Ordenar: los que tienen ultima_actualizacion van al final de su columna
    const reclamosOrdenados = reclamosActualizados.sort((a, b) => {
      // Primero agrupar por estado
      if (a.estado !== b.estado) return 0;
      
      // Dentro del mismo estado, los recién movidos van al final
      if (a.ultima_actualizacion && !b.ultima_actualizacion) return 1;
      if (!a.ultima_actualizacion && b.ultima_actualizacion) return -1;
      
      // Si ambos tienen timestamp, ordenar por fecha (más reciente al final)
      if (a.ultima_actualizacion && b.ultima_actualizacion) {
        return new Date(a.ultima_actualizacion) - new Date(b.ultima_actualizacion);
      }
      
      // Por defecto, mantener orden original (por fecha_alta)
      return new Date(a.fecha_alta) - new Date(b.fecha_alta);
    });

    setReclamos(reclamosOrdenados);
    setDraggedItem(null);
    
    try {
      // Actualizar en el backend
      await operarioService.actualizarEstadoReclamo(
        draggedItem.reclamo_id,
        estadoNuevo,
        `Estado cambiado de ${estadoAnterior} a ${estadoNuevo} mediante Kanban`
      );
      
      // Recargar reclamos para tener datos frescos del backend
      recargarReclamos();
    } catch (error) {
      console.error('Error al actualizar estado del reclamo:', error);
      
      // Revertir el cambio local si falló
      const reclamosRevertidos = reclamos.map(r => 
        r.reclamo_id === draggedItem.reclamo_id 
          ? { ...r, estado: estadoAnterior, ultima_actualizacion: undefined }
          : r
      );
      setReclamos(reclamosRevertidos);
      
      alert('Error al actualizar el estado del reclamo. Por favor, intente nuevamente.');
    }
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
  };

  // Función auxiliar para filtrar por prioridad
  const filtrarPorPrioridad = (reclamosList) => {
    if (filtroPrioridad === 'todas') return reclamosList;
    return reclamosList.filter(r => {
      const prioridad = r.prioridad?.toLowerCase();
      return prioridad === filtroPrioridad;
    });
  };

  // Filtrar reclamos por estado
  // Las OTs del itinerario (es_itinerario=true) con estado_orden ASIGNADA o PENDIENTE se consideran pendientes
  // También incluimos reclamos con estado PENDIENTE o ASIGNADA
  const reclamosPendientesSinFiltro = reclamos.filter(r => {
    // Si es del itinerario, usar el estado de la orden de trabajo
    if (r.es_itinerario) {
      const isPendiente = r.estado_orden === 'PENDIENTE' || r.estado_orden === 'pendiente' ||
                          r.estado_orden === 'ASIGNADA' || r.estado_orden === 'asignada';
      if (isPendiente) {
        console.log('✅ OT itinerario pendiente:', { ot_id: r.ot_id, estado_orden: r.estado_orden, descripcion: r.descripcion });
      }
      return isPendiente;
    }
    // Si no es del itinerario, usar el estado del reclamo
    return r.estado === 'PENDIENTE' || r.estado === 'pendiente' ||
           r.estado === 'ASIGNADA' || r.estado === 'asignada';
  });
  
  console.log('📊 Total pendientes después de filtro:', reclamosPendientesSinFiltro.length);
  
  const reclamosEnCursoSinFiltro = reclamos.filter(r => {
    // Si es del itinerario, usar el estado de la orden de trabajo
    if (r.es_itinerario) {
      return r.estado_orden === 'EN_CURSO' || r.estado_orden === 'en_curso' ||
             r.estado_orden === 'EN_PROCESO' || r.estado_orden === 'en_proceso';
    }
    // Si no es del itinerario, usar el estado del reclamo
    return r.estado === 'EN_CURSO' || r.estado === 'en_curso' || 
           r.estado === 'EN_PROCESO' || r.estado === 'en_proceso';
  });
  
  const reclamosResueltosSinFiltro = reclamos.filter(r => {
    // Si es del itinerario, usar el estado de la orden de trabajo
    if (r.es_itinerario) {
      return r.estado_orden === 'RESUELTO' || r.estado_orden === 'resuelto' ||
             r.estado_orden === 'COMPLETADA' || r.estado_orden === 'completada';
    }
    // Si no es del itinerario, usar el estado del reclamo
    return r.estado === 'RESUELTO' || r.estado === 'resuelto';
  });

  // Aplicar filtro de prioridad a cada categoría
  const reclamosPendientes = filtrarPorPrioridad(reclamosPendientesSinFiltro);
  const reclamosEnCurso = filtrarPorPrioridad(reclamosEnCursoSinFiltro);
  const reclamosResueltos = filtrarPorPrioridad(reclamosResueltosSinFiltro);

  // Renderizar tarjeta de reclamo
  const ReclamoCard = ({ reclamo }) => {
    const [isDragging, setIsDragging] = React.useState(false);
    
    const onDragStartLocal = (e) => {
      setIsDragging(true);
      handleDragStart(e, reclamo);
    };
    
    const onDragEndLocal = () => {
      setTimeout(() => setIsDragging(false), 100);
      handleDragEnd();
    };
    
    const onClickLocal = (e) => {
      e.stopPropagation();
      console.log('Click en tarjeta', { isDragging, ot_id: reclamo.ot_id });
      
      // Solo navegar si no estamos arrastrando
      if (!isDragging && reclamo.ot_id) {
        console.log('Navegando a:', `/dashboard/operario/ots-tecnicas/${reclamo.ot_id}`);
        navigate(`/dashboard/operario/ots-tecnicas/${reclamo.ot_id}`);
      } else if (!reclamo.ot_id) {
        console.warn('No hay ot_id en el reclamo:', reclamo);
      }
    };
    
    return (
    <div
      draggable
      onDragStart={onDragStartLocal}
      onDragEnd={onDragEndLocal}
      onClick={onClickLocal}
      className="bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition-all cursor-pointer border-2 border-transparent hover:border-blue-200"
    >
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <h4 className="font-semibold text-sm line-clamp-2">
              {reclamo.detalle_reclamo || reclamo.tipo_reclamo || 'Reclamo Técnico'}
            </h4>
            {reclamo.es_itinerario && (
              <Badge className="bg-purple-50 text-purple-700 text-xs mt-1 border border-purple-200">
                📅 Itinerario
              </Badge>
            )}
          </div>
          {getPriorityBadge(reclamo.prioridad)}
        </div>
        
        <div className="flex items-center gap-2 text-xs text-gray-600">
          <MapPin className="h-3 w-3" />
          <span className="line-clamp-1">
            {reclamo.zona || reclamo.direccion || 'Sin dirección'}
          </span>
        </div>

        <p className="text-xs text-gray-700">
          {reclamo.socio_nombre} {reclamo.socio_apellido}
        </p>

        <p className="text-xs text-gray-500 line-clamp-2">
          {reclamo.descripcion || 'Sin descripción'}
        </p>

        <div className="space-y-1">
          {reclamo.fecha_programada && (
            <div className="flex items-center gap-2 text-xs font-medium text-purple-700">
              <Clock className="h-3 w-3" />
              Programada: {formatearFecha(reclamo.fecha_programada)}
            </div>
          )}
          {reclamo.fecha_cierre ? (
            <div className="flex items-center gap-2 text-xs font-medium text-green-700">
              <CheckCircle className="h-3 w-3" />
              Cerrada: {formatearFecha(reclamo.fecha_cierre)}
            </div>
          ) : (
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Clock className="h-3 w-3" />
              Creada: {formatearFecha(reclamo.fecha_alta)}
            </div>
          )}
        </div>
      </div>
    </div>
    );
  };

  return (
    <CooperativaLayout titulo="Reclamos Asignados">
      <div className="space-y-6">
        {/* Info del operario */}
        {perfil && (
          <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-l-cooperativa-blue">
            <p className="text-sm text-gray-600">
              <span className="font-semibold text-cooperativa-dark">Operario:</span> {perfil.nombre} {perfil.apellido}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {perfil.rol_interno || perfil.cargo || 'Operario'}
            </p>
          </div>
        )}

        {/* Controles de vista y filtros */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          {/* Filtro de prioridad */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Prioridad:</span>
            <div className="flex gap-2">
              <Button 
                variant={filtroPrioridad === 'todas' ? "default" : "outline"}
                size="sm"
                onClick={() => setFiltroPrioridad('todas')}
                className={filtroPrioridad === 'todas' ? "bg-cooperativa-blue hover:bg-cooperativa-light" : ""}
              >
                Todas
              </Button>
              <Button 
                variant={filtroPrioridad === 'alta' ? "default" : "outline"}
                size="sm"
                onClick={() => setFiltroPrioridad('alta')}
                className={filtroPrioridad === 'alta' ? "bg-red-600 hover:bg-red-700" : "text-red-600 border-red-300 hover:bg-red-50"}
              >
                Alta
              </Button>
              <Button 
                variant={filtroPrioridad === 'media' ? "default" : "outline"}
                size="sm"
                onClick={() => setFiltroPrioridad('media')}
                className={filtroPrioridad === 'media' ? "bg-yellow-600 hover:bg-yellow-700" : "text-yellow-600 border-yellow-300 hover:bg-yellow-50"}
              >
                Media
              </Button>
              <Button 
                variant={filtroPrioridad === 'baja' ? "default" : "outline"}
                size="sm"
                onClick={() => setFiltroPrioridad('baja')}
                className={filtroPrioridad === 'baja' ? "bg-green-600 hover:bg-green-700" : "text-green-600 border-green-300 hover:bg-green-50"}
              >
                Baja
              </Button>
            </div>
          </div>

          {/* Botones de vista */}
          <div className="flex gap-3">
            <Button 
              variant={vistaKanban ? "default" : "outline"}
              size="sm"
              onClick={() => setVistaKanban(true)}
              className={vistaKanban ? "bg-cooperativa-blue hover:bg-cooperativa-light" : ""}
            >
              <LayoutGrid className="h-4 w-4 mr-2" />
              Kanban
            </Button>
            <Button 
              variant={!vistaKanban ? "default" : "outline"}
              size="sm"
              onClick={() => setVistaKanban(false)}
              className={!vistaKanban ? "bg-cooperativa-blue hover:bg-cooperativa-light" : ""}
            >
              <List className="h-4 w-4 mr-2" />
              Lista
            </Button>
          </div>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Pendientes</p>
                  <p className="text-3xl font-bold text-yellow-600">
                    {reclamosPendientes.length}
                  </p>
                </div>
                <div className="bg-yellow-100 rounded-full p-3">
                  <Clock className="h-6 w-6 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">En Curso</p>
                  <p className="text-3xl font-bold text-blue-600">
                    {reclamosEnCurso.length}
                  </p>
                </div>
                <div className="bg-blue-100 rounded-full p-3">
                  <AlertTriangle className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Resueltos</p>
                  <p className="text-3xl font-bold text-green-600">
                    {reclamosResueltos.length}
                  </p>
                </div>
                <div className="bg-green-100 rounded-full p-3">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card 
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => navigate('/dashboard/operario/itinerario')}
          >
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Mi Itinerario</p>
                  <p className="text-xs text-gray-500 mt-1">Ver por fecha</p>
                </div>
                <div className="bg-purple-100 rounded-full p-3">
                  <Clock className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Vista Kanban o Lista */}
        {cargandoReclamos ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Cargando reclamos...</p>
          </div>
        ) : vistaKanban ? (
          /* Vista Kanban con Drag & Drop */
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Columna Pendientes */}
            <div 
              className="bg-yellow-50 rounded-lg p-4 min-h-[600px]"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, 'pendiente')}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <Clock className="h-5 w-5 text-yellow-600" />
                  Pendientes
                  <Badge className="bg-yellow-100 text-yellow-800">
                    {reclamosPendientes.length}
                  </Badge>
                </h3>
              </div>
              <div className="space-y-3">
                {reclamosPendientes.length > 0 ? (
                  reclamosPendientes.map((reclamo, index) => (
                    <ReclamoCard key={`pendiente-${reclamo.ot_id}-${reclamo.reclamo_id}-${index}`} reclamo={reclamo} />
                  ))
                ) : (
                  <p className="text-center text-gray-500 text-sm py-8">
                    No hay reclamos pendientes
                  </p>
                )}
              </div>
            </div>

            {/* Columna En Curso */}
            <div 
              className="bg-blue-50 rounded-lg p-4 min-h-[600px]"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, 'en_curso')}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-blue-600" />
                  En Curso
                  <Badge className="bg-blue-100 text-blue-800">
                    {reclamosEnCurso.length}
                  </Badge>
                </h3>
              </div>
              <div className="space-y-3">
                {reclamosEnCurso.length > 0 ? (
                  reclamosEnCurso.map((reclamo, index) => (
                    <ReclamoCard key={`encurso-${reclamo.ot_id}-${reclamo.reclamo_id}-${index}`} reclamo={reclamo} />
                  ))
                ) : (
                  <p className="text-center text-gray-500 text-sm py-8">
                    No hay reclamos en curso
                  </p>
                )}
              </div>
            </div>

            {/* Columna Resueltos */}
            <div 
              className="bg-green-50 rounded-lg p-4 min-h-[600px]"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, 'resuelto')}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  Resueltos
                  <Badge className="bg-green-100 text-green-800">
                    {reclamosResueltos.length}
                  </Badge>
                </h3>
              </div>
              <div className="space-y-3">
                {reclamosResueltos.length > 0 ? (
                  reclamosResueltos.map((reclamo, index) => (
                    <ReclamoCard key={`resuelto-${reclamo.ot_id}-${reclamo.reclamo_id}-${index}`} reclamo={reclamo} />
                  ))
                ) : (
                  <p className="text-center text-gray-500 text-sm py-8">
                    No hay reclamos resueltos
                  </p>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* Vista Lista */
          <Card>
            <CardContent className="p-6">
              <div className="space-y-3">
                {/* Usar la misma lógica de filtrado que la vista Kanban */}
                {[...reclamosPendientes, ...reclamosEnCurso, ...reclamosResueltos].length > 0 ? (
                  <>
                    {/* Sección Pendientes */}
                    {reclamosPendientes.length > 0 && (
                      <div className="mb-6">
                        <div className="flex items-center gap-2 mb-3">
                          <h3 className="font-semibold text-lg flex items-center gap-2">
                            <Clock className="h-5 w-5 text-yellow-600" />
                            Pendientes
                            <Badge className="bg-yellow-100 text-yellow-800">
                              {reclamosPendientes.length}
                            </Badge>
                          </h3>
                        </div>
                        <div className="space-y-3">
                          {reclamosPendientes.map((reclamo, index) => (
                            <div 
                              key={`lista-pendiente-${reclamo.ot_id}-${reclamo.reclamo_id}-${index}`}
                              onClick={() => navigate(`/dashboard/operario/ots-tecnicas/${reclamo.ot_id}`)}
                              className="p-4 border rounded-lg hover:shadow-md transition-all cursor-pointer bg-yellow-50"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-3 mb-2">
                                    <h4 className="font-semibold">{reclamo.detalle_reclamo || reclamo.tipo_reclamo || 'Reclamo Técnico'}</h4>
                                    {reclamo.es_itinerario && (
                                      <Badge className="bg-purple-50 text-purple-700 text-xs border border-purple-200">
                                        📅 Itinerario
                                      </Badge>
                                    )}
                                    {getPriorityBadge(reclamo.prioridad)}
                                  </div>
                                  <p className="text-sm text-gray-600 mb-1">
                                    Cliente: {reclamo.socio_nombre} {reclamo.socio_apellido}
                                  </p>
                                  <div className="flex items-center gap-4 text-xs text-gray-500">
                                    <span className="flex items-center gap-1">
                                      <MapPin className="h-3 w-3" />
                                      {reclamo.zona || reclamo.direccion || 'Sin dirección'}
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <Clock className="h-3 w-3" />
                                      {formatearFecha(reclamo.fecha_alta)}
                                    </span>
                                    {reclamo.fecha_programada && (
                                      <span className="flex items-center gap-1 text-purple-700 font-medium">
                                        <Clock className="h-3 w-3" />
                                        Programada: {formatearFecha(reclamo.fecha_programada)}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Sección En Curso */}
                    {reclamosEnCurso.length > 0 && (
                      <div className="mb-6">
                        <div className="flex items-center gap-2 mb-3">
                          <h3 className="font-semibold text-lg flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-blue-600" />
                            En Curso
                            <Badge className="bg-blue-100 text-blue-800">
                              {reclamosEnCurso.length}
                            </Badge>
                          </h3>
                        </div>
                        <div className="space-y-3">
                          {reclamosEnCurso.map((reclamo, index) => (
                            <div 
                              key={`lista-encurso-${reclamo.ot_id}-${reclamo.reclamo_id}-${index}`}
                              onClick={() => navigate(`/dashboard/operario/ots-tecnicas/${reclamo.ot_id}`)}
                              className="p-4 border rounded-lg hover:shadow-md transition-all cursor-pointer bg-blue-50"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-3 mb-2">
                                    <h4 className="font-semibold">{reclamo.detalle_reclamo || reclamo.tipo_reclamo || 'Reclamo Técnico'}</h4>
                                    {reclamo.es_itinerario && (
                                      <Badge className="bg-purple-50 text-purple-700 text-xs border border-purple-200">
                                        📅 Itinerario
                                      </Badge>
                                    )}
                                    {getPriorityBadge(reclamo.prioridad)}
                                  </div>
                                  <p className="text-sm text-gray-600 mb-1">
                                    Cliente: {reclamo.socio_nombre} {reclamo.socio_apellido}
                                  </p>
                                  <div className="flex items-center gap-4 text-xs text-gray-500">
                                    <span className="flex items-center gap-1">
                                      <MapPin className="h-3 w-3" />
                                      {reclamo.zona || reclamo.direccion || 'Sin dirección'}
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <Clock className="h-3 w-3" />
                                      {formatearFecha(reclamo.fecha_alta)}
                                    </span>
                                    {reclamo.fecha_programada && (
                                      <span className="flex items-center gap-1 text-purple-700 font-medium">
                                        <Clock className="h-3 w-3" />
                                        Programada: {formatearFecha(reclamo.fecha_programada)}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Sección Resueltos */}
                    {reclamosResueltos.length > 0 && (
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <h3 className="font-semibold text-lg flex items-center gap-2">
                            <CheckCircle className="h-5 w-5 text-green-600" />
                            Resueltos
                            <Badge className="bg-green-100 text-green-800">
                              {reclamosResueltos.length}
                            </Badge>
                          </h3>
                        </div>
                        <div className="space-y-3">
                          {reclamosResueltos.map((reclamo, index) => (
                            <div 
                              key={`lista-resuelto-${reclamo.ot_id}-${reclamo.reclamo_id}-${index}`}
                              onClick={() => navigate(`/dashboard/operario/ots-tecnicas/${reclamo.ot_id}`)}
                              className="p-4 border rounded-lg hover:shadow-md transition-all cursor-pointer bg-green-50"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-3 mb-2">
                                    <h4 className="font-semibold">{reclamo.detalle_reclamo || reclamo.tipo_reclamo || 'Reclamo Técnico'}</h4>
                                    {reclamo.es_itinerario && (
                                      <Badge className="bg-purple-50 text-purple-700 text-xs border border-purple-200">
                                        📅 Itinerario
                                      </Badge>
                                    )}
                                    {getPriorityBadge(reclamo.prioridad)}
                                  </div>
                                  <p className="text-sm text-gray-600 mb-1">
                                    Cliente: {reclamo.socio_nombre} {reclamo.socio_apellido}
                                  </p>
                                  <div className="flex items-center gap-4 text-xs text-gray-500">
                                    <span className="flex items-center gap-1">
                                      <MapPin className="h-3 w-3" />
                                      {reclamo.zona || reclamo.direccion || 'Sin dirección'}
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <Clock className="h-3 w-3" />
                                      {reclamo.fecha_cierre ? formatearFecha(reclamo.fecha_cierre) : formatearFecha(reclamo.fecha_alta)}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-center text-gray-500 py-8">No hay reclamos asignados</p>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </CooperativaLayout>
  );
}
