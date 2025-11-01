import { useState, useEffect } from 'react';
import CooperativaLayout from '../layout/CooperativaLayout';
import { Calendar, MapPin, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useItinerario } from '../../hooks/useItinerario';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Skeleton } from '../ui/skeleton';
import { Alert, AlertDescription } from '../ui/alert';

/**
 * Componente para que operarios vean las OTs asignadas por el administrador
 * Las OTs son asignadas directamente por el administrador, no se pueden "tomar"
 */
export default function ItinerarioOperario() {
  const navigate = useNavigate();
  const { usuario } = useAuth();
  const [fechaSeleccionada, setFechaSeleccionada] = useState(null);
  const [vistaActual, setVistaActual] = useState('fechas'); // 'fechas' o 'itinerario'
  
  const {
    itinerario,
    fechasDisponibles,
    loading,
    error,
    obtenerMiItinerario,
    obtenerFechasDisponibles
  } = useItinerario();

  // Cargar fechas disponibles al montar
  useEffect(() => {
    obtenerFechasDisponibles();
  }, []);

  // Cargar itinerario cuando se selecciona una fecha
  useEffect(() => {
    if (fechaSeleccionada) {
      obtenerMiItinerario(fechaSeleccionada);
      setVistaActual('itinerario');
    }
  }, [fechaSeleccionada]);

  const handleSeleccionarFecha = (fecha) => {
    setFechaSeleccionada(fecha);
  };

  const handleVolverAFechas = () => {
    setVistaActual('fechas');
    setFechaSeleccionada(null);
  };

  // Mostrar TODAS las OTs del itinerario de la cuadrilla (todos los operarios ven las mismas OTs)
  const misOTs = itinerario;

  return (
    <CooperativaLayout titulo="Mi Itinerario">
      <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mi Itinerario</h1>
          <p className="text-gray-600 mt-1">
            {vistaActual === 'fechas' 
              ? 'Consulta las fechas con trabajos asignados por tu supervisor'
              : 'Vista de consulta - Para trabajar en una OT, ve al Dashboard principal'
            }
          </p>
        </div>
        <Button 
          onClick={vistaActual === 'fechas' ? () => navigate('/dashboard/operario') : handleVolverAFechas} 
          variant="outline" 
          size="sm"
        >
          {vistaActual === 'fechas' ? 'Volver al Dashboard' : 'Ver Otras Fechas'}
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Vista: Lista de Fechas Disponibles */}
      {vistaActual === 'fechas' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-purple-600" />
              Fechas con Itinerarios
            </CardTitle>
            <CardDescription>
              Selecciona una fecha para ver las órdenes de trabajo disponibles
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 w-full" />)}
              </div>
            ) : fechasDisponibles.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Calendar className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">No hay itinerarios programados</p>
                <p className="text-sm mt-2">Consulta más tarde o contacta a tu supervisor</p>
              </div>
            ) : (
              <div className="space-y-3">
                {fechasDisponibles.map((fechaInfo) => {
                  // Parsear fecha correctamente
                  const fechaStr = typeof fechaInfo.fecha === 'string' 
                    ? fechaInfo.fecha.split('T')[0] 
                    : fechaInfo.fecha;
                  
                  return (
                  <div
                    key={fechaInfo.fecha}
                    onClick={() => handleSeleccionarFecha(fechaStr)}
                    className="border-2 border-purple-200 rounded-lg p-4 bg-white hover:bg-purple-50 hover:shadow-lg transition-all cursor-pointer"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Calendar className="h-5 w-5 text-purple-600" />
                          <h3 className="text-lg font-bold text-gray-900">
                            {format(new Date(fechaStr + 'T12:00:00'), 'EEEE, dd/MM/yyyy', { locale: es })}
                          </h3>
                        </div>
                        <div className="flex gap-4 text-sm">
                          <span className="flex items-center gap-1">
                            <Badge className="bg-purple-100 text-purple-800 text-base font-semibold px-3 py-1">
                              {fechaInfo.ots_tomadas} {fechaInfo.ots_tomadas === 1 ? 'Trabajo Asignado' : 'Trabajos Asignados'}
                            </Badge>
                          </span>
                        </div>
                      </div>
                      <Button size="sm" className="bg-purple-600 hover:bg-purple-700">
                        Ver Mis Trabajos
                      </Button>
                    </div>
                  </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Vista: Itinerario de Fecha Seleccionada */}
      {vistaActual === 'itinerario' && fechaSeleccionada && (
        <>
          {/* Info de fecha seleccionada */}
          <Card className="bg-purple-50 border-purple-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Calendar className="h-6 w-6 text-purple-600" />
                  <div>
                    <p className="text-sm text-gray-600">Viendo itinerario de</p>
                    <p className="text-xl font-bold text-gray-900">
                      {format(new Date(fechaSeleccionada + 'T12:00:00'), 'EEEE, dd/MM/yyyy', { locale: es })}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Resumen */}
          {!loading && misOTs.length > 0 && (
        <div className="max-w-md mx-auto">
          <Card className="border-purple-200 bg-purple-50">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-4xl font-bold text-purple-600">{misOTs.length}</p>
                <p className="text-sm text-gray-700 mt-1 font-medium">
                  {misOTs.length === 1 ? 'Trabajo Asignado' : 'Trabajos Asignados'}
                </p>
              </div>
            </CardContent>
          </Card>
          </div>
        )}

        {/* Mis OTs Asignadas */}
        <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-purple-600" />
              Mis Trabajos Asignados
            </CardTitle>
            <CardDescription>
              {misOTs.length} {misOTs.length === 1 ? 'orden asignada' : 'órdenes asignadas'} para esta fecha
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[1, 2].map(i => <Skeleton key={i} className="h-32 w-full" />)}
              </div>
            ) : misOTs.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <AlertCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p className="font-medium">No tienes trabajos asignados para esta fecha</p>
                <p className="text-sm mt-1">Esta es una vista de consulta. Ve al Dashboard para trabajar en tus OTs pendientes.</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {misOTs.map((ot) => (
                  <div
                    key={ot.id}
                    className="border-2 border-purple-200 rounded-lg p-4 bg-purple-50 hover:shadow-md transition-shadow"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline">OT #{ot.id}</Badge>
                          <Badge className={
                            ot.estado === 'PENDIENTE' 
                              ? "bg-blue-100 text-blue-800"
                              : ot.estado === 'EN_PROCESO'
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-green-100 text-green-800"
                          }>
                            {ot.estado === 'PENDIENTE' ? 'Pendiente' : 
                             ot.estado === 'EN_PROCESO' ? 'En Progreso' : 'Completada'}
                          </Badge>
                          <Badge className="bg-orange-100 text-orange-800">
                            {ot.prioridad}
                          </Badge>
                        </div>
                        <p className="font-medium text-sm mb-2">{ot.descripcion}</p>
                      </div>
                    </div>

                    <div className="text-xs text-gray-700 space-y-1">
                      <p className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        <strong>Dirección:</strong> {ot.domicilio}
                      </p>
                      <p><strong>Socio:</strong> {ot.socio_nombre} {ot.socio_apellido}</p>
                      <p><strong>Cuenta:</strong> {ot.numero_cuenta}</p>
                      {ot.created_at && (
                        <p className="flex items-center gap-1 text-purple-700">
                          <Clock className="h-3 w-3" />
                          <strong>Asignada:</strong> {format(new Date(ot.created_at), 'dd/MM/yyyy HH:mm', { locale: es })}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        </div>
        </>
      )}
      </div>
    </CooperativaLayout>
  );
}
