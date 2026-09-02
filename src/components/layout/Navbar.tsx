import { Menu, Sun, Moon, LogOut, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import toast from 'react-hot-toast';

interface Props { onMenuClick: () => void; title: string; }

export function Navbar({ onMenuClick, title }: Props) {
  const { user, logout } = useAuth();
  const { dark, toggle } = useTheme();

  const handleLogout = () => {
    logout();
    toast.success('Berhasil logout');
  };

  return (
    <header className="h-16 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between px-4 lg:px-6 sticky top-0 z-10">
      <div className="flex items-center gap-3">
        <button onClick={onMenuClick} className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
          <Menu size={20} />
        </button>
        <h1 className="font-semibold text-gray-800 dark:text-gray-200">{title}</h1>
      </div>
      <div className="flex items-center gap-2">
        <button onClick={toggle} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
          {dark ? <Sun size={18} /> : <Moon size={18} />}
        </button>
        <div className="flex items-center gap-2 pl-2 border-l border-gray-200 dark:border-gray-700">
          <div className="w-8 h-8 bg-indigo-100 dark:bg-indigo-900 rounded-full flex items-center justify-center">
            <User size={14} className="text-indigo-600 dark:text-indigo-400" />
          </div>
          <span className="text-sm font-medium hidden sm:block">{user?.name}</span>
          <button onClick={handleLogout} className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 transition-colors" title="Logout">
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </header>
  );
}
