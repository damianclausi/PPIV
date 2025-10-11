import React, { useEffect, useState } from 'react';
import { useCuadrillas } from '../../hooks/useCuadrillas';
import { useOTsTecnicas } from '../../hooks/useOTsTecnicas';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { Alert, AlertDescription } from '../ui/alert';
import { Loader2, Users, User } from 'lucide-react';

const AsignarOperarioModal = ({ open, onClose, ot, onAsignado }) => {
  const { cuadrillas, operarios, loading: loadingCuadrillas, listarCuadrillas, obtenerOperarios } = useCuadrillas();
  const { asignarOperario, loading: loadingAsignar } = useOTsTecnicas();
  
  const [cuadrillaSeleccionada, setCuadrillaSeleccionada] = useState('');
  const [operarioSeleccionado, setOperarioSeleccionado] = useState('');

  useEffect(() => {
    if (open) {
      listarCuadrillas();
      setCuadrillaSeleccionada('');
      setOperarioSeleccionado('');
    }
  }, [open, listarCuadrillas]);

  useEffect(() => {
    if (cuadrillaSeleccionada) {
      obtenerOperarios(cuadrillaSeleccionada);
      setOperarioSeleccionado(''); // Reset operario cuando cambia cuadrilla
    }
  }, [cuadrillaSeleccionada, obtenerOperarios]);

  const handleAsignar = async () => {
    if (!operarioSeleccionado) return;

    const result = await asignarOperario(ot.ot_id, parseInt(operarioSeleccionado));
    if (result.success) {
      onAsignado();
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Asignar Operario</DialogTitle>
          <DialogDescription>
            OT #{ot?.ot_id} - {ot?.tipo_reclamo}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Info del reclamo */}
          <Alert>
            <AlertDescription>
              <p className="font-medium mb-1">
                Cliente: {ot?.socio_nombre} {ot?.socio_apellido}
              </p>
              <p className="text-sm text-muted-foreground line-clamp-2">
                {ot?.descripcion}
              </p>
              {ot?.direccion_intervencion && (
                <p className="text-sm text-muted-foreground mt-1">
                  Dirección: {ot.direccion_intervencion}
                </p>
              )}
            </AlertDescription>
          </Alert>

          {/* Selector de Cuadrilla */}
          <div className="space-y-2">
            <Label htmlFor="cuadrilla">
              <Users className="inline h-4 w-4 mr-1" />
              Seleccionar Cuadrilla
            </Label>
            <Select
              value={cuadrillaSeleccionada}
              onValueChange={setCuadrillaSeleccionada}
              disabled={loadingCuadrillas}
            >
              <SelectTrigger id="cuadrilla">
                <SelectValue placeholder="Seleccione una cuadrilla" />
              </SelectTrigger>
              <SelectContent>
                {cuadrillas.map((cuadrilla) => (
                  <SelectItem key={cuadrilla.cuadrilla_id} value={cuadrilla.cuadrilla_id.toString()}>
                    {cuadrilla.nombre} - {cuadrilla.zona}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Selector de Operario */}
          {cuadrillaSeleccionada && (
            <div className="space-y-2">
              <Label htmlFor="operario">
                <User className="inline h-4 w-4 mr-1" />
                Seleccionar Operario
              </Label>
              {loadingCuadrillas ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : operarios.length === 0 ? (
                <Alert variant="destructive">
                  <AlertDescription>
                    No hay operarios disponibles en esta cuadrilla
                  </AlertDescription>
                </Alert>
              ) : (
                <Select
                  value={operarioSeleccionado}
                  onValueChange={setOperarioSeleccionado}
                >
                  <SelectTrigger id="operario">
                    <SelectValue placeholder="Seleccione un operario" />
                  </SelectTrigger>
                  <SelectContent>
                    {operarios.map((operario) => (
                      <SelectItem key={operario.empleado_id} value={operario.empleado_id.toString()}>
                        <div className="flex flex-col">
                          <span>{operario.nombre_completo}</span>
                          <span className="text-xs text-muted-foreground">
                            {operario.rol_interno}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loadingAsignar}>
            Cancelar
          </Button>
          <Button
            onClick={handleAsignar}
            disabled={!operarioSeleccionado || loadingAsignar}
          >
            {loadingAsignar && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Asignar Operario
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AsignarOperarioModal;
