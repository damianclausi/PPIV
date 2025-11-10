import { createContext, useContext, useState, useEffect } from 'react';
import authService from '../services/authService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [usuario, setUsuario] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [autenticado, setAutenticado] = useState(false);

  useEffect(() => {
    verificarAutenticacion();
  }, []);

  const verificarAutenticacion = async () => {
    try {
      if (authService.estaAutenticado()) {
        const datos = await authService.verificarToken();
        if (datos) {
          setUsuario(datos.usuario);
          setAutenticado(true);
        } else {
          setAutenticado(false);
          setUsuario(null);
        }
      }
    } catch (error) {
      console.error('Error al verificar autenticación:', error);
      setAutenticado(false);
      setUsuario(null);
    } finally {
      setCargando(false);
    }
  };

  const login = async (email, password) => {
    try {
      const datos = await authService.login(email, password);
      setUsuario(datos.usuario);
      setAutenticado(true);
      return datos;
    } catch (error) {
      // Asegurar que el estado se mantiene como NO autenticado en caso de error
      setUsuario(null);
      setAutenticado(false);
      throw error;
    }
  };

  const logout = () => {
    authService.logout();
    setUsuario(null);
    setAutenticado(false);
  };

  const actualizarPerfil = async () => {
    try {
      const perfil = await authService.obtenerPerfil();
      setUsuario(prev => ({ ...prev, ...perfil }));
    } catch (error) {
      console.error('Error al actualizar perfil:', error);
    }
  };

  const value = {
    usuario,
    autenticado,
    cargando,
    login,
    logout,
    actualizarPerfil,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};

export default AuthContext;
