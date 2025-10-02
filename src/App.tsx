import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './components/Login';
import DashboardCliente from './components/DashboardCliente';
import DashboardOperario from './components/DashboardOperario';
import DashboardAdministrador from './components/DashboardAdministrador';
import FacturasListado from './components/cliente/FacturasListado';
import ReclamosListado from './components/cliente/ReclamosListado';
import ReclamoNuevo from './components/cliente/ReclamoNuevo';
import PagoOnline from './components/cliente/PagoOnline';
import ReclamoDetalleOperario from './components/operario/ReclamoDetalle';
import CargarInsumos from './components/operario/CargarInsumos';
import GestionSocios from './components/admin/GestionSocios';
import GestionReclamos from './components/admin/GestionReclamos';
import GestionEmpleados from './components/admin/GestionEmpleados';
import AsignarReclamo from './components/admin/AsignarReclamo';
import SocioDetalle from './components/admin/SocioDetalle';
import SocioEditar from './components/admin/SocioEditar';
import SocioNuevo from './components/admin/SocioNuevo';
import ReclamoDetalleAdmin from './components/admin/ReclamoDetalleAdmin';

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
        path="/dashboard/reclamos"
        element={
          <RutaProtegida>
            <ReclamosListado />
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
        path="/dashboard/admin/reclamos"
        element={
          <RutaProtegida>
            <GestionReclamos />
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
      
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

// Componente principal de la aplicación
function App() {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </Router>
  );
}

export default App;
