import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

export default function ReclamoNuevo() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    tipo: '',
    titulo: '',
    descripcion: '',
    archivo: null
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    // TODO: Integrar con API real
    console.log('Enviando reclamo:', formData);
    alert('Reclamo enviado exitosamente');
    navigate('/dashboard/reclamos');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Nuevo Reclamo</h1>
                    <Button variant="outline" onClick={() => navigate('/dashboard/reclamos')}>
            <ArrowLeft className="h-4 w-4" />
            Volver
          </Button>
        </div>

        {/* Formulario */}
        <Card>
          <CardContent className="space-y-8 pt-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Tipo de Reclamo */}
              <div className="space-y-2">
                <Label htmlFor="tipo">Tipo de Reclamo</Label>
                <Select 
                  value={formData.tipo}
                  onValueChange={(value) => setFormData({ ...formData, tipo: value })}
                >
                  <SelectTrigger id="tipo">
                    <SelectValue placeholder="Seleccione el tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tecnico">Técnico</SelectItem>
                    <SelectItem value="medicion">Medición</SelectItem>
                    <SelectItem value="comercial">Comercial</SelectItem>
                    <SelectItem value="administrativo">Administrativo</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Título */}
              <div className="space-y-2">
                <Label htmlFor="titulo">Título</Label>
                <Input
                  id="titulo"
                  placeholder="Resuma su reclamo en pocas palabras"
                  value={formData.titulo}
                  onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                  required
                />
              </div>

              {/* Descripción */}
              <div className="space-y-2">
                <Label htmlFor="descripcion">Descripción</Label>
                <Textarea
                  id="descripcion"
                  placeholder="Describa detalladamente su reclamo..."
                  rows={5}
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  required
                />
              </div>

              {/* Adjuntar Archivo */}
              <div className="space-y-2">
                <Label htmlFor="archivo">Adjuntar Archivo (opcional)</Label>
                <Input
                  id="archivo"
                  type="file"
                  accept=".jpg,.jpeg,.png,.pdf"
                  onChange={(e) => setFormData({ ...formData, archivo: e.target.files[0] })}
                />
                <p className="text-sm text-muted-foreground">
                  Formatos permitidos: JPG, PNG, PDF (máx. 5MB)
                </p>
              </div>

              {/* Botones */}
              <div className="flex gap-4 pt-4">
                <Button type="submit" className="flex-1">
                  Enviar Reclamo
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/dashboard/reclamos')}
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
