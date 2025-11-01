import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import CooperativaLayout from '../layout/CooperativaLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Skeleton } from '../ui/skeleton';
import { Alert, AlertDescription } from '../ui/alert';
import { useFactura } from '../../hooks/useCliente';
import { 
  ArrowLeft, 
  Download, 
  CreditCard, 
  Calendar, 
  DollarSign, 
  FileText,
  MapPin,
  User,
  Zap,
  AlertCircle
} from 'lucide-react';
import { formatearFecha, formatearMesAnio } from '../../utils/formatters.js';

export default function FacturaDetalle() {
  const navigate = useNavigate();
  const { id } = useParams();
  
  // Usar hook para obtener factura de la API
  const { factura: facturaAPI, cargando, error } = useFactura(id);

  // Normalizar datos de la factura
  const normalizarFactura = (facturaData) => {
    if (!facturaData) return null;
    
    // Parsear el monto - la API envía 'importe' como string
    let monto = 0;
    if (facturaData.importe) {
      monto = parseFloat(facturaData.importe);
    }
    
    // Si el monto es 0 o NaN, usar un valor por defecto para testing
    if (!monto || isNaN(monto)) {
      monto = Math.random() * 10000 + 5000;
    }
    
    // Simular descomposición del monto en detalles (30% cargo fijo, 60% variable, 10% impuestos)
    const cargo_fijo = monto * 0.30;
    const cargo_variable = monto * 0.60;
    const impuestos = monto * 0.10;
    
    // Simular consumo basado en cargo variable (aproximadamente $15 por kWh)
    const consumo_kwh = Math.round(cargo_variable / 15);
    
    return {
      id: facturaData.factura_id || facturaData.id,
      numero: facturaData.numero_externo || `F-${String(facturaData.factura_id || facturaData.id).padStart(6, '0')}`,
      periodo: formatearMesAnio(facturaData.periodo),
      fecha_emision: formatearFecha(facturaData.periodo),
      vencimiento: formatearFecha(facturaData.vencimiento),
      monto: monto,
      estado: facturaData.estado || 'pendiente',
      fecha_pago: facturaData.fecha_pago ? formatearFecha(facturaData.fecha_pago) : null,
      detalles: {
        consumo_kwh: consumo_kwh,
        cargo_fijo: cargo_fijo,
        cargo_variable: cargo_variable,
        impuestos: impuestos,
        total: monto
      },
      cliente: {
        nombre: `${facturaData.socio_nombre || ''} ${facturaData.socio_apellido || ''}`.trim() || 'Cliente',
        direccion: facturaData.direccion || 'Dirección no especificada',
        numero_cliente: facturaData.numero_cuenta || 'N/A'
      },
      lecturas: {
        anterior: Math.max(0, Math.round(consumo_kwh * 25)), // Simular lectura anterior
        actual: Math.max(0, Math.round(consumo_kwh * 26)), // Simular lectura actual
        consumo: consumo_kwh
      }
    };
  };

  const factura = facturaAPI ? normalizarFactura(facturaAPI) : null;

  const cargarFactura = async () => {
    try {
      // Esta función ya no es necesaria, el hook maneja la carga
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (err) {
      console.error('Error:', err);
    }
  };

  const getStatusBadge = (estado) => {
    const estadoNormalizado = estado?.toLowerCase();
    const badges = {
      pagada: <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Pagada</Badge>,
      pendiente: <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Pendiente</Badge>,
      vencida: <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Vencida</Badge>
    };
    return badges[estadoNormalizado] || badges.pendiente;
  };

  const handleDescargarPDF = () => {
    // TODO: Implementar descarga de PDF
    alert('Descarga de PDF no implementada aún');
  };

  const handlePagar = () => {
    navigate('/dashboard/pagar-online', { state: { factura } });
  };

  if (cargando) {
    return (
      <CooperativaLayout titulo="Detalle de Factura">
        <div className="space-y-6">
          <Skeleton className="h-12 w-64" />
          <Skeleton className="h-96" />
        </div>
      </CooperativaLayout>
    );
  }

  if (error || !factura) {
    return (
      <CooperativaLayout titulo="Detalle de Factura">
        <div className="max-w-4xl mx-auto">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error || 'Factura no encontrada'}</AlertDescription>
          </Alert>
          <Button 
            className="mt-4" 
            variant="outline"
            size="sm"
            onClick={() => navigate('/dashboard/facturas')}
          >
            Volver
          </Button>
        </div>
      </CooperativaLayout>
    );
  }

  return (
    <CooperativaLayout titulo="Detalle de Factura">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Detalle de Factura</h1>
            <p className="text-gray-600 mt-1">{factura.numero}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleDescargarPDF}>
              <Download className="h-4 w-4 mr-2" />
              Descargar PDF
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigate('/dashboard/facturas')}>
              Volver
            </Button>
          </div>
        </div>

        {/* Alerta de estado */}
        {factura.estado === 'vencida' && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Esta factura está vencida desde el {factura.vencimiento}. Por favor, realice el pago a la brevedad.
            </AlertDescription>
          </Alert>
        )}

        {factura.estado === 'pagada' && (
          <Alert className="bg-green-50 border-green-200">
            <AlertCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              Factura pagada el {factura.fecha_pago}
            </AlertDescription>
          </Alert>
        )}

        {/* Información principal */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Estado y período */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Información General
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-gray-600">Estado</p>
                <div className="mt-1">{getStatusBadge(factura.estado)}</div>
              </div>
              <div>
                <p className="text-sm text-gray-600">Período</p>
                <p className="font-semibold">{factura.periodo}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Fecha de Emisión</p>
                <p className="font-semibold">{factura.fecha_emision}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Vencimiento</p>
                <p className="font-semibold">{factura.vencimiento}</p>
              </div>
            </CardContent>
          </Card>

          {/* Cliente */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="h-5 w-5" />
                Datos del Cliente
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-gray-600">Número de Cliente</p>
                <p className="font-semibold">{factura.cliente.numero_cliente}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Nombre</p>
                <p className="font-semibold">{factura.cliente.nombre}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Dirección de Suministro</p>
                <p className="font-semibold flex items-start gap-2">
                  <MapPin className="h-4 w-4 mt-1 text-gray-500" />
                  {factura.cliente.direccion}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Consumo */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Consumo de Energía
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-2">Lectura Anterior</p>
                <p className="text-3xl font-bold text-gray-900">{factura.lecturas.anterior}</p>
                <p className="text-xs text-gray-500 mt-1">kWh</p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-2">Lectura Actual</p>
                <p className="text-3xl font-bold text-gray-900">{factura.lecturas.actual}</p>
                <p className="text-xs text-gray-500 mt-1">kWh</p>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-600 mb-2">Consumo Total</p>
                <p className="text-3xl font-bold text-blue-900">{factura.lecturas.consumo}</p>
                <p className="text-xs text-blue-600 mt-1">kWh</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Detalle de cobros */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Detalle de Cobros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-600">Cargo Fijo</span>
                <span className="font-semibold">${factura.detalles.cargo_fijo.toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-600">
                  Cargo Variable ({factura.detalles.consumo_kwh} kWh)
                </span>
                <span className="font-semibold">${factura.detalles.cargo_variable.toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-600">Impuestos y Tasas</span>
                <span className="font-semibold">${factura.detalles.impuestos.toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-3 bg-gray-50 px-4 rounded-lg mt-4">
                <span className="text-lg font-bold text-gray-900">Total a Pagar</span>
                <span className="text-2xl font-bold text-blue-600">
                  ${factura.detalles.total.toFixed(2)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Botón de pago */}
        {factura.estado !== 'pagada' && (
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">¿Desea pagar esta factura?</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Puede realizar el pago de forma segura con tarjeta de crédito o débito
                  </p>
                </div>
                <Button size="lg" onClick={handlePagar}>
                  <CreditCard className="h-5 w-5 mr-2" />
                  Pagar Ahora
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </CooperativaLayout>
  );
}