import { useState } from 'react';
import { Alert, Button, Card, Col, Form, Row, Spinner } from 'react-bootstrap';
import { useForm } from 'react-hook-form';
import { useNavigate, useLocation, Navigate, Location } from 'react-router-dom';
import api from '../../services/api';
import { useAuth, AuthUser } from '../../store/auth';

type LoginFormValues = {
  email: string;
  password: string;
};

type LocationState = {
  from?: Location;
};

const resolveRole = (value: unknown): AuthUser['role'] | null => {
  if (typeof value !== 'string') {
    return null;
  }

  const normalized = value.toUpperCase();
  if (normalized === 'ADMIN' || normalized === 'TRAINER' || normalized === 'STUDENT') {
    return normalized;
  }

  return null;
};

const LoginPage = () => {
  const { state, setSession } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectState = (location.state as LocationState | null) ?? {};
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    defaultValues: { email: '', password: '' },
  });
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (state.isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const onSubmit = handleSubmit(async (values) => {
    setSubmitting(true);
    setErrorMessage(null);

    try {
      const response = await api.post('/auth/login', values);
      const payload = response.data?.data ?? response.data ?? {};

      const accessToken: string | null = payload?.accessToken ?? payload?.token ?? null;
      const refreshToken: string | null = payload?.refreshToken ?? null;

      if (!accessToken) {
        throw new Error('Access token not received');
      }

      const roleFromPayload = resolveRole(payload?.role ?? payload?.user?.role);
      const user: AuthUser = {
        id: payload?.user?.id ?? payload?.id ?? payload?.userId ?? values.email,
        name: payload?.user?.name ?? payload?.name ?? values.email,
        email: payload?.user?.email ?? payload?.email ?? values.email,
        role: roleFromPayload ?? 'STUDENT',
      };

      setSession({ accessToken, refreshToken, user });

      const redirectTo = (redirectState.from as Location | undefined)?.pathname ?? '/dashboard';
      navigate(redirectTo, { replace: true });
    } catch (error) {
      const message =
        (error as Error).message?.includes('token')
          ? 'Não foi possível autenticar. Verifique as credenciais e tente novamente.'
          : 'Credenciais inválidas. Tente novamente.';
      setErrorMessage(message);
    } finally {
      setSubmitting(false);
    }
  });

  return (
    <Row className="justify-content-center align-items-center min-vh-100 bg-dark text-light m-0">
      <Col md={4} sm={10} className="py-5">
        <Card bg="secondary" text="light" className="shadow-lg">
          <Card.Body>
            <h1 className="h4 text-center mb-4">Entrar na plataforma</h1>
            {errorMessage && (
              <Alert variant="danger">{errorMessage}</Alert>
            )}
            <Form onSubmit={onSubmit} noValidate>
              <Form.Group controlId="email" className="mb-3">
                <Form.Label>E-mail</Form.Label>
                <Form.Control
                  type="email"
                  placeholder="nome@empresa.com"
                  isInvalid={Boolean(errors.email)}
                  {...register('email', { required: 'Informe o e-mail', pattern: { value: /.+@.+\..+/, message: 'E-mail inválido' } })}
                />
                <Form.Control.Feedback type="invalid">
                  {errors.email?.message}
                </Form.Control.Feedback>
              </Form.Group>

              <Form.Group controlId="password" className="mb-3">
                <Form.Label>Senha</Form.Label>
                <Form.Control
                  type="password"
                  placeholder="Sua senha"
                  isInvalid={Boolean(errors.password)}
                  {...register('password', { required: 'Informe a senha' })}
                />
                <Form.Control.Feedback type="invalid">
                  {errors.password?.message}
                </Form.Control.Feedback>
              </Form.Group>

              <div className="d-grid gap-2">
                <Button type="submit" variant="primary" disabled={submitting}>
                  {submitting ? <Spinner as="span" animation="border" size="sm" role="status" /> : 'Entrar'}
                </Button>
                <Button variant="link" className="text-light" onClick={() => navigate('/forgot')}>
                  Esqueci minha senha
                </Button>
              </div>
            </Form>
          </Card.Body>
        </Card>
      </Col>
    </Row>
  );
};

export default LoginPage;
