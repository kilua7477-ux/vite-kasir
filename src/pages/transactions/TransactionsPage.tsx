import { useState } from 'react';
import { Search, Eye } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Modal } from '../../components/ui/Modal';
import { EmptyState } from '../../components/ui/EmptyState';
import { Pagination } from '../../components/ui/Pagination';
import { formatRupiah, formatDate } from '../../utils';
import type { Transaction } from '../../types';

const PER_PAGE = 10;

export default function TransactionsPage() {
  const { transactions } = useApp();
  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [page, setPage] = useState(1);
  const [detail, setDetail] = useState<Transaction | null>(null);

  const filtered = transactions.filter(t => {
    const matchSearch = t.id.toLowerCase().includes(search.toLowerCase()) || t.cashier.toLowerCase().includes(search.toLowerCase());
    const matchDate = !dateFilter || t.createdAt.startsWith(dateFilter);
    return matchSearch && matchDate;
  });
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Cari ID atau kasir..." className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 outline-none focus:border-indigo-500" />
        </div>
        <input type="date" value={dateFilter} onChange={e => { setDateFilter(e.target.value); setPage(1); }}
          className="px-4 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 outline-none focus:border-indigo-500" />
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
        {paginated.length === 0 ? <EmptyState message="Tidak ada transaksi" /> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                <tr>
                  <th className="text-left px-5 py-3 font-medium">No. Transaksi</th>
                  <th className="text-left px-5 py-3 font-medium hidden sm:table-cell">Kasir</th>
                  <th className="text-left px-5 py-3 font-medium hidden md:table-cell">Waktu</th>
                  <th className="text-left px-5 py-3 font-medium">Total</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                {paginated.map(t => (
                  <tr key={t.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="px-5 py-3 font-mono text-xs font-medium">#{t.id.slice(-8).toUpperCase()}</td>
                    <td className="px-5 py-3 text-gray-500 hidden sm:table-cell">{t.cashier}</td>
                    <td className="px-5 py-3 text-gray-400 hidden md:table-cell">{formatDate(t.createdAt)}</td>
                    <td className="px-5 py-3 font-semibold text-indigo-600">{formatRupiah(t.total)}</td>
                    <td className="px-5 py-3">
                      <button onClick={() => setDetail(t)} className="p-1.5 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/20 text-indigo-500 transition-colors">
                        <Eye size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <Pagination page={page} total={filtered.length} perPage={PER_PAGE} onChange={setPage} />

      <Modal open={!!detail} onClose={() => setDetail(null)} title="Detail Transaksi" size="md">
        {detail && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><p className="text-gray-400 text-xs">No. Transaksi</p><p className="font-mono font-medium">#{detail.id.slice(-8).toUpperCase()}</p></div>
              <div><p className="text-gray-400 text-xs">Kasir</p><p className="font-medium">{detail.cashier}</p></div>
              <div className="col-span-2"><p className="text-gray-400 text-xs">Waktu</p><p className="font-medium">{formatDate(detail.createdAt)}</p></div>
            </div>
            <div className="border border-gray-100 dark:border-gray-700 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-800 text-gray-500">
                  <tr>
                    <th className="text-left px-4 py-2 font-medium">Produk</th>
                    <th className="text-center px-4 py-2 font-medium">Qty</th>
                    <th className="text-right px-4 py-2 font-medium">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                  {detail.items.map(item => (
                    <tr key={item.product.id}>
                      <td className="px-4 py-2">{item.product.name}</td>
                      <td className="px-4 py-2 text-center">{item.qty}</td>
                      <td className="px-4 py-2 text-right">{formatRupiah(item.subtotal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 space-y-1.5 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Subtotal</span><span>{formatRupiah(detail.subtotal)}</span></div>
              {detail.discount > 0 && <div className="flex justify-between text-green-600"><span>Diskon</span><span>-{formatRupiah(detail.discount)}</span></div>}
              <div className="flex justify-between"><span className="text-gray-500">PPN</span><span>{formatRupiah(detail.tax)}</span></div>
              <div className="flex justify-between font-bold pt-1 border-t border-gray-200 dark:border-gray-700">
                <span>Total</span><span className="text-indigo-600">{formatRupiah(detail.total)}</span>
              </div>
              <div className="flex justify-between"><span className="text-gray-500">Bayar</span><span>{formatRupiah(detail.paid)}</span></div>
              <div className="flex justify-between text-green-600 font-semibold"><span>Kembalian</span><span>{formatRupiah(detail.change)}</span></div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
