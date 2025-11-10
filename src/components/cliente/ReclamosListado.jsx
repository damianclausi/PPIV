import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import CooperativaLayout from '../layout/CooperativaLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Skeleton } from '../ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { ArrowLeft, AlertCircle, MapPin, Calendar, Clock, Plus, AlertTriangle, Info, CheckCircle, Filter, RefreshCw, Star } from 'lucide-react';
import { useReclamos } from '../../hooks/useCliente';
import { formatearFecha } from '../../utils/formatters.js';
import { RatingStars } from '../ui/RatingStars';
import { ModalValoracion } from '../ModalValoracion';

export default function ReclamosListado() {
  const navigate = useNavigate();
  const { reclamos, cargando, error, recargar } = useReclamos();
  const [estadoFiltro, setEstadoFiltro] = useState('TODOS');
  const [recargando, setRecargando] = useState(false);
  const [modalValoracionAbierto, setModalValoracionAbierto] = useState(false);
  const [reclamoAValorar, setReclamoAValorar] = useState(null);

  // Auto-recargar cada 30 segundos para mantener datos actualizados
  useEffect(() => {
    if (!recargar) return;
    
    const intervalo = setInterval(() => {
      recargar();
    }, 30000); // 30 segundos

    return () => {
      clearInterval(intervalo);
    };
  }, [recargar]); // Ahora recargar está memoizado, así que es seguro

  // Función para recarga manual
  const handleRecargar = async () => {
    setRecargando(true);
    try {
      await recargar();
    } catch (error) {
      console.error('❌ Error en recarga manual:', error);
    } finally {
      setRecargando(false);
    }
  };

  // Abrir modal de valoración (crear o editar)
  const handleAbrirValoracion = (reclamo, e) => {
    e.stopPropagation(); // Evitar que se abra el detalle del reclamo
    setReclamoAValorar(reclamo);
    setModalValoracionAbierto(true);
  };

  // Después de valorar/editar exitosamente
  const handleValoracionExitosa = () => {
    recargar(); // Recargar la lista para mostrar la valoración actualizada
  };

  const getBadgeColor = (estado) => {
    switch (estado) {
      case 'PENDIENTE':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'EN CURSO':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'RESUELTO':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPrioridadIcon = (prioridad) => {
    if (prioridad === 'ALTA') return <AlertTriangle className="h-4 w-4 text-red-600" />;
    if (prioridad === 'MEDIA') return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
    return <CheckCircle className="h-4 w-4 text-green-600" />;
  };

  // Filtrar reclamos por estado
  const reclamosFiltrados = reclamos?.filter(reclamo => {
    if (estadoFiltro === 'TODOS') return true;
    return reclamo.estado === estadoFiltro;
  }) || [];

  if (cargando) {
    return (
      <CooperativaLayout titulo="Mis Reclamos">
        <div className="space-y-6">
          <Skeleton className="h-12 w-96" />
          <div className="grid gap-4">
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </div>
        </div>
      </CooperativaLayout>
    );
  }

  return (
    <CooperativaLayout titulo="Mis Reclamos">
      <div className="space-y-4 sm:space-y-6 px-4 sm:px-0">
        {/* Header */}
        <div className="space-y-3 sm:space-y-4">
          <div className="flex justify-end">
            <Button variant="outline" size="sm" onClick={() => navigate('/dashboard')}>
              Volver
            </Button>
          </div>
          <div className="flex flex-col sm:flex-row justify-end gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleRecargar}
              disabled={recargando}
              className="text-xs sm:text-sm"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${recargando ? 'animate-spin' : ''}`} />
              {recargando ? 'Actualizando...' : 'Actualizar'}
            </Button>
            <Button onClick={() => navigate('/dashboard/reclamos/nuevo')} size="sm" className="text-xs sm:text-sm">
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Reclamo
            </Button>
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Mis Reclamos</h1>
            <p className="text-sm sm:text-base text-gray-600 mt-1">
              {reclamosFiltrados.length} de {reclamos?.length || 0} reclamo(s)
            </p>
          </div>
        </div>

        {/* Filtros */}
        <Card>
          <CardContent className="p-4 sm:pt-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
              <Filter className="h-5 w-5 text-gray-500" />
              <div className="flex-1 w-full grid grid-cols-1 gap-3 sm:gap-4">
                <div className="space-y-2">
                  <label className="text-xs sm:text-sm font-medium text-gray-700">Estado</label>
                  <Select value={estadoFiltro} onValueChange={setEstadoFiltro}>
                    <SelectTrigger className="text-xs sm:text-sm">
                      <SelectValue placeholder="Todos los estados" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TODOS" className="text-xs sm:text-sm">Todos los estados</SelectItem>
                      <SelectItem value="PENDIENTE" className="text-xs sm:text-sm">Pendiente</SelectItem>
                      <SelectItem value="EN CURSO" className="text-xs sm:text-sm">En Curso</SelectItem>
                      <SelectItem value="RESUELTO" className="text-xs sm:text-sm">Resuelto</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

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
            <CardContent className="p-4 sm:pt-6 text-center py-8 sm:py-12">
              <AlertCircle className="h-10 sm:h-12 w-10 sm:w-12 text-gray-400 mx-auto mb-3 sm:mb-4" />
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">
                No tienes reclamos registrados
              </h3>
              <p className="text-sm sm:text-base text-gray-600 mb-4">
                Crea tu primer reclamo para que podamos ayudarte
              </p>
              <Button onClick={() => navigate('/dashboard/reclamos/nuevo')} className="text-xs sm:text-sm">
                <Plus className="h-4 w-4 mr-2" />
                Crear Primer Reclamo
              </Button>
            </CardContent>
          </Card>
        ) : reclamosFiltrados.length === 0 ? (
          <Card>
            <CardContent className="p-4 sm:pt-6 text-center py-8 sm:py-12">
              <Info className="h-10 sm:h-12 w-10 sm:w-12 text-blue-400 mx-auto mb-3 sm:mb-4" />
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">
                No hay reclamos con este filtro
              </h3>
              <p className="text-sm sm:text-base text-gray-600 mb-4">
                Intenta cambiar los filtros para ver más resultados
              </p>
              <Button variant="outline" onClick={() => setEstadoFiltro('TODOS')} className="text-xs sm:text-sm">
                Limpiar Filtros
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3 sm:gap-4">
            {reclamosFiltrados.map(reclamo => (
              <Card 
                key={reclamo.reclamo_id} 
                className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => navigate(`/dashboard/reclamos/${reclamo.reclamo_id}`)}
              >
                <CardHeader className="p-4 sm:pb-3">
                  <div className="flex flex-col sm:flex-row items-start justify-between gap-2">
                    <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                      <AlertCircle className="h-4 sm:h-5 w-4 sm:w-5 text-orange-600 flex-shrink-0" />
                      <span className="line-clamp-1">{reclamo.tipo_reclamo || 'Reclamo Técnico'}</span>
                      <span className="text-xs sm:text-sm font-normal text-gray-500">
                        #{reclamo.reclamo_id}
                      </span>
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <span className="text-base sm:text-lg">{getPrioridadIcon(reclamo.prioridad)}</span>
                      <Badge className={`${getBadgeColor(reclamo.estado)} border text-xs`}>
                        {reclamo.estado}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 p-4 sm:px-6">
                  <p className="text-sm sm:text-base text-gray-700">{reclamo.descripcion}</p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 pt-3 border-t">
                    <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
                      <MapPin className="h-3 sm:h-4 w-3 sm:w-4 flex-shrink-0" />
                      <span className="line-clamp-1">{reclamo.direccion || 'Sin dirección'}</span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
                      <Calendar className="h-3 sm:h-4 w-3 sm:w-4 flex-shrink-0" />
                      <span>
                        Creado: {formatearFecha(reclamo.fecha_alta)}
                      </span>
                    </div>
                    
                    {reclamo.operario_asignado && (
                      <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
                        <Clock className="h-3 sm:h-4 w-3 sm:w-4 flex-shrink-0" />
                        <span>Asignado a operario</span>
                      </div>
                    )}
                  </div>

                  {reclamo.estado === 'RESUELTO' && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3 mt-3">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                        <p className="text-xs sm:text-sm text-green-800 font-medium">
                          ✓ Reclamo resuelto el {formatearFecha(reclamo.fecha_cierre)}
                        </p>
                        
                        {reclamo.valoracion_id ? (
                          // Mostrar valoración existente con botón editar
                          <div className="flex items-center gap-2 sm:gap-3">
                            <RatingStars 
                              rating={reclamo.calificacion} 
                              mode="readonly" 
                              size="sm"
                            />
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-green-700 hover:bg-green-100 h-7 sm:h-8 px-2 text-xs"
                              onClick={(e) => handleAbrirValoracion(reclamo, e)}
                            >
                              <Star className="h-3 w-3 mr-1" />
                              Editar
                            </Button>
                          </div>
                        ) : (
                          // Botón para valorar por primera vez
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-green-600 text-green-700 hover:bg-green-100 text-xs"
                            onClick={(e) => handleAbrirValoracion(reclamo, e)}
                          >
                            <Star className="h-3 sm:h-4 w-3 sm:w-4 mr-1" />
                            Valorar
                          </Button>
                        )}
                      </div>
                      
                      {reclamo.comentario_valoracion && (
                        <p className="text-xs text-green-700 mt-2 italic">
                          "{reclamo.comentario_valoracion}"
                        </p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Modal de Valoración */}
      {reclamoAValorar && (
        <ModalValoracion
          open={modalValoracionAbierto}
          onClose={() => {
            setModalValoracionAbierto(false);
            setReclamoAValorar(null);
          }}
          reclamoId={reclamoAValorar.reclamo_id}
          numeroReclamo={reclamoAValorar.reclamo_id}
          onSuccess={handleValoracionExitosa}
          valoracionExistente={reclamoAValorar.valoracion_id ? {
            valoracion_id: reclamoAValorar.valoracion_id,
            calificacion: reclamoAValorar.calificacion,
            comentario: reclamoAValorar.comentario_valoracion
          } : null}
        />
      )}
    </CooperativaLayout>
  );
}
