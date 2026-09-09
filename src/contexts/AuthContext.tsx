import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

interface User {
  id: number;
  firstName: string;
  lastName?: string;
  email: string;
  role: string;
  companyName?: string;
  twoFactorEnabled?: boolean;
  image?: string;
  status?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  register: (data: any) => Promise<boolean>;
  updateUser: () => Promise<void>;
  clearError: () => void;
  setSession: (token: string, userData: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getApi = () => {
    if ((window as any).api && (window as any).api.auth) {
      return (window as any).api;
    }
    if ((window as any).electronAPI && (window as any).electronAPI.ipcRenderer) {
      console.warn('⚠️ window.api tsy hita, mampiasa electronAPI ho fallback');
      return null;
    }
    return null;
  };

  const loadUser = useCallback(async () => {
    try {
      const token = sessionStorage.getItem('auth_token');
      if (!token) {
        sessionStorage.removeItem('auth_user');
        setUser(null);
        setLoading(false);
        return;
      }
      const storedUserStr = sessionStorage.getItem('auth_user');
      if (storedUserStr) {
        try {
          const storedUser = JSON.parse(storedUserStr);
          setUser(storedUser);
          setLoading(false);
          return;
        } catch (e) {
          sessionStorage.removeItem('auth_user');
        }
      }
      const api = getApi();
      if (api && api.auth && api.auth.verifyToken) {
        const result = await api.auth.verifyToken(token);
        if (result && result.valid) {
          sessionStorage.setItem('auth_user', JSON.stringify(result.user));
          setUser(result.user);
        } else {
          sessionStorage.removeItem('auth_token');
          sessionStorage.removeItem('auth_user');
          setUser(null);
        }
      } else {
        console.warn('⚠️ API non disponible, chargement depuis sessionStorage');
        setUser(null);
      }
    } catch (err) {
      console.error('❌ [AuthContext] loadUser error:', err);
      sessionStorage.removeItem('auth_token');
      sessionStorage.removeItem('auth_user');
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // ⭐ FIX: Nampiana interval 15 MINITRA ho an'ny famerenana ny session
  useEffect(() => {
    loadUser();
    const intervalId = setInterval(() => {
      loadUser();
    }, 15 * 60 * 1000); // 15 minitra (15 * 60 * 1000 = 900,000 ms)

    return () => clearInterval(intervalId);
  }, [loadUser]);

  const login = async (email: string, password: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const api = getApi();
      if (!api || !api.auth || typeof api.auth.login !== 'function') {
        throw new Error('Electron API tsy hita na tsy manana auth.login');
      }
      const result = await api.auth.login(email, password, '127.0.0.1', navigator.userAgent);
      if (result && result.success && result.token && result.user) {
        setSession(result.token, result.user);
        return true;
      } else {
        setError(result?.error || 'Email ou mot de passe incorrect');
        return false;
      }
    } catch (err: any) {
      console.error('Login error:', err);
      const rawMessage = err.message || '';
      const cleanMessage = rawMessage.replace(/^.*Error:\s*/, '');
      setError(cleanMessage || 'Email ou mot de passe incorrect');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const setSession = (token: string, userData: User) => {
    sessionStorage.setItem('auth_token', token);
    sessionStorage.setItem('auth_user', JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    const token = sessionStorage.getItem('auth_token');
    const api = getApi();
    if (api && api.auth && api.auth.logout && token) {
      api.auth.logout(token).catch(() => {});
    }
    sessionStorage.removeItem('auth_token');
    sessionStorage.removeItem('auth_user');
    setUser(null);
  };

  const register = async (data: any): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const api = getApi();
      if (!api || !api.users || !api.users.create) {
        setError('Electron API tsy hita');
        return false;
      }
      const result = await api.users.create(data);
      if (result && result.success) {
        return true;
      } else {
        setError(result?.error || 'Erreur d\'inscription');
        return false;
      }
    } catch (err: any) {
      setError(err.message || 'Erreur d\'inscription');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const updateUser = async () => { await loadUser(); };
  const clearError = () => setError(null);

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    loading,
    error,
    login,
    logout,
    register,
    updateUser,
    clearError,
    setSession,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};