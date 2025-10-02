#!/bin/bash

###############################################################################
# Script: update-docker.sh
# Descripción: Actualiza la imagen Docker de PostgreSQL desde Docker Hub
# Autor: Sistema PPIV
# Fecha: 2 de Octubre 2025
###############################################################################

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Nombre de la imagen y contenedor
IMAGE_NAME="damian2k/cooperativa-ugarte-db:latest"
CONTAINER_NAME="cooperativa-db"
DB_PORT=5432

echo -e "${BLUE}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║     ACTUALIZAR IMAGEN DOCKER DESDE DOCKER HUB           ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════════╝${NC}"
echo ""

# Función para verificar si el contenedor existe
container_exists() {
    docker ps -a --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"
}

# Función para verificar si el contenedor está corriendo
container_running() {
    docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"
}

# Paso 1: Detener contenedor si está corriendo
echo -e "${YELLOW}[1/5]${NC} Verificando contenedor existente..."
if container_exists; then
    if container_running; then
        echo -e "${YELLOW}⏹  Deteniendo contenedor ${CONTAINER_NAME}...${NC}"
        docker stop ${CONTAINER_NAME} >/dev/null 2>&1
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✓ Contenedor detenido${NC}"
        else
            echo -e "${RED}✗ Error al detener contenedor${NC}"
            exit 1
        fi
    else
        echo -e "${GREEN}✓ Contenedor ya está detenido${NC}"
    fi
    
    # Eliminar contenedor
    echo -e "${YELLOW}🗑  Eliminando contenedor antiguo...${NC}"
    docker rm ${CONTAINER_NAME} >/dev/null 2>&1
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Contenedor eliminado${NC}"
    else
        echo -e "${RED}✗ Error al eliminar contenedor${NC}"
        exit 1
    fi
else
    echo -e "${GREEN}✓ No hay contenedor previo${NC}"
fi

# Paso 2: Eliminar imagen antigua
echo -e "\n${YELLOW}[2/5]${NC} Eliminando imagen antigua..."
if docker images | grep -q "damian2k/cooperativa-ugarte-db"; then
    docker rmi ${IMAGE_NAME} >/dev/null 2>&1
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Imagen antigua eliminada${NC}"
    else
        echo -e "${YELLOW}⚠ No se pudo eliminar imagen antigua (puede estar en uso)${NC}"
    fi
else
    echo -e "${GREEN}✓ No hay imagen antigua${NC}"
fi

# Paso 3: Descargar última versión desde Docker Hub
echo -e "\n${YELLOW}[3/5]${NC} Descargando última versión desde Docker Hub..."
echo -e "${BLUE}📥 Imagen: ${IMAGE_NAME}${NC}"
docker pull ${IMAGE_NAME}
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Imagen descargada exitosamente${NC}"
else
    echo -e "${RED}✗ Error al descargar imagen${NC}"
    exit 1
fi

# Paso 4: Crear y ejecutar nuevo contenedor
echo -e "\n${YELLOW}[4/5]${NC} Iniciando nuevo contenedor..."
docker run -d \
    --name ${CONTAINER_NAME} \
    -p ${DB_PORT}:5432 \
    -e POSTGRES_DB=cooperativa_ugarte_db \
    -e POSTGRES_USER=coop_user \
    -e POSTGRES_PASSWORD=cooperativa2024 \
    ${IMAGE_NAME} >/dev/null 2>&1

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Contenedor iniciado${NC}"
else
    echo -e "${RED}✗ Error al iniciar contenedor${NC}"
    exit 1
fi

# Paso 5: Verificar que el contenedor está corriendo
echo -e "\n${YELLOW}[5/5]${NC} Verificando estado del contenedor..."
sleep 3

if container_running; then
    echo -e "${GREEN}✓ Contenedor corriendo correctamente${NC}"
    
    # Mostrar información del contenedor
    echo -e "\n${BLUE}📊 Información del contenedor:${NC}"
    docker ps --filter "name=${CONTAINER_NAME}" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
    
    # Verificar conectividad
    echo -e "\n${YELLOW}🔍 Verificando conectividad a PostgreSQL...${NC}"
    sleep 2
    docker exec ${CONTAINER_NAME} pg_isready -U coop_user -d cooperativa_ugarte_db >/dev/null 2>&1
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ PostgreSQL está listo para aceptar conexiones${NC}"
        
        # Contar reclamos
        echo -e "\n${YELLOW}📋 Verificando datos en la base...${NC}"
        RECLAMOS_COUNT=$(docker exec ${CONTAINER_NAME} psql -U coop_user -d cooperativa_ugarte_db -t -c "SELECT COUNT(*) FROM reclamo;" 2>/dev/null | tr -d ' ')
        if [ ! -z "$RECLAMOS_COUNT" ]; then
            echo -e "${GREEN}✓ Total de reclamos en la base: ${RECLAMOS_COUNT}${NC}"
        fi
    else
        echo -e "${YELLOW}⚠ PostgreSQL aún no está listo (espere unos segundos)${NC}"
    fi
    
    echo -e "\n${GREEN}╔══════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║         ✓ ACTUALIZACIÓN COMPLETADA EXITOSAMENTE         ║${NC}"
    echo -e "${GREEN}╚══════════════════════════════════════════════════════════╝${NC}"
    echo -e "\n${BLUE}📌 Base de datos disponible en:${NC} localhost:${DB_PORT}"
    echo -e "${BLUE}📌 Usuario:${NC} coop_user"
    echo -e "${BLUE}📌 Database:${NC} cooperativa_ugarte_db"
    echo -e "\n${YELLOW}💡 Tip:${NC} Reinicia el backend si ya estaba corriendo:"
    echo -e "   ${BLUE}./restart.sh${NC}"
else
    echo -e "${RED}✗ Error: Contenedor no está corriendo${NC}"
    echo -e "${YELLOW}Ver logs:${NC} docker logs ${CONTAINER_NAME}"
    exit 1
fi
