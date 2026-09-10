import type Keycloak from 'keycloak-js';
import { env } from '@/lib/env';
import type {
  Product,
  Order,
  Stock,
  CreateOrderRequest,
  CreateProductRequest,
  CreateStockRequest,
  UpdateProductRequest,
  UpdateStockRequest,
  UpdateOrderStatusRequest,
} from '@/types';

const BASE_URL = env.apiUrl;

/** Error carrying the HTTP status and any server-provided message. */
export class ApiError extends Error {
  status: number;
  details: unknown;

  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

async function parseErrorBody(res: Response): Promise<unknown> {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

async function request<T>(
  keycloak: Keycloak,
  path: string,
  options: RequestInit = {}
): Promise<T> {
  if (keycloak.token) {
    await keycloak.updateToken(30);
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (keycloak.token) {
    headers['Authorization'] = `Bearer ${keycloak.token}`;
  }

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });

  if (res.status === 401) {
    // Try refreshing the token once
    const refreshed = await keycloak.updateToken(-1);
    if (refreshed && keycloak.token) {
      headers['Authorization'] = `Bearer ${keycloak.token}`;
      const retryRes = await fetch(`${BASE_URL}${path}`, { ...options, headers });
      if (!retryRes.ok) {
        const body = await parseErrorBody(retryRes);
        throw new ApiError(retryRes.status, `API error: ${retryRes.status}`, body);
      }
      return retryRes.json();
    }
    keycloak.login();
    throw new ApiError(401, 'Unauthorized');
  }

  if (!res.ok) {
    const body = await parseErrorBody(res);
    let message = `API error: ${res.status}`;
    if (body && typeof body === 'object') {
      const maybe = body as Record<string, unknown>;
      if (typeof maybe.message === 'string') message = maybe.message;
      else if (typeof maybe.error === 'string') message = maybe.error;
    }
    throw new ApiError(res.status, message, body);
  }

  // 204 No Content (e.g. DELETE) — nothing to parse.
  if (res.status === 204) return undefined as T;
  return res.json();
}

export function getProducts(keycloak: Keycloak): Promise<Product[]> {
  return request<Product[]>(keycloak, '/api/products');
}

export function getProduct(keycloak: Keycloak, id: number): Promise<Product> {
  return request<Product>(keycloak, `/api/products/${id}`);
}

export function getOrders(keycloak: Keycloak): Promise<Order[]> {
  return request<Order[]>(keycloak, '/api/orders');
}

export function getOrder(keycloak: Keycloak, id: number): Promise<Order> {
  return request<Order>(keycloak, `/api/orders/${id}`);
}

export function createOrder(
  keycloak: Keycloak,
  data: CreateOrderRequest
): Promise<Order> {
  return request<Order>(keycloak, '/api/orders', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function createProduct(
  keycloak: Keycloak,
  data: CreateProductRequest
): Promise<Product> {
  return request<Product>(keycloak, '/api/products', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function getStock(keycloak: Keycloak) {
  return request<Stock[]>(keycloak, '/api/stock');
}

/** The current user's own orders (JWT-scoped on the server). */
export function getMyOrders(keycloak: Keycloak): Promise<Order[]> {
  return request<Order[]>(keycloak, '/api/orders/mine');
}

// --- Admin: products ---

export function updateProduct(
  keycloak: Keycloak,
  id: number,
  data: UpdateProductRequest
): Promise<Product> {
  return request<Product>(keycloak, `/api/products/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export function deleteProduct(keycloak: Keycloak, id: number): Promise<void> {
  return request<void>(keycloak, `/api/products/${id}`, { method: 'DELETE' });
}

// --- Admin: stock ---

export function createStock(keycloak: Keycloak, data: CreateStockRequest): Promise<Stock> {
  return request<Stock>(keycloak, '/api/stock', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function updateStockQuantity(
  keycloak: Keycloak,
  productId: number,
  data: UpdateStockRequest
): Promise<Stock> {
  return request<Stock>(keycloak, `/api/stock/${productId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export function deleteStock(keycloak: Keycloak, productId: number): Promise<void> {
  return request<void>(keycloak, `/api/stock/${productId}`, { method: 'DELETE' });
}

// --- Admin: orders ---

export function updateOrderStatus(
  keycloak: Keycloak,
  id: number,
  data: UpdateOrderStatusRequest
): Promise<Order> {
  return request<Order>(keycloak, `/api/orders/${id}/status`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}