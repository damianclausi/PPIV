# Documentación Oficial del Proyecto

**Proyecto:** PPIV - Sistema de Gestión Cooperativa Eléctrica "Gobernador Ugarte"  
**Equipo:** El Quinto Elemento  
**Comisión:** D

---

## Documentos Incluidos

### 1. VERIFICACION_CASOS_DE_USO.md
**Documento principal de entrega**

Verificación completa de todos los casos de uso especificados en el proyecto:
- 4 Casos de Uso de Cliente (100% implementados)
- 4 Casos de Uso de Operario (100% implementados)
- 7 Casos de Uso de Administrativo (100% implementados)
- Estadísticas del proyecto (15,300 líneas de código, 95 endpoints, 67 componentes)
- Estructura de archivos completa
- Funcionalidades extras implementadas

**Empezar por aquí para una visión completa del proyecto.**

---

### 2. DATABASE.md
Esquema de base de datos PostgreSQL:
- 15 tablas con relaciones
- Restricciones y constraints
- Índices para optimización
- Diagramas ER
- Queries de ejemplo

---

### 3. API.md
Documentación de endpoints del backend:
- 95 endpoints REST organizados por módulo
- Métodos, rutas, parámetros
- Ejemplos de request/response
- Códigos de estado HTTP
- Autenticación y autorización

---

### 4. SEGURIDAD.md
Implementación de seguridad del sistema:
- Autenticación JWT
- Encriptación de contraseñas (bcrypt)
- Rate limiting (anti fuerza bruta)
- CORS y Helmet
- Validaciones y sanitización
- Manejo de errores

---

### 5. ARQUITECTURA_ESTADOS.md
Máquina de estados finitos (FSM):
- Estados de reclamos (PENDIENTE, EN_CURSO, RESUELTO)
- Estados de OTs (PENDIENTE, EN_CURSO, RESUELTO)
- Estados de OTs Administrativas (3 estados con auto-actualización)
- Transiciones válidas
- Reglas de negocio

---

### 6. IMPLEMENTACION_ITINERARIO.md
Implementación del módulo de itinerarios (CU-07):
- Arquitectura del sistema de itinerarios
- Patrón de diseño utilizado
- Detalles técnicos
- Guía de uso para administrativos y operarios

---

## Inicio Rápido

Para ejecutar el proyecto:

1. **Clonar el repositorio:**
   ```bash
   git clone https://github.com/damianclausi2/proyecto-integrador-devops.git
   cd proyecto-integrador-devops
   git checkout integracion-base-datos
   ```

2. **Instalar dependencias:**
   ```bash
   npm install
   cd backend && npm install && cd ..
   ```

3. **Configurar variables de entorno:**
   - Ver instrucciones en el README principal

4. **Iniciar el sistema:**
   ```bash
   ./start.sh
   ```

5. **Acceder:**
   - Frontend: http://localhost:3002
   - Backend API: http://localhost:3001

---

## Resumen del Proyecto

| Aspecto | Detalle |
|---------|---------|
| **Frontend** | React 18.3.1 + TypeScript + Vite |
| **Backend** | Node.js + Express + PostgreSQL |
| **UI Framework** | shadcn/ui + Tailwind CSS |
| **Autenticación** | JWT + bcrypt |
| **Base de Datos** | PostgreSQL (15 tablas) |
| **Endpoints API** | 95 endpoints REST |
| **Componentes** | 67 componentes React |
| **Líneas de Código** | ~15,300 líneas |
| **Casos de Uso** | 15/15 implementados (100%) |

---

## Casos de Uso Principales

### Cliente (4 CUs)
- CU-01: Iniciar Sesión
- CU-02: Consultar Facturas
- CU-03: Realizar Pago Online
- CU-04: Gestionar Reclamos

### Operario (4 CUs)
- CU-05: Gestionar Reclamos Asignados (Vista Kanban)
- CU-06: Cargar Insumos
- CU-07: Ver Itinerario de Cuadrilla
- CU-08: Tomar OT de Itinerario

### Administrativo (7 CUs)
- CU-09: Gestionar Socios (ABM)
- CU-10: Gestionar Reclamos
- CU-11: Gestionar Empleados
- CU-12: Gestionar OTs Administrativas
- CU-13: Ver Métricas y KPIs
- CU-14: Gestionar Cuadrillas
- CU-15: Armar Itinerario de Cuadrillas

---

## Estructura del Proyecto

```
PPIV/
├── src/                    # Frontend React
│   ├── components/         # Componentes UI
│   ├── hooks/             # Custom hooks
│   ├── services/          # Llamadas API
│   └── contexts/          # Contextos React
├── backend/               # Backend Node.js
│   ├── controllers/       # Lógica de negocio
│   ├── models/           # Modelos de datos
│   ├── routes/           # Rutas API
│   └── middleware/       # Middlewares
├── docs/                 # Esta carpeta (documentación oficial)
└── README.md            # Instrucciones de instalación
```

---

## Enlaces Útiles

- **Repositorio:** https://github.com/damianclausi2/proyecto-integrador-devops
- **Branch principal:** `integracion-base-datos`
- **Prototipos Figma:** (incluidos en el proyecto)

---

## Equipo de Desarrollo

**El Quinto Elemento - Comisión D**

---

## Notas Importantes

1. **Base de datos:** Se respetó la restricción de NO agregar campos nuevos al schema existente.
2. **Itinerarios:** Implementación híbrida usando el campo `observaciones` y patrón `empleado_id NULL`.
3. **Seguridad:** Sistema completo con JWT, rate limiting, y validaciones.
4. **Testing:** Infraestructura de Jest configurada (tests pendientes).

---

**Fecha de última actualización:** 11 de Octubre de 2025  
**Versión:** 1.0  
**Estado:** Proyecto completo y funcional
