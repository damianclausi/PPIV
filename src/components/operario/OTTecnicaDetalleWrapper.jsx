/**
 * Wrapper para mostrar el detalle de una OT técnica desde una ruta directa
 */
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useOTsTecnicas } from '../../hooks/useOTsTecnicas';
import OTTecnicaDetalle from './OTTecnicaDetalle';
import { Loader2, ArrowLeft } from 'lucide-react';
import { Button } from '../ui/button';

const OTTecnicaDetalleWrapper = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { obtenerOTPorId, loading } = useOTsTecnicas();
  const [ot, setOt] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    cargarOT();
  }, [id]);

  const cargarOT = async () => {
    try {
      const result = await obtenerOTPorId(parseInt(id));
      if (result.success) {
        setOt(result.data);
        setError(null);
      } else {
        setError('No se pudo cargar la orden de trabajo');
      }
    } catch (err) {
      console.error('Error al cargar OT:', err);
      setError('Error al cargar la orden de trabajo');
    }
  };

  const handleVolver = () => {
    navigate('/dashboard/operario');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto" />
          <p className="mt-4 text-gray-600">Cargando orden de trabajo...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-800 mb-4">{error}</p>
          <Button onClick={handleVolver} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver al Dashboard
          </Button>
        </div>
      </div>
    );
  }

  if (!ot) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <p className="text-yellow-800 mb-4">Orden de trabajo no encontrada</p>
          <Button onClick={handleVolver} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver al Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return <OTTecnicaDetalle ot={ot} onVolver={handleVolver} />;
};

export default OTTecnicaDetalleWrapper;
