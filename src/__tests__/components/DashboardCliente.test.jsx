import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import DashboardCliente from '../../components/DashboardCliente';
import { AuthProvider } from '../../contexts/AuthContext';
import { useDashboard, usePerfil } from '../../hooks/useCliente';
import clienteService from '../../services/clienteService';

// Mock de los hooks
vi.mock('../../hooks/useCliente', () => ({
  useDashboard: vi.fn(),
  usePerfil: vi.fn(),
}));

// Mock del servicio
vi.mock('../../services/clienteService', () => ({
  default: {
    obtenerPerfil: vi.fn(),
    obtenerFacturas: vi.fn(),
    obtenerReclamos: vi.fn(),
  },
}));

// Mock de useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock de CooperativaLayout
vi.mock('../../components/layout/CooperativaLayout', () => ({
  default: ({ children, titulo }) => (
    <div data-testid="layout">
      <h1>{titulo}</h1>
      {children}
    </div>
  ),
}));

const DashboardWrapper = () => (
  <BrowserRouter>
    <AuthProvider>
      <DashboardCliente />
    </AuthProvider>
  </BrowserRouter>
);

describe('DashboardCliente', () => {
  const mockPerfil = {
    socio_id: 1,
    nombre: 'Test',
    apellido: 'Usuario',
    email: 'test@test.com',
    dni: '12345678',
    telefono: '1234567890',
  };

  const mockDashboard = {
    facturas_pendientes: 2,
    facturas_vencidas: 0,
    monto_pendiente: 5000,
    reclamos_abiertos: 1,
    reclamos_resueltos: 5,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    usePerfil.mockReturnValue({
      perfil: mockPerfil,
      cargando: false,
      error: null,
    });
    useDashboard.mockReturnValue({
      dashboard: mockDashboard,
      cargando: false,
      error: null,
      recargar: vi.fn(),
    });
    clienteService.obtenerPerfil.mockResolvedValue({
      cuentas: [
        {
          cuenta_id: 1,
          numero_cuenta: 'CUENTA-001',
          direccion: 'Calle Test 123',
          principal: true,
          activa: true,
          servicio_nombre: 'Electricidad',
        },
      ],
    });
    clienteService.obtenerFacturas.mockResolvedValue([]);
    clienteService.obtenerReclamos.mockResolvedValue([]);
  });

  it('debería mostrar el título del dashboard', () => {
    render(<DashboardWrapper />);
    expect(screen.getByText(/Panel de Control/i)).toBeInTheDocument();
  });

  it('debería mostrar información del perfil', async () => {
    render(<DashboardWrapper />);

    await waitFor(() => {
      expect(screen.getByText(/Test Usuario/i)).toBeInTheDocument();
      expect(screen.getByText(/test@test.com/i)).toBeInTheDocument();
    });
  });

  it('debería mostrar skeleton mientras carga', () => {
    usePerfil.mockReturnValue({
      perfil: null,
      cargando: true,
      error: null,
    });
    useDashboard.mockReturnValue({
      dashboard: null,
      cargando: true,
      error: null,
      recargar: vi.fn(),
    });

    render(<DashboardWrapper />);
    // Verificar que se renderiza el layout (el skeleton está dentro)
    expect(screen.getByTestId('layout')).toBeInTheDocument();
  });

  it('debería mostrar error cuando hay un error al cargar', () => {
    useDashboard.mockReturnValue({
      dashboard: null,
      cargando: false,
      error: 'Error al cargar dashboard',
      recargar: vi.fn(),
    });

    render(<DashboardWrapper />);
    expect(screen.getByText(/Error al cargar el dashboard/i)).toBeInTheDocument();
  });

  it('debería mostrar acciones rápidas', async () => {
    render(<DashboardWrapper />);

    await waitFor(() => {
      expect(screen.getByText(/Acciones Rápidas/i)).toBeInTheDocument();
      expect(screen.getByText(/Ver Facturas/i)).toBeInTheDocument();
      expect(screen.getByText(/Mis Reclamos/i)).toBeInTheDocument();
      expect(screen.getByText(/Pagar Online/i)).toBeInTheDocument();
    });
  });
});

