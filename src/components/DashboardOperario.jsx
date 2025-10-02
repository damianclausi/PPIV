/**
 * Dashboard para Operarios
 * Muestra estadísticas y reclamos asignados
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePerfil, useDashboard, useReclamos } from '../hooks/useOperario.js';
import { useAuth } from '../contexts/AuthContext.jsx';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Clock, Zap, CheckCircle, Wrench, MapPin, AlertTriangle } from 'lucide-react';

export default function DashboardOperario() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { perfil } = usePerfil();
  const { dashboard } = useDashboard();
  const [filtroEstado, setFiltroEstado] = useState('');
  const { reclamos, cargando: cargandoReclamos, recargar: recargarReclamos } = useReclamos({ estado: filtroEstado, limite: 10 });

  const getPriorityBadge = (prioridad) => {
    const badges = {
      alta: <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Alta</Badge>,
      media: <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Media</Badge>,
      baja: <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Baja</Badge>
    };
    return badges[prioridad?.toLowerCase()] || badges.media;
  };

  const getStatusBadge = (estado) => {
    const badges = {
      pendiente: <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Pendiente</Badge>,
      en_proceso: <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">En Proceso</Badge>,
      resuelto: <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Resuelto</Badge>
    };
    return badges[estado] || badges.pendiente;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Reclamos Asignados - Operario</h1>
            {perfil && (
              <p className="text-sm text-gray-600 mt-1">
                {perfil.nombre} {perfil.apellido} - {perfil.rol_interno || perfil.cargo || 'Operario'}
              </p>
            )}
          </div>
          <Button variant="outline" onClick={logout}>
            Cerrar Sesión
          </Button>
        </div>

        {/* Grid de Reclamos en Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pendientes</p>
                <p className="text-3xl font-bold text-yellow-600">
                  {dashboard?.reclamos?.pendientes || 0}
                </p>
              </div>
              <div className="bg-yellow-100 rounded-full p-3">
                <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">En Proceso</p>
                <p className="text-3xl font-bold text-blue-600">
                  {dashboard?.reclamos?.en_proceso || 0}
                </p>
              </div>
              <div className="bg-blue-100 rounded-full p-3">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Resueltos Hoy</p>
                <p className="text-3xl font-bold text-green-600">
                  {dashboard?.reclamos?.resueltos_hoy || 0}
                </p>
              </div>
              <div className="bg-green-100 rounded-full p-3">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Asignados</p>
                <p className="text-3xl font-bold text-gray-900">
                  {dashboard?.reclamos?.total || 0}
                </p>
              </div>
              <div className="bg-gray-100 rounded-full p-3">
                <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex gap-4 items-center">
            <label className="text-sm font-medium text-gray-700">Filtrar por estado:</label>
            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todos</option>
              <option value="PENDIENTE">Pendientes</option>
              <option value="EN_PROCESO">En Proceso</option>
              <option value="RESUELTO">Resueltos</option>
              <option value="CERRADO">Cerrados</option>
            </select>
            <button
              onClick={recargarReclamos}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Recargar
            </button>
          </div>
        </div>

        {/* Lista de Reclamos en Cards (estilo Figma) */}
        {cargandoReclamos ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Cargando reclamos...</p>
          </div>
        ) : reclamos && reclamos.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {reclamos
              .filter(r => r.estado !== 'CERRADO' && r.estado !== 'RESUELTO')
              .map((reclamo) => (
                <Card
                  key={reclamo.reclamo_id}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => navigate(`/dashboard/operario/reclamos/${reclamo.reclamo_id}`)}
                >
                  <CardHeader className="space-y-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">
                        {reclamo.tipo_reclamo || 'Reclamo Técnico'}
                      </CardTitle>
                      {getPriorityBadge(reclamo.prioridad)}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      {reclamo.zona || reclamo.direccion?.substring(0, 30) || 'Sin dirección'}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-gray-700">
                      Cliente: {reclamo.socio_nombre} {reclamo.socio_apellido}
                    </p>
                    <p className="text-sm text-gray-600">
                      {reclamo.descripcion?.substring(0, 100) || 'Sin descripción'}
                      {reclamo.descripcion?.length > 100 && '...'}
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        {new Date(reclamo.fecha_alta).toLocaleDateString()}
                      </div>
                      {getStatusBadge(reclamo.estado?.toLowerCase())}
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-gray-500">No hay reclamos asignados</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
