import { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useApp } from '../../context/AppContext';
import { formatRupiah } from '../../utils';
import { TrendingUp, Receipt, ShoppingBag } from 'lucide-react';

type Period = 'daily' | 'weekly' | 'monthly';

function formatLabel(period: Period, key: string) {
  if (period === 'daily') return key.slice(5); // MM-DD
  if (period === 'weekly') return `Minggu ${key}`;
  return key; // YYYY-MM
}

export default function ReportsPage() {
  const { transactions } = useApp();
  const [period, setPeriod] = useState<Period>('daily');

  const grouped = useMemo(() => {
    const map = new Map<string, { total: number; count: number }>();
    transactions.forEach(t => {
      const d = new Date(t.createdAt);
      let key: string;
      if (period === 'daily') key = d.toISOString().slice(0, 10);
      else if (period === 'weekly') {
        const start = new Date(d); start.setDate(d.getDate() - d.getDay());
        key = start.toISOString().slice(0, 10);
      } else key = d.toISOString().slice(0, 7);
      const prev = map.get(key) ?? { total: 0, count: 0 };
      map.set(key, { total: prev.total + t.total, count: prev.count + 1 });
    });
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-14)
      .map(([key, val]) => ({ label: formatLabel(period, key), ...val }));
  }, [transactions, period]);

  const totalRevenue = useMemo(() => transactions.reduce((s, t) => s + t.total, 0), [transactions]);
  const totalItems = useMemo(() => transactions.reduce((s, t) => s + t.items.reduce((ss, i) => ss + i.qty, 0), 0), [transactions]);

  const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl p-3 shadow-lg text-sm">
        <p className="font-medium mb-1">{label}</p>
        <p className="text-indigo-600">{formatRupiah(payload[0].value)}</p>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-500 rounded-xl flex items-center justify-center">
            <TrendingUp size={22} className="text-white" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Total Pendapatan</p>
            <p className="text-xl font-bold">{formatRupiah(totalRevenue)}</p>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center">
            <Receipt size={22} className="text-white" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Total Transaksi</p>
            <p className="text-xl font-bold">{transactions.length}</p>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 flex items-center gap-4">
          <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center">
            <ShoppingBag size={22} className="text-white" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Total Item Terjual</p>
            <p className="text-xl font-bold">{totalItems}</p>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-semibold">Grafik Penjualan</h3>
          <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
            {(['daily', 'weekly', 'monthly'] as Period[]).map(p => (
              <button key={p} onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${period === p ? 'bg-white dark:bg-gray-700 shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}>
                {p === 'daily' ? 'Harian' : p === 'weekly' ? 'Mingguan' : 'Bulanan'}
              </button>
            ))}
          </div>
        </div>
        {grouped.length === 0 ? (
          <div className="flex items-center justify-center h-48 text-gray-400 text-sm">Belum ada data transaksi</div>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={grouped} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="label" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="total" fill="#6366f1" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
