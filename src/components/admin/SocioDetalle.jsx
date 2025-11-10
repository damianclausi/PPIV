/**
 * Componente para ver el detalle completo de un socio
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, User, Mail, Phone, MapPin, Calendar, Edit, CreditCard, FileText, DollarSign, AlertCircle, CheckCircle, Clock, XCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Skeleton } from '../ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { formatearFecha, formatearMonto } from '../../utils/formatters.js';
import CooperativaLayout from '../layout/CooperativaLayout';

export default function SocioDetalle() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [socio, setSocio] = useState(null);
  const [cuentas, setCuentas] = useState([]);
  const [cuentaSeleccionada, setCuentaSeleccionada] = useState(null);
  const [lecturas, setLecturas] = useState([]);
  const [reclamos, setReclamos] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    cargarSocio();
  }, [id]);

  const obtenerEstadoBadge = (estado) => {
    const estilos = {
      PENDIENTE: 'bg-yellow-100 text-yellow-800',
      PAGADA: 'bg-green-100 text-green-800',
      EN_PROCESO: 'bg-blue-100 text-blue-800',
      RESUELTO: 'bg-green-100 text-green-800',
      CANCELADO: 'bg-gray-100 text-gray-800',
    };
    return estilos[estado] || 'bg-gray-100 text-gray-800';
  };

  const obtenerIconoEstado = (estado) => {
    switch (estado) {
      case 'PAGADA':
      case 'RESUELTO':
        return <CheckCircle className="w-4 h-4" />;
      case 'PENDIENTE':
        return <Clock className="w-4 h-4" />;
      case 'CANCELADO':
        return <XCircle className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  const cargarHistorialCuenta = async (cuentaId) => {
    try {
      const { default: administradorService } = await import('../../services/administradorService.js');
      
      // Cargar historial de consumo (lecturas/facturas)
      try {
        const responseLecturas = await administradorService.obtenerFacturasCuenta(cuentaId);
        setLecturas(responseLecturas.datos || []);
      } catch (error) {
        console.error('Error al cargar lecturas:', error);
        setLecturas([]);
      }
      
      // Cargar reclamos
      try {
        const responseReclamos = await administradorService.obtenerReclamosCuenta(cuentaId);
        setReclamos(responseReclamos.datos || []);
      } catch (error) {
        console.error('Error al cargar reclamos:', error);
        setReclamos([]);
      }
    } catch (error) {
      console.error('Error al cargar historial de cuenta:', error);
    }
  };

  const handleSeleccionarCuenta = (cuenta) => {
    setCuentaSeleccionada(cuenta.cuenta_id);
    cargarHistorialCuenta(cuenta.cuenta_id);
  };

  const cargarSocio = async () => {
    try {
      setCargando(true);
      
      // Importar el servicio dinámicamente
      const { default: administradorService } = await import('../../services/administradorService.js');
      
      // Obtener datos del socio desde la API
      const response = await administradorService.obtenerSocio(id);
      
      if (response.exito && response.datos) {
        setSocio(response.datos);
        
        // Si el backend devuelve cuentas en la respuesta, usarlas
        if (response.datos.cuentas) {
          setCuentas(response.datos.cuentas);
          
          // Cargar lecturas y reclamos de la primera cuenta
          if (response.datos.cuentas.length > 0) {
            const cuentaId = response.datos.cuentas[0].cuenta_id;
            setCuentaSeleccionada(cuentaId);
            await cargarHistorialCuenta(cuentaId);
          }
        } else {
          // Si no, inicializar como array vacío (se pueden cargar después si hay endpoint separado)
          setCuentas([]);
        }
      } else {
        console.error('No se pudo cargar el socio');
        alert('Error al cargar los datos del socio');
      }
    } catch (error) {
      console.error('Error al cargar socio:', error);
      alert('Error al cargar los datos del socio: ' + (error.message || 'Error desconocido'));
    } finally {
      setCargando(false);
    }
  };

  if (cargando) {
    return (
      <CooperativaLayout titulo="Detalle de Socio">
        <div className="min-h-screen p-8">
          <div className="max-w-4xl mx-auto space-y-6">
            <Skeleton className="h-12 w-64" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Skeleton className="h-64" />
              <Skeleton className="h-64" />
            </div>
          </div>
        </div>
      </CooperativaLayout>
    );
  }

  if (!socio) {
    return (
      <CooperativaLayout titulo="Detalle de Socio">
        <div className="min-h-screen p-8">
          <div className="max-w-4xl mx-auto">
            <p className="text-center text-gray-600">Socio no encontrado</p>
          </div>
        </div>
      </CooperativaLayout>
    );
  }

  return (
    <CooperativaLayout titulo="Detalle de Socio">
      <div className="min-h-screen p-8">
        <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {socio.nombre} {socio.apellido}
            </h1>
            <p className="text-gray-600 mt-1">Socio #{socio.socio_id}</p>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={() => navigate(`/dashboard/admin/socios/${id}/editar`)}
            >
              <Edit className="h-4 w-4 mr-2" />
              Editar
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/dashboard/admin/socios')}
            >
              Volver
            </Button>
          </div>
        </div>

        {/* Grid de 2 columnas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Información Personal */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Información Personal
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-600">DNI</label>
                <p className="text-gray-900">{socio.dni}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-600 flex items-center gap-1">
                  <Mail className="h-4 w-4" />
                  Email
                </label>
                <p className="text-gray-900">{socio.email}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-600 flex items-center gap-1">
                  <Phone className="h-4 w-4" />
                  Teléfono
                </label>
                <p className="text-gray-900">{socio.telefono}</p>
              </div>
            </CardContent>
          </Card>

          {/* Estado y Registro */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Estado del Socio
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-600">Estado</label>
                <div className="mt-1">
                  <span className={`px-3 py-1 inline-flex text-sm font-semibold rounded-full ${
                    socio.activo 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {socio.activo ? 'Activo' : 'Inactivo'}
                  </span>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-600">Fecha de Alta</label>
                <p className="text-gray-900">
                  {formatearFecha(socio.fecha_alta)}
                </p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-600">Cuenta Principal</label>
                <p className="text-gray-900">
                  {cuentas.find(c => c.principal)?.numero_cuenta || 'Sin cuenta principal'}
                </p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-600">Dirección Principal</label>
                <p className="text-gray-900">
                  {cuentas.find(c => c.principal)?.direccion || 'Sin dirección'}
                </p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-600">Cuentas Activas</label>
                <p className="text-gray-900">{cuentas.filter(c => c.activa).length}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-600">Total Cuentas</label>
                <p className="text-gray-900">{cuentas.length}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Cuentas del Socio */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Cuentas Asociadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            {cuentas.length > 0 ? (
              <div className="space-y-3">
                {cuentas.map((cuenta) => (
                  <div
                    key={cuenta.cuenta_id}
                    onClick={() => handleSeleccionarCuenta(cuenta)}
                    className={`flex items-center justify-between p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      cuentaSeleccionada === cuenta.cuenta_id
                        ? 'border-blue-500 bg-blue-50 shadow-md'
                        : 'border-gray-200 hover:bg-gray-50 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <span className="font-semibold text-gray-900">
                          Cuenta #{cuenta.numero_cuenta}
                        </span>
                        {cuenta.principal && (
                          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">
                            Principal
                          </span>
                        )}
                        {cuentaSeleccionada === cuenta.cuenta_id && (
                          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                            Seleccionada
                          </span>
                        )}
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          cuenta.activa 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {cuenta.activa ? 'Activa' : 'Inactiva'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        <MapPin className="inline h-3 w-3 mr-1" />
                        {cuenta.direccion}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Deuda</p>
                      <p className={`text-lg font-bold ${
                        (cuenta.deuda || 0) > 0 ? 'text-red-600' : 'text-green-600'
                      }`}>
                        ${(cuenta.deuda || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-500 py-8">
                No hay cuentas asociadas a este socio
              </p>
            )}
          </CardContent>
        </Card>

        {/* Historial: Facturas y Reclamos */}
        <Card>
          <CardHeader>
            <CardTitle>Historial</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="facturas" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="lecturas" className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  Historial de Consumo ({lecturas.length})
                </TabsTrigger>
                <TabsTrigger value="reclamos" className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  Reclamos ({reclamos.length})
                </TabsTrigger>
              </TabsList>

              {/* Tab de Lecturas (Consumo Eléctrico) */}
              <TabsContent value="lecturas" className="mt-4">
                {lecturas.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No hay lecturas registradas</p>
                ) : (
                  <div className="space-y-3">
                    {lecturas.map((lectura) => (
                      <div key={lectura.lectura_id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                        <div className="flex items-center gap-4">
                          <div className="p-2 bg-white rounded-lg">
                            <DollarSign className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-medium">Medidor: {lectura.numero_medidor}</p>
                            <p className="text-sm text-gray-600">
                              Fecha: {formatearFecha(lectura.fecha)}
                            </p>
                            <p className="text-xs text-gray-500">
                              Lectura: {lectura.estado_anterior} → {lectura.estado_actual} kWh
                            </p>
                            {lectura.observaciones && (
                              <p className="text-xs text-gray-500 mt-1">{lectura.observaciones}</p>
                            )}
                            {lectura.ruta && (
                              <p className="text-xs text-gray-400">Ruta: {lectura.ruta}</p>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="mb-2">
                            <p className="text-xs text-gray-500">Consumo</p>
                            <p className="font-bold text-2xl text-blue-600">{lectura.consumo}</p>
                            <p className="text-xs text-gray-500">kWh</p>
                          </div>
                          {lectura.monto_factura && (
                            <div className="pt-2 border-t border-gray-300">
                              <p className="text-xs text-gray-500">Factura</p>
                              <p className="font-bold text-lg text-green-600">{formatearMonto(lectura.monto_factura)}</p>
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded-full ${obtenerEstadoBadge(lectura.estado_factura)}`}>
                                {lectura.estado_factura}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* Tab de Reclamos */}
              <TabsContent value="reclamos" className="mt-4">
                {reclamos.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No hay reclamos registrados</p>
                ) : (
                  <div className="space-y-3">
                    {reclamos.map((reclamo) => (
                      <div 
                        key={reclamo.reclamo_id} 
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                        onClick={() => navigate(`/dashboard/admin/reclamos/${reclamo.reclamo_id}`)}
                      >
                        <div className="flex items-center gap-4">
                          <div className="p-2 bg-white rounded-lg">
                            <AlertCircle className="w-5 h-5 text-orange-600" />
                          </div>
                          <div>
                            <p className="font-medium">Reclamo #{reclamo.reclamo_id}</p>
                            <p className="text-sm text-gray-600 line-clamp-2 max-w-md">
                              {reclamo.descripcion}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {formatearFecha(reclamo.fecha_alta)}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full ${obtenerEstadoBadge(reclamo.estado)}`}>
                            {obtenerIconoEstado(reclamo.estado)}
                            {reclamo.estado}
                          </span>
                          {reclamo.prioridad && (
                            <p className="text-xs text-gray-500 mt-1">Prioridad: {reclamo.prioridad}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        </div>
      </div>
    </CooperativaLayout>
  );
}
