import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '../context/AuthContext';
import { AxiosError } from 'axios';

export const useAuth = () => {
  const auth = useAuthContext();
  const navigate = useNavigate();

  const loginAndRedirect = useCallback(
    async (email: string, password: string): Promise<string | null> => {
      try {
        await auth.login(email, password);
        navigate('/dashboard');
        return null;
      } catch (err) {
        const axiosErr = err as AxiosError<{ message: string }>;
        return axiosErr.response?.data?.message ?? 'Login failed. Please try again.';
      }
    },
    [auth, navigate]
  );

  const registerAndRedirect = useCallback(
    async (
      name: string,
      email: string,
      password: string,
      role?: 'author' | 'admin'
    ): Promise<string | null> => {
      try {
        await auth.register(name, email, password, role);
        navigate('/login');
        return null;
      } catch (err) {
        const axiosErr = err as AxiosError<{ message: string }>;
        return axiosErr.response?.data?.message ?? 'Registration failed. Please try again.';
      }
    },
    [auth, navigate]
  );

  const logoutAndRedirect = useCallback(async () => {
    await auth.logout();
    navigate('/login');
  }, [auth, navigate]);

  return {
    ...auth,
    loginAndRedirect,
    registerAndRedirect,
    logoutAndRedirect,
  };
};
