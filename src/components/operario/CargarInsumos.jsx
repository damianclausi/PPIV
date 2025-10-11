import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Alert, AlertDescription } from '../ui/alert';
import { ArrowLeft, Plus, X, Loader2, AlertCircle, Upload } from 'lucide-react';
import { useMateriales } from '../../hooks/useMateriales';

export default function CargarInsumos() {
  const { id } = useParams(); // Este es el reclamoId
  const navigate = useNavigate();
  const location = useLocation();
  const { 
    materiales, 
    materialesUsados,
    loading, 
    error,
    listarMateriales, 
    registrarMateriales,
    obtenerMaterialesReclamo 
  } = useMateriales();
  
  const [materialSeleccionado, setMaterialSeleccionado] = useState('');
  const [cantidad, setCantidad] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [observacionesItem, setObservacionesItem] = useState('');
  const [imagenes, setImagenes] = useState([]);
  const [materialesAgregados, setMaterialesAgregados] = useState([]);
  const [otId, setOtId] = useState(location.state?.otId || null);
  const [guardando, setGuardando] = useState(false);

  // Cargar materiales disponibles y materiales ya usados al montar el componente
  useEffect(() => {
    console.log('CargarInsumos - useEffect ejecutado', { id, otId: location.state?.otId });
    
    // Cargar lista de materiales
    const cargarDatos = async () => {
      await listarMateriales();
      await obtenerMaterialesReclamo(id);
    };
    
    cargarDatos();
    
    // Si tenemos otId en el estado de navegación, lo usamos
    if (location.state?.otId && !otId) {
      console.log('Setting otId:', location.state.otId);
      setOtId(location.state.otId);
    }
  }, [id]); // Solo depender de id, no de location.state

  const handleAgregar = () => {
    if (!materialSeleccionado || !cantidad) {
      alert('Por favor complete los campos requeridos');
      return;
    }

    const material = materiales.find(m => m.material_id === parseInt(materialSeleccionado));
    if (!material) return;

    const nuevoMaterial = {
      id: Date.now(), // ID temporal para el frontend
      material_id: material.material_id,
      nombre: material.nombre,
      unidad_medida: material.unidad_medida,
      cantidad: parseFloat(cantidad),
      observaciones: observacionesItem,
      imagenes: imagenes
    };

    setMaterialesAgregados([...materialesAgregados, nuevoMaterial]);
    setMaterialSeleccionado('');
    setCantidad('');
    setObservacionesItem('');
    setImagenes([]);
  };

  const handleEliminar = (id) => {
    setMaterialesAgregados(materialesAgregados.filter(m => m.id !== id));
  };

  const handleConfirmar = async () => {
    if (!otId) {
      alert('No se pudo identificar la orden de trabajo. Por favor intente desde la vista de OT.');
      return;
    }

    if (materialesAgregados.length === 0) {
      alert('Debe agregar al menos un material');
      return;
    }

    setGuardando(true);
    
    // Formatear materiales para el backend
    const materialesParaBackend = materialesAgregados.map(m => ({
      material_id: m.material_id,
      cantidad: m.cantidad,
      observaciones: m.observaciones || observaciones || null,
      imagenes: m.imagenes || []
    }));

    const resultado = await registrarMateriales(otId, materialesParaBackend);
    
    setGuardando(false);

    if (resultado.success) {
      alert('Materiales registrados exitosamente');
      navigate(-1); // Volver a la vista anterior
    } else {
      alert(`Error: ${resultado.error}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Cargar Materiales</h1>
            <p className="text-gray-600 mt-1">Registro de materiales utilizados en la orden de trabajo</p>
          </div>
          <Button 
            variant="outline"
            size="sm"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
        </div>

        {/* Alertas */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {!otId && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              No se pudo identificar la orden de trabajo. Este formulario debe abrirse desde una OT específica.
            </AlertDescription>
          </Alert>
        )}

        {/* Formulario */}
        <Card>
          <CardHeader>
            <CardTitle>Agregar Materiales</CardTitle>
          </CardHeader>
          <CardContent className="space-y-8">
            {/* Agregar Material */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="material">Material *</Label>
                  <Select value={materialSeleccionado} onValueChange={setMaterialSeleccionado} disabled={loading}>
                    <SelectTrigger id="material">
                      <SelectValue placeholder={loading ? "Cargando materiales..." : "Seleccionar material"} />
                    </SelectTrigger>
                    <SelectContent>
                      {materiales.map((mat) => (
                        <SelectItem key={mat.material_id} value={mat.material_id.toString()}>
                          {mat.nombre} {mat.codigo ? `(${mat.codigo})` : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cantidad">
                    Cantidad * 
                    {materialSeleccionado && materiales.find(m => m.material_id === parseInt(materialSeleccionado))?.unidad_medida && (
                      <span className="text-xs text-muted-foreground ml-1">
                        ({materiales.find(m => m.material_id === parseInt(materialSeleccionado)).unidad_medida})
                      </span>
                    )}
                  </Label>
                  <Input
                    id="cantidad"
                    type="number"
                    step="0.01"
                    placeholder="Ej: 10"
                    value={cantidad}
                    onChange={(e) => setCantidad(e.target.value)}
                  />
                </div>
              </div>
              
              {/* NOTA: Observaciones e imágenes deshabilitados hasta actualizar la tabla uso_material */}
              {/* 
              <div className="space-y-2">
                <Label htmlFor="observacionesItem">Observaciones (opcional)</Label>
                <Textarea
                  id="observacionesItem"
                  placeholder="Detalles sobre el uso de este material..."
                  rows={2}
                  value={observacionesItem}
                  onChange={(e) => setObservacionesItem(e.target.value)}
                />
              </div>
              */}

              {/* Campo para imágenes (deshabilitado - requiere actualizar tabla) */}
              {/*
              <div className="space-y-2">
                <Label htmlFor="imagenes">Imágenes (próximamente)</Label>
                <div className="border-2 border-dashed rounded-lg p-6 text-center text-muted-foreground">
                  <Upload className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Funcionalidad de carga de imágenes en desarrollo</p>
                </div>
              </div>
              */}

              <Button 
                variant="outline" 
                className="w-full" 
                onClick={handleAgregar}
                disabled={!materialSeleccionado || !cantidad || loading}
              >
                <Plus className="h-4 w-4 mr-2" />
                Agregar Material a la Lista
              </Button>
            </div>

            {/* Lista de Materiales Cargados */}
            <div>
              <h3 className="font-semibold text-lg mb-4">
                Materiales para Registrar ({materialesAgregados.length})
              </h3>
              <div className="space-y-2">
                {materialesAgregados.length > 0 ? (
                  materialesAgregados.map((mat) => (
                    <div 
                      key={mat.id}
                      className="flex items-start justify-between p-4 border rounded-lg bg-white hover:bg-gray-50"
                    >
                      <div className="flex-1">
                        <div className="font-medium">{mat.nombre}</div>
                        <div className="text-sm text-muted-foreground">
                          Cantidad: {mat.cantidad} {mat.unidad_medida || ''}
                        </div>
                      </div>
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => handleEliminar(mat.id)}
                        disabled={guardando}
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

            {/* Observaciones generales - Deshabilitado hasta actualizar la tabla */}
            {/*
            <div className="space-y-2">
              <Label htmlFor="observaciones">Observaciones Generales (opcional)</Label>
              <Textarea
                id="observaciones"
                placeholder="Comentarios adicionales sobre los materiales utilizados en esta orden de trabajo..."
                rows={3}
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                disabled={guardando}
              />
            </div>
            */}

            {/* Botones de Acción */}
            <div className="flex gap-4 pt-4">
              <Button 
                className="flex-1"
                onClick={handleConfirmar}
                disabled={materialesAgregados.length === 0 || guardando || !otId}
              >
                {guardando && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {guardando ? 'Guardando...' : 'Confirmar y Registrar'}
              </Button>
              <Button 
                variant="outline"
                onClick={() => navigate(-1)}
                disabled={guardando}
              >
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Sección de materiales ya registrados */}
        {materialesUsados.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Materiales Ya Registrados</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {materialesUsados.map((mat) => (
                  <div 
                    key={mat.uso_material_id}
                    className="p-4 border rounded-lg bg-gray-50"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="font-medium">{mat.material_nombre}</div>
                        <div className="text-sm text-muted-foreground">
                          Cantidad: {mat.cantidad} {mat.unidad_medida || ''}
                        </div>
                        {mat.observaciones && (
                          <div className="text-xs text-gray-600 mt-1">
                            {mat.observaciones}
                          </div>
                        )}
                        <div className="text-xs text-gray-500 mt-2">
                          Registrado por: {mat.empleado_nombre} {mat.empleado_apellido}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
