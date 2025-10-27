import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Badge, Button, Card, Col, Form, Row, Spinner } from 'react-bootstrap';
import { useForm } from 'react-hook-form';
import api from '../../../services/api';

type WorkoutPayload = Record<string, unknown> | null | undefined;

export interface WorkoutItem {
  id: string;
  studentId: string;
  title: string;
  planJson: unknown;
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
}

interface WorkoutsTabProps {
  studentId: string;
}

interface CreateWorkoutFormValues {
  title: string;
  planJsonText: string;
  startDate?: string;
  endDate?: string;
}

interface UpdateWorkoutFormValues extends CreateWorkoutFormValues {}

const parseWorkout = (payload: WorkoutPayload): WorkoutItem | null => {
  if (!payload || typeof payload !== 'object') {
    return null;
  }

  const data = payload as Record<string, unknown>;
  const id = typeof data.id === 'string' ? data.id : null;
  const studentId = typeof data.studentId === 'string' ? data.studentId : null;
  const title = typeof data.title === 'string' ? data.title : null;
  const createdAt = typeof data.createdAt === 'string' ? data.createdAt : null;
  const startDate = typeof data.startDate === 'string' ? data.startDate : null;
  const endDate = typeof data.endDate === 'string' ? data.endDate : null;

  if (!id || !studentId || !title || !createdAt) {
    return null;
  }

  return {
    id,
    studentId,
    title,
    planJson: data.planJson ?? null,
    startDate,
    endDate,
    createdAt,
  } satisfies WorkoutItem;
};

const parseWorkouts = (payload: unknown): WorkoutItem[] => {
  if (!Array.isArray(payload)) {
    return [];
  }

  return payload
    .map((item) => parseWorkout(item as WorkoutPayload))
    .filter((workout): workout is WorkoutItem => Boolean(workout));
};

const formatDate = (value: string | null) => {
  if (!value) {
    return '—';
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString();
};

const formatPlanPreview = (plan: unknown) => {
  if (!plan) {
    return 'Sem plano cadastrado.';
  }

  try {
    return JSON.stringify(plan, null, 2);
  } catch (error) {
    return 'Não foi possível exibir o plano.';
  }
};

type WorkoutUpdateHandler = (id: string, values: UpdateWorkoutFormValues) => Promise<void>;
type WorkoutDeleteHandler = (id: string) => Promise<void>;

interface WorkoutRowProps {
  workout: WorkoutItem;
  onUpdate: WorkoutUpdateHandler;
  onDelete: WorkoutDeleteHandler;
}

const WorkoutRow = ({ workout, onUpdate, onDelete }: WorkoutRowProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const planJsonText = useMemo(
    () => JSON.stringify(workout.planJson ?? {}, null, 2),
    [workout.planJson]
  );
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UpdateWorkoutFormValues>({
    defaultValues: {
      title: workout.title,
      planJsonText,
      startDate: workout.startDate ? workout.startDate.slice(0, 10) : '',
      endDate: workout.endDate ? workout.endDate.slice(0, 10) : '',
    },
  });

  useEffect(() => {
    reset({
      title: workout.title,
      planJsonText,
      startDate: workout.startDate ? workout.startDate.slice(0, 10) : '',
      endDate: workout.endDate ? workout.endDate.slice(0, 10) : '',
    });
  }, [reset, planJsonText, workout.endDate, workout.startDate, workout.title]);

  const onSubmit = handleSubmit(async (values) => {
    setSubmitting(true);
    setError(null);

    try {
      await onUpdate(workout.id, values);
      setIsEditing(false);
    } catch (err) {
      console.error('Falha ao atualizar treino', err);
      setError((err as Error).message || 'Não foi possível salvar as alterações deste treino.');
    } finally {
      setSubmitting(false);
    }
  });

  const handleDelete = async () => {
    if (submitting) {
      return;
    }

    if (!window.confirm('Deseja realmente excluir este treino?')) {
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await onDelete(workout.id);
    } catch (err) {
      console.error('Falha ao excluir treino', err);
      setError('Não foi possível excluir este treino.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card bg="dark" text="light" className="border-0 shadow-sm">
      <Card.Body className="d-flex flex-column gap-3">
        <div className="d-flex flex-wrap justify-content-between align-items-start gap-3">
          <div>
            <h3 className="h5 mb-1">{workout.title}</h3>
            <div className="text-muted small">Criado em {formatDate(workout.createdAt)}</div>
          </div>
          <div className="d-flex align-items-center gap-2">
            {workout.startDate && (
              <Badge bg="info" text="dark">Início: {formatDate(workout.startDate)}</Badge>
            )}
            {workout.endDate && (
              <Badge bg="warning" text="dark">Fim: {formatDate(workout.endDate)}</Badge>
            )}
          </div>
        </div>

        <div className="bg-black bg-opacity-25 rounded-3 p-3">
          <pre className="mb-0 small text-break" style={{ whiteSpace: 'pre-wrap' }}>
            {formatPlanPreview(workout.planJson)}
          </pre>
        </div>

        <div className="d-flex flex-wrap gap-2">
          <Button variant="outline-light" size="sm" onClick={() => setIsEditing((prev) => !prev)}>
            {isEditing ? 'Cancelar edição' : 'Editar treino'}
          </Button>
          <Button variant="outline-danger" size="sm" onClick={handleDelete} disabled={submitting}>
            Excluir
          </Button>
        </div>

        {isEditing && (
          <div className="bg-secondary bg-opacity-25 rounded-3 p-3">
            {error && <Alert variant="danger">{error}</Alert>}
            <Form onSubmit={onSubmit} noValidate className="d-flex flex-column gap-3">
              <Form.Group controlId={`workout-title-${workout.id}`}>
                <Form.Label>Título do treino</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Ex: Treino A - Força"
                  isInvalid={Boolean(errors.title)}
                  {...register('title', { required: 'Informe o título' })}
                />
                <Form.Control.Feedback type="invalid">
                  {errors.title?.message}
                </Form.Control.Feedback>
              </Form.Group>

              <Form.Group controlId={`workout-plan-${workout.id}`}>
                <Form.Label>Plano (JSON)</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={6}
                  placeholder='{"exercises": []}'
                  isInvalid={Boolean(errors.planJsonText)}
                  {...register('planJsonText', {
                    required: 'Informe o plano de treino em formato JSON',
                    validate: (value) => {
                      try {
                        JSON.parse(value);
                        return true;
                      } catch (parseError) {
                        return 'JSON inválido';
                      }
                    },
                  })}
                />
                <Form.Control.Feedback type="invalid">
                  {errors.planJsonText?.message}
                </Form.Control.Feedback>
              </Form.Group>

              <Row className="g-3">
                <Col md={6}>
                  <Form.Group controlId={`workout-start-${workout.id}`}>
                    <Form.Label>Data de início</Form.Label>
                    <Form.Control type="date" {...register('startDate')} />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group controlId={`workout-end-${workout.id}`}>
                    <Form.Label>Data de término</Form.Label>
                    <Form.Control type="date" {...register('endDate')} />
                  </Form.Group>
                </Col>
              </Row>

              <div className="d-flex justify-content-end">
                <Button type="submit" variant="primary" disabled={submitting}>
                  {submitting ? 'Salvando...' : 'Salvar alterações'}
                </Button>
              </div>
            </Form>
          </div>
        )}
      </Card.Body>
    </Card>
  );
};

const WorkoutsTab = ({ studentId }: WorkoutsTabProps) => {
  const [workouts, setWorkouts] = useState<WorkoutItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateWorkoutFormValues>({
    defaultValues: {
      title: '',
      planJsonText: '{"exercises": []}',
      startDate: '',
      endDate: '',
    },
  });

  const fetchWorkouts = useCallback(async () => {
    if (!studentId) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await api.get(`/students/${studentId}/workouts`);
      const payload = response.data?.data ?? response.data ?? [];
      setWorkouts(parseWorkouts(payload));
    } catch (err) {
      console.error('Erro ao carregar treinos', err);
      setError('Não foi possível carregar os treinos deste aluno.');
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  useEffect(() => {
    fetchWorkouts();
  }, [fetchWorkouts]);

  const handleCreate = handleSubmit(async (values) => {
    setMessage(null);

    let plan: unknown;
    try {
      plan = JSON.parse(values.planJsonText);
    } catch (parseError) {
      setError('Plano inválido. Certifique-se de enviar um JSON válido.');
      return;
    }

    const payload: Record<string, unknown> = {
      title: values.title,
      planJson: plan,
    };

    if (values.startDate) {
      payload.startDate = new Date(values.startDate).toISOString();
    }

    if (values.endDate) {
      payload.endDate = new Date(values.endDate).toISOString();
    }

    try {
      const response = await api.post(`/students/${studentId}/workouts`, payload);
      const created = parseWorkout(response.data?.data ?? response.data);

      if (!created) {
        throw new Error('Resposta inválida do servidor');
      }

      setWorkouts((prev) => [created, ...prev]);
      reset({ title: '', planJsonText: '{"exercises": []}', startDate: '', endDate: '' });
      setMessage('Treino criado com sucesso.');
      setError(null);
    } catch (err) {
      console.error('Erro ao criar treino', err);
      setError('Não foi possível criar o treino.');
    }
  });

  const handleUpdate: WorkoutUpdateHandler = async (id, values) => {
    let parsedPlan: unknown | undefined;
    if (values.planJsonText) {
      try {
        parsedPlan = JSON.parse(values.planJsonText);
      } catch (parseError) {
        throw new Error('Plano inválido. Verifique o JSON informado.');
      }
    }

    const payload: Record<string, unknown> = {};

    if (values.title) {
      payload.title = values.title;
    }

    if (parsedPlan !== undefined) {
      payload.planJson = parsedPlan;
    }

    if (values.startDate) {
      payload.startDate = new Date(values.startDate).toISOString();
    }

    if (values.endDate) {
      payload.endDate = new Date(values.endDate).toISOString();
    }

    const response = await api.patch(`/workouts/${id}`, payload);
    const updated = parseWorkout(response.data?.data ?? response.data);

    if (!updated) {
      throw new Error('Resposta inválida do servidor');
    }

    setWorkouts((prev) => prev.map((workout) => (workout.id === updated.id ? updated : workout)));
    setMessage('Treino atualizado com sucesso.');
    setError(null);
  };

  const handleDelete: WorkoutDeleteHandler = async (id) => {
    await api.delete(`/workouts/${id}`);
    setWorkouts((prev) => prev.filter((workout) => workout.id !== id));
    setMessage('Treino removido com sucesso.');
    setError(null);
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center py-5">
        <Spinner animation="border" role="status" />
      </div>
    );
  }

  return (
    <div className="d-flex flex-column gap-4 py-3">
      {error && <Alert variant="danger">{error}</Alert>}
      {message && <Alert variant="success">{message}</Alert>}

      <Card bg="secondary" text="light" className="border-0 shadow-sm">
        <Card.Body>
          <h2 className="h5 mb-3">Novo treino</h2>
          <Form onSubmit={handleCreate} noValidate className="d-flex flex-column gap-3">
            <Form.Group controlId="create-workout-title">
              <Form.Label>Título do treino</Form.Label>
              <Form.Control
                type="text"
                placeholder="Ex: Treino A - Força"
                isInvalid={Boolean(errors.title)}
                {...register('title', { required: 'Informe o título do treino' })}
              />
              <Form.Control.Feedback type="invalid">{errors.title?.message}</Form.Control.Feedback>
            </Form.Group>

            <Form.Group controlId="create-workout-plan">
              <Form.Label>Plano (JSON)</Form.Label>
              <Form.Control
                as="textarea"
                rows={6}
                placeholder='{"exercises": []}'
                isInvalid={Boolean(errors.planJsonText)}
                {...register('planJsonText', {
                  required: 'Informe o plano de treino em formato JSON',
                  validate: (value) => {
                    try {
                      JSON.parse(value);
                      return true;
                    } catch (parseError) {
                      return 'JSON inválido';
                    }
                  },
                })}
              />
              <Form.Control.Feedback type="invalid">
                {errors.planJsonText?.message}
              </Form.Control.Feedback>
            </Form.Group>

            <Row className="g-3">
              <Col md={6}>
                <Form.Group controlId="create-workout-start">
                  <Form.Label>Data de início</Form.Label>
                  <Form.Control type="date" {...register('startDate')} />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group controlId="create-workout-end">
                  <Form.Label>Data de término</Form.Label>
                  <Form.Control type="date" {...register('endDate')} />
                </Form.Group>
              </Col>
            </Row>

            <div className="d-flex justify-content-end">
              <Button type="submit" variant="primary" disabled={isSubmitting}>
                {isSubmitting ? 'Salvando...' : 'Adicionar treino'}
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>

      <div className="d-flex flex-column gap-3">
        {workouts.length === 0 ? (
          <Alert variant="secondary" className="text-center mb-0">
            Nenhum treino cadastrado para este aluno.
          </Alert>
        ) : (
          workouts.map((workout) => (
            <WorkoutRow
              key={workout.id}
              workout={workout}
              onUpdate={handleUpdate}
              onDelete={handleDelete}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default WorkoutsTab;
