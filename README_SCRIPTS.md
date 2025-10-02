# 🚀 Sistema de Gestión - Cooperativa Eléctrica

Sistema completo de gestión para cooperativa eléctrica con módulos de administración, clientes y operarios.

---

## 🎯 Inicio Rápido

### Iniciar el Sistema
```bash
./start.sh
```

### Detener el Sistema
```bash
./stop.sh
```

### Ver Estado
```bash
./status.sh
```

---

## 📋 Scripts Disponibles

| Script | Descripción | Uso |
|--------|-------------|-----|
| `start.sh` | Inicia backend y frontend | `./start.sh` |
| `stop.sh` | Detiene todos los servicios | `./stop.sh` |
| `restart.sh` | Reinicia el sistema completo | `./restart.sh` |
| `status.sh` | Muestra estado del sistema | `./status.sh` |
| `logs.sh` | Visualiza logs en tiempo real | `./logs.sh [backend\|frontend\|all\|errors]` |

---

## 🔧 Scripts Detallados

### 1️⃣ start.sh - Iniciar Sistema

**¿Qué hace?**
- ✅ Verifica y libera puertos (3001, 3002)
- ✅ Verifica dependencias
- ✅ Inicia Backend
- ✅ Inicia Frontend
- ✅ Verifica salud de servicios
- ✅ Guarda PIDs y logs

**Ejemplo:**
```bash
./start.sh

# Output:
# ✅ Backend corriendo en puerto 3001
# ✅ Frontend corriendo en puerto 3002
# 🌐 Accede al sistema en: http://localhost:3002
```

---

### 2️⃣ stop.sh - Detener Sistema

**¿Qué hace?**
- ✅ Detiene Frontend gracefully
- ✅ Detiene Backend gracefully
- ✅ Libera puertos
- ✅ Opción de limpiar procesos huérfanos
- ✅ Mantiene logs

**Ejemplo:**
```bash
./stop.sh

# Output:
# ✅ Frontend detenido
# ✅ Backend detenido
# ✅ Todos los puertos están libres
```

---

### 3️⃣ restart.sh - Reiniciar Sistema

**¿Qué hace?**
- ✅ Ejecuta stop.sh
- ✅ Espera 3 segundos
- ✅ Ejecuta start.sh

**Ejemplo:**
```bash
./restart.sh

# Útil después de cambios en configuración
```

---

### 4️⃣ status.sh - Estado del Sistema

**¿Qué hace?**
- ✅ Muestra estado de Backend
- ✅ Muestra estado de Frontend
- ✅ Muestra estado de PostgreSQL
- ✅ Muestra PIDs y memoria
- ✅ Muestra tamaño de logs
- ✅ Muestra URLs de acceso

**Ejemplo:**
```bash
./status.sh

# Output:
# 🔹 Backend: ✅ CORRIENDO (PID: 12345, 68.7 MB)
# 🔹 Frontend: ✅ CORRIENDO (PID: 12346, 169.1 MB)
# 🔹 Base de Datos: ✅ ACTIVO
# ✅ Sistema completamente operativo
```

---

### 5️⃣ logs.sh - Visualizar Logs

**¿Qué hace?**
- ✅ Muestra logs del backend
- ✅ Muestra logs del frontend
- ✅ Muestra logs de ambos
- ✅ Filtra solo errores

**Ejemplos:**
```bash
# Ver logs del backend
./logs.sh backend

# Ver logs del frontend
./logs.sh frontend

# Ver logs de ambos
./logs.sh all

# Ver solo errores
./logs.sh errors
```

---

## 📊 Estructura del Proyecto

```
PPIV/
├── start.sh              # Script para iniciar sistema
├── stop.sh               # Script para detener sistema
├── restart.sh            # Script para reiniciar sistema
├── status.sh             # Script para ver estado
├── logs.sh               # Script para ver logs
│
├── logs/                 # Logs del sistema
│   ├── backend.log       # Log del backend
│   ├── backend.pid       # PID del backend
│   ├── frontend.log      # Log del frontend
│   └── frontend.pid      # PID del frontend
│
├── backend/              # Backend Node.js + Express
│   ├── server.js
│   ├── models/
│   ├── controllers/
│   ├── routes/
│   └── ...
│
├── src/                  # Frontend React + Vite
│   ├── App.tsx
│   ├── main.tsx
│   ├── components/
│   └── ...
│
└── docs/                 # Documentación
    ├── SCRIPTS.md
    ├── PASARELA_PAGO_SIMULADA.md
    └── GUIA_PRUEBAS_PAGO.md
```

---

## 🎯 Flujo de Trabajo Típico

### Desarrollo Diario
```bash
# 1. Iniciar el sistema
./start.sh

# 2. Abrir en navegador: http://localhost:3002

# 3. Ver logs si hay problemas
./logs.sh all

# 4. Verificar estado
./status.sh

# 5. Al finalizar, detener
./stop.sh
```

### Después de Cambios de Configuración
```bash
# Reiniciar el sistema
./restart.sh
```

### Debugging
```bash
# Ver estado completo
./status.sh

# Ver logs en tiempo real
./logs.sh all

# Ver solo errores
./logs.sh errors

# Ver logs específicos
tail -f logs/backend.log
tail -f logs/frontend.log
```

---

## 🌐 Acceso al Sistema

### URLs Principales

| Servicio | URL | Puerto |
|----------|-----|--------|
| Frontend | http://localhost:3002 | 3002 |
| Backend | http://localhost:3001 | 3001 |
| API Salud | http://localhost:3001/api/salud | 3001 |

### Credenciales de Prueba

**Administrador:**
- Email: admin@cooperativa.com
- Password: admin123

**Cliente:**
- Email: cliente@example.com
- Password: cliente123

**Operario:**
- Email: operario@cooperativa.com
- Password: operario123

---

## ⚠️ Solución de Problemas

### Problema: "Puerto en uso"
```bash
# Ver qué está usando el puerto
lsof -i :3001
lsof -i :3002

# Forzar liberación
./stop.sh

# O manualmente
lsof -ti:3001 | xargs kill -9
lsof -ti:3002 | xargs kill -9
```

### Problema: "Backend no responde"
```bash
# Ver logs
./logs.sh backend

# Verificar configuración
cat backend/.env

# Reiniciar
./restart.sh
```

### Problema: "Frontend no carga"
```bash
# Ver logs
./logs.sh frontend

# Limpiar caché y reinstalar
rm -rf node_modules
npm install

# Reiniciar
./restart.sh
```

### Problema: "Base de datos no conecta"
```bash
# Verificar PostgreSQL
sudo systemctl status postgresql
sudo systemctl start postgresql

# Verificar configuración
cat backend/.env
```

---

## 🔧 Comandos Útiles

### Ver Procesos
```bash
# Ver todos los procesos del proyecto
ps aux | grep -E "node|vite" | grep PPIV

# Ver procesos en puertos específicos
lsof -i :3001 -i :3002 | grep LISTEN
```

### Gestión de Logs
```bash
# Ver últimas 50 líneas
tail -n 50 logs/backend.log

# Buscar errores
grep -i error logs/backend.log

# Limpiar logs antiguos
rm -f logs/*.log
```

### Gestión de Memoria
```bash
# Ver uso de memoria
ps aux --sort=-%mem | grep node | head -5

# Ver estadísticas del sistema
./status.sh
```

---

## 📦 Primera Instalación

Si es la primera vez que usas el proyecto:

```bash
# 1. Clonar repositorio
git clone https://github.com/damianclausi/PPIV.git
cd PPIV

# 2. Instalar dependencias
npm install
cd backend && npm install && cd ..

# 3. Configurar variables de entorno
cp backend/.env.example backend/.env
nano backend/.env  # Editar con tus credenciales

# 4. Dar permisos a scripts
chmod +x *.sh

# 5. Iniciar el sistema
./start.sh
```

---

## 📚 Documentación Adicional

- **Pasarela de Pago:** [docs/PASARELA_PAGO_SIMULADA.md](docs/PASARELA_PAGO_SIMULADA.md)
- **Guía de Pruebas:** [docs/GUIA_PRUEBAS_PAGO.md](docs/GUIA_PRUEBAS_PAGO.md)
- **Scripts:** [docs/SCRIPTS.md](docs/SCRIPTS.md)

---

## 🎨 Características del Sistema

### Módulo Administrador
- ✅ Dashboard con estadísticas
- ✅ CRUD completo de socios
- ✅ Gestión de reclamos
- ✅ Gestión de empleados
- ✅ Asignación de operarios

### Módulo Cliente
- ✅ Ver facturas
- ✅ Crear y ver reclamos
- ✅ Pago online con pasarela simulada
- ✅ Dashboard personalizado

### Módulo Operario
- ✅ Ver reclamos asignados
- ✅ Actualizar estado de reclamos
- ✅ Cargar insumos utilizados
- ✅ Gestión de tareas

---

## 🚀 Tecnologías

- **Frontend:** React 18.3.1 + Vite 6.3.5 + TypeScript
- **Backend:** Node.js + Express
- **Base de Datos:** PostgreSQL
- **UI:** Shadcn/ui + Tailwind CSS
- **Icons:** Lucide React

---

## 📞 Soporte

Para dudas o problemas:

1. Verificar logs: `./logs.sh errors`
2. Verificar estado: `./status.sh`
3. Revisar documentación en `/docs`
4. Contactar al equipo de desarrollo

---

## 🔄 Actualización

Para actualizar el sistema:

```bash
# 1. Detener el sistema
./stop.sh

# 2. Actualizar código
git pull origin main

# 3. Actualizar dependencias
npm install
cd backend && npm install && cd ..

# 4. Iniciar el sistema
./start.sh
```

---

**Última actualización:** Octubre 2, 2025

**Versión:** 1.0.0

**Estado:** ✅ Producción
