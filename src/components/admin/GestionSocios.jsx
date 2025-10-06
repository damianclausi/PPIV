/**
 * Componente para gestión completa de socios
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocios } from '../../hooks/useAdministrador.js';
import { ArrowLeft, Search, UserPlus, Edit, Eye, Trash2, Users, ChevronUp, ChevronDown, UserX, UserCheck } from 'lucide-react';
import { formatearFecha } from '../../utils/formatters.js';
import administradorService from '../../services/administradorService.js';

export default function GestionSocios() {
  const navigate = useNavigate();
  const [filtros, setFiltros] = useState({
    busqueda: '',
    estado: 'todos', // todos, activo, inactivo
    pagina: 1,
    limite: 20,
    orden: 'socio_id',
    direccion: 'ASC'
  });

  const { socios, total, cargando, recargar } = useSocios({
    ...filtros,
    buscar: filtros.busqueda,
    activo: filtros.estado === 'todos' ? undefined : filtros.estado === 'activo'
  });

  const totalPaginas = Math.ceil(total / filtros.limite);

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

  // Función para desactivar socio (en lugar de eliminar)
  const handleDesactivarSocio = async (socioId, nombreCompleto, activo) => {
    const accion = activo ? 'desactivar' : 'activar';
    const mensaje = activo 
      ? `¿Está seguro de desactivar a ${nombreCompleto}?\n\nEl socio no aparecerá en los listados pero se mantendrá su historial.`
      : `¿Está seguro de activar a ${nombreCompleto}?`;
    
    if (!confirm(mensaje)) {
      return;
    }

    try {
      const response = await administradorService.cambiarEstadoSocio(socioId, !activo);
      
      if (response.exito) {
        alert(`Socio ${activo ? 'desactivado' : 'activado'} correctamente`);
        recargar(); // Recargar la lista
      } else {
        alert(response.mensaje || `Error al ${accion} el socio`);
      }
    } catch (error) {
      console.error(`Error al ${accion} socio:`, error);
      const mensaje = error.response?.data?.mensaje || error.message || `Error al ${accion} el socio`;
      alert(mensaje);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/dashboard/administrador')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Gestión de Socios</h1>
                  <p className="text-sm text-gray-600">Administrar socios del sistema</p>
                </div>
              </div>
            </div>
            <button
              onClick={() => navigate('/dashboard/admin/socios/nuevo')}
              className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm"
            >
              <UserPlus className="w-4 h-4" />
              Nuevo Socio
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filtros */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Buscar socio
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Nombre, apellido, DNI, email..."
                  value={filtros.busqueda}
                  onChange={(e) => setFiltros({ ...filtros, busqueda: e.target.value, pagina: 1 })}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Estado
              </label>
              <select
                value={filtros.estado}
                onChange={(e) => setFiltros({ ...filtros, estado: e.target.value, pagina: 1 })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="todos">Todos los estados</option>
                <option value="activo">Activos</option>
                <option value="inactivo">Inactivos</option>
              </select>
            </div>
          </div>
        </div>

        {/* Tabla de socios */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {cargando ? (
            <div className="p-12 text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
              <p className="text-gray-600">Cargando socios...</p>
            </div>
          ) : socios && socios.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        <button
                          onClick={() => manejarOrdenamiento('socio_id')}
                          className="flex items-center gap-1 hover:text-blue-600 transition-colors"
                        >
                          Nº Socio
                          {renderizarIconoOrden('socio_id')}
                        </button>
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        <button
                          onClick={() => manejarOrdenamiento('nombre')}
                          className="flex items-center gap-1 hover:text-blue-600 transition-colors"
                        >
                          Socio
                          {renderizarIconoOrden('nombre')}
                        </button>
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        <button
                          onClick={() => manejarOrdenamiento('dni')}
                          className="flex items-center gap-1 hover:text-blue-600 transition-colors"
                        >
                          DNI
                          {renderizarIconoOrden('dni')}
                        </button>
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Contacto
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        <button
                          onClick={() => manejarOrdenamiento('activo')}
                          className="flex items-center gap-1 hover:text-blue-600 transition-colors"
                        >
                          Estado
                          {renderizarIconoOrden('activo')}
                        </button>
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        <button
                          onClick={() => manejarOrdenamiento('fecha_alta')}
                          className="flex items-center gap-1 hover:text-blue-600 transition-colors"
                        >
                          Fecha Alta
                          {renderizarIconoOrden('fecha_alta')}
                        </button>
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {socios.map((socio) => (
                      <tr key={socio.socio_id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm font-medium text-gray-900">#{socio.socio_id}</span>
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {socio.nombre} {socio.apellido}
                            </p>
                            <p className="text-sm text-gray-500">{socio.email}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-900">{socio.dni}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-900">{socio.telefono}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            socio.activo 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {socio.activo ? 'Activo' : 'Inactivo'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatearFecha(socio.fecha_alta)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => navigate(`/dashboard/admin/socios/${socio.socio_id}`)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Ver detalle"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                console.log('Navegando a editar socio:', socio.socio_id);
                                navigate(`/dashboard/admin/socios/${socio.socio_id}/editar`);
                              }}
                              className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                              title="Editar"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDesactivarSocio(socio.socio_id, `${socio.nombre} ${socio.apellido}`, socio.activo);
                              }}
                              className={`p-2 rounded-lg transition-colors ${
                                socio.activo 
                                  ? 'text-orange-600 hover:bg-orange-50' 
                                  : 'text-green-600 hover:bg-green-50'
                              }`}
                              title={socio.activo ? 'Desactivar' : 'Activar'}
                            >
                              {socio.activo ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Paginación */}
              {totalPaginas > 1 && (
                <div className="bg-gray-50 px-6 py-4 flex items-center justify-between border-t border-gray-200">
                  <div className="text-sm text-gray-700">
                    Mostrando <span className="font-medium">{(filtros.pagina - 1) * filtros.limite + 1}</span> a{' '}
                    <span className="font-medium">{Math.min(filtros.pagina * filtros.limite, total)}</span> de{' '}
                    <span className="font-medium">{total}</span> socios
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setFiltros({ ...filtros, pagina: filtros.pagina - 1 })}
                      disabled={filtros.pagina === 1}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Anterior
                    </button>
                    <span className="px-4 py-2 text-sm text-gray-700">
                      Página {filtros.pagina} de {totalPaginas}
                    </span>
                    <button
                      onClick={() => setFiltros({ ...filtros, pagina: filtros.pagina + 1 })}
                      disabled={filtros.pagina === totalPaginas}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Siguiente
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="p-12 text-center">
              <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg mb-2">No se encontraron socios</p>
              <p className="text-gray-400 text-sm">Intenta ajustar los filtros de búsqueda</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
