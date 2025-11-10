/**
 * Componente para gestión completa de cuentas
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, FileText, CreditCard, ChevronUp, ChevronDown, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import administradorService from '../../services/administradorService.js';
import { Button } from '../ui/button';
import { Skeleton } from '../ui/skeleton';
import CooperativaLayout from '../layout/CooperativaLayout';
import { generarPDFCuentas } from '../../utils/generadorPDFCuentas';

export default function GestionCuentas() {
  const navigate = useNavigate();
  const [filtros, setFiltros] = useState({
    busqueda: '',
    estado: 'todos', // todos, activa, inactiva
    pagina: 1,
    limite: 50,
    orden: 'numero_cuenta',
    direccion: 'ASC'
  });

  const [cuentas, setCuentas] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPaginas, setTotalPaginas] = useState(0);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  // Cargar cuentas
  useEffect(() => {
    cargarCuentas();
  }, [filtros.estado, filtros.pagina, filtros.busqueda, filtros.orden, filtros.direccion]);

  const cargarCuentas = async () => {
    try {
      setCargando(true);
      setError(null);
      
      const response = await administradorService.listarCuentas({
        ...filtros,
        activa: filtros.estado === 'todos' ? undefined : filtros.estado === 'activa'
      });
      
      if (response.exito && response.datos) {
        setCuentas(response.datos.cuentas || []);
        setTotal(response.datos.total || 0);
        setTotalPaginas(response.datos.totalPaginas || 0);
      }
    } catch (error) {
      console.error('Error al cargar cuentas:', error);
      setError('Error al cargar las cuentas');
    } finally {
      setCargando(false);
    }
  };

  // Función para manejar el ordenamiento
  const manejarOrdenamiento = (campo) => {
    setFiltros(prev => ({
      ...prev,
      orden: campo,
      direccion: prev.orden === campo && prev.direccion === 'ASC' ? 'DESC' : 'ASC',
      pagina: 1
    }));
  };

  // Función para renderizar el icono de ordenamiento
  const renderizarIconoOrden = (campo) => {
    if (filtros.orden !== campo) {
      return <ChevronUp className="w-4 h-4 text-gray-300" />;
    }
    return filtros.direccion === 'ASC' 
      ? <ChevronUp className="w-4 h-4 text-blue-600" />
      : <ChevronDown className="w-4 h-4 text-blue-600" />;
  };

  // Función para exportar PDF
  const handleExportarPDF = () => {
    try {
      generarPDFCuentas(cuentas);
    } catch (error) {
      console.error('Error al generar PDF:', error);
      alert('Error al generar el PDF. Por favor, intente nuevamente.');
    }
  };

  // Calcular totales
  const totalDeuda = cuentas.reduce((sum, cuenta) => sum + (parseFloat(cuenta.deuda) || 0), 0);
  const cuentasActivas = cuentas.filter(c => c.activa).length;
  const cuentasInactivas = cuentas.filter(c => !c.activa).length;

  return (
    <CooperativaLayout>
      <div className="min-h-screen p-8">
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
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <CreditCard className="h-6 w-6 text-blue-600" />
                  Gestión de Cuentas
                </h1>
                <p className="text-gray-600 mt-1">Listado completo de cuentas del sistema</p>
              </div>
            </div>
            <Button onClick={handleExportarPDF} className="gap-2">
              <FileText className="h-4 w-4" />
              Exportar PDF
            </Button>
          </div>

          {/* Estadísticas */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-lg shadow-sm border">
              <div className="flex items-center gap-2 text-gray-600 text-sm">
                <CreditCard className="h-4 w-4" />
                <span>Total Cuentas</span>
              </div>
              <div className="text-2xl font-bold text-gray-900 mt-2">{total}</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm border">
              <div className="flex items-center gap-2 text-green-600 text-sm">
                <CheckCircle className="h-4 w-4" />
                <span>Activas</span>
              </div>
              <div className="text-2xl font-bold text-green-600 mt-2">{cuentasActivas}</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm border">
              <div className="flex items-center gap-2 text-red-600 text-sm">
                <XCircle className="h-4 w-4" />
                <span>Inactivas</span>
              </div>
              <div className="text-2xl font-bold text-red-600 mt-2">{cuentasInactivas}</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm border">
              <div className="flex items-center gap-2 text-orange-600 text-sm">
                <AlertCircle className="h-4 w-4" />
                <span>Deuda Total</span>
              </div>
              <div className="text-2xl font-bold text-orange-600 mt-2">${totalDeuda.toFixed(2)}</div>
            </div>
          </div>

          {/* Filtros */}
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Búsqueda */}
              <div className="md:col-span-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    type="text"
                    placeholder="Buscar por número de cuenta, dirección, socio, DNI o servicio..."
                    className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={filtros.busqueda}
                    onChange={(e) => setFiltros({ ...filtros, busqueda: e.target.value, pagina: 1 })}
                  />
                </div>
              </div>

              {/* Estado */}
              <div>
                <select
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={filtros.estado}
                  onChange={(e) => setFiltros({ ...filtros, estado: e.target.value, pagina: 1 })}
                >
                  <option value="todos">Todos los estados</option>
                  <option value="activa">Activas</option>
                  <option value="inactiva">Inactivas</option>
                </select>
              </div>
            </div>
          </div>

          {/* Tabla */}
          <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
            {cargando ? (
              <div className="p-8 space-y-4">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
              </div>
            ) : error ? (
              <div className="p-8 text-center text-red-600">
                <AlertCircle className="h-12 w-12 mx-auto mb-4" />
                <p>{error}</p>
                <Button onClick={cargarCuentas} className="mt-4">Reintentar</Button>
              </div>
            ) : cuentas.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <CreditCard className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No se encontraron cuentas</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        <button
                          onClick={() => manejarOrdenamiento('numero_cuenta')}
                          className="flex items-center gap-1 hover:text-blue-600 transition-colors"
                        >
                          Nº Cuenta
                          {renderizarIconoOrden('numero_cuenta')}
                        </button>
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        <button
                          onClick={() => manejarOrdenamiento('socio_apellido')}
                          className="flex items-center gap-1 hover:text-blue-600 transition-colors"
                        >
                          Socio
                          {renderizarIconoOrden('socio_apellido')}
                        </button>
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        <button
                          onClick={() => manejarOrdenamiento('direccion')}
                          className="flex items-center gap-1 hover:text-blue-600 transition-colors"
                        >
                          Dirección
                          {renderizarIconoOrden('direccion')}
                        </button>
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        <button
                          onClick={() => manejarOrdenamiento('servicio_nombre')}
                          className="flex items-center gap-1 hover:text-blue-600 transition-colors"
                        >
                          Servicio
                          {renderizarIconoOrden('servicio_nombre')}
                        </button>
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        <button
                          onClick={() => manejarOrdenamiento('activa')}
                          className="flex items-center gap-1 hover:text-blue-600 transition-colors"
                        >
                          Estado
                          {renderizarIconoOrden('activa')}
                        </button>
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        <button
                          onClick={() => manejarOrdenamiento('deuda')}
                          className="flex items-center gap-1 hover:text-blue-600 transition-colors"
                        >
                          Deuda
                          {renderizarIconoOrden('deuda')}
                        </button>
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Principal
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {cuentas.map((cuenta) => (
                      <tr key={cuenta.cuenta_id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{cuenta.numero_cuenta}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {cuenta.socio_nombre} {cuenta.socio_apellido}
                          </div>
                          <div className="text-xs text-gray-500">DNI: {cuenta.socio_dni}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">{cuenta.direccion}</div>
                          <div className="text-xs text-gray-500">{cuenta.localidad}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{cuenta.servicio_nombre}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {cuenta.activa ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Activa
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              <XCircle className="h-3 w-3 mr-1" />
                              Inactiva
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className={`text-sm font-medium ${parseFloat(cuenta.deuda) > 0 ? 'text-red-600' : 'text-green-600'}`}>
                            ${parseFloat(cuenta.deuda).toFixed(2)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          {cuenta.principal && (
                            <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
                              ★ Principal
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Paginación */}
          {!cargando && totalPaginas > 1 && (
            <div className="flex items-center justify-between bg-white p-4 rounded-lg shadow-sm border">
              <div className="text-sm text-gray-600">
                Mostrando {((filtros.pagina - 1) * filtros.limite) + 1} - {Math.min(filtros.pagina * filtros.limite, total)} de {total} cuentas
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setFiltros({ ...filtros, pagina: filtros.pagina - 1 })}
                  disabled={filtros.pagina === 1}
                >
                  Anterior
                </Button>
                <span className="px-4 py-2 text-sm text-gray-600">
                  Página {filtros.pagina} de {totalPaginas}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setFiltros({ ...filtros, pagina: filtros.pagina + 1 })}
                  disabled={filtros.pagina === totalPaginas}
                >
                  Siguiente
                </Button>
              </div>
            </div>
          )}

        </div>
      </div>
    </CooperativaLayout>
  );
}
