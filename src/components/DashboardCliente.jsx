import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useDashboard, usePerfil } from '../hooks/useCliente';
import CooperativaLayout from './layout/CooperativaLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Skeleton } from './ui/skeleton';
import { Alert, AlertDescription } from './ui/alert';
import { CheckCircle, FileText, Bell, Home, DollarSign, TrendingUp, Activity } from 'lucide-react';

export default function DashboardCliente() {
  const navigate = useNavigate();
  const { usuario, logout } = useAuth();
  const { perfil, cargando: cargandoPerfil } = usePerfil();
  const { dashboard, cargando: cargandoDashboard, error } = useDashboard();

  if (cargandoPerfil || cargandoDashboard) {
    return (
      <CooperativaLayout titulo="Dashboard">
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

  if (error) {
    return (
      <CooperativaLayout titulo="Dashboard">
        <Alert variant="destructive">
          <AlertDescription>Error al cargar el dashboard: {error}</AlertDescription>
        </Alert>
      </CooperativaLayout>
    );
  }

  return (
    <CooperativaLayout titulo="Panel de Control">
      <div className="space-y-8">
        {/* Cards de Resumen con estilo Edenor */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Estado del Servicio */}
          <Card className="border-l-4 border-l-cooperativa-teal shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="flex flex-row items-center space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-cooperativa-dark">
                Estado del Servicio
              </CardTitle>
              <CheckCircle className="h-5 w-5 ml-auto text-cooperativa-teal" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-cooperativa-dark">Activo</div>
              <p className="text-xs text-muted-foreground mt-1">
                {dashboard?.cuentas?.activas || 0} cuenta(s) activa(s)
              </p>
              <div className="mt-3 flex items-center text-xs text-cooperativa-teal font-medium">
                <Activity className="h-3 w-3 mr-1" />
                Servicio operativo
              </div>
            </CardContent>
          </Card>

          {/* Facturas Pendientes */}
          <Card className="border-l-4 border-l-cooperativa-blue shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="flex flex-row items-center space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-cooperativa-dark">
                Facturas Pendientes
              </CardTitle>
              <FileText className="h-5 w-5 ml-auto text-cooperativa-blue" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-cooperativa-dark">
                ${dashboard?.facturas?.monto_pendiente?.toFixed(2) || '0.00'}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {dashboard?.facturas?.pendientes || 0} factura(s) pendiente(s)
              </p>
              <Button
                variant="link"
                size="sm"
                className="mt-2 h-auto p-0 text-cooperativa-blue hover:text-cooperativa-light"
                onClick={() => navigate('/dashboard/facturas')}
              >
                Ver detalles →
              </Button>
            </CardContent>
          </Card>

          {/* Reclamos Activos */}
          <Card className="border-l-4 border-l-orange-500 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="flex flex-row items-center space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-cooperativa-dark">
                Reclamos Activos
              </CardTitle>
              <Bell className="h-5 w-5 ml-auto text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-cooperativa-dark">
                {(dashboard?.reclamos?.pendientes || 0) + (dashboard?.reclamos?.en_proceso || 0)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {dashboard?.reclamos?.pendientes || 0} pendiente(s), {dashboard?.reclamos?.en_proceso || 0} en curso
              </p>
              <Button
                variant="link"
                size="sm"
                className="mt-2 h-auto p-0 text-orange-500 hover:text-orange-600"
                onClick={() => navigate('/dashboard/reclamos')}
              >
                Ver detalles →
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Grid Inferior - 2 Columnas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Acciones Rápidas */}
          <Card className="shadow-lg">
            <CardHeader className="bg-gradient-to-r from-cooperativa-dark to-cooperativa-blue text-white rounded-t-lg">
              <CardTitle>Acciones Rápidas</CardTitle>
              <CardDescription className="text-white/80">
                Accede a las funcionalidades principales
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 pt-6">
              <Button 
                className="w-full justify-start bg-cooperativa-blue hover:bg-cooperativa-light text-white shadow-md" 
                onClick={() => navigate('/dashboard/facturas')}
              >
                <FileText className="h-4 w-4 mr-2" />
                Ver Facturas
              </Button>
              <Button 
                className="w-full justify-start bg-cooperativa-cyan hover:bg-cooperativa-teal text-white shadow-md" 
                onClick={() => navigate('/dashboard/reclamos')}
              >
                <Bell className="h-4 w-4 mr-2" />
                Mis Reclamos
              </Button>
              <Button 
                className="w-full justify-start bg-cooperativa-teal hover:bg-green-600 text-white shadow-md"
                onClick={() => navigate('/dashboard/pagar-online')}
              >
                <DollarSign className="h-4 w-4 mr-2" />
                Pagar Online
              </Button>
            </CardContent>
          </Card>

          {/* Información Personal */}
          <Card className="shadow-lg">
            <CardHeader className="bg-gradient-to-r from-cooperativa-dark to-cooperativa-blue text-white rounded-t-lg">
              <CardTitle>Mi Información</CardTitle>
              <CardDescription className="text-white/80">
                Datos de tu cuenta
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="border-l-2 border-cooperativa-cyan pl-3">
                  <p className="text-xs font-medium text-muted-foreground">Nombre Completo</p>
                  <p className="text-sm font-semibold text-cooperativa-dark">
                    {perfil?.nombre} {perfil?.apellido}
                  </p>
                </div>
                <div className="border-l-2 border-cooperativa-blue pl-3">
                  <p className="text-xs font-medium text-muted-foreground">DNI</p>
                  <p className="text-sm font-semibold text-cooperativa-dark">{perfil?.dni}</p>
                </div>
                <div className="border-l-2 border-cooperativa-cyan pl-3">
                  <p className="text-xs font-medium text-muted-foreground">Email</p>
                  <p className="text-sm font-semibold text-cooperativa-dark">{perfil?.email}</p>
                </div>
                <div className="border-l-2 border-cooperativa-blue pl-3">
                  <p className="text-xs font-medium text-muted-foreground">Teléfono</p>
                  <p className="text-sm font-semibold text-cooperativa-dark">
                    {perfil?.telefono || 'No especificado'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </CooperativaLayout>
  );
}
