import { useCallback, useEffect, useState } from 'react';
import { Alert, Badge, Card, Spinner } from 'react-bootstrap';
import api from '../../services/api';
import { useAuth } from '../../store/auth';
import type { DietItem } from '../trainer/student-tabs/DietsTab';

type DietPayload = Record<string, unknown> | null | undefined;

const parseDiet = (payload: DietPayload): DietItem | null => {
  if (!payload || typeof payload !== 'object') {
    return null;
  }

  const data = payload as Record<string, unknown>;
  const id = typeof data.id === 'string' ? data.id : null;
  const studentId = typeof data.studentId === 'string' ? data.studentId : null;
  const title = typeof data.title === 'string' ? data.title : null;
  const createdAt = typeof data.createdAt === 'string' ? data.createdAt : null;
  const calories = typeof data.calories === 'number' ? data.calories : null;

  if (!id || !studentId || !title || !createdAt) {
    return null;
  }

  return {
    id,
    studentId,
    title,
    planJson: data.planJson ?? null,
    calories,
    macrosJson: data.macrosJson ?? null,
    createdAt,
  } satisfies DietItem;
};

const parseDiets = (payload: unknown): DietItem[] => {
  if (!Array.isArray(payload)) {
    return [];
  }

  return payload
    .map((item) => parseDiet(item as DietPayload))
    .filter((diet): diet is DietItem => Boolean(diet));
};

const formatJson = (value: unknown, emptyMessage: string) => {
  if (!value) {
    return emptyMessage;
  }

  try {
    return JSON.stringify(value, null, 2);
  } catch (error) {
    return 'Não foi possível exibir estas informações.';
  }
};

const MyDiets = () => {
  const {
    state: { user },
  } = useAuth();
  const [diets, setDiets] = useState<DietItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDiets = useCallback(async () => {
    if (!user?.id) {
      setError('Usuário não identificado. Faça login novamente.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await api.get(`/students/${user.id}/diets`);
      const payload = response.data?.data ?? response.data ?? [];
      setDiets(parseDiets(payload));
    } catch (err) {
      console.error('Erro ao carregar dietas do aluno', err);
      setError('Não foi possível carregar suas dietas no momento.');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchDiets();
  }, [fetchDiets]);

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
        <h1 className="h4 mb-1">Minha dieta</h1>
        <p className="text-muted mb-0">Consulte o plano alimentar sugerido e acompanhe seus macros.</p>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      {diets.length === 0 && !error ? (
        <Alert variant="secondary">Sua dieta ainda não foi cadastrada. Fale com seu treinador.</Alert>
      ) : (
        diets.map((diet) => (
          <Card key={diet.id} bg="secondary" text="light" className="border-0 shadow-sm">
            <Card.Body className="d-flex flex-column gap-3">
              <div className="d-flex flex-wrap justify-content-between align-items-start gap-3">
                <div>
                  <h2 className="h5 mb-1">{diet.title}</h2>
                  <div className="text-muted small">
                    Criado em {new Date(diet.createdAt).toLocaleDateString()}
                  </div>
                </div>
                {diet.calories !== null && (
                  <Badge bg="info" text="dark">{diet.calories} kcal</Badge>
                )}
              </div>

              <div className="bg-dark bg-opacity-50 rounded-3 p-3">
                <h3 className="h6">Plano alimentar</h3>
                <pre className="mb-0 small text-break" style={{ whiteSpace: 'pre-wrap' }}>
                  {formatJson(diet.planJson, 'Plano indisponível.')}
                </pre>
              </div>

              <div className="bg-dark bg-opacity-50 rounded-3 p-3">
                <h3 className="h6">Macros</h3>
                <pre className="mb-0 small text-break" style={{ whiteSpace: 'pre-wrap' }}>
                  {formatJson(diet.macrosJson, 'Macros ainda não informados.')}
                </pre>
              </div>
            </Card.Body>
          </Card>
        ))
      )}
    </div>
  );
};

export default MyDiets;
