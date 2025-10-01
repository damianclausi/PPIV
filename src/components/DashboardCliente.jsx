import { useAuth } from '../contexts/AuthContext';
import { useDashboard, usePerfil } from '../hooks/useCliente';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Skeleton } from './ui/skeleton';
import { Alert, AlertDescription } from './ui/alert';

export default function DashboardCliente() {
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Cooperativa Eléctrica Gobernador Ugarte
              </h1>
              <p className="text-sm text-gray-600">
                Bienvenido, {perfil?.nombre} {perfil?.apellido}
              </p>
            </div>
            <Button onClick={logout} variant="outline">
              Cerrar Sesión
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Resumen */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Cuentas */}
          <Card>
            <CardHeader>
              <CardTitle>Cuentas</CardTitle>
              <CardDescription>Servicios contratados</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">
                {dashboard?.cuentas?.activas || 0}
              </div>
              <p className="text-sm text-gray-600">
                de {dashboard?.cuentas?.total || 0} activas
              </p>
            </CardContent>
          </Card>

          {/* Facturas Pendientes */}
          <Card>
            <CardHeader>
              <CardTitle>Facturas Pendientes</CardTitle>
              <CardDescription>Por pagar</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-600">
                {dashboard?.facturas?.pendientes || 0}
              </div>
              <p className="text-sm text-gray-600">
                Total: ${dashboard?.facturas?.monto_pendiente?.toFixed(2) || '0.00'}
              </p>
            </CardContent>
          </Card>

          {/* Reclamos */}
          <Card>
            <CardHeader>
              <CardTitle>Reclamos</CardTitle>
              <CardDescription>Estado actual</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm">Pendientes:</span>
                  <span className="font-semibold">{dashboard?.reclamos?.pendientes || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">En proceso:</span>
                  <span className="font-semibold">{dashboard?.reclamos?.en_proceso || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Resueltos:</span>
                  <span className="font-semibold text-green-600">{dashboard?.reclamos?.resueltos || 0}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Información del Perfil */}
        <Card>
          <CardHeader>
            <CardTitle>Información Personal</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Nombre Completo</p>
                <p className="font-semibold">{perfil?.nombre} {perfil?.apellido}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">DNI</p>
                <p className="font-semibold">{perfil?.dni}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Email</p>
                <p className="font-semibold">{perfil?.email}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Teléfono</p>
                <p className="font-semibold">{perfil?.telefono || 'No especificado'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Acciones Rápidas */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
          <Button className="w-full" size="lg">
            Ver Facturas
          </Button>
          <Button className="w-full" size="lg" variant="outline">
            Mis Reclamos
          </Button>
          <Button className="w-full" size="lg" variant="outline">
            Nueva Reclamo
          </Button>
          <Button className="w-full" size="lg" variant="outline">
            Pagar Online
          </Button>
        </div>
      </main>
    </div>
  );
}
