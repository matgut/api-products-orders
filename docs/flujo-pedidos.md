# Flujo de Pedidos

## Variables base

```bash
BASE_URL=http://localhost:3000/api/v1
TOKEN=<access_token_del_admin>
BUSINESS_ID=<uuid_del_negocio>
PRODUCT_ID=<uuid_del_producto>
ORDER_ID=<uuid_del_pedido>
```

---

## Flujo completo

```
[Cliente]                          [API]                          [Admin]
   |                                 |                               |
   |-- POST /orders ---------------->|                               |
   |   (público, sin auth)           |                               |
   |                                 |-- valida negocio              |
   |                                 |-- valida productos            |
   |                                 |-- verifica disponibilidad     |
   |                                 |-- verifica stock              |
   |                                 |-- descuenta stock             |
   |                                 |-- calcula total               |
   |                                 |-- guarda pedido               |
   |                                 |-- (async) notifica al admin   |
   |<-- 201 { data: order } ---------|   vía email/whatsapp          |
   |                                 |                               |
   |                                 |               [Admin ve pedido]
   |                                 |<-- GET /orders?businessId=... |
   |                                 |    (requiere JWT)             |
   |                                 |                               |
   |                                 |<-- PATCH /orders/:id/status --|
   |                                 |    status: confirmed          |
   |                                 |-- (async) notifica al cliente |
   |<-- email "Pedido confirmado" ---|   si order.email existe       |
   |                                 |                               |
   |                                 |<-- PATCH /orders/:id/status --|
   |                                 |    status: ready              |
   |<-- email "Pedido listo" --------|                               |
```

### Estados posibles del pedido

```
pending → confirmed → ready → delivered
    \                            /
     --------> cancelled <------
```

| Estado      | Notificación al cliente |
|-------------|-------------------------|
| `pending`   | —                       |
| `confirmed` | ✅ Email "confirmado"   |
| `ready`     | ✅ Email "listo"        |
| `delivered` | —                       |
| `cancelled` | —                       |

---

## CURLs

### 1. Login (obtener token)

```bash
curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@tudominio.com",
    "password": "tuPassword123"
  }' | jq .
```

Guarda el `accessToken` de la respuesta en `$TOKEN`.

---

### 2. Crear pedido (público — sin auth)

```bash
curl -s -X POST "$BASE_URL/orders" \
  -H "Content-Type: application/json" \
  -d '{
    "customerName": "María López",
    "phone": "+521234567890",
    "email": "maria@example.com",
    "deliveryDate": "2026-06-15",
    "notes": "Sin gluten por favor",
    "businessId": "'"$BUSINESS_ID"'",
    "language": "es",
    "items": [
      {
        "productId": "'"$PRODUCT_ID"'",
        "quantity": 2
      }
    ]
  }' | jq .
```

**Campos opcionales:** `email`, `notes`, `language` (default: `es`).

**Validaciones que hace el servidor:**
- El `businessId` debe existir.
- Cada `productId` debe pertenecer a ese negocio.
- El producto debe tener `available: true`.
- Si el producto tiene `stock`, debe ser ≥ `quantity`.

**Respuesta exitosa (201):**
```json
{
  "data": {
    "id": "uuid-del-pedido",
    "customerName": "María López",
    "phone": "+521234567890",
    "email": "maria@example.com",
    "deliveryDate": "2026-06-15",
    "notes": "Sin gluten por favor",
    "status": "pending",
    "total": 150.00,
    "language": "es",
    "businessId": "...",
    "items": [
      {
        "productId": "...",
        "quantity": 2,
        "unitPrice": 75.00,
        "productNameSnapshot": "Galletas de chispas"
      }
    ],
    "createdAt": "2026-05-23T10:00:00.000Z"
  },
  "message": "Pedido creado exitosamente"
}
```

---

### 3. Listar pedidos de un negocio (requiere auth)

```bash
# Todos los pedidos
curl -s -X GET "$BASE_URL/orders?businessId=$BUSINESS_ID" \
  -H "Authorization: Bearer $TOKEN" | jq .

# Filtrar por estado
curl -s -X GET "$BASE_URL/orders?businessId=$BUSINESS_ID&status=pending" \
  -H "Authorization: Bearer $TOKEN" | jq .

# Filtrar por fecha de entrega
curl -s -X GET "$BASE_URL/orders?businessId=$BUSINESS_ID&date=2026-06-15" \
  -H "Authorization: Bearer $TOKEN" | jq .

# Filtrar por teléfono (búsqueda parcial)
curl -s -X GET "$BASE_URL/orders?businessId=$BUSINESS_ID&phone=123456" \
  -H "Authorization: Bearer $TOKEN" | jq .

# Con paginación
curl -s -X GET "$BASE_URL/orders?businessId=$BUSINESS_ID&page=1&limit=20" \
  -H "Authorization: Bearer $TOKEN" | jq .
```

**Valores válidos de `status`:** `pending`, `confirmed`, `ready`, `delivered`, `cancelled`

---

### 4. Ver detalle de un pedido (requiere auth)

```bash
curl -s -X GET "$BASE_URL/orders/$ORDER_ID" \
  -H "Authorization: Bearer $TOKEN" | jq .
```

---

### 5. Actualizar estado del pedido (requiere auth)

```bash
# Confirmar pedido → dispara email al cliente
curl -s -X PATCH "$BASE_URL/orders/$ORDER_ID/status" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "status": "confirmed" }' | jq .

# Marcar como listo → dispara email al cliente
curl -s -X PATCH "$BASE_URL/orders/$ORDER_ID/status" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "status": "ready" }' | jq .

# Marcar como entregado
curl -s -X PATCH "$BASE_URL/orders/$ORDER_ID/status" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "status": "delivered" }' | jq .

# Cancelar pedido
curl -s -X PATCH "$BASE_URL/orders/$ORDER_ID/status" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "status": "cancelled" }' | jq .
```

---

### 6. Eliminar pedido (requiere auth)

```bash
curl -s -X DELETE "$BASE_URL/orders/$ORDER_ID" \
  -H "Authorization: Bearer $TOKEN" | jq .
```

---

## Notas

- `POST /orders` es **público**: lo llama el widget/formulario del cliente, sin JWT.
- El resto de endpoints requieren `Authorization: Bearer <token>`.
- Las notificaciones (email al admin, email al cliente) son **asíncronas** — no bloquean la respuesta.
- El email al cliente solo se envía si el pedido tiene `email` y el negocio tiene activo el flag correspondiente.
- El idioma de las notificaciones al cliente sigue el campo `language` del pedido (`es` / `en`).
- La documentación Swagger interactiva está en: `http://localhost:3000/api/docs`
