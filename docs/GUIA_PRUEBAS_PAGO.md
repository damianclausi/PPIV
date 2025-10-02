# 💳 GUÍA RÁPIDA - Pasarela de Pago Simulada

## 🎯 Acceso Rápido

1. **Iniciar el sistema:**
   ```bash
   # Terminal 1 - Backend
   cd backend && npm start
   
   # Terminal 2 - Frontend
   npm run dev
   ```

2. **Acceder al sistema:**
   - Frontend: http://localhost:3002
   - Login como Cliente
   - Ir a "Pagar Online"

---

## 🧪 PRUEBAS RÁPIDAS

### ✅ CASO 1: Pago Exitoso

**Tarjetas de prueba que siempre funcionan:**

1. **Visa:**
   ```
   Número: 4111 1111 1111 1111
   Vencimiento: 12/25
   CVV: 123
   Titular: JUAN PEREZ
   ```

2. **Mastercard:**
   ```
   Número: 5555 5555 5555 4444
   Vencimiento: 06/26
   CVV: 456
   Titular: MARIA GOMEZ
   ```

**Resultado esperado:** ✅ Pago aprobado con código de autorización

---

### ❌ CASO 2: Fondos Insuficientes

```
Número: 4532 1111 1111 1110  (termina en 0)
Vencimiento: 12/25
CVV: 123
Titular: PEDRO LOPEZ
```

**Resultado esperado:** ❌ Error "Fondos insuficientes"

---

### ❌ CASO 3: Tarjeta Bloqueada

```
Número: 5555 5555 5555 4449  (termina en 9)
Vencimiento: 12/25
CVV: 789
Titular: ANA MARTINEZ
```

**Resultado esperado:** ❌ Error "Tarjeta bloqueada. Contacte a su banco"

---

### ❌ CASO 4: Número Inválido

```
Número: 1234 5678 9012 3456  (no pasa Luhn)
Vencimiento: 12/25
CVV: 123
Titular: CARLOS RUIZ
```

**Resultado esperado:** ❌ Error "Número de tarjeta inválido"

---

### ❌ CASO 5: Tarjeta Vencida

```
Número: 4111 1111 1111 1111
Vencimiento: 12/20  (fecha pasada)
CVV: 123
Titular: LUIS FERNANDEZ
```

**Resultado esperado:** ❌ Error "Tarjeta vencida o fecha inválida"

---

## 🎨 Características Implementadas

### ✨ Validaciones en Tiempo Real

- ✅ **Formateo automático** del número de tarjeta (espacios cada 4 dígitos)
- ✅ **Detección de tipo** de tarjeta (Visa, Mastercard, Amex, Discover)
- ✅ **Algoritmo de Luhn** para validar número de tarjeta
- ✅ **Validación de fecha** de vencimiento (formato MM/AA, no vencida)
- ✅ **Validación de CVV** (3-4 dígitos)
- ✅ **Validación de titular** (mínimo 3 caracteres)

### 🎭 Feedback Visual

- 🔴 **Errores en rojo** debajo de cada campo
- 🟢 **Tipo de tarjeta** detectado en tiempo real
- ⏳ **Spinner animado** durante procesamiento
- ✅ **Pantalla de éxito** con código de autorización
- ❌ **Alertas de error** con mensaje descriptivo

### 📱 Experiencia de Usuario

- 🎯 **Selección visual** de facturas pendientes
- 💰 **Monto destacado** en grande y formateado
- 📅 **Indicador de facturas vencidas** en rojo
- 🔒 **Badge de seguridad** SSL
- 📄 **Comprobante detallado** con todos los datos
- 🔄 **Opción de realizar otro pago** sin recargar

---

## 📊 Información de Pantalla de Éxito

Cuando un pago es exitoso, verás:

```
✅ ¡Pago Exitoso!

Código de Autorización: A3F9K7M2P

Factura: #12345
Fecha: 02/10/2025 14:30:15

Tarjeta: Visa •••• 1111
Monto: $15.000

✅ Se ha enviado un comprobante a tu email
```

---

## 🧩 Reglas del Simulador

### Casos Especiales por Último Dígito:

| Último Dígito | Resultado |
|---------------|-----------|
| 0 | ❌ Fondos insuficientes |
| 9 | ❌ Tarjeta bloqueada |
| Otros | ✅ Aprobado (90% probabilidad) |

### Tarjetas Especiales:

| Número | Tipo | Resultado |
|--------|------|-----------|
| 4111 1111 1111 1111 | Visa | ✅ Siempre aprobada |
| 5555 5555 5555 4444 | Mastercard | ✅ Siempre aprobada |

---

## 🔄 Flujo Completo de Prueba

1. **Login** al sistema como cliente
2. **Dashboard** → Click en "Pagar Online"
3. **Seleccionar factura** pendiente de pago
4. **Completar datos** de tarjeta de prueba
5. **Click "Pagar Ahora"**
6. **Esperar** 2-3 segundos (simulación de procesamiento)
7. **Ver resultado:**
   - ✅ Pantalla de éxito con comprobante
   - ❌ Mensaje de error con detalles
8. **Opciones:**
   - Volver al dashboard
   - Ver facturas
   - Realizar otro pago

---

## 🎥 Demostración en Video

### Escenario 1: Pago Exitoso
1. Seleccionar factura de $15.000
2. Ingresar Visa 4111 1111 1111 1111
3. Ver procesamiento con spinner
4. Ver pantalla de éxito con código A3F9K7M2P
5. Ver comprobante completo

### Escenario 2: Fondos Insuficientes
1. Seleccionar factura
2. Ingresar tarjeta terminada en 0
3. Ver error rojo: "Fondos insuficientes"

### Escenario 3: Validaciones
1. Ingresar tarjeta inválida → Error inmediato
2. Corregir campo → Error desaparece
3. Ver tipo de tarjeta detectado automáticamente

---

## 📞 Contacto

Para dudas o reportar problemas:
- Revisar documentación completa en `/docs/PASARELA_PAGO_SIMULADA.md`
- Contactar al equipo de desarrollo

---

**Nota:** Este es un simulador para desarrollo y testing. En producción, se debe integrar con una pasarela real como MercadoPago o Stripe.

**Última actualización:** Octubre 2, 2025
