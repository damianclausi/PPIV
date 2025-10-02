import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { CheckCircle, ArrowLeft } from 'lucide-react';
import { Skeleton } from '../ui/skeleton';

export default function ReclamoDetalle() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [cargando, setCargando] = useState(false);
  const [estado, setEstado] = useState('');
  const [notas, setNotas] = useState('');

  // TODO: Integrar con API real
  const reclamo = {
    id: id,
    titulo: 'Corte de luz intermitente',
    descripcion: 'Se corta la luz cada 2 horas aproximadamente desde hace 3 días',
    tipo: 'Técnico',
    estado: 'en_proceso',
    prioridad: 'alta',
    fecha: '2024-12-01',
    zona: 'Zona Norte',
    cliente: {
      nombre: 'Juan Pérez',
      dni: '12345678',
      direccion: 'San Martín 123',
      telefono: '+54 9 11 1234-5678'
    }
  };

  const getPriorityBadge = (prioridad) => {
    const badges = {
      alta: <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Alta</Badge>,
      media: <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Media</Badge>,
      baja: <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Baja</Badge>
    };
    return badges[prioridad] || badges.media;
  };

  const getStatusBadge = (estado) => {
    const badges = {
      pendiente: <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Pendiente</Badge>,
      en_proceso: <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">En Proceso</Badge>,
      resuelto: <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Resuelto</Badge>
    };
    return badges[estado] || badges.pendiente;
  };

  const handleGuardar = () => {
    // TODO: Integrar con API real
    console.log('Guardando cambios:', { estado, notas });
    alert('Cambios guardados exitosamente');
  };

  const handleCerrar = () => {
    if (confirm('¿Está seguro que desea cerrar este reclamo?')) {
      // TODO: Integrar con API real
      console.log('Cerrando reclamo:', id);
      alert('Reclamo cerrado exitosamente');
      navigate('/dashboard/operario');
    }
  };

  if (cargando) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-2xl mx-auto space-y-6">
          <Skeleton className="h-12 w-64" />
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Detalle del Reclamo</h1>
          <Button variant="outline" onClick={() => navigate('/dashboard/operario')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
        </div>

        {/* Card Principal */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{reclamo.titulo}</CardTitle>
              <div className="flex gap-2">
                {getStatusBadge(reclamo.estado)}
                {getPriorityBadge(reclamo.prioridad)}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-8">
            {/* Información en Grid */}
            <div className="grid grid-cols-2 gap-8">
              {/* Información del Reclamo */}
              <div>
                <h3 className="font-semibold text-lg mb-4">Información del Reclamo</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tipo:</span>
                    <span className="font-medium">{reclamo.tipo}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Fecha:</span>
                    <span className="font-medium">{reclamo.fecha}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Zona:</span>
                    <span className="font-medium">{reclamo.zona}</span>
                  </div>
                </div>
              </div>

              {/* Información del Cliente */}
              <div>
                <h3 className="font-semibold text-lg mb-4">Datos del Cliente</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Nombre:</span>
                    <span className="font-medium">{reclamo.cliente.nombre}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">DNI:</span>
                    <span className="font-medium">{reclamo.cliente.dni}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Teléfono:</span>
                    <span className="font-medium">{reclamo.cliente.telefono}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Descripción */}
            <div>
              <h3 className="font-semibold text-lg mb-2">Descripción</h3>
              <p className="text-muted-foreground">{reclamo.descripcion}</p>
            </div>

            {/* Dirección */}
            <div>
              <h3 className="font-semibold text-lg mb-2">Dirección</h3>
              <p className="text-muted-foreground">{reclamo.cliente.direccion}</p>
            </div>

            {/* Cambiar Estado */}
            <div>
              <h3 className="font-semibold text-lg mb-4">Cambiar Estado</h3>
              <Select value={estado} onValueChange={setEstado}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pendiente">Pendiente</SelectItem>
                  <SelectItem value="en_proceso">En Proceso</SelectItem>
                  <SelectItem value="resuelto">Resuelto</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Botón Cargar Insumos */}
            <Button
              variant="outline"
              className="w-full"
              onClick={() => navigate(`/dashboard/operario/reclamo/${id}/insumos`)}
            >
              Cargar Insumos
            </Button>

            {/* Notas del Operario */}
            <div className="space-y-2">
              <Label htmlFor="notas">Notas del Operario</Label>
              <Textarea
                id="notas"
                placeholder="Agregue notas sobre el trabajo realizado..."
                rows={4}
                value={notas}
                onChange={(e) => setNotas(e.target.value)}
              />
            </div>

            {/* Fotos del Trabajo */}
            <div className="space-y-2">
              <Label htmlFor="fotos">Fotos del Trabajo</Label>
              <Input id="fotos" type="file" multiple accept="image/*" />
              <p className="text-sm text-muted-foreground">
                Puede cargar múltiples fotos
              </p>
            </div>

            {/* Botones de Acción */}
            <div className="flex gap-4 pt-4">
              <Button className="flex-1" onClick={handleCerrar}>
                <CheckCircle className="h-4 w-4 mr-2" />
                Cerrar Reclamo
              </Button>
              <Button variant="outline" onClick={handleGuardar}>
                Guardar Cambios
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
