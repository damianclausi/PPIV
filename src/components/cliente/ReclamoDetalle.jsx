import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Skeleton } from '../ui/skeleton';
import { Alert, AlertDescription } from '../ui/alert';
import { formatearFechaHora } from '../../utils/formatters.js';
import { 
  ArrowLeft, 
  MapPin, 
  Calendar, 
  Clock, 
  User,
  FileText,
  AlertCircle,
  CheckCircle,
  AlertTriangle,
  Info
} from 'lucide-react';
import { useEffect, useState } from 'react';
import clienteService from '../../services/clienteService';

export default function ReclamoDetalle() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [reclamo, setReclamo] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    cargarReclamo();
  }, [id]);

  const cargarReclamo = async () => {
    try {
      setCargando(true);
      const datos = await clienteService.obtenerReclamo(id);
      setReclamo(datos);
      setError(null);
    } catch (err) {
      setError(err.message || 'Error al cargar el reclamo');
    } finally {
      setCargando(false);
    }
  };

  const getBadgeColor = (estado) => {
    const estadoUpper = estado?.toUpperCase();
    switch (estadoUpper) {
      case 'PENDIENTE':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'EN_PROCESO':
      case 'EN PROCESO':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'RESUELTO':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getEstadoIcon = (estado) => {
    const estadoUpper = estado?.toUpperCase();
    switch (estadoUpper) {
      case 'PENDIENTE':
        return <Clock className="h-5 w-5 text-yellow-600" />;
      case 'EN_PROCESO':
      case 'EN PROCESO':
        return <Info className="h-5 w-5 text-blue-600" />;
      case 'RESUELTO':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-600" />;
    }
  };

  const getPrioridadIcon = (prioridad) => {
    const prioridadUpper = prioridad?.toUpperCase();
    if (prioridadUpper === 'ALTA') return <AlertTriangle className="h-5 w-5 text-red-600" />;
    if (prioridadUpper === 'MEDIA') return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
    return <CheckCircle className="h-5 w-5 text-green-600" />;
  };

  if (cargando) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <Skeleton className="h-12 w-96" />
          <Skeleton className="h-64" />
          <Skeleton className="h-48" />
        </div>
      </div>
    );
  }

  if (error || !reclamo) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error || 'Reclamo no encontrado'}</AlertDescription>
          </Alert>
          <Button 
            className="mt-4" 
            variant="outline" 
            onClick={() => navigate('/dashboard/reclamos')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver a Reclamos
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={() => navigate('/dashboard/reclamos')}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Detalle del Reclamo</h1>
              <p className="text-sm text-gray-600 mt-1">Reclamo #{reclamo.reclamo_id}</p>
            </div>
          </div>
        </div>

        {/* Estado y Prioridad */}
        <div className="flex gap-4">
          <Card className="flex-1">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                {getEstadoIcon(reclamo.estado)}
                <div>
                  <p className="text-sm text-gray-600">Estado</p>
                  <Badge className={`${getBadgeColor(reclamo.estado)} border mt-1`}>
                    {reclamo.estado}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="flex-1">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                {getPrioridadIcon(reclamo.prioridad)}
                <div>
                  <p className="text-sm text-gray-600">Prioridad</p>
                  <p className="font-semibold text-gray-900 mt-1">{reclamo.prioridad || 'Media'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Información Principal */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Información del Reclamo
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-gray-600 mb-1">Tipo de Reclamo</p>
              <p className="font-semibold text-gray-900">{reclamo.tipo_reclamo || 'Reclamo Técnico'}</p>
            </div>

            <div>
              <p className="text-sm text-gray-600 mb-1">Descripción</p>
              <p className="text-gray-900">{reclamo.descripcion || 'Sin descripción'}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
              <div className="flex items-center gap-2 text-gray-600">
                <MapPin className="h-4 w-4" />
                <div>
                  <p className="text-sm text-gray-600">Dirección</p>
                  <p className="font-medium">{reclamo.direccion || 'Sin dirección'}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 text-gray-600">
                <Calendar className="h-4 w-4" />
                <div>
                  <p className="text-sm text-gray-600">Fecha de Alta</p>
                  <p className="font-medium">{formatearFechaHora(reclamo.fecha_alta)}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Información de Asignación */}
        {reclamo.operario_asignado && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Operario Asignado
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <User className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Operario #{reclamo.operario_asignado}</p>
                  <p className="text-sm text-gray-600">Trabajando en tu reclamo</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Estado de Resolución */}
        {reclamo.estado === 'RESUELTO' && (
          <Alert className="bg-green-50 border-green-200">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              <strong>Reclamo Resuelto</strong>
              {reclamo.fecha_cierre && (
                <span className="block text-sm mt-1">
                  Fecha de resolución: {formatearFechaHora(reclamo.fecha_cierre)}
                </span>
              )}
            </AlertDescription>
          </Alert>
        )}

        {reclamo.estado === 'PENDIENTE' && (
          <Alert className="bg-yellow-50 border-yellow-200">
            <Clock className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800">
              <strong>Reclamo Pendiente</strong>
              <span className="block text-sm mt-1">
                Tu reclamo está en cola de asignación. Pronto será atendido por un operario.
              </span>
            </AlertDescription>
          </Alert>
        )}

        {reclamo.estado === 'EN_PROCESO' && (
          <Alert className="bg-blue-50 border-blue-200">
            <Info className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              <strong>Reclamo en Proceso</strong>
              <span className="block text-sm mt-1">
                Un operario está trabajando en tu reclamo. Te notificaremos cuando sea resuelto.
              </span>
            </AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  );
}
