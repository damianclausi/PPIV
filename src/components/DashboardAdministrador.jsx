/**
 * Dashboard para Administradores
 * Muestra estadísticas generales del sistema con diseño Figma
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { usePerfil, useDashboard } from '../hooks/useAdministrador.js';
import { useAuth } from '../contexts/AuthContext.jsx';
import CooperativaLayout from './layout/CooperativaLayout';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Skeleton } from './ui/skeleton';
import AlertasStock from './admin/AlertasStock';
import { 
  Users, 
  AlertCircle, 
  DollarSign, 
  UserCog,
  ClipboardList,
  BarChart3,
  TrendingUp,
  Wrench,
  Calendar,
  CreditCard
} from 'lucide-react';

export default function DashboardAdministrador() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { perfil } = usePerfil();
  const { dashboard, cargando } = useDashboard();

  if (cargando) {
    return (
      <CooperativaLayout titulo="Panel Administrativo">
        <div className="space-y-6">
          <Skeleton className="h-12 w-64" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </div>
        </div>
      </CooperativaLayout>
    );
  }

  return (
    <CooperativaLayout titulo="Panel Administrativo">
      <div className="space-y-8">
        {/* Info del admin */}
        {perfil && (
          <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-l-cooperativa-cyan">
            <p className="text-sm text-gray-600">
              <span className="font-semibold text-cooperativa-dark">Administrador:</span> {perfil.nombre} {perfil.apellido}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {perfil.rol_interno || perfil.cargo || 'Administrador'}
            </p>
          </div>
        )}

        {/* Cards de Resumen - 3 columnas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Socios */}
          <Card>
            <CardHeader className="flex flex-row items-center space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Gestión de Socios
              </CardTitle>
              <Users className="h-4 w-4 ml-auto text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboard?.socios?.total || 0}</div>
              <p className="text-xs text-muted-foreground">
                {dashboard?.socios?.activos || 0} activos • {dashboard?.socios?.inactivos || 0} inactivos
              </p>
            </CardContent>
          </Card>

          {/* Reclamos */}
          <Card>
            <CardHeader className="flex flex-row items-center space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Estado de Reclamos
              </CardTitle>
              <AlertCircle className="h-4 w-4 ml-auto text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboard?.reclamos?.total || 0}</div>
              <p className="text-xs text-muted-foreground">
                {dashboard?.reclamos?.pendientes || 0} pendientes • {dashboard?.reclamos?.en_proceso || 0} en proceso
              </p>
            </CardContent>
          </Card>

          {/* Facturación */}
          <Card>
            <CardHeader className="flex flex-row items-center space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Facturación
              </CardTitle>
              <DollarSign className="h-4 w-4 ml-auto text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${parseFloat(dashboard?.facturacion?.monto_pendiente || 0).toLocaleString('es-AR')}
              </div>
              <p className="text-xs text-muted-foreground">
                {dashboard?.facturacion?.pendientes || 0} facturas pendientes
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Alertas de Stock */}
        <AlertasStock />

        {/* Grid Inferior - 2 Columnas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Acciones Rápidas */}
          <Card>
            <CardHeader>
              <CardTitle>Acciones Rápidas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                className="w-full justify-start" 
                variant="default"
                onClick={() => navigate('/dashboard/admin/socios')}
              >
                <Users className="h-4 w-4 mr-2" />
                Gestionar Socios
              </Button>
              <Button 
                className="w-full justify-start" 
                variant="default"
                onClick={() => navigate('/dashboard/admin/reclamos-comerciales')}
              >
                <ClipboardList className="h-4 w-4 mr-2" />
                Reclamos Comerciales
              </Button>
              <Button 
                className="w-full justify-start" 
                variant="default"
                onClick={() => navigate('/dashboard/admin/itinerario')}
              >
                <Calendar className="h-4 w-4 mr-2" />
                Reclamos Técnicos
              </Button>
              <Button 
                className="w-full justify-start" 
                variant="default"
                onClick={() => navigate('/dashboard/admin/historial-reclamos')}
              >
                <Wrench className="h-4 w-4 mr-2" />
                Historial de Reclamos
              </Button>
              <Button 
                className="w-full justify-start" 
                variant="outline"
                onClick={() => navigate('/dashboard/admin/reportes')}
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                Ver Reportes
              </Button>
              <Button 
                className="w-full justify-start" 
                variant="outline"
                onClick={() => navigate('/dashboard/admin/gestion-cuentas')}
              >
                <CreditCard className="h-4 w-4 mr-2" />
                Gestión de Cuentas
              </Button>
            </CardContent>
          </Card>

          {/* Estadísticas Detalladas */}
          <Card>
            <CardHeader>
              <CardTitle>Resumen del Sistema</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-blue-600" />
                    <div>
                      <p className="text-sm font-medium">Socios Nuevos (30 días)</p>
                      <p className="text-xs text-muted-foreground">
                        {dashboard?.socios?.nuevos_ultimo_mes || 0} registros
                      </p>
                    </div>
                  </div>
                  <TrendingUp className="h-5 w-5 text-green-600" />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-green-600" />
                    <div>
                      <p className="text-sm font-medium">Reclamos Resueltos</p>
                      <p className="text-xs text-muted-foreground">
                        {dashboard?.reclamos?.resueltos || 0} completados
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-green-600" />
                    <div>
                      <p className="text-sm font-medium">Recaudado (30 días)</p>
                      <p className="text-xs text-muted-foreground">
                        ${parseFloat(dashboard?.facturacion?.recaudado_ultimo_mes || 0).toLocaleString('es-AR')}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ClipboardList className="h-4 w-4 text-gray-600" />
                    <div>
                      <p className="text-sm font-medium">Total Facturas</p>
                      <p className="text-xs text-muted-foreground">
                        {dashboard?.facturacion?.total || 0} emitidas
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </CooperativaLayout>
  );
}
