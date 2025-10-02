# Sistema de Gestión - Cooperativa Eléctrica

Sistema completo de gestión para cooperativa eléctrica con módulos de administración, clientes y operarios.

---

## Inicio Rápido

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

## Scripts Disponibles

| Script | Descripción | Uso |
|--------|-------------|-----|
| `start.sh` | Inicia backend y frontend | `./start.sh` |
| `stop.sh` | Detiene todos los servicios | `./stop.sh` |
| `restart.sh` | Reinicia el sistema completo | `./restart.sh` |
| `status.sh` | Muestra estado del sistema | `./status.sh` |
| `logs.sh` | Visualiza logs en tiempo real | `./logs.sh [backend\|frontend\|all\|errors]` |
| `update-docker.sh` | Actualiza imagen Docker desde Docker Hub | `./update-docker.sh` |

---

## Scripts Detallados

### 1. start.sh - Iniciar Sistema

**Qué hace:**
- Verifica y libera puertos (3001, 3002)
- Verifica dependencias
- Inicia Backend
- Inicia Frontend
- Verifica salud de servicios
- Guarda PIDs y logs

**Ejemplo:**
```bash
./start.sh

# Output:
# Backend corriendo en puerto 3001
# Frontend corriendo en puerto 3002
# Accede al sistema en: http://localhost:3002
```

---

### 2. stop.sh - Detener Sistema

**Qué hace:**
- Detiene Frontend gracefully
- Detiene Backend gracefully
- Libera puertos
- Opción de limpiar procesos huérfanos
- Mantiene logs

**Ejemplo:**
```bash
./stop.sh

# Output:
# Frontend detenido
# Backend detenido
# Todos los puertos están libres
```

---

### 3. restart.sh - Reiniciar Sistema

**Qué hace:**
- Ejecuta stop.sh
- Espera 3 segundos
- Ejecuta start.sh

**Ejemplo:**
```bash
./restart.sh

# Útil después de cambios en configuración
```

---

### 4. status.sh - Estado del Sistema

**Qué hace:**
- Verifica estado de Backend
- Verifica estado de Frontend
- Verifica estado de PostgreSQL
- Muestra uso de memoria
- Muestra PIDs de procesos

**Ejemplo:**
```bash
./status.sh

# Output:
# Backend: CORRIENDO puerto 3001, PID 12345, 75.2 MB
# Frontend: CORRIENDO puerto 3002, PID 12346, 180.3 MB
# PostgreSQL: CORRIENDO contenedor cooperativa-db
# Sistema: completamente operativo
```

**Estados posibles:**
- `CORRIENDO`: Servicio activo y saludable
- `DETENIDO`: Servicio no está ejecutándose
- `ERROR`: Puerto ocupado pero servicio no responde

---

### 5. logs.sh - Visualizar Logs

**Qué hace:**
- Muestra logs en tiempo real
- Filtra por backend, frontend o ambos
- Opción para ver solo errores
- Usa `tail -f` para seguimiento continuo

**Uso:**
```bash
# Ver todos los logs
./logs.sh all

# Solo logs del backend
./logs.sh backend

# Solo logs del frontend
./logs.sh frontend

# Solo errores
./logs.sh errors
```

**Ejemplo:**
```bash
./logs.sh backend

# Output (en tiempo real):
# [2025-10-02 15:30:25] INFO: Servidor iniciado en puerto 3001
# [2025-10-02 15:30:26] INFO: Conectado a PostgreSQL
# [2025-10-02 15:30:30] GET /api/salud 200 15ms
```

**Archivos de log:**
- `logs/backend.log` - Log completo del backend
- `logs/frontend.log` - Log completo del frontend
- `logs/backend.pid` - PID del proceso backend
- `logs/frontend.pid` - PID del proceso frontend

---

### 6. update-docker.sh - Actualizar Imagen Docker

**Qué hace:**
- Detiene contenedor PostgreSQL actual
- Elimina contenedor e imagen antiguos
- Descarga última versión desde Docker Hub
- Crea y ejecuta nuevo contenedor
- Verifica conectividad y datos

**Ejemplo:**
```bash
./update-docker.sh

# Output:
# [1/5] Verificando contenedor existente...
# Deteniendo contenedor cooperativa-db...
# Contenedor detenido
# [2/5] Eliminando imagen antigua...
# Imagen antigua eliminada
# [3/5] Descargando última versión desde Docker Hub...
# Imagen: damian2k/cooperativa-ugarte-db:latest
# Imagen descargada exitosamente
# [4/5] Iniciando nuevo contenedor...
# Contenedor iniciado
# [5/5] Verificando estado del contenedor...
# Contenedor corriendo correctamente
# PostgreSQL está listo para aceptar conexiones
# Total de reclamos en la base: 30
# ACTUALIZACIÓN COMPLETADA EXITOSAMENTE
```

**Cuándo usar:**
- Después de actualizar datos en Docker Hub
- Para obtener esquema actualizado de la base de datos
- Para sincronizar con nueva versión de la imagen

**Importante:**
- Este script elimina el contenedor actual
- Los datos se reemplazan con los de la imagen
- Reinicia el backend después: `./restart.sh`

**Variables configurables:**
```bash
IMAGE_NAME="damian2k/cooperativa-ugarte-db:latest"
CONTAINER_NAME="cooperativa-db"
DB_PORT=5432
```

---

## Estructura del Proyecto

```
PPIV/
├── start.sh              # Script para iniciar sistema
├── stop.sh               # Script para detener sistema
├── restart.sh            # Script para reiniciar sistema
├── status.sh             # Script para ver estado
├── logs.sh               # Script para ver logs
├── update-docker.sh      # Script para actualizar imagen Docker
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
    ├── API.md
    └── DATABASE.md
```

---

## Flujo de Trabajo Típico

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

### Después de Cambios en Código
```bash
# Reiniciar para aplicar cambios
./restart.sh

# Verificar que todo funcione
./status.sh
```

### Debugging de Problemas
```bash
# 1. Ver estado general
./status.sh

# 2. Ver logs de errores
./logs.sh errors

# 3. Ver logs específicos
./logs.sh backend
./logs.sh frontend

# 4. Si es necesario, reiniciar
./restart.sh
```

---

## Puertos Utilizados

| Servicio | Puerto | URL |
|----------|--------|-----|
| Backend | 3001 | http://localhost:3001 |
| Frontend | 3002 | http://localhost:3002 |
| PostgreSQL | 5432 | localhost:5432 |

---

## Variables de Entorno

### Backend (.env)
```bash
PORT=3001
DATABASE_URL=postgresql://coop_user:cooperativa2024@localhost:5432/cooperativa_ugarte_db
JWT_SECRET=tu-secreto-jwt-aqui
NODE_ENV=development
```

### Frontend (.env)
```bash
VITE_API_URL=http://localhost:3001
VITE_APP_NAME=Sistema de Gestión - Cooperativa Eléctrica
```

---

## Comandos Útiles

### Verificar Puertos
```bash
# Ver qué está usando puerto 3001
lsof -i :3001

# Ver qué está usando puerto 3002
lsof -i :3002

# Liberar puerto manualmente
lsof -ti:3001 | xargs kill -9
```

### Manejo de Logs
```bash
# Ver últimas 50 líneas del backend
tail -50 logs/backend.log

# Ver últimas 50 líneas del frontend
tail -50 logs/frontend.log

# Buscar errores en logs
grep -i "error" logs/backend.log

# Limpiar logs antiguos
> logs/backend.log
> logs/frontend.log
```

### Docker
```bash
# Ver contenedores corriendo
docker ps

# Ver logs de PostgreSQL
docker logs cooperativa-db

# Conectar a PostgreSQL
docker exec -it cooperativa-db psql -U coop_user -d cooperativa_ugarte_db

# Detener contenedor
docker stop cooperativa-db

# Iniciar contenedor
docker start cooperativa-db
```

---

## Solución de Problemas

### Error: Puerto ya en uso
```bash
# Verificar qué proceso usa el puerto
lsof -i :3001

# Liberar puerto
lsof -ti:3001 | xargs kill -9

# Reiniciar
./start.sh
```

### Error: No se puede conectar a la base de datos
```bash
# Verificar que PostgreSQL está corriendo
docker ps | grep cooperativa-db

# Si no está, iniciarlo
docker start cooperativa-db

# Verificar logs
docker logs cooperativa-db

# Reiniciar backend
./restart.sh
```

### Error: Frontend no carga
```bash
# Ver logs del frontend
./logs.sh frontend

# Verificar dependencias
npm install

# Reiniciar
./restart.sh
```

### Error: Backend no responde
```bash
# Ver logs del backend
./logs.sh backend

# Verificar dependencias
cd backend && npm install && cd ..

# Verificar .env
cat backend/.env

# Reiniciar
./restart.sh
```

---

## Tecnologías

- **Frontend:** React 18.3.1 + Vite 6.3.5 + TypeScript
- **Backend:** Node.js + Express
- **Base de Datos:** PostgreSQL
- **UI:** Shadcn/ui + Tailwind CSS
- **Icons:** Lucide React

---

## Soporte

Para dudas o problemas:

1. Verificar logs: `./logs.sh errors`
2. Verificar estado: `./status.sh`
3. Revisar documentación en `/docs`
4. Contactar al equipo de desarrollo

---

## Actualización del Sistema

### Actualizar Código Fuente
```bash
# 1. Detener el sistema
./stop.sh

# 2. Actualizar código desde GitHub
git pull origin integracion-base-datos

# 3. Actualizar dependencias
npm install
cd backend && npm install && cd ..

# 4. Iniciar el sistema
./start.sh
```

### Actualizar Base de Datos
```bash
# 1. Detener el sistema
./stop.sh

# 2. Actualizar imagen Docker
./update-docker.sh

# 3. Iniciar el sistema
./start.sh
```

### Actualización Completa
```bash
# 1. Detener todo
./stop.sh

# 2. Actualizar código
git pull origin integracion-base-datos
npm install
cd backend && npm install && cd ..

# 3. Actualizar Docker
./update-docker.sh

# 4. Iniciar todo
./start.sh
```

---

**Última actualización:** Octubre 2, 2025

**Versión:** 1.0.0

**Estado:** Producción
