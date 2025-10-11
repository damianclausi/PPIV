# Documentación de la API - Sistema PPIV

## Información General

- **URL Base**: `http://localhost:3001/api`
- **Autenticación**: JWT (JSON Web Token)
- **Formato de respuesta**: JSON
- **Headers requeridos**: `Content-Type: application/json`

## Autenticación

Todas las rutas protegidas requieren un token JWT en el header:

```
Authorization: Bearer {token}
```

El token se obtiene al hacer login y tiene una validez de 24 horas.

---

## Endpoints de Autenticación

### POST /auth/login

Autenticar usuario y obtener token JWT.

**Request Body:**
```json
{
  "email": "mariaelena.gonzalez@hotmail.com",
  "password": "password123"
}
```

**Response (200 OK):**
```json
{
  "exito": true,
  "mensaje": "Login exitoso",
  "datos": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "usuario": {
      "usuario_id": 2,
      "email": "mariaelena.gonzalez@hotmail.com",
      "roles": ["CLIENTE"],
      "socio_id": 1,
      "empleado_id": null
    }
  }
}
```

**Errores:**
- `400` - Email y password son requeridos
- `401` - Credenciales inválidas
- `500` - Error del servidor

---

### GET /auth/perfil

Obtener perfil del usuario autenticado.

**Headers:** `Authorization: Bearer {token}`

**Response (200 OK):**
```json
{
  "exito": true,
  "datos": {
    "usuario_id": 2,
    "email": "mariaelena.gonzalez@hotmail.com",
    "roles": ["CLIENTE"],
    "socio_id": 1,
    "empleado_id": null
  }
}
```

---

### POST /auth/verificar

Verificar validez del token JWT.

**Headers:** `Authorization: Bearer {token}`

**Response (200 OK):**
```json
{
  "exito": true,
  "mensaje": "Token válido",
  "datos": {
    "usuario_id": 2,
    "email": "mariaelena.gonzalez@hotmail.com",
    "roles": ["CLIENTE"]
  }
}
```

---

## Endpoints de Clientes

**Roles requeridos:** CLIENTE

Todos los endpoints requieren autenticación y rol de CLIENTE.

### GET /clientes/perfil

Obtener perfil completo del socio.

**Response (200 OK):**
```json
{
  "exito": true,
  "datos": {
    "socio_id": 1,
    "nombre": "María Elena",
    "apellido": "González",
    "dni": "33456789",
    "telefono": "2914567890",
    "email": "mariaelena.gonzalez@hotmail.com",
    "domicilio": "Calle Falsa 123, Ugarte",
    "fecha_alta": "2020-01-15T00:00:00.000Z",
    "estado": "activo"
  }
}
```

---

### GET /clientes/cuentas

Obtener todas las cuentas del socio.

**Response (200 OK):**
```json
{
  "exito": true,
  "datos": [
    {
      "cuenta_id": 1,
      "numero_cuenta": "001-0001",
      "tipo_servicio": "Residencial",
      "domicilio_servicio": "Calle Falsa 123, Ugarte",
      "estado": "activa",
      "fecha_alta": "2020-01-15T00:00:00.000Z"
    }
  ]
}
```

---

### GET /clientes/dashboard

Obtener resumen del dashboard del cliente.

**Response (200 OK):**
```json
{
  "exito": true,
  "datos": {
    "socio": {
      "nombre": "María Elena",
      "apellido": "González",
      "email": "mariaelena.gonzalez@hotmail.com"
    },
    "resumen_facturas": {
      "total": 12,
      "pendientes": 1,
      "pagadas": 11,
      "monto_pendiente": 4500.50
    },
    "resumen_reclamos": {
      "total": 3,
      "pendientes": 1,
      "en_proceso": 1,
      "resueltos": 1
    },
    "ultima_factura": {
      "factura_id": 1,
      "numero_factura": "001-00000012",
      "periodo": "2024-09",
      "monto_total": 4500.50,
      "vencimiento": "2024-10-10T00:00:00.000Z",
      "estado": "pendiente"
    }
  }
}
```

---

### GET /clientes/facturas

Obtener lista de facturas del socio con filtros opcionales.

**Query Parameters:**
- `estado` (opcional): `pendiente`, `pagada`, `vencida`
- `limite` (opcional): Número de resultados (default: 10)
- `pagina` (opcional): Página de resultados (default: 1)

**Ejemplo:** `/clientes/facturas?estado=pendiente&limite=5&pagina=1`

**Response (200 OK):**
```json
{
  "exito": true,
  "datos": {
    "facturas": [
      {
        "factura_id": 1,
        "numero_factura": "001-00000012",
        "cuenta_id": 1,
        "numero_cuenta": "001-0001",
        "periodo": "2024-09",
        "fecha_emision": "2024-09-01T00:00:00.000Z",
        "vencimiento": "2024-10-10T00:00:00.000Z",
        "consumo_kwh": 150,
        "monto_consumo": 3000.00,
        "monto_otros": 500.50,
        "monto_total": 4500.50,
        "estado": "pendiente"
      }
    ],
    "paginacion": {
      "total": 12,
      "pagina_actual": 1,
      "total_paginas": 3,
      "limite": 5
    }
  }
}
```

---

### GET /clientes/facturas/:id

Obtener detalle de una factura específica.

**Response (200 OK):**
```json
{
  "exito": true,
  "datos": {
    "factura_id": 1,
    "numero_factura": "001-00000012",
    "cuenta_id": 1,
    "numero_cuenta": "001-0001",
    "periodo": "2024-09",
    "fecha_emision": "2024-09-01T00:00:00.000Z",
    "vencimiento": "2024-10-10T00:00:00.000Z",
    "consumo_kwh": 150,
    "monto_consumo": 3000.00,
    "monto_otros": 500.50,
    "monto_total": 4500.50,
    "estado": "pendiente"
  }
}
```

---

### GET /clientes/reclamos

Obtener lista de reclamos del socio.

**Query Parameters:**
- `estado` (opcional): Filtrar por estado del reclamo

**Response (200 OK):**
```json
{
  "exito": true,
  "datos": [
    {
      "reclamo_id": 1,
      "tipo_reclamo": "Corte de suministro",
      "descripcion": "Sin luz desde hace 2 horas",
      "estado": "pendiente",
      "prioridad": "alta",
      "fecha_reclamo": "2024-10-01T10:30:00.000Z",
      "fecha_resolucion": null,
      "observaciones": null
    }
  ]
}
```

---

### GET /clientes/reclamos/:id

Obtener detalle de un reclamo específico.

**Response (200 OK):**
```json
{
  "exito": true,
  "datos": {
    "reclamo_id": 1,
    "socio_id": 1,
    "socio_nombre": "María Elena González",
    "cuenta_id": 1,
    "numero_cuenta": "001-0001",
    "tipo_reclamo_id": 1,
    "tipo_reclamo": "Corte de suministro",
    "descripcion": "Sin luz desde hace 2 horas",
    "estado_id": 1,
    "estado": "pendiente",
    "prioridad_id": 3,
    "prioridad": "alta",
    "fecha_reclamo": "2024-10-01T10:30:00.000Z",
    "fecha_resolucion": null,
    "operario_asignado": null,
    "observaciones": null
  }
}
```

---

### POST /clientes/reclamos

Crear un nuevo reclamo.

**Request Body:**
```json
{
  "cuenta_id": 1,
  "tipo_reclamo_id": 1,
  "descripcion": "Descripción del problema",
  "prioridad_id": 2
}
```

**Response (201 Created):**
```json
{
  "exito": true,
  "mensaje": "Reclamo creado exitosamente",
  "datos": {
    "reclamo_id": 15,
    "estado": "pendiente",
    "fecha_reclamo": "2024-10-02T14:30:00.000Z"
  }
}
```

---

## Endpoints de Operarios

**Roles requeridos:** OPERARIO

Todos los endpoints requieren autenticación y rol de OPERARIO.

### GET /operarios/perfil

Obtener perfil del operario.

**Response (200 OK):**
```json
{
  "exito": true,
  "datos": {
    "empleado_id": 7,
    "nombre": "Pedro Ramón",
    "apellido": "García",
    "dni": "28123456",
    "email": "pedro.electricista@cooperativa-ugarte.com.ar",
    "telefono": "2914445566",
    "cargo": "Técnico Electricista",
    "fecha_ingreso": "2018-03-01T00:00:00.000Z",
    "estado": "activo"
  }
}
```

---

### GET /operarios/dashboard

Obtener dashboard con estadísticas del operario.

**Response (200 OK):**
```json
{
  "exito": true,
  "datos": {
    "operario": {
      "nombre": "Pedro Ramón",
      "apellido": "García",
      "cargo": "Técnico Electricista"
    },
    "reclamos_asignados": {
      "total": 15,
      "pendientes": 3,
      "en_proceso": 5,
      "resueltos_hoy": 2
    }
  }
}
```

---

### GET /operarios/reclamos

Obtener lista de reclamos asignados al operario.

**Query Parameters:**
- `estado` (opcional): Filtrar por estado

**Response (200 OK):**
```json
{
  "exito": true,
  "datos": [
    {
      "reclamo_id": 1,
      "socio_nombre": "María Elena González",
      "tipo_reclamo": "Corte de suministro",
      "descripcion": "Sin luz desde hace 2 horas",
      "estado": "en_proceso",
      "prioridad": "alta",
      "fecha_reclamo": "2024-10-01T10:30:00.000Z",
      "domicilio": "Calle Falsa 123, Ugarte"
    }
  ]
}
```

---

### GET /operarios/reclamos/:id

Obtener detalle de un reclamo asignado.

**Response:** Similar a GET /clientes/reclamos/:id

---

### PATCH /operarios/reclamos/:id/estado

Actualizar estado de un reclamo.

**Request Body:**
```json
{
  "estado_id": 2,
  "observaciones": "Se realizó la reparación"
}
```

**Response (200 OK):**
```json
{
  "exito": true,
  "mensaje": "Estado del reclamo actualizado",
  "datos": {
    "reclamo_id": 1,
    "estado": "resuelto",
    "fecha_resolucion": "2024-10-02T15:00:00.000Z"
  }
}
```

---

## Endpoints de Administradores

**Roles requeridos:** ADMIN

Todos los endpoints requieren autenticación y rol de ADMIN.

### GET /administradores/perfil

Obtener perfil del administrador.

**Response:** Similar a GET /operarios/perfil

---

### GET /administradores/dashboard

Obtener dashboard con estadísticas generales del sistema.

**Response (200 OK):**
```json
{
  "exito": true,
  "datos": {
    "administrador": {
      "nombre": "Mónica",
      "apellido": "Administradora",
      "cargo": "Gerente Administrativa"
    },
    "estadisticas": {
      "socios": {
        "total": 6,
        "activos": 6,
        "nuevos_mes": 0
      },
      "reclamos": {
        "total": 13,
        "pendientes": 5,
        "en_proceso": 4,
        "resueltos": 4
      },
      "facturacion": {
        "monto_total_mes": 45000.00,
        "facturas_pendientes": 8,
        "facturas_pagadas": 20
      }
    }
  }
}
```

---

### GET /administradores/socios

Listar todos los socios del sistema.

**Query Parameters:**
- `estado` (opcional): Filtrar por estado
- `limite` (opcional): Resultados por página
- `pagina` (opcional): Página actual

**Response (200 OK):**
```json
{
  "exito": true,
  "datos": {
    "socios": [
      {
        "socio_id": 1,
        "nombre": "María Elena",
        "apellido": "González",
        "dni": "33456789",
        "email": "mariaelena.gonzalez@hotmail.com",
        "telefono": "2914567890",
        "domicilio": "Calle Falsa 123, Ugarte",
        "estado": "activo",
        "fecha_alta": "2020-01-15T00:00:00.000Z"
      }
    ],
    "paginacion": {
      "total": 6,
      "pagina_actual": 1,
      "total_paginas": 1,
      "limite": 10
    }
  }
}
```

---

### GET /administradores/socios/:id

Obtener detalle de un socio específico.

**Response (200 OK):**
```json
{
  "exito": true,
  "datos": {
    "socio_id": 1,
    "nombre": "María Elena",
    "apellido": "González",
    "dni": "33456789",
    "email": "mariaelena.gonzalez@hotmail.com",
    "telefono": "2914567890",
    "domicilio": "Calle Falsa 123, Ugarte",
    "estado": "activo",
    "fecha_alta": "2020-01-15T00:00:00.000Z",
    "cuentas": [
      {
        "cuenta_id": 1,
        "numero_cuenta": "001-0001",
        "tipo_servicio": "Residencial",
        "estado": "activa"
      }
    ],
    "reclamos_totales": 3,
    "facturas_pendientes": 1
  }
}
```

---

### PUT /administradores/socios/:id

Actualizar datos de un socio.

**Request Body:**
```json
{
  "telefono": "2914567890",
  "email": "nuevo_email@example.com",
  "domicilio": "Nueva dirección 456",
  "estado": "activo"
}
```

**Response (200 OK):**
```json
{
  "exito": true,
  "mensaje": "Socio actualizado exitosamente",
  "datos": {
    "socio_id": 1,
    "actualizado": true
  }
}
```

---

### GET /administradores/reclamos

Listar todos los reclamos del sistema.

**Query Parameters:**
- `estado` (opcional): Filtrar por estado
- `prioridad` (opcional): Filtrar por prioridad
- `tipo` (opcional): Filtrar por tipo de reclamo
- `limite` (opcional): Resultados por página
- `pagina` (opcional): Página actual

**Response:** Similar a GET /clientes/reclamos pero con todos los reclamos

---

### GET /administradores/reclamos/:id

Obtener detalle de un reclamo específico.

**Response:** Similar a GET /clientes/reclamos/:id

---

### PATCH /administradores/reclamos/:id/asignar

Asignar un operario a un reclamo.

**Request Body:**
```json
{
  "operario_id": 7,
  "prioridad_id": 3
}
```

**Response (200 OK):**
```json
{
  "exito": true,
  "mensaje": "Operario asignado exitosamente",
  "datos": {
    "reclamo_id": 1,
    "operario_asignado": "Pedro Ramón García",
    "estado": "en_proceso"
  }
}
```

---

### GET /administradores/empleados

Listar todos los empleados del sistema.

**Response (200 OK):**
```json
{
  "exito": true,
  "datos": [
    {
      "empleado_id": 7,
      "nombre": "Pedro Ramón",
      "apellido": "García",
      "dni": "28123456",
      "email": "pedro.electricista@cooperativa-ugarte.com.ar",
      "cargo": "Técnico Electricista",
      "fecha_ingreso": "2018-03-01T00:00:00.000Z",
      "estado": "activo",
      "reclamos_asignados": 5,
      "reclamos_resueltos": 45
    }
  ]
}
```

---

## Códigos de Estado HTTP

- `200 OK` - Solicitud exitosa
- `201 Created` - Recurso creado exitosamente
- `400 Bad Request` - Datos inválidos o faltantes
- `401 Unauthorized` - No autenticado o token inválido
- `403 Forbidden` - No autorizado (sin permisos de rol)
- `404 Not Found` - Recurso no encontrado
- `500 Internal Server Error` - Error del servidor

---

## Estructura de Respuestas

Todas las respuestas siguen el siguiente formato:

**Respuesta Exitosa:**
```json
{
  "exito": true,
  "mensaje": "Mensaje descriptivo (opcional)",
  "datos": { /* Datos de respuesta */ }
}
```

**Respuesta de Error:**
```json
{
  "exito": false,
  "mensaje": "Descripción del error",
  "error": "Detalle técnico del error (solo en desarrollo)"
}
```

---

## Ejemplos de Uso con cURL

### Login
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"mariaelena.gonzalez@hotmail.com","password":"password123"}'
```

### Obtener perfil
```bash
curl http://localhost:3001/api/clientes/perfil \
  -H "Authorization: Bearer {tu_token}"
```

### Crear reclamo
```bash
curl -X POST http://localhost:3001/api/clientes/reclamos \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {tu_token}" \
  -d '{
    "cuenta_id": 1,
    "tipo_reclamo_id": 1,
    "descripcion": "Sin suministro eléctrico",
    "prioridad_id": 3
  }'
```

---

## Notas Adicionales

- Todos los campos de fecha están en formato ISO 8601
- Los montos están en formato decimal con 2 decimales
- Los tokens JWT expiran en 24 horas
- Las contraseñas están hasheadas con bcrypt (10 rounds)
- La API implementa CORS para desarrollo local

---

**Última actualización:** Octubre 2025
**Versión:** 1.0.0
