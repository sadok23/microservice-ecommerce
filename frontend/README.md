# ShopMicro — Frontend

Storefront + admin panel for the e-commerce microservice backend. React 19, Vite 8
(Rolldown), Tailwind CSS v4, TanStack Query, and Keycloak OIDC.

![stack](https://img.shields.io/badge/React_19-ready-22d3ee) ![query](https://img.shields.io/badge/TanStack_Query-102.8-7c3aed)

---

## Quick start

```bash
npm install
npm run dev          # http://localhost:5173
```

Requires the backend stack running (did the services via `docker compose up -d` on the repo
root), including Keycloak with the `ecommerce` realm and the `frontend-client` client.

## Environment variables

All live in `.env.development` (copy `.env.example` as a starting point):

| Variable                   | Default                  | Purpose                          |
| -------------------------- | ------------------------ | -------------------------------- |
| `VITE_API_URL`             | `http://localhost:8090`  | Spring Cloud Gateway base URL    |
| `VITE_KEYCLOAK_URL`        | `http://localhost:8080`  | Keycloak server                  |
| `VITE_KEYCLOAK_REALM`      | `ecommerce`              | KC realm containing the users    |
| `VITE_KEYCLOAK_CLIENT_ID`  | `frontend-client`        | Public OIDC client               |

Only `VITE_*` vars are exposed to the client bundle (read via `src/lib/env.ts`).

## What's inside

### Architecture

Single-page React app, no router-framework integration. All API traffic goes through the
**gateway** (`VITE_API_URL`): `/api/products/**` → catalog-service, `/api/orders/**` →
order-service, `/api/stock/**` → inventory-service.

- **Server state** → [TanStack Query](https://tanstack.com/query) (one module-level
  `QueryClient`, 30 s staleTime). Pages never `useEffect`+fetch; they call `useQuery` /
  `useMutation` with skeletons, error states and retry affordances.
- **Client state** → `CartContext` (localStorage-persisted reducer) + `ToastContext`.
- **Auth** → `keycloak-js`. The admin role (`realm_access.roles`) gates `/admin` routes
  (`AdminRoute`) and the navbar link.

### Folder structure

```
src/
├── api/client.ts        # Typed API client (env-driven, JWT refresh, ApiError)
├── types/index.ts       # Shared domain types
├── keycloak.ts          # OIDC init (cached promise → StrictMode-safe)
├── lib/                 # env, queryClient, cn, format helpers
├── context/             # Toast, Theme (dark mode), Cart
├── hooks/               # useDebounce, useDocumentTitle, useProductMap
├── components/
│   ├── layout/          # Navbar, AppLayout, Footer
│   ├── ui/              # Button, Card, Modal, Badge, Input, … (hand-rolled primitives)
│   └── ProductCard, CartItem, skeletons, …
└── pages/
    ├── Home / ProductDetail / Cart / Checkout / OrderConfirmation / OrderHistory
    ├── admin/           # AdminLayout + Products / Stock / Orders pages, ProductForm
    └── AdminPage        # Dashboard (stat tiles + quick links)
```

### Storefront

- **Home** — gradient hero, debounced search, category pills, sort, pagination
  (12/page), skeleton grid, empty/error states with retry.
- **Product detail** — breadcrumbs, stock-aware `QuantitySelector` (capped by the
  health of inventory-service rows), quick add with toast.
- **Cart / Checkout** — sticky summary, confirm-before-clear, confirm-before-place,
  `useMutation` → toast → navigate.
- **Order confirmation** — polls via `refetchInterval` only while `PENDING`, shows real
  product names + thumbnails (CQRS read-model from `inventory.updated` events), stops
  when `CONFIRMED`/`CANCELLED`.
- **My Orders** — scoped to the logged-in user via `GET /api/orders/mine` (JWT `sub`).

### Admin suite (role: `admin`)

| Route                 | Capability                                                        |
| --------------------- | ----------------------------------------------------------------- |
| `/admin`              | Dashboard: products / orders / pending / units-in-stock tiles     |
| `/admin/products`     | Table CRUD — create/edit (live image preview) / delete             |
| `/admin/stock`        | Per-product quantity stepper, inline save, remove row              |
| `/admin/orders`       | All orders, status select (`PENDING → CONFIRMED → CANCELLED`)      |

Admin mutations invalidate the shared query cache, so a stock save or a status change is
**instantly reflected on the storefront** (both use the same `['products']` / `['orders']`
cache keys).

## Scripts

```bash
npm run dev       # Vite dev server (HMR, React Compiler)
npm run build     # tsc -b && vite build   ← the real type check gate
npm run lint      # eslint (react-hooks / react-refresh aware)
npm run preview   # serve the production build
```

> Note: `tsc --noEmit` silently passes on the solution-style root `tsconfig.json`;
> use `npm run build` (which runs `tsc -b` over the app project) as the type gate.

## Design system

Vibrant & playful direction — violet→fuchsia→orange gradient brand, large rounded
surfaces, happy hover lifts, emoji-forward states, and a full dark mode. All primitives
(`Button`, `Card`, `Modal`, `Badge`, `StatusBadge`, `QuantitySelector`, `Pagination`,
`EmptyState`, …) are hand-rolled in `src/components/ui/` with Tailwind — no UI library.