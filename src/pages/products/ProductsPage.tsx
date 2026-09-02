import { useState, useRef } from 'react';
import { Plus, Pencil, Trash2, Search, ImagePlus, ChevronUp, ChevronDown } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Modal, ConfirmModal } from '../../components/ui/Modal';
import { EmptyState } from '../../components/ui/EmptyState';
import { Pagination } from '../../components/ui/Pagination';
import { formatRupiah } from '../../utils';
import type { Product } from '../../types';
import toast from 'react-hot-toast';

const PER_PAGE = 8;
const emptyForm = { name: '', categoryId: '', price: '', stock: '', barcode: '', image: '' };
type SortKey = 'name' | 'price' | 'stock';

export default function ProductsPage() {
  const { products, categories, addProduct, updateProduct, deleteProduct } = useApp();
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('');
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<{ key: SortKey; dir: 'asc' | 'desc' }>({ key: 'name', dir: 'asc' });
  const [modal, setModal] = useState<{ open: boolean; data?: Product }>({ open: false });
  const [confirm, setConfirm] = useState<{ open: boolean; id?: string }>({ open: false });
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const imgRef = useRef<HTMLInputElement>(null);

  const filtered = products
    .filter(p => p.name.toLowerCase().includes(search.toLowerCase()) && (!catFilter || p.categoryId === catFilter))
    .sort((a, b) => {
      const v = sort.key === 'name' ? a.name.localeCompare(b.name) : (a[sort.key] as number) - (b[sort.key] as number);
      return sort.dir === 'asc' ? v : -v;
    });
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const toggleSort = (key: SortKey) =>
    setSort(s => s.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' });

  const SortIcon = ({ k }: { k: SortKey }) => sort.key === k
    ? (sort.dir === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />)
    : <ChevronUp size={14} className="opacity-20" />;

  const openAdd = () => { setForm(emptyForm); setErrors({}); setModal({ open: true }); };
  const openEdit = (p: Product) => {
    setForm({ name: p.name, categoryId: p.categoryId, price: String(p.price), stock: String(p.stock), barcode: p.barcode, image: p.image });
    setErrors({}); setModal({ open: true, data: p });
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = 'Nama wajib diisi';
    if (!form.categoryId) e.categoryId = 'Kategori wajib dipilih';
    if (!form.price || isNaN(Number(form.price)) || Number(form.price) <= 0) e.price = 'Harga tidak valid';
    if (!form.stock || isNaN(Number(form.stock)) || Number(form.stock) < 0) e.stock = 'Stok tidak valid';
    return e;
  };

  const handleSave = () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    const data = { name: form.name, categoryId: form.categoryId, price: Number(form.price), stock: Number(form.stock), barcode: form.barcode, image: form.image };
    if (modal.data) { updateProduct(modal.data.id, data); toast.success('Produk diperbarui'); }
    else { addProduct(data); toast.success('Produk ditambahkan'); }
    setModal({ open: false });
  };

  const handleImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { toast.error('Ukuran gambar max 2MB'); return; }
    const reader = new FileReader();
    reader.onload = ev => setForm(f => ({ ...f, image: ev.target?.result as string }));
    reader.readAsDataURL(file);
  };

  const handleDelete = () => {
    if (confirm.id) { deleteProduct(confirm.id); toast.success('Produk dihapus'); }
    setConfirm({ open: false });
  };

  const f = (key: keyof typeof emptyForm) => ({
    value: form[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setForm(prev => ({ ...prev, [key]: e.target.value }));
      setErrors(er => ({ ...er, [key]: '' }));
    },
  });

  const inputCls = (err?: string) =>
    `w-full px-4 py-2.5 rounded-xl border text-sm outline-none focus:border-indigo-500 dark:bg-gray-800 dark:border-gray-700 ${err ? 'border-red-400' : 'border-gray-200'}`;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Cari produk..." className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 outline-none focus:border-indigo-500" />
        </div>
        <select value={catFilter} onChange={e => { setCatFilter(e.target.value); setPage(1); }}
          className="px-4 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 outline-none focus:border-indigo-500">
          <option value="">Semua Kategori</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium transition-colors whitespace-nowrap">
          <Plus size={16} /> Tambah Produk
        </button>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
        {paginated.length === 0 ? <EmptyState message="Tidak ada produk" /> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                <tr>
                  <th className="text-left px-5 py-3 font-medium">Gambar</th>
                  <th className="text-left px-5 py-3 font-medium cursor-pointer select-none" onClick={() => toggleSort('name')}>
                    <span className="flex items-center gap-1">Nama <SortIcon k="name" /></span>
                  </th>
                  <th className="text-left px-5 py-3 font-medium hidden sm:table-cell">Kategori</th>
                  <th className="text-left px-5 py-3 font-medium cursor-pointer select-none" onClick={() => toggleSort('price')}>
                    <span className="flex items-center gap-1">Harga <SortIcon k="price" /></span>
                  </th>
                  <th className="text-left px-5 py-3 font-medium cursor-pointer select-none" onClick={() => toggleSort('stock')}>
                    <span className="flex items-center gap-1">Stok <SortIcon k="stock" /></span>
                  </th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                {paginated.map(p => {
                  const cat = categories.find(c => c.id === p.categoryId);
                  return (
                    <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                      <td className="px-5 py-3">
                        {p.image ? (
                          <img src={p.image} alt={p.name} className="w-10 h-10 rounded-lg object-cover" />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                            <ImagePlus size={16} className="text-gray-400" />
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-3 font-medium">{p.name}</td>
                      <td className="px-5 py-3 text-gray-500 hidden sm:table-cell">
                        <span className="px-2 py-0.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-full text-xs">{cat?.name ?? '-'}</span>
                      </td>
                      <td className="px-5 py-3 font-medium">{formatRupiah(p.price)}</td>
                      <td className="px-5 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${p.stock === 0 ? 'bg-red-100 text-red-600' : p.stock < 10 ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>
                          {p.stock}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-1 justify-end">
                          <button onClick={() => openEdit(p)} className="p-1.5 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/20 text-indigo-500 transition-colors"><Pencil size={15} /></button>
                          <button onClick={() => setConfirm({ open: true, id: p.id })} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 transition-colors"><Trash2 size={15} /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <Pagination page={page} total={filtered.length} perPage={PER_PAGE} onChange={setPage} />

      <Modal open={modal.open} onClose={() => setModal({ open: false })} title={modal.data ? 'Edit Produk' : 'Tambah Produk'} size="lg">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium mb-1.5">Gambar Produk</label>
            <div onClick={() => imgRef.current?.click()} className="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl p-4 text-center cursor-pointer hover:border-indigo-400 transition-colors">
              {form.image ? (
                <img src={form.image} alt="preview" className="h-24 mx-auto rounded-lg object-cover" />
              ) : (
                <div className="flex flex-col items-center gap-2 text-gray-400 py-4">
                  <ImagePlus size={28} />
                  <p className="text-xs">Klik untuk upload (max 2MB)</p>
                </div>
              )}
            </div>
            <input ref={imgRef} type="file" accept="image/*" className="hidden" onChange={handleImage} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Nama Produk</label>
            <input {...f('name')} className={inputCls(errors.name)} />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Kategori</label>
            <select {...f('categoryId')} className={inputCls(errors.categoryId)}>
              <option value="">Pilih kategori</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            {errors.categoryId && <p className="text-red-500 text-xs mt-1">{errors.categoryId}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Harga (Rp)</label>
            <input type="number" {...f('price')} className={inputCls(errors.price)} />
            {errors.price && <p className="text-red-500 text-xs mt-1">{errors.price}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Stok</label>
            <input type="number" {...f('stock')} className={inputCls(errors.stock)} />
            {errors.stock && <p className="text-red-500 text-xs mt-1">{errors.stock}</p>}
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium mb-1.5">Barcode</label>
            <input {...f('barcode')} className={inputCls()} />
          </div>
        </div>
        <div className="flex gap-3 justify-end pt-4 mt-2 border-t border-gray-100 dark:border-gray-700">
          <button onClick={() => setModal({ open: false })} className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-600 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">Batal</button>
          <button onClick={handleSave} className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm transition-colors">Simpan</button>
        </div>
      </Modal>

      <ConfirmModal open={confirm.open} onClose={() => setConfirm({ open: false })} onConfirm={handleDelete}
        title="Hapus Produk" message="Yakin ingin menghapus produk ini?" />
    </div>
  );
}
