#!/bin/bash

# Script para detener todo el sistema de la cooperativa eléctrica
# Uso: ./stop.sh

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║        🛑 DETENIENDO SISTEMA COOPERATIVA ELÉCTRICA          ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

# Colores para output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Función para verificar si un proceso está corriendo
is_process_running() {
    if ps -p $1 > /dev/null 2>&1; then
        return 0
    else
        return 1
    fi
}

# Función para detener un proceso
stop_process() {
    local pid=$1
    local name=$2
    
    if is_process_running $pid; then
        echo -e "${YELLOW}⏳ Deteniendo $name (PID: $pid)...${NC}"
        kill $pid 2>/dev/null
        
        # Esperar hasta 5 segundos para que se detenga gracefully
        local attempts=0
        while [ $attempts -lt 5 ] && is_process_running $pid; do
            sleep 1
            attempts=$((attempts + 1))
        done
        
        # Si aún está corriendo, forzar
        if is_process_running $pid; then
            echo -e "${YELLOW}⚠️  Forzando detención de $name...${NC}"
            kill -9 $pid 2>/dev/null
            sleep 1
        fi
        
        if ! is_process_running $pid; then
            echo -e "${GREEN}✅ $name detenido correctamente${NC}"
            return 0
        else
            echo -e "${RED}❌ No se pudo detener $name${NC}"
            return 1
        fi
    else
        echo -e "${YELLOW}⚠️  $name no estaba corriendo (PID: $pid)${NC}"
        return 0
    fi
}

# Paso 1: Detener Frontend usando PID guardado
echo -e "${BLUE}📋 Paso 1: Deteniendo Frontend...${NC}"

if [ -f "logs/frontend.pid" ]; then
    FRONTEND_PID=$(cat logs/frontend.pid)
    stop_process $FRONTEND_PID "Frontend"
    rm -f logs/frontend.pid
else
    echo -e "${YELLOW}⚠️  No se encontró PID del frontend guardado${NC}"
fi

# Detener cualquier proceso en puerto 3002
if lsof -i:3002 >/dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  Liberando puerto 3002...${NC}"
    lsof -ti:3002 | xargs kill -9 2>/dev/null
fi

# Detener procesos de Vite
if pgrep -f "vite" > /dev/null; then
    echo -e "${YELLOW}⚠️  Deteniendo procesos de Vite...${NC}"
    pkill -f "vite" 2>/dev/null
fi

echo -e "${GREEN}✅ Frontend detenido${NC}"
echo ""

# Paso 2: Detener Backend usando PID guardado
echo -e "${BLUE}📋 Paso 2: Deteniendo Backend...${NC}"

if [ -f "logs/backend.pid" ]; then
    BACKEND_PID=$(cat logs/backend.pid)
    stop_process $BACKEND_PID "Backend"
    rm -f logs/backend.pid
else
    echo -e "${YELLOW}⚠️  No se encontró PID del backend guardado${NC}"
fi

# Detener cualquier proceso en puerto 3001
if lsof -i:3001 >/dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  Liberando puerto 3001...${NC}"
    lsof -ti:3001 | xargs kill -9 2>/dev/null
fi

echo -e "${GREEN}✅ Backend detenido${NC}"
echo ""

# Paso 3: Verificar que los puertos estén libres
echo -e "${BLUE}📋 Paso 3: Verificando puertos...${NC}"

PORT_3001_FREE=true
PORT_3002_FREE=true

if lsof -i:3001 >/dev/null 2>&1; then
    echo -e "${RED}❌ Puerto 3001 aún en uso${NC}"
    PORT_3001_FREE=false
else
    echo -e "${GREEN}✅ Puerto 3001 libre${NC}"
fi

if lsof -i:3002 >/dev/null 2>&1; then
    echo -e "${RED}❌ Puerto 3002 aún en uso${NC}"
    PORT_3002_FREE=false
else
    echo -e "${GREEN}✅ Puerto 3002 libre${NC}"
fi

echo ""

# Paso 4: Limpiar procesos huérfanos (opcional)
echo -e "${BLUE}📋 Paso 4: Limpiando procesos relacionados...${NC}"

# Buscar y matar procesos de Node.js relacionados con el proyecto
CURRENT_DIR=$(pwd)
NODE_PROCESSES=$(ps aux | grep node | grep "$CURRENT_DIR" | grep -v grep | awk '{print $2}')

if [ ! -z "$NODE_PROCESSES" ]; then
    echo -e "${YELLOW}⚠️  Encontrados procesos Node.js relacionados:${NC}"
    echo "$NODE_PROCESSES"
    echo -e "${YELLOW}¿Deseas detenerlos? (s/n)${NC}"
    read -t 5 -n 1 response || response="n"
    echo ""
    
    if [ "$response" = "s" ] || [ "$response" = "S" ]; then
        echo "$NODE_PROCESSES" | xargs kill 2>/dev/null
        echo -e "${GREEN}✅ Procesos limpiados${NC}"
    else
        echo -e "${YELLOW}⚠️  Procesos no detenidos${NC}"
    fi
else
    echo -e "${GREEN}✅ No hay procesos huérfanos${NC}"
fi

echo ""

# Resumen final
if $PORT_3001_FREE && $PORT_3002_FREE; then
    echo "╔══════════════════════════════════════════════════════════════╗"
    echo "║            ✅ SISTEMA DETENIDO EXITOSAMENTE                 ║"
    echo "╚══════════════════════════════════════════════════════════════╝"
    echo ""
    echo -e "${GREEN}✅ Todos los servicios han sido detenidos${NC}"
    echo -e "${GREEN}✅ Todos los puertos están libres${NC}"
    echo ""
    echo -e "${YELLOW}💡 Para iniciar el sistema nuevamente, ejecuta: ${NC}./start.sh"
else
    echo "╔══════════════════════════════════════════════════════════════╗"
    echo "║          ⚠️  SISTEMA DETENIDO CON ADVERTENCIAS              ║"
    echo "╚══════════════════════════════════════════════════════════════╝"
    echo ""
    echo -e "${YELLOW}⚠️  Algunos puertos aún están en uso${NC}"
    echo -e "${YELLOW}💡 Puedes forzar la liberación con:${NC}"
    echo -e "   ${BLUE}lsof -ti:3001 | xargs kill -9${NC}"
    echo -e "   ${BLUE}lsof -ti:3002 | xargs kill -9${NC}"
fi

echo ""
echo -e "${BLUE}📊 Logs guardados en:${NC}"
echo -e "   Backend:  ${YELLOW}logs/backend.log${NC}"
echo -e "   Frontend: ${YELLOW}logs/frontend.log${NC}"
echo ""
