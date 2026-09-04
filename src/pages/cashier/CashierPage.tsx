import { useState, useMemo } from 'react';
import { Search, Plus, Minus, Trash2, ShoppingCart, ImagePlus, Tag } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { formatRupiah } from '../../utils';
import type { CartItem } from '../../types';
import { Modal } from '../../components/ui/Modal';
import { EmptyState } from '../../components/ui/EmptyState';
import toast from 'react-hot-toast';

const TAX_RATE = 0.11;

export default function CashierPage() {
  const { products, categories, addTransaction } = useApp();
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [discount, setDiscount] = useState(0);
  const [paid, setPaid] = useState('');
  const [payModal, setPayModal] = useState(false);
  const [successModal, setSuccessModal] = useState(false);
  const [lastTx, setLastTx] = useState<Awaited<ReturnType<typeof addTransaction>> | null>(null);

  const filteredProducts = products.filter(p =>
    p.stock > 0 &&
    p.name.toLowerCase().includes(search.toLowerCase()) &&
    (!catFilter || p.categoryId === catFilter)
  );

  const subtotal = useMemo(() => cart.reduce((s, i) => s + i.subtotal, 0), [cart]);
  const discountAmt = useMemo(() => Math.min(discount, 100) / 100 * subtotal, [discount, subtotal]);
  const taxAmt = useMemo(() => (subtotal - discountAmt) * TAX_RATE, [subtotal, discountAmt]);
  const total = useMemo(() => subtotal - discountAmt + taxAmt, [subtotal, discountAmt, taxAmt]);
  const change = useMemo(() => Number(paid) - total, [paid, total]);

  const addToCart = (product: typeof products[0]) => {
    setCart(prev => {
      const existing = prev.find(i => i.product.id === product.id);
      if (existing) {
        if (existing.qty >= product.stock) { toast.error('Stok tidak cukup'); return prev; }
        return prev.map(i => i.product.id === product.id
          ? { ...i, qty: i.qty + 1, subtotal: (i.qty + 1) * i.product.price }
          : i);
      }
      return [...prev, { product, qty: 1, subtotal: product.price }];
    });
  };

  const updateQty = (id: string, delta: number) => {
    setCart(prev => prev.flatMap(i => {
      if (i.product.id !== id) return [i];
      const qty = i.qty + delta;
      if (qty <= 0) return [];
      if (qty > i.product.stock) { toast.error('Stok tidak cukup'); return [i]; }
      return [{ ...i, qty, subtotal: qty * i.product.price }];
    }));
  };

  const removeFromCart = (id: string) => setCart(prev => prev.filter(i => i.product.id !== id));

  const handlePay = async () => {
    if (cart.length === 0) { toast.error('Keranjang kosong'); return; }
    if (Number(paid) < total) { toast.error('Uang tidak cukup'); return; }
    
    // Set status loading bisa ditambahkan disini, tapi untuk kesederhanaan
    // kita await saja langsung
    const txId = toast.loading('Memproses transaksi...');
    const tx = await addTransaction({ items: cart, subtotal, discount: discountAmt, tax: taxAmt, total, paid: Number(paid), change, cashier: user?.name ?? '' });
    toast.dismiss(txId);

    if (tx) {
      setLastTx(tx);
      setPayModal(false);
      setSuccessModal(true);
      setCart([]);
      setDiscount(0);
      setPaid('');
      toast.success('Transaksi berhasil!');
    } else {
      toast.error('Gagal memproses transaksi');
    }
  };

  const openPay = () => {
    if (cart.length === 0) { toast.error('Keranjang kosong'); return; }
    setPayModal(true);
  };

  return (
    <div className="flex flex-col lg:flex-row gap-4 h-full">
      {/* Produk */}
      <div className="flex-1 space-y-4">
        <div className="flex flex-col gap-3">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari produk..."
              className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 outline-none focus:border-indigo-500 transition-colors" />
          </div>
          
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            <button
              onClick={() => setCatFilter('')}
              className={`px-4 py-2 text-sm rounded-xl whitespace-nowrap transition-colors border ${
                !catFilter
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
            >
              Semua
            </button>
            {categories.map(c => (
              <button
                key={c.id}
                onClick={() => setCatFilter(c.id)}
                className={`px-4 py-2 text-sm rounded-xl whitespace-nowrap transition-colors border ${
                  catFilter === c.id
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>

        {filteredProducts.length === 0 ? <EmptyState message="Produk tidak ditemukan" /> : (
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
            {filteredProducts.map(p => {
              const inCart = cart.find(i => i.product.id === p.id);
              return (
                <button key={p.id} onClick={() => addToCart(p)}
                  className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-3 text-left hover:border-indigo-300 hover:shadow-md transition-all duration-150 relative group">
                  {inCart && (
                    <span className="absolute top-2 right-2 w-5 h-5 bg-indigo-600 text-white text-xs rounded-full flex items-center justify-center font-bold">
                      {inCart.qty}
                    </span>
                  )}
                  {p.image ? (
                    <img src={p.image} alt={p.name} className="w-full h-24 object-cover rounded-xl mb-2" />
                  ) : (
                    <div className="w-full h-24 bg-gray-100 dark:bg-gray-700 rounded-xl mb-2 flex items-center justify-center">
                      <ImagePlus size={24} className="text-gray-300" />
                    </div>
                  )}
                  <p className="text-sm font-medium truncate">{p.name}</p>
                  <p className="text-indigo-600 dark:text-indigo-400 font-semibold text-sm mt-0.5">{formatRupiah(p.price)}</p>
                  <p className="text-xs text-gray-400 mt-0.5">Stok: {p.stock}</p>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Keranjang */}
      <div className="w-full lg:w-80 xl:w-96 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 flex flex-col">
        <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex items-center gap-2">
          <ShoppingCart size={18} className="text-indigo-600" />
          <span className="font-semibold">Keranjang</span>
          {cart.length > 0 && <span className="ml-auto text-xs bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 px-2 py-0.5 rounded-full">{cart.length} item</span>}
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin min-h-0 max-h-64 lg:max-h-none">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-gray-400">
              <ShoppingCart size={32} strokeWidth={1} className="mb-2" />
              <p className="text-sm">Keranjang kosong</p>
            </div>
          ) : cart.map(item => (
            <div key={item.product.id} className="flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{item.product.name}</p>
                <p className="text-xs text-indigo-600">{formatRupiah(item.subtotal)}</p>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => updateQty(item.product.id, -1)} className="w-6 h-6 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                  <Minus size={12} />
                </button>
                <span className="w-6 text-center text-sm font-medium">{item.qty}</span>
                <button onClick={() => updateQty(item.product.id, 1)} className="w-6 h-6 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                  <Plus size={12} />
                </button>
                <button onClick={() => removeFromCart(item.product.id)} className="w-6 h-6 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-400 flex items-center justify-center transition-colors ml-1">
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="p-4 border-t border-gray-100 dark:border-gray-800 space-y-3">
          <div className="flex items-center gap-2">
            <Tag size={14} className="text-gray-400" />
            <span className="text-sm text-gray-500">Diskon (%)</span>
            <input type="number" value={discount} onChange={e => setDiscount(Math.min(100, Math.max(0, Number(e.target.value))))}
              className="ml-auto w-20 px-2 py-1 text-sm rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 outline-none text-right" min={0} max={100} />
          </div>
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between text-gray-500"><span>Subtotal</span><span>{formatRupiah(subtotal)}</span></div>
            {discountAmt > 0 && <div className="flex justify-between text-green-600"><span>Diskon</span><span>-{formatRupiah(discountAmt)}</span></div>}
            <div className="flex justify-between text-gray-500"><span>PPN (11%)</span><span>{formatRupiah(taxAmt)}</span></div>
            <div className="flex justify-between font-bold text-base pt-1 border-t border-gray-100 dark:border-gray-700">
              <span>Total</span><span className="text-indigo-600">{formatRupiah(total)}</span>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setCart([])} disabled={cart.length === 0}
              className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-40">
              Reset
            </button>
            <button onClick={openPay} disabled={cart.length === 0}
              className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition-colors disabled:opacity-40">
              Bayar
            </button>
          </div>
        </div>
      </div>

      {/* Modal Pembayaran */}
      <Modal open={payModal} onClose={() => setPayModal(false)} title="Pembayaran" size="sm">
        <div className="space-y-4">
          <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-gray-500">Subtotal</span><span>{formatRupiah(subtotal)}</span></div>
            {discountAmt > 0 && <div className="flex justify-between text-green-600"><span>Diskon</span><span>-{formatRupiah(discountAmt)}</span></div>}
            <div className="flex justify-between"><span className="text-gray-500">PPN</span><span>{formatRupiah(taxAmt)}</span></div>
            <div className="flex justify-between font-bold text-base pt-2 border-t border-gray-200 dark:border-gray-700">
              <span>Total</span><span className="text-indigo-600">{formatRupiah(total)}</span>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Uang Pelanggan</label>
            <input type="number" value={paid} onChange={e => setPaid(e.target.value)} placeholder="0"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 text-sm outline-none focus:border-indigo-500" />
          </div>
          {Number(paid) > 0 && (
            <div className={`flex justify-between text-sm font-semibold p-3 rounded-xl ${change >= 0 ? 'bg-green-50 dark:bg-green-900/20 text-green-700' : 'bg-red-50 dark:bg-red-900/20 text-red-600'}`}>
              <span>Kembalian</span>
              <span>{change >= 0 ? formatRupiah(change) : 'Kurang ' + formatRupiah(-change)}</span>
            </div>
          )}
          <div className="flex gap-3 pt-2">
            <button onClick={() => setPayModal(false)} className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">Batal</button>
            <button onClick={handlePay} disabled={!paid || change < 0}
              className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition-colors disabled:opacity-40">
              Konfirmasi Bayar
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal Sukses */}
      <Modal open={successModal} onClose={() => setSuccessModal(false)} title="Transaksi Berhasil" size="sm">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto">
            <ShoppingCart size={28} className="text-green-600" />
          </div>
          {lastTx && (
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 text-sm space-y-1 text-left">
              <div className="flex justify-between"><span className="text-gray-500">No. Transaksi</span><span className="font-mono">#{lastTx.id.slice(-8).toUpperCase()}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Total</span><span className="font-semibold">{formatRupiah(lastTx.total)}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Bayar</span><span>{formatRupiah(lastTx.paid)}</span></div>
              <div className="flex justify-between text-green-600 font-semibold"><span>Kembalian</span><span>{formatRupiah(lastTx.change)}</span></div>
            </div>
          )}
          <button onClick={() => setSuccessModal(false)} className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition-colors">
            Transaksi Baru
          </button>
        </div>
      </Modal>
    </div>
  );
}
