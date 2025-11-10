#!/bin/bash

# Script para ejecutar todos los tests
# Cooperativa Eléctrica Gobernador Ugarte

echo "🧪 Ejecutando Tests..."
echo ""

# Colores
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

cd api

# 1. Tests Unitarios
echo -e "${BLUE}[1/2]${NC} Tests Unitarios..."
npm test -- __tests__/unit/ --silent
UNIT_EXIT=$?

if [ $UNIT_EXIT -eq 0 ]; then
    echo -e "${GREEN}✓${NC} Tests unitarios pasaron"
else
    echo -e "${RED}✗${NC} Tests unitarios fallaron"
fi
echo ""

# 2. Tests de Integración
echo -e "${BLUE}[2/2]${NC} Tests de Integración..."
npm test -- __tests__/integration/ --silent
INTEGRATION_EXIT=$?

if [ $INTEGRATION_EXIT -eq 0 ]; then
    echo -e "${GREEN}✓${NC} Tests de integración pasaron"
else
    echo -e "${RED}✗${NC} Tests de integración fallaron"
fi
echo ""

# Resumen
if [ $UNIT_EXIT -eq 0 ] && [ $INTEGRATION_EXIT -eq 0 ]; then
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}✅ Todos los tests pasaron${NC}"
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    exit 0
else
    echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${RED}✗ Algunos tests fallaron${NC}"
    echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    exit 1
fi
