# Monitoreo con Prometheus y Grafana

Este proyecto incluye integración completa de **Prometheus** para recolección de métricas y **Grafana** para visualización y dashboards.

## Arquitectura de Monitoreo

```
API Express → /metrics endpoint → Prometheus → Grafana
```

### Componentes

1. **API Express**: Expone métricas en el endpoint `/metrics` usando `prom-client`
2. **Prometheus**: Recolecta y almacena métricas cada 15 segundos
3. **Grafana**: Visualiza las métricas con dashboards pre-configurados

## Inicio Rápido

### 1. Iniciar los Servicios

```bash
# Iniciar todos los servicios (incluye Prometheus y Grafana)
docker-compose up -d

# Verificar que todos los servicios estén corriendo
docker-compose ps
```

### 2. Acceder a las Interfaces

- **Prometheus**: http://localhost:9090
- **Grafana**: http://localhost:3000
  - Usuario: `admin`
  - Contraseña: `admin123`

### 3. Verificar Métricas

```bash
# Verificar que la API expone métricas
curl http://localhost:3001/metrics

# Verificar que Prometheus está scrapeando
curl http://localhost:9090/api/v1/targets
```

## Métricas Disponibles

La API expone las siguientes métricas personalizadas:

### HTTP Metrics

- `http_requests_total`: Contador total de peticiones HTTP
  - Labels: `method`, `route`, `status_code`
- `http_request_duration_seconds`: Histograma de duración de peticiones
  - Labels: `method`, `route`, `status_code`
  - Buckets: [0.1s, 0.5s, 1s, 2s, 5s, 10s]
- `http_requests_in_progress`: Gauge de peticiones en progreso
  - Labels: `method`, `route`

### Database Metrics

- `database_connections_active`: Gauge de conexiones activas a PostgreSQL

## Configuración de Prometheus

El archivo `prometheus.yml` configura:

- **Scrape interval**: 15 segundos (global)
- **API scraping**: 10 segundos
- **Retention**: 200 horas de datos históricos

### Ver Configuración

```bash
cat prometheus.yml
```

### Modificar Configuración

1. Editar `prometheus.yml`
2. Recargar configuración:
   ```bash
   curl -X POST http://localhost:9090/-/reload
   ```

## Dashboards de Grafana

### Dashboard Pre-configurado

El proyecto incluye un dashboard pre-configurado: **"Cooperativa API - Métricas"**

Este dashboard muestra:

1. **Requests por Segundo**: Gráfico de tasa de peticiones HTTP
2. **Duración de Requests (p95)**: Percentil 95 de latencia
3. **Total de Requests**: Contador total de peticiones en la última hora
4. **Requests por Código de Estado**: Distribución de códigos HTTP (200, 404, 500, etc.)
5. **Conexiones Activas a la Base de Datos**: Monitoreo de conexiones PostgreSQL
6. **Requests en Progreso**: Peticiones actualmente siendo procesadas

### Acceder al Dashboard

1. Iniciar sesión en Grafana (http://localhost:3000)
2. Ir a **Dashboards** → **Browse**
3. Seleccionar **"Cooperativa API - Métricas"**

### Personalizar Dashboards

Los dashboards se encuentran en:
```
grafana/dashboards/cooperativa-api.json
```

Para agregar nuevos paneles:

1. Editar el JSON del dashboard en Grafana UI
2. Exportar el dashboard actualizado
3. Guardar en `grafana/dashboards/`

## Consultas PromQL Útiles

### Requests por segundo (últimos 5 minutos)
```promql
rate(http_requests_total[5m])
```

### Latencia p95
```promql
histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))
```

### Total de requests en la última hora
```promql
sum(increase(http_requests_total[1h]))
```

### Requests por código de estado
```promql
sum by (status_code) (rate(http_requests_total[5m]))
```

### Tasa de errores (5xx)
```promql
sum(rate(http_requests_total{status_code=~"5.."}[5m])) / sum(rate(http_requests_total[5m]))
```

## Troubleshooting

### Prometheus no está scrapeando métricas

1. Verificar que la API esté corriendo:
   ```bash
   curl http://localhost:3001/api/salud
   ```

2. Verificar que el endpoint de métricas funcione:
   ```bash
   curl http://localhost:3001/metrics
   ```

3. Verificar targets en Prometheus:
   - Ir a http://localhost:9090/targets
   - Verificar que el target `cooperativa-api` esté "UP"

### Grafana no muestra datos

1. Verificar que Prometheus esté corriendo:
   ```bash
   docker-compose ps prometheus
   ```

2. Verificar datasource en Grafana:
   - Ir a **Configuration** → **Data Sources**
   - Verificar que "Prometheus" esté configurado y funcional

3. Verificar que Prometheus tenga datos:
   - En Prometheus UI, ejecutar: `up{job="cooperativa-api"}`

### Métricas no aparecen

1. Verificar que `prom-client` esté instalado:
   ```bash
   cd api && npm list prom-client
   ```

2. Verificar logs de la API:
   ```bash
   docker-compose logs -f api
   ```

3. Regenerar la imagen Docker de la API si es necesario:
   ```bash
   ./docker-build-push.sh damian2k
   docker-compose up -d --force-recreate api
   ```

## Agregar Nuevas Métricas

Para agregar nuevas métricas personalizadas en la API:

1. Importar tipos de métricas en `api/index.js`:
   ```javascript
   import { Counter, Histogram, Gauge } from 'prom-client';
   ```

2. Crear la métrica:
   ```javascript
   const miMetrica = new Counter({
     name: 'mi_metrica_total',
     help: 'Descripción de la métrica',
     labelNames: ['label1', 'label2']
   });
   ```

3. Usar la métrica en tu código:
   ```javascript
   miMetrica.inc({ label1: 'valor1', label2: 'valor2' });
   ```

4. La métrica estará disponible automáticamente en `/metrics`

## Retención de Datos

- **Prometheus**: 200 horas (configurado en `docker-compose.yml`)
- **Grafana**: Persistente en volumen Docker

Para cambiar la retención:

1. Editar `docker-compose.yml`:
   ```yaml
   command:
     - '--storage.tsdb.retention.time=500h'  # Cambiar aquí
   ```

2. Reiniciar Prometheus:
   ```bash
   docker-compose restart prometheus
   ```

## Seguridad

⚠️ **Importante para Producción:**

1. Cambiar credenciales de Grafana:
   ```bash
   # Editar docker-compose.yml
   GF_SECURITY_ADMIN_PASSWORD=tu_password_seguro
   ```

2. Restringir acceso a Prometheus (usar reverse proxy con autenticación)

3. Considerar usar HTTPS para todas las interfaces

4. Limitar acceso a la red Docker para servicios de monitoreo

## Recursos Adicionales

- [Documentación de Prometheus](https://prometheus.io/docs/)
- [Documentación de Grafana](https://grafana.com/docs/)
- [PromQL Query Language](https://prometheus.io/docs/prometheus/latest/querying/basics/)
- [prom-client Documentation](https://github.com/siimon/prom-client)

