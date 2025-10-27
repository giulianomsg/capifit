import { useCallback, useEffect, useState } from 'react';
import { Alert, Button, Card, Col, Form, Row, Spinner } from 'react-bootstrap';
import { useForm } from 'react-hook-form';
import api from '../../services/api';
import { useAuth } from '../../store/auth';
import type { StudentSummary } from '../trainer/StudentsList';

interface ApiStudentResponse {
  data?: StudentSummary;
}

interface ProfileFormValues {
  name: string;
  email: string;
  password?: string;
}

const resolveStudent = (payload: unknown): StudentSummary | null => {
  if (!payload || typeof payload !== 'object') {
    return null;
  }

  const data = payload as Partial<StudentSummary>;

  if (!data.id || !data.name || !data.email) {
    return null;
  }

  return {
    id: data.id,
    userId: data.userId ?? '',
    trainerId: data.trainerId ?? '',
    name: data.name,
    email: data.email,
    isActive: Boolean(data.isActive),
    createdAt: data.createdAt ?? '',
    updatedAt: data.updatedAt ?? '',
  } satisfies StudentSummary;
};

const MyProfile = () => {
  const {
    state: { user },
    setUser,
  } = useAuth();
  const [student, setStudent] = useState<StudentSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProfileFormValues>({
    defaultValues: { name: user?.name ?? '', email: user?.email ?? '', password: '' },
  });

  const fetchProfile = useCallback(async () => {
    if (!user?.id) {
      setError('Perfil do usuário não carregado.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await api.get(`/students/${user.id}`);
      const payload = (response.data as ApiStudentResponse)?.data ?? response.data;
      const parsed = resolveStudent(payload);

      if (!parsed) {
        throw new Error('Aluno não encontrado');
      }

      setStudent(parsed);
      reset({ name: parsed.name, email: parsed.email, password: '' });
      setSubmitError(null);
    } catch (err) {
      console.error('Erro ao carregar perfil do aluno', err);
      setError('Não foi possível carregar seus dados.');
    } finally {
      setLoading(false);
    }
  }, [reset, user?.id]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const onSubmit = handleSubmit(async (values) => {
    if (!student) {
      return;
    }

    setSubmitMessage(null);
    setSubmitError(null);

    const payload: Record<string, unknown> = {
      name: values.name,
      email: values.email,
    };

    if (values.password) {
      payload.password = values.password;
    }

    try {
      const response = await api.patch(`/students/${student.id}`, payload);
      const updated = resolveStudent(response.data?.data ?? response.data);

      if (!updated) {
        throw new Error('Resposta inválida do servidor');
      }

      setStudent(updated);
      reset({ name: updated.name, email: updated.email, password: '' });
      setSubmitMessage('Dados atualizados com sucesso.');

      if (user) {
        setUser({ ...user, name: updated.name, email: updated.email });
      }
    } catch (err) {
      console.error('Erro ao atualizar perfil', err);
      setSubmitError('Não foi possível salvar as alterações.');
    }
  });

  if (loading) {
    return (
      <div className="d-flex justify-content-center py-5">
        <Spinner animation="border" role="status" />
      </div>
    );
  }

  if (error) {
    return (
      <Card bg="secondary" text="light" className="border-0 shadow-sm">
        <Card.Body>
          <Alert variant="danger" className="mb-0">
            {error}
          </Alert>
          <div className="d-flex justify-content-end mt-3">
            <Button variant="outline-light" onClick={fetchProfile}>
              Tentar novamente
            </Button>
          </div>
        </Card.Body>
      </Card>
    );
  }

  if (!student) {
    return <Alert variant="warning">Perfil não disponível.</Alert>;
  }

  return (
    <div className="d-flex flex-column gap-4" style={{ maxWidth: 720 }}>
      <div>
        <h1 className="h4 mb-1">Meu perfil</h1>
        <p className="text-muted mb-0">Atualize seus dados pessoais sempre que necessário.</p>
      </div>

      <Card bg="secondary" text="light" className="border-0 shadow-sm">
        <Card.Body>
          <Form onSubmit={onSubmit} noValidate>
            <Row className="g-3">
              <Col xs={12}>
                <Form.Group controlId="name">
                  <Form.Label>Nome completo</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Seu nome"
                    isInvalid={Boolean(errors.name)}
                    {...register('name', { required: 'Informe o nome' })}
                  />
                  <Form.Control.Feedback type="invalid">{errors.name?.message}</Form.Control.Feedback>
                </Form.Group>
              </Col>

              <Col xs={12}>
                <Form.Group controlId="email">
                  <Form.Label>E-mail</Form.Label>
                  <Form.Control
                    type="email"
                    placeholder="email@exemplo.com"
                    isInvalid={Boolean(errors.email)}
                    {...register('email', {
                      required: 'Informe o e-mail',
                      pattern: {
                        value: /.+@.+\..+/, // validação simples
                        message: 'E-mail inválido',
                      },
                    })}
                  />
                  <Form.Control.Feedback type="invalid">{errors.email?.message}</Form.Control.Feedback>
                </Form.Group>
              </Col>

              <Col xs={12}>
                <Form.Group controlId="password">
                  <Form.Label>Senha (opcional)</Form.Label>
                  <Form.Control
                    type="password"
                    placeholder="Informe para alterar"
                    isInvalid={Boolean(errors.password)}
                    {...register('password', {
                      minLength: {
                        value: 6,
                        message: 'A senha deve ter ao menos 6 caracteres',
                      },
                    })}
                  />
                  <Form.Control.Feedback type="invalid">{errors.password?.message}</Form.Control.Feedback>
                </Form.Group>
              </Col>
            </Row>

            <div className="d-flex flex-column gap-3 mt-4">
              {submitError && <Alert variant="danger" className="mb-0">{submitError}</Alert>}
              {submitMessage && <Alert variant="success" className="mb-0">{submitMessage}</Alert>}

              <div className="d-flex justify-content-end">
                <Button type="submit" variant="primary" disabled={isSubmitting}>
                  {isSubmitting ? 'Salvando...' : 'Salvar alterações'}
                </Button>
              </div>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </div>
  );
};

export default MyProfile;
