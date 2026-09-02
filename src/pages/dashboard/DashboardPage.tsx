import { useMemo } from 'react';
import { Package, ShoppingBag, Receipt, TrendingUp } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatRupiah, formatDate } from '../../utils';
import { Skeleton } from '../../components/ui/Spinner';

function StatCard({ icon: Icon, label, value, color }: { icon: typeof Package; label: string; value: string; color: string }) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-100 dark:border-gray-800 flex items-center gap-4">
      <div className={`w-12 h-12 ${color} rounded-xl flex items-center justify-center flex-shrink-0`}>
        <Icon size={22} className="text-white" />
      </div>
      <div>
        <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
        <p className="text-xl font-bold mt-0.5">{value}</p>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { products, transactions, categories } = useApp();

  const stats = useMemo(() => {
    const today = new Date().toDateString();
    const todayTx = transactions.filter(t => new Date(t.createdAt).toDateString() === today);
    const totalSales = todayTx.reduce((s, t) => s + t.total, 0);
    return { totalSales, todayTx: todayTx.length };
  }, [transactions]);

  const recentTx = transactions.slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard icon={Package} label="Total Produk" value={String(products.length)} color="bg-indigo-500" />
        <StatCard icon={ShoppingBag} label="Total Kategori" value={String(categories.length)} color="bg-purple-500" />
        <StatCard icon={Receipt} label="Transaksi Hari Ini" value={String(stats.todayTx)} color="bg-emerald-500" />
        <StatCard icon={TrendingUp} label="Penjualan Hari Ini" value={formatRupiah(stats.totalSales)} color="bg-orange-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5">
          <h3 className="font-semibold mb-4">Transaksi Terbaru</h3>
          {recentTx.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">Belum ada transaksi</p>
          ) : (
            <div className="space-y-3">
              {recentTx.map(t => (
                <div key={t.id} className="flex items-center justify-between py-2 border-b border-gray-50 dark:border-gray-800 last:border-0">
                  <div>
                    <p className="text-sm font-medium">#{t.id.slice(-6).toUpperCase()}</p>
                    <p className="text-xs text-gray-400">{formatDate(t.createdAt)}</p>
                  </div>
                  <span className="text-sm font-semibold text-emerald-600">{formatRupiah(t.total)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5">
          <h3 className="font-semibold mb-4">Stok Menipis</h3>
          {products.filter(p => p.stock < 10).length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">Semua stok aman</p>
          ) : (
            <div className="space-y-3">
              {products.filter(p => p.stock < 10).map(p => (
                <div key={p.id} className="flex items-center justify-between py-2 border-b border-gray-50 dark:border-gray-800 last:border-0">
                  <p className="text-sm font-medium">{p.name}</p>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${p.stock === 0 ? 'bg-red-100 text-red-600' : 'bg-yellow-100 text-yellow-700'}`}>
                    Stok: {p.stock}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Skeleton demo */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 hidden">
        <div className="space-y-3">
          {[1,2,3].map(i => <Skeleton key={i} className="h-10 w-full" />)}
        </div>
      </div>
    </div>
  );
}
