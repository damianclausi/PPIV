import { useState } from 'react';
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

export default function ReclamoNuevo() {
  const navigate = useNavigate();
  const [enviando, setEnviando] = useState(false);
  const [exito, setExito] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    tipo_reclamo: '',
    descripcion: '',
    prioridad: 'MEDIA'
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.tipo_reclamo || !formData.descripcion) {
      setError('Por favor complete todos los campos obligatorios');
      return;
    }

    setEnviando(true);
    setError(null);

    try {
      await clienteService.crearReclamo(formData);
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
              {/* Tipo de Reclamo */}
              <div className="space-y-2">
                <Label htmlFor="tipo_reclamo">
                  Tipo de Reclamo <span className="text-red-500">*</span>
                </Label>
                <Select 
                  value={formData.tipo_reclamo}
                  onValueChange={(value) => setFormData({ ...formData, tipo_reclamo: value })}
                  required
                >
                  <SelectTrigger id="tipo_reclamo">
                    <SelectValue placeholder="Seleccione el tipo de reclamo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FALTA_SUMINISTRO">Falta de Suministro</SelectItem>
                    <SelectItem value="BAJA_TENSION">Baja Tensión</SelectItem>
                    <SelectItem value="MEDIDOR_DEFECTUOSO">Medidor Defectuoso</SelectItem>
                    <SelectItem value="FACTURACION">Facturación</SelectItem>
                    <SelectItem value="CABLES_SUELTOS">Cables Sueltos</SelectItem>
                    <SelectItem value="POSTE_DAÑADO">Poste Dañado</SelectItem>
                    <SelectItem value="OTRO">Otro</SelectItem>
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

              {/* Prioridad */}
              <div className="space-y-2">
                <Label htmlFor="prioridad">Prioridad</Label>
                <Select 
                  value={formData.prioridad}
                  onValueChange={(value) => setFormData({ ...formData, prioridad: value })}
                >
                  <SelectTrigger id="prioridad">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BAJA">Baja - No urgente</SelectItem>
                    <SelectItem value="MEDIA">Media - Atención normal</SelectItem>
                    <SelectItem value="ALTA">Alta - Requiere atención urgente</SelectItem>
                  </SelectContent>
                </Select>
              </div>

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
