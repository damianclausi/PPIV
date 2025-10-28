import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { Zap, Mail, Lock } from 'lucide-react';

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
    <div className="min-h-screen flex items-center justify-center bg-cooperativa-gradient px-4 py-8">
      {/* Logo y Título Superior */}
      <div className="absolute top-8 left-0 right-0 text-center">
        <div className="flex justify-center mb-4">
          <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4 shadow-xl">
            <Zap className="h-16 w-16 text-white" />
          </div>
        </div>
        <h1 className="text-4xl font-bold text-white mb-2">
          Cooperativa Eléctrica
        </h1>
        <p className="text-xl text-white/90">
          Gobernador Ugarte
        </p>
      </div>

      {/* Card de Login */}
      <Card className="w-full max-w-md shadow-2xl border-0 mt-32">
        <CardHeader className="space-y-1 bg-gradient-to-r from-cooperativa-dark to-cooperativa-blue text-white rounded-t-lg">
          <CardTitle className="text-2xl font-bold text-center">
            Iniciar Sesión
          </CardTitle>
          <CardDescription className="text-center text-white/90">
            Ingresa tus credenciales para acceder al sistema
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive" className="border-red-400">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-cooperativa-dark flex items-center gap-2">
                <Mail className="h-4 w-4" />
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
                className="border-cooperativa-blue/30 focus:border-cooperativa-blue focus:ring-cooperativa-blue"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium text-cooperativa-dark flex items-center gap-2">
                <Lock className="h-4 w-4" />
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
                className="border-cooperativa-blue/30 focus:border-cooperativa-blue focus:ring-cooperativa-blue"
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-cooperativa-blue hover:bg-cooperativa-light text-white font-semibold py-2.5 shadow-lg transition-all duration-200"
              disabled={cargando}
            >
              {cargando ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Iniciando sesión...
                </span>
              ) : (
                'Iniciar Sesión'
              )}
            </Button>

            {/* Usuarios de Prueba */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <p className="text-xs font-semibold text-cooperativa-dark mb-3 text-center">
                Usuarios de Prueba (contraseña: password123)
              </p>
              
              <div className="space-y-2">
                {/* Cliente */}
                <div className="bg-cooperativa-teal/10 border border-cooperativa-teal/30 rounded-lg p-3 hover:shadow-md transition-shadow">
                  <p className="text-xs font-bold text-cooperativa-teal mb-1.5">👤 CLIENTE</p>
                  <button
                    type="button"
                    onClick={() => {
                      setEmail('mariaelena.gonzalez@hotmail.com');
                      setPassword('password123');
                    }}
                    className="text-xs text-cooperativa-dark hover:text-cooperativa-blue font-mono break-all text-left w-full transition-colors"
                  >
                    mariaelena.gonzalez@hotmail.com
                  </button>
                </div>

                {/* Operario */}
                <div className="bg-cooperativa-blue/10 border border-cooperativa-blue/30 rounded-lg p-3 hover:shadow-md transition-shadow">
                  <p className="text-xs font-bold text-cooperativa-blue mb-1.5">🔧 OPERARIO</p>
                  <button
                    type="button"
                    onClick={() => {
                      setEmail('pedro.electricista@cooperativa-ugarte.com.ar');
                      setPassword('password123');
                    }}
                    className="text-xs text-cooperativa-dark hover:text-cooperativa-blue font-mono break-all text-left w-full transition-colors"
                  >
                    pedro.electricista@cooperativa-ugarte.com.ar
                  </button>
                </div>

                {/* Administrador */}
                <div className="bg-cooperativa-cyan/10 border border-cooperativa-cyan/30 rounded-lg p-3 hover:shadow-md transition-shadow">
                  <p className="text-xs font-bold text-cooperativa-cyan mb-1.5">⚡ ADMINISTRADOR</p>
                  <button
                    type="button"
                    onClick={() => {
                      setEmail('monica.administradora@cooperativa-ugarte.com.ar');
                      setPassword('password123');
                    }}
                    className="text-xs text-cooperativa-dark hover:text-cooperativa-cyan font-mono break-all text-left w-full transition-colors"
                  >
                    monica.administradora@cooperativa-ugarte.com.ar
                  </button>
                </div>
              </div>

              <p className="text-xs text-gray-500 mt-3 text-center">
                💡 Click en el email para autocompletar
              </p>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Footer */}
      <div className="absolute bottom-4 left-0 right-0 text-center">
        <p className="text-white/80 text-sm">
          © 2025 Cooperativa Eléctrica Gobernador Ugarte
        </p>
      </div>
    </div>
  );
}
