import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import type { ReactNode } from 'react';
import { authService } from '../services/auth.service';
import { setAccessToken } from '../lib/api-client';
import type { User } from '../types';

interface AuthContextValue {
  user: User | null;
  accessToken: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, role?: 'author' | 'admin') => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scheduleRefresh = useCallback((expiresAt: string) => {
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    if (!expiresAt) return;

    const expTime = new Date(expiresAt).getTime();
    if (isNaN(expTime)) return;

    const FIVE_MINS = 5 * 60 * 1000;
    const SAFETY_BUFFER = 15000;
    const timeout = Math.max(expTime - Date.now() - FIVE_MINS, SAFETY_BUFFER);

    refreshTimerRef.current = setTimeout(async () => {
      try {
        const storedRefreshToken = localStorage.getItem('refreshToken');
        if (!storedRefreshToken) throw new Error('No refresh token found');
        const { data } = await authService.refresh(storedRefreshToken);

        setToken(data.accessToken);
        setAccessToken(data.accessToken);
        localStorage.setItem('accessToken', data.accessToken);
        localStorage.setItem('refreshToken', data.refreshToken);
        localStorage.setItem('accessTokenExpiresAt', data.accessTokenExpiresAt);

        scheduleRefresh(data.accessTokenExpiresAt);
      } catch (err) {
        console.error('Scheduled refresh failed:', err);
      }
    }, timeout);
  }, []);

  useEffect(() => {
    const tryRefresh = async () => {
      const storedRefreshToken = localStorage.getItem('refreshToken');
      const storedAccessToken = localStorage.getItem('accessToken');
      const storedExpiry = localStorage.getItem('accessTokenExpiresAt');

      if (!storedRefreshToken) {
        setIsLoading(false);
        return;
      }

      const FIVE_MINS = 5 * 60 * 1000;
      const isStillValid =
        storedAccessToken &&
        storedExpiry &&
        new Date(storedExpiry).getTime() - Date.now() > FIVE_MINS;

      try {
        let currentToken = storedAccessToken;
        let currentExpiry = storedExpiry;

        if (isStillValid) {
          setToken(storedAccessToken);
          setAccessToken(storedAccessToken);
        } else {
          const { data } = await authService.refresh(storedRefreshToken);
          currentToken = data.accessToken;
          currentExpiry = data.accessTokenExpiresAt;

          setToken(currentToken);
          setAccessToken(currentToken);
          localStorage.setItem('accessToken', currentToken);
          localStorage.setItem('refreshToken', data.refreshToken);
          localStorage.setItem('accessTokenExpiresAt', currentExpiry);
        }

        const me = await authService.getMe();
        setUser(me.data.user);

        scheduleRefresh(currentExpiry!);
      } catch (err) {
        console.error('Initial auth check failed:', err);
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('accessTokenExpiresAt');
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };
    tryRefresh();
  }, [scheduleRefresh]);

  useEffect(() => {
    const handleForcedLogout = () => {
      setUser(null);
      setToken(null);
      setAccessToken(null);
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('accessTokenExpiresAt');
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    };
    window.addEventListener('auth:logout', handleForcedLogout);
    return () => window.removeEventListener('auth:logout', handleForcedLogout);
  }, []);

  useEffect(() => {
    const handleRefresh = (e: any) => {
      const { accessToken, accessTokenExpiresAt } = e.detail;
      setToken(accessToken);
      scheduleRefresh(accessTokenExpiresAt);
    };
    window.addEventListener('auth:refresh', handleRefresh as EventListener);
    return () => window.removeEventListener('auth:refresh', handleRefresh as EventListener);
  }, [scheduleRefresh]);

  const login = useCallback(
    async (email: string, password: string) => {
      const { data } = await authService.login({ email, password });
      setToken(data.accessToken);
      setAccessToken(data.accessToken);
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      localStorage.setItem('accessTokenExpiresAt', data.accessTokenExpiresAt);
      setUser(data.user);
      scheduleRefresh(data.accessTokenExpiresAt);
    },
    [scheduleRefresh]
  );

  const register = useCallback(
    async (name: string, email: string, password: string, role: 'author' | 'admin' = 'author') => {
      await authService.register({ name, email, password, role });
    },
    []
  );

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch {/* ignore errors on logout */ }
    setUser(null);
    setToken(null);
    setAccessToken(null);
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('accessTokenExpiresAt');
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken: token,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuthContext must be used within AuthProvider');
  return ctx;
};
