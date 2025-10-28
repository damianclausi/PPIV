import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { RatingStars } from './ui/RatingStars';
import { toast } from 'sonner';
import apiClient from '../services/api';

interface ModalValoracionProps {
  /**
   * Controla si el modal está abierto
   */
  open: boolean;
  
  /**
   * Callback para cerrar el modal
   */
  onClose: () => void;
  
  /**
   * ID del reclamo a valorar
   */
  reclamoId: number;
  
  /**
   * Número del reclamo (para mostrar en el título)
   */
  numeroReclamo?: number;
  
  /**
   * Callback después de crear/actualizar valoración exitosa
   */
  onSuccess?: () => void;
  
  /**
   * Datos de valoración existente (para modo edición)
   */
  valoracionExistente?: {
    valoracion_id: number;
    calificacion: number;
    comentario?: string;
  } | null;
}

export const ModalValoracion: React.FC<ModalValoracionProps> = ({
  open,
  onClose,
  reclamoId,
  numeroReclamo,
  onSuccess,
  valoracionExistente
}) => {
  const [calificacion, setCalificacion] = useState<number>(valoracionExistente?.calificacion || 0);
  const [comentario, setComentario] = useState<string>(valoracionExistente?.comentario || '');
  const [loading, setLoading] = useState(false);

  // Actualizar estado cuando cambie valoracionExistente
  React.useEffect(() => {
    if (valoracionExistente) {
      setCalificacion(valoracionExistente.calificacion);
      setComentario(valoracionExistente.comentario || '');
    } else {
      setCalificacion(0);
      setComentario('');
    }
  }, [valoracionExistente, open]);

  const modoEdicion = !!valoracionExistente;

  const handleSubmit = async () => {
    // Validación
    if (calificacion === 0) {
      toast.error('Por favor selecciona una calificación');
      return;
    }

    setLoading(true);

    try {
      if (modoEdicion && valoracionExistente) {
        // Actualizar valoración existente
        await apiClient.put(`/api/valoraciones/${valoracionExistente.valoracion_id}`, {
          calificacion,
          comentario: comentario.trim() || null
        });
        
        toast.success('¡Valoración actualizada exitosamente!');
      } else {
        // Crear nueva valoración
        await apiClient.post('/api/valoraciones', {
          reclamoId,
          calificacion,
          comentario: comentario.trim() || null
        });
        
        toast.success('¡Valoración enviada exitosamente!');
      }
      
      // Resetear formulario
      setCalificacion(0);
      setComentario('');
      
      // Cerrar modal
      onClose();
      
      // Llamar callback de éxito
      if (onSuccess) {
        onSuccess();
      }

    } catch (error: any) {
      console.error('Error al enviar valoración:', error);
      
      const mensaje = error.response?.data?.message || 'Error al enviar valoración';
      toast.error(mensaje);
      
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setCalificacion(0);
      setComentario('');
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {modoEdicion ? 'Editar' : 'Valorar'} Reclamo {numeroReclamo ? `#${numeroReclamo}` : ''}
          </DialogTitle>
          <DialogDescription>
            {modoEdicion 
              ? 'Modifica tu valoración del reclamo'
              : '¿Cómo fue tu experiencia con la resolución de este reclamo?'
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Selector de estrellas */}
          <div className="flex flex-col items-center space-y-3">
            <label className="text-sm font-medium text-gray-700">
              Calificación
            </label>
            
            <RatingStars
              rating={calificacion}
              mode="editable"
              size="lg"
              onChange={setCalificacion}
            />
            
            {calificacion > 0 && (
              <p className="text-sm text-gray-600">
                {calificacion === 5 && '⭐ Excelente'}
                {calificacion === 4 && '👍 Muy bueno'}
                {calificacion === 3 && '😊 Bueno'}
                {calificacion === 2 && '😐 Regular'}
                {calificacion === 1 && '😞 Malo'}
              </p>
            )}
          </div>

          {/* Comentario opcional */}
          <div className="space-y-2">
            <label
              htmlFor="comentario"
              className="text-sm font-medium text-gray-700"
            >
              Comentario (opcional)
            </label>
            <Textarea
              id="comentario"
              placeholder="Cuéntanos más sobre tu experiencia..."
              value={comentario}
              onChange={(e) => setComentario(e.target.value)}
              rows={4}
              maxLength={500}
              className="resize-none"
            />
            <p className="text-xs text-gray-500 text-right">
              {comentario.length}/500 caracteres
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={loading || calificacion === 0}
          >
            {loading ? 'Enviando...' : modoEdicion ? 'Actualizar Valoración' : 'Enviar Valoración'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ModalValoracion;
