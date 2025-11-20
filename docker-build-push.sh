#!/bin/bash

# Script para construir y subir imágenes Docker a Docker Hub
# Uso: ./docker-build-push.sh [tu-usuario-dockerhub]

set -e

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Verificar si se proporcionó el usuario de Docker Hub
if [ -z "$1" ]; then
    echo -e "${RED}Error: Debes proporcionar tu usuario de Docker Hub${NC}"
    echo "Uso: ./docker-build-push.sh [tu-usuario-dockerhub]"
    exit 1
fi

DOCKER_USER=$1
VERSION=${2:-latest}

echo -e "${GREEN}=== Construyendo y subiendo imágenes Docker ===${NC}"
echo -e "Usuario Docker Hub: ${YELLOW}$DOCKER_USER${NC}"
echo -e "Versión: ${YELLOW}$VERSION${NC}"
echo ""

# Verificar que Docker esté corriendo
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}Error: Docker no está corriendo${NC}"
    exit 1
fi

# Login a Docker Hub
echo -e "${YELLOW}Iniciando sesión en Docker Hub...${NC}"
docker login

# Construcción y push de la imagen del Frontend
echo -e "\n${GREEN}=== Construyendo imagen del Frontend ===${NC}"
docker build -t $DOCKER_USER/cooperativa-ugarte-frontend:$VERSION \
             -t $DOCKER_USER/cooperativa-ugarte-frontend:latest \
             -f Dockerfile .

echo -e "${GREEN}=== Subiendo imagen del Frontend a Docker Hub ===${NC}"
docker push $DOCKER_USER/cooperativa-ugarte-frontend:$VERSION
docker push $DOCKER_USER/cooperativa-ugarte-frontend:latest

# Construcción y push de la imagen del Backend
echo -e "\n${GREEN}=== Construyendo imagen del Backend ===${NC}"
docker build -t $DOCKER_USER/cooperativa-ugarte-backend:$VERSION \
             -t $DOCKER_USER/cooperativa-ugarte-backend:latest \
             -f api/Dockerfile ./api

echo -e "${GREEN}=== Subiendo imagen del Backend a Docker Hub ===${NC}"
docker push $DOCKER_USER/cooperativa-ugarte-backend:$VERSION
docker push $DOCKER_USER/cooperativa-ugarte-backend:latest

echo -e "\n${GREEN}OK ¡Proceso completado exitosamente!${NC}"
echo -e "\nImágenes creadas:"
echo -e "  - ${YELLOW}$DOCKER_USER/cooperativa-ugarte-frontend:$VERSION${NC}"
echo -e "  - ${YELLOW}$DOCKER_USER/cooperativa-ugarte-frontend:latest${NC}"
echo -e "  - ${YELLOW}$DOCKER_USER/cooperativa-ugarte-backend:$VERSION${NC}"
echo -e "  - ${YELLOW}$DOCKER_USER/cooperativa-ugarte-backend:latest${NC}"
echo -e "\nPuedes ver tus imágenes en: ${YELLOW}https://hub.docker.com/u/$DOCKER_USER${NC}"
