import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Badge } from '../ui/badge';
import { Home } from 'lucide-react';
import { Skeleton } from '../ui/skeleton';
import { Alert, AlertDescription } from '../ui/alert';

export default function FacturasListado() {
  const navigate = useNavigate();
  const [cargando, setCargando] = useState(false);
  
  // TODO: Integrar con API real
  const facturas = [
    {
      id: 1,
      numero: 'F001-0234',
      periodo: 'Nov 2024',
      vencimiento: '2024-12-15',
      monto: 8750.00,
      estado: 'pendiente'
    },
    {
      id: 2,
      numero: 'F001-0233',
      periodo: 'Oct 2024',
      vencimiento: '2024-11-15',
      monto: 9200.00,
      estado: 'pagada'
    },
    {
      id: 3,
      numero: 'F001-0232',
      periodo: 'Sep 2024',
      vencimiento: '2024-10-15',
      monto: 7890.00,
      estado: 'pagada'
    },
    {
      id: 4,
      numero: 'F001-0231',
      periodo: 'Ago 2024',
      vencimiento: '2024-09-15',
      monto: 12340.00,
      estado: 'vencida'
    }
  ];

  const getStatusBadge = (estado) => {
    const badges = {
      pagada: <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Pagada</Badge>,
      pendiente: <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Pendiente</Badge>,
      vencida: <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Vencida</Badge>
    };
    return badges[estado] || badges.pendiente;
  };

  if (cargando) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-6xl mx-auto space-y-6">
          <Skeleton className="h-12 w-64" />
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Mis Facturas</h1>
                    <Button variant="outline" onClick={() => navigate('/dashboard')}>
            Volver al Dashboard
            <Home className="h-4 w-4 mr-2" />
            Dashboard
          </Button>
        </div>

        {/* Filtros */}
        <Card>
          <CardHeader>
            <CardTitle>Filtros</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas</SelectItem>
                  <SelectItem value="pagada">Pagadas</SelectItem>
                  <SelectItem value="pendiente">Pendientes</SelectItem>
                  <SelectItem value="vencida">Vencidas</SelectItem>
                </SelectContent>
              </Select>
              <Input placeholder="Período (ej: Nov 2024)" />
              <Button>Filtrar</Button>
            </div>
          </CardContent>
        </Card>

        {/* Tabla de Facturas */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Número</TableHead>
                  <TableHead>Período</TableHead>
                  <TableHead>Vencimiento</TableHead>
                  <TableHead>Monto</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {facturas.map((factura) => (
                  <TableRow
                    key={factura.id}
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => navigate(`/dashboard/cliente/factura/${factura.id}`)}
                  >
                    <TableCell>{factura.numero}</TableCell>
                    <TableCell>{factura.periodo}</TableCell>
                    <TableCell>{factura.vencimiento}</TableCell>
                    <TableCell>${factura.monto.toFixed(2)}</TableCell>
                    <TableCell>{getStatusBadge(factura.estado)}</TableCell>
                    <TableCell>
                      <Button size="sm" variant="ghost">
                        Ver
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
