import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Users, Wrench, Plus, Trash2, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useItinerario } from '../../hooks/useItinerario';
import { useCuadrillas } from '../../hooks/useCuadrillas';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Skeleton } from '../ui/skeleton';
import { Alert, AlertDescription } from '../ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';

/**
 * Componente para armar itinerarios de cuadrillas (Admin)
 */
export default function ItinerarioCuadrillas() {
  const navigate = useNavigate();
  const [fechaSeleccionada, setFechaSeleccionada] = useState(
    format(new Date(), 'yyyy-MM-dd')
  );
  const [cuadrillaSeleccionada, setCuadrillaSeleccionada] = useState('');
  const [filtroOTs, setFiltroOTs] = useState('disponibles'); // 'disponibles' o 'todas'
  const [todasLasOTs, setTodasLasOTs] = useState([]);
  const [loadingTodas, setLoadingTodas] = useState(false);
  const [filtroItinerario, setFiltroItinerario] = useState('todos'); // 'fecha' o 'todos' - por defecto 'todos'
  const [todosLosItinerarios, setTodosLosItinerarios] = useState([]);
  const [loadingItinerarios, setLoadingItinerarios] = useState(false);
  
  const {
    itinerario,
    otsPendientes,
    loading,
    error,
    obtenerItinerarioCuadrilla,
    obtenerOTsPendientes,
    asignarOTaCuadrilla,
    quitarDelItinerario,
    limpiarItinerario
  } = useItinerario();

  const { 
    cuadrillas, 
    loading: loadingCuadrillas, 
    listarCuadrillas 
  } = useCuadrillas();

  // Cargar OTs y cuadrillas al montar
  useEffect(() => {
    obtenerOTsPendientes('TECNICO');
    cargarTodasLasOTs();
    listarCuadrillas(); // Cargar cuadrillas disponibles
  }, []);

  // Cargar todos los itinerarios cuando se selecciona una cuadrilla o cambia el filtro
  useEffect(() => {
    if (cuadrillaSeleccionada) {
      if (filtroItinerario === 'todos') {
        cargarTodosLosItinerarios();
      } else if (filtroItinerario === 'fecha' && fechaSeleccionada) {
        obtenerItinerarioCuadrilla(cuadrillaSeleccionada, fechaSeleccionada);
      }
    }
  }, [filtroItinerario, cuadrillaSeleccionada, fechaSeleccionada]);



  const cargarTodasLasOTs = async () => {
    setLoadingTodas(true);
    try {
      const response = await fetch('http://localhost:3001/api/ot-tecnicas', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (response.ok) {
        const resultado = await response.json();
        const ots = resultado.data || resultado;
        setTodasLasOTs(Array.isArray(ots) ? ots : []);
      } else {
        setTodasLasOTs([]);
      }
    } catch (error) {
      console.error('❌ Error al cargar todas las OTs:', error);
      setTodasLasOTs([]);
    } finally {
      setLoadingTodas(false);
    }
  };

  const cargarTodosLosItinerarios = async () => {
    if (!cuadrillaSeleccionada) return;
    
    setLoadingItinerarios(true);
    try {
      // Cargar TODOS los itinerarios de la cuadrilla (sin filtro de fecha)
      const response = await fetch(
        `http://localhost:3001/api/itinerario/cuadrilla/${cuadrillaSeleccionada}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      if (response.ok) {
        const resultado = await response.json();
        const ots = resultado.data || [];
        setTodosLosItinerarios(Array.isArray(ots) ? ots : []);
      } else {
        setTodosLosItinerarios([]);
      }
    } catch (error) {
      console.error('❌ Error al cargar todos los itinerarios:', error);
      setTodosLosItinerarios([]);
    } finally {
      setLoadingItinerarios(false);
    }
  };

  const handleAsignarOT = async (otId) => {
    if (!cuadrillaSeleccionada) {
      return;
    }
    try {
      await asignarOTaCuadrilla(otId, cuadrillaSeleccionada, fechaSeleccionada);
      // Recargar ambas listas
      obtenerOTsPendientes('TECNICO');
      obtenerItinerarioCuadrilla(cuadrillaSeleccionada, fechaSeleccionada);
    } catch (error) {
      console.error('Error al asignar OT:', error);
    }
  };

  const handleQuitarOT = async (otId) => {
    try {
      await quitarDelItinerario(otId);
      // Recargar OTs pendientes
      obtenerOTsPendientes('TECNICO');
    } catch (error) {
      console.error('Error al quitar OT:', error);
    }
  };

  const handleRefresh = () => {
    obtenerOTsPendientes('TECNICO');
    cargarTodasLasOTs();
    if (cuadrillaSeleccionada && fechaSeleccionada) {
      obtenerItinerarioCuadrilla(cuadrillaSeleccionada, fechaSeleccionada);
    }
    if (cuadrillaSeleccionada && filtroItinerario === 'todos') {
      cargarTodosLosItinerarios();
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reclamos Técnicos</h1>
          <p className="text-gray-600 mt-1">
            Gestiona y asigna órdenes de trabajo técnicas a las cuadrillas (Itinerario)
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleRefresh} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualizar
          </Button>
          <Button onClick={() => navigate('/dashboard/administrador')} variant="outline" size="sm">
            Volver
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Seleccionar Cuadrilla y Fecha</CardTitle>
          <CardDescription>
            Elige la cuadrilla y fecha para armar el itinerario
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Selector de Cuadrilla */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Users className="h-4 w-4" />
                Cuadrilla
              </label>
              {loadingCuadrillas ? (
                <Skeleton className="h-10 w-full" />
              ) : (
                <Select value={cuadrillaSeleccionada} onValueChange={setCuadrillaSeleccionada}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona una cuadrilla" />
                  </SelectTrigger>
                  <SelectContent>
                    {cuadrillas && cuadrillas.length > 0 ? (
                      cuadrillas.map((cuadrilla) => (
                        <SelectItem 
                          key={cuadrilla.cuadrilla_id || cuadrilla.id} 
                          value={(cuadrilla.cuadrilla_id || cuadrilla.id)?.toString()}
                        >
                          {cuadrilla.nombre} ({cuadrilla.miembros_count || cuadrilla.operarios_count || 0} operarios)
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="sin-cuadrillas" disabled>
                        No hay cuadrillas disponibles
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Selector de Fecha */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Fecha
              </label>
              <Input
                type="date"
                value={fechaSeleccionada}
                onChange={(e) => {
                  setFechaSeleccionada(e.target.value);
                  // Cambiar automáticamente a vista de "Solo esta fecha"
                  setFiltroItinerario('fecha');
                }}
                className="w-full"
              />
              <p className="text-xs text-gray-500 font-medium">
                📅 {fechaSeleccionada && format(new Date(fechaSeleccionada + 'T00:00:00'), 'dd/MM/yyyy', { locale: es })}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* OTs Pendientes - LISTA COMPACTA */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wrench className="h-5 w-5" />
              OTs Técnicas Disponibles ({otsPendientes.length})
            </CardTitle>
            <CardDescription>
              OTs pendientes que pueden asignarse al itinerario
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">
                {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-12 w-full" />)}
              </div>
            ) : otsPendientes.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Wrench className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p className="font-semibold mb-2">No hay OTs disponibles</p>
                <p className="text-sm">Todas las OTs técnicas ya están asignadas a itinerarios</p>
              </div>
            ) : (
              <div className="max-h-[600px] overflow-y-auto space-y-1">
                {otsPendientes.map((ot) => (
                  <div
                    key={ot.id || ot.ot_id}
                    className="flex items-center justify-between p-3 border rounded transition-colors hover:bg-gray-50"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="font-bold text-blue-600">#{ot.id || ot.ot_id}</span>
                        <Badge className={
                          (ot.prioridad || '').toUpperCase() === 'ALTA' ? 'bg-red-100 text-red-800 text-xs' :
                          (ot.prioridad || '').toUpperCase() === 'MEDIA' ? 'bg-yellow-100 text-yellow-800 text-xs' :
                          'bg-green-100 text-green-800 text-xs'
                        }>
                          {ot.prioridad}
                        </Badge>
                      </div>
                      <p className="text-sm font-medium truncate">
                        {ot.socio_nombre} {ot.socio_apellido} (Socio #{ot.nro_socio || ot.socio_id})
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        📍 {ot.domicilio || 'Sin dirección'} • Cuenta: {ot.cuenta_nro || ot.numero_cuenta}
                      </p>
                    </div>
                    <Button
                      onClick={() => handleAsignarOT(ot.id || ot.ot_id)}
                      disabled={!cuadrillaSeleccionada || loading}
                      size="sm"
                      className="ml-3 shrink-0"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Asignar
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Itinerario de la Cuadrilla - TABLA */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Itinerario
            </CardTitle>
            <CardDescription>
              {cuadrillaSeleccionada
                ? filtroItinerario === 'fecha' 
                  ? `${itinerario.length} OTs para ${format(new Date(fechaSeleccionada + 'T00:00:00'), 'dd/MM/yyyy', { locale: es })}`
                  : `${todosLosItinerarios.length} OTs en todos los itinerarios`
                : 'Selecciona una cuadrilla para ver su itinerario'}
            </CardDescription>
            {cuadrillaSeleccionada && (
              <div className="flex gap-2 mt-4">
                <Button
                  variant={filtroItinerario === 'fecha' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFiltroItinerario('fecha')}
                  className="flex-1"
                >
                  Solo esta fecha ({itinerario.length})
                </Button>
                <Button
                  variant={filtroItinerario === 'todos' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFiltroItinerario('todos')}
                  className="flex-1"
                >
                  Todos ({todosLosItinerarios.length})
                </Button>
              </div>
            )}
          </CardHeader>
          <CardContent>
            {!cuadrillaSeleccionada ? (
              <div className="text-center py-12 text-gray-400">
                <Users className="h-16 w-16 mx-auto mb-3 opacity-30" />
                <p className="text-lg">Selecciona una cuadrilla</p>
                <p className="text-sm">para comenzar a armar el itinerario</p>
              </div>
            ) : ((loading && filtroItinerario === 'fecha') || (loadingItinerarios && filtroItinerario === 'todos')) ? (
              <div className="space-y-3">
                {[1, 2].map(i => <Skeleton key={i} className="h-16 w-full" />)}
              </div>
            ) : filtroItinerario === 'fecha' && itinerario.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No hay OTs asignadas para esta fecha</p>
                <p className="text-sm mt-1">Asigna OTs desde la lista de pendientes</p>
              </div>
            ) : filtroItinerario === 'todos' && todosLosItinerarios.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No hay itinerarios para esta cuadrilla</p>
                <p className="text-sm mt-1">Asigna OTs para crear itinerarios</p>
              </div>
            ) : (
              <div className="max-h-[600px] overflow-y-auto border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">#</TableHead>
                      <TableHead className="w-16">OT</TableHead>
                      <TableHead>Socio{filtroItinerario === 'todos' && ' / Fecha'}</TableHead>
                      <TableHead>Dirección</TableHead>
                      <TableHead className="w-32">Estado</TableHead>
                      <TableHead className="w-32">{filtroItinerario === 'fecha' ? 'Acción' : 'Estado'}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(filtroItinerario === 'fecha' ? itinerario : todosLosItinerarios).map((ot, index) => (
                      <TableRow key={ot.id || ot.ot_id} className={
                        ot.estado === 'EN CURSO' ? 'bg-blue-50' :
                        ot.estado === 'ASIGNADA' ? 'bg-green-50' :
                        'bg-yellow-50'
                      }>
                        <TableCell className="font-bold text-blue-600">
                          {index + 1}
                        </TableCell>
                        <TableCell className="font-medium">#{ot.id || ot.ot_id}</TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <p className="font-medium">{ot.socio_nombre} {ot.socio_apellido}</p>
                            <p className="text-gray-500 text-xs">
                              Socio #{ot.socio_id}
                            </p>
                            {filtroItinerario === 'todos' && ot.fecha_itinerario && (
                              <p className="text-purple-600 text-xs mt-1 font-medium">
                                📅 {(() => {
                                  try {
                                    const fecha = new Date(ot.fecha_itinerario);
                                    return isNaN(fecha.getTime()) 
                                      ? 'Fecha inválida' 
                                      : format(fecha, 'dd/MM/yyyy', { locale: es });
                                  } catch (e) {
                                    return 'Fecha inválida';
                                  }
                                })()}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">{ot.domicilio || 'Sin dirección'}</TableCell>
                        <TableCell>
                          <Badge className={
                            ot.estado === 'EN CURSO' ? "bg-blue-100 text-blue-800" :
                            ot.estado === 'ASIGNADA' ? "bg-green-100 text-green-800" :
                            "bg-yellow-100 text-yellow-800"
                          }>
                            {ot.estado}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {filtroItinerario === 'fecha' ? (
                            <Button
                              onClick={() => handleQuitarOT(ot.id || ot.ot_id)}
                              disabled={loading || ot.estado === 'EN_PROGRESO' || ot.estado === 'COMPLETADA'}
                              size="sm"
                              variant="destructive"
                              className="w-full"
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              Quitar
                            </Button>
                          ) : (
                            <Badge variant="outline" className="w-full text-center">
                              {ot.estado}
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
