import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './components/Login';
import DashboardCliente from './components/DashboardCliente';
import DashboardOperario from './components/DashboardOperario';
import DashboardAdministrador from './components/DashboardAdministrador';

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
