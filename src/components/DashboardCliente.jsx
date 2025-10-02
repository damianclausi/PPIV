import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useDashboard, usePerfil } from '../hooks/useCliente';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Skeleton } from './ui/skeleton';
import { Alert, AlertDescription } from './ui/alert';
import { CheckCircle, FileText, Bell, Home, DollarSign } from 'lucide-react';

export default function DashboardCliente() {
  const navigate = useNavigate();
  const { usuario, logout } = useAuth();
  const { perfil, cargando: cargandoPerfil } = usePerfil();
  const { dashboard, cargando: cargandoDashboard, error } = useDashboard();

  if (cargandoPerfil || cargandoDashboard) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <Skeleton className="h-12 w-64" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <Alert variant="destructive">
          <AlertDescription>Error al cargar el dashboard: {error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard - Cliente</h1>
          <Button variant="outline" onClick={logout}>
            Cerrar Sesión
          </Button>
        </div>

        {/* Cards de Resumen */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Estado del Servicio */}
          <Card>
            <CardHeader className="flex flex-row items-center space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Estado del Servicio
              </CardTitle>
              <CheckCircle className="h-4 w-4 ml-auto text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Activo</div>
              <p className="text-xs text-muted-foreground">
                {dashboard?.cuentas?.activas || 0} cuenta(s) activa(s)
              </p>
            </CardContent>
          </Card>

          {/* Última Factura */}
          <Card>
            <CardHeader className="flex flex-row items-center space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Facturas Pendientes
              </CardTitle>
              <FileText className="h-4 w-4 ml-auto" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${dashboard?.facturas?.monto_pendiente?.toFixed(2) || '0.00'}
              </div>
              <p className="text-xs text-muted-foreground">
                {dashboard?.facturas?.pendientes || 0} factura(s) pendiente(s)
              </p>
            </CardContent>
          </Card>

          {/* Reclamos Activos */}
          <Card>
            <CardHeader className="flex flex-row items-center space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Reclamos Activos
              </CardTitle>
              <Bell className="h-4 w-4 ml-auto" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {(dashboard?.reclamos?.pendientes || 0) + (dashboard?.reclamos?.en_proceso || 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                {dashboard?.reclamos?.pendientes || 0} pendiente(s), {dashboard?.reclamos?.en_proceso || 0} en curso
              </p>
            </CardContent>
          </Card>
        </div>

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
                onClick={() => navigate('/dashboard/facturas')}
              >
                <FileText className="h-4 w-4 mr-2" />
                Ver Facturas
              </Button>
              <Button 
                className="w-full justify-start" 
                variant="default"
                onClick={() => navigate('/dashboard/reclamos')}
              >
                <Bell className="h-4 w-4 mr-2" />
                Mis Reclamos
              </Button>
              <Button 
                className="w-full justify-start" 
                variant="outline"
                onClick={() => navigate('/dashboard/pagar-online')}
              >
                <DollarSign className="h-4 w-4 mr-2" />
                Pagar Online
              </Button>
            </CardContent>
          </Card>

          {/* Información Personal */}
          <Card>
            <CardHeader>
              <CardTitle>Mi Información</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Nombre Completo</p>
                    <p className="text-sm text-muted-foreground">
                      {perfil?.nombre} {perfil?.apellido}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">DNI</p>
                    <p className="text-sm text-muted-foreground">{perfil?.dni}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Email</p>
                    <p className="text-sm text-muted-foreground">{perfil?.email}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Teléfono</p>
                    <p className="text-sm text-muted-foreground">
                      {perfil?.telefono || 'No especificado'}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
