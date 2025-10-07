# 🚀 Scripts de Gestión del Sistema

Este directorio contiene scripts para iniciar y detener fácilmente todo el sistema de la cooperativa eléctrica.

---

## 📁 Scripts Disponibles

### 1️⃣ `start.sh` - Iniciar el Sistema

Inicia automáticamente el backend y frontend del sistema.

**Uso:**
```bash
./start.sh
```

**¿Qué hace?**
- ✅ Verifica y libera puertos 3001 y 3002
- ✅ Verifica dependencias (node_modules)
- ✅ Inicia Backend en puerto 3001
- ✅ Inicia Frontend en puerto 3002
- ✅ Verifica que ambos servicios estén corriendo
- ✅ Muestra URLs de acceso y PIDs
- ✅ Guarda logs en `logs/backend.log` y `logs/frontend.log`
- ✅ Guarda PIDs en `logs/backend.pid` y `logs/frontend.pid`

**Output esperado:**
```
╔══════════════════════════════════════════════════════════════╗
║        🚀 INICIANDO SISTEMA COOPERATIVA ELÉCTRICA           ║
╚══════════════════════════════════════════════════════════════╝

📋 Paso 1: Verificando puertos...
✅ Puertos liberados

📋 Paso 2: Verificando dependencias...
✅ Dependencias verificadas

📋 Paso 3: Iniciando Backend (Puerto 3001)...
⏳ Esperando que Backend esté disponible en puerto 3001...
✅ Backend está corriendo en puerto 3001
✅ Backend iniciado correctamente (PID: 12345)
🔍 Verificando salud del backend...
✅ Backend respondiendo correctamente

📋 Paso 4: Iniciando Frontend (Puerto 3002)...
⏳ Esperando que Frontend esté disponible en puerto 3002...
✅ Frontend está corriendo en puerto 3002
✅ Frontend iniciado correctamente (PID: 12346)

╔══════════════════════════════════════════════════════════════╗
║              ✅ SISTEMA INICIADO EXITOSAMENTE               ║
╚══════════════════════════════════════════════════════════════╝

📊 Estado de los Servicios:

  🔹 Backend:
     URL: http://localhost:3001
     PID: 12345
     Log: logs/backend.log

  🔹 Frontend:
     URL: http://localhost:3002
     PID: 12346
     Log: logs/frontend.log

🌐 Accede al sistema en: http://localhost:3002

💡 Para detener el sistema, ejecuta: ./stop.sh
💡 Para ver logs en tiempo real:
   Backend:  tail -f logs/backend.log
   Frontend: tail -f logs/frontend.log
```

---

### 2️⃣ `stop.sh` - Detener el Sistema

Detiene gracefully el backend y frontend del sistema.

**Uso:**
```bash
./stop.sh
```

**¿Qué hace?**
- ✅ Detiene Frontend (gracefully primero, luego fuerza si es necesario)
- ✅ Detiene Backend (gracefully primero, luego fuerza si es necesario)
- ✅ Libera puertos 3001 y 3002
- ✅ Verifica que todos los procesos hayan sido detenidos
- ✅ Opción de limpiar procesos huérfanos
- ✅ Mantiene logs para revisión

**Output esperado:**
```
╔══════════════════════════════════════════════════════════════╗
║        🛑 DETENIENDO SISTEMA COOPERATIVA ELÉCTRICA          ║
╚══════════════════════════════════════════════════════════════╝

📋 Paso 1: Deteniendo Frontend...
⏳ Deteniendo Frontend (PID: 12346)...
✅ Frontend detenido correctamente
✅ Frontend detenido

📋 Paso 2: Deteniendo Backend...
⏳ Deteniendo Backend (PID: 12345)...
✅ Backend detenido correctamente
✅ Backend detenido

📋 Paso 3: Verificando puertos...
✅ Puerto 3001 libre
✅ Puerto 3002 libre

📋 Paso 4: Limpiando procesos relacionados...
✅ No hay procesos huérfanos

╔══════════════════════════════════════════════════════════════╗
║            ✅ SISTEMA DETENIDO EXITOSAMENTE                 ║
╚══════════════════════════════════════════════════════════════╝

✅ Todos los servicios han sido detenidos
✅ Todos los puertos están libres

💡 Para iniciar el sistema nuevamente, ejecuta: ./start.sh

📊 Logs guardados en:
   Backend:  logs/backend.log
   Frontend: logs/frontend.log
```

---

## 🔧 Comandos Útiles Adicionales

### Ver logs en tiempo real
```bash
# Backend
tail -f logs/backend.log

# Frontend
tail -f logs/frontend.log

# Ambos al mismo tiempo (en terminales separadas)
tail -f logs/backend.log & tail -f logs/frontend.log
```

### Verificar estado de los servicios
```bash
# Ver procesos corriendo en los puertos
lsof -i :3001 -i :3002 | grep LISTEN

# Ver PIDs guardados
cat logs/backend.pid logs/frontend.pid
```

### Reiniciar el sistema rápidamente
```bash
./stop.sh && ./start.sh
```

### Ver logs completos
```bash
# Últimas 50 líneas del backend
tail -n 50 logs/backend.log

# Últimas 100 líneas del frontend
tail -n 100 logs/frontend.log

# Buscar errores en logs
grep -i error logs/backend.log
grep -i error logs/frontend.log
```

### Limpiar logs antiguos
```bash
# Limpiar todos los logs
rm -f logs/*.log

# Limpiar PIDs
rm -f logs/*.pid
```

---

## 📋 Estructura de Logs

```
logs/
├── backend.log       # Output completo del backend
├── backend.pid       # PID del proceso backend
├── frontend.log      # Output completo del frontend
└── frontend.pid      # PID del proceso frontend
```

---

## ⚠️ Solución de Problemas

### Problema: "Puerto en uso"

```bash
# Identificar qué está usando el puerto
lsof -i :3001
lsof -i :3002

# Forzar liberación
lsof -ti:3001 | xargs kill -9
lsof -ti:3002 | xargs kill -9
```

### Problema: "Servicios no responden"

```bash
# Ver logs para identificar el error
cat logs/backend.log
cat logs/frontend.log

# Verificar dependencias
cd backend && npm install && cd ..
npm install
```

### Problema: "Base de datos no conecta"

```bash
# Verificar PostgreSQL
sudo systemctl status postgresql

# Verificar configuración en backend/.env
cat backend/.env
```

---

## 🎯 Primer Uso

Si es la primera vez que ejecutas el sistema:

```bash
# 1. Instalar dependencias
npm install
cd backend && npm install && cd ..

# 2. Configurar variables de entorno
cp backend/.env.example backend/.env
# Editar backend/.env con tus credenciales

# 3. Iniciar el sistema
./start.sh
```

---

## 📊 Características de los Scripts

- ✅ **Colores en terminal** para mejor legibilidad
- ✅ **Verificación de salud** del backend
- ✅ **Detención graceful** (SIGTERM antes de SIGKILL)
- ✅ **Timeouts** para evitar bloqueos
- ✅ **Logs persistentes** para debugging
- ✅ **PIDs guardados** para gestión de procesos
- ✅ **Verificación de puertos** antes de iniciar
- ✅ **Limpieza de procesos huérfanos** (opcional)

---

## 🚀 Flujo Completo de Desarrollo

```bash
# Iniciar el sistema
./start.sh

# Acceder a http://localhost:3002
# Realizar cambios en el código (hot reload automático)

# Ver logs si hay errores
tail -f logs/backend.log

# Detener el sistema al finalizar
./stop.sh
```

---

## 📞 Soporte

Si encuentras problemas con los scripts:

1. Verifica los logs en `logs/backend.log` y `logs/frontend.log`
2. Asegúrate de tener permisos de ejecución: `chmod +x start.sh stop.sh`
3. Verifica que tienes instalado `lsof`: `which lsof`
4. Contacta al equipo de desarrollo

---

**Última actualización:** Octubre 2, 2025
