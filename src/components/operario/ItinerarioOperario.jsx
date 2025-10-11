import { useState, useEffect } from 'react';
import { Calendar, MapPin, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { useItinerario } from '../../hooks/useItinerario';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Skeleton } from '../ui/skeleton';
import { Alert, AlertDescription } from '../ui/alert';

/**
 * Componente para que operarios vean y tomen OTs de su itinerario
 */
export default function ItinerarioOperario() {
  const navigate = useNavigate();
  const [fechaSeleccionada, setFechaSeleccionada] = useState(
    format(new Date(), 'yyyy-MM-dd')
  );
  
  const {
    itinerario,
    loading,
    error,
    obtenerMiItinerario,
    tomarOT
  } = useItinerario();

  // Cargar itinerario al montar y cuando cambia la fecha
  useEffect(() => {
    if (fechaSeleccionada) {
      obtenerMiItinerario(fechaSeleccionada);
    }
  }, [fechaSeleccionada]);

  const handleTomarOT = async (otId) => {
    try {
      await tomarOT(otId);
      // Recargar el itinerario
      obtenerMiItinerario(fechaSeleccionada);
    } catch (error) {
      console.error('Error al tomar OT:', error);
    }
  };

  const handleIniciarTrabajo = (otId) => {
    navigate(`/dashboard/operario/ots-tecnicas/${otId}`);
  };

  // Separar OTs disponibles y tomadas
  const otsDisponibles = itinerario.filter(ot => !ot.empleado_id);
  const otsTomadas = itinerario.filter(ot => ot.empleado_id);

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Calendar className="h-8 w-8 text-purple-600" />
            Mi Itinerario
          </h1>
          <p className="text-gray-600 mt-1">
            Órdenes de trabajo asignadas a tu cuadrilla
          </p>
        </div>
        <Button onClick={() => navigate('/dashboard/operario')} variant="outline" size="sm">
          ← Volver al Dashboard
        </Button>
      </div>

      {/* Selector de Fecha */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Seleccionar Fecha</CardTitle>
          <CardDescription>
            Visualiza las OTs programadas para una fecha específica (formato dd/mm/aaaa)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="max-w-md space-y-2">
            <Input
              type="date"
              value={fechaSeleccionada}
              onChange={(e) => setFechaSeleccionada(e.target.value)}
              className="w-full"
            />
            <p className="text-sm text-gray-600">
              Mostrando: <span className="font-semibold">
                {format(new Date(fechaSeleccionada + 'T00:00:00'), 'dd/MM/yyyy', { locale: es })}
              </span>
            </p>
          </div>
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Resumen */}
      {!loading && itinerario.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-purple-600">{itinerario.length}</p>
                <p className="text-sm text-gray-600">Total de OTs</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-yellow-600">{otsDisponibles.length}</p>
                <p className="text-sm text-gray-600">Disponibles</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-green-600">{otsTomadas.length}</p>
                <p className="text-sm text-gray-600">Mis OTs</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* OTs Disponibles para Tomar */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-600" />
              OTs Disponibles
            </CardTitle>
            <CardDescription>
              {otsDisponibles.length} órdenes que puedes tomar
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[1, 2].map(i => <Skeleton key={i} className="h-32 w-full" />)}
              </div>
            ) : otsDisponibles.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No hay OTs disponibles para tomar</p>
                <p className="text-sm mt-1">Verifica más tarde o en otra fecha</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {otsDisponibles.map((ot) => (
                  <div
                    key={ot.id}
                    className="border-2 border-yellow-200 rounded-lg p-4 bg-yellow-50 hover:shadow-md transition-shadow"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline">OT #{ot.id}</Badge>
                          <Badge className="bg-orange-100 text-orange-800">
                            {ot.prioridad}
                          </Badge>
                          <Badge className="bg-yellow-100 text-yellow-800">
                            Disponible
                          </Badge>
                        </div>
                        <p className="font-medium text-sm mb-2">{ot.descripcion}</p>
                      </div>
                    </div>

                    <div className="text-xs text-gray-700 space-y-1 mb-3">
                      <p className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        <strong>Dirección:</strong> {ot.domicilio}
                      </p>
                      <p><strong>Socio:</strong> {ot.socio_nombre} ({ot.nro_socio})</p>
                      <p><strong>Cuenta:</strong> {ot.cuenta_nro}</p>
                      <p className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <strong>Creada:</strong> {format(new Date(ot.fecha_creacion), 'dd/MM/yyyy HH:mm', { locale: es })}
                      </p>
                    </div>

                    <Button
                      onClick={() => handleTomarOT(ot.id)}
                      disabled={loading}
                      size="sm"
                      className="w-full bg-purple-600 hover:bg-purple-700"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Tomar esta OT
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Mis OTs Tomadas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Mis OTs
            </CardTitle>
            <CardDescription>
              {otsTomadas.length} órdenes que has tomado
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[1, 2].map(i => <Skeleton key={i} className="h-32 w-full" />)}
              </div>
            ) : otsTomadas.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <CheckCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No has tomado ninguna OT</p>
                <p className="text-sm mt-1">Selecciona una OT de las disponibles</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {otsTomadas.map((ot) => (
                  <div
                    key={ot.id}
                    className="border-2 border-green-200 rounded-lg p-4 bg-green-50 hover:shadow-md transition-shadow"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline">OT #{ot.id}</Badge>
                          <Badge className={
                            ot.estado === 'PENDIENTE' 
                              ? "bg-blue-100 text-blue-800"
                              : ot.estado === 'EN_PROGRESO'
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-green-100 text-green-800"
                          }>
                            {ot.estado === 'PENDIENTE' ? 'Pendiente' : 
                             ot.estado === 'EN_PROGRESO' ? 'En Progreso' : 'Completada'}
                          </Badge>
                          <Badge className="bg-orange-100 text-orange-800">
                            {ot.prioridad}
                          </Badge>
                        </div>
                        <p className="font-medium text-sm mb-2">{ot.descripcion}</p>
                      </div>
                    </div>

                    <div className="text-xs text-gray-700 space-y-1 mb-3">
                      <p className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        <strong>Dirección:</strong> {ot.domicilio}
                      </p>
                      <p><strong>Socio:</strong> {ot.socio_nombre} ({ot.nro_socio})</p>
                      <p><strong>Cuenta:</strong> {ot.cuenta_nro}</p>
                      {ot.fecha_asignacion && (
                        <p className="flex items-center gap-1 text-green-700">
                          <Clock className="h-3 w-3" />
                          <strong>Tomada:</strong> {format(new Date(ot.fecha_asignacion), 'dd/MM/yyyy HH:mm', { locale: es })}
                        </p>
                      )}
                    </div>

                    {ot.estado === 'PENDIENTE' && (
                      <Button
                        onClick={() => handleIniciarTrabajo(ot.id)}
                        size="sm"
                        className="w-full bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Iniciar Trabajo
                      </Button>
                    )}
                    {ot.estado === 'EN_PROGRESO' && (
                      <Button
                        onClick={() => handleIniciarTrabajo(ot.id)}
                        size="sm"
                        variant="outline"
                        className="w-full"
                      >
                        Continuar Trabajo
                      </Button>
                    )}
                    {ot.estado === 'COMPLETADA' && (
                      <Badge className="w-full justify-center py-2 bg-gray-100 text-gray-600">
                        Trabajo Completado
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
