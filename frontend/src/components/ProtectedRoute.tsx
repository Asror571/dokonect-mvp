import { Navigate, useLocation } from 'react-router-dom';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

export const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps) => {
  const location = useLocation();
  
  // Read directly from localStorage for immediate check
  const token = localStorage.getItem('accessToken');
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;
  const isAuthenticated = !!token && !!user;

  console.log('🛡️ ProtectedRoute check:', {
    isAuthenticated,
    hasToken: !!token,
    hasUser: !!user,
    user: user ? { name: user.name, role: user.role } : null,
    allowedRoles,
    currentPath: location.pathname
  });

  if (!isAuthenticated || !user) {
    console.log('❌ Not authenticated, redirecting to /login');
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    console.log('🚫 Role not allowed:', user.role, 'Required:', allowedRoles);
    return <Navigate to="/unauthorized" replace />;
  }

  console.log('✅ Access granted');
  return <>{children}</>;
};
