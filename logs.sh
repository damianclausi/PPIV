#!/bin/bash

# Script para ver logs del sistema en tiempo real
# Uso: ./logs.sh [backend|frontend|all]

# Colores
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Función para mostrar uso
show_usage() {
    echo "╔══════════════════════════════════════════════════════════════╗"
    echo "║              📋 VISUALIZADOR DE LOGS DEL SISTEMA            ║"
    echo "╚══════════════════════════════════════════════════════════════╝"
    echo ""
    echo -e "${YELLOW}Uso:${NC} ./logs.sh [opción]"
    echo ""
    echo "Opciones:"
    echo "  backend     - Ver logs del backend"
    echo "  frontend    - Ver logs del frontend"
    echo "  all         - Ver logs de ambos (por defecto)"
    echo "  errors      - Ver solo errores de ambos"
    echo ""
    echo "Ejemplos:"
    echo "  ./logs.sh backend"
    echo "  ./logs.sh frontend"
    echo "  ./logs.sh all"
    echo "  ./logs.sh errors"
    echo ""
}

# Si no hay archivos de log
if [ ! -d "logs" ] || [ ! -f "logs/backend.log" ]; then
    echo -e "${YELLOW}⚠️  No se encontraron archivos de log${NC}"
    echo -e "${YELLOW}💡 Asegúrate de haber iniciado el sistema con: ${NC}./start.sh"
    exit 1
fi

# Opción seleccionada
OPTION="${1:-all}"

case $OPTION in
    backend)
        echo -e "${BLUE}📋 Logs del Backend (Ctrl+C para salir):${NC}"
        echo ""
        tail -f logs/backend.log
        ;;
    
    frontend)
        echo -e "${BLUE}📋 Logs del Frontend (Ctrl+C para salir):${NC}"
        echo ""
        tail -f logs/frontend.log
        ;;
    
    all)
        echo -e "${BLUE}📋 Logs del Sistema Completo (Ctrl+C para salir):${NC}"
        echo ""
        echo -e "${GREEN}=== BACKEND ===${NC}"
        tail -n 20 logs/backend.log
        echo ""
        echo -e "${GREEN}=== FRONTEND ===${NC}"
        tail -n 20 logs/frontend.log
        echo ""
        echo -e "${YELLOW}💡 Siguiendo logs en tiempo real...${NC}"
        echo ""
        tail -f logs/backend.log logs/frontend.log
        ;;
    
    errors)
        echo -e "${BLUE}📋 Errores del Sistema:${NC}"
        echo ""
        echo -e "${GREEN}=== ERRORES BACKEND ===${NC}"
        grep -i "error\|exception\|failed" logs/backend.log | tail -n 10
        echo ""
        echo -e "${GREEN}=== ERRORES FRONTEND ===${NC}"
        grep -i "error\|exception\|failed" logs/frontend.log | tail -n 10
        ;;
    
    help|--help|-h)
        show_usage
        ;;
    
    *)
        echo -e "${YELLOW}⚠️  Opción no válida: $OPTION${NC}"
        echo ""
        show_usage
        exit 1
        ;;
esac
