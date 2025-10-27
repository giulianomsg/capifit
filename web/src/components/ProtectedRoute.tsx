import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { Container, Spinner } from 'react-bootstrap';
import { useAuth } from '../store/auth';
import AppNavbar from './AppNavbar';

const ProtectedRoute = () => {
  const {
    state: { isAuthenticated, isHydrated },
  } = useAuth();
  const location = useLocation();

  if (!isHydrated) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100 bg-dark text-light">
        <Spinner animation="border" role="status" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return (
    <div className="bg-dark text-light min-vh-100 d-flex flex-column">
      <AppNavbar />
      <Container fluid className="flex-grow-1 py-4">
        <Outlet />
      </Container>
    </div>
  );
};

export default ProtectedRoute;
