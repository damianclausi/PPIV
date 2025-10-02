import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Skeleton } from '../ui/skeleton';
import { ArrowLeft, AlertCircle, MapPin, Calendar, Clock, Plus, AlertTriangle, Info, CheckCircle } from 'lucide-react';
import { useReclamos } from '../../hooks/useCliente';

export default function ReclamosListado() {
  const navigate = useNavigate();
  const { reclamos, cargando, error } = useReclamos();

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

  const getPrioridadIcon = (prioridad) => {
    if (prioridad === 'ALTA') return <AlertTriangle className="h-4 w-4 text-red-600" />;
    if (prioridad === 'MEDIA') return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
    return <CheckCircle className="h-4 w-4 text-green-600" />;
  };

  if (cargando) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-6xl mx-auto space-y-6">
          <Skeleton className="h-12 w-96" />
          <div className="grid gap-4">
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4 justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Mis Reclamos</h1>
              <p className="text-sm text-gray-600 mt-1">
                {reclamos?.length || 0} reclamo(s) registrado(s)
              </p>
            </div>
          </div>
          <Button onClick={() => navigate('/dashboard/reclamos/nuevo')} size="lg">
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Reclamo
          </Button>
        </div>

        {/* Error */}
        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <p className="text-red-600">{error}</p>
            </CardContent>
          </Card>
        )}

        {/* Lista de Reclamos */}
        {!reclamos || reclamos.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center py-12">
              <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No tienes reclamos registrados
              </h3>
              <p className="text-gray-600 mb-4">
                Crea tu primer reclamo para que podamos ayudarte
              </p>
              <Button onClick={() => navigate('/dashboard/reclamos/nuevo')}>
                <Plus className="h-4 w-4 mr-2" />
                Crear Primer Reclamo
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {reclamos.map(reclamo => (
              <Card 
                key={reclamo.reclamo_id} 
                className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => console.log('Ver detalle reclamo:', reclamo.reclamo_id)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <AlertCircle className="h-5 w-5 text-orange-600" />
                      {reclamo.tipo_reclamo || 'Reclamo Técnico'}
                      <span className="text-sm font-normal text-gray-500">
                        #{reclamo.reclamo_id}
                      </span>
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{getPrioridadIcon(reclamo.prioridad)}</span>
                      <Badge className={`${getBadgeColor(reclamo.estado)} border`}>
                        {reclamo.estado}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-gray-700">{reclamo.descripcion}</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-3 border-t">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <MapPin className="h-4 w-4" />
                      <span>{reclamo.direccion || 'Sin dirección'}</span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar className="h-4 w-4" />
                      <span>
                        Creado: {new Date(reclamo.fecha_alta).toLocaleDateString('es-AR')}
                      </span>
                    </div>
                    
                    {reclamo.operario_asignado && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Clock className="h-4 w-4" />
                        <span>Asignado a operario</span>
                      </div>
                    )}
                  </div>

                  {reclamo.estado === 'RESUELTO' && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3 mt-3">
                      <p className="text-sm text-green-800 font-medium">
                        ✓ Reclamo resuelto el {new Date(reclamo.fecha_cierre).toLocaleDateString('es-AR')}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
