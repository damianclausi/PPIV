import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Alert, AlertDescription } from '../ui/alert';
import { ArrowLeft, Send, CheckCircle, AlertCircle } from 'lucide-react';
import clienteService from '../../services/clienteService';
import { useTiposReclamo } from '../../hooks/useTiposReclamo';
import { useDetallesTipoReclamo, agruparDetallesPorTipo } from '../../hooks/useDetallesTipoReclamo';

export default function ReclamoNuevo() {
  const navigate = useNavigate();
  const [enviando, setEnviando] = useState(false);
  const [exito, setExito] = useState(false);
  const [error, setError] = useState(null);
  const [cuentas, setCuentas] = useState([]);
  const [cargandoCuentas, setCargandoCuentas] = useState(true);
  const [formData, setFormData] = useState({
    cuenta_id: '',
    detalle_id: '',
    descripcion: ''
    // prioridad_id se calculará automáticamente según el detalle
  });

  // Cargar tipos principales (TECNICO / ADMINISTRATIVO)
  const { tipos: tiposReclamo, cargando: cargandoTipos, error: errorTipos } = useTiposReclamo();
  
  // Cargar detalles de tipos de reclamo
  const { detalles, cargando: cargandoDetalles, error: errorDetalles } = useDetallesTipoReclamo();
  
  // Agrupar detalles por tipo para mostrar de forma organizada
  const detallesAgrupados = agruparDetallesPorTipo(detalles);

  useEffect(() => {
    cargarCuentas();
  }, []);

  useEffect(() => {
    if (errorTipos) {
      setError('Error al cargar tipos de reclamo: ' + errorTipos);
    }
    if (errorDetalles) {
      setError('Error al cargar detalles de reclamo: ' + errorDetalles);
    }
  }, [errorTipos, errorDetalles]);

  const cargarCuentas = async () => {
    try {
      setCargandoCuentas(true);
      const datos = await clienteService.obtenerCuentas();
      setCuentas(datos || []);
      // Seleccionar la primera cuenta por defecto si existe
      if (datos && datos.length > 0) {
        setFormData(prev => ({ ...prev, cuenta_id: datos[0].cuenta_id.toString() }));
      }
    } catch (err) {
      console.error('Error al cargar cuentas:', err);
      setError('Error al cargar las cuentas');
    } finally {
      setCargandoCuentas(false);
    }
  };

  // Determinar prioridad automáticamente según el detalle de reclamo
  const obtenerPrioridad = (detalleId) => {
    const detalle = parseInt(detalleId);
    // Detalles críticos (Prioridad ALTA = 1):
    // - 1: Falta de Suministro
    // - 3: Daños en Red
    if (detalle === 1 || detalle === 3) {
      return 1; // Alta
    }
    // Detalles importantes (Prioridad MEDIA = 2):
    // - 2: Fluctuaciones de Tensión
    // - 4: Medidor Defectuoso
    // - 8: Calidad del Servicio
    if (detalle === 2 || detalle === 4 || detalle === 8) {
      return 2; // Media
    }
    // Detalles no urgentes (Prioridad BAJA = 3):
    // - 5: Facturación
    // - 6: Conexión Nueva
    // - 7: Reconexión
    return 3; // Baja
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.cuenta_id || !formData.detalle_id || !formData.descripcion) {
      setError('Por favor complete todos los campos obligatorios');
      return;
    }

    setEnviando(true);
    setError(null);

    try {
      // Determinar prioridad automáticamente según el detalle
      const prioridadAutomatica = obtenerPrioridad(formData.detalle_id);
      
      // Preparar datos en el formato que espera el backend
      const datosReclamo = {
        cuenta_id: parseInt(formData.cuenta_id),
        detalle_id: parseInt(formData.detalle_id),
        descripcion: formData.descripcion,
        prioridad_id: prioridadAutomatica
      };

      await clienteService.crearReclamo(datosReclamo);
      setExito(true);
      
      // Redirigir después de 2 segundos
      setTimeout(() => {
        navigate('/dashboard/reclamos');
      }, 2000);
    } catch (err) {
      setError(err.message || 'Error al enviar el reclamo');
    } finally {
      setEnviando(false);
    }
  };

  if (exito) {
    return (
      <div className="min-h-screen bg-gray-50 p-8 flex items-center justify-center">
        <Card className="max-w-md w-full border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <div className="bg-green-100 p-4 rounded-full">
                  <CheckCircle className="h-12 w-12 text-green-600" />
                </div>
              </div>
              <h2 className="text-2xl font-bold text-green-900">¡Reclamo Enviado!</h2>
              <p className="text-green-700">
                Su reclamo ha sido registrado exitosamente. En breve un técnico se pondrá en contacto con usted.
              </p>
              <Button
                className="w-full bg-green-600 hover:bg-green-700"
                onClick={() => navigate('/dashboard/reclamos')}
              >
                Ver Mis Reclamos
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => navigate('/dashboard/reclamos')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Nuevo Reclamo</h1>
            <p className="text-sm text-gray-600 mt-1">
              Complete el formulario para registrar su reclamo
            </p>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Formulario */}
        <Card>
          <CardHeader>
            <CardTitle>Información del Reclamo</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Cuenta */}
              {cuentas.length > 1 && (
                <div className="space-y-2">
                  <Label htmlFor="cuenta_id">
                    Cuenta <span className="text-red-500">*</span>
                  </Label>
                  <Select 
                    value={formData.cuenta_id}
                    onValueChange={(value) => setFormData({ ...formData, cuenta_id: value })}
                    disabled={cargandoCuentas}
                    required
                  >
                    <SelectTrigger id="cuenta_id">
                      <SelectValue placeholder="Seleccione la cuenta" />
                    </SelectTrigger>
                    <SelectContent>
                      {cuentas.map(cuenta => (
                        <SelectItem key={cuenta.cuenta_id} value={cuenta.cuenta_id.toString()}>
                          Cuenta {cuenta.numero_cuenta} - {cuenta.direccion}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Tipo de Reclamo (con jerarquía) */}
              <div className="space-y-2">
                <Label htmlFor="detalle_id">
                  Tipo de Reclamo <span className="text-red-500">*</span>
                </Label>
                <Select 
                  value={formData.detalle_id}
                  onValueChange={(value) => setFormData({ ...formData, detalle_id: value })}
                  disabled={cargandoDetalles}
                  required
                >
                  <SelectTrigger id="detalle_id">
                    <SelectValue placeholder={
                      cargandoDetalles 
                        ? "Cargando tipos..." 
                        : "Seleccione el tipo de reclamo"
                    } />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(detallesAgrupados).map(([tipo, detallesDelTipo]) => (
                      <div key={tipo}>
                        <div className="px-2 py-1.5 text-sm font-semibold text-gray-500">
                          {tipo}
                        </div>
                        {detallesDelTipo.map(detalle => (
                          <SelectItem 
                            key={detalle.detalle_id} 
                            value={detalle.detalle_id.toString()}
                            className="pl-6"
                          >
                            {detalle.nombre}
                          </SelectItem>
                        ))}
                      </div>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Descripción */}
              <div className="space-y-2">
                <Label htmlFor="descripcion">
                  Descripción Detallada <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="descripcion"
                  placeholder="Describa detalladamente el problema que está experimentando..."
                  rows={5}
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  required
                />
                <p className="text-xs text-gray-500">
                  Incluya todos los detalles relevantes para ayudarnos a resolver su reclamo
                </p>
              </div>

              {/* Información sobre prioridad automática */}
              <Alert className="bg-blue-50 border-blue-200">
                <AlertCircle className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-800 text-sm">
                  <strong>Prioridad automática:</strong> La prioridad del reclamo se asigna automáticamente según el tipo seleccionado.
                  Los problemas de suministro y daños en red se consideran de alta prioridad.
                </AlertDescription>
              </Alert>

              {/* Botones */}
              <div className="flex gap-4 pt-4">
                <Button 
                  type="submit" 
                  className="flex-1"
                  disabled={enviando}
                >
                  {enviando ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Enviar Reclamo
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/dashboard/reclamos')}
                  disabled={enviando}
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
