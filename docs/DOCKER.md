# Guía Completa de Dockerización - Cooperativa Ugarte

## Archivos Docker Creados

### Archivos de Configuración
- `Dockerfile` - Imagen de producción del frontend (React + Nginx) con multi-stage build
- `Dockerfile.dev` - Imagen de desarrollo del frontend con hot-reload
- `api/Dockerfile` - Imagen del backend (Express API)
- `nginx.conf` - Configuración de Nginx para SPA y proxy reverso
- `.dockerignore` - Archivos excluidos en builds Docker (root)
- `api/.dockerignore` - Archivos excluidos en builds Docker (backend)
- `docker-compose.yml` - Orquestación de servicios
- `docker-build-push.sh` - Script automatizado para build y push a Docker Hub

### Estructura de Servicios Docker

```yaml
servicios:
  - postgres: Base de datos PostgreSQL con datos de prueba
  - api: Backend Express con conexión a PostgreSQL
  - frontend: Frontend React servido con Nginx
```

## Guía Paso a Paso: Dockerización Completa

### Paso 1: Preparar el Entorno

**Requisitos previos:**
- Docker instalado y corriendo
- Cuenta en Docker Hub
- Acceso al código fuente del proyecto

**Verificar instalación:**
```bash
docker --version
docker-compose --version
```

### Paso 2: Login en Docker Hub

```bash
docker login
```

**Salida esperada:**
```
Login Succeeded
```

### Paso 3: Construir y Subir Imágenes a Docker Hub

#### Opción A: Método Automatizado (Recomendado)

```bash
./docker-build-push.sh TU_USUARIO_DOCKERHUB
```

**Ejemplo real:**
```bash
./docker-build-push.sh damian2k
```

**Proceso que ejecuta el script:**
1.  Login automático en Docker Hub
2.  Construye imagen del frontend (React + Vite → Nginx)
3.  Sube imagen del frontend con tag `latest`
4.  Construye imagen del backend (Express + Node)
5.  Sube imagen del backend con tag `latest`

**Salida esperada:**
```
=== Construyendo y subiendo imágenes Docker ===
Usuario Docker Hub: damian2k
Versión: latest

OK ¡Proceso completado exitosamente!

Imágenes creadas:
  - damian2k/cooperativa-ugarte-frontend:latest
  - damian2k/cooperativa-ugarte-backend:latest
```

#### Opción B: Construcción Manual (Paso a Paso)

#### Frontend:
```bash
# Build de la imagen
docker build -t TU_USUARIO/cooperativa-ugarte-frontend:latest -f Dockerfile .

# Push a Docker Hub
docker push TU_USUARIO/cooperativa-ugarte-frontend:latest
```

#### Backend:
```bash
# Build de la imagen
docker build -t TU_USUARIO/cooperativa-ugarte-backend:latest -f api/Dockerfile ./api

# Push a Docker Hub
docker push TU_USUARIO/cooperativa-ugarte-backend:latest
```

#### Base de Datos (si necesitas tu propia imagen):
```bash
# Primero crea un Dockerfile para PostgreSQL con tus datos iniciales
# Luego:
docker build -t TU_USUARIO/cooperativa-ugarte-db:latest -f db/Dockerfile ./db
docker push TU_USUARIO/cooperativa-ugarte-db:latest
```

### Paso 4: Configurar docker-compose.yml

El archivo `docker-compose.yml` ya está configurado. Verifica que use tu usuario de Docker Hub:

```yaml
services:
  postgres:
    image: damian2k/cooperativa-ugarte-db:latest
    container_name: cooperativa-postgres
    ports:
      - "5433:5432"  # Puerto 5433 para evitar conflictos
    environment:
      POSTGRES_DB: cooperativa_ugarte_db
      POSTGRES_USER: coop_user
      POSTGRES_PASSWORD: cooperativa2024
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - cooperativa_network

  api:
    image: damian2k/cooperativa-ugarte-backend:latest
    container_name: cooperativa-api
    ports:
      - "3001:3000"  # Puerto 3001 externamente, 3000 internamente
    environment:
      DATABASE_URL: postgresql://coop_user:cooperativa2024@postgres:5432/cooperativa_ugarte_db
      PORT: 3000
      JWT_SECRET: cooperativa_secret_key_2024
    depends_on:
      - postgres
    networks:
      - cooperativa_network

  frontend:
    image: damian2k/cooperativa-ugarte-frontend:latest
    container_name: cooperativa-frontend
    ports:
      - "8080:80"  # Puerto 8080 externamente, 80 internamente
    depends_on:
      - api
    networks:
      - cooperativa_network

volumes:
  postgres_data:

networks:
  cooperativa_network:
    driver: bridge
```

### Paso 5: Ejecutar la Aplicación con Docker Compose

#### 5.1. Iniciar todos los servicios

```bash
docker-compose up -d
```

**Salida esperada:**
```
[+] Running 4/4
 ✔ Network proyecto-integrador-devops_cooperativa_network  Created
 ✔ Container cooperativa-postgres                          Started
 ✔ Container cooperativa-api                               Started
 ✔ Container cooperativa-frontend                          Started
```

**Nota:** Si encuentras conflictos de nombres de contenedores, ejecuta:
```bash
docker-compose down
docker-compose up -d
```

#### 5.2. Verificar estado de los contenedores

```bash
docker-compose ps
```

**Salida esperada:**
```
NAME                   IMAGE                                         COMMAND                  STATUS         PORTS
cooperativa-api        damian2k/cooperativa-ugarte-backend:latest    "docker-entrypoint.s…"   Up 10 seconds  0.0.0.0:3001->3000/tcp
cooperativa-frontend   damian2k/cooperativa-ugarte-frontend:latest   "/docker-entrypoint.…"   Up 10 seconds  0.0.0.0:8080->80/tcp
cooperativa-postgres   damian2k/cooperativa-ugarte-db:latest         "docker-entrypoint.s…"   Up 11 seconds  0.0.0.0:5433->5432/tcp
```

#### 5.3. Ver logs de los servicios

```bash
# Ver logs de todos los servicios
docker-compose logs -f

# Ver logs de un servicio específico
docker-compose logs -f api
docker-compose logs -f frontend
docker-compose logs -f postgres

# Ver últimas 50 líneas de logs
docker-compose logs --tail 50 api
```

#### 5.4. Actualizar imágenes y reiniciar

```bash
# Método completo: detener, actualizar y reiniciar
docker-compose down
docker-compose pull
docker-compose up -d

# O en una sola línea
docker-compose down && docker-compose pull && docker-compose up -d
```

### Paso 5.5: Actualizar Aplicación Después de Cambios en el Código

#### Opción A: Con Script (Recomendado)

```bash
# 1. Reconstruir imágenes y subirlas a Docker Hub
./docker-build-push.sh damian2k

# 2. Detener contenedores actuales
docker-compose down

# 3. Levantar con las nuevas imágenes
docker-compose up -d

# 4. Verificar que funciona
docker-compose logs -f
```

#### Opción B: Manual

**Frontend:**
```bash
# 1. Construir nueva imagen
docker build -t damian2k/cooperativa-ugarte-frontend:latest -f Dockerfile .

# 2. Subir a Docker Hub
docker push damian2k/cooperativa-ugarte-frontend:latest

# 3. Recrear solo el contenedor del frontend
docker-compose up -d --force-recreate frontend
```

**Backend:**
```bash
# 1. Construir nueva imagen
docker build -t damian2k/cooperativa-ugarte-backend:latest -f api/Dockerfile ./api

# 2. Subir a Docker Hub
docker push damian2k/cooperativa-ugarte-backend:latest

# 3. Recrear solo el contenedor del backend
docker-compose up -d --force-recreate api
```

**Ambos servicios:**
```bash
# 1. Construir ambas imágenes
docker build -t damian2k/cooperativa-ugarte-frontend:latest -f Dockerfile .
docker build -t damian2k/cooperativa-ugarte-backend:latest -f api/Dockerfile ./api

# 2. Subir ambas imágenes
docker push damian2k/cooperativa-ugarte-frontend:latest
docker push damian2k/cooperativa-ugarte-backend:latest

# 3. Detener, descargar y levantar
docker-compose down
docker-compose pull
docker-compose up -d
```

**Notas importantes:**
- `docker-compose pull` solo descarga imágenes de Docker Hub, NO reconstruye código local
- Siempre debes hacer `docker build` + `docker push` antes de `docker-compose pull`
- Usa `--force-recreate` para forzar la recreación de contenedores específicos

##  Pruebas y Verificación

### Paso 6: Verificar que la Aplicación Funcione

#### 6.1. Probar el Backend API

**Test 1: Endpoint de salud**
```bash
curl http://localhost:3001/api/salud
```

**Respuesta esperada:**
```json
{
  "estado": "ok",
  "baseDatos": "conectada",
  "marcaDeTiempo": "2025-11-19T18:19:01.182Z"
}
```

**Test 2: Verificar logs del servidor API**
```bash
docker-compose logs api --tail 20
```

**Salida esperada:**
```
cooperativa-api  |  DATABASE_URL detectada: {
cooperativa-api  |   length: 74,
cooperativa-api  |   starts: 'postgresql://coop_us',
cooperativa-api  |   protocol: 'postgresql'
cooperativa-api  | }
cooperativa-api  |  Pool creado exitosamente
cooperativa-api  |  Servidor corriendo en http://localhost:3000
cooperativa-api  |  Verificación de salud: http://localhost:3000/api/salud
```

#### 6.2. Probar el Frontend

**Test 1: Acceder desde el navegador**
```bash
# Abrir en el navegador
http://localhost:8080
```

**Test 2: Verificar con curl**
```bash
curl -I http://localhost:8080
```

**Respuesta esperada:**
```
HTTP/1.1 200 OK
Server: nginx
Content-Type: text/html
```

#### 6.3. Probar la Base de Datos

**Test 1: Conectarse a PostgreSQL**
```bash
docker exec -it cooperativa-postgres psql -U coop_user -d cooperativa_ugarte_db
```

**Test 2: Verificar tablas**
```sql
-- Dentro de psql
\dt

-- Verificar usuarios
SELECT email, rol FROM usuarios LIMIT 5;

-- Salir
\q
```

**Salida esperada:**
```
                    List of relations
 Schema |            Name            | Type  |   Owner   
--------+----------------------------+-------+-----------
 public | cuentas                    | table | coop_user
 public | empleados                  | table | coop_user
 public | facturas                   | table | coop_user
 public | ordenes_trabajo            | table | coop_user
 public | reclamos                   | table | coop_user
 public | socios                     | table | coop_user
 public | usuarios                   | table | coop_user
...
```

#### 6.4. Probar Conectividad entre Servicios

**Test: API puede conectarse a la base de datos**
```bash
# Ver conexión exitosa en logs
docker-compose logs api | grep "Pool creado"
```

**Respuesta esperada:**
```
cooperativa-api  | Pool creado exitosamente
```

### Paso 7: Pruebas Funcionales de la Aplicación

#### 7.1. Usuarios de Prueba Disponibles

Según la inicialización de la base de datos:

**Clientes:**
- `mariaelena.gonzalez@hotmail.com`
- `robertocarlos.martinez@gmail.com`
- `anapaula.fernandez@yahoo.com`
- `juanmanuel.lopez@outlook.com`
- `silviaraquel.rodriguez@gmail.com`
- `carlosalberto.sanchez@hotmail.com`

**Operarios:**
- `pedro.electricista@cooperativa-ugarte.com.ar`
- `juan.operario@cooperativa-ugarte.com.ar`
- `luis.tecnico@cooperativa-ugarte.com.ar`

**Administradores:**
- `monica.administradora@cooperativa-ugarte.com.ar`
- `carlos.admin@cooperativa-ugarte.com.ar`

**Nota:** Las contraseñas están hasheadas en la base de datos. Revisa el script de inicialización o usa la funcionalidad de registro/login de la aplicación.

#### 7.2. Datos de Prueba Cargados

La base de datos incluye:
- 12 socios
- 12 cuentas
- 10 medidores
- 30 lecturas
- 10+ reclamos
- 19 usuarios (11 clientes, 6 operarios, 2 admins)
- 10 órdenes de trabajo
- 15 facturas
- 7 pagos
- 5 cuadrillas
- Itinerarios de diciembre 2025 (15 días con 3 OTs cada uno)
- 5 valoraciones de prueba

## URLs de Acceso

**Aplicación funcionando:**
- **Frontend**: http://localhost:8080
- **Backend API**: http://localhost:3001/api
- **API Health Check**: http://localhost:3001/api/salud
- **PostgreSQL**: localhost:5433

**Docker Hub:**
- Frontend: https://hub.docker.com/r/damian2k/cooperativa-ugarte-frontend
- Backend: https://hub.docker.com/r/damian2k/cooperativa-ugarte-backend
- Database: https://hub.docker.com/r/damian2k/cooperativa-ugarte-db

## Versionado de Imágenes

Para crear versiones específicas:

```bash
./docker-build-push.sh TU_USUARIO v1.0.0
```

Esto creará:
- `TU_USUARIO/cooperativa-ugarte-frontend:v1.0.0`
- `TU_USUARIO/cooperativa-ugarte-frontend:latest`
- `TU_USUARIO/cooperativa-ugarte-backend:v1.0.0`
- `TU_USUARIO/cooperativa-ugarte-backend:latest`

## Variables de Entorno

Las variables de entorno están configuradas en `docker-compose.yml`:

### PostgreSQL
```yaml
POSTGRES_DB: cooperativa_ugarte_db
POSTGRES_USER: coop_user
POSTGRES_PASSWORD: cooperativa2024
```

### Backend API
```yaml
DATABASE_URL: postgresql://coop_user:cooperativa2024@postgres:5432/cooperativa_ugarte_db
PORT: 3000
JWT_SECRET: cooperativa_secret_key_2024
```

**Nota de Seguridad:** En producción, usa variables de entorno reales o Docker secrets.

##  Comandos Útiles de Docker

```bash
# Ver imágenes locales
docker images

# Ver contenedores corriendo
docker ps

# Ver todos los contenedores
docker ps -a

# Eliminar imagen local
docker rmi TU_USUARIO/cooperativa-ugarte-frontend:latest

# Limpiar imágenes sin usar
docker image prune -a

# Ver logs de un contenedor específico
docker logs cooperativa-frontend

# Entrar a un contenedor
docker exec -it cooperativa-api sh

# Ver uso de recursos
docker stats
```

## Arquitectura de las Imágenes

### Frontend (Multi-stage build)
1. **Etapa 1 (Builder)**: Compila la aplicación React con Vite
2. **Etapa 2 (Production)**: Sirve los archivos estáticos con Nginx

**Ventajas**:
- Imagen final pequeña (~25MB con Nginx Alpine)
- Optimizada para producción
- Servicio de archivos estáticos rápido

### Backend
- Node.js 20 Alpine (imagen ligera)
- Solo dependencias de producción
- Usuario no-root para seguridad

### Base de Datos
- PostgreSQL oficial
- Volumen persistente para datos
- Configuración mediante variables de entorno

## Seguridad

- Las imágenes usan Alpine Linux (más pequeñas y seguras)
- El backend corre con usuario no-root
- `.dockerignore` excluye archivos sensibles
- Variables de entorno para credenciales

## Tamaños Aproximados

- Frontend: ~25-30 MB
- Backend: ~150-200 MB
- PostgreSQL: ~150-200 MB

##  Troubleshooting - Solución de Problemas

### Problema 1: Error "container name already in use"

**Síntoma:**
```
Error response from daemon: Conflict. The container name "/cooperativa-db" is already in use
```

**Solución:**
```bash
# Opción 1: Detener y eliminar contenedores existentes
docker-compose down

# Opción 2: Eliminar contenedor específico
docker rm -f nombre-contenedor

# Opción 3: Cambiar nombres en docker-compose.yml
container_name: cooperativa-postgres  # En lugar de cooperativa-db
```

### Problema 2: API no arranca (exit code 0/1)

**Síntoma:**
```bash
docker ps -a | grep api
# Muestra: Exited (0) o Exited (1)
```

**Solución:**
```bash
# Ver logs del contenedor
docker logs cooperativa-api

# Verificar variables de entorno
docker exec cooperativa-api env | grep DATABASE_URL

# Verificar que NODE_ENV no esté en 'production' si usas el código Vercel
# En docker-compose.yml, remove NODE_ENV: production
```

### Problema 3: Puerto en uso

**Síntoma:**
```
Error starting userland proxy: listen tcp4 0.0.0.0:5432: bind: address already in use
```

**Solución:**
```bash
# Ver qué proceso usa el puerto
sudo lsof -i :5432
# o
sudo netstat -tlnp | grep 5432

# Cambiar puerto en docker-compose.yml
ports:
  - "5433:5432"  # Usar 5433 externamente
```

### Problema 4: Imagen no se actualiza

**Síntoma:**
Los cambios no se reflejan después de reconstruir

**Solución:**
```bash
# Forzar recreación de contenedores
docker-compose down
docker-compose pull
docker-compose up -d --force-recreate

# O eliminar imágenes locales primero
docker rmi damian2k/cooperativa-ugarte-frontend:latest
docker rmi damian2k/cooperativa-ugarte-backend:latest
docker-compose pull
docker-compose up -d
```

### Problema 5: Error de permisos de Docker

**Síntoma:**
```
permission denied while trying to connect to the Docker daemon socket
```

**Solución:**
```bash
# Agregar usuario al grupo docker
sudo usermod -aG docker $USER

# Aplicar cambios (requiere logout/login)
newgrp docker

# O reiniciar sesión
logout
# Volver a iniciar sesión
```

### Problema 6: Base de datos no se inicializa

**Síntoma:**
Las tablas o datos de prueba no existen

**Solución:**
```bash
# Eliminar volumen y recrear
docker-compose down -v  # -v elimina volúmenes
docker-compose up -d

# Verificar logs de inicialización
docker-compose logs postgres | grep "CREATE TABLE"
```

### Problema 7: Frontend no se comunica con API

**Síntoma:**
Errores de CORS o network en el navegador

**Solución:**
```bash
# Verificar que API esté corriendo
curl http://localhost:3001/api/salud

# Verificar configuración de CORS en api/index.js
# Verificar que frontend use la URL correcta

# En nginx.conf, verificar proxy_pass
location /api {
    proxy_pass http://cooperativa-api:3000;
}
```

### Problema 8: Out of disk space

**Síntoma:**
```
no space left on device
```

**Solución:**
```bash
# Limpiar imágenes sin usar
docker image prune -a

# Limpiar todo (contenedores, redes, volúmenes, build cache)
docker system prune -a --volumes

# Ver espacio usado
docker system df
```

## Resumen de Implementación Exitosa

### Lo que se logró

1. **Dockerfiles creados:**
   -  Frontend con multi-stage build (React + Vite → Nginx)
   -  Backend con Node.js 20 Alpine
   -  Configuración de Nginx para SPA y proxy reverso

2. **Docker Compose configurado:**
   -  Orquestación de 3 servicios (postgres, api, frontend)
   -  Red privada para comunicación entre contenedores
   -  Volumen persistente para PostgreSQL
   -  Variables de entorno configuradas

3. **Imágenes en Docker Hub:**
   - damian2k/cooperativa-ugarte-frontend:latest
   - damian2k/cooperativa-ugarte-backend:latest
   - damian2k/cooperativa-ugarte-db:latest

4. **Aplicación funcionando:**
   - Frontend accesible en http://localhost:8080
   - Backend API en http://localhost:3001
   - PostgreSQL en puerto 5433
   - Base de datos con datos de prueba cargados

5. **Script de automatización:**
   - `docker-build-push.sh` para build y push automatizado

###  Métricas de Éxito

```
Servicios corriendo: 3/3
Estado de contenedores: Healthy
Base de datos: Inicializada con 23 tablas
Usuarios de prueba: 19 (11 clientes, 6 operarios, 2 admins)
Imágenes publicadas: 3
Tiempo de inicio: ~10 segundos
```

###  Próximos Pasos Sugeridos

1. **CI/CD**: Configurar GitHub Actions para builds automáticos
2. **Monitoreo**: Agregar healthchecks en docker-compose.yml
3. **Seguridad**: Usar Docker secrets para credenciales
4. **Optimización**: Implementar caché de layers en builds
5. **Documentación**: Actualizar README.md principal con badges de Docker Hub

## Referencias y Recursos

### Documentación Oficial
- [Docker Hub](https://hub.docker.com)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Dockerfile Best Practices](https://docs.docker.com/develop/develop-images/dockerfile_best-practices/)
- [Multi-stage Builds](https://docs.docker.com/build/building/multi-stage/)

### Imágenes del Proyecto
- [Frontend en Docker Hub](https://hub.docker.com/r/damian2k/cooperativa-ugarte-frontend)
- [Backend en Docker Hub](https://hub.docker.com/r/damian2k/cooperativa-ugarte-backend)
- [Database en Docker Hub](https://hub.docker.com/r/damian2k/cooperativa-ugarte-db)

### Comandos Quick Reference

```bash
# Build y push
./docker-build-push.sh damian2k

# Start
docker-compose up -d

# Stop
docker-compose down

# Logs
docker-compose logs -f

# Status
docker-compose ps

# Health check
curl http://localhost:3001/api/salud

# Connect to DB
docker exec -it cooperativa-postgres psql -U coop_user -d cooperativa_ugarte_db

# Clean up
docker system prune -a --volumes
```

---

**Documentación actualizada:** 19 de Noviembre de 2025  
**Versión:** 1.0.0  
**Autor:** Cooperativa Eléctrica Gobernador Ugarte - Equipo DevOps
