#!/bin/bash

# Script de prueba para el endpoint de tipos de reclamo
# Ejecutar después de esperar 15 minutos o reiniciar el backend

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║     PRUEBA DE ENDPOINT: /api/tipos-reclamo                  ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

# Colores
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Paso 1: Login
echo -e "${BLUE}Paso 1: Obteniendo token de autenticación...${NC}"
echo ""

LOGIN_RESPONSE=$(curl -s -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"juancarlos.perez@gmail.com","password":"Cliente123!"}')

# Extraer token usando python
TOKEN=$(echo "$LOGIN_RESPONSE" | python3 -c "import sys, json; data = json.load(sys.stdin); print(data.get('token', ''))" 2>/dev/null)

if [ -z "$TOKEN" ]; then
  echo -e "${RED}❌ Error al obtener token${NC}"
  echo ""
  echo "Respuesta completa:"
  echo "$LOGIN_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$LOGIN_RESPONSE"
  echo ""
  echo "Posibles causas:"
  echo "  - Rate limiter activo (esperar 15 minutos)"
  echo "  - Credenciales incorrectas"
  echo "  - Backend no está corriendo"
  echo ""
  echo "Solución: Reiniciar el backend con ./restart.sh"
  exit 1
fi

echo -e "${GREEN}✅ Token obtenido correctamente${NC}"
echo "Token (primeros 40 caracteres): ${TOKEN:0:40}..."
echo ""

# Paso 2: Obtener tipos de reclamo
echo -e "${BLUE}Paso 2: Obteniendo tipos de reclamo desde /api/tipos-reclamo...${NC}"
echo ""

TIPOS_RESPONSE=$(curl -s -X GET http://localhost:3001/api/tipos-reclamo \
  -H "Authorization: Bearer $TOKEN")

# Verificar si la respuesta es válida
if echo "$TIPOS_RESPONSE" | python3 -c "import sys, json; json.load(sys.stdin)" 2>/dev/null; then
  echo -e "${GREEN}✅ Tipos de reclamo obtenidos correctamente${NC}"
  echo ""
  echo "Respuesta:"
  echo "$TIPOS_RESPONSE" | python3 -m json.tool
  echo ""
  
  # Contar tipos
  NUM_TIPOS=$(echo "$TIPOS_RESPONSE" | python3 -c "import sys, json; print(len(json.load(sys.stdin)))" 2>/dev/null)
  echo -e "${GREEN}Total de tipos: $NUM_TIPOS${NC}"
  echo ""
  
  # Mostrar lista resumida
  echo "Lista de tipos:"
  echo "$TIPOS_RESPONSE" | python3 -c "
import sys, json
datos = json.load(sys.stdin)
for tipo in datos:
    print(f\"  • [{tipo['tipo_id']}] {tipo['nombre']}\")
" 2>/dev/null
  
  echo ""
  echo -e "${GREEN}╔══════════════════════════════════════════════════════════════╗${NC}"
  echo -e "${GREEN}║                   ✅ PRUEBA EXITOSA                         ║${NC}"
  echo -e "${GREEN}╚══════════════════════════════════════════════════════════════╝${NC}"
  
else
  echo -e "${RED}❌ Error al obtener tipos de reclamo${NC}"
  echo ""
  echo "Respuesta:"
  echo "$TIPOS_RESPONSE"
  echo ""
  exit 1
fi

# Paso 3 (Opcional): Probar endpoint específico
echo ""
echo -e "${BLUE}Paso 3 (Opcional): Probando endpoint específico (/api/tipos-reclamo/1)...${NC}"
echo ""

TIPO_RESPONSE=$(curl -s -X GET http://localhost:3001/api/tipos-reclamo/1 \
  -H "Authorization: Bearer $TOKEN")

if echo "$TIPO_RESPONSE" | python3 -c "import sys, json; json.load(sys.stdin)" 2>/dev/null; then
  echo -e "${GREEN}✅ Tipo específico obtenido correctamente${NC}"
  echo ""
  echo "Respuesta:"
  echo "$TIPO_RESPONSE" | python3 -m json.tool
else
  echo -e "${RED}❌ Error al obtener tipo específico${NC}"
  echo ""
  echo "Respuesta:"
  echo "$TIPO_RESPONSE"
fi

echo ""
echo "Prueba completada. Ahora puedes probar en el navegador:"
echo "  1. Ir a http://localhost:3002"
echo "  2. Iniciar sesión como cliente"
echo "  3. Ir a 'Nuevo Reclamo'"
echo "  4. Verificar que el selector de tipos carga dinámicamente"
