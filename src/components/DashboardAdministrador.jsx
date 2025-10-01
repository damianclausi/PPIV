/**
 * Dashboard para Administradores
 * Muestra estadísticas generales del sistema
 */

import React, { useState } from 'react';
import { usePerfil, useDashboard, useReclamos, useSocios } from '../hooks/useAdministrador.js';
import { useAuth } from '../contexts/AuthContext.jsx';

export default function DashboardAdministrador() {
  const { logout } = useAuth();
  const { perfil } = usePerfil();
  const { dashboard } = useDashboard();
  const [vistaActual, setVistaActual] = useState('dashboard'); // dashboard, socios, reclamos
  const { socios, cargando: cargandoSocios } = useSocios({ limite: 10 });
  const { reclamos, cargando: cargandoReclamos } = useReclamos({ limite: 10 });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header - Siempre visible con botón de logout */}
      <header className="bg-white shadow sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Dashboard Administrador</h1>
              {perfil && (
                <p className="text-sm text-gray-600">
                  {perfil.nombre} {perfil.apellido} - {perfil.rol_interno || perfil.cargo || 'Administrador'}
                </p>
              )}
            </div>
            <button
              onClick={logout}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium shadow-sm min-w-[120px]"
            >
              Cerrar Sesión
            </button>
          </div>
        </div>
      </header>

      {/* Navegación */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            <button
              onClick={() => setVistaActual('dashboard')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                vistaActual === 'dashboard'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setVistaActual('socios')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                vistaActual === 'socios'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Socios
            </button>
            <button
              onClick={() => setVistaActual('reclamos')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                vistaActual === 'reclamos'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Reclamos
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Vista Dashboard */}
        {vistaActual === 'dashboard' && dashboard && (
          <div>
            {/* Estadísticas de Socios */}
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Socios</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow p-6">
                <p className="text-sm text-gray-600">Total Socios</p>
                <p className="text-3xl font-bold text-gray-900">{dashboard.socios.total}</p>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <p className="text-sm text-gray-600">Activos</p>
                <p className="text-3xl font-bold text-green-600">{dashboard.socios.activos}</p>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <p className="text-sm text-gray-600">Inactivos</p>
                <p className="text-3xl font-bold text-gray-600">{dashboard.socios.inactivos}</p>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <p className="text-sm text-gray-600">Nuevos (30 días)</p>
                <p className="text-3xl font-bold text-blue-600">{dashboard.socios.nuevos_ultimo_mes}</p>
              </div>
            </div>

            {/* Estadísticas de Reclamos */}
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Reclamos</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow p-6">
                <p className="text-sm text-gray-600">Total Reclamos</p>
                <p className="text-3xl font-bold text-gray-900">{dashboard.reclamos.total}</p>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <p className="text-sm text-gray-600">Pendientes</p>
                <p className="text-3xl font-bold text-yellow-600">{dashboard.reclamos.pendientes}</p>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <p className="text-sm text-gray-600">En Proceso</p>
                <p className="text-3xl font-bold text-blue-600">{dashboard.reclamos.en_proceso}</p>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <p className="text-sm text-gray-600">Resueltos</p>
                <p className="text-3xl font-bold text-green-600">{dashboard.reclamos.resueltos}</p>
              </div>
            </div>

            {/* Estadísticas de Facturación */}
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Facturación</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <p className="text-sm text-gray-600">Total Facturas</p>
                <p className="text-3xl font-bold text-gray-900">{dashboard.facturacion.total}</p>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <p className="text-sm text-gray-600">Pendientes</p>
                <p className="text-2xl font-bold text-yellow-600">
                  ${parseFloat(dashboard.facturacion.monto_pendiente || 0).toLocaleString('es-AR')}
                </p>
                <p className="text-xs text-gray-500">{dashboard.facturacion.pendientes} facturas</p>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <p className="text-sm text-gray-600">Pagadas</p>
                <p className="text-2xl font-bold text-green-600">
                  ${parseFloat(dashboard.facturacion.monto_pagado || 0).toLocaleString('es-AR')}
                </p>
                <p className="text-xs text-gray-500">{dashboard.facturacion.pagadas} facturas</p>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <p className="text-sm text-gray-600">Recaudado (30 días)</p>
                <p className="text-2xl font-bold text-blue-600">
                  ${parseFloat(dashboard.facturacion.recaudado_ultimo_mes || 0).toLocaleString('es-AR')}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Vista Socios */}
        {vistaActual === 'socios' && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Lista de Socios</h2>
            </div>
            
            {cargandoSocios ? (
              <div className="p-8 text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="mt-2 text-gray-600">Cargando socios...</p>
              </div>
            ) : socios && socios.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nombre</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">DNI</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Teléfono</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {socios.map((socio) => (
                      <tr key={socio.socio_id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          #{socio.socio_id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {socio.nombre} {socio.apellido}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {socio.email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {socio.dni}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {socio.telefono}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            socio.activo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {socio.activo ? 'Activo' : 'Inactivo'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-8 text-center text-gray-500">
                No hay socios registrados
              </div>
            )}
          </div>
        )}

        {/* Vista Reclamos */}
        {vistaActual === 'reclamos' && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Lista de Reclamos</h2>
            </div>
            
            {cargandoReclamos ? (
              <div className="p-8 text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="mt-2 text-gray-600">Cargando reclamos...</p>
              </div>
            ) : reclamos && reclamos.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cliente</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dirección</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Prioridad</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {reclamos.map((reclamo) => (
                      <tr key={reclamo.reclamo_id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          #{reclamo.reclamo_id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {reclamo.tipo_reclamo}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {reclamo.socio_nombre} {reclamo.socio_apellido}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {reclamo.direccion}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            reclamo.estado === 'PENDIENTE' ? 'bg-yellow-100 text-yellow-800' :
                            reclamo.estado === 'EN_PROCESO' ? 'bg-blue-100 text-blue-800' :
                            reclamo.estado === 'RESUELTO' ? 'bg-green-100 text-green-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {reclamo.estado}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span className={`font-semibold ${
                            reclamo.prioridad === 'ALTA' ? 'text-red-600' :
                            reclamo.prioridad === 'MEDIA' ? 'text-yellow-600' :
                            'text-gray-600'
                          }`}>
                            {reclamo.prioridad}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(reclamo.fecha_alta).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-8 text-center text-gray-500">
                No hay reclamos registrados
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
