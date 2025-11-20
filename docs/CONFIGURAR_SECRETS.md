# Guía de Configuración de Secrets en GitHub

Esta guía te ayudará a configurar los secrets necesarios para que el pipeline de CI/CD funcione correctamente.

---

## Secrets Requeridos

Ve a tu repositorio en GitHub: **Settings → Secrets and variables → Actions → New repository secret**

### 1. DOCKER_USERNAME

**Descripción:** Tu nombre de usuario de Docker Hub

**Valor:** `damian2k` (o tu usuario)

**Pasos:**
1. Click en **New repository secret**
2. Name: `DOCKER_USERNAME`
3. Secret: `damian2k`
4. Click **Add secret**

---

### 2. DOCKER_PASSWORD

**Descripción:** Token de acceso de Docker Hub (NO tu contraseña)

**Pasos para obtener el token:**

1. Ve a https://hub.docker.com/settings/security
2. Click en **New Access Token**
3. Token description: `github-actions-cooperativa-ugarte`
4. Access permissions: **Read, Write, Delete**
5. Click **Generate**
6. **COPIA EL TOKEN** (solo se muestra una vez)

**Agregar en GitHub:**
1. Click en **New repository secret**
2. Name: `DOCKER_PASSWORD`
3. Secret: (pega el token copiado)
4. Click **Add secret**

**Ejemplo de token:**
```
dckr_pat_1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p
```

---

### 3. RENDER_DEPLOY_HOOK_URL (Opcional)

**Descripción:** Webhook para despliegue automático en Render

**Pasos para obtener el webhook:**

#### Si ya tienes servicios en Render:
1. Ve a https://dashboard.render.com/
2. Selecciona tu servicio (ej: cooperativa-ugarte-backend)
3. Settings → Deploy Hook
4. Click en **Create Deploy Hook**
5. **COPIA LA URL** generada

#### Si NO tienes servicios en Render todavía:
1. **Opción A:** Deja este secret vacío por ahora
2. **Opción B:** Sigue la guía de despliegue en Render más abajo

**Agregar en GitHub:**
1. Click en **New repository secret**
2. Name: `RENDER_DEPLOY_HOOK_URL`
3. Secret: (pega la URL copiada)
4. Click **Add secret**

**Ejemplo de webhook URL:**
```
https://api.render.com/deploy/srv-abc123xyz?key=1a2b3c4d5e6f7g8h
```

---

## Verificar Secrets Configurados

Una vez agregados, deberías ver algo así:

```
Repository secrets (3)
├── DOCKER_USERNAME ************************
├── DOCKER_PASSWORD ************************
└── RENDER_DEPLOY_HOOK_URL ************************
```

---

## Probar el Pipeline

### Método 1: Push a main

```bash
# Hacer un cambio mínimo
echo "# Test CI/CD" >> README.md

# Commit y push
git add README.md
git commit -m "test: verificar CI/CD pipeline"
git push origin main
```

### Método 2: Activación manual

1. Ve a la pestaña **Actions** en GitHub
2. Selecciona "CI/CD Pipeline"
3. Click en "Run workflow"
4. Selecciona branch: `main`
5. Click en "Run workflow"

---

## Ver el Pipeline en Ejecución

1. Ve a la pestaña **Actions**
2. Click en la ejecución más reciente
3. Verás 4 jobs:
   -  test-backend
   -  test-frontend
   -  build-and-push
   -  deploy-staging

**Tiempo total esperado:** 7-12 minutos

---

## Troubleshooting

### Error: "Invalid username or password"

**Causa:** Secret `DOCKER_PASSWORD` incorrecto

**Solución:**
1. Genera un nuevo token en Docker Hub
2. Actualiza el secret `DOCKER_PASSWORD` en GitHub
3. Re-ejecuta el workflow

### Error: "repository does not exist"

**Causa:** Las imágenes no existen todavía en Docker Hub

**Solución:**
1. Ejecuta localmente primero:
   ```bash
   ./docker-build-push.sh damian2k
   ```
2. Luego intenta el pipeline de nuevo

### Error: "Resource not accessible by integration"

**Causa:** Permisos insuficientes en el repositorio

**Solución:**
1. Settings → Actions → General
2. "Workflow permissions" → Select "Read and write permissions"
3. Save

---

## Despliegue en Render (Opcional)

### Crear servicios en Render

#### 1. Backend

1. Ve a https://dashboard.render.com/
2. Click en **New +** → **Web Service**
3. Connect tu repositorio GitHub
4. Configuración:
   - Name: `cooperativa-ugarte-backend`
   - Environment: **Docker**
   - Dockerfile Path: `api/Dockerfile`
   - Docker Context: `./api`
   - Instance Type: **Free**
5. Environment Variables:
   ```
   DATABASE_URL: (conectar a PostgreSQL de Render)
   JWT_SECRET: (generar automáticamente)
   PORT: 3000
   ```
6. Click **Create Web Service**

#### 2. Frontend

1. Click en **New +** → **Web Service**
2. Configuración:
   - Name: `cooperativa-ugarte-frontend`
   - Environment: **Docker**
   - Dockerfile Path: `Dockerfile`
   - Docker Context: `.`
   - Instance Type: **Free**
3. Click **Create Web Service**

#### 3. Base de Datos

1. Click en **New +** → **PostgreSQL**
2. Configuración:
   - Name: `cooperativa-postgres`
   - Database: `cooperativa_ugarte_db`
   - User: `coop_user`
   - Instance Type: **Free**
3. Click **Create Database**

### Obtener Deploy Hook

1. Ve al servicio backend en Render
2. Settings → Deploy Hook
3. Click **Create Deploy Hook**
4. Copia la URL
5. Agrégala como secret `RENDER_DEPLOY_HOOK_URL` en GitHub

---

## Alternativa: Desplegar en Railway

### 1. Crear cuenta en Railway

1. Ve a https://railway.app/
2. Sign up with GitHub

### 2. Nuevo proyecto desde GitHub

1. Click en **New Project**
2. Select **Deploy from GitHub repo**
3. Selecciona tu repositorio
4. Railway detectará automáticamente:
   - Frontend (Dockerfile)
   - Backend (api/Dockerfile)
   - PostgreSQL (docker-compose.yml)

### 3. Configurar variables de entorno

Backend:
```
DATABASE_URL=${{Postgres.DATABASE_URL}}
JWT_SECRET=your-secret-here
PORT=3000
```

### 4. Obtener Deploy Hook

1. Settings → Deploy Triggers
2. Copia la webhook URL
3. Agrégala en GitHub Secrets

---

## Comandos Útiles

```bash
# Ver estado del pipeline
gh run list --workflow=ci-cd.yml

# Ver logs en tiempo real
gh run watch

# Re-ejecutar pipeline fallido
gh run rerun

# Verificar secrets (no muestra valores)
gh secret list
```

---

## Siguiente Paso

Una vez configurados los secrets:

```bash
# Hacer push para activar el pipeline
git add .
git commit -m "feat: configuración CI/CD completa"
git push origin main
```

Luego ve a **Actions** en GitHub para ver el pipeline en ejecución.

---

**Guía creada:** 19 de Noviembre de 2025  
**Actualización:** Configuración inicial de secrets
