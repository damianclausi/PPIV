import React, { useEffect, useState } from 'react';
import CooperativaLayout from '../layout/CooperativaLayout';
import { useOTsTecnicas } from '../../hooks/useOTsTecnicas';
import { useCuadrillas } from '../../hooks/useCuadrillas';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { Loader2, UserPlus, MapPin, User, RefreshCw, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const ESTADOS_CONFIG = {
  PENDIENTE: {
    label: 'Pendiente',
    variant: 'destructive',
    color: 'bg-red-100 text-red-800'
  },
  ASIGNADA: {
    label: 'Asignada',
    variant: 'default',
    color: 'bg-blue-100 text-blue-800'
  },
  EN_PROCESO: {
    label: 'En Proceso',
    variant: 'secondary',
    color: 'bg-yellow-100 text-yellow-800'
  },
  'EN CURSO': {
    label: 'En Curso',
    variant: 'secondary',
    color: 'bg-yellow-100 text-yellow-800'
  },
  COMPLETADA: {
    label: 'Completada',
    variant: 'outline',
    color: 'bg-green-100 text-green-800'
  },
  CERRADO: {
    label: 'Cerrada',
    variant: 'outline',
    color: 'bg-green-100 text-green-800'
  },
  RESUELTO: {
    label: 'Resuelta',
    variant: 'outline',
    color: 'bg-green-100 text-green-800'
  }
};

const SupervisorOTsTecnicas = () => {
  const { ots, loading, listarOTs } = useOTsTecnicas();
  const { cuadrillas, listarCuadrillas } = useCuadrillas();
  
  const [filtroEstado, setFiltroEstado] = useState('');
  const [filtroCuadrilla, setFiltroCuadrilla] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('TODOS'); // 'TODOS', 'TECNICO', 'ADMINISTRATIVO'
  const [otsAdministrativas, setOtsAdministrativas] = useState([]);

  useEffect(() => {
    listarCuadrillas();
  }, []);

  useEffect(() => {
    cargarOTs();
  }, [filtroEstado, filtroCuadrilla, filtroTipo]);

  const cargarOTs = async () => {
    console.log('🔄 Cargando OTs con filtros:', { filtroTipo, filtroEstado, filtroCuadrilla });
    
    // Cargar OTs técnicas
    if (filtroTipo === 'TODOS' || filtroTipo === 'TECNICO') {
      const filtros = {};
      if (filtroEstado) filtros.estado = filtroEstado;
      if (filtroCuadrilla) filtros.cuadrilla_id = filtroCuadrilla;
      console.log('🔧 Cargando OTs técnicas con filtros:', filtros);
      await listarOTs(filtros);
    } else {
      // Si solo queremos administrativas, limpiar técnicas
      console.log('⚠️ Solo administrativas, limpiando técnicas');
      await listarOTs({ estado: 'NUNCA_EXISTIRA' }); // Hack para vaciar
    }
    
    // Cargar OTs administrativas
    if (filtroTipo === 'TODOS' || filtroTipo === 'ADMINISTRATIVO') {
      console.log('📄 Cargando OTs administrativas...');
      await cargarOTsAdministrativas();
    } else {
      console.log('⚠️ Solo técnicas, limpiando administrativas');
      setOtsAdministrativas([]);
    }
  };

  const cargarOTsAdministrativas = async () => {
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      if (filtroEstado) params.append('estado', filtroEstado);
      
      console.log('🔍 Cargando OTs administrativas con filtros:', { filtroEstado });
      
      const response = await fetch(
        `http://localhost:3001/api/administradores/ots/administrativas?${params.toString()}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      if (response.ok) {
        const resultado = await response.json();
        console.log('📦 Respuesta OTs administrativas:', resultado);
        
        // El backend devuelve { exito, mensaje, datos: { ots, contadores, paginacion } }
        // Intentar diferentes estructuras de respuesta
        const otsAdmin = resultado.datos?.ots || resultado.data?.ots || resultado.ots || [];
        console.log('📋 OTs administrativas recibidas:', otsAdmin.length, otsAdmin);
        
        // Agregar un flag para identificarlas
        const otsConFlag = otsAdmin.map(ot => ({
          ...ot,
          tipo_reclamo: 'ADMINISTRATIVO',
          ot_id: ot.ot_id,
          estado: ot.estado_ot || ot.estado
        }));
        console.log('✅ OTs administrativas procesadas:', otsConFlag.length);
        setOtsAdministrativas(otsConFlag);
      } else {
        console.error('❌ Error al cargar OTs administrativas:', response.status);
        setOtsAdministrativas([]);
      }
    } catch (error) {
      console.error('❌ Error al cargar OTs administrativas:', error);
      setOtsAdministrativas([]);
    }
  };



  // Combinar ambas listas
  const todasLasOTs = [...ots, ...otsAdministrativas];
  
  console.log('📊 Resumen de OTs:', {
    tecnicas: ots.length,
    administrativas: otsAdministrativas.length,
    total: todasLasOTs.length
  });

  // Estadísticas
  const stats = {
    pendientes: todasLasOTs.filter(ot => ot.estado === 'PENDIENTE').length,
    asignadas: todasLasOTs.filter(ot => ot.estado === 'ASIGNADA').length,
    enProceso: todasLasOTs.filter(ot => ot.estado === 'EN_PROCESO' || ot.estado === 'EN CURSO').length,
    completadas: todasLasOTs.filter(ot => ot.estado === 'COMPLETADA' || ot.estado === 'CERRADO' || ot.estado === 'RESUELTO').length,
    tecnicas: ots.length,
    administrativas: otsAdministrativas.length
  };

  return (
    <CooperativaLayout titulo="Historial de Reclamos">
      <div className="min-h-screen p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Historial de Reclamos</h1>
          <p className="text-gray-600 mt-1">
            Consulta el historial completo de reclamos técnicos y administrativos
          </p>
          <div className="flex gap-4 mt-2 text-sm">
            <span className="text-blue-600 font-medium">
              📋 {stats.tecnicas} Técnicos
            </span>
            <span className="text-purple-600 font-medium">
              📄 {stats.administrativas} Administrativos
            </span>
            <span className="text-gray-600 font-medium">
              📊 {todasLasOTs.length} Total
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={cargarOTs} variant="outline" size="sm">
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
          <Button onClick={() => window.history.back()} variant="outline" size="sm">
            Volver
          </Button>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pendientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.pendientes}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Asignadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.asignadas}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              En Proceso
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.enProceso}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Completadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.completadas}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-3 gap-4">
            {/* Filtro Tipo */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Tipo de Reclamo</label>
              <Select value={filtroTipo} onValueChange={setFiltroTipo}>
                <SelectTrigger>
                  <SelectValue placeholder="Tipo de reclamo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TODOS">Todos</SelectItem>
                  <SelectItem value="TECNICO">Técnicos</SelectItem>
                  <SelectItem value="ADMINISTRATIVO">Administrativos</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Filtro Estado */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Estado</label>
              <Select value={filtroEstado || 'TODOS'} onValueChange={(value) => setFiltroEstado(value === 'TODOS' ? '' : value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos los estados" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TODOS">Todos</SelectItem>
                  <SelectItem value="PENDIENTE">Pendiente</SelectItem>
                  <SelectItem value="ASIGNADA">Asignada</SelectItem>
                  <SelectItem value="EN_PROCESO">En Proceso</SelectItem>
                  <SelectItem value="COMPLETADA">Completada</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Filtro Cuadrilla - solo para técnicos */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Cuadrilla</label>
              <Select 
                value={filtroCuadrilla || 'TODAS'} 
                onValueChange={(value) => setFiltroCuadrilla(value === 'TODAS' ? '' : value)}
                disabled={filtroTipo === 'ADMINISTRATIVO'}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todas las cuadrillas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TODAS">Todas</SelectItem>
                  {cuadrillas.map((cuadrilla) => (
                    <SelectItem key={cuadrilla.cuadrilla_id} value={cuadrilla.cuadrilla_id.toString()}>
                      {cuadrilla.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de OTs */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : todasLasOTs.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <div className="space-y-4">
              <p className="text-lg font-medium">No hay órdenes de trabajo con los filtros seleccionados</p>
              {filtroTipo === 'ADMINISTRATIVO' && (
                <p className="text-sm">
                  💡 Los reclamos administrativos se crean automáticamente cuando un socio hace un reclamo de tipo "ADMINISTRATIVO" (facturación, atención al cliente, etc.)
                </p>
              )}
              {filtroTipo === 'TECNICO' && (
                <p className="text-sm">
                  💡 Los reclamos técnicos se asignan a operarios desde el panel de Itinerario o directamente a un operario
                </p>
              )}
              {filtroTipo === 'TODOS' && (
                <div className="text-sm space-y-2">
                  <p>📋 Técnicos: {stats.tecnicas} | 📄 Administrativos: {stats.administrativas}</p>
                  <p className="text-xs text-gray-500">Prueba cambiando los filtros de estado o tipo</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {todasLasOTs.map((ot) => {
            const estadoConfig = ESTADOS_CONFIG[ot.estado] || {};
            const esAdministrativa = ot.tipo_reclamo === 'ADMINISTRATIVO';

            return (
              <Card key={ot.ot_id} className={`hover:shadow-md transition-shadow ${esAdministrativa ? 'border-l-4 border-l-purple-400' : 'border-l-4 border-l-blue-400'}`}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    {/* Info principal */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-lg">OT #{ot.ot_id}</h3>
                        <Badge variant={estadoConfig.variant}>
                          {estadoConfig.label}
                        </Badge>
                        <Badge 
                          variant="outline" 
                          className={esAdministrativa ? "bg-purple-100 text-purple-800" : "bg-blue-100 text-blue-800"}
                        >
                          {esAdministrativa ? (
                            <><FileText className="h-3 w-3 mr-1 inline" />Administrativo</>
                          ) : (
                            <>🔧 Técnico</>
                          )}
                        </Badge>
                        {ot.prioridad && (
                          <Badge variant="outline" className="text-xs">
                            {ot.prioridad}
                          </Badge>
                        )}
                      </div>

                      <div className="space-y-1 text-sm">
                        {/* Cliente */}
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <span className="font-medium">
                            {ot.socio_nombre} {ot.socio_apellido}
                          </span>
                          <span className="text-muted-foreground">
                            - Cuenta: {ot.numero_cuenta}
                          </span>
                        </div>

                        {/* Dirección */}
                        {(ot.direccion_intervencion || ot.direccion) && (
                          <div className="flex items-start gap-2">
                            <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                            <span className="text-muted-foreground line-clamp-1">
                              {ot.direccion_intervencion || ot.direccion}
                            </span>
                          </div>
                        )}

                        {/* Operario asignado - solo técnicas */}
                        {!esAdministrativa && ot.operario && (
                          <div className="flex items-center gap-2">
                            <UserPlus className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            <span className="text-muted-foreground">
                              {ot.operario}
                              {ot.cuadrilla && ` - ${ot.cuadrilla}`}
                            </span>
                          </div>
                        )}

                        {/* Detalle del reclamo - para administrativas */}
                        {esAdministrativa && ot.detalle_reclamo && (
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            <span className="text-muted-foreground font-medium">
                              {ot.detalle_reclamo}
                            </span>
                          </div>
                        )}

                        {/* Descripción */}
                        <p className="text-muted-foreground line-clamp-2 mt-2">
                          {ot.descripcion}
                        </p>

                        {/* Fecha */}
                        {(ot.fecha_asignacion || ot.fecha_creacion_ot || ot.created_at) && (
                          <p className="text-xs text-muted-foreground mt-2">
                            {esAdministrativa ? 'Creada' : 'Asignada'}: {format(
                              new Date(ot.fecha_asignacion || ot.fecha_creacion_ot || ot.created_at), 
                              "dd/MM/yyyy HH:mm", 
                              { locale: es }
                            )}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
      </div>
    </CooperativaLayout>
  );
};

export default SupervisorOTsTecnicas;
