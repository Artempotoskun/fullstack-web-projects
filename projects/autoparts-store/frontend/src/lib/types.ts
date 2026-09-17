export interface Product {
  id: string; sku: string; oemNumber: string; name: string; description: string; price: number;
  discountPercent: number; stockQuantity: number; images: string[]; specifications: Record<string, string>;
  manufacturer: { id: string; name: string; slug: string };
  category: { id: string; name: string; slug: string };
  compatibility: { id: string; make: string; model: string; engine: string; fromYear: number; toYear: number }[];
  createdAt: string;
}

export interface ProductList { items: Product[]; meta: { page: number; limit: number; total: number; pages: number } }
export interface Category { id: string; name: string; slug: string; icon?: string; _count: { products: number } }
export interface Manufacturer { id: string; name: string; slug: string; _count: { products: number } }
export interface User { id: string; email: string; firstName: string; lastName: string; phone?: string; role: 'USER' | 'ADMIN' }
export interface VehicleEngine { id: string; name: string; fuelType: string; powerHp?: number }
export interface VehicleModel { id: string; name: string; slug: string; engines: VehicleEngine[] }
export interface VehicleMake { id: string; name: string; slug: string; models: VehicleModel[] }
export interface Cart {
  id: string;
  items: { id: string; quantity: number; product: { id: string; sku: string; name: string; manufacturer: string; price: number; discountPercent: number; stockQuantity: number; image?: string }; line: { gross: number; discount: number; total: number } }[];
  totals: { subtotal: number; discount: number; total: number };
}
export interface Order {
  id: string; number: string; status: string; paymentStatus: string; subtotal: string; discount: string; shipping: string; total: string; createdAt: string;
  items: { id: string; sku: string; name: string; quantity: number; lineTotal: string }[];
  user?: { email: string; firstName: string; lastName: string };
}
