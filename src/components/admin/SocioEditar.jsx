/**
 * Componente para editar un socio
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, X, CreditCard, Check, XCircle, Plus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Skeleton } from '../ui/skeleton';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Alert, AlertDescription } from '../ui/alert';
import CooperativaLayout from '../layout/CooperativaLayout';

export default function SocioEditar() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [cuentas, setCuentas] = useState([]);
  const [servicios, setServicios] = useState([]);
  const [mostrarFormNuevaCuenta, setMostrarFormNuevaCuenta] = useState(false);
  const [nuevaCuenta, setNuevaCuenta] = useState({
    direccion: '',
    servicio_id: '',
    principal: false,
    activa: true
  });
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    dni: '',
    email: '',
    telefono: '',
    activo: true
  });

  const cargarSocio = useCallback(async () => {
    try {
      setCargando(true);
      console.log('Cargando socio con ID:', id);
      
      // Importar el servicio
      const { default: administradorService } = await import('../../services/administradorService.js');
      const response = await administradorService.obtenerSocio(id);
      
      if (response.exito && response.datos) {
        const socio = response.datos;
        setFormData({
          nombre: socio.nombre || '',
          apellido: socio.apellido || '',
          dni: socio.dni || '',
          email: socio.email || '',
          telefono: socio.telefono || '',
          activo: socio.activo !== undefined ? socio.activo : true
        });
        
        // Cargar las cuentas del socio
        if (socio.cuentas && socio.cuentas.length > 0) {
          console.log('Cuentas cargadas:', socio.cuentas);
          setCuentas(socio.cuentas);
        } else {
          setCuentas([]);
        }
      }
    } catch (error) {
      console.error('Error al cargar socio:', error);
      alert('Error al cargar los datos del socio');
    } finally {
      setCargando(false);
    }
  }, [id]);

  useEffect(() => {
    cargarSocio();
    cargarServicios();
  }, [cargarSocio]);

  const cargarServicios = async () => {
    try {
      const { default: administradorService } = await import('../../services/administradorService.js');
      const response = await administradorService.listarServicios();
      
      if (response.exito && response.datos) {
        console.log('Servicios cargados:', response.datos);
        setServicios(response.datos);
      }
    } catch (error) {
      console.error('Error al cargar servicios:', error);
    }
  };

  const handleToggleCuentaActiva = (cuentaId, nuevoEstado) => {
    setCuentas(cuentas.map(cuenta => 
      cuenta.cuenta_id === cuentaId 
        ? { ...cuenta, activa: nuevoEstado }
        : cuenta
    ));
  };

  const handleToggleCuentaPrincipal = (cuentaId) => {
    setCuentas(cuentas.map(cuenta => 
      cuenta.cuenta_id === cuentaId 
        ? { ...cuenta, principal: !cuenta.principal }
        : { ...cuenta, principal: false } // Solo una puede ser principal
    ));
  };

  const handleCuentaDireccionChange = (cuentaId, nuevaDireccion) => {
    setCuentas(cuentas.map(cuenta => 
      cuenta.cuenta_id === cuentaId 
        ? { ...cuenta, direccion: nuevaDireccion }
        : cuenta
    ));
  };

  const handleCuentaServicioChange = (cuentaId, nuevoServicioId) => {
    setCuentas(cuentas.map(cuenta => 
      cuenta.cuenta_id === cuentaId 
        ? { ...cuenta, servicio_id: parseInt(nuevoServicioId) }
        : cuenta
    ));
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
    
    try {
      setGuardando(true);
      
      // Importar el servicio
      const { default: administradorService } = await import('../../services/administradorService.js');
      
      // Actualizar datos del socio
      const response = await administradorService.actualizarSocio(id, formData);
      
      if (!response.exito) {
        alert(response.mensaje || 'Error al actualizar el socio');
        return;
      }
      
      alert('Socio actualizado correctamente');
      navigate(`/dashboard/admin/socios/${id}`);
    } catch (error) {
      console.error('Error al actualizar socio:', error);
      alert('Error al actualizar el socio: ' + (error.message || 'Error desconocido'));
    } finally {
      setGuardando(false);
    }
  };

  const handleAgregarCuenta = async () => {
    try {
      if (!nuevaCuenta.direccion || !nuevaCuenta.servicio_id) {
        alert('Por favor completa todos los campos obligatorios');
        return;
      }

      setGuardando(true);
      
      const { default: administradorService } = await import('../../services/administradorService.js');
      
      // Si la nueva cuenta es principal, desactivar la cuenta principal existente
      if (nuevaCuenta.principal) {
        const cuentaPrincipalActual = cuentas.find(c => c.principal === true);
        if (cuentaPrincipalActual) {
          await administradorService.actualizarCuenta(cuentaPrincipalActual.cuenta_id, {
            direccion: cuentaPrincipalActual.direccion,
            servicio_id: cuentaPrincipalActual.servicio_id,
            principal: false,
            activa: cuentaPrincipalActual.activa
          });
        }
      }
      
      const response = await administradorService.crearCuenta({
        socio_id: parseInt(id),
        direccion: nuevaCuenta.direccion,
        servicio_id: parseInt(nuevaCuenta.servicio_id),
        principal: nuevaCuenta.principal,
        activa: nuevaCuenta.activa
      });
      
      if (response.exito) {
        alert('Cuenta agregada correctamente');
        // Recargar datos del socio
        await cargarSocio();
        // Resetear formulario
        setNuevaCuenta({
          direccion: '',
          servicio_id: '',
          principal: false,
          activa: true
        });
        setMostrarFormNuevaCuenta(false);
      } else {
        alert(response.mensaje || 'Error al agregar cuenta');
      }
    } catch (error) {
      console.error('Error al agregar cuenta:', error);
      alert('Error al agregar cuenta: ' + (error.message || 'Error desconocido'));
    } finally {
      setGuardando(false);
    }
  };

  const handleGuardarCuentas = async () => {
    try {
      setGuardando(true);
      
      // Importar el servicio
      const { default: administradorService } = await import('../../services/administradorService.js');

      // Actualizar cada cuenta modificada
      for (const cuenta of cuentas) {
        try {
          await administradorService.actualizarCuenta(cuenta.cuenta_id, {
            direccion: cuenta.direccion,
            servicio_id: cuenta.servicio_id,
            principal: cuenta.principal || false,
            activa: cuenta.activa || false
          });
        } catch (error) {
          console.error(`Error al actualizar cuenta ${cuenta.cuenta_id}:`, error);
          throw error;
        }
      }
      
      alert('Cuentas actualizadas correctamente');
      cargarSocio(); // Recargar datos
    } catch (error) {
      console.error('Error al actualizar cuentas:', error);
      alert('Error al actualizar las cuentas: ' + (error.message || 'Error desconocido'));
    } finally {
      setGuardando(false);
    }
  };

  if (cargando) {
    return (
      <CooperativaLayout titulo="Editar Socio">
        <div className="min-h-screen p-8">
          <div className="max-w-2xl mx-auto space-y-6">
            <Skeleton className="h-12 w-64" />
            <Skeleton className="h-96" />
          </div>
        </div>
      </CooperativaLayout>
    );
  }

  return (
    <CooperativaLayout titulo="Editar Socio">
      <div className="min-h-screen p-8">
        <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Editar Socio</h1>
            <p className="text-gray-600 mt-1">Socio #{id}</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/dashboard/admin/socios/${id}`)}
          >
            Volver
          </Button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle>Información del Socio</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Nombre y Apellido */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre *
                  </label>
                  <input
                    type="text"
                    name="nombre"
                    value={formData.nombre}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Apellido *
                  </label>
                  <input
                    type="text"
                    name="apellido"
                    value={formData.apellido}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* DNI */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  DNI *
                </label>
                <input
                  type="text"
                  name="dni"
                  value={formData.dni}
                  onChange={handleChange}
                  required
                  pattern="[0-9]{7,8}"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Estado Activo */}
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="activo"
                  name="activo"
                  checked={formData.activo}
                  onChange={handleChange}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="activo" className="text-sm font-medium text-gray-700">
                  Socio Activo
                </label>
              </div>

              {/* Botones */}
              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => navigate(`/dashboard/admin/socios`)}
                  disabled={guardando}
                >
                  <X className="h-4 w-4 mr-2" />
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
                      Guardar Cambios
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>

        {/* Cuentas Asociadas */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-blue-600" />
                Cuentas Asociadas
              </CardTitle>
              <Button
                type="button"
                onClick={() => setMostrarFormNuevaCuenta(!mostrarFormNuevaCuenta)}
                variant="outline"
                size="sm"
              >
                <Plus className="h-4 w-4 mr-2" />
                Agregar Cuenta
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {/* Formulario para agregar nueva cuenta */}
            {mostrarFormNuevaCuenta && (
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg space-y-4">
                <h3 className="font-semibold text-gray-900 mb-3">Nueva Cuenta</h3>
                
                <Alert>
                  <AlertDescription>
                    El número de cuenta y el número de medidor se generarán automáticamente.
                  </AlertDescription>
                </Alert>

                <div>
                  <Label htmlFor="nueva-direccion">Dirección *</Label>
                  <Input
                    id="nueva-direccion"
                    value={nuevaCuenta.direccion}
                    onChange={(e) => setNuevaCuenta({ ...nuevaCuenta, direccion: e.target.value })}
                    className="mt-1 !bg-white"
                  />
                </div>

                <div>
                  <Label htmlFor="nueva-servicio">Tipo de Servicio *</Label>
                  <Select
                    value={nuevaCuenta.servicio_id?.toString()}
                    onValueChange={(value) => setNuevaCuenta({ ...nuevaCuenta, servicio_id: value })}
                  >
                    <SelectTrigger id="nueva-servicio" className="mt-1">
                      <SelectValue placeholder="Seleccionar servicio" />
                    </SelectTrigger>
                    <SelectContent>
                      {servicios.map((servicio) => (
                        <SelectItem key={servicio.servicio_id} value={servicio.servicio_id.toString()}>
                          {servicio.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="nueva-principal"
                      checked={nuevaCuenta.principal}
                      onChange={(e) => setNuevaCuenta({ ...nuevaCuenta, principal: e.target.checked })}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="nueva-principal" className="text-sm font-medium text-gray-700">
                      Cuenta Principal
                    </label>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="nueva-activa"
                      checked={nuevaCuenta.activa}
                      onChange={(e) => setNuevaCuenta({ ...nuevaCuenta, activa: e.target.checked })}
                      className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                    />
                    <label htmlFor="nueva-activa" className="text-sm font-medium text-gray-700">
                      Cuenta Activa
                    </label>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setMostrarFormNuevaCuenta(false);
                      setNuevaCuenta({
                        direccion: '',
                        servicio_id: '',
                        principal: false,
                        activa: true
                      });
                    }}
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="button"
                    onClick={handleAgregarCuenta}
                    disabled={guardando}
                    className="flex-1"
                  >
                    {guardando ? 'Agregando...' : 'Agregar Cuenta'}
                  </Button>
                </div>
              </div>
            )}

            {/* Lista de cuentas existentes */}
            {cuentas.length > 0 && (
              <div className="space-y-4">
                {cuentas.map((cuenta) => (
                  <div
                    key={cuenta.cuenta_id}
                    className="border border-gray-200 rounded-lg p-4 space-y-3"
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <h3 className="font-semibold text-lg">Cuenta #{cuenta.numero_cuenta}</h3>
                      {cuenta.principal && (
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                          Principal
                        </span>
                      )}
                    </div>

                    {/* Dirección */}
                    <div>
                      <Label htmlFor={`direccion-${cuenta.cuenta_id}`}>Dirección</Label>
                      <Input
                        id={`direccion-${cuenta.cuenta_id}`}
                        value={cuenta.direccion}
                        onChange={(e) => handleCuentaDireccionChange(cuenta.cuenta_id, e.target.value)}
                        className="mt-1"
                      />
                    </div>

                    {/* Servicio */}
                    <div>
                      <Label htmlFor={`servicio-${cuenta.cuenta_id}`}>Tipo de Servicio</Label>
                      <Select
                        value={cuenta.servicio_id?.toString()}
                        onValueChange={(value) => handleCuentaServicioChange(cuenta.cuenta_id, value)}
                      >
                        <SelectTrigger id={`servicio-${cuenta.cuenta_id}`} className="mt-1">
                          <SelectValue placeholder="Seleccionar servicio" />
                        </SelectTrigger>
                        <SelectContent>
                          {servicios.map((servicio) => (
                            <SelectItem key={servicio.servicio_id} value={servicio.servicio_id.toString()}>
                              {servicio.nombre}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center gap-4 pt-3 border-t">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id={`principal-${cuenta.cuenta_id}`}
                          checked={cuenta.principal || false}
                          onChange={() => handleToggleCuentaPrincipal(cuenta.cuenta_id)}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <label 
                          htmlFor={`principal-${cuenta.cuenta_id}`}
                          className="text-sm font-medium text-gray-700 cursor-pointer"
                        >
                          Cuenta Principal
                        </label>
                      </div>

                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id={`activa-${cuenta.cuenta_id}`}
                          checked={cuenta.activa || false}
                          onChange={(e) => handleToggleCuentaActiva(cuenta.cuenta_id, e.target.checked)}
                          className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                        />
                        <label 
                          htmlFor={`activa-${cuenta.cuenta_id}`}
                          className="text-sm font-medium text-gray-700 cursor-pointer"
                        >
                          Cuenta Activa
                        </label>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
              
            {/* Botones para guardar o cancelar cambios de cuentas */}
            {cuentas.length > 0 && (
              <div className="mt-6 pt-4 border-t">
                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate('/dashboard/admin/socios')}
                    disabled={guardando}
                    className="flex-1"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancelar Cambios
                  </Button>
                  <Button
                    type="button"
                    onClick={handleGuardarCuentas}
                    disabled={guardando}
                    className="flex-1"
                  >
                    {guardando ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Guardando...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Guardar Cambios
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        </div>
      </div>
    </CooperativaLayout>
  );
}
