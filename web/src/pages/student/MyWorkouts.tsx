import { useCallback, useEffect, useState } from 'react';
import { Alert, Badge, Card, Spinner } from 'react-bootstrap';
import api from '../../services/api';
import { useAuth } from '../../store/auth';
import type { WorkoutItem } from '../trainer/student-tabs/WorkoutsTab';

type WorkoutPayload = Record<string, unknown> | null | undefined;

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
    return null;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toLocaleDateString();
};

const formatPlan = (plan: unknown) => {
  if (!plan) {
    return 'Plano indisponível.';
  }

  try {
    return JSON.stringify(plan, null, 2);
  } catch (error) {
    return 'Não foi possível exibir o plano.';
  }
};

const MyWorkouts = () => {
  const {
    state: { user },
  } = useAuth();
  const [workouts, setWorkouts] = useState<WorkoutItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWorkouts = useCallback(async () => {
    if (!user?.id) {
      setError('Usuário não identificado. Faça login novamente.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await api.get(`/students/${user.id}/workouts`);
      const payload = response.data?.data ?? response.data ?? [];
      setWorkouts(parseWorkouts(payload));
    } catch (err) {
      console.error('Erro ao carregar treinos do aluno', err);
      setError('Não foi possível carregar seus treinos no momento.');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchWorkouts();
  }, [fetchWorkouts]);

  if (loading) {
    return (
      <div className="d-flex justify-content-center py-5">
        <Spinner animation="border" role="status" />
      </div>
    );
  }

  return (
    <div className="d-flex flex-column gap-4" style={{ maxWidth: 960 }}>
      <div>
        <h1 className="h4 mb-1">Meus treinos</h1>
        <p className="text-muted mb-0">
          Acompanhe os treinos planejados pelo seu personal trainer e marque sua evolução.
        </p>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      {workouts.length === 0 && !error ? (
        <Alert variant="secondary">Nenhum treino disponível ainda. Fale com seu treinador!</Alert>
      ) : (
        workouts.map((workout) => {
          const start = formatDate(workout.startDate);
          const end = formatDate(workout.endDate);

          return (
            <Card key={workout.id} bg="secondary" text="light" className="border-0 shadow-sm">
              <Card.Body className="d-flex flex-column gap-3">
                <div className="d-flex flex-wrap justify-content-between align-items-start gap-3">
                  <div>
                    <h2 className="h5 mb-1">{workout.title}</h2>
                    <div className="text-muted small">
                      Criado em {new Date(workout.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="d-flex gap-2 flex-wrap">
                    {start && (
                      <Badge bg="info" text="dark">
                        Início: {start}
                      </Badge>
                    )}
                    {end && (
                      <Badge bg="warning" text="dark">
                        Fim: {end}
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="bg-dark bg-opacity-50 rounded-3 p-3">
                  <pre className="mb-0 small text-break" style={{ whiteSpace: 'pre-wrap' }}>
                    {formatPlan(workout.planJson)}
                  </pre>
                </div>
              </Card.Body>
            </Card>
          );
        })
      )}
    </div>
  );
};

export default MyWorkouts;
