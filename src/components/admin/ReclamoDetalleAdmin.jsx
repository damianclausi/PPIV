/**
 * Componente para ver y gestionar el detalle de un reclamo (Admin)
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  ArrowLeft, AlertCircle, MapPin, Clock, User, Phone, Mail,
  Calendar, FileText, UserCog, Edit, Trash2, CheckCircle, XCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import administradorService from '../../services/administradorService';
import { Button } from '../ui/button';
import { Skeleton } from '../ui/skeleton';
import { formatearFechaHora } from '../../utils/formatters.js';

export default function ReclamoDetalleAdmin() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [reclamo, setReclamo] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [cambiandoEstado, setCambiandoEstado] = useState(false);
  const [nuevoEstado, setNuevoEstado] = useState('');

  useEffect(() => {
    const cargarReclamo = async () => {
      try {
        setCargando(true);
        const response = await administradorService.obtenerReclamo(id);
        setReclamo(response.datos);
        setNuevoEstado(response.datos?.estado ?? '');
      } catch (error) {
        console.error('Error al cargar reclamo:', error);
        setReclamo(null);
      } finally {
        setCargando(false);
      }
    };
    cargarReclamo();
  }, [id]);

  const handleCambiarEstado = async () => {
    if (nuevoEstado === reclamo.estado) return;
    
    try {
      setCambiandoEstado(true);
      // TODO: Implementar llamada al backend
      // await administradorService.cambiarEstadoReclamo(id, nuevoEstado);
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setReclamo({ ...reclamo, estado: nuevoEstado });
      alert('Estado actualizado correctamente');
    } catch (error) {
      console.error('Error al cambiar estado:', error);
      alert('Error al cambiar el estado');
    } finally {
      setCambiandoEstado(false);
    }
  };

  const handleEliminar = async () => {
    if (!confirm('¿Está seguro de eliminar este reclamo? Esta acción no se puede deshacer.')) {
      return;
    }
    
    try {
      // TODO: Implementar llamada al backend
      // await administradorService.eliminarReclamo(id);
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      alert('Reclamo eliminado correctamente');
      navigate('/dashboard/admin/reclamos');
    } catch (error) {
      console.error('Error al eliminar reclamo:', error);
      alert('Error al eliminar el reclamo');
    }
  };

  const getBadgeColor = (estado) => {
    switch (estado) {
      case 'PENDIENTE':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'EN_PROCESO':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'RESUELTO':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'CERRADO':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPrioridadColor = (prioridad) => {
    switch (prioridad) {
      case 'ALTA':
        return 'text-red-600';
      case 'MEDIA':
        return 'text-yellow-600';
      case 'BAJA':
        return 'text-gray-600';
      default:
        return 'text-gray-600';
    }
  };

  if (cargando) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <Skeleton className="h-12 w-64" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Skeleton className="h-64" />
            <Skeleton className="h-64" />
          </div>
        </div>
      </div>
    );
  }

  if (!reclamo) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <p className="text-center text-gray-600">Reclamo no encontrado</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Reclamo #{reclamo.reclamo_id}
            </h1>
            <p className="text-gray-600 mt-1">{reclamo.tipo_reclamo}</p>
          </div>
          <div className="flex gap-2">
            {reclamo.estado === 'PENDIENTE' && (
              <Button
                variant="default"
                size="sm"
                onClick={() => navigate(`/dashboard/admin/reclamos/${id}/asignar`)}
              >
                <UserCog className="h-4 w-4 mr-2" />
                Asignar
              </Button>
            )}
            <Button
              variant="destructive"
              size="sm"
              onClick={handleEliminar}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Eliminar
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/dashboard/admin/reclamos')}
            >
              Volver
            </Button>
          </div>
        </div>

        {/* Grid de 2 columnas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Información del Reclamo */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-orange-600" />
                Información del Reclamo
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-600">Estado</label>
                <div className="mt-1">
                  <span className={`px-3 py-1 inline-flex text-sm font-semibold rounded-full border ${getBadgeColor(reclamo.estado)}`}>
                    {reclamo.estado}
                  </span>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-600">Prioridad</label>
                <p className={`text-lg font-semibold ${getPrioridadColor(reclamo.prioridad)}`}>
                  {reclamo.prioridad}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-600">Descripción</label>
                <p className="text-gray-900">{reclamo.descripcion}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-600 flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  Dirección
                </label>
                <p className="text-gray-900">{reclamo.direccion}</p>
                <p className="text-sm text-gray-600">{reclamo.zona}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-600 flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  Fecha de Alta
                </label>
                <p className="text-gray-900">
                  {formatearFechaHora(reclamo.fecha_alta)}
                </p>
              </div>

              {reclamo.notas && (
                <div>
                  <label className="text-sm font-medium text-gray-600 flex items-center gap-1">
                    <FileText className="h-4 w-4" />
                    Notas
                  </label>
                  <p className="text-gray-900">{reclamo.notas}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Información del Cliente */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-blue-600" />
                Datos del Cliente
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-600">Nombre Completo</label>
                <p className="text-gray-900">
                  {reclamo.socio_nombre} {reclamo.socio_apellido}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-600">DNI</label>
                <p className="text-gray-900">{reclamo.socio_dni}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-600 flex items-center gap-1">
                  <Mail className="h-4 w-4" />
                  Email
                </label>
                <p className="text-gray-900">{reclamo.socio_email}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-600 flex items-center gap-1">
                  <Phone className="h-4 w-4" />
                  Teléfono
                </label>
                <p className="text-gray-900">{reclamo.socio_telefono}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-600">Número de Cuenta</label>
                <p className="text-gray-900">#{reclamo.numero_cuenta}</p>
              </div>

              {reclamo.operario_asignado && (
                <div>
                  <label className="text-sm font-medium text-gray-600 flex items-center gap-1">
                    <UserCog className="h-4 w-4" />
                    Operario Asignado
                  </label>
                  <p className="text-gray-900">{reclamo.operario_asignado}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Cambiar Estado */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5" />
              Gestionar Estado del Reclamo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cambiar Estado
                </label>
                <select
                  value={nuevoEstado}
                  onChange={(e) => setNuevoEstado(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="PENDIENTE">Pendiente</option>
                  <option value="EN_PROCESO">En Proceso</option>
                  <option value="RESUELTO">Resuelto</option>
                  <option value="CERRADO">Cerrado</option>
                </select>
              </div>
              <Button
                onClick={handleCambiarEstado}
                disabled={cambiandoEstado || nuevoEstado === reclamo.estado}
              >
                {cambiandoEstado ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Actualizando...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Actualizar Estado
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>


      </div>
    </div>
  );
}
