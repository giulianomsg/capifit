import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../store/auth';

interface RoleRouteProps {
  allowedRoles: Array<'ADMIN' | 'TRAINER' | 'STUDENT'>;
  redirectTo?: string;
}

const RoleRoute = ({ allowedRoles, redirectTo = '/dashboard' }: RoleRouteProps) => {
  const {
    state: { user },
  } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    return <Navigate to={redirectTo} replace />;
  }

  return <Outlet />;
};

export default RoleRoute;
