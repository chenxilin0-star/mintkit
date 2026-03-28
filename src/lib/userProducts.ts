// User product storage utilities using localStorage

export interface UserProduct {
  id: string;           // UUID
  niche: string;        // User's original niche input
  productTitle: string; // Generated product title
  productType: string;  // Planner / Checklist / Guide / etc.
  templateId: string;   // modern / professional / fresh / minimal / magazine
  createdAt: string;     // ISO timestamp
  pdfUrl?: string;       // PDF download link (optional, for future use)
}

const STORAGE_KEY = 'mintkit_user_products';

// Get all products for the current user
export function getUserProducts(): UserProduct[] {
  if (typeof window === 'undefined') return [];
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

// Add a new product record
export function addUserProduct(product: Omit<UserProduct, 'id' | 'createdAt'>): UserProduct {
  const newProduct: UserProduct = {
    ...product,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  };
  const products = getUserProducts();
  products.unshift(newProduct); // Add to beginning
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
  }
  return newProduct;
}

// Delete a product record by ID
export function deleteUserProduct(id: string): void {
  const products = getUserProducts();
  const filtered = products.filter((p) => p.id !== id);
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  }
}

// Get usage statistics
export function getUsageStats() {
  const products = getUserProducts();
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const todayCount = products.filter((p) => p.createdAt >= todayStart).length;
  const monthCount = products.filter((p) => p.createdAt >= monthStart).length;
  const totalCount = products.length;

  return { todayCount, monthCount, totalCount };
}

// Get recent products (most recent N)
export function getRecentProducts(limit = 10): UserProduct[] {
  const products = getUserProducts();
  return products.slice(0, limit);
}
