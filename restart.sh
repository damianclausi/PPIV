#!/bin/bash

# Script para reiniciar todo el sistema
# Uso: ./restart.sh

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║        🔄 REINICIANDO SISTEMA COOPERATIVA ELÉCTRICA         ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

# Colores
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}⏳ Deteniendo sistema...${NC}"
./stop.sh

echo ""
echo -e "${YELLOW}⏳ Esperando 3 segundos...${NC}"
sleep 3

echo ""
echo -e "${YELLOW}⏳ Iniciando sistema...${NC}"
./start.sh
