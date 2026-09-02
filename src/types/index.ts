export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'kasir';
}

export interface Category {
  id: string;
  name: string;
  description: string;
  createdAt: string;
}

export interface Product {
  id: string;
  name: string;
  categoryId: string;
  price: number;
  stock: number;
  image: string;
  barcode: string;
  createdAt: string;
}

export interface CartItem {
  product: Product;
  qty: number;
  subtotal: number;
}

export interface Transaction {
  id: string;
  items: CartItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  paid: number;
  change: number;
  cashier: string;
  createdAt: string;
}
