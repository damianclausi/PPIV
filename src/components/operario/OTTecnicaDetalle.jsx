import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOTsTecnicas } from '../../hooks/useOTsTecnicas';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { Alert, AlertDescription } from '../ui/alert';
import MapaOpenStreet from '../ui/MapaOpenStreet';
import {
  ArrowLeft,
  MapPin,
  User,
  Phone,
  Mail,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Package
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const OTTecnicaDetalle = ({ ot, onVolver }) => {
  const navigate = useNavigate();
  const { iniciarTrabajo, completarTrabajo, loading } = useOTsTecnicas();
  const [observaciones, setObservaciones] = useState('');
  const [showCompletarForm, setShowCompletarForm] = useState(false);

  const handleIniciar = async () => {
    const result = await iniciarTrabajo(ot.ot_id);
    if (result.success) {
      onVolver(); // Volver a la lista para refrescar
    }
  };

  const handleCompletar = async () => {
    if (!observaciones.trim()) {
      return;
    }
    const result = await completarTrabajo(ot.ot_id, observaciones);
    if (result.success) {
      onVolver(); // Volver a la lista para refrescar
    }
  };

  const estadoConfig = {
    ASIGNADA: { label: 'Asignada', variant: 'default', color: 'text-blue-500' },
    EN_PROCESO: { label: 'En Proceso', variant: 'secondary', color: 'text-yellow-500' },
    COMPLETADA: { label: 'Completada', variant: 'outline', color: 'text-green-500' }
  };

  const config = estadoConfig[ot.estado] || {};

  return (
    <div className="container mx-auto p-6 space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">Orden de Trabajo #{ot.ot_id}</h1>
            <Badge variant={config.variant} className="text-sm">
              {config.label}
            </Badge>
          </div>
          <p className="text-gray-600 mt-1">
            {ot.tipo_reclamo} - Reclamo #{ot.reclamo_id}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={onVolver}>
          Volver
        </Button>
      </div>

      {/* Información del Cliente */}
      <Card>
        <CardHeader>
          <CardTitle>Información del Cliente</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">
              {ot.socio_nombre} {ot.socio_apellido}
            </span>
          </div>
          {ot.socio_telefono && (
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <a href={`tel:${ot.socio_telefono}`} className="text-primary hover:underline">
                {ot.socio_telefono}
              </a>
            </div>
          )}
          {ot.socio_email && (
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <a href={`mailto:${ot.socio_email}`} className="text-primary hover:underline">
                {ot.socio_email}
              </a>
            </div>
          )}
          <div className="text-sm text-muted-foreground">
            Cuenta: {ot.numero_cuenta}
          </div>
        </CardContent>
      </Card>

      {/* Información del Trabajo */}
      <Card>
        <CardHeader>
          <CardTitle>Detalles del Trabajo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Dirección con Mapa */}
          <div>
            <div className="flex items-start gap-2 mb-3">
              <MapPin className="h-4 w-4 text-cooperativa-blue mt-0.5" />
              <span className="font-medium text-sm">Dirección de Intervención</span>
            </div>
            <div className="ml-6 space-y-3">
              {(ot.direccion_intervencion || ot.cuenta_direccion || ot.direccion || ot.zona) ? (
                <>
                  <p className="text-sm font-semibold text-cooperativa-dark">
                    {ot.direccion_intervencion || ot.cuenta_direccion || ot.direccion || ot.zona}
                  </p>
                  <MapaOpenStreet 
                    direccion={ot.direccion_intervencion || ot.cuenta_direccion || ot.direccion || ot.zona} 
                    altura="350px"
                  />
                </>
              ) : (
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Dirección no disponible</span>
                    <br />
                    <span className="text-xs">Esta orden de trabajo no tiene una dirección de intervención registrada.</span>
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Descripción del Reclamo */}
          <div>
            <p className="font-medium text-sm mb-1">Descripción del Problema</p>
            <p className="text-sm text-muted-foreground">
              {ot.descripcion || ot.reclamo_descripcion}
            </p>
          </div>

          {/* Prioridad */}
          {ot.prioridad && (
            <div>
              <p className="font-medium text-sm mb-1">Prioridad</p>
              <Badge variant="outline">{ot.prioridad}</Badge>
            </div>
          )}

          {/* Fechas */}
          <div className="grid grid-cols-2 gap-4 pt-2 border-t">
            {ot.fecha_asignacion && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Fecha Asignación</p>
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3 text-muted-foreground" />
                  <p className="text-sm">
                    {format(new Date(ot.fecha_asignacion), "dd/MM/yyyy HH:mm", { locale: es })}
                  </p>
                </div>
              </div>
            )}
            {ot.fecha_cierre && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Fecha Cierre</p>
                <div className="flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3 text-green-500" />
                  <p className="text-sm">
                    {format(new Date(ot.fecha_cierre), "dd/MM/yyyy HH:mm", { locale: es })}
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Observaciones existentes */}
      {ot.observaciones && (
        <Card>
          <CardHeader>
            <CardTitle>Observaciones</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {ot.observaciones}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Acciones según estado */}
      {ot.estado === 'ASIGNADA' && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h3 className="font-medium mb-1">¿Listo para iniciar?</h3>
                <p className="text-sm text-muted-foreground">
                  Presiona el botón para marcar que comenzaste el trabajo
                </p>
              </div>
              <Button
                onClick={handleIniciar}
                disabled={loading}
                size="lg"
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Iniciar Trabajo
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {ot.estado === 'EN_PROCESO' && !showCompletarForm && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h3 className="font-medium mb-1">Trabajo en proceso</h3>
                <p className="text-sm text-muted-foreground">
                  Cuando termines, completa el trabajo y agrega tus observaciones
                </p>
              </div>
              <Button
                onClick={() => setShowCompletarForm(true)}
                size="lg"
                variant="default"
              >
                Completar Trabajo
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {ot.estado === 'EN_PROCESO' && showCompletarForm && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle>Completar Trabajo</CardTitle>
            <CardDescription>
              Agrega las observaciones del trabajo realizado (obligatorio)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder="Describe el trabajo realizado, materiales utilizados, estado final, etc..."
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              rows={5}
              className="resize-none"
            />
            {!observaciones.trim() && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Las observaciones son obligatorias para completar el trabajo
                </AlertDescription>
              </Alert>
            )}
            <div className="flex gap-2">
              <Button
                onClick={handleCompletar}
                disabled={loading || !observaciones.trim()}
                className="flex-1"
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Confirmar y Completar
              </Button>
              <Button
                onClick={() => setShowCompletarForm(false)}
                variant="outline"
                disabled={loading}
              >
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {ot.estado === 'COMPLETADA' && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-6 w-6 text-green-500" />
              <div className="flex-1">
                <h3 className="font-medium">Trabajo Completado</h3>
                <p className="text-sm text-muted-foreground">
                  Este trabajo fue finalizado exitosamente
                  {ot.fecha_cierre && (
                    <span className="ml-1">
                      el {format(new Date(ot.fecha_cierre), "dd/MM/yyyy 'a las' HH:mm", { locale: es })}
                    </span>
                  )}
                </p>
                <p className="text-xs text-gray-600 mt-1">
                  ℹ️ Esta información es de solo lectura
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Card para Gestión de Insumos */}
      {(ot.estado === 'EN_PROCESO' || ot.estado === 'COMPLETADA') && (
        <Card className="border-purple-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Package className="h-5 w-5 text-purple-600" />
              Gestión de Insumos
            </CardTitle>
            <CardDescription>
              {ot.estado === 'EN_PROCESO' 
                ? 'Registra los materiales e insumos utilizados en este trabajo'
                : 'Consulta los insumos registrados para este trabajo'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              variant="outline"
              className="w-full border-purple-300 text-purple-700 hover:bg-purple-50"
              onClick={() => navigate(`/dashboard/operario/reclamos/${ot.reclamo_id}/insumos`, {
                state: { otId: ot.ot_id }
              })}
            >
              <Package className="h-4 w-4 mr-2" />
              {ot.estado === 'EN_PROCESO' ? 'Cargar Materiales' : 'Ver Materiales'}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default OTTecnicaDetalle;
