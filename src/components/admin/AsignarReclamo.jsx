/**
 * Componente para asignar un reclamo a un operario
 */

import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, UserCog, AlertCircle, Check, MapPin, Calendar } from 'lucide-react';
import { formatearFecha } from '../../utils/formatters.js';
import { Button } from '../ui/button';
import CooperativaLayout from '../layout/CooperativaLayout';

export default function AsignarReclamo() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [operarioSeleccionado, setOperarioSeleccionado] = useState('');
  const [prioridad, setPrioridad] = useState('MEDIA');
  const [notas, setNotas] = useState('');
  const [enviando, setEnviando] = useState(false);

  // Datos simulados del reclamo (reemplazar con hook)
  const reclamo = {
    reclamo_id: id,
    tipo_reclamo: 'Falta de suministro',
    descripcion: 'No hay agua desde hace 2 días en toda la zona',
    direccion: 'Calle Las Flores 456',
    socio_nombre: 'María',
    socio_apellido: 'González',
    fecha_alta: new Date()
  };

  // Operarios disponibles (reemplazar con hook)
  const operarios = [
    {
      empleado_id: 1,
      nombre: 'Pedro Ramón García',
      cargo: 'Operario Senior',
      reclamos_actuales: 1,
      disponible: true
    },
    {
      empleado_id: 2,
      nombre: 'Ana María Fernández',
      cargo: 'Supervisora',
      reclamos_actuales: 3,
      disponible: true
    },
    {
      empleado_id: 3,
      nombre: 'Luis Alberto Martínez',
      cargo: 'Operario',
      reclamos_actuales: 2,
      disponible: true
    },
    {
      empleado_id: 4,
      nombre: 'Carmen Alicia López',
      cargo: 'Operaria',
      reclamos_actuales: 1,
      disponible: true
    }
  ];

  const handleAsignar = async (e) => {
    e.preventDefault();
    
    if (!operarioSeleccionado) {
      alert('Debe seleccionar un operario');
      return;
    }

    setEnviando(true);
    
    try {
      // TODO: Implementar llamada al backend
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      alert('Reclamo asignado correctamente');
      navigate('/dashboard/admin/reclamos');
    } catch (error) {
      console.error('Error al asignar reclamo:', error);
      alert('Error al asignar el reclamo');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <CooperativaLayout titulo="Asignar Reclamo">
      <div className="min-h-screen">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <UserCog className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Asignar Reclamo</h1>
                <p className="text-gray-600 mt-1">Asignar reclamo #{id} a un operario</p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/dashboard/admin/reclamos')}
            >
              Volver
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Información del Reclamo */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <AlertCircle className="w-5 h-5 text-orange-600" />
              <h2 className="text-lg font-semibold text-gray-900">Información del Reclamo</h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-600">ID</label>
                <p className="text-gray-900 font-semibold">#{reclamo.reclamo_id}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-600">Tipo</label>
                <p className="text-gray-900">{reclamo.tipo_reclamo}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-600">Descripción</label>
                <p className="text-gray-900">{reclamo.descripcion}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-600 flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  Dirección
                </label>
                <p className="text-gray-900">{reclamo.direccion}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-600">Cliente</label>
                <p className="text-gray-900">{reclamo.socio_nombre} {reclamo.socio_apellido}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-600 flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  Fecha de Alta
                </label>
                <p className="text-gray-900">{formatearFecha(reclamo.fecha_alta)}</p>
              </div>
            </div>
          </div>

          {/* Formulario de Asignación */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <UserCog className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-semibold text-gray-900">Asignar a Operario</h2>
            </div>

            <form onSubmit={handleAsignar} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Seleccionar Operario *
                </label>
                <select
                  value={operarioSeleccionado}
                  onChange={(e) => setOperarioSeleccionado(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">-- Seleccione un operario --</option>
                  {operarios
                    .filter(op => op.disponible)
                    .map((operario) => (
                      <option key={operario.empleado_id} value={operario.empleado_id}>
                        {operario.nombre} - {operario.cargo} ({operario.reclamos_actuales} asignados)
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Prioridad *
                </label>
                <select
                  value={prioridad}
                  onChange={(e) => setPrioridad(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="BAJA">Baja</option>
                  <option value="MEDIA">Media</option>
                  <option value="ALTA">Alta</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notas para el operario
                </label>
                <textarea
                  value={notas}
                  onChange={(e) => setNotas(e.target.value)}
                  rows={4}
                  placeholder="Instrucciones especiales, materiales necesarios, etc."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => navigate('/dashboard/admin/reclamos')}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                  disabled={enviando}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={enviando}
                  className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {enviando ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Asignando...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      Asignar Reclamo
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
      </div>
    </CooperativaLayout>
  );
}
