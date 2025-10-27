import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Badge, Card, Col, Row, Spinner } from 'react-bootstrap';
import api from '../../services/api';
import { useAuth } from '../../store/auth';
import {
  AssessmentItem,
  assessmentMetricLabels,
  assessmentMetricOrder,
  parseAssessments,
} from '../trainer/student-tabs/AssessmentsTab';

const formatDate = (value: string) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString();
};

const formatValue = (value: number | undefined) => {
  if (value === undefined) {
    return '—';
  }

  const rounded = Math.round(value * 100) / 100;
  return Number.isInteger(rounded) ? `${rounded}` : rounded.toFixed(2);
};

const MyAssessments = () => {
  const {
    state: { user },
  } = useAuth();
  const [assessments, setAssessments] = useState<AssessmentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAssessments = useCallback(async () => {
    if (!user?.id) {
      setError('Não foi possível identificar o usuário. Faça login novamente.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await api.get(`/students/${user.id}/assessments`);
      const payload = response.data?.data ?? response.data ?? [];
      setAssessments(parseAssessments(payload));
    } catch (err) {
      console.error('Erro ao carregar avaliações do aluno', err);
      setError('Não foi possível carregar suas avaliações físicas no momento.');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchAssessments();
  }, [fetchAssessments]);

  const emptyState = useMemo(
    () => (
      <Alert variant="secondary">
        Nenhuma avaliação física registrada ainda. Converse com seu treinador para agendar uma nova medição.
      </Alert>
    ),
    []
  );

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
        <h1 className="h4 mb-1">Minhas avaliações físicas</h1>
        <p className="text-muted mb-0">
          Acompanhe as medições corporais registradas pelo seu personal trainer e monitore sua evolução ao longo do tempo.
        </p>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      {assessments.length === 0 && !error ? (
        emptyState
      ) : (
        assessments.map((assessment) => (
          <Card key={assessment.id} bg="secondary" text="light" className="border-0 shadow-sm">
            <Card.Body className="d-flex flex-column gap-3">
              <div className="d-flex flex-wrap justify-content-between align-items-start gap-3">
                <div>
                  <h2 className="h5 mb-1">{formatDate(assessment.date)}</h2>
                  <div className="text-muted small">
                    Registrado em {formatDate(assessment.createdAt)}
                  </div>
                </div>
                <Badge bg="info" text="dark">
                  #{assessment.id.slice(0, 8)}
                </Badge>
              </div>

              <Row className="g-3">
                {assessmentMetricOrder.map((key) => {
                  const value = assessment.metricsJson[key];
                  if (value === undefined) {
                    return null;
                  }

                  return (
                    <Col key={key} xs={6} md={3}>
                      <div className="bg-dark bg-opacity-50 rounded-3 p-3 h-100">
                        <div className="text-uppercase text-muted small fw-semibold mb-1">
                          {assessmentMetricLabels[key]}
                        </div>
                        <div className="fs-5">{formatValue(value)}</div>
                      </div>
                    </Col>
                  );
                })}
              </Row>
            </Card.Body>
          </Card>
        ))
      )}
    </div>
  );
};

export default MyAssessments;
