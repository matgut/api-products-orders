# API Reference — Catalog & Orders

**Base URL:** `https://api-products-orders.onrender.com/api/v1`  
**Swagger UI:** `https://api-products-orders.onrender.com/api/docs`

All responses are wrapped in the shape:
```json
{
  "data": <payload>,
  "statusCode": 200
}
```
Paginated responses include:
```json
{
  "data": [...],
  "meta": { "page": 1, "limit": 10, "total": 42, "lastPage": 5 },
  "statusCode": 200
}
```
Errors return:
```json
{
  "statusCode": 400,
  "message": "Description of the error"
}
```

---

## Auth

> Rate-limited: login allows max **5 requests / 60 s** per IP.

### POST `/auth/login`
Authenticate and get tokens.

**Body**
```json
{
  "email": "admin@example.com",
  "password": "SecretPass1!"
}
```

**Response `200`**
```json
{
  "data": {
    "accessToken": "<jwt>",
    "refreshToken": "<uuid>"
  }
}
```

---

### POST `/auth/refresh`
Get a new access token using the refresh token.

**Body**
```json
{
  "refreshToken": "<uuid>"
}
```

**Response `200`**
```json
{
  "data": {
    "accessToken": "<jwt>",
    "refreshToken": "<uuid>"
  }
}
```

---

### POST `/auth/logout`
🔒 **Requires Bearer token**

Invalidates the current refresh token.

**Response `200`**
```json
{
  "data": { "message": "Logged out successfully" }
}
```

---

### GET `/auth/me`
🔒 **Requires Bearer token**

Returns the currently authenticated user.

**Response `200`**
```json
{
  "data": {
    "id": "uuid",
    "name": "John Doe",
    "email": "admin@example.com",
    "role": "admin",
    "isActive": true,
    "businessId": "uuid | null",
    "preferredLanguage": "es",
    "createdAt": "2026-01-01T00:00:00.000Z",
    "updatedAt": "2026-01-01T00:00:00.000Z"
  }
}
```

---

## Users

> All endpoints require **Bearer token** + role `super_admin`.

### POST `/users`
Create a user.

**Body**
```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "password": "SecretPass1!",
  "role": "admin",
  "preferredLanguage": "es",
  "businessId": "uuid"
}
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `name` | string | ✅ | |
| `email` | string | ✅ | |
| `password` | string | ✅ | Min 8 chars, 1 uppercase, 1 number, 1 special char |
| `role` | `"admin" \| "super_admin"` | ❌ | Default `"admin"` |
| `preferredLanguage` | `"es" \| "en"` | ❌ | Default `"es"` |
| `businessId` | uuid | ❌ | Required for `admin` role |

**Response `201`**
```json
{
  "data": {
    "id": "uuid",
    "name": "Jane Doe",
    "email": "jane@example.com",
    "role": "admin",
    "isActive": true,
    "businessId": "uuid",
    "preferredLanguage": "es",
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```

---

### GET `/users?page=1&limit=10`
List all users (paginated).

**Query params**

| Param | Type | Default |
|---|---|---|
| `page` | number | 1 |
| `limit` | number | 10 |

**Response `200`** — paginated list of user objects (same shape as above).

---

### GET `/users/:id`
Get user by UUID.

**Response `200`** — user object.

---

### PATCH `/users/:id`
🔒 **Bearer token** + `super_admin`

Update user fields. Cannot update your own account (returns `403`).

**Body** — same fields as `POST /users`, all optional.

**Response `200`** — updated user object.

---

### PATCH `/users/:id/password`
🔒 **Bearer token** (`super_admin` or `admin`)

Change a user's password.

**Body**
```json
{
  "newPassword": "NewPass1!"
}
```

**Response `200`**
```json
{
  "data": { "message": "Password updated" }
}
```

---

### PATCH `/users/:id/toggle-active`
🔒 **Bearer token** + `super_admin`

Toggle the `isActive` flag on a user. Cannot toggle your own account (returns `403`).

**Response `200`** — updated user object.

---

### DELETE `/users/:id`
Delete a user permanently.

**Response `200`**
```json
{
  "data": { "message": "User deleted" }
}
```

---

## Business

### GET `/business?page=1&limit=10`
🔒 **Bearer token** + `super_admin`

List all businesses.

**Query params**

| Param | Type | Default |
|---|---|---|
| `page` | number | 1 |
| `limit` | number | 10 |

**Response `200`**
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "My Shop",
      "slug": "my-shop",
      "description": "...",
      "logoUrl": "https://...",
      "defaultLanguage": "es",
      "notificationEmail": "shop@email.com",
      "notificationWhatsapp": "+1234567890",
      "notifyViaEmail": true,
      "notifyViaWhatsapp": false,
      "createdAt": "...",
      "updatedAt": "..."
    }
  ],
  "meta": { "page": 1, "limit": 10, "total": 1, "lastPage": 1 }
}
```

---

### GET `/business/:slug`
Public. Get a business by its slug.

**Response `200`** — single business object (same shape as above).

---

### POST `/business`
🔒 **Bearer token** + `super_admin`

Create a business.

**Body**
```json
{
  "name": "My Shop",
  "slug": "my-shop",
  "description": "Optional description",
  "notificationEmail": "shop@email.com",
  "notificationWhatsapp": "+1234567890",
  "defaultLanguage": "es",
  "notifyViaEmail": true,
  "notifyViaWhatsapp": false
}
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `name` | string | ✅ | |
| `slug` | string | ✅ | Lowercase letters, numbers and hyphens only |
| `notificationEmail` | string | ✅ | |
| `description` | string | ❌ | |
| `notificationWhatsapp` | string | ❌ | |
| `defaultLanguage` | `"es" \| "en"` | ❌ | Default `"es"` |
| `notifyViaEmail` | boolean | ❌ | Default `true` |
| `notifyViaWhatsapp` | boolean | ❌ | Default `false` |

**Response `201`** — created business object.

---

### PATCH `/business/:id`
🔒 **Bearer token** + `super_admin`

Update business. **Body** — same fields as `POST /business`, all optional.

**Response `200`** — updated business object.

---

### POST `/business/:id/logo`
🔒 **Bearer token** + `super_admin`

Upload business logo. Send as `multipart/form-data`.

| Field | Value |
|---|---|
| Form field name | `file` |
| Accepted types | `image/jpeg`, `image/png`, `image/webp` |
| Max size | 5 MB |

**Response `200`**
```json
{
  "data": {
    "logoUrl": "https://res.cloudinary.com/..."
  }
}
```

---

## Categories

### GET `/categories?businessId=<uuid>`
Public. List categories for a business.

**Query params**

| Param | Type | Required | Default |
|---|---|---|---|
| `businessId` | uuid | ✅ | |
| `lang` | `"es" \| "en"` | ❌ | From `Accept-Language` header |
| `page` | number | ❌ | 1 |
| `limit` | number | ❌ | 10 |

**Response `200`**
```json
{
  "data": [
    {
      "id": "uuid",
      "businessId": "uuid",
      "name": "Desserts",
      "description": "Sweet things",
      "createdAt": "...",
      "updatedAt": "..."
    }
  ],
  "meta": { "page": 1, "limit": 10, "total": 3, "lastPage": 1 }
}
```

---

### GET `/categories/:id`
Public. Get a category with all its translations.

**Response `200`**
```json
{
  "data": {
    "id": "uuid",
    "businessId": "uuid",
    "translations": [
      { "language": "es", "name": "Postres", "description": "..." },
      { "language": "en", "name": "Desserts", "description": "..." }
    ],
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```

---

### POST `/categories`
🔒 **Bearer token** (admin of the business or super_admin)

Create a category.

**Body**
```json
{
  "businessId": "uuid",
  "translations": [
    { "language": "es", "name": "Postres", "description": "Opcional" },
    { "language": "en", "name": "Desserts" }
  ]
}
```

| Field | Type | Required |
|---|---|---|
| `businessId` | uuid | ✅ |
| `translations` | array (min 1) | ✅ |
| `translations[].language` | `"es" \| "en"` | ✅ |
| `translations[].name` | string | ✅ |
| `translations[].description` | string | ❌ |

**Response `201`** — created category with translations.

---

### PATCH `/categories/:id`
🔒 **Bearer token**

Update category. **Body** — same as POST, all fields optional.

**Response `200`** — updated category object.

---

### DELETE `/categories/:id`
🔒 **Bearer token** + `super_admin`

Deletes the category. Returns `409 Conflict` if the category has products associated.

**Response `200`**
```json
{
  "data": { "message": "Category deleted" }
}
```

**Response `409`**
```json
{
  "statusCode": 409,
  "message": "No se puede eliminar: tiene 3 producto(s) asociado(s)"
}
```

---

## Products

### GET `/products`
🔒 **Bearer token**

List products for a business. `super_admin` must supply `businessId`; `admin` always sees their own business products regardless of the param.

**Query params**

| Param | Type | Required | Notes |
|---|---|---|---|
| `businessId` | uuid | Required for `super_admin` | Ignored for `admin` (uses their own) |
| `categoryId` | uuid | ❌ | Filter by category |
| `lang` | `"es" \| "en"` | ❌ | From `Accept-Language` header |
| `page` | number | ❌ | Default 1 |
| `limit` | number | ❌ | Default 10 |

**Response `200`**
```json
{
  "data": [
    {
      "id": "uuid",
      "businessId": "uuid",
      "categoryId": "uuid | null",
      "price": 9.99,
      "imageUrl": "https://...",
      "available": true,
      "stock": 50,
      "name": "Chocolate Cake",
      "description": "Delicious cake",
      "createdAt": "...",
      "updatedAt": "..."
    }
  ],
  "meta": { "page": 1, "limit": 10, "total": 5, "lastPage": 1 }
}
```

> The `name` and `description` fields are resolved from the translation matching the requested `lang`.

---

### GET `/products/:id?lang=es`
Public. Get a single product.

**Query params**

| Param | Type | Required |
|---|---|---|
| `lang` | `"es" \| "en"` | ❌ |

**Response `200`** — single product object with all translations:
```json
{
  "data": {
    "id": "uuid",
    "businessId": "uuid",
    "categoryId": "uuid | null",
    "price": 9.99,
    "imageUrl": "https://...",
    "available": true,
    "stock": 50,
    "translations": [
      { "language": "es", "name": "Torta de Chocolate", "description": "..." },
      { "language": "en", "name": "Chocolate Cake", "description": "..." }
    ],
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```

---

### POST `/products`
🔒 **Bearer token**

Create a product.

**Body**
```json
{
  "businessId": "uuid",
  "categoryId": "uuid",
  "price": 9.99,
  "available": true,
  "stock": 50,
  "translations": [
    { "language": "es", "name": "Torta de Chocolate", "description": "Opcional" },
    { "language": "en", "name": "Chocolate Cake" }
  ]
}
```

| Field | Type | Required |
|---|---|---|
| `businessId` | uuid | ✅ |
| `price` | number (positive, max 2 decimals) | ✅ |
| `translations` | array (min 1) | ✅ |
| `translations[].language` | `"es" \| "en"` | ✅ |
| `translations[].name` | string | ✅ |
| `translations[].description` | string | ❌ |
| `categoryId` | uuid | ❌ |
| `available` | boolean | ❌ | Default `true` |
| `stock` | number (≥ 0) | ❌ |

**Response `201`** — created product object.

---

### PATCH `/products/:id`
🔒 **Bearer token**

Update product. **Body** — same as POST, all fields optional.

**Response `200`** — updated product object.

---

### DELETE `/products/:id`
🔒 **Bearer token** + `super_admin`

**Response `200`**
```json
{
  "data": { "message": "Product deleted" }
}
```

---

### POST `/products/:id/image`
🔒 **Bearer token**

Upload product image. Send as `multipart/form-data`.

| Field | Value |
|---|---|
| Form field name | `file` |
| Accepted types | `image/jpeg`, `image/png`, `image/webp` |
| Max size | 5 MB |

**Response `200`**
```json
{
  "data": {
    "imageUrl": "https://res.cloudinary.com/..."
  }
}
```

---

## Orders

### POST `/orders`
**Public.** Create an order.

**Body**
```json
{
  "customerName": "Alice",
  "email": "alice@example.com",
  "phone": "+1234567890",
  "deliveryDate": "2026-06-15",
  "notes": "No nuts please",
  "businessId": "uuid",
  "language": "es",
  "items": [
    { "productId": "uuid", "quantity": 2 },
    { "productId": "uuid", "quantity": 1 }
  ]
}
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `customerName` | string | ✅ | |
| `email` | string | ✅ | |
| `deliveryDate` | string (ISO date) | ✅ | e.g. `"2026-06-15"` |
| `businessId` | uuid | ✅ | |
| `items` | array (min 1) | ✅ | |
| `items[].productId` | uuid | ✅ | |
| `items[].quantity` | integer (positive) | ✅ | |
| `phone` | string | ❌ | |
| `notes` | string | ❌ | |
| `language` | `"es" \| "en"` | ❌ | Used for email notifications |

**Response `201`**
```json
{
  "data": {
    "id": "uuid",
    "customerName": "Alice",
    "email": "alice@example.com",
    "phone": "+1234567890",
    "deliveryDate": "2026-06-15",
    "notes": "No nuts please",
    "status": "pending",
    "total": 29.97,
    "trackingToken": "<token>",
    "businessId": "uuid",
    "language": "es",
    "items": [
      {
        "id": "uuid",
        "productId": "uuid",
        "quantity": 2,
        "unitPrice": 9.99,
        "productNameSnapshot": "Chocolate Cake"
      }
    ],
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```

---

### GET `/orders/track/:token`
**Public.** Track an order by its tracking token (returned on creation).

**Response `200`**
```json
{
  "data": {
    "id": "uuid",
    "customerName": "Alice",
    "status": "confirmed",
    "total": 29.97,
    "deliveryDate": "2026-06-15",
    "items": [...],
    "createdAt": "..."
  }
}
```

---

### GET `/orders`
🔒 **Bearer token**

List orders for a business (filtered/paginated). `super_admin` must supply `businessId`; `admin` always sees their own business orders.

**Query params**

| Param | Type | Required | Notes |
|---|---|---|---|
| `businessId` | uuid | Required for `super_admin` | Ignored for `admin` (uses their own) |
| `status` | `pending \| confirmed \| ready \| delivered \| cancelled` | ❌ | Filter by status |
| `date` | string (ISO date) | ❌ | Filter by delivery date, e.g. `"2026-06-15"` |
| `phone` | string | ❌ | Filter by customer phone |
| `page` | number | ❌ | Default 1 |
| `limit` | number | ❌ | Default 10 |

**Response `200`** — paginated list of order objects.

---

### GET `/orders/:id`
🔒 **Bearer token**

Get a single order by UUID.

**Response `200`** — full order object.

---

### PATCH `/orders/:id/status`
🔒 **Bearer token**

Update order status.

**Body**
```json
{
  "status": "confirmed"
}
```

| Value | Meaning |
|---|---|
| `pending` | Waiting for confirmation |
| `confirmed` | Order confirmed |
| `ready` | Ready for pickup/delivery |
| `delivered` | Delivered to customer |
| `cancelled` | Cancelled |

**Response `200`** — updated order object.

---

### DELETE `/orders/:id`
🔒 **Bearer token** + `super_admin`

Delete an order.

**Response `200`**
```json
{
  "data": { "message": "Order deleted" }
}
```

---

### GET `/orders/export/csv`
🔒 **Bearer token** + `super_admin`

Export orders as a CSV file.

**Query params**

| Param | Type | Required | Notes |
|---|---|---|---|
| `businessId` | uuid | ✅ | |
| `status` | `pending \| confirmed \| ready \| delivered \| cancelled` | ❌ | Filter by status |
| `date` | string (ISO date) | ❌ | Filter by delivery date |

**Response `200`**
- `Content-Type: application/octet-stream`
- `Content-Disposition: attachment; filename="orders.csv"`
- Body: CSV with columns `ID,Cliente,Telefono,Email,Estado,Total,Entrega,Creado`

---

---

## Notifications

> All endpoints require **Bearer token** + role `super_admin`.

### GET `/notifications`
List notification logs (paginated).

**Query params**

| Param | Type | Required | Notes |
|---|---|---|---|
| `orderId` | uuid | ❌ | Filter by order |
| `status` | `sent \| failed` | ❌ | Filter by delivery status |
| `page` | number | ❌ | Default 1 |
| `limit` | number | ❌ | Default 10 |

**Response `200`**
```json
{
  "data": [
    {
      "id": "uuid",
      "orderId": "uuid",
      "type": "email",
      "recipient": "customer@example.com",
      "status": "sent",
      "errorMessage": null,
      "sentAt": "2026-05-29T12:00:00.000Z",
      "createdAt": "..."
    }
  ],
  "meta": { "page": 1, "limit": 10, "total": 42 }
}
```

---

### GET `/notifications/:id`
Get a single notification log by UUID.

**Response `200`** — single notification log object (same shape as above).

---

## Headers

| Header | Description |
|---|---|
| `Authorization` | `Bearer <accessToken>` — required for protected endpoints |
| `Accept-Language` | `es` or `en` — controls translation language when `lang` query param is omitted |
| `x-lang` | Alternative to `Accept-Language` |
| `Content-Type` | `application/json` (or `multipart/form-data` for file uploads) |

---

## Roles

| Role | Description |
|---|---|
| `super_admin` | Full access to all resources |
| `admin` | Scoped to their own business; can manage products, categories, and orders |

---

## Permissions reference

| Action | `super_admin` | `admin` |
|---|---|---|
| List orders | ✅ (any business) | ✅ (own business only) |
| Change order status | ✅ | ✅ |
| Delete order | ✅ | ✗ |
| Export orders CSV | ✅ | ✗ |
| List products | ✅ (any business) | ✅ (own business only) |
| Create / edit product | ✅ | ✅ |
| Delete product | ✅ | ✗ |
| Upload product image | ✅ | ✅ |
| Create / edit category | ✅ | ✅ |
| Delete category (no products) | ✅ | ✗ |
| Delete category with products | ✗ | ✗ |
| List businesses | ✅ | ✗ |
| Create / edit / logo business | ✅ | ✗ |
| Delete business | ✗ | ✗ |
| List / create / edit users | ✅ | ✗ |
| Toggle active user | ✅ | ✗ |
| Modify own account (role/active) | ✗ | ✗ |
| Change own password | ✅ | ✅ |
| View notification logs | ✅ | ✗ |
