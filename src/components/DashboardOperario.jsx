/**
 * Dashboard para Operarios
 * Vista Kanban con drag & drop para gestionar reclamos
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePerfil, useDashboard, useReclamos } from '../hooks/useOperario.js';
import { useAuth } from '../contexts/AuthContext.jsx';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Clock, MapPin, AlertTriangle, CheckCircle, LayoutGrid, List } from 'lucide-react';
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

  // Actualizar reclamos cuando cambian los originales
  React.useEffect(() => {
    if (reclamosOriginales) {
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
    const badges = {
      pendiente: <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Pendiente</Badge>,
      en_curso: <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">En Curso</Badge>,
      resuelto: <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Resuelto</Badge>
    };
    return badges[estado] || badges.pendiente;
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

  // Filtrar reclamos por estado
  const reclamosPendientes = reclamos.filter(r => r.estado === 'PENDIENTE' || r.estado === 'pendiente');
  const reclamosEnCurso = reclamos.filter(r => r.estado === 'EN_CURSO' || r.estado === 'en_curso');
  const reclamosResueltos = reclamos.filter(r => r.estado === 'RESUELTO' || r.estado === 'resuelto');

  // Renderizar tarjeta de reclamo
  const ReclamoCard = ({ reclamo }) => (
    <div
      draggable
      onDragStart={(e) => handleDragStart(e, reclamo)}
      onDragEnd={handleDragEnd}
      onClick={() => navigate(`/dashboard/operario/reclamos/${reclamo.reclamo_id}`)}
      className="bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition-all cursor-move border-2 border-transparent hover:border-blue-200"
    >
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-2">
          <h4 className="font-semibold text-sm line-clamp-2">
            {reclamo.detalle_reclamo || reclamo.tipo_reclamo || 'Reclamo Técnico'}
          </h4>
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

        <div className="flex items-center gap-2 text-xs text-gray-500">
          <Clock className="h-3 w-3" />
          {formatearFecha(reclamo.fecha_alta)}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Reclamos Asignados</h1>
            {perfil && (
              <p className="text-sm text-gray-600 mt-1">
                {perfil.nombre} {perfil.apellido} - {perfil.rol_interno || perfil.cargo || 'Operario'}
              </p>
            )}
          </div>
          <div className="flex gap-3">
            <Button 
              variant={vistaKanban ? "default" : "outline"}
              size="sm"
              onClick={() => setVistaKanban(true)}
            >
              <LayoutGrid className="h-4 w-4 mr-2" />
              Kanban
            </Button>
            <Button 
              variant={!vistaKanban ? "default" : "outline"}
              size="sm"
              onClick={() => setVistaKanban(false)}
            >
              <List className="h-4 w-4 mr-2" />
              Lista
            </Button>
            <Button variant="outline" onClick={logout}>
              Cerrar Sesión
            </Button>
          </div>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                  reclamosPendientes.map(reclamo => (
                    <ReclamoCard key={reclamo.reclamo_id} reclamo={reclamo} />
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
                  reclamosEnCurso.map(reclamo => (
                    <ReclamoCard key={reclamo.reclamo_id} reclamo={reclamo} />
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
                  reclamosResueltos.map(reclamo => (
                    <ReclamoCard key={reclamo.reclamo_id} reclamo={reclamo} />
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
                {reclamos.length > 0 ? (
                  reclamos.map(reclamo => (
                    <div 
                      key={reclamo.reclamo_id}
                      onClick={() => navigate(`/dashboard/operario/reclamos/${reclamo.reclamo_id}`)}
                      className="p-4 border rounded-lg hover:shadow-md transition-all cursor-pointer"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h4 className="font-semibold">{reclamo.detalle_reclamo || reclamo.tipo_reclamo || 'Reclamo Técnico'}</h4>
                            {getPriorityBadge(reclamo.prioridad)}
                            {getStatusBadge(reclamo.estado?.toLowerCase())}
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
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-gray-500 py-8">No hay reclamos asignados</p>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
