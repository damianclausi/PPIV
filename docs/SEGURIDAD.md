#  Documentación de Seguridad - Sistema PPIV

**Fecha de implementación:** 4 de octubre de 2025  
**Versión:** 1.0.0

---

##  Medidas de Seguridad Implementadas

### 1. Helmet - Headers HTTP Seguros 

**Librería:** `helmet`  
**Versión:** Última estable

**Headers implementados:**

```
Content-Security-Policy: default-src 'self'
X-Content-Type-Options: nosniff
X-Frame-Options: SAMEORIGIN
X-XSS-Protection: 0
Strict-Transport-Security: max-age=31536000; includeSubDomains
```

**Protección contra:**
-  XSS (Cross-Site Scripting)
-  Clickjacking
-  MIME type sniffing
-  Protocol downgrade attacks

**Código:**
```javascript
import helmet from 'helmet';
app.use(helmet());
```

---

### 2. CORS Configurado 

**Librería:** `cors`  
**Configuración:** Whitelist específica

**Configuración actual:**
```javascript
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:3002',
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
};
```

**Protección contra:**
-  Requests desde orígenes no autorizados
-  CSRF (Cross-Site Request Forgery) parcial
-  Exposición de cookies/tokens a dominios maliciosos

**Headers resultantes:**
```
Access-Control-Allow-Origin: http://localhost:3002
Access-Control-Allow-Credentials: true
```

** IMPORTANTE:** Para producción, cambiar `FRONTEND_URL` en `.env`:
```bash
# Producción
FRONTEND_URL=https://tu-dominio-real.com
```

---

### 3. Rate Limiting 

**Librería:** `express-rate-limit`  
**Configuración:** Doble capa (general + login)

#### Rate Limiting General

**Configuración:**
```javascript
const limiterGeneral = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutos
  max: 100,                   // 100 requests
  message: {
    exito: false,
    mensaje: 'Demasiadas peticiones desde esta IP, intente más tarde'
  }
});
```

**Aplicado a:** Todas las rutas `/api/*`

**Headers resultantes:**
```
RateLimit-Limit: 100
RateLimit-Remaining: 88
RateLimit-Reset: 868
```

#### Rate Limiting Login (Estricto)

**Configuración:**
```javascript
const limiterLogin = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutos
  max: 5,                     // 5 intentos
  message: {
    exito: false,
    mensaje: 'Demasiados intentos de login. Por favor, intente nuevamente en 15 minutos'
  }
});
```

**Aplicado a:** `/api/auth/login`

**Protección contra:**
-  Brute force attacks
-  Credential stuffing
-  DDoS básico
-  API abuse

**Respuesta cuando se excede el límite:**
```json
{
  "exito": false,
  "mensaje": "Demasiadas peticiones desde esta IP, intente más tarde"
}
```

---

##  Niveles de Protección

### Nivel 1: Headers de Seguridad (Helmet)
- **Riesgo mitigado:** Alto
- **Impacto en rendimiento:** Ninguno
- **Complejidad:** Baja

### Nivel 2: CORS Configurado
- **Riesgo mitigado:** Alto
- **Impacto en rendimiento:** Mínimo
- **Complejidad:** Media

### Nivel 3: Rate Limiting
- **Riesgo mitigado:** Medio-Alto
- **Impacto en rendimiento:** Mínimo
- **Complejidad:** Baja

---

##  Configuración de Variables de Entorno

### Archivo: `backend/.env`

```bash
# Seguridad CORS
FRONTEND_URL=http://localhost:3002

# JWT Secret (nunca compartir)
JWT_SECRET=tu_secreto_muy_largo_y_seguro

# Ambiente
NODE_ENV=development  # Cambiar a 'production' en producción
```

### Archivo: `.env.example`

```bash
# Seguridad
FRONTEND_URL=http://localhost:3002
JWT_SECRET=tu_secreto_jwt_muy_seguro_aqui
```

---

##  Verificación de Seguridad

### Test 1: Verificar Headers de Seguridad

```bash
curl -I http://localhost:3001/api/salud
```

**Debe incluir:**
-  `Content-Security-Policy`
-  `X-Content-Type-Options: nosniff`
-  `X-Frame-Options: SAMEORIGIN`
-  `Strict-Transport-Security`
-  `Access-Control-Allow-Origin: http://localhost:3002`

### Test 2: Verificar CORS

```bash
# Request desde origen no autorizado (debe fallar)
curl -H "Origin: http://malicious-site.com" \
     -H "Access-Control-Request-Method: GET" \
     -H "Access-Control-Request-Headers: Content-Type" \
     -X OPTIONS http://localhost:3001/api/salud
```

### Test 3: Verificar Rate Limiting

```bash
# Hacer 101 requests rápidos (la 101 debe fallar)
for i in {1..101}; do
  curl http://localhost:3001/api/salud
done
```

### Test 4: Verificar Rate Limiting Login

```bash
# Hacer 6 intentos de login (el 6to debe fallar)
for i in {1..6}; do
  curl -X POST http://localhost:3001/api/auth/login \
       -H "Content-Type: application/json" \
       -d '{"email":"test@test.com","password":"wrong"}'
done
```

---

##  Próximas Mejoras (Pendientes)

### Prioridad Alta
- [ ] Validación de datos con Joi/Zod
- [ ] Logging estructurado (Winston)
- [ ] Monitoreo de seguridad

### Prioridad Media
- [ ] CSRF tokens para formularios
- [ ] 2FA (Two-Factor Authentication)
- [ ] Rotación de JWT secrets
- [ ] Blacklist de tokens JWT

### Prioridad Baja
- [ ] WAF (Web Application Firewall)
- [ ] IDS/IPS (Intrusion Detection/Prevention)
- [ ] Honeypots

---

##  Respuesta a Incidentes

### Si detectas un ataque de fuerza bruta:

1. Verificar logs: `tail -f logs/backend.log`
2. Identificar IP atacante
3. Reducir rate limit si es necesario:
   ```javascript
   max: 50,  // Reducir de 100 a 50
   windowMs: 15 * 60 * 1000
   ```

### Si detectas CORS violation:

1. Verificar `FRONTEND_URL` en `.env`
2. Verificar que frontend esté en el dominio correcto
3. Revisar logs de preflight requests

---

##  Referencias

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Express Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)
- [Helmet Documentation](https://helmetjs.github.io/)
- [express-rate-limit Documentation](https://github.com/express-rate-limit/express-rate-limit)

---

##  Checklist de Seguridad

### En Desarrollo
- [x] Helmet configurado
- [x] CORS configurado
- [x] Rate limiting implementado
- [x] JWT para autenticación
- [x] Variables de entorno para secrets
- [x] `.env` en `.gitignore`
- [ ] Validación de inputs
- [ ] Logging estructurado
- [ ] Tests de seguridad

### Antes de Producción
- [ ] Cambiar `FRONTEND_URL` a dominio real
- [ ] Cambiar `JWT_SECRET` (generar nuevo)
- [ ] `NODE_ENV=production`
- [ ] HTTPS configurado
- [ ] Rate limits ajustados según tráfico real
- [ ] Monitoreo configurado
- [ ] Backups automáticos
- [ ] Plan de respuesta a incidentes

---

**Última actualización:** 4 de octubre de 2025  
**Responsable:** Equipo de Desarrollo PPIV  
**Próxima revisión:** Mensual
