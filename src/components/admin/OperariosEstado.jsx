/**
 * Estado de Operarios - Vista detallada
 * Muestra listado de operarios con su estado (libre/ocupado) y OTs asignadas
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { 
  ArrowLeft, 
  Users, 
  CheckCircle, 
  Clock,
  Activity,
  Mail,
  Hash,
  Briefcase
} from 'lucide-react';
import { obtenerEstadoOperarios } from '../../services/administradorService';

export default function OperariosEstado() {
  const navigate = useNavigate();
  const [operarios, setOperarios] = useState([]);
  const [resumen, setResumen] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [filtro, setFiltro] = useState('TODOS'); // TODOS, LIBRE, OCUPADO

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setCargando(true);
      const response = await obtenerEstadoOperarios();
      console.log('📦 Respuesta completa:', response);
      
      // Manejar diferentes estructuras de respuesta
      let datos = null;
      if (response?.data) {
        datos = response.data.datos || response.data;
      } else if (response?.datos) {
        datos = response.datos;
      } else {
        datos = response;
      }
      
      console.log('📊 Datos extraídos:', datos);
      setOperarios(datos?.operarios || []);
      setResumen(datos?.resumen || {});
    } catch (error) {
      console.error('Error al cargar operarios:', error);
      setOperarios([]);
      setResumen({});
    } finally {
      setCargando(false);
    }
  };

  const operariosFiltrados = operarios.filter(op => {
    if (filtro === 'TODOS') return true;
    return op.estado === filtro;
  });

  if (cargando) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/dashboard/admin/reportes')}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Volver
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Estado de Operarios</h1>
              <p className="text-gray-600 mt-1">Visualiza qué operarios están libres u ocupados</p>
            </div>
          </div>
        </div>

        {/* Resumen en Cards */}
        {resumen && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="border-l-4 border-l-blue-500">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-500">Total Operarios</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <Users className="h-8 w-8 text-blue-600" />
                  <span className="text-3xl font-bold text-gray-900">{resumen.total_operarios}</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-green-500">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-500">Operarios Libres</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                  <span className="text-3xl font-bold text-gray-900">{resumen.operarios_libres}</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-orange-500">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-500">Operarios Ocupados</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <Activity className="h-8 w-8 text-orange-600" />
                  <span className="text-3xl font-bold text-gray-900">{resumen.operarios_ocupados}</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-purple-500">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-500">OTs Activas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <Clock className="h-8 w-8 text-purple-600" />
                  <span className="text-3xl font-bold text-gray-900">{resumen.total_ots_activas}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filtros */}
        <div className="flex gap-2">
          <Button
            variant={filtro === 'TODOS' ? 'default' : 'outline'}
            onClick={() => setFiltro('TODOS')}
            size="sm"
          >
            Todos ({operarios.length})
          </Button>
          <Button
            variant={filtro === 'LIBRE' ? 'default' : 'outline'}
            onClick={() => setFiltro('LIBRE')}
            size="sm"
            className={filtro === 'LIBRE' ? 'bg-green-600 hover:bg-green-700' : ''}
          >
            Libres ({operarios.filter(op => op.estado === 'LIBRE').length})
          </Button>
          <Button
            variant={filtro === 'OCUPADO' ? 'default' : 'outline'}
            onClick={() => setFiltro('OCUPADO')}
            size="sm"
            className={filtro === 'OCUPADO' ? 'bg-orange-600 hover:bg-orange-700' : ''}
          >
            Ocupados ({operarios.filter(op => op.estado === 'OCUPADO').length})
          </Button>
        </div>

        {/* Tabla de Operarios */}
        <Card>
          <CardHeader>
            <CardTitle>Listado de Operarios</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Estado</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Operario</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Legajo</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">E-mail</th>
                    <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">OTs Activas</th>
                    <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">Pendientes</th>
                    <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">En Proceso</th>
                    <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">Completadas (mes)</th>
                  </tr>
                </thead>
                <tbody>
                  {operariosFiltrados.map((operario) => (
                    <tr key={operario.empleado_id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        {operario.estado === 'LIBRE' ? (
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Libre
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                            <Activity className="h-3 w-3 mr-1" />
                            Ocupado
                          </Badge>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center">
                            <span className="text-purple-700 font-semibold text-sm">
                              {operario.nombre[0]}{operario.apellido[0]}
                            </span>
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{operario.nombre_completo}</div>
                            <div className="text-xs text-gray-500">{operario.cargo}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <Hash className="h-4 w-4" />
                          {operario.legajo}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <Mail className="h-4 w-4" />
                          {operario.email || 'No asignado'}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-purple-100 text-purple-700 font-semibold">
                          {operario.ots_activas}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center text-gray-600">
                        {operario.ots_pendientes}
                      </td>
                      <td className="py-3 px-4 text-center text-gray-600">
                        {operario.ots_en_proceso}
                      </td>
                      <td className="py-3 px-4 text-center text-gray-600">
                        {operario.ots_completadas_mes}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {operariosFiltrados.length === 0 && (
                <div className="text-center py-12">
                  <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No hay operarios con este filtro</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
