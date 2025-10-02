import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Skeleton } from '../ui/skeleton';
import { Alert, AlertDescription } from '../ui/alert';
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

export default function FacturaDetalle() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [cargando, setCargando] = useState(true);
  const [factura, setFactura] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    cargarFactura();
  }, [id]);

  const cargarFactura = async () => {
    try {
      setCargando(true);
      
      // TODO: Integrar con API real
      // Simulación de datos
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const facturasSimuladas = {
        '1': {
          id: 1,
          numero: 'F001-0234',
          periodo: 'Noviembre 2024',
          fecha_emision: '2024-11-01',
          vencimiento: '2024-12-15',
          monto: 8750.00,
          estado: 'pendiente',
          detalles: {
            consumo_kwh: 450,
            cargo_fijo: 1200.00,
            cargo_variable: 6800.00,
            impuestos: 750.00,
            total: 8750.00
          },
          cliente: {
            nombre: 'Juan Pérez',
            direccion: 'Calle Principal 123',
            numero_cliente: 'CLI-12345'
          },
          lecturas: {
            anterior: 12450,
            actual: 12900,
            consumo: 450
          }
        },
        '2': {
          id: 2,
          numero: 'F001-0233',
          periodo: 'Octubre 2024',
          fecha_emision: '2024-10-01',
          vencimiento: '2024-11-15',
          monto: 9200.00,
          estado: 'pagada',
          fecha_pago: '2024-11-10',
          detalles: {
            consumo_kwh: 480,
            cargo_fijo: 1200.00,
            cargo_variable: 7200.00,
            impuestos: 800.00,
            total: 9200.00
          },
          cliente: {
            nombre: 'Juan Pérez',
            direccion: 'Calle Principal 123',
            numero_cliente: 'CLI-12345'
          },
          lecturas: {
            anterior: 11970,
            actual: 12450,
            consumo: 480
          }
        },
        '3': {
          id: 3,
          numero: 'F001-0232',
          periodo: 'Septiembre 2024',
          fecha_emision: '2024-09-01',
          vencimiento: '2024-10-15',
          monto: 7890.00,
          estado: 'pagada',
          fecha_pago: '2024-10-08',
          detalles: {
            consumo_kwh: 420,
            cargo_fijo: 1200.00,
            cargo_variable: 6100.00,
            impuestos: 590.00,
            total: 7890.00
          },
          cliente: {
            nombre: 'Juan Pérez',
            direccion: 'Calle Principal 123',
            numero_cliente: 'CLI-12345'
          },
          lecturas: {
            anterior: 11550,
            actual: 11970,
            consumo: 420
          }
        },
        '4': {
          id: 4,
          numero: 'F001-0231',
          periodo: 'Agosto 2024',
          fecha_emision: '2024-08-01',
          vencimiento: '2024-09-15',
          monto: 12340.00,
          estado: 'vencida',
          detalles: {
            consumo_kwh: 650,
            cargo_fijo: 1200.00,
            cargo_variable: 10000.00,
            impuestos: 1140.00,
            total: 12340.00
          },
          cliente: {
            nombre: 'Juan Pérez',
            direccion: 'Calle Principal 123',
            numero_cliente: 'CLI-12345'
          },
          lecturas: {
            anterior: 10900,
            actual: 11550,
            consumo: 650
          }
        }
      };

      const facturaData = facturasSimuladas[id];
      
      if (!facturaData) {
        setError('Factura no encontrada');
        return;
      }

      setFactura(facturaData);
    } catch (err) {
      setError(err.message || 'Error al cargar la factura');
    } finally {
      setCargando(false);
    }
  };

  const getStatusBadge = (estado) => {
    const badges = {
      pagada: <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Pagada</Badge>,
      pendiente: <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Pendiente</Badge>,
      vencida: <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Vencida</Badge>
    };
    return badges[estado] || badges.pendiente;
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
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <Skeleton className="h-12 w-64" />
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  if (error || !factura) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error || 'Factura no encontrada'}</AlertDescription>
          </Alert>
          <Button 
            className="mt-4" 
            variant="outline" 
            onClick={() => navigate('/dashboard/facturas')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver a Facturas
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={() => navigate('/dashboard/facturas')}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Detalle de Factura</h1>
              <p className="text-sm text-gray-600 mt-1">{factura.numero}</p>
            </div>
          </div>
          <Button variant="outline" onClick={handleDescargarPDF}>
            <Download className="h-4 w-4 mr-2" />
            Descargar PDF
          </Button>
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
    </div>
  );
}
