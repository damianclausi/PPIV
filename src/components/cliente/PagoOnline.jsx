import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Skeleton } from '../ui/skeleton';
import { Alert, AlertDescription } from '../ui/alert';
import { 
  ArrowLeft, 
  CreditCard, 
  DollarSign, 
  Calendar, 
  FileText, 
  CheckCircle,
  AlertCircle,
  XCircle,
  Loader2,
  Shield
} from 'lucide-react';
import { useFacturas } from '../../hooks/useCliente';
import clienteService from '../../services/clienteService';
import { formatearFecha, formatearFechaHora, formatearMesAnio } from '../../utils/formatters.js';

// Simulador de pasarela de pago
class PasarelaPagoSimulada {
  // Algoritmo de Luhn para validar número de tarjeta
  static validarNumeroTarjeta(numero) {
    const soloNumeros = numero.replace(/\s/g, '');
    if (!/^\d{13,19}$/.test(soloNumeros)) return false;

    let suma = 0;
    let esSegundo = false;

    for (let i = soloNumeros.length - 1; i >= 0; i--) {
      let digito = parseInt(soloNumeros[i]);

      if (esSegundo) {
        digito *= 2;
        if (digito > 9) digito -= 9;
      }

      suma += digito;
      esSegundo = !esSegundo;
    }

    return suma % 10 === 0;
  }

  // Detectar tipo de tarjeta
  static detectarTipoTarjeta(numero) {
    const soloNumeros = numero.replace(/\s/g, '');
    if (/^4/.test(soloNumeros)) return 'Visa';
    if (/^5[1-5]/.test(soloNumeros)) return 'Mastercard';
    if (/^3[47]/.test(soloNumeros)) return 'American Express';
    if (/^6(?:011|5)/.test(soloNumeros)) return 'Discover';
    return 'Desconocida';
  }

  // Validar fecha de vencimiento
  static validarVencimiento(vencimiento) {
    const match = vencimiento.match(/^(\d{2})\/(\d{2})$/);
    if (!match) return false;

    const mes = parseInt(match[1]);
    const anio = parseInt('20' + match[2]);

    if (mes < 1 || mes > 12) return false;

    const ahora = new Date();
    const fechaVencimiento = new Date(anio, mes - 1);

    return fechaVencimiento > ahora;
  }

  // Procesar pago (simulado - siempre aprueba)
  static async procesarPago(datos) {
    // Simular latencia de red (2-3 segundos)
    await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 1000));

    const { numeroTarjeta, monto } = datos;

    // Detectar tipo de tarjeta y obtener últimos 4 dígitos
    const soloNumeros = numeroTarjeta.replace(/\s/g, '');
    const tipoTarjeta = this.detectarTipoTarjeta(numeroTarjeta);
    const ultimos4 = soloNumeros.length >= 4 ? soloNumeros.slice(-4) : soloNumeros;

    // Siempre aprueba el pago (simulación)
    return {
      aprobado: true,
      codigo_autorizacion: Math.random().toString(36).substr(2, 9).toUpperCase(),
      tipo_tarjeta: tipoTarjeta,
      ultimos_digitos: ultimos4,
      fecha_transaccion: new Date().toISOString(),
      monto
    };
  }
}

export default function PagoOnline() {
  const navigate = useNavigate();
  const location = useLocation();
  const { facturas: facturasAPI, cargando } = useFacturas();
  const [facturaSeleccionada, setFacturaSeleccionada] = useState(null);
  const [procesando, setProcesando] = useState(false);
  const [pagoExitoso, setPagoExitoso] = useState(false);
  const [errorPago, setErrorPago] = useState(null);
  const [respuestaPago, setRespuestaPago] = useState(null);
  const [formPago, setFormPago] = useState({
    numeroTarjeta: '',
    vencimiento: '',
    cvv: '',
    nombreTitular: ''
  });
  const [erroresValidacion, setErroresValidacion] = useState({});

  // Normalizar facturas de la API
  const normalizarFactura = (factura) => {
    if (!factura) return null;
    
    // Si ya está normalizada (viene de FacturaDetalle), devolverla tal cual
    if (factura.monto && factura.numero && factura.periodo) {
      return factura;
    }
    
    // Normalizar desde formato API
    const monto = parseFloat(factura.importe || factura.monto || 0);
    
    return {
      id: factura.factura_id || factura.id,
      numero: factura.numero_externo || factura.numero || `F-${String(factura.factura_id || factura.id).padStart(6, '0')}`,
      periodo: factura.periodo,
      monto: monto,
      estado: factura.estado || 'pendiente',
      vencimiento: factura.vencimiento
    };
  };

  // Normalizar todas las facturas
  const facturas = Array.isArray(facturasAPI) 
    ? facturasAPI.map(normalizarFactura)
    : facturasAPI?.facturas 
      ? facturasAPI.facturas.map(normalizarFactura)
      : [];

  const facturasImpagas = facturas?.filter(f => {
    const estadoLower = f.estado?.toLowerCase();
    return estadoLower === 'pendiente' || estadoLower === 'vencida';
  }) || [];

  // Si viene una factura desde FacturaDetalle, seleccionarla automáticamente
  useEffect(() => {
    if (location.state?.factura) {
      const facturaNormalizada = normalizarFactura(location.state.factura);
      setFacturaSeleccionada(facturaNormalizada);
    }
  }, [location.state]);

  const handleSeleccionarFactura = (factura) => {
    const facturaNormalizada = normalizarFactura(factura);
    setFacturaSeleccionada(facturaNormalizada);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    let valorFormateado = value;

    // Formatear número de tarjeta (agregar espacios cada 4 dígitos)
    if (name === 'numeroTarjeta') {
      valorFormateado = value
        .replace(/\s/g, '')
        .replace(/(\d{4})/g, '$1 ')
        .trim()
        .slice(0, 19);
    }

    // Formatear vencimiento (MM/AA)
    if (name === 'vencimiento') {
      valorFormateado = value
        .replace(/\D/g, '')
        .replace(/(\d{2})(\d)/, '$1/$2')
        .slice(0, 5);
    }

    // Solo números en CVV
    if (name === 'cvv') {
      valorFormateado = value.replace(/\D/g, '').slice(0, 4);
    }

    setFormPago(prev => ({ ...prev, [name]: valorFormateado }));
    
    // Limpiar error de ese campo
    if (erroresValidacion[name]) {
      setErroresValidacion(prev => ({ ...prev, [name]: null }));
    }
  };

  const validarFormulario = () => {
    const errores = {};

    // Solo verifica que los campos no estén vacíos
    if (!formPago.numeroTarjeta || formPago.numeroTarjeta.trim() === '') {
      errores.numeroTarjeta = 'El número de tarjeta es obligatorio';
    }

    if (!formPago.vencimiento || formPago.vencimiento.trim() === '') {
      errores.vencimiento = 'La fecha de vencimiento es obligatoria';
    }

    if (!formPago.cvv || formPago.cvv.trim() === '') {
      errores.cvv = 'El CVV es obligatorio';
    }

    if (!formPago.nombreTitular || formPago.nombreTitular.trim() === '') {
      errores.nombreTitular = 'El nombre del titular es obligatorio';
    }

    setErroresValidacion(errores);
    return Object.keys(errores).length === 0;
  };

  const handlePagar = async () => {
    if (!facturaSeleccionada) {
      setErrorPago('Selecciona una factura para pagar');
      return;
    }

    if (!validarFormulario()) {
      return;
    }

    setProcesando(true);
    setErrorPago(null);
    
    try {
      // Procesar pago a través de la pasarela simulada
      const monto = parseFloat(facturaSeleccionada.monto) || 0;
      const respuestaPasarela = await PasarelaPagoSimulada.procesarPago({
        numeroTarjeta: formPago.numeroTarjeta,
        vencimiento: formPago.vencimiento,
        cvv: formPago.cvv,
        nombreTitular: formPago.nombreTitular,
        monto: monto
      });

      // Registrar pago en el backend
      const datosPago = {
        monto_pagado: monto,
        metodo_pago: 'TARJETA',
        // Comprobante reducido para cumplir con límite de 100 caracteres
        comprobante: `${respuestaPasarela.codigo_autorizacion}|${respuestaPasarela.tipo_tarjeta}|${respuestaPasarela.ultimos_digitos}`
      };

      await clienteService.pagarFactura(facturaSeleccionada.id, datosPago);

      setRespuestaPago(respuestaPasarela);
      setPagoExitoso(true);
      
    } catch (error) {
      setErrorPago(error.message);
    } finally {
      setProcesando(false);
    }
  };

  const reiniciarFormulario = () => {
    setFacturaSeleccionada(null);
    setPagoExitoso(false);
    setErrorPago(null);
    setRespuestaPago(null);
    setFormPago({
      numeroTarjeta: '',
      vencimiento: '',
      cvv: '',
      nombreTitular: ''
    });
    setErroresValidacion({});
  };

  if (pagoExitoso) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Animación de éxito */}
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Card className="border-green-200 bg-green-50">
              <CardContent className="pt-6">
                <div className="text-center space-y-4">
                  <div className="flex justify-center">
                    <div className="bg-green-100 p-4 rounded-full animate-in zoom-in duration-300">
                      <CheckCircle className="h-16 w-16 text-green-600" />
                    </div>
                  </div>
                  <h2 className="text-2xl font-bold text-green-900">¡Pago Exitoso!</h2>
                  
                  {/* Detalles del pago */}
                  <div className="bg-white rounded-lg p-6 space-y-3">
                    <div className="border-b pb-3">
                      <p className="text-sm text-gray-600 mb-1">Código de Autorización</p>
                      <p className="text-lg font-mono font-semibold text-gray-900">
                        {respuestaPago?.codigo_autorizacion}
                      </p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">Factura</p>
                        <p className="font-semibold">#{facturaSeleccionada?.factura_id}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Fecha</p>
                        <p className="font-semibold">
                          {formatearFechaHora(respuestaPago?.fecha_transaccion)}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600">Tarjeta</p>
                        <p className="font-semibold">
                          {respuestaPago?.tipo_tarjeta} •••• {respuestaPago?.ultimos_digitos}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600">Monto</p>
                        <p className="text-xl font-bold text-green-600">
                          ${respuestaPago?.monto?.toLocaleString('es-AR')}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <Alert className="bg-green-100 border-green-300">
                    <CheckCircle className="h-4 w-4 text-green-700" />
                    <AlertDescription className="text-green-800">
                      Se ha enviado un comprobante a tu email registrado
                    </AlertDescription>
                  </Alert>
                  
                  <div className="pt-4 space-y-2">
                    <Button
                      className="w-full bg-green-600 hover:bg-green-700"
                      onClick={() => navigate('/dashboard')}
                    >
                      Volver al Dashboard
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => {
                        reiniciarFormulario();
                        navigate('/dashboard/facturas');
                      }}
                    >
                      Ver mis Facturas
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full"
                      onClick={reiniciarFormulario}
                    >
                      Realizar Otro Pago
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Información adicional */}
          <Card>
            <CardContent className="pt-6">
              <div className="text-sm text-gray-600 space-y-2">
                <p className="font-semibold text-gray-900">Recordá:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Guardá el código de autorización para futuras consultas</li>
                  <li>El comprobante también está disponible en tu panel de facturas</li>
                  <li>El pago se verá reflejado en tu próxima factura</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (cargando) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <Skeleton className="h-12 w-96" />
          <Skeleton className="h-48" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Pago Online</h1>
            <p className="text-sm text-gray-600 mt-1">
              Paga tus facturas de forma rápida y segura
            </p>
          </div>
        </div>

        {/* Facturas Pendientes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Facturas Pendientes de Pago
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {facturasImpagas.length === 0 ? (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  ¡Excelente! No tienes facturas pendientes de pago.
                </AlertDescription>
              </Alert>
            ) : (
              facturasImpagas.map(factura => {
                // Función helper local para formatear con fallback
                const formatearFechaConFallback = (fecha) => {
                  if (!fecha) return 'No especificado';
                  try {
                    const fechaFormateada = formatearFecha(fecha);
                    return fechaFormateada || 'No especificado';
                  } catch {
                    return 'No especificado';
                  }
                };

                // Verificar si está vencida
                const estaVencida = () => {
                  if (!factura.fecha_vencimiento) return false;
                  try {
                    const fechaVenc = new Date(factura.fecha_vencimiento);
                    return !isNaN(fechaVenc.getTime()) && fechaVenc < new Date();
                  } catch {
                    return false;
                  }
                };

                return (
                  <div
                    key={factura.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-all ${
                      facturaSeleccionada?.id === factura.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                    onClick={() => handleSeleccionarFactura(factura)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <p className="font-semibold">{factura.numero}</p>
                          <Badge variant="destructive">
                            {factura.estado === 'vencida' ? 'Vencida' : 'Pendiente'}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Calendar className="h-4 w-4" />
                          <span>
                            Vencimiento: {formatearFechaConFallback(factura.vencimiento)}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          Período: {formatearMesAnio(factura.periodo)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-gray-900">
                          ${factura.monto?.toFixed(2) || '0.00'}
                        </p>
                        {factura.estado === 'vencida' && (
                          <Badge variant="destructive" className="mt-1">Vencida</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        {/* Error de pago */}
        {errorPago && (
          <Alert variant="destructive" className="animate-in slide-in-from-top-2">
            <XCircle className="h-4 w-4" />
            <AlertDescription className="font-medium">
              {errorPago}
            </AlertDescription>
          </Alert>
        )}

        {/* Formulario de Pago */}
        {facturaSeleccionada && (
          <Card className="animate-in slide-in-from-bottom-4 duration-300">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Datos de la Tarjeta
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Número de Tarjeta */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Número de Tarjeta *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    name="numeroTarjeta"
                    value={formPago.numeroTarjeta}
                    onChange={handleInputChange}
                    placeholder="1234 5678 9012 3456"
                    className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      erroresValidacion.numeroTarjeta ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {formPago.numeroTarjeta && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-gray-500">
                      {PasarelaPagoSimulada.detectarTipoTarjeta(formPago.numeroTarjeta)}
                    </div>
                  )}
                </div>
                {erroresValidacion.numeroTarjeta && (
                  <p className="text-xs text-red-500 mt-1">{erroresValidacion.numeroTarjeta}</p>
                )}
              </div>

              {/* Vencimiento y CVV */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Vencimiento *
                  </label>
                  <input
                    type="text"
                    name="vencimiento"
                    value={formPago.vencimiento}
                    onChange={handleInputChange}
                    placeholder="MM/AA"
                    className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      erroresValidacion.vencimiento ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {erroresValidacion.vencimiento && (
                    <p className="text-xs text-red-500 mt-1">{erroresValidacion.vencimiento}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    CVV *
                  </label>
                  <input
                    type="password"
                    name="cvv"
                    value={formPago.cvv}
                    onChange={handleInputChange}
                    placeholder="123"
                    maxLength="4"
                    className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      erroresValidacion.cvv ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {erroresValidacion.cvv && (
                    <p className="text-xs text-red-500 mt-1">{erroresValidacion.cvv}</p>
                  )}
                </div>
              </div>

              {/* Nombre del Titular */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Nombre del Titular *
                </label>
                <input
                  type="text"
                  name="nombreTitular"
                  value={formPago.nombreTitular}
                  onChange={handleInputChange}
                  placeholder="Como figura en la tarjeta"
                  className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 uppercase ${
                    erroresValidacion.nombreTitular ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {erroresValidacion.nombreTitular && (
                  <p className="text-xs text-red-500 mt-1">{erroresValidacion.nombreTitular}</p>
                )}
              </div>

              {/* Total y Botón de Pago */}
              <div className="pt-4 border-t">
                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <span>Factura:</span>
                    <span>{facturaSeleccionada.numero}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <span>Período:</span>
                    <span>{formatearMesAnio(facturaSeleccionada.periodo)}</span>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t">
                    <span className="text-lg font-semibold">Total a Pagar:</span>
                    <span className="text-3xl font-bold text-blue-600">
                      ${facturaSeleccionada.monto?.toFixed(2) || '0.00'}
                    </span>
                  </div>
                </div>

                <Button
                  className="w-full"
                  size="lg"
                  onClick={handlePagar}
                  disabled={procesando}
                >
                  {procesando ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Procesando Pago...
                    </>
                  ) : (
                    <>
                      <DollarSign className="h-5 w-5 mr-2" />
                      Pagar Ahora
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Información de Seguridad */}
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <div className="flex gap-3">
              <Shield className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-900">
                <p className="font-medium mb-1">Pago 100% Seguro</p>
                <p className="text-blue-700">
                  Tus datos están protegidos con encriptación SSL de última generación. 
                  Nunca almacenamos información de tu tarjeta.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
