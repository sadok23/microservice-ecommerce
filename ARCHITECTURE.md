# Architecture

## System overview

Four Spring Boot microservices + a gateway, backed by MySQL (one database per service), Keycloak (auth), Kafka (async events), and Kafka UI (inspection).

```
                    ┌──────────────────────────────────────┐
                    │        Keycloak (:8080)              │
                    │  Issues & validates JWTs for the      │
                    │  "ecommerce" realm                    │
                    └──────────────────────────────────────┘

Browser / Client
      │
      │  JWT (Bearer)
      ▼
┌──────────────────────────────────────┐
│         Gateway (:8090)              │
│  Spring Cloud Gateway (WebFlux)      │
│  - Validates JWT at the edge         │
│  - Forwards to the right service     │
└───┬──────────┬──────────┬────────────┘
    │          │          │
    ▼          ▼          ▼
┌────────┐ ┌────────┐ ┌────────────────┐
│Catalog │ │ Order  │ │  Inventory     │
│ :8081  │ │ :8082  │ │  :8083        │
│ DB:    │ │ DB:    │ │  DB:          │
│catalog │ │order_db│ │  inventory_db │
│  _db   │ │        │ │               │
└───┬────┘ └──┬──┬──┘ └──┬───┬────────┘
    │         │  │       │   │
    │         │  │◄──────│   │  ◄── Kafka: order.events
    │         │  │──►────│   │  ──► Kafka: stock.events
    │         │  │       │   │
    ◄─────────│──│───────│   │  ◄── Kafka: inventory.updated
              │  │       │
         Kafka UI (:8091)
```

---

## Catalog service — port 8081 · database `catalog_db`

### Purpose
Owns the product catalog. Single source of truth for product name, price, description, category, and — after the Kafka event integration — whether a product is **in stock** (`inStock` boolean).

### Functionalities
| What | How | Notes |
|---|---|---|
| `GET /api/products` | Return every product | Includes `inStock` flag |
| `GET /api/products/{id}` | Return one product by id | 404 if missing |
| `POST /api/products` | Create a new product | Body: `{name, price, description, category}` |

### Kafka — consumer only
Listens on the `inventory.updated` topic. When inventory-service publishes a `StockUpdatedEvent(productId, inStock)`, catalog-service updates the local `Product.inStock` flag. This is the **CQRS-style local cached copy** pattern: reads never call inventory-service synchronously; they stay local and fast, at the cost of eventual consistency.

| Topic listened | Event shape | Consumer method |
|---|---|---|
| `inventory.updated` | `{ productId, inStock }` | `InventoryConsumer.onStockUpdated` |

The `inStock` field defaults to `true` on new products and is only changed by incoming events.

### Files
```
catalog-service/
└── src/main/java/com/ecommerce/catalog_service/
    ├── CatalogServiceApplication.java
    ├── controller/ProductController.java      ← REST endpoints
    ├── domain/Product.java                    ← JPA entity (+ inStock boolean)
    ├── repository/ProductRepository.java      ← JPA repository
    ├── event/StockUpdatedEvent.java           ← inbound Kafka DTO (own copy)
    └── consumer/InventoryConsumer.java        ← Kafka listener on "inventory.updated"
```

---

## Order service — port 8082 · database `order_db`

### Purpose
Owns the order lifecycle. When a customer places an order, order-service fetches real product prices from catalog-service (synchronous, token-relay), saves the order as `PENDING`, then publishes an event to trigger stock reservation asynchronously. When inventory responds, the order flips to `CONFIRMED` or `CANCELLED`.

### Functionalities
| What | How | Notes |
|---|---|---|
| `GET /api/orders` | Return every order | With nested `OrderItem`s |
| `GET /api/orders/{id}` | Return one order by id | 404 if missing |
| `POST /api/orders` | Create a new order | `customerId` overwritten from JWT `sub` claim — never trusted from client input |

### Synchronous call: catalog-service
Before saving the order, each line item is validated against catalog-service via `CatalogClient` (a `RestClient` bean). The caller's JWT is forwarded (token-relay via `SecurityContextHolder`). If the product doesn't exist, a `400 BAD_REQUEST` is returned.

### Kafka — producer + consumer
**Producer**: after the order is saved, publishes an `OrderCreatedEvent` to `order.events`. The `kafkaTemplate.send()` call is non-blocking (returns a `CompletableFuture`), so the HTTP response is not held up.

**Consumer**: listens on `stock.events` for the outcome of the stock reservation and finalizes the order.

| Role | Topic | Event shape | Method |
|---|---|---|---|
| Producer | `order.events` | `{ orderId, items: [{ productId, quantity }] }` | `OrderEventPublisher.publishOrderCreated` |
| Consumer | `stock.events` | `{ orderId, status: "RESERVED"/"REJECTED" }` | `OrderStatusConsumer.onStockUpdate` |

Status mapping: `RESERVED` → `CONFIRMED`, `REJECTED` → `CANCELLED`.

### Files
```
order-service/
└── src/main/java/com/ecommerce/order_service/
    ├── OrderServiceApplication.java
    ├── config/RestClientConfig.java          ← RestClient builder
    ├── client/CatalogClient.java             ← sync call to catalog-service
    ├── client/ProductResponse.java           ← DTO from catalog
    ├── controller/OrderController.java       ← REST endpoints + order creation
    ├── domain/Order.java                     ← JPA entity (status starts as PENDING)
    ├── domain/OrderItem.java                 ← JPA entity (FK to Order)
    ├── repository/OrderRepository.java       ← JPA repository
    ├── event/OrderCreatedEvent.java          ← outbound Kafka DTO (own copy)
    ├── event/OrderItemEvent.java             ← outbound Kafka DTO (own copy)
    ├── event/StockUpdateEvent.java           ← inbound Kafka DTO (own copy)
    ├── producer/OrderEventPublisher.java     ← publishes to "order.events"
    └── consumer/OrderStatusConsumer.java     ← listens on "stock.events"
```

---

## Inventory service — port 8083 · database `inventory_db`

### Purpose
Owns stock levels per product. Consumes order events, makes the "can we reserve?" business decision, decrements stock atomically, and publishes two events: one to finalize the order, one to keep catalog-service's cache in sync.

### Functionalities
| What | How | Notes |
|---|---|---|
| `GET /api/stock` | Return every stock row | |
| `GET /api/stock/{id}` | Return one stock row by id | 404 if missing |
| `POST /api/stock` | Seed or create stock for a product | 400 on invalid quantity, 409 if productId already has a stock row |

### Kafka — consumer + producer
**Consumer**: listens on `order.events`. When an `OrderCreatedEvent` arrives, it performs a two-pass check:
1. **Pass 1 (read-only)**: verify every line item has enough stock → if any is short, immediately publish `REJECTED` and stop.
2. **Pass 2 (mutate)**: all items available → decrement each stock row, then publish `RESERVED` + a `StockUpdatedEvent` per affected product.

The entire handler runs inside a single `@Transactional` so the decrements are atomic (all-or-nothing for one order).

**Producer** (two topics):
| Role | Topic | Event shape | Method |
|---|---|---|---|
| Consumer | `order.events` | `{ orderId, items: [{ productId, quantity }] }` | `OrderEventConsumer.onOrderCreated` |
| Producer | `stock.events` | `{ orderId, status: "RESERVED"/"REJECTED" }` | `publishOrderStatus` (private) |
| Producer | `inventory.updated` | `{ productId, inStock: bool }` | `publishInventoryUpdated` (private) |

### Data ownership boundary
The `Stock` entity references products **only by their id** — it does not hold a foreign key into catalog-service's table, and it knows nothing about product names or prices. Each service owns only the data it needs to do its job.

### Files
```
inventory-service/
└── src/main/java/com/ecommerce/inventory_service/
    ├── InventoryServiceApplication.java
    ├── controller/StockController.java       ← REST endpoints (seed/query stock)
    ├── domain/Stock.java                     ← JPA entity (productId + quantityAvailable)
    ├── repository/StockRepository.java       ← JPA repository (+ findByProductId)
    ├── event/OrderCreatedEvent.java          ← inbound Kafka DTO (own copy)
    ├── event/OrderItemEvent.java             ← inbound Kafka DTO (own copy)
    ├── event/StockUpdateEvent.java           ← outbound Kafka DTO (own copy)
    ├── event/StockUpdatedEvent.java          ← outbound Kafka DTO (own copy)
    └── consumer/OrderEventConsumer.java      ← listens on "order.events", produces on two topics
```

---

## Gateway — port 8090 · no database

### Purpose
Single entry point for all HTTP traffic. Validates the caller's JWT against Keycloak at the edge and routes requests to the right backend service.

### Routes
| Path prefix | Backend |
|---|---|
| `/api/products/**` | catalog-service (`:8081`) |
| `/api/orders/**` | order-service (`:8082`) |
| `/api/stock/**` | inventory-service (`:8083`) |

Routes use the `spring.cloud.gateway.server.webflux.routes` prefix (Spring Cloud Gateway 5.0.3 / `spring-cloud-starter-gateway-server-webflux`).

### Kafka — not used
The gateway does not produce or consume Kafka events. Its job is purely HTTP routing + JWT validation.

### Files
```
gateway/
└── src/main/java/com/ecommerce/gateway/
    └── GatewayApplication.java              ← minimal; all config is in application.properties
```

---

## Kafka topics

Three topics, each carrying one specific event shape. No service shares an event class — every service keeps its **own copy** of the DTOs it produces or consumes (no shared library). Jackson type headers are disabled (`spring.json.add.type.headers=false`) to avoid cross-service class-name coupling.

| Topic | Event type | Producer | Consumer | Purpose |
|---|---|---|---|---|
| `order.events` | `OrderCreatedEvent` | order-service | inventory-service | "A new order was placed — please reserve stock" |
| `stock.events` | `StockUpdateEvent` | inventory-service | order-service | "Stock was reserved or rejected for this order" |
| `inventory.updated` | `StockUpdatedEvent` | inventory-service | catalog-service | "A product's availability changed — update your cache" |

The flow:

```
order-service                  inventory-service                catalog-service
     │                               │                                │
     │── order.created ─────────────►│                                │
     │                               │── check stock ──               │
     │                               │── decrement (if OK) ──         │
     │                               │                                │
     │                               │── stock.update ────────────────►│
     │◄────────────────────────────── │── inventory.updated ──────────►│
     │ order CONFIRMED/CANCELLED     │                                │
```

---

## Infrastructure services (Docker Compose)

| Service | Image | Port | Persistent volume | Purpose |
|---|---|---|---|---|
| MySQL 8 | `mysql:8.0` | `:3306` | `mysql-data` | One database per microservice: `catalog_db`, `order_db`, `inventory_db` |
| Keycloak 25 | `quay.io/keycloak/keycloak:25.0` | `:8080` | `keycloak-data` | `ecommerce` realm, JWT issuer, admin console |
| Kafka 3.8 | `apache/kafka:3.8.0` (KRaft) | `:9092` (host) / `:29092` (internal) | `kafka-data` | Message broker; KRaft mode (no ZooKeeper) |
| Kafka UI | `provectuslabs/kafka-ui` | `:8091` | — | Visual topic/consumer inspection (connects via internal listener) |

MySQL init scripts (`infra/mysql/init/`) run only on first volume creation:
- `02-order-db.sql` creates `order_db` and `inventory_db`
- `catalog_db` is created by `MYSQL_DATABASE` in the compose file

---

## Known simplifications (not yet implemented)

| What | Why it matters | When to address |
|---|---|---|
| No **transactional outbox** | Kafka publish is not atomic with the DB write — a failed transaction after send means an event is published for a state that was rolled back | Production / saga phase |
| No **idempotent consumers** | Kafka is at-least-once; a redelivered `order.events` message could double-decrement stock | Production / saga phase |
| No **saga / compensating transactions** | If the order is rejected post-save, no automatic compensation beyond flipping the status to CANCELLED | Production |
| No **outbox/event log** | If inventory-service crashes between publishing a stock event and committing its DB transaction, the event is lost | Production |
| `inStock` backfill caveat | After `ddl-auto=update` adds the `in_stock` column, existing products default to `false` (MySQL tinyint default) even though the Java default is `true`. The first `inventory.updated` event corrects it, but newly-created products read correctly while pre-existing ones show `inStock: false` until then | Re-seed or run an UPDATE statement after migration |
