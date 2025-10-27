import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Button, Card, Col, Form, Row, Spinner } from 'react-bootstrap';
import { useForm } from 'react-hook-form';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import api from '../../services/api';
import type { StudentSummary } from './StudentsList';

interface StudentFormValues {
  name: string;
  email: string;
  password?: string;
  isActive: boolean;
}

interface StudentFormProps {
  mode: 'create' | 'edit';
  studentId?: string;
  initialData?: StudentSummary | null;
  onSuccess?: (student: StudentSummary) => void;
}

interface ApiStudentResponse {
  data?: StudentSummary;
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

const StudentForm = ({ mode, studentId, initialData, onSuccess }: StudentFormProps) => {
  const isEditMode = mode === 'edit';
  const [loading, setLoading] = useState(isEditMode && !initialData);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<StudentFormValues>({
    defaultValues: {
      name: '',
      email: '',
      password: '',
      isActive: true,
    },
  });

  const loadStudent = useCallback(async () => {
    if (!studentId || !isEditMode) {
      return;
    }

    setLoading(true);

    try {
      const response = await api.get(`/students/${studentId}`);
      const payload = (response.data as ApiStudentResponse)?.data ?? response.data;
      const student = resolveStudent(payload);

      if (!student) {
        throw new Error('Perfil do aluno não encontrado');
      }

      reset({
        name: student.name,
        email: student.email,
        password: '',
        isActive: student.isActive,
      });

      setSubmitError(null);
    } catch (error) {
      console.error('Erro ao carregar aluno', error);
      setSubmitError('Não foi possível carregar os dados do aluno.');
    } finally {
      setLoading(false);
    }
  }, [isEditMode, reset, studentId]);

  useEffect(() => {
    if (initialData && isEditMode) {
      reset({
        name: initialData.name,
        email: initialData.email,
        password: '',
        isActive: initialData.isActive,
      });
      setLoading(false);
    } else if (isEditMode) {
      loadStudent();
    }
  }, [initialData, isEditMode, loadStudent, reset]);

  const onSubmit = handleSubmit(async (values) => {
    setSubmitError(null);
    setSubmitSuccess(null);

    const payload: Record<string, unknown> = {
      name: values.name,
      email: values.email,
    };

    if (!isEditMode) {
      payload.password = values.password;
      payload.isActive = values.isActive;
    } else {
      if (values.password) {
        payload.password = values.password;
      }

      payload.isActive = values.isActive;
    }

    if (!payload.password && !isEditMode) {
      setSubmitError('Informe uma senha inicial para o aluno.');
      return;
    }

    try {
      const response = isEditMode
        ? await api.patch(`/students/${studentId}`, payload)
        : await api.post('/students', payload);

      const student = resolveStudent(response.data?.data ?? response.data);

      if (!student) {
        throw new Error('Resposta inválida do servidor.');
      }

      setSubmitSuccess(isEditMode ? 'Dados do aluno atualizados com sucesso.' : 'Aluno criado com sucesso.');
      onSuccess?.(student);

      if (!isEditMode) {
        reset({ name: '', email: '', password: '', isActive: true });
      } else {
        reset({
          name: student.name,
          email: student.email,
          password: '',
          isActive: student.isActive,
        });
      }
    } catch (error) {
      console.error('Erro ao salvar aluno', error);
      setSubmitError('Não foi possível salvar os dados. Verifique as informações e tente novamente.');
    }
  });

  if (loading) {
    return (
      <div className="d-flex justify-content-center py-5">
        <Spinner animation="border" role="status" />
      </div>
    );
  }

  return (
    <Card bg="secondary" text="light" className="border-0 shadow-sm">
      <Card.Body>
        <Form onSubmit={onSubmit} noValidate>
          <Row className="g-3">
            <Col xs={12}>
              <Form.Group controlId="name">
                <Form.Label>Nome completo</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Nome do aluno"
                  isInvalid={Boolean(errors.name)}
                  {...register('name', { required: 'Informe o nome do aluno' })}
                />
                <Form.Control.Feedback type="invalid">{errors.name?.message}</Form.Control.Feedback>
              </Form.Group>
            </Col>

            <Col xs={12}>
              <Form.Group controlId="email">
                <Form.Label>E-mail</Form.Label>
                <Form.Control
                  type="email"
                  placeholder="email@aluno.com"
                  isInvalid={Boolean(errors.email)}
                  {...register('email', {
                    required: 'Informe o e-mail',
                    pattern: {
                      value: /.+@.+\..+/, // simples
                      message: 'E-mail inválido',
                    },
                  })}
                />
                <Form.Control.Feedback type="invalid">{errors.email?.message}</Form.Control.Feedback>
              </Form.Group>
            </Col>

            <Col xs={12}>
              <Form.Group controlId="password">
                <Form.Label>{isEditMode ? 'Senha (opcional)' : 'Senha inicial'}</Form.Label>
                <Form.Control
                  type="password"
                  placeholder={isEditMode ? 'Informe para alterar a senha' : 'Defina uma senha inicial'}
                  isInvalid={Boolean(errors.password)}
                  {...register('password', {
                    required: isEditMode ? false : 'Defina uma senha inicial',
                    minLength: {
                      value: 6,
                      message: 'A senha deve ter ao menos 6 caracteres',
                    },
                  })}
                />
                <Form.Control.Feedback type="invalid">{errors.password?.message}</Form.Control.Feedback>
              </Form.Group>
            </Col>

            <Col xs={12}>
              <Form.Group controlId="isActive">
                <Form.Check
                  type="switch"
                  label="Aluno ativo"
                  {...register('isActive')}
                />
              </Form.Group>
            </Col>
          </Row>

          <div className="d-flex flex-column gap-3 mt-4">
            {submitError && <Alert variant="danger" className="mb-0">{submitError}</Alert>}
            {submitSuccess && <Alert variant="success" className="mb-0">{submitSuccess}</Alert>}

            <div className="d-flex justify-content-end gap-2">
              <Button type="submit" variant="primary" disabled={isSubmitting}>
                {isSubmitting ? 'Salvando...' : isEditMode ? 'Salvar alterações' : 'Criar aluno'}
              </Button>
            </div>
          </div>
        </Form>
      </Card.Body>
    </Card>
  );
};

const StudentFormPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const state = location.state as { student?: StudentSummary; studentId?: string } | null;
  const searchId = searchParams.get('id') ?? undefined;
  const studentId = state?.studentId ?? searchId;

  const initialData = useMemo(() => state?.student ?? null, [state]);
  const mode: 'create' | 'edit' = studentId ? 'edit' : 'create';

  const handleSuccess = (student: StudentSummary) => {
    navigate(`/trainer/students/${student.id}`, { replace: true });
  };

  return (
    <div className="d-flex flex-column gap-4" style={{ maxWidth: 720 }}>
      <div>
        <h1 className="h4 mb-1">{mode === 'edit' ? 'Editar aluno' : 'Novo aluno'}</h1>
        <p className="text-muted mb-0">
          {mode === 'edit'
            ? 'Atualize as informações básicas do aluno.'
            : 'Preencha os dados iniciais para cadastrar um novo aluno.'}
        </p>
      </div>

      <StudentForm mode={mode} studentId={studentId} initialData={initialData} onSuccess={handleSuccess} />
    </div>
  );
};

export default StudentFormPage;
export { StudentForm };
