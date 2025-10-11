/**
 * Componente para ver el detalle completo de un socio
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, User, Mail, Phone, MapPin, Calendar, Edit, CreditCard, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Skeleton } from '../ui/skeleton';
import { formatearFecha } from '../../utils/formatters.js';

export default function SocioDetalle() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [socio, setSocio] = useState(null);
  const [cuentas, setCuentas] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    cargarSocio();
  }, [id]);

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
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <Skeleton className="h-12 w-64" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Skeleton className="h-64" />
            <Skeleton className="h-64" />
          </div>
        </div>
      </div>
    );
  }

  if (!socio) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <p className="text-center text-gray-600">Socio no encontrado</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
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
              
              <div>
                <label className="text-sm font-medium text-gray-600 flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  Dirección
                </label>
                <p className="text-gray-900">{socio.direccion}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-600 flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  Fecha de Nacimiento
                </label>
                <p className="text-gray-900">
                  {formatearFecha(socio.fecha_nacimiento)}
                </p>
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
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <span className="font-semibold text-gray-900">
                          Cuenta #{cuenta.numero_cuenta}
                        </span>
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


      </div>
    </div>
  );
}
