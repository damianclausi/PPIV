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
  const [filtroItinerario, setFiltroItinerario] = useState('fecha'); // 'fecha' o 'todos'
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
    console.log('🔄 Componente montado - Cargando OTs...');
    obtenerOTsPendientes('TECNICO');
    cargarTodasLasOTs();
    listarCuadrillas(); // Cargar cuadrillas disponibles
  }, []);

  // Cargar todos los itinerarios cuando se selecciona filtro "todos"
  useEffect(() => {
    if (filtroItinerario === 'todos' && cuadrillaSeleccionada) {
      cargarTodosLosItinerarios();
    }
  }, [filtroItinerario, cuadrillaSeleccionada]);

  // Debug: ver cambios en los estados
  useEffect(() => {
    console.log('📋 OTs Pendientes:', otsPendientes?.length, otsPendientes);
    if (otsPendientes?.length > 0) {
      console.log('� Primera OT pendiente:', otsPendientes[0]);
    }
    console.log('�📊 Todas las OTs:', todasLasOTs?.length, todasLasOTs);
    if (todasLasOTs?.length > 0) {
      console.log('📊 Primera OT de todas:', todasLasOTs[0]);
    }
  }, [otsPendientes, todasLasOTs]);

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
        console.log('📊 Respuesta del backend:', resultado);
        // El backend devuelve { success, data, total }
        const ots = resultado.data || resultado;
        console.log('📊 Todas las OTs recibidas:', ots?.length, ots);
        setTodasLasOTs(Array.isArray(ots) ? ots : []);
      } else {
        console.error('❌ Error al cargar OTs:', response.status);
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
      // Cargar OTs de la cuadrilla seleccionada (sin filtro de fecha)
      const response = await fetch(
        `http://localhost:3001/api/ot-tecnicas?cuadrilla_id=${cuadrillaSeleccionada}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      if (response.ok) {
        const resultado = await response.json();
        console.log('🗓️ Todos los itinerarios recibidos:', resultado);
        const ots = resultado.data || resultado;
        // Filtrar solo las que tienen [ITINERARIO] en observaciones
        const otsItinerario = Array.isArray(ots) 
          ? ots.filter(ot => ot.observaciones?.includes('[ITINERARIO]'))
          : [];
        console.log('🗓️ OTs en itinerarios:', otsItinerario?.length, otsItinerario);
        setTodosLosItinerarios(otsItinerario);
      } else {
        console.error('❌ Error al cargar itinerarios:', response.status);
        setTodosLosItinerarios([]);
      }
    } catch (error) {
      console.error('❌ Error al cargar todos los itinerarios:', error);
      setTodosLosItinerarios([]);
    } finally {
      setLoadingItinerarios(false);
    }
  };

  // Cargar itinerario cuando cambia la selección
  useEffect(() => {
    if (cuadrillaSeleccionada && fechaSeleccionada) {
      obtenerItinerarioCuadrilla(cuadrillaSeleccionada, fechaSeleccionada);
    } else {
      limpiarItinerario();
    }
  }, [cuadrillaSeleccionada, fechaSeleccionada]);

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
            {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Itinerario de Cuadrillas</h1>
          <p className="text-gray-600 mt-1">
            Asigna órdenes de trabajo técnicas a las cuadrillas
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
                Fecha (dd/mm/aaaa)
              </label>
              <Input
                type="date"
                value={fechaSeleccionada}
                onChange={(e) => setFechaSeleccionada(e.target.value)}
                className="w-full"
              />
              <p className="text-xs text-gray-500">
                {fechaSeleccionada && format(new Date(fechaSeleccionada + 'T00:00:00'), 'dd/MM/yyyy', { locale: es })}
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
              OTs Técnicas
            </CardTitle>
            <CardDescription>
              Filtro para ver disponibles o todas las OTs
            </CardDescription>
            <div className="flex gap-2 mt-4">
              <Button
                variant={filtroOTs === 'disponibles' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFiltroOTs('disponibles')}
                className="flex-1"
              >
                Solo Disponibles ({otsPendientes.length})
              </Button>
              <Button
                variant={filtroOTs === 'todas' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFiltroOTs('todas')}
                className="flex-1"
              >
                Todas ({todasLasOTs.length})
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {((loading && filtroOTs === 'disponibles') || (loadingTodas && filtroOTs === 'todas')) ? (
              <div className="space-y-2">
                {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-12 w-full" />)}
              </div>
            ) : filtroOTs === 'disponibles' && otsPendientes.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Wrench className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p className="font-semibold mb-2">No hay OTs disponibles</p>
                <p className="text-sm">Las OTs técnicas ya están asignadas a operarios</p>
                <p className="text-xs mt-4 text-gray-400">
                  Usa el filtro "Todas" para ver todas las OTs técnicas
                </p>
              </div>
            ) : (
              <div className="max-h-[600px] overflow-y-auto space-y-1">
                {(filtroOTs === 'disponibles' ? otsPendientes : (todasLasOTs || [])).map((ot) => (
                  <div
                    key={ot.id || ot.ot_id}
                    className={`flex items-center justify-between p-3 border rounded transition-colors ${
                      filtroOTs === 'todas' && ot.empleado_id 
                        ? 'bg-gray-100 opacity-70' 
                        : 'hover:bg-gray-50'
                    }`}
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
                        {filtroOTs === 'todas' && ot.empleado_id && (
                          <Badge variant="secondary" className="text-xs bg-gray-300">
                            Asignada a emp. #{ot.empleado_id}
                          </Badge>
                        )}
                        {filtroOTs === 'todas' && !ot.empleado_id && (
                          <Badge variant="default" className="text-xs bg-green-600">
                            ✓ Disponible
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm font-medium truncate">
                        {ot.socio_nombre || ot.nombre} (Socio #{ot.nro_socio || ot.socio_id})
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        📍 {ot.domicilio || 'Sin dirección'} • Cuenta: {ot.cuenta_nro || ot.numero_cuenta}
                      </p>
                      {filtroOTs === 'todas' && ot.observaciones && ot.observaciones.includes('[ITINERARIO]') && (
                        <p className="text-xs text-purple-600 mt-1">
                          🗓️ Ya en itinerario
                        </p>
                      )}
                    </div>
                    {(filtroOTs === 'disponibles' || !ot.empleado_id) && (
                      <Button
                        onClick={() => handleAsignarOT(ot.id || ot.ot_id)}
                        disabled={!cuadrillaSeleccionada || loading}
                        size="sm"
                        className="ml-3 shrink-0"
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Asignar
                      </Button>
                    )}
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
                      <TableRow key={ot.id || ot.ot_id} className={ot.empleado_id ? 'bg-green-50' : 'bg-yellow-50'}>
                        <TableCell className="font-bold text-blue-600">
                          {index + 1}
                        </TableCell>
                        <TableCell className="font-medium">#{ot.id || ot.ot_id}</TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <p className="font-medium">{ot.socio_nombre || ot.nombre}</p>
                            <p className="text-gray-500 text-xs">
                              {ot.empleado_nombre ? `Tomada por: ${ot.empleado_nombre}` : 'Disponible'}
                            </p>
                            {filtroItinerario === 'todos' && ot.observaciones && (
                              <p className="text-purple-600 text-xs mt-1">
                                {ot.observaciones.match(/\[ITINERARIO: ([\d-]+)\]/)?.[1] 
                                  ? `📅 ${format(new Date(ot.observaciones.match(/\[ITINERARIO: ([\d-]+)\]/)[1] + 'T00:00:00'), 'dd/MM/yyyy', { locale: es })}`
                                  : '📅 Fecha no especificada'}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">{ot.domicilio || 'Sin dirección'}</TableCell>
                        <TableCell>
                          <Badge className={
                            ot.empleado_id 
                              ? "bg-green-100 text-green-800" 
                              : "bg-yellow-100 text-yellow-800"
                          }>
                            {ot.empleado_id ? 'Tomada' : 'Disponible'}
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
