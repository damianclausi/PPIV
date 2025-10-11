import React, { useEffect, useState } from 'react';
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
import { Loader2, UserPlus, MapPin, User, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import AsignarOperarioModal from './AsignarOperarioModal';

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
  COMPLETADA: {
    label: 'Completada',
    variant: 'outline',
    color: 'bg-green-100 text-green-800'
  }
};

const SupervisorOTsTecnicas = () => {
  const { ots, loading, listarOTs } = useOTsTecnicas();
  const { cuadrillas, listarCuadrillas } = useCuadrillas();
  
  const [filtroEstado, setFiltroEstado] = useState('');
  const [filtroCuadrilla, setFiltroCuadrilla] = useState('');
  const [otParaAsignar, setOtParaAsignar] = useState(null);

  useEffect(() => {
    listarCuadrillas();
  }, []);

  useEffect(() => {
    cargarOTs();
  }, [filtroEstado, filtroCuadrilla]);

  const cargarOTs = async () => {
    const filtros = {};
    if (filtroEstado) filtros.estado = filtroEstado;
    if (filtroCuadrilla) filtros.cuadrilla_id = filtroCuadrilla;
    await listarOTs(filtros);
  };

  const handleAsignar = (ot) => {
    setOtParaAsignar(ot);
  };

  const handleAsignacionCompleta = () => {
    setOtParaAsignar(null);
    cargarOTs();
  };

  // Estadísticas
  const stats = {
    pendientes: ots.filter(ot => ot.estado === 'PENDIENTE').length,
    asignadas: ots.filter(ot => ot.estado === 'ASIGNADA').length,
    enProceso: ots.filter(ot => ot.estado === 'EN_PROCESO').length,
    completadas: ots.filter(ot => ot.estado === 'COMPLETADA').length
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Gestión de OTs Técnicas</h1>
          <p className="text-muted-foreground mt-1">
            Supervisa y asigna trabajos técnicos
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => window.history.back()} variant="outline" size="sm">
            ← Volver
          </Button>
          <Button onClick={cargarOTs} variant="outline" size="icon">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
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
          <div className="grid md:grid-cols-2 gap-4">
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

            {/* Filtro Cuadrilla */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Cuadrilla</label>
              <Select value={filtroCuadrilla || 'TODAS'} onValueChange={(value) => setFiltroCuadrilla(value === 'TODAS' ? '' : value)}>
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
      ) : ots.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No hay órdenes de trabajo con los filtros seleccionados
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {ots.map((ot) => {
            const estadoConfig = ESTADOS_CONFIG[ot.estado] || {};

            return (
              <Card key={ot.ot_id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    {/* Info principal */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-lg">OT #{ot.ot_id}</h3>
                        <Badge variant={estadoConfig.variant}>
                          {estadoConfig.label}
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
                        {ot.direccion_intervencion && (
                          <div className="flex items-start gap-2">
                            <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                            <span className="text-muted-foreground line-clamp-1">
                              {ot.direccion_intervencion}
                            </span>
                          </div>
                        )}

                        {/* Operario asignado */}
                        {ot.operario && (
                          <div className="flex items-center gap-2">
                            <UserPlus className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            <span className="text-muted-foreground">
                              {ot.operario}
                              {ot.cuadrilla && ` - ${ot.cuadrilla}`}
                            </span>
                          </div>
                        )}

                        {/* Descripción */}
                        <p className="text-muted-foreground line-clamp-2 mt-2">
                          {ot.descripcion}
                        </p>

                        {/* Fecha */}
                        {ot.fecha_asignacion && (
                          <p className="text-xs text-muted-foreground mt-2">
                            Asignada: {format(new Date(ot.fecha_asignacion), "dd/MM/yyyy HH:mm", { locale: es })}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Acciones */}
                    <div className="flex flex-col gap-2">
                      {ot.estado === 'PENDIENTE' && (
                        <Button
                          onClick={() => handleAsignar(ot)}
                          size="sm"
                          className="whitespace-nowrap"
                        >
                          <UserPlus className="h-4 w-4 mr-1" />
                          Asignar Operario
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modal Asignar Operario */}
      {otParaAsignar && (
        <AsignarOperarioModal
          open={!!otParaAsignar}
          onClose={() => setOtParaAsignar(null)}
          ot={otParaAsignar}
          onAsignado={handleAsignacionCompleta}
        />
      )}
    </div>
  );
};

export default SupervisorOTsTecnicas;
