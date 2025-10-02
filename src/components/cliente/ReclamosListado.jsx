import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { ArrowLeft, AlertCircle } from 'lucide-react';

export default function ReclamosListado() {
  const navigate = useNavigate();

  const reclamos = [
    { id: 1, tipo: 'Falta de suministro', estado: 'PENDIENTE', fecha: '2025-10-01' },
    { id: 2, tipo: 'Fuga de agua', estado: 'EN_PROCESO', fecha: '2025-09-28' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center gap-4 justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-3xl font-bold">Mis Reclamos</h1>
          </div>
          <Button onClick={() => navigate('/dashboard/reclamos/nuevo')}>
            + Nuevo Reclamo
          </Button>
        </div>

        <div className="grid gap-4">
          {reclamos.map(reclamo => (
            <Card key={reclamo.id}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5" />
                    {reclamo.tipo}
                  </span>
                  <Badge>{reclamo.estado}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">Fecha: {reclamo.fecha}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
