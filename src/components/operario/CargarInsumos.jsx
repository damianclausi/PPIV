import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { ArrowLeft, Plus, X } from 'lucide-react';

export default function CargarInsumos() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [material, setMaterial] = useState('');
  const [cantidad, setCantidad] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [materialesAgregados, setMaterialesAgregados] = useState([
    { id: 1, nombre: 'Cable 2.5mm', cantidad: '15 metros' },
    { id: 2, nombre: 'Fusible 10A', cantidad: '2 unidades' }
  ]);

  const handleAgregar = () => {
    if (!material || !cantidad) {
      alert('Por favor complete todos los campos');
      return;
    }

    const nuevoMaterial = {
      id: Date.now(),
      nombre: material,
      cantidad: cantidad
    };

    setMaterialesAgregados([...materialesAgregados, nuevoMaterial]);
    setMaterial('');
    setCantidad('');
  };

  const handleEliminar = (id) => {
    setMaterialesAgregados(materialesAgregados.filter(m => m.id !== id));
  };

  const handleConfirmar = () => {
    // TODO: Integrar con API real
    console.log('Confirmando carga de insumos:', { materialesAgregados, observaciones });
    alert('Insumos cargados exitosamente');
    navigate(`/dashboard/operario/reclamo/${id}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Cargar Insumos</h1>
          <Button 
            variant="outline" 
            onClick={() => navigate(`/dashboard/operario/reclamo/${id}`)}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
        </div>

        {/* Formulario */}
        <Card>
          <CardHeader>
            <CardTitle>Registro de Materiales Utilizados</CardTitle>
          </CardHeader>
          <CardContent className="space-y-8">
            {/* Agregar Material */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="material">Material</Label>
                  <Select value={material} onValueChange={setMaterial}>
                    <SelectTrigger id="material">
                      <SelectValue placeholder="Seleccionar material" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Cable 2.5mm">Cable 2.5mm</SelectItem>
                      <SelectItem value="Cable 4mm">Cable 4mm</SelectItem>
                      <SelectItem value="Fusible 10A">Fusible 10A</SelectItem>
                      <SelectItem value="Fusible 20A">Fusible 20A</SelectItem>
                      <SelectItem value="Contactor">Contactor</SelectItem>
                      <SelectItem value="Morsetería">Morsetería</SelectItem>
                      <SelectItem value="Aisladores">Aisladores</SelectItem>
                      <SelectItem value="Conectores">Conectores</SelectItem>
                      <SelectItem value="Cinta aislante">Cinta aislante</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cantidad">Cantidad</Label>
                  <Input
                    id="cantidad"
                    type="text"
                    placeholder="ej: 10 metros, 5 unidades"
                    value={cantidad}
                    onChange={(e) => setCantidad(e.target.value)}
                  />
                </div>
              </div>
              <Button 
                variant="outline" 
                className="w-full" 
                onClick={handleAgregar}
              >
                <Plus className="h-4 w-4 mr-2" />
                Agregar Material
              </Button>
            </div>

            {/* Lista de Materiales Cargados */}
            <div>
              <h3 className="font-semibold text-lg mb-4">Materiales Cargados</h3>
              <div className="space-y-2">
                {materialesAgregados.length > 0 ? (
                  materialesAgregados.map((mat) => (
                    <div 
                      key={mat.id}
                      className="flex items-center justify-between p-3 border rounded-lg bg-white hover:bg-gray-50"
                    >
                      <span className="text-sm">
                        {mat.nombre} - {mat.cantidad}
                      </span>
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => handleEliminar(mat.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-center text-muted-foreground text-sm border rounded-lg">
                    No hay materiales cargados
                  </div>
                )}
              </div>
            </div>

            {/* Observaciones */}
            <div className="space-y-2">
              <Label htmlFor="observaciones">Observaciones</Label>
              <Textarea
                id="observaciones"
                placeholder="Detalles adicionales sobre los materiales utilizados..."
                rows={3}
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
              />
            </div>

            {/* Botones de Acción */}
            <div className="flex gap-4 pt-4">
              <Button 
                className="flex-1"
                onClick={handleConfirmar}
                disabled={materialesAgregados.length === 0}
              >
                Confirmar Carga
              </Button>
              <Button 
                variant="outline"
                onClick={() => navigate(`/dashboard/operario/reclamo/${id}`)}
              >
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
