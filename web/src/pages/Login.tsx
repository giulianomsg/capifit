import { useState } from 'react';
import { Alert, Button, Card, Col, Form, Row, Spinner } from 'react-bootstrap';
import { useForm } from 'react-hook-form';
import { Location, Navigate, useLocation, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { AuthUser, useAuth } from '../store/auth';

interface LoginFormValues {
  email: string;
  password: string;
}

interface LocationState {
  from?: Location;
}

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

const buildFallbackUser = (payload: Record<string, unknown>, credentials: LoginFormValues): AuthUser => {
  const role = resolveRole(payload?.role ?? payload?.user?.role) ?? 'STUDENT';

  return {
    id: (payload?.user as Record<string, unknown> | undefined)?.id as string | undefined ??
      (typeof payload?.id === 'string' ? payload.id : credentials.email),
    name: (payload?.user as Record<string, unknown> | undefined)?.name as string | undefined ??
      (typeof payload?.name === 'string' ? payload.name : credentials.email),
    email: (payload?.user as Record<string, unknown> | undefined)?.email as string | undefined ??
      (typeof payload?.email === 'string' ? payload.email : credentials.email),
    role,
  };
};

const LoginPage = () => {
  const {
    state,
    setSession,
    setUser,
  } = useAuth();
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
      const payload = (response.data?.data ?? response.data ?? {}) as Record<string, unknown>;

      const accessToken = typeof payload?.accessToken === 'string'
        ? payload.accessToken
        : typeof payload?.token === 'string'
          ? payload.token
          : null;
      const refreshToken = typeof payload?.refreshToken === 'string' ? payload.refreshToken : null;

      if (!accessToken) {
        throw new Error('Access token not received');
      }

      const fallbackUser = buildFallbackUser(payload, values);
      setSession({ accessToken, refreshToken, user: fallbackUser });

      try {
        const meResponse = await api.get('/users/me');
        const meData = (meResponse.data?.data ?? meResponse.data ?? {}) as Record<string, unknown>;

        if (typeof meData?.id === 'string' && typeof meData?.role === 'string') {
          const resolvedRole = resolveRole(meData.role) ?? fallbackUser.role;
          const enrichedUser: AuthUser = {
            id: meData.id,
            name: typeof meData?.name === 'string' ? meData.name : fallbackUser.name,
            email: typeof meData?.email === 'string' ? meData.email : fallbackUser.email,
            role: resolvedRole,
          };
          setUser(enrichedUser);
        }
      } catch (profileError) {
        console.warn('Não foi possível carregar o perfil do usuário autenticado.', profileError);
      }

      const redirectTo = (redirectState.from as Location | undefined)?.pathname ?? '/dashboard';
      navigate(redirectTo, { replace: true });
    } catch (error) {
      const message =
        (error as Error).message?.toLowerCase().includes('token')
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
        <Card bg="secondary" text="light" className="shadow-lg border-0">
          <Card.Body>
            <h1 className="h4 text-center mb-4">Entrar na plataforma</h1>
            {errorMessage && <Alert variant="danger">{errorMessage}</Alert>}
            <Form onSubmit={onSubmit} noValidate>
              <Form.Group controlId="email" className="mb-3">
                <Form.Label>E-mail</Form.Label>
                <Form.Control
                  type="email"
                  placeholder="nome@empresa.com"
                  isInvalid={Boolean(errors.email)}
                  {...register('email', {
                    required: 'Informe o e-mail',
                    pattern: {
                      value: /.+@.+\..+/, 
                      message: 'E-mail inválido',
                    },
                  })}
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
                  {...register('password', {
                    required: 'Informe a senha',
                  })}
                />
                <Form.Control.Feedback type="invalid">
                  {errors.password?.message}
                </Form.Control.Feedback>
              </Form.Group>

              <div className="d-grid gap-2">
                <Button type="submit" variant="primary" disabled={submitting}>
                  {submitting ? <Spinner as="span" animation="border" size="sm" role="status" /> : 'Entrar'}
                </Button>
                <Button
                  variant="link"
                  className="text-light"
                  onClick={() => navigate('/forgot', { replace: true })}
                >
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
