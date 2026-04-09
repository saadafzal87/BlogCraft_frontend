import { useState, useCallback, useMemo } from 'react';
import { AxiosError, type AxiosResponse } from 'axios';
import { toast } from 'react-toastify';

interface UseApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

export const useApi = <T, P extends any[]>(
  apiFunction: (...args: P) => Promise<AxiosResponse<T>>
) => {
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  const execute = useCallback(
    async (...args: P) => {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      try {
        const response = await apiFunction(...args);
        setState({ data: response.data, loading: false, error: null });
        return response.data;
      } catch (err) {
        const axiosErr = err as AxiosError<{ message?: string }>;
        const message = axiosErr.response?.data?.message || axiosErr.message || 'Something went wrong';

        toast.error(message);

        setState({ data: null, loading: false, error: message });
        throw err;
      }
    },
    [apiFunction]
  );

  const setData = useCallback((data: T | null) => setState((prev) => ({ ...prev, data })), []);

  return useMemo(() => ({
    ...state,
    execute,
    setData,
    clearError,
  }), [state, execute, setData, clearError]);
};
