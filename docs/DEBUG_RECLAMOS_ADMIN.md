# 🔍 Diagnóstico: Admin no ve Reclamos

## ✅ Estado del Sistema

### Base de Datos
- ✅ **32 reclamos** en total
- ✅ **11 PENDIENTES** 
- ✅ **11 EN CURSO**
- ✅ **10 RESUELTOS**

### Backend
- ✅ Modelo `Reclamo.js` - Query correcta
- ✅ Controlador `AdministradorController.js` - Endpoint funcional
- ✅ Ruta `/api/administradores/reclamos` - Configurada

### Frontend
- ✅ Componente `GestionReclamos.jsx` - Existe
- ✅ Hook `useReclamos` - Configurado
- ✅ Servicio `administradorService.listarReclamos()` - Implementado
- ✅ Ruta `/dashboard/admin/reclamos` - En App.tsx
- ✅ Botón en Dashboard - "Gestionar Reclamos"

---

## 🎯 Pasos para Verificar en el Navegador

### 1. Abrir la Consola del Navegador (F12)

```
Dashboard → Gestionar Reclamos
```

### 2. Verificar Errores

Buscar en la consola:
- ❌ Errores de red (400, 401, 404, 500)
- ❌ Errores de CORS
- ❌ Errores de JavaScript
- ❌ Warnings de React

### 3. Ver Network Tab

- Ir a "Network" en DevTools
- Buscar la petición a `/api/administradores/reclamos`
- Ver:
  - **Status:** Debería ser 200
  - **Response:** Debería tener `exito: true` y array de reclamos
  - **Headers:** Authorization token presente

---

## 🧪 Test Manual del Backend

```bash
# 1. Login (obtener token)
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"monica.administradora@cooperativa-ugarte.com.ar","password":"password123"}'

# 2. Copiar el token de la respuesta

# 3. Listar reclamos
curl -X GET "http://localhost:3001/api/administradores/reclamos?pagina=1&limite=20" \
  -H "Authorization: Bearer TU_TOKEN_AQUI"
```

**Respuesta esperada:**
```json
{
  "exito": true,
  "datos": {
    "reclamos": [...],
    "total": 32,
    "pagina": 1,
    "limite": 20,
    "totalPaginas": 2
  }
}
```

---

## 🔧 Posibles Causas y Soluciones

### Causa 1: Token Expirado o Inválido
**Síntoma:** Error 401 Unauthorized

**Solución:**
```javascript
// Verificar en: src/services/api.js
getToken() {
  return localStorage.getItem('token');
}
```

**Acción:** 
1. Hacer logout
2. Login nuevamente
3. Intentar acceder a reclamos

---

### Causa 2: Filtros Iniciales Incorrectos
**Síntoma:** Componente carga pero no muestra nada

**Verificar en:** `src/components/admin/GestionReclamos.jsx` línea 13

```javascript
const [filtros, setFiltros] = useState({
  busqueda: '',
  estado: 'todos',     // ✅ Debe ser 'todos' (sin filtro)
  prioridad: 'todas',  // ✅ Debe ser 'todas' (sin filtro)
  tipo: 'todos',       // ✅ Debe ser 'todos' (sin filtro)
  pagina: 1,
  limite: 20
});
```

---

### Causa 3: Componente No Renderiza los Datos
**Síntoma:** Hook carga datos pero tabla vacía

**Verificar:** Que el componente mapee correctamente los datos

```jsx
{reclamos.map(reclamo => (
  <tr key={reclamo.reclamo_id}>
    <td>{reclamo.reclamo_id}</td>
    <td>{reclamo.socio_nombre} {reclamo.socio_apellido}</td>
    {/* ... más columnas ... */}
  </tr>
))}
```

---

### Causa 4: Estado de Carga Infinito
**Síntoma:** Spinner gira eternamente

**Verificar:** Hook `useReclamos` en `src/hooks/useAdministrador.js`

```javascript
const { reclamos, total, cargando, error } = useReclamos(filtros);

console.log('Cargando:', cargando);
console.log('Error:', error);
console.log('Reclamos:', reclamos);
console.log('Total:', total);
```

---

## 🐛 Debugging Paso a Paso

### 1. Agregar console.logs en el Hook

**Archivo:** `src/hooks/useAdministrador.js` línea ~125

```javascript
const cargarReclamos = useCallback(async () => {
  try {
    setCargando(true);
    console.log('🔄 Cargando reclamos con filtros:', filtros);
    
    const data = await administradorService.listarReclamos(filtros);
    
    console.log('✅ Datos recibidos:', data);
    console.log('✅ Reclamos:', data.datos.reclamos);
    console.log('✅ Total:', data.datos.total);
    
    setReclamos(data.datos.reclamos || data.datos);
    setTotal(data.datos.total || 0);
    setPagina(data.datos.pagina || 1);
    setTotalPaginas(data.datos.totalPaginas || 0);
    setError(null);
  } catch (err) {
    console.error('❌ Error al cargar reclamos:', err);
    setError(err.message);
  } finally {
    setCargando(false);
  }
}, [filtrosMemo]);
```

### 2. Agregar console.logs en el Servicio

**Archivo:** `src/services/administradorService.js` línea ~77

```javascript
async listarReclamos(filtros = {}) {
  console.log('📡 Llamando API con filtros:', filtros);
  
  const params = new URLSearchParams();
  
  // ... construcción de params ...
  
  const query = params.toString() ? `?${params.toString()}` : '';
  const url = `/api/administradores/reclamos${query}`;
  
  console.log('📡 URL final:', url);
  
  const response = await apiClient.get(url);
  
  console.log('📡 Respuesta:', response);
  
  return response;
}
```

---

## 📋 Checklist de Verificación

- [ ] Backend corriendo (puerto 3001)
- [ ] Frontend corriendo (puerto 3002)
- [ ] Usuario admin logueado
- [ ] Token válido en localStorage
- [ ] Navegador en `/dashboard/admin/reclamos`
- [ ] Consola del navegador abierta (F12)
- [ ] Network tab monitoreando peticiones
- [ ] Verificar petición a `/api/administradores/reclamos`
- [ ] Verificar status 200
- [ ] Verificar respuesta con datos
- [ ] Verificar que `reclamos` array tiene elementos

---

## 🎯 Prueba Rápida

### En la Consola del Navegador

```javascript
// 1. Verificar token
localStorage.getItem('token')

// 2. Hacer petición manual
fetch('http://localhost:3001/api/administradores/reclamos?limite=5', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token')}`
  }
})
.then(r => r.json())
.then(console.log)
```

**Debería mostrar:**
```javascript
{
  exito: true,
  datos: {
    reclamos: [
      {
        reclamo_id: 32,
        socio_nombre: "María Elena",
        socio_apellido: "González",
        tipo_reclamo: "ADMINISTRATIVO",
        detalle_reclamo: "Facturación",
        estado: "PENDIENTE",
        // ...
      },
      // ... más reclamos
    ],
    total: 32
  }
}
```

---

## 💡 Solución Temporal: Componente de Prueba

Si todo lo anterior falla, crear componente mínimo de prueba:

**Archivo:** `src/components/admin/TestReclamos.jsx`

```jsx
import React, { useState, useEffect } from 'react';
import apiClient from '../../services/api';

export default function TestReclamos() {
  const [reclamos, setReclamos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function cargar() {
      try {
        console.log('🔄 Cargando reclamos...');
        const data = await apiClient.get('/api/administradores/reclamos');
        console.log('✅ Datos:', data);
        setReclamos(data.datos.reclamos || []);
      } catch (err) {
        console.error('❌ Error:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    cargar();
  }, []);

  if (loading) return <div>Cargando...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="p-4">
      <h1>Test Reclamos ({reclamos.length})</h1>
      <pre>{JSON.stringify(reclamos, null, 2)}</pre>
    </div>
  );
}
```

Agregar ruta en `App.tsx`:
```jsx
<Route path="/test-reclamos" element={<TestReclamos />} />
```

Ir a: `http://localhost:3002/test-reclamos`

---

## 📊 Resultados del Diagnóstico

✅ **Base de datos:** 32 reclamos disponibles
✅ **Backend:** Consulta SQL funcional
✅ **Endpoint:** `/api/administradores/reclamos` operativo
✅ **Frontend:** Componentes y hooks implementados

**Siguiente paso:** Verificar en el navegador con DevTools abierto

---

## 🆘 Si Nada Funciona

1. Limpiar caché del navegador
2. Borrar localStorage
3. Hacer logout/login
4. Reiniciar backend
5. Reiniciar frontend
6. Verificar que no hay rate limiting activo

---

**Última actualización:** 9 de octubre de 2025
