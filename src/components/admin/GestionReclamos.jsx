/**
 * Componente para gestión completa de reclamos (Admin)
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useReclamos } from '../../hooks/useAdministrador.js';
import { ArrowLeft, Search, AlertCircle, MapPin, Clock, User, UserCog, MoreVertical, Eye, Edit, Trash2, Flag, CheckCircle } from 'lucide-react';

export default function GestionReclamos() {
  const navigate = useNavigate();
  const [filtros, setFiltros] = useState({
    busqueda: '',
    estado: 'todos',
    prioridad: 'todas',
    pagina: 1,
    limite: 20
  });
  const [menuAbierto, setMenuAbierto] = useState(null);

  const { reclamos, total, cargando } = useReclamos(filtros);
  const totalPaginas = Math.ceil(total / filtros.limite);

  // Handlers para acciones del menú
  const handleCambiarPrioridad = async (reclamoId) => {
    const nuevaPrioridad = prompt('Ingrese la nueva prioridad (ALTA, MEDIA, BAJA):');
    if (!nuevaPrioridad) return;
    
    const prioridadUpper = nuevaPrioridad.toUpperCase();
    if (!['ALTA', 'MEDIA', 'BAJA'].includes(prioridadUpper)) {
      alert('Prioridad inválida. Use: ALTA, MEDIA o BAJA');
      return;
    }
    
    try {
      // TODO: Implementar llamada al backend
      // await administradorService.cambiarPrioridad(reclamoId, prioridadUpper);
      alert(`Prioridad del reclamo #${reclamoId} actualizada a ${prioridadUpper}`);
      // Recargar reclamos
      window.location.reload();
    } catch (error) {
      console.error('Error al cambiar prioridad:', error);
      alert('Error al cambiar la prioridad');
    }
  };

  const handleCerrarReclamo = async (reclamoId) => {
    if (!confirm('¿Está seguro de cerrar este reclamo?')) return;
    
    try {
      // TODO: Implementar llamada al backend
      // await administradorService.cerrarReclamo(reclamoId);
      alert(`Reclamo #${reclamoId} cerrado correctamente`);
      // Recargar reclamos
      window.location.reload();
    } catch (error) {
      console.error('Error al cerrar reclamo:', error);
      alert('Error al cerrar el reclamo');
    }
  };

  const handleEliminarReclamo = async (reclamoId) => {
    if (!confirm('¿Está seguro de eliminar este reclamo? Esta acción no se puede deshacer.')) return;
    
    try {
      // TODO: Implementar llamada al backend
      // await administradorService.eliminarReclamo(reclamoId);
      alert(`Reclamo #${reclamoId} eliminado correctamente`);
      // Recargar reclamos
      window.location.reload();
    } catch (error) {
      console.error('Error al eliminar reclamo:', error);
      alert('Error al eliminar el reclamo');
    }
  };

  // Cerrar menú al hacer click fuera
  React.useEffect(() => {
    const handleClickOutside = () => {
      if (menuAbierto) setMenuAbierto(null);
    };
    
    if (menuAbierto) {
      document.addEventListener('click', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [menuAbierto]);

  const getBadgeColor = (estado) => {
    switch (estado) {
      case 'PENDIENTE':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'EN_PROCESO':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'RESUELTO':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'CERRADO':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPrioridadColor = (prioridad) => {
    switch (prioridad) {
      case 'ALTA':
        return 'text-red-600 font-bold';
      case 'MEDIA':
        return 'text-yellow-600 font-semibold';
      case 'BAJA':
        return 'text-gray-600';
      default:
        return 'text-gray-600';
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
                <div className="p-2 bg-orange-100 rounded-lg">
                  <AlertCircle className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Gestión de Reclamos</h1>
                  <p className="text-sm text-gray-600">Administrar y asignar reclamos</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filtros */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Buscar reclamo
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="ID, cliente, dirección..."
                  value={filtros.busqueda}
                  onChange={(e) => setFiltros({ ...filtros, busqueda: e.target.value, pagina: 1 })}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
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
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              >
                <option value="todos">Todos</option>
                <option value="PENDIENTE">Pendientes</option>
                <option value="EN_PROCESO">En Proceso</option>
                <option value="RESUELTO">Resueltos</option>
                <option value="CERRADO">Cerrados</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Prioridad
              </label>
              <select
                value={filtros.prioridad}
                onChange={(e) => setFiltros({ ...filtros, prioridad: e.target.value, pagina: 1 })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              >
                <option value="todas">Todas</option>
                <option value="ALTA">Alta</option>
                <option value="MEDIA">Media</option>
                <option value="BAJA">Baja</option>
              </select>
            </div>
          </div>
        </div>

        {/* Grid de reclamos */}
        {cargando ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mb-4"></div>
            <p className="text-gray-600">Cargando reclamos...</p>
          </div>
        ) : reclamos && reclamos.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
              {reclamos.map((reclamo) => (
                <div
                  key={reclamo.reclamo_id}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all group"
                >
                  {/* Header del card */}
                  <div className="p-6 border-b border-gray-100">
                    <div className="flex items-start justify-between mb-3">
                      <div 
                        className="flex items-center gap-2 flex-1 cursor-pointer"
                        onClick={() => navigate(`/dashboard/admin/reclamos/${reclamo.reclamo_id}`)}
                      >
                        <div className="p-2 bg-orange-100 rounded-lg group-hover:bg-orange-200 transition-colors">
                          <AlertCircle className="w-5 h-5 text-orange-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-600">Reclamo #{reclamo.reclamo_id}</p>
                          <p className="text-xs text-gray-500">{reclamo.tipo_reclamo}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${getBadgeColor(reclamo.estado)}`}>
                          {reclamo.estado}
                        </span>
                        {/* Menú de acciones */}
                        <div className="relative">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setMenuAbierto(menuAbierto === reclamo.reclamo_id ? null : reclamo.reclamo_id);
                            }}
                            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                          >
                            <MoreVertical className="w-4 h-4 text-gray-600" />
                          </button>
                          
                          {/* Dropdown de acciones */}
                          {menuAbierto === reclamo.reclamo_id && (
                            <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                              <div className="py-1">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigate(`/dashboard/admin/reclamos/${reclamo.reclamo_id}`);
                                    setMenuAbierto(null);
                                  }}
                                  className="w-full px-4 py-2 text-sm text-left text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                >
                                  <Eye className="w-4 h-4" />
                                  Ver detalle
                                </button>
                                
                                {reclamo.estado === 'PENDIENTE' && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      navigate(`/dashboard/admin/reclamos/${reclamo.reclamo_id}/asignar`);
                                      setMenuAbierto(null);
                                    }}
                                    className="w-full px-4 py-2 text-sm text-left text-blue-700 hover:bg-blue-50 flex items-center gap-2"
                                  >
                                    <UserCog className="w-4 h-4" />
                                    Asignar operario
                                  </button>
                                )}
                                
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleCambiarPrioridad(reclamo.reclamo_id);
                                    setMenuAbierto(null);
                                  }}
                                  className="w-full px-4 py-2 text-sm text-left text-orange-700 hover:bg-orange-50 flex items-center gap-2"
                                >
                                  <Flag className="w-4 h-4" />
                                  Cambiar prioridad
                                </button>
                                
                                {reclamo.estado !== 'CERRADO' && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleCerrarReclamo(reclamo.reclamo_id);
                                      setMenuAbierto(null);
                                    }}
                                    className="w-full px-4 py-2 text-sm text-left text-green-700 hover:bg-green-50 flex items-center gap-2"
                                  >
                                    <CheckCircle className="w-4 h-4" />
                                    Marcar como cerrado
                                  </button>
                                )}
                                
                                <div className="border-t border-gray-100 my-1"></div>
                                
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEliminarReclamo(reclamo.reclamo_id);
                                    setMenuAbierto(null);
                                  }}
                                  className="w-full px-4 py-2 text-sm text-left text-red-700 hover:bg-red-50 flex items-center gap-2"
                                >
                                  <Trash2 className="w-4 h-4" />
                                  Eliminar
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <p 
                      className="text-sm text-gray-700 line-clamp-2 cursor-pointer"
                      onClick={() => navigate(`/dashboard/admin/reclamos/${reclamo.reclamo_id}`)}
                    >
                      {reclamo.descripcion}
                    </p>
                  </div>

                  {/* Información */}
                  <div className="p-6 space-y-3">
                    <div className="flex items-start gap-2 text-sm">
                      <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-gray-600 truncate">{reclamo.direccion}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-sm">
                      <User className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <span className="text-gray-600 truncate">
                        {reclamo.socio_nombre} {reclamo.socio_apellido}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <span className="text-gray-600">
                        {new Date(reclamo.fecha_alta).toLocaleDateString('es-AR')}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                      <span className={`text-sm ${getPrioridadColor(reclamo.prioridad)}`}>
                        {reclamo.prioridad}
                      </span>
                      {reclamo.estado === 'PENDIENTE' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/dashboard/admin/reclamos/${reclamo.reclamo_id}/asignar`);
                          }}
                          className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                        >
                          <UserCog className="w-3 h-3" />
                          Asignar
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Paginación */}
            {totalPaginas > 1 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 px-6 py-4 flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Mostrando <span className="font-medium">{(filtros.pagina - 1) * filtros.limite + 1}</span> a{' '}
                  <span className="font-medium">{Math.min(filtros.pagina * filtros.limite, total)}</span> de{' '}
                  <span className="font-medium">{total}</span> reclamos
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
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <AlertCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg mb-2">No se encontraron reclamos</p>
            <p className="text-gray-400 text-sm">Intenta ajustar los filtros de búsqueda</p>
          </div>
        )}
      </main>
    </div>
  );
}
