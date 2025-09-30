import React, { useState } from "react";
import { Button } from "./components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "./components/ui/card";
import { Badge } from "./components/ui/badge";
import { Input } from "./components/ui/input";
import { Label } from "./components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./components/ui/select";
import { Textarea } from "./components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./components/ui/table";
import { Progress } from "./components/ui/progress";
import { Switch } from "./components/ui/switch";
import {
  User,
  FileText,
  Wrench,
  BarChart3,
  Home,
  Bell,
  Clock,
  MapPin,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  XCircle,
} from "lucide-react";

// =====================
// Tipos y mocks
// =====================
type UserRole = "cliente" | "operario" | "administrativo";
type Screen =
  // Cliente
  | "CL-Login"
  | "CL-Dashboard"
  | "CL-Facturas-Listado"
  | "CL-Factura-Detalle"
  | "CL-Reclamos-Listado"
  | "CL-Reclamo-Nuevo"
  | "CL-Pago-Confirmacion"
  // Operario
  | "OP-Asignados-Lista"
  | "OP-Reclamo-Detalle"
  | "OP-Cargar-Insumos"
  // Admin
  | "AD-Itinerario-Plan"
  | "AD-Asignados-Lista"
  | "AD-Reclamo-Detalle"
  | "AD-Cuadrilla-Detalle"
  | "AD-OT-Resueltas"
  | "AD-Clientes-ABM"
  | "AD-Cliente-Nuevo"
  | "AD-Cliente-Editar"
  | "AD-Cliente-Historial"
  | "AD-Metricas";

interface Bill {
  id: string;
  number: string;
  period: string;
  dueDate: string;
  amount: number;
  status: "paid" | "pending" | "overdue";
}

interface Claim {
  id: string;
  title: string;
  description: string;
  type: string;
  status: "pending" | "in_progress" | "resolved";
  priority: "high" | "medium" | "low";
  date: string;
  zone?: string;
}

type InteractionChannel =
  | "tel"
  | "email"
  | "web"
  | "presencial";
interface Interaction {
  id: string;
  date: string; // yyyy-mm-dd
  channel: InteractionChannel;
  summary: string;
  agent?: string;
  relatedClaimId?: string;
}

interface Client {
  id: string;
  name: string;
  dni: string;
  memberNumber: string;
  active: boolean;

  // extendidos opcionales
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  lat?: string;
  lng?: string;
  type?: "residencial" | "comercial" | "publico";
  segment?:
    | "ts-g1"
    | "ts-g2"
    | "ingreso-bajo"
    | "ingreso-medio"
    | "ingreso-alto";

  services?: {
    electricidad?: {
      medidor?: string;
      estadoInicial?: string;
      fechaAlta?: string; // yyyy-mm-dd
    };
  };

  claims?: Claim[];
  interactions?: Interaction[];
}

const mockBills: Bill[] = [
  {
    id: "1",
    number: "F001-0234",
    period: "Nov 2024",
    dueDate: "2024-12-15",
    amount: 8750,
    status: "pending",
  },
  {
    id: "2",
    number: "F001-0233",
    period: "Oct 2024",
    dueDate: "2024-11-15",
    amount: 9200,
    status: "paid",
  },
  {
    id: "3",
    number: "F001-0232",
    period: "Sep 2024",
    dueDate: "2024-10-15",
    amount: 7890,
    status: "paid",
  },
  {
    id: "4",
    number: "F001-0231",
    period: "Ago 2024",
    dueDate: "2024-09-15",
    amount: 12340,
    status: "overdue",
  },
];

const mockClaims: Claim[] = [
  {
    id: "1",
    title: "Corte de luz intermitente",
    description: "Se corta la luz cada 2 horas aproximadamente",
    type: "Técnico",
    status: "pending",
    priority: "high",
    date: "2024-12-01",
    zone: "Zona Norte",
  },
  {
    id: "2",
    title: "Medidor con error",
    description: "El medidor marca valores incorrectos",
    type: "Técnico",
    status: "in_progress",
    priority: "medium",
    date: "2024-11-28",
    zone: "Centro",
  },
  {
    id: "3",
    title: "Consulta sobre facturación",
    description: "Dudas sobre el monto facturado",
    type: "Comercial",
    status: "pending",
    priority: "low",
    date: "2024-11-25",
  },
  {
    id: "4",
    title: "Consulta sobre cambio titularidad",
    description: "Dudas sobre el cambio de titularidad",
    type: "Comercial",
    status: "pending",
    priority: "low",
    date: "2024-11-25",
  },
  {
    id: "5",
    title: "Pedido de baja de servicio",
    description: "Pedido baja de servicio",
    type: "Comercial",
    status: "in_progress",
    priority: "low",
    date: "2024-11-25",
  },
];

const mockClients: Client[] = [
  {
    id: "1",
    name: "Juan Pérez",
    dni: "12345678",
    memberNumber: "S001234",
    active: true,
    email: "juan@mail.com",
    phone: "+54 9 11 5555-1111",
    address: "Mitre 123",
    city: "Ugarte",
    type: "residencial",
    segment: "ingreso-medio",
    services: {
      electricidad: {
        medidor: "MED-0007",
        estadoInicial: "1200",
        fechaAlta: "2023-03-10",
      },
    },
    claims: [
      {
        id: "C-1001",
        title: "Baja tensión",
        description: "Oscila la tensión por la noche",
        type: "Técnico",
        status: "resolved",
        priority: "medium",
        date: "2024-10-04",
        zone: "Centro",
      },
      {
        id: "C-1012",
        title: "Error de lectura",
        description: "Consumo elevado inesperado",
        type: "Medición",
        status: "in_progress",
        priority: "high",
        date: "2024-12-02",
        zone: "Centro",
      },
    ],
    interactions: [
      {
        id: "I-1",
        date: "2024-12-02",
        channel: "tel",
        summary: "Llamada por consumo elevado",
        agent: "Agente: Sofía",
        relatedClaimId: "C-1012",
      },
      {
        id: "I-2",
        date: "2024-11-15",
        channel: "email",
        summary: "Envía factura y detalle de consumo",
        agent: "Sistema",
      },
      {
        id: "I-3",
        date: "2024-10-04",
        channel: "presencial",
        summary: "Atención en oficina por baja tensión",
        agent: "Agente: Marcos",
        relatedClaimId: "C-1001",
      },
    ],
  },
  {
    id: "2",
    name: "María González",
    dni: "87654321",
    memberNumber: "S001235",
    active: true,
    email: "maria@mail.com",
    phone: "+54 9 11 5555-2222",
    address: "San Martín 456",
    city: "Ugarte",
    type: "comercial",
    segment: "ts-g2",
    services: {
      electricidad: {
        medidor: "MED-0012",
        estadoInicial: "300",
        fechaAlta: "2024-01-20",
      },
    },
    claims: [],
    interactions: [
      {
        id: "I-10",
        date: "2024-09-01",
        channel: "web",
        summary: "Alta de usuario en Oficina Virtual",
      },
    ],
  },
  {
    id: "3",
    name: "Carlos López",
    dni: "11223344",
    memberNumber: "S001236",
    active: false,
  },
];

// =====================================================
// App
// =====================================================
export default function App() {
  // Estado global de clientes
  const [clients, setClients] = useState<Client[]>(mockClients);
  const [selectedClient, setSelectedClient] =
    useState<Client | null>(null);

  // Estado general
  const [selectedCuadrilla, setSelectedCuadrilla] = useState<
    string | null
  >(null);
  const [currentRole, setCurrentRole] =
    useState<UserRole>("cliente");
  const [currentScreen, setCurrentScreen] =
    useState<Screen>("CL-Login");
  const [selectedBill, setSelectedBill] = useState<Bill | null>(
    null,
  );
  const [selectedClaim, setSelectedClaim] =
    useState<Claim | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<
    "success" | "error" | null
  >(null);

  // Tipos para cuadrillas
  type Cuadrilla = {
    id: string;
    nombre: string;
    capacidad: number;
    asignadas: number;
  };
  const [cuadrillas, setCuadrillas] = useState<Cuadrilla[]>([
    {
      id: "A",
      nombre: "Cuadrilla A",
      capacidad: 5,
      asignadas: 3,
    },
    {
      id: "B",
      nombre: "Cuadrilla B",
      capacidad: 4,
      asignadas: 4,
    },
    {
      id: "C",
      nombre: "Cuadrilla C",
      capacidad: 6,
      asignadas: 1,
    },
  ]);
  const [asignacion, setAsignacion] = useState<
    Record<string, string | null>
  >({
    "R-001": null,
    "R-002": null,
    "R-003": null,
  });

  function asignarCuadrilla(otId: string, cuadrillaId: string) {
    setAsignacion((prev) => ({ ...prev, [otId]: cuadrillaId }));
    setCuadrillas((prev) => {
      const counts = new Map<string, number>();
      const next = { ...asignacion, [otId]: cuadrillaId };
      Object.values(next).forEach((cid) => {
        if (cid) counts.set(cid, (counts.get(cid) ?? 0) + 1);
      });
      return prev.map((c) => ({
        ...c,
        asignadas: counts.get(c.id) ?? 0,
      }));
    });
  }

  const getStatusBadge = (
    status: string,
    type: "status" | "priority" = "status",
  ) => {
    const statusConfig = {
      pending: {
        label: "Pendiente",
        variant: "secondary" as const,
      },
      in_progress: {
        label: "En curso",
        variant: "default" as const,
      },
      resolved: {
        label: "Resuelto",
        variant: "outline" as const,
      },
      paid: { label: "Pagada", variant: "outline" as const },
      overdue: {
        label: "Vencida",
        variant: "destructive" as const,
      },
      high: { label: "Alta", variant: "destructive" as const },
      medium: { label: "Media", variant: "default" as const },
      low: { label: "Baja", variant: "secondary" as const },
    } as const;
    const config =
      statusConfig[status as keyof typeof statusConfig];
    return (
      <Badge variant={config?.variant || "secondary"}>
        {config?.label || status}
      </Badge>
    );
  };

  const formatAmount = (amount: number) =>
    new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
    }).format(amount);

  const navigate = (screen: Screen, role?: UserRole) => {
    if (role) setCurrentRole(role);
    setCurrentScreen(screen);
  };

  // =======================
  // Vistas CLIENTE
  // =======================
  const CLLogin = () => (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-2">
          <CardTitle>Cooperativa Eléctrica</CardTitle>
          <p className="text-muted-foreground">
            Gobernador Ugarte
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Email o DNI</Label>
            <Input placeholder="usuario@email.com" />
          </div>
          <div className="space-y-2">
            <Label>Password</Label>
            <Input placeholder="*******" />
          </div>
          <Button
            className="w-full"
            onClick={() => navigate("CL-Dashboard")}
          >
            Ingresar
          </Button>
          <Button variant="link" className="w-full">
            Registrarse
          </Button>

          <div className="pt-4 space-y-2 border-t">
            <p className="text-sm text-muted-foreground text-center">
              Otras vistas del prototipo:
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  navigate("OP-Asignados-Lista", "operario")
                }
              >
                Operario
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  navigate(
                    "AD-Itinerario-Plan",
                    "administrativo",
                  )
                }
              >
                Admin
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const CLDashboard = () => (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <h1>Dashboard - Cliente</h1>
          <Button
            variant="outline"
            onClick={() => navigate("CL-Login")}
          >
            Cerrar Sesión
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card>
            <CardHeader className="flex flex-row items-center space-y-0 pb-2">
              <CardTitle className="text-sm">
                Estado del Servicio
              </CardTitle>
              <CheckCircle className="h-4 w-4 ml-auto text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl">Activo</div>
              <p className="text-xs text-muted-foreground">
                Sin interrupciones
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center space-y-0 pb-2">
              <CardTitle className="text-sm">
                Última Factura
              </CardTitle>
              <FileText className="h-4 w-4 ml-auto" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl">
                {formatAmount(8750)}
              </div>
              <p className="text-xs text-muted-foreground">
                Nov 2024 - Pendiente
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center space-y-0 pb-2">
              <CardTitle className="text-sm">
                Reclamos Activos
              </CardTitle>
              <Bell className="h-4 w-4 ml-auto" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl">2</div>
              <p className="text-xs text-muted-foreground">
                1 pendiente, 1 en curso
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle>Acciones Rápidas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                className="w-full justify-start"
                onClick={() => navigate("CL-Facturas-Listado")}
              >
                <FileText className="h-4 w-4 mr-2" />
                Ver Facturas
              </Button>
              <Button
                className="w-full justify-start"
                onClick={() => navigate("CL-Reclamos-Listado")}
              >
                <Bell className="h-4 w-4 mr-2" />
                Mis Reclamos
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Últimas Facturas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockBills.slice(0, 3).map((bill) => (
                  <div
                    key={bill.id}
                    className="flex items-center justify-between"
                  >
                    <div>
                      <p className="text-sm">{bill.period}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatAmount(bill.amount)}
                      </p>
                    </div>
                    {getStatusBadge(bill.status)}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );

  const CLFacturasListado = () => (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <h1>Mis Facturas</h1>
          <Button
            variant="outline"
            onClick={() => navigate("CL-Dashboard")}
          >
            <Home className="h-4 w-4 mr-2" />
            Dashboard
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Filtros</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="paid">Pagadas</SelectItem>
                  <SelectItem value="pending">
                    Pendientes
                  </SelectItem>
                  <SelectItem value="overdue">
                    Vencidas
                  </SelectItem>
                </SelectContent>
              </Select>
              <Input placeholder="Período (ej: Nov 2024)" />
              <Button>Filtrar</Button>
            </div>
          </CardContent>
        </Card>

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
                {mockBills.map((bill) => (
                  <TableRow
                    key={bill.id}
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => {
                      setSelectedBill(bill);
                      navigate("CL-Factura-Detalle");
                    }}
                  >
                    <TableCell>{bill.number}</TableCell>
                    <TableCell>{bill.period}</TableCell>
                    <TableCell>{bill.dueDate}</TableCell>
                    <TableCell>
                      {formatAmount(bill.amount)}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(bill.status)}
                    </TableCell>
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

  const CLFacturaDetalle = () => (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <h1>Detalle de Factura</h1>
          <Button
            variant="outline"
            onClick={() => navigate("CL-Facturas-Listado")}
          >
            Volver
          </Button>
        </div>

        {selectedBill && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>
                  Factura {selectedBill.number}
                </CardTitle>
                {getStatusBadge(selectedBill.status)}
              </div>
            </CardHeader>
            <CardContent className="space-y-8">
              <div className="grid grid-cols-2 gap-8">
                <div>
                  <h3>Datos de la Factura</h3>
                  <div className="space-y-2 mt-4">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Período:
                      </span>
                      <span>{selectedBill.period}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Vencimiento:
                      </span>
                      <span>{selectedBill.dueDate}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Número de Socio:
                      </span>
                      <span>S001234</span>
                    </div>
                  </div>
                </div>
                <div>
                  <h3>Consumo</h3>
                  <div className="space-y-2 mt-4">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        kWh Consumidos:
                      </span>
                      <span>450</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Cargo Fijo:
                      </span>
                      <span>{formatAmount(2500)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Cargo Variable:
                      </span>
                      <span>{formatAmount(6250)}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t pt-8">
                <div className="flex justify-between items-center text-2xl">
                  <span>Total:</span>
                  <span>
                    {formatAmount(selectedBill.amount)}
                  </span>
                </div>
              </div>

              {selectedBill.status === "pending" && (
                <div className="pt-4">
                  <Button
                    className="w-full"
                    size="lg"
                    onClick={() => {
                      setPaymentStatus(
                        Math.random() > 0.3
                          ? "success"
                          : "error",
                      );
                      navigate("CL-Pago-Confirmacion");
                    }}
                  >
                    <DollarSign className="h-4 w-4 mr-2" />
                    Pagar Factura
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );

  const CLPagoConfirmacion = () => (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-8">
      <Card className="w-full max-w-md text-center">
        <CardContent className="pt-8 space-y-4">
          {paymentStatus === "success" ? (
            <>
              <CheckCircle className="h-16 w-16 text-green-600 mx-auto" />
              <h2>¡Pago Exitoso!</h2>
              <p className="text-muted-foreground">
                Su factura ha sido pagada correctamente
              </p>
              <div className="space-y-2 pt-4">
                <p className="text-sm">
                  Comprobante: #PAG-2024-001234
                </p>
                <p className="text-sm text-muted-foreground">
                  Se enviará confirmación por email
                </p>
              </div>
            </>
          ) : (
            <>
              <XCircle className="h-16 w-16 text-red-600 mx-auto" />
              <h2>Error en el Pago</h2>
              <p className="text-muted-foreground">
                No se pudo procesar el pago. Intente nuevamente.
              </p>
            </>
          )}
          <div className="pt-4 space-y-2">
            <Button
              className="w-full"
              onClick={() => navigate("CL-Dashboard")}
            >
              Volver al Dashboard
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => navigate("CL-Facturas-Listado")}
            >
              Ver Facturas
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const CLReclamosListado = () => (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <h1>Mis Reclamos</h1>
          <div className="flex gap-2">
            <Button
              onClick={() => navigate("CL-Reclamo-Nuevo")}
            >
              Nuevo Reclamo
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate("CL-Dashboard")}
            >
              <Home className="h-4 w-4 mr-2" />
              Dashboard
            </Button>
          </div>
        </div>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Título</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockClaims.map((claim) => (
                  <TableRow
                    key={claim.id}
                    className="hover:bg-gray-50"
                  >
                    <TableCell>
                      <div>
                        <p>{claim.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {claim.description}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>{claim.type}</TableCell>
                    <TableCell>{claim.date}</TableCell>
                    <TableCell>
                      {getStatusBadge(claim.status)}
                    </TableCell>
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

  const CLReclamoNuevo = () => (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <h1>Nuevo Reclamo</h1>
          <Button
            variant="outline"
            onClick={() => navigate("CL-Reclamos-Listado")}
          >
            Volver
          </Button>
        </div>

        <Card>
          <CardContent className="space-y-8 pt-6">
            <div className="space-y-2">
              <Label>Tipo de Reclamo</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione el tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tecnico">
                    Técnico
                  </SelectItem>
                  <SelectItem value="medicion">
                    Medición
                  </SelectItem>
                  <SelectItem value="comercial">
                    Comercial
                  </SelectItem>
                  <SelectItem value="administrativo">
                    Administrativo
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Título</Label>
              <Input placeholder="Resuma su reclamo en pocas palabras" />
            </div>

            <div className="space-y-2">
              <Label>Descripción</Label>
              <Textarea
                placeholder="Describa detalladamente su reclamo..."
                rows={5}
              />
            </div>

            <div className="space-y-2">
              <Label>Adjuntar Archivo (opcional)</Label>
              <Input type="file" />
              <p className="text-sm text-muted-foreground">
                Formatos permitidos: JPG, PNG, PDF (máx. 5MB)
              </p>
            </div>

            <div className="flex gap-4 pt-4">
              <Button
                className="flex-1"
                onClick={() => navigate("CL-Reclamos-Listado")}
              >
                Enviar Reclamo
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate("CL-Reclamos-Listado")}
              >
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  // =======================
  // Vistas OPERARIO
  // =======================
  const OPAsignadosLista = () => (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <h1>Reclamos Asignados - Operario</h1>
          <div className="flex gap-2">
            <Button onClick={() => navigate("CL-Login")}>
              Cambiar Rol
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {mockClaims
            .filter(
              (c) =>
                c.status !== "resolved" &&
                c.type !== "Comercial",
            )
            .map((claim) => (
              <Card
                key={claim.id}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => {
                  setSelectedClaim(claim);
                  navigate("OP-Reclamo-Detalle");
                }}
              >
                <CardHeader className="space-y-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">
                      {claim.title}
                    </CardTitle>
                    {getStatusBadge(claim.priority, "priority")}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" /> {claim.zone}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm">{claim.description}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" /> {claim.date}
                    </div>
                    {getStatusBadge(claim.status)}
                  </div>
                </CardContent>
              </Card>
            ))}
        </div>
      </div>
    </div>
  );

  const OPReclamoDetalle = () => (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <h1>Detalle del Reclamo</h1>
          <Button
            variant="outline"
            onClick={() => navigate("OP-Asignados-Lista")}
          >
            Volver
          </Button>
        </div>

        {selectedClaim && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{selectedClaim.title}</CardTitle>
                <div className="flex gap-2">
                  {getStatusBadge(selectedClaim.status)}
                  {getStatusBadge(
                    selectedClaim.priority,
                    "priority",
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-8">
              <div className="grid grid-cols-2 gap-8">
                <div>
                  <h3>Información del Reclamo</h3>
                  <div className="space-y-2 mt-4">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Tipo:
                      </span>
                      <span>{selectedClaim.type}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Fecha:
                      </span>
                      <span>{selectedClaim.date}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Zona:
                      </span>
                      <span>{selectedClaim.zone}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3>Estado</h3>
                  <div className="space-y-4 mt-4">
                    <Select defaultValue={selectedClaim.status}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">
                          Pendiente
                        </SelectItem>
                        <SelectItem value="in_progress">
                          En Curso
                        </SelectItem>
                        <SelectItem value="resolved">
                          Resuelto
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Button
                    onClick={() =>
                      navigate("OP-Cargar-Insumos")
                    }
                  >
                    Cargar Insumos
                  </Button>
                </div>
              </div>

              <div>
                <h3>Descripción</h3>
                <p className="mt-2 text-muted-foreground">
                  {selectedClaim.description}
                </p>
              </div>

              <div className="space-y-2">
                <Label>Notas del Operario</Label>
                <Textarea
                  placeholder="Agregue notas sobre el trabajo realizado..."
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label>Fotos del Trabajo</Label>
                <Input type="file" multiple />
                <p className="text-sm text-muted-foreground">
                  Puede cargar múltiples fotos
                </p>
              </div>

              <div className="flex gap-4 pt-4">
                <Button
                  className="flex-1"
                  onClick={() => navigate("OP-Asignados-Lista")}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Cerrar Reclamo
                </Button>
                <Button variant="outline">
                  Guardar Cambios
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );

  const OPCargarInsumos = () => (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <h1>Cargar Insumos</h1>
          <Button
            variant="outline"
            onClick={() => navigate("OP-Asignados-Lista")}
          >
            Volver
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>
              Registro de Materiales Utilizados
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-8">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Material</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar material" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cable_2.5">
                        Cable 2.5mm
                      </SelectItem>
                      <SelectItem value="cable_4">
                        Cable 4mm
                      </SelectItem>
                      <SelectItem value="fusible_10a">
                        Fusible 10A
                      </SelectItem>
                      <SelectItem value="fusible_20a">
                        Fusible 20A
                      </SelectItem>
                      <SelectItem value="contactor">
                        Contactor
                      </SelectItem>
                      <SelectItem value="morseteria">
                        Morsetería
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Cantidad</Label>
                  <Input
                    type="number"
                    placeholder="0"
                    min="1"
                  />
                </div>
              </div>
              <Button variant="outline" className="w-full">
                Agregar Material
              </Button>
            </div>

            <div>
              <h3>Materiales Cargados</h3>
              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <span>Cable 2.5mm - 15 metros</span>
                  <Button size="sm" variant="ghost">
                    Eliminar
                  </Button>
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <span>Fusible 10A - 2 unidades</span>
                  <Button size="sm" variant="ghost">
                    Eliminar
                  </Button>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Observaciones</Label>
              <Textarea
                placeholder="Detalles adicionales sobre los materiales utilizados..."
                rows={3}
              />
            </div>

            <div className="flex gap-4 pt-4">
              <Button className="flex-1">
                Confirmar Carga
              </Button>
              <Button variant="outline">Cancelar</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  // =======================
  // Vistas ADMIN
  // =======================
  const ADItinerarioPlan = () => (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <h1>Dashboard - Admin</h1>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => navigate("AD-Asignados-Lista")}
            >
              Reclamos comerciales
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate("AD-OT-Resueltas")}
            >
              Historial Reclamos
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate("AD-Clientes-ABM")}
            >
              Clientes
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate("AD-Metricas")}
            >
              Métricas
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate("CL-Login")}
            >
              Cambiar Rol
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Cuadrillas Disponibles</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  {
                    id: "A",
                    label: "Cuadrilla A",
                    info: "2 operarios - Zona Norte",
                    status: "Disponible",
                    color: "bg-green-500",
                  },
                  {
                    id: "B",
                    label: "Cuadrilla B",
                    info: "3 operarios - Centro/Sur",
                    status: "En servicio",
                    color: "bg-yellow-500",
                  },
                  {
                    id: "C",
                    label: "Cuadrilla C",
                    info: "2 operarios - Zona Oeste",
                    status: "Disponible",
                    color: "bg-green-500",
                  },
                ].map((q) => (
                  <div
                    key={q.id}
                    className="p-3 border rounded-lg"
                  >
                    <h4>{q.label}</h4>
                    <p className="text-sm text-muted-foreground">
                      {q.info}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <div
                        className={`w-2 h-2 rounded-full ${q.color}`}
                      />
                      <span className="text-sm">
                        {q.status}
                      </span>
                    </div>
                    <Button
                      size="sm"
                      className="mt-3"
                      onClick={() => {
                        setSelectedCuadrilla(q.label);
                        navigate("AD-Cuadrilla-Detalle");
                      }}
                    >
                      Detalles
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl font-bold">
                  Reclamos Técnicos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    {
                      id: "R-001",
                      title:
                        "Reclamo #001 - Corte intermitente",
                      sub: "Zona Norte - Alta prioridad",
                      slot: "09:00 - 11:00",
                      prio: "high",
                    },
                    {
                      id: "R-002",
                      title: "Reclamo #002 - Error medidor",
                      sub: "Centro - Media prioridad",
                      slot: "11:30 - 13:00",
                      prio: "medium",
                    },
                    {
                      id: "R-003",
                      title: "Mantenimiento preventivo",
                      sub: "Zona Oeste - Baja prioridad",
                      slot: "14:00 - 16:00",
                      prio: "low",
                    },
                  ].map((r) => (
                    <div
                      key={r.id}
                      className="p-4 border rounded-lg bg-white"
                    >
                      <div className="grid grid-cols-3 items-center">
                        <div>
                          <h4>{r.title}</h4>
                          <p className="text-sm text-muted-foreground">
                            {r.sub}
                          </p>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-sm">
                            {r.slot}
                          </span>
                          {getStatusBadge(r.prio, "priority")}
                        </div>
                        <div className="flex justify-end">
                          <select
                            className="border rounded-lg px-2 py-1 text-sm"
                            defaultValue=""
                            onChange={(e) =>
                              asignarCuadrilla(
                                r.id,
                                e.target.value,
                              )
                            }
                          >
                            <option value="" disabled>
                              Asignar cuadrilla
                            </option>
                            <option value="A">
                              Cuadrilla A
                            </option>
                            <option value="B">
                              Cuadrilla B
                            </option>
                            <option value="C">
                              Cuadrilla C
                            </option>
                          </select>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="my-4 border-t-4 border-gray-500" />

            <Card>
              <CardHeader>
                <CardTitle className="text-xl font-bold">
                  Reclamos Comerciales
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    {
                      id: "RC-004",
                      title: "Reclamo #004 - Error Facturacion",
                      sub: "Zona Norte - Alta prioridad",
                      prio: "high",
                    },
                    {
                      id: "RC-005",
                      title:
                        "Reclamo #005 - Cambio Titularidad",
                      sub: "Centro - Media prioridad",
                      prio: "medium",
                    },
                    {
                      id: "RC-006",
                      title:
                        "Reclamo #006 - Agregado de Domicilio Nuevo a Usuario",
                      sub: "Zona Oeste - Baja prioridad",
                      prio: "low",
                    },
                  ].map((r) => (
                    <div
                      key={r.id}
                      className="p-4 border rounded-lg bg-white"
                    >
                      <div className="grid grid-cols-3 items-center">
                        <div>
                          <h4>{r.title}</h4>
                          <p className="text-sm text-muted-foreground">
                            {r.sub}
                          </p>
                        </div>
                        <div className="flex items-center gap-4">
                          {getStatusBadge(r.prio, "priority")}
                        </div>
                        <div />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );

  const ADAsignadosLista = () => (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <h1>Reclamos Asignados - Comercial</h1>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => navigate("AD-Itinerario-Plan")}
            >
              Volver
            </Button>
            <Button onClick={() => navigate("CL-Login")}>
              Cambiar Rol
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {mockClaims
            .filter(
              (c) =>
                c.status !== "resolved" &&
                c.type == "Comercial",
            )
            .map((claim) => (
              <Card
                key={claim.id}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => {
                  setSelectedClaim(claim);
                  navigate("AD-Reclamo-Detalle");
                }}
              >
                <CardHeader className="space-y-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">
                      {claim.title}
                    </CardTitle>
                    {getStatusBadge(claim.priority, "priority")}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" /> {claim.zone}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm">{claim.description}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" /> {claim.date}
                    </div>
                    {getStatusBadge(claim.status)}
                  </div>
                </CardContent>
              </Card>
            ))}
        </div>
      </div>
    </div>
  );

  const ADReclamoDetalle = () => (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <h1>Detalle del Reclamo</h1>
          <Button
            variant="outline"
            onClick={() => navigate("AD-Asignados-Lista")}
          >
            Volver
          </Button>
        </div>

        {selectedClaim && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{selectedClaim.title}</CardTitle>
                <div className="flex gap-2">
                  {getStatusBadge(selectedClaim.status)}
                  {getStatusBadge(
                    selectedClaim.priority,
                    "priority",
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-8">
              <div className="grid grid-cols-2 gap-8">
                <div>
                  <h3>Información del Reclamo</h3>
                  <div className="space-y-2 mt-4">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Tipo:
                      </span>
                      <span>{selectedClaim.type}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Fecha:
                      </span>
                      <span>{selectedClaim.date}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Zona:
                      </span>
                      <span>{selectedClaim.zone}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3>Estado</h3>
                  <div className="space-y-4 mt-4">
                    <Select defaultValue={selectedClaim.status}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">
                          Pendiente
                        </SelectItem>
                        <SelectItem value="in_progress">
                          En Curso
                        </SelectItem>
                        <SelectItem value="resolved">
                          Resuelto
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div>
                <h3>Descripción</h3>
                <p className="mt-2 text-muted-foreground">
                  {selectedClaim.description}
                </p>
              </div>

              <div className="space-y-2">
                <Label>Comentarios</Label>
                <Textarea
                  placeholder="Agregue un comentario en caso de ser necesario..."
                  rows={4}
                />
              </div>

              <div className="flex gap-4 pt-4">
                <Button
                  className="flex-1"
                  onClick={() => navigate("OP-Asignados-Lista")}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Cerrar Reclamo
                </Button>
                <Button variant="outline">
                  Guardar Cambios
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );

  const ADCuadrillaDetalle = () => (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1>
            Detalle de Cuadrilla{" "}
            {selectedCuadrilla ? `— ${selectedCuadrilla}` : ""}
          </h1>
          <Button
            variant="outline"
            onClick={() => navigate("AD-Itinerario-Plan")}
          >
            Volver
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Órdenes asignadas</CardTitle>
            <div className="flex flex-wrap gap-3 pt-2">
              <Select>
                <SelectTrigger className="w-[180px]">
                  <span>Estado</span>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pendiente">
                    Pendiente
                  </SelectItem>
                  <SelectItem value="en_curso">
                    En curso
                  </SelectItem>
                  <SelectItem value="resuelto">
                    Resuelto
                  </SelectItem>
                </SelectContent>
              </Select>
              <Select>
                <SelectTrigger className="w-[200px]">
                  <span>Prioridad</span>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="alta">Alta</SelectItem>
                  <SelectItem value="media">Media</SelectItem>
                  <SelectItem value="baja">Baja</SelectItem>
                </SelectContent>
              </Select>
              <Input
                className="w-[280px]"
                placeholder="Buscar por ID OT o dirección"
              />
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID OT</TableHead>
                  <TableHead>Prioridad</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Dirección</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Técnico</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[
                  {
                    id: "OT-1012",
                    prio: "Alta",
                    est: "Pendiente",
                    dir: "Mitre 123",
                    fecha: "19/02/2021",
                    tech: "Pérez",
                  },
                  {
                    id: "OT-1013",
                    prio: "Media",
                    est: "En curso",
                    dir: "San Martín 456",
                    fecha: "19/02/2021",
                    tech: "Gómez",
                  },
                  {
                    id: "OT-1014",
                    prio: "Baja",
                    est: "Resuelto",
                    dir: "Belgrano 789",
                    fecha: "19/02/2021",
                    tech: "López",
                  },
                ].map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>{r.id}</TableCell>
                    <TableCell>{r.prio}</TableCell>
                    <TableCell>{r.est}</TableCell>
                    <TableCell>{r.dir}</TableCell>
                    <TableCell>{r.fecha}</TableCell>
                    <TableCell>{r.tech}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const ADOTResueltas = () => {
    const pageSize = 5;
    const allOTs = [
      {
        id: "OT-1013",
        prio: "Media",
        est: "Resuelto",
        dir: "San Martín 456",
        fecha: "19/02/2021",
        tech: "Gómez",
        tipo: "Comercial",
        estado: "En curso",
      },
      {
        id: "OT-1014",
        prio: "Baja",
        est: "Resuelto",
        dir: "Belgrano 789",
        fecha: "11/03/2021",
        tech: "López",
        tipo: "Técnica",
        estado: "Pendiente",
      },
      {
        id: "OT-1015",
        prio: "Media",
        est: "Resuelto",
        dir: "Rivadavia 100",
        fecha: "19/02/2021",
        tech: "Díaz",
        tipo: "Comercial",
        estado: "Resuelto",
      },
      {
        id: "OT-1016",
        prio: "Alta",
        est: "Resuelto",
        dir: "Urquiza 200",
        fecha: "19/02/2021",
        tech: "Fernández",
        tipo: "Técnica",
        estado: "Resuelto",
      },
      {
        id: "OT-1017",
        prio: "Baja",
        est: "Resuelto",
        dir: "Mitre 444",
        fecha: "19/02/2021",
        tech: "Paz",
        tipo: "Comercial",
        estado: "Resuelto",
      },
      {
        id: "OT-1019",
        prio: "Alta",
        est: "Resuelto",
        dir: "San Juan 123",
        fecha: "19/02/2021",
        tech: "Saez",
        tipo: "Comercial",
        estado: "Resuelto",
      },
      {
        id: "OT-1020",
        prio: "Baja",
        est: "Resuelto",
        dir: "Libertador 300",
        fecha: "19/02/2021",
        tech: "Mora",
        tipo: "Técnica",
        estado: "Resuelto",
      },
      {
        id: "OT-1021",
        prio: "Media",
        est: "Resuelto",
        dir: "Alsina 78",
        fecha: "19/02/2021",
        tech: "Vega",
        tipo: "Comercial",
        estado: "Resuelto",
      },
    ];

    const resolvedOTs = allOTs.filter(
      (o) => o.est === "Resuelto",
    );
    const [page, setPage] = React.useState(1);
    const totalPages = Math.ceil(resolvedOTs.length / pageSize);
    const start = (page - 1) * pageSize;
    const pageItems = resolvedOTs.slice(
      start,
      start + pageSize,
    );

    return (
      <div className="p-8 space-y-6">
        <Button
          variant="outline"
          onClick={() => navigate("AD-Itinerario-Plan")}
        >
          ← Volver
        </Button>
        <h1 className="text-2xl font-bold">
          Historial Reclamos
        </h1>
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Filtros</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="paid">Resuelto</SelectItem>
                  <SelectItem value="pending">
                    Pendiente
                  </SelectItem>
                  <SelectItem value="overdue">
                    En curso
                  </SelectItem>
                </SelectContent>
              </Select>
              <Button>Filtrar</Button>
            </div>
          </CardContent>
        </Card>
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b">
              <th className="text-left p-2">ID OT</th>
              <th className="text-left p-2">Prioridad</th>
              <th className="text-left p-2">Dirección</th>
              <th className="text-left p-2">Fecha</th>
              <th className="text-left p-2">Técnico</th>
              <th className="text-left p-2">Tipo</th>
              <th className="text-left p-2">Estado</th>
            </tr>
          </thead>
          <tbody>
            {pageItems.map((r) => (
              <tr key={r.id} className="border-b">
                <td className="p-2">{r.id}</td>
                <td className="p-2">{r.prio}</td>
                <td className="p-2">{r.dir}</td>
                <td className="p-2">{r.fecha}</td>
                <td className="p-2">{r.tech}</td>
                <td className="p-2">{r.tipo}</td>
                <td className="p-2">{r.estado}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex justify-between items-center">
          <Button
            variant="outline"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Anterior
          </Button>
          <span>
            Página {page} de {totalPages}
          </span>
          <Button
            variant="outline"
            onClick={() =>
              setPage((p) => Math.min(totalPages, p + 1))
            }
            disabled={page === totalPages}
          >
            Siguiente
          </Button>
        </div>
      </div>
    );
  };

  const ADMetricas = () => (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <h1>Métricas y KPIs</h1>
          <Button
            variant="outline"
            onClick={() => navigate("AD-Itinerario-Plan")}
          >
            Volver
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <Card>
            <CardHeader className="flex flex-row items-center space-y-0 pb-2">
              <CardTitle className="text-sm">
                Tiempo Medio de Resolución
              </CardTitle>
              <Clock className="h-4 w-4 ml-auto" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl">2.5 días</div>
              <p className="text-xs text-muted-foreground">
                -0.3 días vs mes anterior
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center space-y-0 pb-2">
              <CardTitle className="text-sm">
                Reclamos Activos
              </CardTitle>
              <Bell className="h-4 w-4 ml-auto" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl">23</div>
              <p className="text-xs text-muted-foreground">
                +5 vs semana anterior
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center space-y-0 pb-2">
              <CardTitle className="text-sm">
                Satisfacción Cliente
              </CardTitle>
              <User className="h-4 w-4 ml-auto" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl">4.2/5</div>
              <p className="text-xs text-muted-foreground">
                +0.1 vs mes anterior
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center space-y-0 pb-2">
              <CardTitle className="text-sm">
                Eficiencia Operativa
              </CardTitle>
              <BarChart3 className="h-4 w-4 ml-auto" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl">87%</div>
              <p className="text-xs text-muted-foreground">
                +3% vs mes anterior
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle>Reclamos por Tipo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span>Técnico</span>
                  <div className="flex items-center gap-2">
                    <Progress value={45} className="w-20" />
                    <span className="text-sm">45%</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span>Medición</span>
                  <div className="flex items-center gap-2">
                    <Progress value={25} className="w-20" />
                    <span className="text-sm">25%</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span>Comercial</span>
                  <div className="flex items-center gap-2">
                    <Progress value={20} className="w-20" />
                    <span className="text-sm">20%</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span>Administrativo</span>
                  <div className="flex items-center gap-2">
                    <Progress value={10} className="w-20" />
                    <span className="text-sm">10%</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Reclamos por Prioridad</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span>Alta</span>
                    {getStatusBadge("high", "priority")}
                  </div>
                  <span>8 reclamos</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span>Media</span>
                    {getStatusBadge("medium", "priority")}
                  </div>
                  <span>12 reclamos</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span>Baja</span>
                    {getStatusBadge("low", "priority")}
                  </div>
                  <span>3 reclamos</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Evolución Semanal de Reclamos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-end justify-between gap-4 border-b border-l pl-4 pb-4">
              {[
                { d: "Lun", h: 120 },
                { d: "Mar", h: 80 },
                { d: "Mié", h: 160 },
                { d: "Jue", h: 100 },
                { d: "Vie", h: 140 },
                { d: "Sáb", h: 60 },
                { d: "Dom", h: 40 },
              ].map((b) => (
                <div
                  key={b.d}
                  className="flex flex-col items-center gap-2"
                >
                  <div
                    className="bg-blue-500 w-8"
                    style={{ height: `${b.h}px` }}
                  />
                  <span className="text-sm">{b.d}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const ADClientesABM = () => (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <h1>Gestión de Clientes</h1>
          <div className="flex gap-2">
            <Button
              onClick={() => navigate("AD-Cliente-Nuevo")}
            >
              Nuevo Cliente
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate("AD-Itinerario-Plan")}
            >
              Volver
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Filtros</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Input placeholder="Buscar por nombre..." />
              <Input placeholder="DNI..." />
              <Input placeholder="Nº Socio..." />
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="active">
                    Activos
                  </SelectItem>
                  <SelectItem value="inactive">
                    Inactivos
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>DNI</TableHead>
                  <TableHead>Nº Socio</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clients.map((client) => (
                  <TableRow key={client.id}>
                    <TableCell>{client.name}</TableCell>
                    <TableCell>{client.dni}</TableCell>
                    <TableCell>{client.memberNumber}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch checked={client.active} />
                        <span className="text-sm">
                          {client.active
                            ? "Activo"
                            : "Inactivo"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setSelectedClient(client);
                            navigate("AD-Cliente-Editar");
                          }}
                        >
                          Editar
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setSelectedClient(client);
                            navigate("AD-Cliente-Historial");
                          }}
                        >
                          Historial
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {clients.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="text-center py-8 text-muted-foreground"
                    >
                      Sin clientes aún. Usá "Nuevo Cliente".
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  // ===== Alta Cliente =====
  const ADClienteNuevo = ({
    onSave,
    onCancel,
  }: {
    onSave: (c: Client) => void;
    onCancel: () => void;
  }) => {
    // básicos
    const [name, setName] = useState("");
    const [dni, setDni] = useState("");
    const [memberNumber, setMemberNumber] = useState("");
    const [active, setActive] = useState(true);
    // contacto / domicilio
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [address, setAddress] = useState("");
    const [city, setCity] = useState("");
    // georreferencia
    const [lat, setLat] = useState("");
    const [lng, setLng] = useState("");
    // clasificación
    const [type, setType] = useState<
      "residencial" | "comercial" | "publico" | undefined
    >();
    const [segment, setSegment] = useState<
      | "ts-g1"
      | "ts-g2"
      | "ingreso-bajo"
      | "ingreso-medio"
      | "ingreso-alto"
      | undefined
    >();
    // servicio electricidad
    const [medidor, setMedidor] = useState("");
    const [estadoInicial, setEstadoInicial] = useState("");
    const [fechaAlta, setFechaAlta] = useState("");

    const guardar = () => {
      if (!name.trim()) return alert("Falta el nombre.");
      if (!/^\d{7,9}$/.test(dni))
        return alert("DNI inválido (7-9 dígitos).");
      if (!memberNumber.trim())
        return alert("Falta el N° de socio.");
      if (email && !/^\S+@\S+\.\S+$/.test(email))
        return alert("Email inválido.");
      if (estadoInicial && isNaN(Number(estadoInicial)))
        return alert("Estado inicial debe ser numérico.");

      const nuevo: Client = {
        id: crypto.randomUUID(),
        name,
        dni,
        memberNumber,
        active,
        email: email || undefined,
        phone: phone || undefined,
        address: address || undefined,
        city: city || undefined,
        lat: lat || undefined,
        lng: lng || undefined,
        type,
        segment,
        services: {
          electricidad:
            medidor || estadoInicial || fechaAlta
              ? {
                  medidor: medidor || undefined,
                  estadoInicial: estadoInicial || undefined,
                  fechaAlta: fechaAlta || undefined,
                }
              : undefined,
        },
        claims: [],
        interactions: [],
      };
      onSave(nuevo);
    };

    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <Card className="w-full max-w-3xl">
          <CardHeader>
            <CardTitle>Nuevo Cliente</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <ClienteFormFields
              values={{
                name,
                dni,
                memberNumber,
                active,
                email,
                phone,
                address,
                city,
                lat,
                lng,
                type,
                segment,
                medidor,
                estadoInicial,
                fechaAlta,
              }}
              setters={{
                setName,
                setDni,
                setMemberNumber,
                setActive,
                setEmail,
                setPhone,
                setAddress,
                setCity,
                setLat,
                setLng,
                setType,
                setSegment,
                setMedidor,
                setEstadoInicial,
                setFechaAlta,
              }}
            />
            <div className="flex gap-2 pt-2 justify-center">
              <button
                className="border px-3 py-2 rounded"
                onClick={onCancel}
              >
                Cancelar
              </button>
              <button
                className="bg-black text-white px-3 py-2 rounded"
                onClick={guardar}
              >
                Guardar
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  // ===== Editar Cliente (prefill) =====
  const ADClienteEditar = () => {
    if (!selectedClient) {
      return (
        <div className="p-8">
          <Button
            variant="outline"
            onClick={() => navigate("AD-Clientes-ABM")}
          >
            Volver
          </Button>
          <p className="mt-4">No hay cliente seleccionado.</p>
        </div>
      );
    }

    // Estados inicializados con el cliente seleccionado
    const [name, setName] = useState(selectedClient.name || "");
    const [dni, setDni] = useState(selectedClient.dni || "");
    const [memberNumber, setMemberNumber] = useState(
      selectedClient.memberNumber || "",
    );
    const [active, setActive] = useState(
      !!selectedClient.active,
    );

    const [email, setEmail] = useState(
      selectedClient.email || "",
    );
    const [phone, setPhone] = useState(
      selectedClient.phone || "",
    );
    const [address, setAddress] = useState(
      selectedClient.address || "",
    );
    const [city, setCity] = useState(selectedClient.city || "");
    const [lat, setLat] = useState(selectedClient.lat || "");
    const [lng, setLng] = useState(selectedClient.lng || "");
    const [type, setType] = useState<Client["type"]>(
      selectedClient.type,
    );
    const [segment, setSegment] = useState<Client["segment"]>(
      selectedClient.segment,
    );

    const [medidor, setMedidor] = useState(
      selectedClient.services?.electricidad?.medidor || "",
    );
    const [estadoInicial, setEstadoInicial] = useState(
      selectedClient.services?.electricidad?.estadoInicial ||
        "",
    );
    const [fechaAlta, setFechaAlta] = useState(
      selectedClient.services?.electricidad?.fechaAlta || "",
    );

    const guardar = () => {
      if (!name.trim()) return alert("Falta el nombre.");
      if (!/^\d{7,9}$/.test(dni))
        return alert("DNI inválido (7-9 dígitos).");
      if (!memberNumber.trim())
        return alert("Falta el N° de socio.");
      if (email && !/^\S+@\S+\.\S+$/.test(email))
        return alert("Email inválido.");
      if (estadoInicial && isNaN(Number(estadoInicial)))
        return alert("Estado inicial debe ser numérico.");

      const actualizado: Client = {
        ...selectedClient,
        name,
        dni,
        memberNumber,
        active,
        email: email || undefined,
        phone: phone || undefined,
        address: address || undefined,
        city: city || undefined,
        lat: lat || undefined,
        lng: lng || undefined,
        type,
        segment,
        services: {
          ...selectedClient.services,
          electricidad:
            medidor || estadoInicial || fechaAlta
              ? {
                  medidor: medidor || undefined,
                  estadoInicial: estadoInicial || undefined,
                  fechaAlta: fechaAlta || undefined,
                }
              : undefined,
        },
      };

      setClients((prev) =>
        prev.map((c) =>
          c.id === actualizado.id ? actualizado : c,
        ),
      );
      setSelectedClient(actualizado);
      alert("Cliente actualizado");
      navigate("AD-Clientes-ABM");
    };

    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <Card className="w-full max-w-3xl">
          <CardHeader>
            <CardTitle>
              Editar Cliente — {selectedClient.name}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <ClienteFormFields
              values={{
                name,
                dni,
                memberNumber,
                active,
                email,
                phone,
                address,
                city,
                lat,
                lng,
                type,
                segment,
                medidor,
                estadoInicial,
                fechaAlta,
              }}
              setters={{
                setName,
                setDni,
                setMemberNumber,
                setActive,
                setEmail,
                setPhone,
                setAddress,
                setCity,
                setLat,
                setLng,
                setType,
                setSegment,
                setMedidor,
                setEstadoInicial,
                setFechaAlta,
              }}
            />
            <div className="flex gap-2 pt-2 justify-center">
              <button
                className="border px-3 py-2 rounded"
                onClick={() => navigate("AD-Clientes-ABM")}
              >
                Cancelar
              </button>
              <button
                className="bg-black text-white px-3 py-2 rounded"
                onClick={guardar}
              >
                Guardar Cambios
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  // ===== Historial Cliente =====
  const ADClienteHistorial = () => {
    const c = selectedClient;
    if (!c) {
      return (
        <div className="p-8">
          <Button
            variant="outline"
            onClick={() => navigate("AD-Clientes-ABM")}
          >
            Volver
          </Button>
          <p className="mt-4">No hay cliente seleccionado.</p>
        </div>
      );
    }

    const claims = c.claims ?? [];
    const interactions = c.interactions ?? [];

    const chipCanal = (ch: InteractionChannel) => {
      const map: Record<InteractionChannel, string> = {
        tel: "Teléfono",
        email: "Email",
        web: "Web",
        presencial: "Presencial",
      };
      return <Badge variant="outline">{map[ch] || ch}</Badge>;
    };

    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-5xl mx-auto space-y-8">
          <div className="flex items-center justify-between">
            <h1>
              Historial — {c.name} ({c.memberNumber})
            </h1>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => navigate("AD-Clientes-ABM")}
              >
                Volver
              </Button>
              <Button
                onClick={() => {
                  setSelectedClient(c);
                  navigate("AD-Cliente-Editar");
                }}
              >
                Editar
              </Button>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Reclamos del Cliente</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {claims.length ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Título</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Prioridad</TableHead>
                      <TableHead>Estado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {claims.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell>{r.id}</TableCell>
                        <TableCell>
                          <div>
                            <p>{r.title}</p>
                            <p className="text-xs text-muted-foreground">
                              {r.description}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>{r.type}</TableCell>
                        <TableCell>{r.date}</TableCell>
                        <TableCell>
                          {getStatusBadge(
                            r.priority,
                            "priority",
                          )}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(r.status)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="py-8 text-center text-muted-foreground">
                  Este cliente no tiene reclamos registrados.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  };

  // ===== Campos compartidos (Alta/Edición) =====
  function ClienteFormFields({
    values,
    setters,
  }: {
    values: {
      name: string;
      dni: string;
      memberNumber: string;
      active: boolean;
      email: string;
      phone: string;
      address: string;
      city: string;
      lat: string;
      lng: string;
      type?: Client["type"];
      segment?: Client["segment"];
      medidor: string;
      estadoInicial: string;
      fechaAlta: string;
    };
    setters: {
      setName: (v: string) => void;
      setDni: (v: string) => void;
      setMemberNumber: (v: string) => void;
      setActive: (v: boolean) => void;
      setEmail: (v: string) => void;
      setPhone: (v: string) => void;
      setAddress: (v: string) => void;
      setCity: (v: string) => void;
      setLat: (v: string) => void;
      setLng: (v: string) => void;
      setType: (v: Client["type"]) => void;
      setSegment: (v: Client["segment"]) => void;
      setMedidor: (v: string) => void;
      setEstadoInicial: (v: string) => void;
      setFechaAlta: (v: string) => void;
    };
  }) {
    const {
      name,
      dni,
      memberNumber,
      active,
      email,
      phone,
      address,
      city,
      lat,
      lng,
      type,
      segment,
      medidor,
      estadoInicial,
      fechaAlta,
    } = values;
    const {
      setName,
      setDni,
      setMemberNumber,
      setActive,
      setEmail,
      setPhone,
      setAddress,
      setCity,
      setLat,
      setLng,
      setType,
      setSegment,
      setMedidor,
      setEstadoInicial,
      setFechaAlta,
    } = setters;

    return (
      <>
        <div className="grid md:grid-cols-2 gap-4">
          <label className="space-y-1">
            <div>Nombre completo *</div>
            <input
              className="border p-2 w-full rounded"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Juan Pérez"
            />
          </label>
          <label className="space-y-1">
            <div>DNI *</div>
            <input
              className="border p-2 w-full rounded"
              value={dni}
              onChange={(e) => setDni(e.target.value)}
              placeholder="Solo números"
            />
          </label>
          <label className="space-y-1">
            <div>N° de socio *</div>
            <input
              className="border p-2 w-full rounded"
              value={memberNumber}
              onChange={(e) => setMemberNumber(e.target.value)}
              placeholder="S00XXXX"
            />
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
            />
            <span>Activo</span>
          </label>
        </div>

        <div className="space-y-2">
          <h2 className="font-medium">Contacto</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <label className="space-y-1">
              <div>Email</div>
              <input
                className="border p-2 w-full rounded"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="usuario@mail.com"
              />
            </label>
            <label className="space-y-1">
              <div>Teléfono</div>
              <input
                className="border p-2 w-full rounded"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+54 9 ..."
              />
            </label>
          </div>
        </div>

        <div className="space-y-2">
          <h2 className="font-medium">Domicilio</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <label className="space-y-1">
              <div>Dirección</div>
              <input
                className="border p-2 w-full rounded"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Calle y número"
              />
            </label>
            <label className="space-y-1">
              <div>Ciudad</div>
              <input
                className="border p-2 w-full rounded"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Localidad"
              />
            </label>
            <label className="space-y-1">
              <div>Latitud</div>
              <input
                className="border p-2 w-full rounded"
                value={lat}
                onChange={(e) => setLat(e.target.value)}
                placeholder="-34.6..."
              />
            </label>
            <label className="space-y-1">
              <div>Longitud</div>
              <input
                className="border p-2 w-full rounded"
                value={lng}
                onChange={(e) => setLng(e.target.value)}
                placeholder="-58.4..."
              />
            </label>
          </div>
        </div>

        <div className="space-y-2">
          <h2 className="font-medium">Clasificación</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <label className="space-y-1">
              <div>Tipo de cliente</div>
              <select
                className="border p-2 w-full rounded"
                value={type ?? ""}
                onChange={(e) =>
                  setType((e.target.value || undefined) as any)
                }
              >
                <option value="">(sin especificar)</option>
                <option value="residencial">Residencial</option>
                <option value="comercial">Comercial</option>
                <option value="publico">Público</option>
              </select>
            </label>
            <label className="space-y-1">
              <div>Segmento</div>
              <select
                className="border p-2 w-full rounded"
                value={segment ?? ""}
                onChange={(e) =>
                  setSegment(
                    (e.target.value || undefined) as any,
                  )
                }
              >
                <option value="">(sin especificar)</option>
                <option value="ts-g1">TS-G1</option>
                <option value="ts-g2">TS-G2</option>
                <option value="ingreso-bajo">
                  Ingreso Bajo
                </option>
                <option value="ingreso-medio">
                  Ingreso Medio
                </option>
                <option value="ingreso-alto">
                  Ingreso Alto
                </option>
              </select>
            </label>
          </div>
        </div>

        <div className="space-y-2">
          <h2 className="font-medium">
            Servicio — Electricidad
          </h2>
          <div className="grid md:grid-cols-3 gap-4">
            <label className="space-y-1">
              <div>N° de Medidor</div>
              <input
                className="border p-2 w-full rounded"
                value={medidor}
                onChange={(e) => setMedidor(e.target.value)}
                placeholder="MED-0001"
              />
            </label>
            <label className="space-y-1">
              <div>Estado Inicial (kWh)</div>
              <input
                className="border p-2 w-full rounded"
                value={estadoInicial}
                onChange={(e) =>
                  setEstadoInicial(e.target.value)
                }
                placeholder="0"
              />
            </label>
            <label className="space-y-1">
              <div>Fecha de Alta</div>
              <input
                type="date"
                className="border p-2 w-full rounded"
                value={fechaAlta}
                onChange={(e) => setFechaAlta(e.target.value)}
              />
            </label>
          </div>
        </div>
      </>
    );
  }

  // =======================
  // Router de pantallas
  // =======================
  const renderScreen = () => {
    switch (currentScreen) {
      // Cliente
      case "CL-Login":
        return <CLLogin />;
      case "CL-Dashboard":
        return <CLDashboard />;
      case "CL-Facturas-Listado":
        return <CLFacturasListado />;
      case "CL-Factura-Detalle":
        return <CLFacturaDetalle />;
      case "CL-Reclamos-Listado":
        return <CLReclamosListado />;
      case "CL-Reclamo-Nuevo":
        return <CLReclamoNuevo />;
      case "CL-Pago-Confirmacion":
        return <CLPagoConfirmacion />;
      case "AD-Metricas":
        return <ADMetricas />;

      // Operario
      case "OP-Asignados-Lista":
        return <OPAsignadosLista />;
      case "OP-Reclamo-Detalle":
        return <OPReclamoDetalle />;
      case "OP-Cargar-Insumos":
        return <OPCargarInsumos />;

      // Admin
      case "AD-Itinerario-Plan":
        return <ADItinerarioPlan />;
      case "AD-Asignados-Lista":
        return <ADAsignadosLista />;
      case "AD-Reclamo-Detalle":
        return <ADReclamoDetalle />;
      case "AD-Cuadrilla-Detalle":
        return <ADCuadrillaDetalle />;
      case "AD-OT-Resueltas":
        return <ADOTResueltas />;
      case "AD-Clientes-ABM":
        return <ADClientesABM />;
      case "AD-Cliente-Nuevo":
        return (
          <ADClienteNuevo
            onSave={(nuevo) => {
              setClients((prev) => [...prev, nuevo]);
              navigate("AD-Clientes-ABM");
            }}
            onCancel={() => navigate("AD-Clientes-ABM")}
          />
        );
      case "AD-Cliente-Editar":
        return <ADClienteEditar />;
      case "AD-Cliente-Historial":
        return <ADClienteHistorial />;

      default:
        return <CLLogin />;
    }
  };

  return <div className="min-h-screen">{renderScreen()}</div>;
}