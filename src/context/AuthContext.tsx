import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { User } from '../types';
import { getFromStorage, setToStorage } from '../utils';

interface AuthCtx {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthCtx | null>(null);

const ADMIN: User = { id: 'u-1', name: 'Admin', email: 'admin@kasir.com', role: 'admin' };

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => getFromStorage('auth_user', null));

  useEffect(() => {
    setToStorage('auth_user', user);
  }, [user]);

  const login = async (email: string, password: string) => {
    await new Promise(r => setTimeout(r, 800));
    if (email === 'admin@kasir.com' && password === 'admin123') {
      setUser(ADMIN);
      return true;
    }
    return false;
  };

  const logout = () => setUser(null);

  return <AuthContext value={{ user, login, logout }}>{children}</AuthContext>;
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
};
