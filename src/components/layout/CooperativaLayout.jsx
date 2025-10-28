import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/button';
import { 
  Home, 
  FileText, 
  Bell, 
  DollarSign, 
  Users, 
  UserPlus, 
  ClipboardList,
  Settings,
  LogOut,
  Menu,
  X,
  Briefcase,
  Calendar,
  BarChart3
} from 'lucide-react';

export default function CooperativaLayout({ children, titulo }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { usuario, logout } = useAuth();
  const [menuAbierto, setMenuAbierto] = useState(false);

  // Obtener roles del usuario
  const roles = (usuario && usuario.roles) || [];
  const esAdmin = roles.includes('ADMIN');
  const esOperario = roles.includes('OPERARIO');
  const esCliente = roles.includes('CLIENTE');

  // Definir menús según rol
  const menuCliente = [
    { nombre: 'Inicio', icono: Home, ruta: '/dashboard/cliente' },
    { nombre: 'Facturas', icono: FileText, ruta: '/dashboard/facturas' },
    { nombre: 'Reclamos', icono: Bell, ruta: '/dashboard/reclamos' },
    { nombre: 'Pagar Online', icono: DollarSign, ruta: '/dashboard/pagar-online' },
  ];

  const menuOperario = [
    { nombre: 'Inicio', icono: Home, ruta: '/dashboard/operario' },
    { nombre: 'Itinerario', icono: Calendar, ruta: '/dashboard/operario/itinerario' },
  ];

  const menuAdmin = [
    { nombre: 'Inicio', icono: Home, ruta: '/dashboard/administrador' },
    { nombre: 'Socios', icono: Users, ruta: '/dashboard/admin/socios' },
    { nombre: 'Empleados', icono: UserPlus, ruta: '/dashboard/admin/empleados' },
    { nombre: 'OTs Comerciales', icono: ClipboardList, ruta: '/dashboard/admin/reclamos-comerciales' },
    { nombre: 'Historial Reclamos', icono: Briefcase, ruta: '/dashboard/admin/historial-reclamos' },
    { nombre: 'Itinerario', icono: Calendar, ruta: '/dashboard/admin/itinerario' },
    { nombre: 'Reportes', icono: BarChart3, ruta: '/dashboard/admin/reportes' },
  ];

  // Seleccionar menú según rol
  const menuItems = esAdmin ? menuAdmin : esOperario ? menuOperario : menuCliente;

  const esRutaActiva = (ruta) => location.pathname === ruta;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header con gradiente Edenor */}
      <header className="bg-cooperativa-gradient-horizontal shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo y nombre */}
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setMenuAbierto(!menuAbierto)}
                className="lg:hidden text-white hover:text-cooperativa-teal transition-colors"
              >
                {menuAbierto ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
              <div className="flex items-center space-x-3">
                <div className="bg-white/20 backdrop-blur-sm rounded-lg p-2">
                  <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div className="text-white">
                  <h1 className="text-lg font-bold leading-tight">Cooperativa Eléctrica</h1>
                  <p className="text-xs text-white/90">Gobernador Ugarte</p>
                </div>
              </div>
            </div>

            {/* Usuario y logout */}
            <div className="flex items-center space-x-4">
              <div className="hidden sm:block text-right">
                <p className="text-white text-sm font-medium">
                  {usuario?.nombre || 'Usuario'}
                </p>
                <p className="text-white/80 text-xs">
                  {esAdmin ? 'Administrador' : esOperario ? 'Operario' : 'Cliente'}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={logout}
                className="text-white hover:bg-white/20"
              >
                <LogOut className="h-4 w-4" />
                <span className="ml-2 hidden sm:inline">Salir</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar - Desktop */}
        <aside className="hidden lg:flex lg:flex-col lg:w-64 bg-cooperativa-dark h-[calc(100vh-4rem)] sticky top-16 shadow-xl">
          <nav className="flex-1 px-4 py-6 space-y-2">
            {menuItems.map((item) => {
              const Icono = item.icono;
              const activo = esRutaActiva(item.ruta);
              
              return (
                <button
                  key={item.ruta}
                  onClick={() => navigate(item.ruta)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                    activo
                      ? 'bg-cooperativa-light text-white shadow-lg'
                      : 'text-white/80 hover:bg-cooperativa-blue hover:text-white'
                  }`}
                >
                  <Icono className="h-5 w-5" />
                  <span className="font-medium">{item.nombre}</span>
                </button>
              );
            })}
          </nav>

          {/* Footer del sidebar */}
          <div className="px-4 py-4 border-t border-white/10">
            <div className="text-white/60 text-xs text-center">
              <p>Sistema de Gestión</p>
              <p className="mt-1">v1.0.0</p>
            </div>
          </div>
        </aside>

        {/* Sidebar Mobile */}
        {menuAbierto && (
          <>
            <div
              className="fixed inset-0 bg-black/50 z-40 lg:hidden"
              onClick={() => setMenuAbierto(false)}
            />
            <aside className="fixed left-0 top-16 bottom-0 w-64 bg-cooperativa-dark z-50 lg:hidden shadow-2xl">
              <nav className="px-4 py-6 space-y-2">
                {menuItems.map((item) => {
                  const Icono = item.icono;
                  const activo = esRutaActiva(item.ruta);
                  
                  return (
                    <button
                      key={item.ruta}
                      onClick={() => {
                        navigate(item.ruta);
                        setMenuAbierto(false);
                      }}
                      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                        activo
                          ? 'bg-cooperativa-light text-white shadow-lg'
                          : 'text-white/80 hover:bg-cooperativa-blue hover:text-white'
                      }`}
                    >
                      <Icono className="h-5 w-5" />
                      <span className="font-medium">{item.nombre}</span>
                    </button>
                  );
                })}
              </nav>
            </aside>
          </>
        )}

        {/* Contenido principal */}
        <main className="flex-1 p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {titulo && (
              <div className="mb-6">
                <h2 className="text-3xl font-bold text-gray-900 bg-gradient-to-r from-cooperativa-dark to-cooperativa-cyan bg-clip-text text-transparent">
                  {titulo}
                </h2>
                <div className="mt-2 h-1 w-24 bg-gradient-to-r from-cooperativa-dark via-cooperativa-blue to-cooperativa-teal rounded-full"></div>
              </div>
            )}
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
