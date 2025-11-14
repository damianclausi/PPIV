import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import Login from '../../components/Login';
import { AuthProvider } from '../../contexts/AuthContext';
import authService from '../../services/authService';

// Mock del servicio de autenticación
vi.mock('../../services/authService', () => ({
  default: {
    login: vi.fn(),
    logout: vi.fn(),
    obtenerPerfil: vi.fn(),
    verificarToken: vi.fn(),
    estaAutenticado: vi.fn(),
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

// Wrapper con providers necesarios
const LoginWrapper = () => (
  <BrowserRouter>
    <AuthProvider>
      <Login />
    </AuthProvider>
  </BrowserRouter>
);

describe('Login', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    authService.estaAutenticado.mockReturnValue(false);
  });

  it('debería renderizar el formulario de login', () => {
    render(<LoginWrapper />);

    // Buscar el título del card
    expect(screen.getAllByText(/Iniciar Sesión/i).length).toBeGreaterThan(0);
    // Los labels están dentro de un div con flex, buscar por placeholder o por texto
    expect(screen.getByPlaceholderText(/tu@email.com/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/••••••••/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Iniciar Sesión/i })).toBeInTheDocument();
  });

  it('debería permitir ingresar email y contraseña', async () => {
    const user = userEvent.setup();
    render(<LoginWrapper />);

    const emailInput = screen.getByPlaceholderText(/tu@email.com/i);
    const passwordInput = screen.getByPlaceholderText(/••••••••/i);

    await user.type(emailInput, 'test@test.com');
    await user.type(passwordInput, 'password123');

    expect(emailInput).toHaveValue('test@test.com');
    expect(passwordInput).toHaveValue('password123');
  });

  it('debería mostrar error cuando el login falla', async () => {
    const user = userEvent.setup();
    const errorMessage = 'Credenciales inválidas';
    
    authService.login.mockRejectedValueOnce(new Error(errorMessage));

    render(<LoginWrapper />);

    const emailInput = screen.getByPlaceholderText(/tu@email.com/i);
    const passwordInput = screen.getByPlaceholderText(/••••••••/i);
    const submitButton = screen.getByRole('button', { name: /Iniciar Sesión/i });

    await user.type(emailInput, 'test@test.com');
    await user.type(passwordInput, 'wrongpassword');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  it('debería navegar al dashboard cuando el login es exitoso', async () => {
    const user = userEvent.setup();
    
    authService.login.mockResolvedValueOnce({
      usuario: {
        usuario_id: 1,
        email: 'test@test.com',
        roles: ['SOCIO'],
      },
      token: 'mock-token',
    });

    render(<LoginWrapper />);

    const emailInput = screen.getByPlaceholderText(/tu@email.com/i);
    const passwordInput = screen.getByPlaceholderText(/••••••••/i);
    const submitButton = screen.getByRole('button', { name: /Iniciar Sesión/i });

    await user.type(emailInput, 'test@test.com');
    await user.type(passwordInput, 'password123');
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('debería mostrar estado de carga durante el login', async () => {
    const user = userEvent.setup();
    
    // Simular un delay en el login
    authService.login.mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve({ usuario: {}, token: 'token' }), 100))
    );

    render(<LoginWrapper />);

    const emailInput = screen.getByPlaceholderText(/tu@email.com/i);
    const passwordInput = screen.getByPlaceholderText(/••••••••/i);
    const submitButton = screen.getByRole('button', { name: /Iniciar Sesión/i });

    await user.type(emailInput, 'test@test.com');
    await user.type(passwordInput, 'password123');
    await user.click(submitButton);

    expect(screen.getByText(/Iniciando sesión/i)).toBeInTheDocument();
    expect(submitButton).toBeDisabled();
  });

  it('debería autocompletar credenciales al hacer click en usuario de prueba', async () => {
    const user = userEvent.setup();
    render(<LoginWrapper />);

    // Buscar el botón del cliente de prueba
    const clienteButton = screen.getByText(/mariaelena.gonzalez@hotmail.com/i);
    await user.click(clienteButton);

    const emailInput = screen.getByPlaceholderText(/tu@email.com/i);
    const passwordInput = screen.getByPlaceholderText(/••••••••/i);

    expect(emailInput).toHaveValue('mariaelena.gonzalez@hotmail.com');
    expect(passwordInput).toHaveValue('password123');
  });
});

