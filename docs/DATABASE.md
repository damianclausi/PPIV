# Integración con Base de Datos PostgreSQL

Esta rama contiene la integración con la base de datos PostgreSQL para el sistema de la Cooperativa Eléctrica "Gobernador Ugarte".

## Base de Datos

- **Imagen Docker**: `damian2k/cooperativa-ugarte-db:latest`
- **Puerto**: 5432
- **Base de datos**: cooperativa_ugarte
- **Usuario**: cooperativa_user
- **Contraseña**: cooperativa_pass

## Configuración para Desarrollo

### 1. Con Docker Compose (Recomendado)

```bash
# Iniciar la base de datos
docker-compose up postgres -d

# Ver logs de la base de datos
docker-compose logs postgres

# Parar la base de datos
docker-compose down
```

### 2. Solo con Docker

```bash
# Ejecutar la imagen de la base de datos
docker run -d \
  --name cooperativa-db \
  -e POSTGRES_DB=cooperativa_ugarte \
  -e POSTGRES_USER=cooperativa_user \
  -e POSTGRES_PASSWORD=cooperativa_pass \
  -p 5432:5432 \
  damian2k/cooperativa-ugarte-db:latest

# Conectar a la base de datos
docker exec -it cooperativa-db psql -U cooperativa_user -d cooperativa_ugarte
```

### 3. Variables de Entorno

Copia el archivo de ejemplo y ajusta las variables según tu entorno:

```bash
cp .env.example .env
```

## Conexión desde la Aplicación

Para conectar la aplicación React con la base de datos, necesitarás configurar un backend (Node.js/Express, Next.js API routes, etc.) que maneje las consultas a PostgreSQL.

### Librerías Sugeridas

```bash
# Para el backend
npm install pg @types/pg
# o
npm install prisma @prisma/client

# Para validación
npm install zod

# Para variables de entorno
npm install dotenv
```

## Estructura de la Base de Datos

La imagen Docker ya contiene el esquema y datos iniciales para:

- **Usuarios**: Clientes, operarios y administrativos
- **Servicios**: Conexiones eléctricas
- **Facturación**: Facturas y pagos
- **Reclamos**: Sistema de tickets
- **Cuadrillas**: Equipos de trabajo
- **Métricas**: Datos para reportes

## Comandos Útiles

```bash
# Ver contenedores activos
docker ps

# Conectar a la base de datos
docker exec -it cooperativa-db psql -U cooperativa_user -d cooperativa_ugarte

# Backup de la base de datos
docker exec cooperativa-db pg_dump -U cooperativa_user cooperativa_ugarte > backup.sql

# Restaurar backup
docker exec -i cooperativa-db psql -U cooperativa_user cooperativa_ugarte < backup.sql
```

## Próximos Pasos

1. **Backend API**: Implementar endpoints para la comunicación con la base de datos
2. **Autenticación**: Sistema de login para los diferentes perfiles
3. **Queries**: Definir las consultas necesarias para cada funcionalidad
4. **Estado Global**: Implementar context/state management para datos de la DB
5. **Testing**: Configurar tests de integración con la base de datos