#!/bin/bash

# Script para detener el sistema completo
# Cooperativa Eléctrica Gobernador Ugarte

echo "🛑 Deteniendo Sistema..."
echo ""

# Colores
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 1. Detener Frontend
echo -e "${BLUE}[1/3]${NC} Deteniendo Frontend..."
pkill -f "vite"
echo -e "${GREEN}✓${NC} Frontend detenido"
echo ""

# 2. Detener Backend
echo -e "${BLUE}[2/3]${NC} Deteniendo Backend..."
pkill -f "node index.js"
echo -e "${GREEN}✓${NC} Backend detenido"
echo ""

# 3. Detener PostgreSQL (opcional)
read -p "¿Detener PostgreSQL? (y/N): " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${BLUE}[3/3]${NC} Deteniendo PostgreSQL..."
    docker-compose down
    echo -e "${GREEN}✓${NC} PostgreSQL detenido"
else
    echo -e "${BLUE}[3/3]${NC} PostgreSQL sigue corriendo"
fi
echo ""

echo -e "${GREEN}✅ Sistema detenido${NC}"
