import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { Category, Product, Transaction } from '../types';
import { defaultCategories, defaultProducts } from '../data/seed';
import { getFromStorage, setToStorage, generateId } from '../utils';

interface AppCtx {
  categories: Category[];
  products: Product[];
  transactions: Transaction[];
  addCategory: (c: Omit<Category, 'id' | 'createdAt'>) => void;
  updateCategory: (id: string, c: Partial<Category>) => void;
  deleteCategory: (id: string) => void;
  addProduct: (p: Omit<Product, 'id' | 'createdAt'>) => void;
  updateProduct: (id: string, p: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  addTransaction: (t: Omit<Transaction, 'id' | 'createdAt'>) => Transaction;
}

const AppContext = createContext<AppCtx | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [categories, setCategories] = useState<Category[]>(() =>
    getFromStorage('categories', defaultCategories));
  const [products, setProducts] = useState<Product[]>(() =>
    getFromStorage('products', defaultProducts));
  const [transactions, setTransactions] = useState<Transaction[]>(() =>
    getFromStorage('transactions', []));

  useEffect(() => { setToStorage('categories', categories); }, [categories]);
  useEffect(() => { setToStorage('products', products); }, [products]);
  useEffect(() => { setToStorage('transactions', transactions); }, [transactions]);

  const addCategory = (c: Omit<Category, 'id' | 'createdAt'>) =>
    setCategories(prev => [...prev, { ...c, id: generateId(), createdAt: new Date().toISOString() }]);

  const updateCategory = (id: string, c: Partial<Category>) =>
    setCategories(prev => prev.map(x => x.id === id ? { ...x, ...c } : x));

  const deleteCategory = (id: string) =>
    setCategories(prev => prev.filter(x => x.id !== id));

  const addProduct = (p: Omit<Product, 'id' | 'createdAt'>) =>
    setProducts(prev => [...prev, { ...p, id: generateId(), createdAt: new Date().toISOString() }]);

  const updateProduct = (id: string, p: Partial<Product>) =>
    setProducts(prev => prev.map(x => x.id === id ? { ...x, ...p } : x));

  const deleteProduct = (id: string) =>
    setProducts(prev => prev.filter(x => x.id !== id));

  const addTransaction = (t: Omit<Transaction, 'id' | 'createdAt'>) => {
    const newT: Transaction = { ...t, id: generateId(), createdAt: new Date().toISOString() };
    setTransactions(prev => [newT, ...prev]);
    // Kurangi stok
    t.items.forEach(item => {
      updateProduct(item.product.id, { stock: item.product.stock - item.qty });
    });
    return newT;
  };

  return (
    <AppContext value={{ categories, products, transactions, addCategory, updateCategory, deleteCategory, addProduct, updateProduct, deleteProduct, addTransaction }}>
      {children}
    </AppContext>
  );
}

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be inside AppProvider');
  return ctx;
};
