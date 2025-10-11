import React, { useEffect, useState } from 'react';
import { useOTsTecnicas } from '../../hooks/useOTsTecnicas';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Loader2, MapPin, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import OTTecnicaDetalle from './OTTecnicaDetalle';

const ESTADOS_CONFIG = {
  ASIGNADA: {
    label: 'Asignada',
    variant: 'default',
    icon: Clock,
    color: 'text-blue-500'
  },
  EN_PROCESO: {
    label: 'En Proceso',
    variant: 'secondary',
    icon: Clock,
    color: 'text-yellow-500'
  },
  COMPLETADA: {
    label: 'Completada',
    variant: 'outline',
    icon: CheckCircle2,
    color: 'text-green-500'
  }
};

const MisOTsOperario = () => {
  const { ots, loading, obtenerMisOTs } = useOTsTecnicas();
  const [filtroEstado, setFiltroEstado] = useState(''); // '' = todas
  const [otSeleccionada, setOtSeleccionada] = useState(null);

  useEffect(() => {
    cargarOTs();
  }, [filtroEstado]);

  const cargarOTs = async () => {
    await obtenerMisOTs(filtroEstado || null);
  };

  const handleVerDetalle = (ot) => {
    setOtSeleccionada(ot);
  };

  const handleCerrarDetalle = () => {
    setOtSeleccionada(null);
    cargarOTs(); // Recargar por si hubo cambios
  };

  if (otSeleccionada) {
    return (
      <OTTecnicaDetalle
        ot={otSeleccionada}
        onVolver={handleCerrarDetalle}
      />
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Mis Órdenes de Trabajo</h1>
          <p className="text-muted-foreground mt-1">
            Gestiona tus trabajos asignados
          </p>
        </div>
        <Button onClick={() => window.history.back()} variant="outline" size="sm">
          ← Volver
        </Button>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Button
              variant={filtroEstado === '' ? 'default' : 'outline'}
              onClick={() => setFiltroEstado('')}
              size="sm"
            >
              Todas
            </Button>
            <Button
              variant={filtroEstado === 'ASIGNADA' ? 'default' : 'outline'}
              onClick={() => setFiltroEstado('ASIGNADA')}
              size="sm"
            >
              Asignadas
            </Button>
            <Button
              variant={filtroEstado === 'EN_PROCESO' ? 'default' : 'outline'}
              onClick={() => setFiltroEstado('EN_PROCESO')}
              size="sm"
            >
              En Proceso
            </Button>
            <Button
              variant={filtroEstado === 'COMPLETADA' ? 'default' : 'outline'}
              onClick={() => setFiltroEstado('COMPLETADA')}
              size="sm"
            >
              Completadas
            </Button>
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
          <CardContent className="py-12">
            <div className="text-center text-muted-foreground">
              <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No tienes órdenes de trabajo {filtroEstado ? `en estado ${ESTADOS_CONFIG[filtroEstado]?.label}` : ''}</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {ots.map((ot) => {
            const estadoConfig = ESTADOS_CONFIG[ot.estado] || {};
            const IconoEstado = estadoConfig.icon || Clock;

            return (
              <Card key={ot.ot_id} className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <div className="flex justify-between items-start mb-2">
                    <CardTitle className="text-lg">OT #{ot.ot_id}</CardTitle>
                    <Badge variant={estadoConfig.variant}>
                      {estadoConfig.label}
                    </Badge>
                  </div>
                  <CardDescription>
                    {ot.tipo_reclamo} - Prioridad: {ot.prioridad || 'Normal'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Cliente */}
                  <div>
                    <p className="text-sm font-medium">Cliente</p>
                    <p className="text-sm text-muted-foreground">
                      {ot.socio_nombre} {ot.socio_apellido}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Cuenta: {ot.numero_cuenta}
                    </p>
                  </div>

                  {/* Dirección */}
                  {ot.direccion_intervencion && (
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-muted-foreground">
                        {ot.direccion_intervencion}
                      </p>
                    </div>
                  )}

                  {/* Fecha */}
                  <div className="flex items-center gap-2">
                    <IconoEstado className={`h-4 w-4 ${estadoConfig.color}`} />
                    <p className="text-xs text-muted-foreground">
                      {ot.fecha_asignacion && format(new Date(ot.fecha_asignacion), "dd 'de' MMMM, HH:mm", { locale: es })}
                    </p>
                  </div>

                  {/* Descripción */}
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {ot.descripcion}
                  </p>

                  {/* Botón */}
                  <Button
                    onClick={() => handleVerDetalle(ot)}
                    className="w-full mt-4"
                    variant={ot.estado === 'ASIGNADA' ? 'default' : 'outline'}
                  >
                    {ot.estado === 'ASIGNADA' && 'Iniciar Trabajo'}
                    {ot.estado === 'EN_PROCESO' && 'Completar Trabajo'}
                    {ot.estado === 'COMPLETADA' && 'Ver Detalle'}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MisOTsOperario;
