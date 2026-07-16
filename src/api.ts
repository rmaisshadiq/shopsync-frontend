import type { Product, CartItem } from './types';
import { getSessionId } from './session';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

/** Returns the common headers including the session ID for cart endpoints. */
function sessionHeaders(): HeadersInit {
  return {
    'X-Session-ID': getSessionId(),
  };
}

export const api = {
  // ─── Products ────────────────────────────────────────────────────────────

  searchProducts: async (query: string): Promise<Product[]> => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/products/search?q=${encodeURIComponent(query)}`
      );
      if (!response.ok) throw new Error('Network response was not ok');
      const data = await response.json();
      return data.data || [];
    } catch (error) {
      console.error('Error fetching products:', error);
      return [];
    }
  },

  getAllProducts: async (
    page = 1,
    limit = 10
  ): Promise<{
    data: Product[];
    pagination: { page: number; limit: number; total: number; total_pages: number };
    source: string;
  }> => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/products?page=${page}&limit=${limit}`
      );
      if (!response.ok) throw new Error('Failed to fetch products');
      return response.json();
    } catch (error) {
      console.error('Error fetching all products:', error);
      return {
        data: [],
        pagination: { page, limit, total: 0, total_pages: 1 },
        source: 'error',
      };
    }
  },

  createProduct: async (product: Omit<Product, 'id'>): Promise<Product> => {
    const response = await fetch(`${API_BASE_URL}/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(product),
    });
    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || 'Failed to create product');
    }
    return response.json();
  },

  updateProduct: async (id: string, product: Omit<Product, 'id'>): Promise<Product> => {
    const response = await fetch(`${API_BASE_URL}/products/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(product),
    });
    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || 'Failed to update product');
    }
    return response.json();
  },

  deleteProduct: async (id: string): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/products/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || 'Failed to delete product');
    }
  },

  getImageKitAuth: async (): Promise<{
    token: string;
    expire: number;
    signature: string;
    publicKey: string;
    urlEndpoint: string;
  }> => {
    const response = await fetch(`${API_BASE_URL}/imagekit/auth`);
    if (!response.ok) {
      throw new Error('Failed to get ImageKit authorization parameters');
    }
    return response.json();
  },

  // ─── Orders ──────────────────────────────────────────────────────────────

  createOrder: async (cartItems: CartItem[]): Promise<{ success: boolean; errors: string[] }> => {
    const results = await Promise.allSettled(
      cartItems.map((item) =>
        fetch(`${API_BASE_URL}/orders`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            product_id: item.product.id,
            quantity: item.quantity,
            total_price: item.product.price * item.quantity,
          }),
        }).then((res) => {
          if (!res.ok) throw new Error(`Failed to order "${item.product.name}"`);
        })
      )
    );

    const errors = results
      .filter((r): r is PromiseRejectedResult => r.status === 'rejected')
      .map((r) => r.reason?.message ?? 'Unknown error');

    return { success: errors.length === 0, errors };
  },

  // ─── Cart Session (Redis-backed) ─────────────────────────────────────────

  /**
   * Loads the persisted cart for this browser session from Redis.
   * Returns an empty array on cache miss or when Redis is unavailable.
   */
  getCart: async (): Promise<CartItem[]> => {
    try {
      const response = await fetch(`${API_BASE_URL}/cart`, {
        headers: sessionHeaders(),
      });
      if (!response.ok) return [];
      const data = await response.json();
      return (data.cart as CartItem[]) || [];
    } catch {
      return [];
    }
  },

  /**
   * Persists the current cart to Redis with a 24-hour TTL.
   * Silently swallows errors — cart persistence is best-effort.
   */
  saveCart: async (cartItems: CartItem[]): Promise<void> => {
    try {
      await fetch(`${API_BASE_URL}/cart`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...sessionHeaders(),
        },
        body: JSON.stringify(cartItems),
      });
    } catch {
      // best-effort — don't surface cart-save errors to the user
    }
  },

  /**
   * Removes the cart from Redis after a successful checkout.
   */
  deleteCart: async (): Promise<void> => {
    try {
      await fetch(`${API_BASE_URL}/cart`, {
        method: 'DELETE',
        headers: sessionHeaders(),
      });
    } catch {
      // best-effort
    }
  },
};
