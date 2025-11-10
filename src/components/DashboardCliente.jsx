import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useDashboard, usePerfil } from '../hooks/useCliente';
import CooperativaLayout from './layout/CooperativaLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Skeleton } from './ui/skeleton';
import { Alert, AlertDescription } from './ui/alert';
import { CheckCircle, FileText, Bell, Home, DollarSign, TrendingUp, Activity, CreditCard, MapPin } from 'lucide-react';
import clienteService from '../services/clienteService';

export default function DashboardCliente() {
  const navigate = useNavigate();
  const { usuario, logout } = useAuth();
  const { perfil, cargando: cargandoPerfil } = usePerfil();
  const { dashboard, cargando: cargandoDashboard, error } = useDashboard();
  const [cuentas, setCuentas] = useState([]);
  const [cuentaSeleccionada, setCuentaSeleccionada] = useState(null);
  const [datosCuenta, setDatosCuenta] = useState(null);
  const [cargandoCuentas, setCargandoCuentas] = useState(false);

  // Cargar cuentas del cliente
  useEffect(() => {
    const cargarCuentas = async () => {
      try {
        const response = await clienteService.obtenerPerfil();
        if (response?.cuentas && response.cuentas.length > 0) {
          setCuentas(response.cuentas);
          // Seleccionar la cuenta principal por defecto, o la primera
          const cuentaPrincipal = response.cuentas.find(c => c.principal) || response.cuentas[0];
          setCuentaSeleccionada(cuentaPrincipal.cuenta_id);
        }
      } catch (err) {
        console.error('Error al cargar cuentas:', err);
      }
    };

    if (perfil) {
      cargarCuentas();
    }
  }, [perfil]);

  // Cargar datos de la cuenta seleccionada
  useEffect(() => {
    const cargarDatosCuenta = async () => {
      if (!cuentaSeleccionada) return;

      try {
        setCargandoCuentas(true);
        
        const [facturas, reclamos] = await Promise.all([
          clienteService.obtenerFacturas({ cuenta_id: cuentaSeleccionada }),
          clienteService.obtenerReclamos({ cuenta_id: cuentaSeleccionada })
        ]);

        // El servicio ya devuelve .datos, entonces facturas y reclamos ya son los arrays
        setDatosCuenta({
          facturas: Array.isArray(facturas) ? facturas : (facturas?.datos || facturas || []),
          reclamos: Array.isArray(reclamos) ? reclamos : (reclamos?.datos || reclamos || [])
        });
      } catch (err) {
        console.error('Error al cargar datos de cuenta:', err);
      } finally {
        setCargandoCuentas(false);
      }
    };

    cargarDatosCuenta();
  }, [cuentaSeleccionada]);

  const handleSeleccionarCuenta = (cuentaId) => {
    setCuentaSeleccionada(cuentaId);
  };

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

  // Calcular estadísticas de la cuenta seleccionada
  const cuentaActual = cuentas.find(c => c.cuenta_id === cuentaSeleccionada);
  const facturasPendientes = datosCuenta?.facturas?.filter(f => f.estado === 'PENDIENTE') || [];
  const montoPendiente = facturasPendientes.reduce((sum, f) => sum + (parseFloat(f.importe) || 0), 0);
  const reclamosActivos = datosCuenta?.reclamos?.filter(r => r.estado === 'PENDIENTE' || r.estado === 'EN_PROCESO') || [];

  return (
    <CooperativaLayout titulo="Panel de Control">
      <div className="space-y-8">
        {/* Selector de Cuentas */}
        {cuentas.length > 0 && (
          <Card className="border-2 border-cooperativa-blue/20 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-cooperativa-dark to-cooperativa-blue text-white">
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Mis Cuentas
              </CardTitle>
              <CardDescription className="text-white/90">
                Selecciona una cuenta para ver su información detallada
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {cuentas.map((cuenta) => (
                  <div
                    key={cuenta.cuenta_id}
                    onClick={() => handleSeleccionarCuenta(cuenta.cuenta_id)}
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      cuentaSeleccionada === cuenta.cuenta_id
                        ? 'border-cooperativa-blue bg-cooperativa-blue/10 shadow-md ring-2 ring-cooperativa-blue/30'
                        : 'border-gray-200 hover:border-cooperativa-blue/50 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-cooperativa-dark">
                          #{cuenta.numero_cuenta}
                        </span>
                        {cuenta.principal && (
                          <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                            Principal
                          </span>
                        )}
                      </div>
                      {cuentaSeleccionada === cuenta.cuenta_id && (
                        <CheckCircle className="h-5 w-5 text-cooperativa-blue" />
                      )}
                    </div>
                    <div className="flex items-start gap-2 text-sm text-gray-600">
                      <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      <span>{cuenta.direccion}</span>
                    </div>
                    <div className="mt-2 pt-2 border-t border-gray-200">
                      <span className="text-xs text-gray-500">Servicio: </span>
                      <span className="text-xs font-medium text-cooperativa-dark">
                        {cuenta.servicio_nombre || 'No especificado'}
                      </span>
                    </div>
                    {(cuenta.deuda && cuenta.deuda > 0) && (
                      <div className="mt-2 pt-2 border-t border-red-200">
                        <span className="text-xs font-semibold text-red-600">
                          Deuda: ${Number(cuenta.deuda).toFixed(2)}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

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
              <div className="text-2xl font-bold text-cooperativa-dark">
                {cuentaActual?.activa ? 'Activo' : 'Inactivo'}
              </div>
              {cuentaActual && (
                <>
                  <p className="text-xs text-muted-foreground mt-1">
                    Cuenta #{cuentaActual.numero_cuenta}
                  </p>
                  <div className="mt-3 flex items-center text-xs text-cooperativa-teal font-medium">
                    <Activity className="h-3 w-3 mr-1" />
                    {cuentaActual.activa ? 'Servicio operativo' : 'Servicio inactivo'}
                  </div>
                </>
              )}
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
              {cargandoCuentas ? (
                <Skeleton className="h-8 w-32" />
              ) : (
                <>
                  <div className="text-2xl font-bold text-cooperativa-dark">
                    ${Number(montoPendiente).toFixed(2)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {facturasPendientes.length} factura(s) pendiente(s)
                  </p>
                  <Button
                    variant="link"
                    size="sm"
                    className="mt-2 h-auto p-0 text-cooperativa-blue hover:text-cooperativa-light"
                    onClick={() => navigate('/dashboard/facturas')}
                  >
                    Ver detalles →
                  </Button>
                </>
              )}
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
              {cargandoCuentas ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <>
                  <div className="text-2xl font-bold text-cooperativa-dark">
                    {reclamosActivos.length}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {reclamosActivos.filter(r => r.estado === 'PENDIENTE').length} pendiente(s), {reclamosActivos.filter(r => r.estado === 'EN_PROCESO').length} en curso
                  </p>
                  <Button
                    variant="link"
                    size="sm"
                    className="mt-2 h-auto p-0 text-orange-500 hover:text-orange-600"
                    onClick={() => navigate('/dashboard/reclamos')}
                  >
                    Ver detalles →
                  </Button>
                </>
              )}
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
