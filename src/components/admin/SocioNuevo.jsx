/**
 * Componente para crear un nuevo socio
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, User, CreditCard, Plus, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import administradorService from '../../services/administradorService';
import CooperativaLayout from '../layout/CooperativaLayout';

export default function SocioNuevo() {
  const navigate = useNavigate();
  const [guardando, setGuardando] = useState(false);
  const [paso, setPaso] = useState(1); // 1: datos socio, 2: agregar cuentas
  const [socioCreado, setSocioCreado] = useState(null);
  const [servicios, setServicios] = useState([]);
  const [cuentas, setCuentas] = useState([]);
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    dni: '',
    email: '',
    telefono: '',
    activo: true
  });
  const [nuevaCuenta, setNuevaCuenta] = useState({
    direccion: '',
    servicio_id: '',
    principal: false,
    activa: true
  });

  useEffect(() => {
    if (paso === 2) {
      cargarServicios();
    }
  }, [paso]);

  const cargarServicios = async () => {
    try {
      const response = await administradorService.listarServicios();
      if (response.exito && response.datos) {
        setServicios(response.datos);
      }
    } catch (error) {
      console.error('Error al cargar servicios:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validaciones básicas
    if (!formData.nombre.trim() || !formData.apellido.trim() || !formData.dni.trim() || !formData.email.trim()) {
      alert('Por favor complete los campos obligatorios (nombre, apellido, DNI, email)');
      return;
    }

    // Validar DNI
    if (!/^[0-9]{7,8}$/.test(formData.dni)) {
      alert('El DNI debe tener 7 u 8 dígitos');
      return;
    }

    // Validar email
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      alert('El email no es válido');
      return;
    }

    try {
      setGuardando(true);
      
      const response = await administradorService.crearSocio(formData);
      
      console.log('Socio creado:', response);
      
      if (response.exito && response.datos) {
        setSocioCreado(response.datos);
        setPaso(2); // Pasar al paso de agregar cuentas
      }
    } catch (error) {
      console.error('Error al crear socio:', error);
      const errorMsg = error.response?.data?.error || error.message || 'Error desconocido';
      alert('Error al crear el socio: ' + errorMsg);
    } finally {
      setGuardando(false);
    }
  };

  const handleAgregarCuenta = async (e) => {
    e.preventDefault();

    if (!nuevaCuenta.direccion || !nuevaCuenta.servicio_id) {
      alert('Por favor complete todos los campos requeridos');
      return;
    }

    try {
      const datosCuenta = {
        ...nuevaCuenta,
        socio_id: socioCreado.socio_id
      };

      await administradorService.crearCuenta(datosCuenta);
      
      // Agregar a la lista local
      setCuentas([...cuentas, { ...nuevaCuenta, numero: cuentas.length + 1 }]);
      
      // Resetear formulario
      setNuevaCuenta({
        direccion: '',
        servicio_id: '',
        principal: false,
        activa: true
      });

      alert('Cuenta agregada exitosamente');
    } catch (error) {
      console.error('Error al crear cuenta:', error);
      alert('Error al agregar la cuenta: ' + (error.message || 'Error desconocido'));
    }
  };

  const handleFinalizarYVolver = () => {
    navigate('/dashboard/admin/socios');
  };

  return (
    <CooperativaLayout titulo="Nuevo Socio">
      <div className="min-h-screen">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {paso === 1 ? 'Nuevo Socio' : 'Agregar Cuentas al Socio'}
              </h1>
              <p className="text-gray-600 mt-1">
                {paso === 1 
                  ? 'Paso 1: Crear un nuevo socio en el sistema' 
                  : 'Paso 2: Agregar cuentas al socio creado (opcional)'}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/dashboard/admin/socios')}
            >
              Volver
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {paso === 1 ? (
          // PASO 1: Crear Socio
          <form onSubmit={handleSubmit}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5 text-blue-600" />
                  Información del Socio
                </CardTitle>
              </CardHeader>
            <CardContent className="space-y-6">
              {/* Nombre y Apellido */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="nombre"
                    value={formData.nombre}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Juan"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Apellido <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="apellido"
                    value={formData.apellido}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Pérez"
                  />
                </div>
              </div>

              {/* DNI */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  DNI <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="dni"
                  value={formData.dni}
                  onChange={handleChange}
                  required
                  pattern="[0-9]{7,8}"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="12345678"
                />
                <p className="mt-1 text-sm text-gray-500">7 u 8 dígitos sin puntos</p>
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="juan.perez@email.com"
                />
              </div>

              {/* Teléfono */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Teléfono
                </label>
                <input
                  type="tel"
                  name="telefono"
                  value={formData.telefono}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="3804-123456"
                />
              </div>

              {/* Estado Activo */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="activo"
                  name="activo"
                  checked={formData.activo}
                  onChange={handleChange}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="activo" className="text-sm font-medium text-gray-700">
                  Socio activo
                </label>
              </div>

              {/* Botones */}
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => navigate('/dashboard/admin/socios')}
                  disabled={guardando}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={guardando}
                >
                  {guardando ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Guardando...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Crear Socio
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
        ) : (
          // PASO 2: Agregar Cuentas
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5 text-green-600" />
                  Socio Creado: {socioCreado?.nombre} {socioCreado?.apellido}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-sm text-green-800">
                    ✅ El socio fue creado exitosamente. Ahora puedes agregar cuentas asociadas.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Formulario para agregar cuentas */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-blue-600" />
                  Agregar Cuentas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAgregarCuenta} className="space-y-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                    <p className="text-sm text-blue-800">
                      <strong>Nota:</strong> El número de cuenta y el número de medidor se generarán automáticamente.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="direccion">Dirección *</Label>
                    <Input
                      id="direccion"
                      value={nuevaCuenta.direccion}
                      onChange={(e) => setNuevaCuenta({...nuevaCuenta, direccion: e.target.value})}
                      placeholder="Calle y número"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="servicio">Tipo de Servicio *</Label>
                    <Select
                      value={nuevaCuenta.servicio_id}
                      onValueChange={(value) => setNuevaCuenta({...nuevaCuenta, servicio_id: value})}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar servicio" />
                      </SelectTrigger>
                      <SelectContent>
                        {servicios.map((servicio) => (
                          <SelectItem key={servicio.servicio_id} value={servicio.servicio_id.toString()}>
                            {servicio.nombre}{servicio.descripcion ? ` - ${servicio.descripcion}` : ''}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="principal"
                      checked={nuevaCuenta.principal}
                      onChange={(e) => setNuevaCuenta({...nuevaCuenta, principal: e.target.checked})}
                      className="rounded border-gray-300"
                    />
                    <Label htmlFor="principal" className="cursor-pointer">
                      Marcar como cuenta principal
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="activa"
                      checked={nuevaCuenta.activa}
                      onChange={(e) => setNuevaCuenta({...nuevaCuenta, activa: e.target.checked})}
                      className="rounded border-gray-300"
                    />
                    <Label htmlFor="activa" className="cursor-pointer">
                      Cuenta activa
                    </Label>
                  </div>

                  <Button type="submit" className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Agregar Cuenta
                  </Button>
                </form>

                {/* Lista de cuentas agregadas */}
                {cuentas.length > 0 && (
                  <div className="mt-6 pt-6 border-t">
                    <h3 className="font-semibold mb-3">Cuentas agregadas ({cuentas.length})</h3>
                    <div className="space-y-2">
                      {cuentas.map((cuenta, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <p className="font-medium">{cuenta.direccion}</p>
                            <p className="text-sm text-gray-600">
                              {cuenta.principal && <span className="text-blue-600 font-semibold">Principal • </span>}
                              {cuenta.activa ? 'Activa' : 'Inactiva'}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Botón para finalizar */}
                <div className="mt-6 pt-6 border-t">
                  <Button
                    type="button"
                    onClick={handleFinalizarYVolver}
                    className="w-full"
                    variant="outline"
                  >
                    {cuentas.length > 0 ? 'Finalizar y Volver' : 'Omitir y Volver'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
      </div>
    </CooperativaLayout>
  );
}
