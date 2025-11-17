/**
 * Componente para gestión de empleados y operarios
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, UserCog, Search, Briefcase, Mail, Phone } from 'lucide-react';
import { Button } from '../ui/button';
import CooperativaLayout from '../layout/CooperativaLayout';
import { useEmpleados } from '../../hooks/useAdministrador';

export default function GestionEmpleados() {
  const navigate = useNavigate();
  const [filtroActivo, setFiltroActivo] = useState('todos');
  const [filtroCargo, setFiltroCargo] = useState('todos');
  const [busqueda, setBusqueda] = useState('');
  
  // Usar el hook real para cargar empleados
  const { empleados, total, cargando, error } = useEmpleados({
    activo: filtroActivo === 'todos' ? undefined : filtroActivo === 'activos',
    pagina: 1,
    limite: 50
  });

  // Filtrar empleados por cargo y búsqueda
  const empleadosFiltrados = empleados?.filter(empleado => {
    // Filtro por cargo
    const estaEnCuadrilla = empleado.cuadrilla_asignada !== null && empleado.cuadrilla_asignada !== undefined;
    
    let cumpleFiltroCargoVal = true;
    if (filtroCargo === 'operario') {
      cumpleFiltroCargoVal = estaEnCuadrilla;
    } else if (filtroCargo === 'administrativo') {
      cumpleFiltroCargoVal = !estaEnCuadrilla;
    }
    
    // Filtro por búsqueda
    let cumpleBusqueda = true;
    if (busqueda.trim()) {
      const textoBusqueda = busqueda.toLowerCase();
      const nombreCompleto = `${empleado.nombre} ${empleado.apellido}`.toLowerCase();
      const email = empleado.email?.toLowerCase() || '';
      const legajo = empleado.legajo?.toLowerCase() || '';
      
      cumpleBusqueda = nombreCompleto.includes(textoBusqueda) || 
                       email.includes(textoBusqueda) || 
                       legajo.includes(textoBusqueda);
    }
    
    return cumpleFiltroCargoVal && cumpleBusqueda;
  }) || [];

  return (
    <CooperativaLayout titulo="Gestión de Empleados">
      <div className="min-h-screen">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <UserCog className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Gestión de Empleados</h1>
                <p className="text-gray-600 mt-1">Operarios y personal de la cooperativa</p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/dashboard/administrador')}
            >
              Volver
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filtros */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por nombre, email o legajo..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
            </div>
            <select 
              className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              value={filtroCargo}
              onChange={(e) => setFiltroCargo(e.target.value)}
            >
              <option value="todos">Todos los cargos</option>
              <option value="operario">Operarios</option>
              <option value="administrativo">Administrativos</option>
            </select>
          </div>
        </div>

        {/* Grid de empleados */}
        {cargando ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mb-4"></div>
            <p className="text-gray-600">Cargando empleados...</p>
          </div>
        ) : empleadosFiltrados && empleadosFiltrados.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {empleadosFiltrados.map((empleado) => (
              <div
                key={empleado.empleado_id}
                className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all"
              >
                {/* Header */}
                <div className="p-6 border-b border-gray-100">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="p-3 bg-purple-100 rounded-full">
                      <UserCog className="w-6 h-6 text-purple-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-gray-900 truncate">
                        {empleado.nombre} {empleado.apellido}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Briefcase className="w-3 h-3 text-gray-400" />
                        <p className="text-sm text-gray-600">{empleado.cargo}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <span className="truncate">
                        {empleado.email || `${empleado.nombre?.toLowerCase()}.${empleado.apellido?.toLowerCase()}@cooperativa-ugarte.com.ar`}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <span>{empleado.telefono || '3804-000000'}</span>
                    </div>
                  </div>
                </div>

                {/* Estadísticas */}
                <div className="p-6">
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-blue-600">{empleado.reclamos_asignados || 0}</p>
                      <p className="text-xs text-gray-600 mt-1">Asignados</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-600">{empleado.reclamos_completados || 0}</p>
                      <p className="text-xs text-gray-600 mt-1">Completados</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-center pt-4 border-t border-gray-100">
                    <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                      empleado.activo 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {empleado.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <UserCog className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg mb-2">No se encontraron empleados</p>
          </div>
        )}
      </main>
      </div>
    </CooperativaLayout>
  );
}
