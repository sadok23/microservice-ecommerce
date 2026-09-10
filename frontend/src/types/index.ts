export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  category: string;
  inStock: boolean;
  imageUrl: string;
  createdAt: string;
}

export interface OrderItem {
  id: number;
  productId: number;
  quantity: number;
  unitPrice: number;
}

export interface Order {
  id: number;
  customerId: string;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED';
  totalAmount: number;
  items: OrderItem[];
  createdAt: string;
}

export interface CartItem {
  productId: number;
  name: string;
  price: number;
  quantity: number;
  imageUrl: string;
}

export interface CreateOrderRequest {
  items: { productId: number; quantity: number }[];
}

export interface CreateProductRequest {
  name: string;
  description?: string;
  price: number;
  category?: string;
  imageUrl?: string;
}

export interface Stock {
  id: number;
  productId: number;
  quantityAvailable: number;
}

export interface UpdateProductRequest {
  name: string;
  description?: string;
  price: number;
  category?: string;
  imageUrl?: string;
}

export interface CreateStockRequest {
  productId: number;
  quantityAvailable: number;
}

export interface UpdateStockRequest {
  quantityAvailable: number;
}

export interface UpdateOrderStatusRequest {
  status: Order['status'];
}
