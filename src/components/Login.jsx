import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setCargando(true);

    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Error al iniciar sesión');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            Cooperativa Eléctrica
          </CardTitle>
          <CardDescription className="text-center">
            Ingresa tus credenciales para acceder
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                Email
              </label>
              <Input
                id="email"
                type="email"
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={cargando}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">
                Contraseña
              </label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={cargando}
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={cargando}
            >
              {cargando ? 'Iniciando sesión...' : 'Iniciar Sesión'}
            </Button>

            {/* Usuarios de Prueba */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <p className="text-xs font-semibold text-gray-700 mb-3 text-center">
                Usuarios de Prueba (contraseña: password123)
              </p>
              
              <div className="space-y-2">
                {/* Cliente */}
                <div className="bg-green-50 border border-green-200 rounded-md p-2">
                  <p className="text-xs font-medium text-green-800 mb-1">CLIENTE</p>
                  <button
                    type="button"
                    onClick={() => {
                      setEmail('mariaelena.gonzalez@hotmail.com');
                      setPassword('password123');
                    }}
                    className="text-xs text-green-700 hover:text-green-900 font-mono break-all text-left w-full"
                  >
                    mariaelena.gonzalez@hotmail.com
                  </button>
                </div>

                {/* Operario */}
                <div className="bg-blue-50 border border-blue-200 rounded-md p-2">
                  <p className="text-xs font-medium text-blue-800 mb-1">OPERARIO</p>
                  <button
                    type="button"
                    onClick={() => {
                      setEmail('pedro.electricista@cooperativa-ugarte.com.ar');
                      setPassword('password123');
                    }}
                    className="text-xs text-blue-700 hover:text-blue-900 font-mono break-all text-left w-full"
                  >
                    pedro.electricista@cooperativa-ugarte.com.ar
                  </button>
                </div>

                {/* Administrador */}
                <div className="bg-purple-50 border border-purple-200 rounded-md p-2">
                  <p className="text-xs font-medium text-purple-800 mb-1">ADMINISTRADOR</p>
                  <button
                    type="button"
                    onClick={() => {
                      setEmail('monica.administradora@cooperativa-ugarte.com.ar');
                      setPassword('password123');
                    }}
                    className="text-xs text-purple-700 hover:text-purple-900 font-mono break-all text-left w-full"
                  >
                    monica.administradora@cooperativa-ugarte.com.ar
                  </button>
                </div>
              </div>

              <p className="text-xs text-gray-500 mt-2 text-center">
                Click en el email para autocompletar
              </p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
