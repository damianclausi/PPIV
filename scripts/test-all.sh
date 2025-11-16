#!/bin/bash

# Script para ejecutar todos los tests (backend + frontend)
# Uso: ./scripts/test-all.sh

set -e  # Salir si hay algún error

echo "🧪 Ejecutando todos los tests..."
echo ""

# Colores para output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Tests del Frontend
echo -e "${BLUE}📱 Ejecutando tests del Frontend...${NC}"
cd "$(dirname "$0")/.."
npm run test:run
FRONTEND_EXIT=$?

if [ $FRONTEND_EXIT -eq 0 ]; then
    echo -e "${GREEN}✅ Tests del Frontend pasaron${NC}"
else
    echo -e "${YELLOW}❌ Tests del Frontend fallaron${NC}"
fi

echo ""

# Tests del Backend
echo -e "${BLUE}🔧 Ejecutando tests del Backend...${NC}"
cd api
npm test
BACKEND_EXIT=$?

if [ $BACKEND_EXIT -eq 0 ]; then
    echo -e "${GREEN}✅ Tests del Backend pasaron${NC}"
else
    echo -e "${YELLOW}❌ Tests del Backend fallaron${NC}"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Resumen final
if [ $FRONTEND_EXIT -eq 0 ] && [ $BACKEND_EXIT -eq 0 ]; then
    echo -e "${GREEN}🎉 Todos los tests pasaron exitosamente!${NC}"
    exit 0
else
    echo -e "${YELLOW}⚠️  Algunos tests fallaron${NC}"
    exit 1
fi

