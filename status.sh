#!/bin/bash

# Script para verificar el estado del sistema
# Uso: ./status.sh

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║           📊 ESTADO DEL SISTEMA COOPERATIVA                 ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

# Colores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Verificar Backend
echo -e "${BLUE}🔹 Backend (Puerto 3001):${NC}"
if lsof -i:3001 >/dev/null 2>&1; then
    echo -e "   Estado: ${GREEN}✅ CORRIENDO${NC}"
    BACKEND_PID=$(lsof -ti:3001)
    echo -e "   PID: ${YELLOW}$BACKEND_PID${NC}"
    
    # Verificar salud
    HEALTH=$(curl -s http://localhost:3001/api/salud 2>/dev/null)
    if echo "$HEALTH" | grep -q "ok"; then
        echo -e "   Salud: ${GREEN}✅ OK${NC}"
    else
        echo -e "   Salud: ${RED}❌ ERROR${NC}"
    fi
    
    # Memoria
    if [ ! -z "$BACKEND_PID" ]; then
        MEM=$(ps -o rss= -p $BACKEND_PID 2>/dev/null | awk '{printf "%.1f MB", $1/1024}')
        if [ ! -z "$MEM" ]; then
            echo -e "   Memoria: ${YELLOW}$MEM${NC}"
        fi
    fi
else
    echo -e "   Estado: ${RED}❌ DETENIDO${NC}"
fi

echo ""

# Verificar Frontend
echo -e "${BLUE}🔹 Frontend (Puerto 3002):${NC}"
if lsof -i:3002 >/dev/null 2>&1; then
    echo -e "   Estado: ${GREEN}✅ CORRIENDO${NC}"
    FRONTEND_PID=$(lsof -ti:3002)
    echo -e "   PID: ${YELLOW}$FRONTEND_PID${NC}"
    
    # Memoria
    if [ ! -z "$FRONTEND_PID" ]; then
        MEM=$(ps -o rss= -p $FRONTEND_PID 2>/dev/null | awk '{printf "%.1f MB", $1/1024}')
        if [ ! -z "$MEM" ]; then
            echo -e "   Memoria: ${YELLOW}$MEM${NC}"
        fi
    fi
else
    echo -e "   Estado: ${RED}❌ DETENIDO${NC}"
fi

echo ""

# Verificar Base de Datos (PostgreSQL)
echo -e "${BLUE}🔹 Base de Datos:${NC}"
if systemctl is-active --quiet postgresql 2>/dev/null; then
    echo -e "   PostgreSQL: ${GREEN}✅ ACTIVO${NC}"
elif pgrep -x postgres >/dev/null; then
    echo -e "   PostgreSQL: ${GREEN}✅ ACTIVO${NC}"
else
    echo -e "   PostgreSQL: ${RED}❌ INACTIVO${NC}"
fi

echo ""

# PIDs guardados
echo -e "${BLUE}📋 PIDs Guardados:${NC}"
if [ -f "logs/backend.pid" ]; then
    SAVED_BACKEND_PID=$(cat logs/backend.pid)
    echo -e "   Backend PID: ${YELLOW}$SAVED_BACKEND_PID${NC}"
else
    echo -e "   Backend PID: ${YELLOW}No guardado${NC}"
fi

if [ -f "logs/frontend.pid" ]; then
    SAVED_FRONTEND_PID=$(cat logs/frontend.pid)
    echo -e "   Frontend PID: ${YELLOW}$SAVED_FRONTEND_PID${NC}"
else
    echo -e "   Frontend PID: ${YELLOW}No guardado${NC}"
fi

echo ""

# Logs
echo -e "${BLUE}📄 Logs:${NC}"
if [ -f "logs/backend.log" ]; then
    BACKEND_LOG_SIZE=$(du -h logs/backend.log | cut -f1)
    BACKEND_LOG_LINES=$(wc -l < logs/backend.log)
    echo -e "   backend.log: ${YELLOW}$BACKEND_LOG_SIZE ($BACKEND_LOG_LINES líneas)${NC}"
else
    echo -e "   backend.log: ${YELLOW}No existe${NC}"
fi

if [ -f "logs/frontend.log" ]; then
    FRONTEND_LOG_SIZE=$(du -h logs/frontend.log | cut -f1)
    FRONTEND_LOG_LINES=$(wc -l < logs/frontend.log)
    echo -e "   frontend.log: ${YELLOW}$FRONTEND_LOG_SIZE ($FRONTEND_LOG_LINES líneas)${NC}"
else
    echo -e "   frontend.log: ${YELLOW}No existe${NC}"
fi

echo ""

# URLs de acceso
echo -e "${BLUE}🌐 URLs de Acceso:${NC}"
if lsof -i:3001 >/dev/null 2>&1; then
    echo -e "   Backend:  ${GREEN}http://localhost:3001${NC}"
    echo -e "   API:      ${GREEN}http://localhost:3001/api/salud${NC}"
else
    echo -e "   Backend:  ${RED}No disponible${NC}"
fi

if lsof -i:3002 >/dev/null 2>&1; then
    echo -e "   Frontend: ${GREEN}http://localhost:3002${NC}"
else
    echo -e "   Frontend: ${RED}No disponible${NC}"
fi

echo ""

# Resumen
BACKEND_UP=$(lsof -i:3001 >/dev/null 2>&1 && echo "1" || echo "0")
FRONTEND_UP=$(lsof -i:3002 >/dev/null 2>&1 && echo "1" || echo "0")

if [ "$BACKEND_UP" = "1" ] && [ "$FRONTEND_UP" = "1" ]; then
    echo -e "${GREEN}✅ Sistema completamente operativo${NC}"
elif [ "$BACKEND_UP" = "1" ] || [ "$FRONTEND_UP" = "1" ]; then
    echo -e "${YELLOW}⚠️  Sistema parcialmente operativo${NC}"
else
    echo -e "${RED}❌ Sistema detenido${NC}"
    echo -e "${YELLOW}💡 Inicia el sistema con: ${NC}./start.sh"
fi

echo ""
