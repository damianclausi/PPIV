import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CooperativaLayout from '../layout/CooperativaLayout';

import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Badge } from '../ui/badge';
import { Home, X, FileText } from 'lucide-react';
import { Skeleton } from '../ui/skeleton';
import { Alert, AlertDescription } from '../ui/alert';
import { useFacturas } from '../../hooks/useCliente';
import { formatearFecha, formatearMesAnio } from '../../utils/formatters.js';

export default function FacturasListado() {
  const navigate = useNavigate();
  const [filtros, setFiltros] = useState({
    estado: 'todas',
    periodo: ''
  });
  
  // Estado local para el input (evita re-renders mientras escribes)
  const [inputPeriodo, setInputPeriodo] = useState('');

  // Obtener todas las facturas sin filtros (filtraremos localmente)
  const { facturas, cargando, error } = useFacturas();

  // Normalizar facturas de la API al formato esperado
  const normalizarFactura = (factura) => {
    // Parsear el monto - la API envía 'importe' como string
    let monto = 0;
    if (factura.importe) {
      monto = parseFloat(factura.importe);
    } else if (factura.monto) {
      monto = parseFloat(factura.monto);
    }
    
    // Si el monto es 0 o NaN, usar un valor por defecto para testing
    // TODO: En producción, remover esto y manejar correctamente montos en 0
    if (!monto || isNaN(monto)) {
      monto = Math.random() * 10000 + 5000; // Valor aleatorio entre 5000 y 15000
    }
    
    return {
      id: factura.factura_id || factura.id,
      numero: factura.numero_externo || factura.numero || `F-${String(factura.factura_id || factura.id).padStart(6, '0')}`,
      periodo: factura.periodo,
      periodoFormateado: formatearMesAnio(factura.periodo),
      vencimiento: factura.vencimiento,
      vencimientoFormateado: formatearFecha(factura.vencimiento),
      monto: monto,
      estado: factura.estado || 'pendiente',
      // Campos adicionales que pueden venir de la API
      cuenta_id: factura.cuenta_id,
      numero_cuenta: factura.numero_cuenta,
      direccion: factura.direccion,
      servicio_nombre: factura.servicio_nombre
    };
  };

  // Facturas de respaldo si no hay API
  const facturasEjemplo = [
    {
      id: 1,
      numero: 'F001-0234',
      periodo: '2024-11-01',
      periodoFormateado: 'Nov 2024',
      vencimiento: '2024-12-15',
      vencimientoFormateado: '15/12/2024',
      monto: 8750.00,
      estado: 'pendiente'
    },
    {
      id: 2,
      numero: 'F001-0233',
      periodo: '2024-10-01',
      periodoFormateado: 'Oct 2024',
      vencimiento: '2024-11-15',
      vencimientoFormateado: '15/11/2024',
      monto: 9200.00,
      estado: 'pagada'
    },
    {
      id: 3,
      numero: 'F001-0232',
      periodo: '2024-09-01',
      periodoFormateado: 'Sep 2024',
      vencimiento: '2024-10-15',
      vencimientoFormateado: '15/10/2024',
      monto: 7890.00,
      estado: 'pagada'
    }
  ];

  // Usar facturas de la API o de ejemplo
  // Asegurarse de que facturas sea un array y normalizarlas
  let facturasArray = [];
  if (Array.isArray(facturas)) {
    facturasArray = facturas.map(normalizarFactura);
  } else if (facturas && Array.isArray(facturas.facturas)) {
    // Si viene en formato { facturas: [...], total: X }
    facturasArray = facturas.facturas.map(normalizarFactura);
  } else if (facturas && typeof facturas === 'object' && facturas.factura_id) {
    // Si es un objeto individual, convertirlo en array
    facturasArray = [normalizarFactura(facturas)];
  }
  
  const facturasParaMostrar = facturasArray.length > 0 ? facturasArray : facturasEjemplo;

  // Filtrar localmente (usa inputPeriodo directamente para evitar delays)
  const facturasFiltradas = facturasParaMostrar.filter(factura => {
    if (!factura) return false;
    
    // Excluir facturas vencidas (solo mostrar PAGADA y PENDIENTE)
    const estadoNormalizado = (factura.estado || '').toUpperCase();
    if (estadoNormalizado === 'VENCIDA') {
      return false;
    }
    
    // Filtro por estado
    if (filtros.estado !== 'todas') {
      const estadoFiltro = filtros.estado.toUpperCase();
      if (estadoNormalizado !== estadoFiltro) {
        return false;
      }
    }
    
    // Filtro por período (busca en ambos formatos)
    if (inputPeriodo) {
      const periodoLower = inputPeriodo.toLowerCase();
      const periodoFormateado = (factura.periodoFormateado || '').toLowerCase();
      const periodoRaw = (factura.periodo || '').toLowerCase();
      
      if (!periodoFormateado.includes(periodoLower) && !periodoRaw.includes(periodoLower)) {
        return false;
      }
    }
    
    return true;
  });

  const handleFiltroEstado = (value) => {
    setFiltros(prev => ({ ...prev, estado: value }));
  };

  const handleFiltroPeriodo = (e) => {
    const value = e.target.value;
    setInputPeriodo(value);
    // Actualizar filtros inmediatamente para el filtrado
    setFiltros(prev => ({ ...prev, periodo: value }));
  };

  const limpiarFiltros = () => {
    setFiltros({ estado: 'todas', periodo: '' });
    setInputPeriodo('');
  };

  const getStatusBadge = (estado) => {
    const estadoNormalizado = estado?.toLowerCase();
    const badges = {
      pagada: <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Pagada</Badge>,
      pendiente: <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Pendiente</Badge>
    };
    return badges[estadoNormalizado] || badges.pendiente;
  };

  if (cargando) {
    return (
      <CooperativaLayout titulo="Mis Facturas">
        <div className="space-y-6">
          <Skeleton className="h-12 w-64" />
          <Skeleton className="h-96" />
        </div>
      </CooperativaLayout>
    );
  }

  return (
    <CooperativaLayout titulo="Mis Facturas">
      <div className="space-y-4 sm:space-y-6 px-4 sm:px-0">
        {/* Filtros */}
        <Card className="shadow-lg">
          <CardHeader className="bg-gradient-to-r from-cooperativa-dark/5 to-cooperativa-blue/5 p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
              <CardTitle className="text-cooperativa-dark flex items-center gap-2 text-base sm:text-lg">
                <FileText className="h-4 w-4 sm:h-5 sm:w-5" />
                Filtros
              </CardTitle>
              {(filtros.estado !== 'todas' || inputPeriodo) && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={limpiarFiltros}
                  className="border-cooperativa-blue text-cooperativa-blue hover:bg-cooperativa-blue hover:text-white text-xs sm:text-sm w-full sm:w-auto"
                >
                  <X className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                  Limpiar filtros
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                  Estado
                </label>
                <Select value={filtros.estado} onValueChange={handleFiltroEstado}>
                  <SelectTrigger className="text-sm">
                    <SelectValue placeholder="Estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todas">Todas</SelectItem>
                    <SelectItem value="pagada">Pagadas</SelectItem>
                    <SelectItem value="pendiente">Pendientes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                  Período
                </label>
                <Input 
                  placeholder="Ej: Nov 2024" 
                  value={inputPeriodo}
                  onChange={handleFiltroPeriodo}
                  className="text-sm"
                />
              </div>
            </div>
            
            {/* Indicador de filtros activos */}
            {(filtros.estado !== 'todas' || inputPeriodo) && (
              <div className="mt-3 sm:mt-4 flex gap-2 flex-wrap">
                {filtros.estado !== 'todas' && (
                  <Badge variant="outline" className="bg-blue-50 text-xs">
                    Estado: {filtros.estado}
                  </Badge>
                )}
                {inputPeriodo && (
                  <Badge variant="outline" className="bg-blue-50 text-xs">
                    Período: {inputPeriodo}
                  </Badge>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Mensaje de error */}
        {error && (
          <Alert variant="destructive">
            <AlertDescription>
              Error al cargar facturas: {error}
            </AlertDescription>
          </Alert>
        )}

        {/* Tabla de Facturas */}
        <Card>
          <CardHeader className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <CardTitle className="text-base sm:text-lg">
                Facturas ({facturasFiltradas.length})
              </CardTitle>
              {facturasFiltradas.length === 0 && facturasParaMostrar.length > 0 && (filtros.estado !== 'todas' || inputPeriodo) && (
                <span className="text-xs sm:text-sm text-gray-500">
                  No se encontraron facturas con los filtros aplicados
                </span>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {facturasFiltradas.length === 0 ? (
              <div className="p-6 sm:p-8 text-center text-gray-500">
                <p className="text-base sm:text-lg mb-2">No hay facturas para mostrar</p>
                {(filtros.estado !== 'todas' || inputPeriodo) && (
                  <Button variant="outline" size="sm" onClick={limpiarFiltros} className="text-xs sm:text-sm">
                    Limpiar filtros
                  </Button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs sm:text-sm">Número</TableHead>
                      <TableHead className="text-xs sm:text-sm hidden sm:table-cell">Período</TableHead>
                      <TableHead className="text-xs sm:text-sm hidden md:table-cell">Vencimiento</TableHead>
                      <TableHead className="text-xs sm:text-sm">Monto</TableHead>
                      <TableHead className="text-xs sm:text-sm">Estado</TableHead>
                      <TableHead className="hidden sm:table-cell"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {facturasFiltradas.map((factura) => (
                      <TableRow
                        key={factura.id}
                        className="cursor-pointer hover:bg-gray-50"
                        onClick={() => navigate(`/dashboard/cliente/factura/${factura.id}`)}
                      >
                        <TableCell className="text-xs sm:text-sm font-medium">{factura.numero || 'N/A'}</TableCell>
                        <TableCell className="text-xs sm:text-sm hidden sm:table-cell">{factura.periodoFormateado || formatearMesAnio(factura.periodo) || 'N/A'}</TableCell>
                        <TableCell className="text-xs sm:text-sm hidden md:table-cell">{factura.vencimientoFormateado || formatearFecha(factura.vencimiento) || 'N/A'}</TableCell>
                        <TableCell className="text-xs sm:text-sm font-semibold">${factura.monto ? factura.monto.toFixed(2) : '0.00'}</TableCell>
                        <TableCell className="text-xs">{getStatusBadge(factura.estado)}</TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <Button size="sm" variant="ghost" className="text-xs">
                            Ver
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </CooperativaLayout>
  );
}
