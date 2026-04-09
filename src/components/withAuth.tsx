import type { ComponentType } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthContext } from '../context/AuthContext';
import type { UserRole } from '../types';

interface WithAuthOptions {
  requiredRole?: UserRole;
  redirectTo?: string;
}

function withAuth<P extends object>(
  WrappedComponent: ComponentType<P>,
  options: WithAuthOptions = {}
): ComponentType<P> {
  const { requiredRole, redirectTo = '/login' } = options;

  const ComponentWithAuth = (props: P) => {
    const { isAuthenticated, isLoading, user } = useAuthContext();

    if (isLoading) {
      return (
        <div className="flex items-center justify-center p-8">
          <div className="w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      );
    }

    if (!isAuthenticated) return <Navigate to={redirectTo} replace />;
    if (requiredRole && user?.role !== requiredRole) return <Navigate to="/dashboard" replace />;

    return <WrappedComponent {...props} />;
  };

  ComponentWithAuth.displayName = `withAuth(${WrappedComponent.displayName ?? WrappedComponent.name ?? 'Component'})`;
  return ComponentWithAuth;
}

export default withAuth;
