import type { Category, Product } from '../types';

export const defaultCategories: Category[] = [
  { id: 'cat-1', name: 'Makanan', description: 'Produk makanan', createdAt: new Date().toISOString() },
  { id: 'cat-2', name: 'Minuman', description: 'Produk minuman', createdAt: new Date().toISOString() },
  { id: 'cat-3', name: 'Snack', description: 'Camilan & snack', createdAt: new Date().toISOString() },
];

export const defaultProducts: Product[] = [
  { id: 'p-1', name: 'Nasi Goreng', categoryId: 'cat-1', price: 15000, stock: 50, image: '', barcode: '001', createdAt: new Date().toISOString() },
  { id: 'p-2', name: 'Mie Ayam', categoryId: 'cat-1', price: 12000, stock: 40, image: '', barcode: '002', createdAt: new Date().toISOString() },
  { id: 'p-3', name: 'Es Teh', categoryId: 'cat-2', price: 5000, stock: 100, image: '', barcode: '003', createdAt: new Date().toISOString() },
  { id: 'p-4', name: 'Jus Alpukat', categoryId: 'cat-2', price: 18000, stock: 30, image: '', barcode: '004', createdAt: new Date().toISOString() },
  { id: 'p-5', name: 'Keripik Singkong', categoryId: 'cat-3', price: 8000, stock: 60, image: '', barcode: '005', createdAt: new Date().toISOString() },
  { id: 'p-6', name: 'Chitato', categoryId: 'cat-3', price: 10000, stock: 45, image: '', barcode: '006', createdAt: new Date().toISOString() },
];
