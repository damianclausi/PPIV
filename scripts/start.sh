#!/bin/bash

# Script de inicio rápido para el sistema completo
# Cooperativa Eléctrica Gobernador Ugarte

echo "🚀 Iniciando Sistema Completo..."
echo ""

# Colores
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. Verificar Docker
echo -e "${BLUE}[1/5]${NC} Verificando Docker..."
if ! command -v docker &> /dev/null; then
    echo -e "${YELLOW}⚠️  Docker no encontrado. Por favor instala Docker.${NC}"
    exit 1
fi
echo -e "${GREEN}✓${NC} Docker OK"
echo ""

# 2. Iniciar PostgreSQL
echo -e "${BLUE}[2/5]${NC} Iniciando PostgreSQL..."
docker-compose up postgres -d
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓${NC} PostgreSQL iniciado"
else
    echo -e "${YELLOW}⚠️  Error al iniciar PostgreSQL${NC}"
    exit 1
fi
echo ""

# 3. Esperar que PostgreSQL esté listo
echo -e "${BLUE}[3/5]${NC} Esperando PostgreSQL..."
sleep 3
echo -e "${GREEN}✓${NC} PostgreSQL listo"
echo ""

# 4. Iniciar Backend
echo -e "${BLUE}[4/5]${NC} Iniciando Backend API..."
cd backend
pkill -f "node server.js" 2>/dev/null
node server.js > server.log 2>&1 &
BACKEND_PID=$!
sleep 2

# Verificar que el backend esté corriendo
if ps -p $BACKEND_PID > /dev/null; then
    echo -e "${GREEN}✓${NC} Backend API corriendo en http://localhost:3001"
else
    echo -e "${YELLOW}⚠️  Error al iniciar Backend${NC}"
    cat server.log
    exit 1
fi
cd ..
echo ""

# 5. Iniciar Frontend
echo -e "${BLUE}[5/5]${NC} Iniciando Frontend..."
npm run dev > frontend.log 2>&1 &
FRONTEND_PID=$!
sleep 3

if ps -p $FRONTEND_PID > /dev/null; then
    echo -e "${GREEN}✓${NC} Frontend corriendo en http://localhost:3000"
else
    echo -e "${YELLOW}⚠️  Error al iniciar Frontend${NC}"
    exit 1
fi
echo ""

# Resumen
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ Sistema Completo Iniciado${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "🌐 ${BLUE}Frontend:${NC}    http://localhost:3000"
echo -e "🔧 ${BLUE}Backend API:${NC} http://localhost:3001"
echo -e "💾 ${BLUE}PostgreSQL:${NC}  localhost:5432"
echo ""
echo -e "👤 ${BLUE}Usuario de prueba:${NC}"
echo -e "   Email:    mariaelena.gonzalez@hotmail.com"
echo -e "   Password: password123"
echo ""
echo -e "📝 ${BLUE}Logs:${NC}"
echo -e "   Backend:  tail -f backend/server.log"
echo -e "   Frontend: tail -f frontend.log"
echo ""
echo -e "🛑 ${BLUE}Para detener:${NC}"
echo -e "   ./scripts/stop.sh"
echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
