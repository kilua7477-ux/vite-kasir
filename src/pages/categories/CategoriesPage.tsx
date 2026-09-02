import { useState } from 'react';
import { Plus, Pencil, Trash2, Search } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Modal, ConfirmModal } from '../../components/ui/Modal';
import { EmptyState } from '../../components/ui/EmptyState';
import { Pagination } from '../../components/ui/Pagination';
import { formatDate } from '../../utils';
import type { Category } from '../../types';
import toast from 'react-hot-toast';

const PER_PAGE = 8;
const empty = { name: '', description: '' };

export default function CategoriesPage() {
  const { categories, addCategory, updateCategory, deleteCategory } = useApp();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState<{ open: boolean; data?: Category }>({ open: false });
  const [confirm, setConfirm] = useState<{ open: boolean; id?: string }>({ open: false });
  const [form, setForm] = useState(empty);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const filtered = categories.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const openAdd = () => { setForm(empty); setErrors({}); setModal({ open: true }); };
  const openEdit = (c: Category) => { setForm({ name: c.name, description: c.description }); setErrors({}); setModal({ open: true, data: c }); };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = 'Nama wajib diisi';
    return e;
  };

  const handleSave = () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    if (modal.data) {
      updateCategory(modal.data.id, form);
      toast.success('Kategori diperbarui');
    } else {
      addCategory(form);
      toast.success('Kategori ditambahkan');
    }
    setModal({ open: false });
  };

  const handleDelete = () => {
    if (confirm.id) { deleteCategory(confirm.id); toast.success('Kategori dihapus'); }
    setConfirm({ open: false });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 justify-between">
        <div className="relative flex-1 max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Cari kategori..." className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 outline-none focus:border-indigo-500" />
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium transition-colors">
          <Plus size={16} /> Tambah Kategori
        </button>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
        {paginated.length === 0 ? <EmptyState message="Tidak ada kategori" /> : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400">
              <tr>
                <th className="text-left px-5 py-3 font-medium">Nama</th>
                <th className="text-left px-5 py-3 font-medium hidden sm:table-cell">Deskripsi</th>
                <th className="text-left px-5 py-3 font-medium hidden md:table-cell">Dibuat</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
              {paginated.map(c => (
                <tr key={c.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <td className="px-5 py-3 font-medium">{c.name}</td>
                  <td className="px-5 py-3 text-gray-500 hidden sm:table-cell">{c.description || '-'}</td>
                  <td className="px-5 py-3 text-gray-400 hidden md:table-cell">{formatDate(c.createdAt)}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-1 justify-end">
                      <button onClick={() => openEdit(c)} className="p-1.5 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/20 text-indigo-500 transition-colors">
                        <Pencil size={15} />
                      </button>
                      <button onClick={() => setConfirm({ open: true, id: c.id })} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 transition-colors">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <Pagination page={page} total={filtered.length} perPage={PER_PAGE} onChange={setPage} />

      <Modal open={modal.open} onClose={() => setModal({ open: false })} title={modal.data ? 'Edit Kategori' : 'Tambah Kategori'} size="sm">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">Nama Kategori</label>
            <input value={form.name} onChange={e => { setForm(f => ({ ...f, name: e.target.value })); setErrors(er => ({ ...er, name: '' })); }}
              className={`w-full px-4 py-2.5 rounded-xl border text-sm outline-none focus:border-indigo-500 dark:bg-gray-800 dark:border-gray-700 ${errors.name ? 'border-red-400' : 'border-gray-200'}`} />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Deskripsi</label>
            <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm outline-none focus:border-indigo-500 dark:bg-gray-800 resize-none" />
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <button onClick={() => setModal({ open: false })} className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-600 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">Batal</button>
            <button onClick={handleSave} className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm transition-colors">Simpan</button>
          </div>
        </div>
      </Modal>

      <ConfirmModal open={confirm.open} onClose={() => setConfirm({ open: false })} onConfirm={handleDelete}
        title="Hapus Kategori" message="Yakin ingin menghapus kategori ini?" />
    </div>
  );
}
