import { useMemo, useState } from 'react';
import { Button, Container, Nav, Navbar } from 'react-bootstrap';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../store/auth';

type NavItem = {
  to: string;
  label: string;
  end?: boolean;
};

const roleLabels: Record<'ADMIN' | 'TRAINER' | 'STUDENT', string> = {
  ADMIN: 'Administrador',
  TRAINER: 'Personal Trainer',
  STUDENT: 'Aluno',
};

const AppNavbar = () => {
  const {
    state: { user },
    logout,
  } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const links = useMemo<NavItem[]>(() => {
    if (!user) {
      return [];
    }

    const items: NavItem[] = [{ to: '/dashboard', label: 'Dashboard', end: true }];

    if (user.role === 'ADMIN') {
      items.push({ to: '/admin/trainers', label: 'Trainers' });
      items.push({ to: '/admin/subscriptions', label: 'Assinaturas' });
    }

    if (user.role === 'TRAINER') {
      items.push({ to: '/trainer/students', label: 'Alunos' });
    }

    if (user.role === 'STUDENT') {
      items.push({ to: '/student/profile', label: 'Meu perfil' });
      items.push({ to: '/student/workouts', label: 'Meus treinos' });
      items.push({ to: '/student/diets', label: 'Minha dieta' });
      items.push({ to: '/student/assessments', label: 'Minhas avaliações' });
      items.push({ to: '/student/media', label: 'Minhas mídias' });
      items.push({ to: '/student/messages', label: 'Minhas mensagens' });
    }

    return items;
  }, [user]);

  if (!user) {
    return null;
  }

  const handleLogout = async () => {
    if (isLoggingOut) {
      return;
    }

    setIsLoggingOut(true);

    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.warn('Falha ao encerrar sessão remotamente', error);
    } finally {
      logout();
      navigate('/login', { replace: true, state: { from: location } });
      setIsLoggingOut(false);
    }
  };

  return (
    <Navbar bg="dark" variant="dark" expand="lg" className="shadow-sm">
      <Container fluid>
        <Navbar.Brand as={NavLink} to="/dashboard">
          Capifit
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="main-navbar" />
        <Navbar.Collapse id="main-navbar">
          <Nav className="me-auto">
            {links.map((item) => (
              <Nav.Link
                key={item.to}
                as={NavLink}
                to={item.to}
                end={item.end}
                className="text-capitalize"
              >
                {item.label}
              </Nav.Link>
            ))}
          </Nav>

          <div className="d-flex align-items-center gap-3">
            <div className="text-light small text-end">
              <div className="fw-semibold">{user.name}</div>
              <div className="text-muted">{roleLabels[user.role]}</div>
            </div>
            <Button
              variant="outline-light"
              size="sm"
              disabled={isLoggingOut}
              onClick={handleLogout}
            >
              {isLoggingOut ? 'Saindo...' : 'Sair'}
            </Button>
          </div>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default AppNavbar;
