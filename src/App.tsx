import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import SplashScreen from './components/ui/SplashScreen';
import ErrorBoundary from './components/ErrorBoundary';
import Login from './components/Login';
import DashboardCliente from './components/DashboardCliente';
import DashboardOperario from './components/DashboardOperario';
import DashboardAdministrador from './components/DashboardAdministrador';
import FacturasListado from './components/cliente/FacturasListado';
import FacturaDetalle from './components/cliente/FacturaDetalle';
import ReclamosListado from './components/cliente/ReclamosListado';
import ReclamoDetalle from './components/cliente/ReclamoDetalle';
import ReclamoNuevo from './components/cliente/ReclamoNuevo';
import PagoOnline from './components/cliente/PagoOnline';
import ReclamoDetalleOperario from './components/operario/ReclamoDetalle';
import CargarInsumos from './components/operario/CargarInsumos';
import GestionSocios from './components/admin/GestionSocios';
import GestionEmpleados from './components/admin/GestionEmpleados';
import AsignarReclamo from './components/admin/AsignarReclamo';
import SocioDetalle from './components/admin/SocioDetalle';
import SocioEditar from './components/admin/SocioEditar';
import SocioNuevo from './components/admin/SocioNuevo';
import ReclamoDetalleAdmin from './components/admin/ReclamoDetalleAdmin';
import OTsAdministrativas from './components/admin/OTsAdministrativas';
import OTTecnicaDetalleWrapper from './components/operario/OTTecnicaDetalleWrapper.jsx';
import SupervisorOTsTecnicas from './components/supervisor/SupervisorOTsTecnicas';
import ItinerarioCuadrillas from './components/admin/ItinerarioCuadrillas';
import ItinerarioOperario from './components/operario/ItinerarioOperario';
import Reportes from './components/admin/Reportes';

// Componente para rutas protegidas
function RutaProtegida({ children }: { children: React.ReactNode }) {
  const { autenticado, cargando } = useAuth();

  if (cargando) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!autenticado) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

// Componente principal de rutas
function AppRoutes() {
  const { autenticado, usuario } = useAuth();

  // Determinar el dashboard según el rol del usuario
  const getDashboardPorRol = () => {
    if (!usuario) {
      return <DashboardCliente />;
    }

    // Type assertion para usuario con roles
    const usuarioConRoles = usuario as any;
    const roles = usuarioConRoles.roles || [];

    if (roles.includes('ADMIN')) {
      return <DashboardAdministrador />;
    } else if (roles.includes('OPERARIO')) {
      return <DashboardOperario />;
    } else if (roles.includes('CLIENTE')) {
      return <DashboardCliente />;
    }

    return <DashboardCliente />;
  };

  return (
    <Routes>
      <Route
        path="/login"
        element={autenticado ? <Navigate to="/dashboard" replace /> : <Login />}
      />
      <Route
        path="/dashboard"
        element={
          <RutaProtegida>
            {getDashboardPorRol()}
          </RutaProtegida>
        }
      />
      <Route
        path="/dashboard/cliente"
        element={
          <RutaProtegida>
            <DashboardCliente />
          </RutaProtegida>
        }
      />
      <Route
        path="/dashboard/operario"
        element={
          <RutaProtegida>
            <DashboardOperario />
          </RutaProtegida>
        }
      />
      <Route
        path="/dashboard/administrador"
        element={
          <RutaProtegida>
            <DashboardAdministrador />
          </RutaProtegida>
        }
      />
      
      {/* Rutas Cliente */}
      <Route
        path="/dashboard/facturas"
        element={
          <RutaProtegida>
            <FacturasListado />
          </RutaProtegida>
        }
      />
      <Route
        path="/dashboard/cliente/factura/:id"
        element={
          <RutaProtegida>
            <FacturaDetalle />
          </RutaProtegida>
        }
      />
      <Route
        path="/dashboard/reclamos"
        element={
          <RutaProtegida>
            <ErrorBoundary>
              <ReclamosListado />
            </ErrorBoundary>
          </RutaProtegida>
        }
      />
      <Route
        path="/dashboard/reclamos/:id"
        element={
          <RutaProtegida>
            <ReclamoDetalle />
          </RutaProtegida>
        }
      />
      <Route
        path="/dashboard/reclamos/nuevo"
        element={
          <RutaProtegida>
            <ReclamoNuevo />
          </RutaProtegida>
        }
      />
      <Route
        path="/dashboard/pagar-online"
        element={
          <RutaProtegida>
            <PagoOnline />
          </RutaProtegida>
        }
      />
      
      {/* Rutas Operario */}
      <Route
        path="/dashboard/operario/ots-tecnicas/:id"
        element={
          <RutaProtegida>
            <OTTecnicaDetalleWrapper />
          </RutaProtegida>
        }
      />
      <Route
        path="/dashboard/operario/reclamos/:id"
        element={
          <RutaProtegida>
            <ReclamoDetalleOperario />
          </RutaProtegida>
        }
      />
      <Route
        path="/dashboard/operario/reclamos/:id/insumos"
        element={
          <RutaProtegida>
            <CargarInsumos />
          </RutaProtegida>
        }
      />
      <Route
        path="/dashboard/operario/itinerario"
        element={
          <RutaProtegida>
            <ItinerarioOperario />
          </RutaProtegida>
        }
      />
      
      {/* Rutas Admin */}
      <Route
        path="/dashboard/admin/socios"
        element={
          <RutaProtegida>
            <GestionSocios />
          </RutaProtegida>
        }
      />
      <Route
        path="/dashboard/admin/socios/nuevo"
        element={
          <RutaProtegida>
            <SocioNuevo />
          </RutaProtegida>
        }
      />
      <Route
        path="/dashboard/admin/socios/:id"
        element={
          <RutaProtegida>
            <SocioDetalle />
          </RutaProtegida>
        }
      />
      <Route
        path="/dashboard/admin/socios/:id/editar"
        element={
          <RutaProtegida>
            <SocioEditar />
          </RutaProtegida>
        }
      />
      <Route
        path="/dashboard/admin/reclamos/:id"
        element={
          <RutaProtegida>
            <ReclamoDetalleAdmin />
          </RutaProtegida>
        }
      />
      <Route
        path="/dashboard/admin/reclamos/:id/asignar"
        element={
          <RutaProtegida>
            <AsignarReclamo />
          </RutaProtegida>
        }
      />
      <Route
        path="/dashboard/admin/empleados"
        element={
          <RutaProtegida>
            <GestionEmpleados />
          </RutaProtegida>
        }
      />
      <Route
        path="/dashboard/admin/reclamos-comerciales"
        element={
          <RutaProtegida>
            <OTsAdministrativas />
          </RutaProtegida>
        }
      />
      <Route
        path="/dashboard/admin/historial-reclamos"
        element={
          <RutaProtegida>
            <SupervisorOTsTecnicas />
          </RutaProtegida>
        }
      />
      <Route
        path="/dashboard/admin/itinerario"
        element={
          <RutaProtegida>
            <ItinerarioCuadrillas />
          </RutaProtegida>
        }
      />
      <Route
        path="/dashboard/admin/reportes"
        element={
          <RutaProtegida>
            <Reportes />
          </RutaProtegida>
        }
      />
      
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

// Componente principal de la aplicación
function App() {
  const [showSplash, setShowSplash] = useState(true);

  const handleSplashComplete = () => {
    setShowSplash(false);
  };

  return (
    <Router>
      <AuthProvider>
        {showSplash ? (
          <SplashScreen onComplete={handleSplashComplete} />
        ) : (
          <AppRoutes />
        )}
      </AuthProvider>
    </Router>
  );
}

export default App;
