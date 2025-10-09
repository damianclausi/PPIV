/**
 * Componente para gestión de Órdenes de Trabajo Administrativas
 * (Sin empleado asignado, gestionadas por el administrador)
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../services/api';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { 
  ArrowLeft, 
  Search, 
  FileText, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  User,
  Phone,
  Mail,
  MapPin,
  RefreshCw,
  Eye,
  CheckCheck
} from 'lucide-react';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../ui/dialog';
import { Textarea } from '../ui/textarea';
import { formatearFecha, formatearFechaHora } from '../../utils/formatters';

export default function OTsAdministrativas() {
  const navigate = useNavigate();
  
  const [ots, setOts] = useState([]);
  const [otsFiltradas, setOtsFiltradas] = useState([]);
  const [contadores, setContadores] = useState({
    pendientes: 0,
    en_proceso: 0,
    cerradas: 0,
    total: 0
  });
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  
  // Filtros
  const [filtros, setFiltros] = useState({
    estado: '',
    busqueda: ''
  });

  // Modal
  const [modalAbierto, setModalAbierto] = useState(false);
  const [otSeleccionada, setOtSeleccionada] = useState(null);
  const [observaciones, setObservaciones] = useState('');
  const [cerrando, setCerrando] = useState(false);

  // Cargar OTs
  useEffect(() => {
    cargarOTs();
  }, []);

  // Aplicar filtros cuando cambien
  useEffect(() => {
    aplicarFiltros();
  }, [filtros, ots]);

  const cargarOTs = async () => {
    try {
      setCargando(true);
      setError(null);

      const data = await apiClient.get('/api/administradores/ots/administrativas');

      if (data.exito) {
        setOts(data.datos.ots || []);
        setContadores(data.datos.contadores || {});
      } else {
        throw new Error(data.mensaje || 'Error al cargar OTs');
      }
    } catch (err) {
      console.error('Error al cargar OTs:', err);
      setError(err.message || 'Error al cargar OTs');
    } finally {
      setCargando(false);
    }
  };

  const aplicarFiltros = () => {
    let resultados = [...ots];

    // Filtro por estado
    if (filtros.estado) {
      resultados = resultados.filter(ot => ot.estado_ot === filtros.estado);
    }

    // Filtro por búsqueda
    if (filtros.busqueda) {
      const busqueda = filtros.busqueda.toLowerCase();
      resultados = resultados.filter(ot =>
        ot.socio_nombre.toLowerCase().includes(busqueda) ||
        ot.socio_apellido.toLowerCase().includes(busqueda) ||
        ot.numero_cuenta.includes(busqueda) ||
        ot.descripcion.toLowerCase().includes(busqueda) ||
        ot.detalle_reclamo.toLowerCase().includes(busqueda)
      );
    }

    setOtsFiltradas(resultados);
  };

  const abrirDetalle = async (otId) => {
    try {
      const data = await apiClient.get(`/api/administradores/ots/administrativas/${otId}`);

      if (data.exito) {
        setOtSeleccionada(data.datos);
        setObservaciones('');
        setModalAbierto(true);
      } else {
        throw new Error(data.mensaje || 'Error al cargar detalle');
      }
    } catch (err) {
      console.error('Error al cargar detalle:', err);
      alert('Error al cargar el detalle de la OT');
    }
  };

  const marcarEnProceso = async () => {
    if (!confirm('¿Desea marcar esta OT como "En Proceso"?')) {
      return;
    }

    try {
      const payload = observaciones.trim() 
        ? { observaciones: observaciones.trim() } 
        : {};

      const data = await apiClient.patch(
        `/api/administradores/ots/administrativas/${otSeleccionada.ot_id}/en-proceso`,
        payload
      );

      if (data.exito) {
        alert('OT marcada como "En Proceso"');
        setModalAbierto(false);
        setOtSeleccionada(null);
        setObservaciones('');
        cargarOTs(); // Recargar lista
      } else {
        throw new Error(data.mensaje || 'Error al marcar OT');
      }
    } catch (err) {
      console.error('Error al marcar OT:', err);
      alert(err.message || 'Error al marcar la OT como en proceso');
    }
  };

  const cerrarOT = async () => {
    if (!observaciones.trim()) {
      alert('Las observaciones son obligatorias');
      return;
    }

    if (!confirm('¿Está seguro de cerrar esta OT? Esta acción no se puede deshacer.')) {
      return;
    }

    try {
      setCerrando(true);

      const data = await apiClient.patch(
        `/api/administradores/ots/administrativas/${otSeleccionada.ot_id}/cerrar`,
        { observaciones: observaciones.trim() }
      );

      if (data.exito) {
        alert('OT cerrada exitosamente');
        setModalAbierto(false);
        setOtSeleccionada(null);
        setObservaciones('');
        cargarOTs(); // Recargar lista
      } else {
        throw new Error(data.mensaje || 'Error al cerrar OT');
      }
    } catch (err) {
      console.error('Error al cerrar OT:', err);
      alert(err.message || 'Error al cerrar la OT');
    } finally {
      setCerrando(false);
    }
  };

  const getBadgeColor = (estado) => {
    switch (estado) {
      case 'PENDIENTE':
        return 'bg-yellow-100 text-yellow-800 border border-yellow-200';
      case 'EN_PROCESO':
        return 'bg-blue-100 text-blue-800 border border-blue-200';
      case 'CERRADO':
        return 'bg-green-100 text-green-800 border border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border border-gray-200';
    }
  };

  const formatearEstado = (estado) => {
    const estados = {
      'PENDIENTE': 'Pendiente',
      'EN_PROCESO': 'En Proceso',
      'CERRADO': 'Cerrada'
    };
    return estados[estado] || estado;
  };

  const getPrioridadColor = (prioridad) => {
    if (!prioridad) return 'text-gray-600';
    const p = prioridad.toLowerCase();
    if (p === 'alta') return 'text-red-600';
    if (p === 'media') return 'text-yellow-600';
    return 'text-green-600';
  };

  if (cargando) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <p className="mt-4 text-gray-600">Cargando OTs administrativas...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <Button
            variant="ghost"
            onClick={() => navigate('/dashboard')}
            className="mb-6"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver al Dashboard
          </Button>

          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 text-red-800">
                <AlertCircle className="h-5 w-5" />
                <div>
                  <p className="font-semibold">Error al cargar OTs</p>
                  <p className="text-sm">{error}</p>
                </div>
              </div>
              <Button
                onClick={cargarOTs}
                className="mt-4"
                variant="outline"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Reintentar
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => navigate('/dashboard')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">OTs Administrativas</h1>
              <p className="text-sm text-gray-600 mt-1">
                Gestión de órdenes de trabajo administrativas sin operario asignado
              </p>
            </div>
          </div>
          <Button onClick={cargarOTs} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualizar
          </Button>
        </div>

        {/* Contadores */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{contadores.pendientes || 0}</div>
              <p className="text-xs text-muted-foreground">
                Por revisar
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">En Proceso</CardTitle>
              <AlertCircle className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{contadores.en_proceso || 0}</div>
              <p className="text-xs text-muted-foreground">
                En revisión
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Cerradas</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{contadores.cerradas || 0}</div>
              <p className="text-xs text-muted-foreground">
                Resueltas
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total</CardTitle>
              <FileText className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{contadores.total || 0}</div>
              <p className="text-xs text-muted-foreground">
                Todas las OTs
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filtros */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Buscar por socio, cuenta, descripción..."
                    value={filtros.busqueda}
                    onChange={(e) => setFiltros({ ...filtros, busqueda: e.target.value })}
                    className="pl-10"
                  />
                </div>
              </div>
              <select
                value={filtros.estado}
                onChange={(e) => setFiltros({ ...filtros, estado: e.target.value })}
                className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Todos los estados</option>
                <option value="PENDIENTE">Pendiente</option>
                <option value="EN_PROCESO">En Proceso</option>
                <option value="CERRADO">Cerrada</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Tabla de OTs */}
        <Card>
          <CardHeader>
            <CardTitle>
              Órdenes de Trabajo ({otsFiltradas.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {otsFiltradas.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No hay OTs administrativas con los filtros aplicados</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        OT #
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Estado
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tipo
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Socio
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Cuenta
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Descripción
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Prioridad
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Fecha
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {otsFiltradas.map((ot) => (
                      <tr key={ot.ot_id} className="hover:bg-gray-50">
                        <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          #{ot.ot_id}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getBadgeColor(ot.estado_ot)}`}>
                            {formatearEstado(ot.estado_ot)}
                          </span>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {ot.detalle_reclamo}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                          {ot.socio_nombre} {ot.socio_apellido}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                          {ot.numero_cuenta}
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-600 max-w-xs truncate">
                          {ot.descripcion}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm">
                          <span className={`font-medium ${getPrioridadColor(ot.prioridad)}`}>
                            {ot.prioridad}
                          </span>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                          {formatearFecha(ot.fecha_alta)}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-right text-sm">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => abrirDetalle(ot.ot_id)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Ver
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Modal de Detalle */}
      <Dialog open={modalAbierto} onOpenChange={setModalAbierto}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">
              OT #{otSeleccionada?.ot_id} - {otSeleccionada?.detalle_reclamo}
            </DialogTitle>
            <DialogDescription>
              <span className={`inline-block px-3 py-1 text-xs font-semibold rounded-full ${getBadgeColor(otSeleccionada?.estado)}`}>
                {formatearEstado(otSeleccionada?.estado)}
              </span>
            </DialogDescription>
          </DialogHeader>

          {otSeleccionada && (
            <div className="space-y-6">
              {/* Información del Socio */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Información del Socio
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Nombre</p>
                    <p className="font-medium">{otSeleccionada.socio_nombre} {otSeleccionada.socio_apellido}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">DNI</p>
                    <p className="font-medium">{otSeleccionada.socio_dni}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Teléfono</p>
                    <p className="font-medium flex items-center gap-1">
                      <Phone className="h-4 w-4 flex-shrink-0" />
                      <span className="truncate">{otSeleccionada.socio_telefono}</span>
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Cuenta</p>
                    <p className="font-medium">{otSeleccionada.numero_cuenta}</p>
                  </div>
                  <div className="md:col-span-2">
                    <p className="text-sm text-gray-600">Email</p>
                    <p className="font-medium flex items-center gap-1">
                      <Mail className="h-4 w-4 flex-shrink-0" />
                      <span className="break-all">{otSeleccionada.socio_email}</span>
                    </p>
                  </div>
                  <div className="md:col-span-2">
                    <p className="text-sm text-gray-600">Dirección</p>
                    <p className="font-medium flex items-center gap-1">
                      <MapPin className="h-4 w-4 flex-shrink-0" />
                      <span className="break-words">{otSeleccionada.direccion}, {otSeleccionada.localidad}</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Información de la OT */}
              <div>
                <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Detalles de la OT
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Prioridad</p>
                    <p className={`font-medium ${getPrioridadColor(otSeleccionada.prioridad)}`}>
                      {otSeleccionada.prioridad}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Fecha de Alta</p>
                    <p className="font-medium">{formatearFechaHora(otSeleccionada.fecha_alta)}</p>
                  </div>
                  {otSeleccionada.estado === 'CERRADO' && otSeleccionada.fecha_cierre && (
                    <div>
                      <p className="text-sm text-gray-600">Fecha de Cierre</p>
                      <p className="font-medium">{formatearFechaHora(otSeleccionada.fecha_cierre)}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Descripción del Reclamo */}
              <div>
                <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Descripción del Reclamo
                </h3>
                <p className="text-gray-700 bg-gray-50 p-4 rounded-lg break-words whitespace-pre-wrap">
                  {otSeleccionada.descripcion}
                </p>
              </div>

              {/* Observaciones Previas (si existe y está en proceso) */}
              {otSeleccionada.estado === 'EN_PROCESO' && otSeleccionada.observaciones && (
                <div>
                  <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                    <FileText className="h-5 w-5 text-blue-600" />
                    Observaciones Previas
                  </h3>
                  <p className="text-gray-700 bg-blue-50 p-4 rounded-lg border border-blue-200 break-words whitespace-pre-wrap">
                    {otSeleccionada.observaciones}
                  </p>
                </div>
              )}

              {/* Resolución (si está cerrada) */}
              {otSeleccionada.estado === 'CERRADO' && otSeleccionada.observaciones && (
                <div>
                  <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                    <CheckCheck className="h-5 w-5 text-green-600" />
                    Resolución
                  </h3>
                  <p className="text-gray-700 bg-green-50 p-4 rounded-lg border border-green-200 break-words whitespace-pre-wrap">
                    {otSeleccionada.observaciones}
                  </p>
                </div>
              )}

              {/* Formulario de Observaciones (si no está cerrada) */}
              {otSeleccionada.estado !== 'CERRADO' && (
                <div>
                  <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                    <CheckCircle className="h-5 w-5" />
                    {otSeleccionada.estado === 'PENDIENTE' ? 'Observaciones' : 'Cerrar OT'}
                  </h3>
                  <Textarea
                    placeholder={
                      otSeleccionada.estado === 'PENDIENTE'
                        ? 'Opcional: Agrega comentarios al marcar como En Proceso o al cerrar la OT...'
                        : 'Describe cómo se resolvió el reclamo administrativo...'
                    }
                    value={observaciones}
                    onChange={(e) => setObservaciones(e.target.value)}
                    rows={4}
                    className="w-full resize-none"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    {otSeleccionada.estado === 'PENDIENTE'
                      ? 'Opcional para marcar En Proceso, obligatorio para cerrar'
                      : 'Las observaciones son obligatorias para cerrar la OT'}
                  </p>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setModalAbierto(false)}
            >
              {otSeleccionada?.estado === 'CERRADO' ? 'Cerrar' : 'Cancelar'}
            </Button>
            
            {/* Botón "Marcar En Proceso" - Solo para OTs PENDIENTES */}
            {otSeleccionada?.estado === 'PENDIENTE' && (
              <Button
                onClick={marcarEnProceso}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Clock className="h-4 w-4 mr-2" />
                Marcar En Proceso
              </Button>
            )}

            {/* Botón "Cerrar OT" - Para OTs PENDIENTES o EN_PROCESO */}
            {(otSeleccionada?.estado === 'PENDIENTE' || otSeleccionada?.estado === 'EN_PROCESO') && (
              <Button
                onClick={cerrarOT}
                disabled={cerrando || !observaciones.trim()}
                className="bg-green-600 hover:bg-green-700"
              >
                {cerrando ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Cerrando...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Cerrar OT
                  </>
                )}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
