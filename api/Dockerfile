# Dockerfile para el Backend (Express API)
FROM node:20-alpine

WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar todas las dependencias
RUN npm install

# Copiar código fuente
COPY . .

# Crear directorio para logs si es necesario
RUN mkdir -p logs

# Exponer puerto de la API
EXPOSE 3000

# Usuario no-root para seguridad
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001
RUN chown -R nodejs:nodejs /app
USER nodejs

# Usar npm start que ejecuta node index.js
CMD ["npm", "start"]
