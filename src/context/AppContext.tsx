import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { Category, Product, Transaction } from '../types';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

interface AppCtx {
  categories: Category[];
  products: Product[];
  transactions: Transaction[];
  addCategory: (c: Omit<Category, 'id' | 'createdAt'>) => Promise<void>;
  updateCategory: (id: string, c: Partial<Category>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  addProduct: (p: Omit<Product, 'id' | 'createdAt'>) => Promise<void>;
  updateProduct: (id: string, p: Partial<Product>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  addTransaction: (t: Omit<Transaction, 'id' | 'createdAt'>) => Promise<Transaction | null>;
  loading: boolean;
}

const AppContext = createContext<AppCtx | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const [catsRes, prodsRes, transRes] = await Promise.all([
      supabase.from('categories').select('*').order('created_at', { ascending: false }),
      supabase.from('products').select('*').order('created_at', { ascending: false }),
      supabase.from('transactions').select('*').order('created_at', { ascending: false })
    ]);

    if (catsRes.data) setCategories(catsRes.data.map(c => ({ ...c, createdAt: c.created_at } as any)));
    if (prodsRes.data) setProducts(prodsRes.data.map(p => ({ ...p, categoryId: p.category_id, createdAt: p.created_at } as any)));
    
    // For transactions, we might want to also fetch items, but for now we just load basic txs or adapt if needed
    // In a real app we'd fetch joined data, but here we just need to satisfy type 
    if (transRes.data) {
      setTransactions(transRes.data.map(t => ({
        ...t, cashierId: t.cashier_id, createdAt: t.created_at, items: []
      } as any)));
    }
    setLoading(false);
  };

  const addCategory = async (c: Omit<Category, 'id' | 'createdAt'>) => {
    const { data, error } = await supabase.from('categories').insert([c]).select().single();
    if (!error && data) setCategories(prev => [{ ...data, createdAt: data.created_at } as any, ...prev]);
  };

  const updateCategory = async (id: string, c: Partial<Category>) => {
    const { data, error } = await supabase.from('categories').update(c).eq('id', id).select().single();
    if (!error && data) setCategories(prev => prev.map(x => x.id === id ? { ...data, createdAt: data.created_at } as any : x));
  };

  const deleteCategory = async (id: string) => {
    const { error } = await supabase.from('categories').delete().eq('id', id);
    if (!error) setCategories(prev => prev.filter(x => x.id !== id));
  };

  const addProduct = async (p: Omit<Product, 'id' | 'createdAt'>) => {
    const toInsert = { ...p, category_id: p.categoryId };
    delete (toInsert as any).categoryId;
    const { data, error } = await supabase.from('products').insert([toInsert]).select().single();
    if (!error && data) setProducts(prev => [{ ...data, categoryId: data.category_id, createdAt: data.created_at } as any, ...prev]);
  };

  const updateProduct = async (id: string, p: Partial<Product>) => {
    const toUpdate = { ...p };
    if (toUpdate.categoryId) { (toUpdate as any).category_id = toUpdate.categoryId; delete toUpdate.categoryId; }
    const { data, error } = await supabase.from('products').update(toUpdate).eq('id', id).select().single();
    if (!error && data) setProducts(prev => prev.map(x => x.id === id ? { ...data, categoryId: data.category_id, createdAt: data.created_at } as any : x));
  };

  const deleteProduct = async (id: string) => {
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (!error) setProducts(prev => prev.filter(x => x.id !== id));
  };

  const addTransaction = async (t: Omit<Transaction, 'id' | 'createdAt'>) => {
    // 1. Insert transaction
    const txToInsert = {
      subtotal: t.subtotal, discount: t.discount, tax: t.tax, total: t.total,
      paid: t.paid, change: t.change, cashier_id: (t as any).cashierId || (supabase.auth.getUser() as any).id || null
    };
    // Default to the first profile/admin if we don't have cashierId set, in real app auth user id
    const authSession = await supabase.auth.getSession();
    const uid = authSession.data.session?.user?.id;
    if (uid) txToInsert.cashier_id = uid;

    const { data: tx, error: txError } = await supabase.from('transactions').insert([txToInsert]).select().single();
    if (txError) { toast.error(txError.message); return null; }

    // 2. Insert items and update stock
    const itemsToInsert = t.items.map(item => ({
      transaction_id: tx.id, product_id: item.product.id, qty: item.qty, price: item.product.price, subtotal: item.subtotal
    }));
    await supabase.from('transaction_items').insert(itemsToInsert);

    // 3. Update local stock and DB stock
    t.items.forEach(async item => {
      await updateProduct(item.product.id, { stock: item.product.stock - item.qty });
    });

    const newTx = { ...t, id: tx.id, createdAt: tx.created_at } as any;
    setTransactions(prev => [newTx, ...prev]);
    return newTx;
  };

  return (
    <AppContext value={{ categories, products, transactions, addCategory, updateCategory, deleteCategory, addProduct, updateProduct, deleteProduct, addTransaction, loading }}>
      {children}
    </AppContext>
  );
}

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be inside AppProvider');
  return ctx;
};
