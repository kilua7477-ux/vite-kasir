import { PackageSearch } from 'lucide-react';

export function EmptyState({ message = 'Tidak ada data' }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-gray-400">
      <PackageSearch size={48} strokeWidth={1} className="mb-3" />
      <p className="text-sm">{message}</p>
    </div>
  );
}
