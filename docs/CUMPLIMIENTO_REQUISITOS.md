# Cumplimiento de Requisitos - Trabajo Práctico CI/CD

## Requisitos del Trabajo Práctico

### Pipeline con GitHub Actions
[OK] Implementado en `.github/workflows/ci-cd.yml`

### 1. Build de la app
**Requisito:** Build de la aplicación

**Implementación:**
- **Frontend:** Job `test-frontend`, step "Build Frontend" (línea 85)
  ```yaml
  - name: Build Frontend
    run: npm run build
  ```
- **Backend:** Incluido en el Dockerfile (api/Dockerfile)
  - Compilación mediante `npm install`
  - Optimización con Node.js Alpine

**Evidencia:** Build exitoso genera archivos en `dist/` (frontend) y prepara el backend para producción.

---

### 2. Correr tests
**Requisito:** Ejecución de tests automáticos

**Implementación:**

**Backend (Job: test-backend):**
- Tests unitarios (línea 53):
  ```yaml
  - name: Ejecutar tests unitarios Backend
    run: npm run test:unit
  ```
- Tests de integración (línea 56):
  ```yaml
  - name: Ejecutar tests de integración Backend
    run: npm run test:integration
  ```
- Base de datos PostgreSQL 15 como servicio
- Total: ~357 tests del backend

**Frontend (Job: test-frontend):**
- Tests con Vitest (línea 82):
  ```yaml
  - name: Ejecutar tests Frontend
    run: npm run test:coverage
  ```
- Total: 56 tests del frontend

**Total de tests:** ~413 tests ejecutados automáticamente

---

### 3. Build y push de imagen Docker
**Requisito:** Build y push de imágenes Docker a Docker Hub

**Implementación (Job: build-and-push):**

**Frontend:**
- Build multi-stage (línea 114-124):
  ```yaml
  - name: Build and push Frontend image
    uses: docker/build-push-action@v5
    with:
      context: .
      file: ./Dockerfile
      push: true
      tags: damian2k/cooperativa-ugarte-frontend:latest
  ```

**Backend:**
- Build y push (línea 136-146):
  ```yaml
  - name: Build and push Backend image
    uses: docker/build-push-action@v5
    with:
      context: ./api
      file: ./api/Dockerfile
      push: true
      tags: damian2k/cooperativa-ugarte-backend:latest
  ```

**Imágenes en Docker Hub:**
- https://hub.docker.com/r/damian2k/cooperativa-ugarte-frontend
- https://hub.docker.com/r/damian2k/cooperativa-ugarte-backend

**Optimizaciones implementadas:**
- Caché de Docker layers para builds más rápidos
- Tags automáticos por commit (SHA) y branch
- Multi-stage builds para reducir tamaño de imágenes

---

### 4. Despliegue automático
**Requisito:** Despliegue automático en entorno de prueba

**Implementación (Job: deploy-staging):**

**Opciones soportadas:**
- Render (mediante Deploy Hook)
- Cualquier servicio que acepte webhooks
- Preparado con `render.yaml` para deploy en Render

**Configuración (línea 149-178):**
```yaml
deploy-staging:
  name: Deploy to Staging Environment
  needs: [build-and-push]
  steps:
    - name: Deploy to Render (webhook trigger)
      run: curl -X POST "${{ secrets.RENDER_DEPLOY_HOOK_URL }}"
```

**Funcionalidad:**
- Se ejecuta solo en push a `main`
- Depende de que tests y build pasen
- Funciona con o sin Render configurado
- Deploy mediante webhook HTTP POST

---

## Flujo Completo del Pipeline

```
1. PUSH A MAIN/DEVELOP
   |
   ├─> test-backend (2-3 min)
   |   ├─ Levantar PostgreSQL
   |   ├─ Ejecutar tests unitarios (~357 tests)
   |   └─ Ejecutar tests de integración
   |
   ├─> test-frontend (1-2 min)
   |   ├─ Ejecutar tests (~56 tests)
   |   └─ Build de producción
   |
   └─> (Si ambos pasan y es push a main)
       |
       ├─> build-and-push (3-5 min)
       |   ├─ Build imagen Frontend
       |   ├─ Push a Docker Hub
       |   ├─ Build imagen Backend
       |   └─ Push a Docker Hub
       |
       └─> deploy-staging (30s - 2min)
           └─ Trigger deploy a Render/Staging

Tiempo total: 7-12 minutos
```

---

## Configuración Requerida

### Secrets en GitHub
**Ubicación:** Settings → Secrets and variables → Actions

| Secret | Descripción | Obligatorio |
|--------|-------------|-------------|
| DOCKER_USERNAME | Usuario Docker Hub: `damian2k` | SI |
| DOCKER_PASSWORD | Token de Docker Hub | SI |
| RENDER_DEPLOY_HOOK_URL | Webhook de Render | NO (opcional) |

### Obtener Docker Hub Token
1. https://hub.docker.com/settings/security
2. New Access Token
3. Permissions: Read, Write, Delete
4. Copiar token generado (dckr_pat_...)

---

## Evidencia de Cumplimiento

### Archivos del Pipeline
- `.github/workflows/ci-cd.yml` - Pipeline principal (196 líneas)
- `Dockerfile` - Multi-stage build frontend
- `api/Dockerfile` - Build backend
- `docker-compose.yml` - Orquestación (ya existente)
- `render.yaml` - Configuración para Render

### Documentación
- `docs/CI-CD.md` - Documentación completa del pipeline
- `docs/CONFIGURAR_SECRETS.md` - Guía de configuración
- `README.md` - Actualizado con badge de CI/CD

### Tests Implementados
- Backend: 357 tests (unitarios + integración)
- Frontend: 56 tests
- Total: 413 tests ejecutados automáticamente

### Imágenes Docker
- Publicadas en Docker Hub públicamente
- Versionadas con tags automáticos
- Optimizadas con multi-stage builds

---

## Ejecución del Pipeline

### Manual
1. Configurar secrets en GitHub
2. Hacer push a main:
   ```bash
   git push origin main
   ```
3. Ver ejecución: https://github.com/damianclausi2/proyecto-integrador-devops/actions

### Automático
- Cada push a `main` o `develop`
- Cada Pull Request hacia `main` o `develop`

---

## Verificación

Para verificar que el pipeline funciona:

1. **Ver badge en README.md:**
   - Badge muestra estado actual del pipeline

2. **Ver en GitHub Actions:**
   - Tab "Actions" en el repositorio
   - Historial de ejecuciones con logs completos

3. **Verificar imágenes Docker:**
   - https://hub.docker.com/u/damian2k
   - Imágenes actualizadas con cada push

4. **Verificar deploy:**
   - Si Render está configurado: URL del servicio
   - Si no: Imágenes disponibles para deploy manual

---

**Trabajo Práctico:** CI/CD con GitHub Actions  
**Fecha de implementación:** 19 de Noviembre de 2025  
**Estado:** COMPLETO - Cumple todos los requisitos
