#!/bin/bash

# Script para iniciar todo el sistema de la cooperativa eléctrica
# Uso: ./start.sh

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║        🚀 INICIANDO SISTEMA COOPERATIVA ELÉCTRICA           ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

# Colores para output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Función para verificar si un puerto está en uso
check_port() {
    lsof -i:$1 >/dev/null 2>&1
    return $?
}

# Función para esperar que un servicio esté disponible
wait_for_service() {
    local port=$1
    local name=$2
    local max_attempts=30
    local attempt=0
    
    echo -e "${YELLOW}⏳ Esperando que $name esté disponible en puerto $port...${NC}"
    
    while [ $attempt -lt $max_attempts ]; do
        if check_port $port; then
            echo -e "${GREEN}✅ $name está corriendo en puerto $port${NC}"
            return 0
        fi
        attempt=$((attempt + 1))
        sleep 1
        echo -n "."
    done
    
    echo -e "${RED}❌ Error: $name no pudo iniciarse en el puerto $port${NC}"
    return 1
}

# Paso 1: Verificar que los puertos estén libres
echo -e "${BLUE}📋 Paso 1: Verificando puertos...${NC}"

if check_port 3001; then
    echo -e "${YELLOW}⚠️  Puerto 3001 en uso. Liberando...${NC}"
    lsof -ti:3001 | xargs kill -9 2>/dev/null
    sleep 2
fi

if check_port 3002; then
    echo -e "${YELLOW}⚠️  Puerto 3002 en uso. Liberando...${NC}"
    lsof -ti:3002 | xargs kill -9 2>/dev/null
    pkill -f "vite" 2>/dev/null
    sleep 2
fi

echo -e "${GREEN}✅ Puertos liberados${NC}"
echo ""

# Paso 2: Verificar dependencias
echo -e "${BLUE}📋 Paso 2: Verificando dependencias...${NC}"

if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}📦 Instalando dependencias del frontend...${NC}"
    npm install
fi

if [ ! -d "backend/node_modules" ]; then
    echo -e "${BLUE}📦 Instalando dependencias del backend...${NC}"
    cd api && npm install && cd ..
fi

echo -e "${GREEN}✅ Dependencias verificadas${NC}"
echo ""

# Crear directorio de logs si no existe
mkdir -p logs

# Paso 3: Iniciar Backend
echo -e "${BLUE}📋 Paso 3: Iniciando Backend (Puerto 3001)...${NC}"
cd api
npm start > ../logs/backend.log 2>&1 &
BACKEND_PID=$!
cd ..

# Esperar a que el backend esté disponible
if wait_for_service 3001 "Backend"; then
    echo -e "${GREEN}✅ Backend iniciado correctamente (PID: $BACKEND_PID)${NC}"
    echo $BACKEND_PID > logs/backend.pid
else
    echo -e "${RED}❌ Error al iniciar el backend${NC}"
    echo -e "${YELLOW}💡 Revisa los logs en: logs/backend.log${NC}"
    exit 1
fi

# Verificar salud del backend
echo -e "${YELLOW}🔍 Verificando salud del backend...${NC}"
sleep 2
HEALTH_CHECK=$(curl -s http://localhost:3001/api/salud 2>/dev/null)
if echo "$HEALTH_CHECK" | grep -q "ok"; then
    echo -e "${GREEN}✅ Backend respondiendo correctamente${NC}"
else
    echo -e "${YELLOW}⚠️  Backend iniciado pero la respuesta de salud no es la esperada${NC}"
fi

echo ""

# Paso 4: Iniciar Frontend
echo -e "${BLUE}📋 Paso 4: Iniciando Frontend (Puerto 3002)...${NC}"
npm run dev > logs/frontend.log 2>&1 &
FRONTEND_PID=$!

# Esperar a que el frontend esté disponible
if wait_for_service 3002 "Frontend"; then
    echo -e "${GREEN}✅ Frontend iniciado correctamente (PID: $FRONTEND_PID)${NC}"
    echo $FRONTEND_PID > logs/frontend.pid
else
    echo -e "${RED}❌ Error al iniciar el frontend${NC}"
    echo -e "${YELLOW}💡 Revisa los logs en: logs/frontend.log${NC}"
    exit 1
fi

echo ""
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║              ✅ SISTEMA INICIADO EXITOSAMENTE               ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""
echo -e "${GREEN}📊 Estado de los Servicios:${NC}"
echo ""
echo -e "  ${BLUE}🔹 Backend:${NC}"
echo -e "     URL: ${YELLOW}http://localhost:3001${NC}"
echo -e "     PID: ${YELLOW}$BACKEND_PID${NC}"
echo -e "     Log: ${YELLOW}logs/backend.log${NC}"
echo ""
echo -e "  ${BLUE}🔹 Frontend:${NC}"
echo -e "     URL: ${YELLOW}http://localhost:3002${NC}"
echo -e "     PID: ${YELLOW}$FRONTEND_PID${NC}"
echo -e "     Log: ${YELLOW}logs/frontend.log${NC}"
echo ""
echo -e "${GREEN}🌐 Accede al sistema en: ${YELLOW}http://localhost:3002${NC}"
echo ""
echo -e "${YELLOW}💡 Para detener el sistema, ejecuta: ${NC}./stop.sh"
echo -e "${YELLOW}💡 Para ver logs en tiempo real:${NC}"
echo -e "   Backend:  ${BLUE}tail -f logs/backend.log${NC}"
echo -e "   Frontend: ${BLUE}tail -f logs/frontend.log${NC}"
echo ""
