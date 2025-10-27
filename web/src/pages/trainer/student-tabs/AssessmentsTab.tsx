import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Badge, Button, Card, Col, Form, Row, Spinner } from 'react-bootstrap';
import { useForm } from 'react-hook-form';
import api from '../../../services/api';

export interface AssessmentMetrics {
  weight: number;
  bodyFat: number;
  muscleMass?: number;
  chest?: number;
  waist?: number;
  hips?: number;
  thigh?: number;
  arm?: number;
}

export interface AssessmentItem {
  id: string;
  studentId: string;
  trainerId: string;
  metricsJson: AssessmentMetrics;
  date: string;
  createdAt: string;
}

type AssessmentPayload = Record<string, unknown> | null | undefined;

type MetricsPayload = Record<string, unknown> | null | undefined;

const toNumberOrNull = (value: unknown): number | null => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isNaN(parsed) ? null : parsed;
  }

  return null;
};

const parseMetrics = (payload: MetricsPayload): AssessmentMetrics | null => {
  if (!payload || typeof payload !== 'object') {
    return null;
  }

  const data = payload as Record<string, unknown>;
  const weight = toNumberOrNull(data.weight);
  const bodyFat = toNumberOrNull(data.bodyFat);

  if (weight === null || bodyFat === null) {
    return null;
  }

  const metrics: AssessmentMetrics = {
    weight,
    bodyFat,
  };

  const muscleMass = toNumberOrNull(data.muscleMass);
  const chest = toNumberOrNull(data.chest);
  const waist = toNumberOrNull(data.waist);
  const hips = toNumberOrNull(data.hips);
  const thigh = toNumberOrNull(data.thigh);
  const arm = toNumberOrNull(data.arm);

  if (muscleMass !== null) metrics.muscleMass = muscleMass;
  if (chest !== null) metrics.chest = chest;
  if (waist !== null) metrics.waist = waist;
  if (hips !== null) metrics.hips = hips;
  if (thigh !== null) metrics.thigh = thigh;
  if (arm !== null) metrics.arm = arm;

  return metrics;
};

export const parseAssessment = (payload: AssessmentPayload): AssessmentItem | null => {
  if (!payload || typeof payload !== 'object') {
    return null;
  }

  const data = payload as Record<string, unknown>;
  const id = typeof data.id === 'string' ? data.id : null;
  const studentId = typeof data.studentId === 'string' ? data.studentId : null;
  const trainerId = typeof data.trainerId === 'string' ? data.trainerId : null;
  const date = typeof data.date === 'string' ? data.date : null;
  const createdAt = typeof data.createdAt === 'string' ? data.createdAt : null;
  const metrics = parseMetrics(data.metricsJson as MetricsPayload);

  if (!id || !studentId || !trainerId || !date || !createdAt || !metrics) {
    return null;
  }

  return {
    id,
    studentId,
    trainerId,
    metricsJson: metrics,
    date,
    createdAt,
  } satisfies AssessmentItem;
};

export const parseAssessments = (payload: unknown): AssessmentItem[] => {
  if (!Array.isArray(payload)) {
    return [];
  }

  return payload
    .map((item) => parseAssessment(item as AssessmentPayload))
    .filter((assessment): assessment is AssessmentItem => Boolean(assessment));
};

const formatDate = (value: string) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString();
};

export const assessmentMetricLabels: Record<keyof AssessmentMetrics, string> = {
  weight: 'Peso (kg)',
  bodyFat: '% Gordura',
  muscleMass: 'Massa magra (kg)',
  chest: 'Peitoral (cm)',
  waist: 'Cintura (cm)',
  hips: 'Quadril (cm)',
  thigh: 'Coxa (cm)',
  arm: 'Braço (cm)',
};

export const assessmentMetricOrder: (keyof AssessmentMetrics)[] = [
  'weight',
  'bodyFat',
  'muscleMass',
  'chest',
  'waist',
  'hips',
  'thigh',
  'arm',
];

const formatMetricValue = (value: number | undefined) => {
  if (value === undefined) {
    return '—';
  }

  const rounded = Math.round(value * 100) / 100;
  return Number.isInteger(rounded) ? `${rounded}` : rounded.toFixed(2);
};

interface AssessmentsTabProps {
  studentId: string;
}

interface BaseAssessmentFormValues {
  date: string;
  weight: string;
  bodyFat: string;
  muscleMass?: string;
  chest?: string;
  waist?: string;
  hips?: string;
  thigh?: string;
  arm?: string;
}

interface UpdateAssessmentFormValues extends BaseAssessmentFormValues {}

const buildMetricsPayload = (values: BaseAssessmentFormValues): AssessmentMetrics => {
  const parseRequired = (value: string, field: string) => {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) {
      throw new Error(`Valor inválido para ${field}.`);
    }
    return parsed;
  };

  const parseOptional = (value?: string) => {
    if (!value) {
      return undefined;
    }
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) {
      throw new Error('Preencha valores numéricos válidos.');
    }
    return parsed;
  };

  const metrics: AssessmentMetrics = {
    weight: parseRequired(values.weight, 'peso'),
    bodyFat: parseRequired(values.bodyFat, '% de gordura'),
  };

  const optionalEntries: Array<keyof Omit<AssessmentMetrics, 'weight' | 'bodyFat'>> = [
    'muscleMass',
    'chest',
    'waist',
    'hips',
    'thigh',
    'arm',
  ];

  for (const key of optionalEntries) {
    const next = parseOptional(values[key]);
    if (next !== undefined) {
      metrics[key] = next as never;
    }
  }

  return metrics;
};

type AssessmentUpdateHandler = (id: string, values: UpdateAssessmentFormValues) => Promise<void>;
type AssessmentDeleteHandler = (id: string) => Promise<void>;

interface AssessmentRowProps {
  assessment: AssessmentItem;
  onUpdate: AssessmentUpdateHandler;
  onDelete: AssessmentDeleteHandler;
}

const AssessmentRow = ({ assessment, onUpdate, onDelete }: AssessmentRowProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const defaultValues = useMemo<UpdateAssessmentFormValues>(
    () => ({
      date: assessment.date.slice(0, 10),
      weight: String(assessment.metricsJson.weight ?? ''),
      bodyFat: String(assessment.metricsJson.bodyFat ?? ''),
      muscleMass:
        assessment.metricsJson.muscleMass !== undefined
          ? String(assessment.metricsJson.muscleMass)
          : '',
      chest:
        assessment.metricsJson.chest !== undefined ? String(assessment.metricsJson.chest) : '',
      waist:
        assessment.metricsJson.waist !== undefined ? String(assessment.metricsJson.waist) : '',
      hips:
        assessment.metricsJson.hips !== undefined ? String(assessment.metricsJson.hips) : '',
      thigh:
        assessment.metricsJson.thigh !== undefined ? String(assessment.metricsJson.thigh) : '',
      arm: assessment.metricsJson.arm !== undefined ? String(assessment.metricsJson.arm) : '',
    }),
    [assessment]
  );

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UpdateAssessmentFormValues>({
    defaultValues,
  });

  useEffect(() => {
    reset(defaultValues);
  }, [defaultValues, reset]);

  const onSubmit = handleSubmit(async (values) => {
    setSubmitting(true);
    setError(null);

    try {
      await onUpdate(assessment.id, values);
      setIsEditing(false);
    } catch (err) {
      console.error('Falha ao atualizar avaliação', err);
      setError((err as Error).message || 'Não foi possível atualizar esta avaliação.');
    } finally {
      setSubmitting(false);
    }
  });

  const handleDelete = async () => {
    if (submitting) {
      return;
    }

    if (!window.confirm('Deseja realmente excluir esta avaliação física?')) {
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await onDelete(assessment.id);
    } catch (err) {
      console.error('Falha ao excluir avaliação', err);
      setError('Não foi possível excluir esta avaliação.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card bg="dark" text="light" className="border-0 shadow-sm">
      <Card.Body className="d-flex flex-column gap-3">
        <div className="d-flex flex-wrap justify-content-between align-items-start gap-3">
          <div>
            <h3 className="h5 mb-1">Avaliação de {formatDate(assessment.date)}</h3>
            <div className="text-muted small">
              Registrada em {formatDate(assessment.createdAt)}
            </div>
          </div>
          <Badge bg="info" text="dark">
            #{assessment.id.slice(0, 8)}
          </Badge>
        </div>

        <Row className="g-2">
          {assessmentMetricOrder.map((key) => {
            const value = assessment.metricsJson[key];
            if (value === undefined) {
              return null;
            }

            return (
              <Col key={key} xs={6} md={3}>
                <div className="bg-black bg-opacity-25 rounded-3 p-3 h-100">
                  <div className="text-muted text-uppercase small fw-semibold mb-1">
                    {assessmentMetricLabels[key]}
                  </div>
                  <div className="fs-5">{formatMetricValue(value)}</div>
                </div>
              </Col>
            );
          })}
        </Row>

        <div className="d-flex flex-wrap gap-2">
          <Button variant="outline-light" size="sm" onClick={() => setIsEditing((prev) => !prev)}>
            {isEditing ? 'Cancelar edição' : 'Editar avaliação'}
          </Button>
          <Button variant="outline-danger" size="sm" onClick={handleDelete} disabled={submitting}>
            Excluir
          </Button>
        </div>

        {isEditing && (
          <div className="bg-secondary bg-opacity-25 rounded-3 p-3">
            {error && <Alert variant="danger">{error}</Alert>}
            <Form onSubmit={onSubmit} noValidate className="d-flex flex-column gap-3">
              <Row className="g-3">
                <Col md={4}>
                  <Form.Group controlId={`assessment-date-${assessment.id}`}>
                    <Form.Label>Data da avaliação</Form.Label>
                    <Form.Control
                      type="date"
                      isInvalid={Boolean(errors.date)}
                      {...register('date', { required: 'Informe a data da avaliação' })}
                    />
                    <Form.Control.Feedback type="invalid">
                      {errors.date?.message}
                    </Form.Control.Feedback>
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group controlId={`assessment-weight-${assessment.id}`}>
                    <Form.Label>Peso (kg)</Form.Label>
                    <Form.Control
                      type="number"
                      step="0.01"
                      isInvalid={Boolean(errors.weight)}
                      {...register('weight', { required: 'Informe o peso atual' })}
                    />
                    <Form.Control.Feedback type="invalid">
                      {errors.weight?.message}
                    </Form.Control.Feedback>
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group controlId={`assessment-bodyFat-${assessment.id}`}>
                    <Form.Label>% Gordura corporal</Form.Label>
                    <Form.Control
                      type="number"
                      step="0.01"
                      isInvalid={Boolean(errors.bodyFat)}
                      {...register('bodyFat', { required: 'Informe a gordura corporal' })}
                    />
                    <Form.Control.Feedback type="invalid">
                      {errors.bodyFat?.message}
                    </Form.Control.Feedback>
                  </Form.Group>
                </Col>
              </Row>

              <Row className="g-3">
                <Col md={4}>
                  <Form.Group controlId={`assessment-muscle-${assessment.id}`}>
                    <Form.Label>Massa magra (kg)</Form.Label>
                    <Form.Control type="number" step="0.01" {...register('muscleMass')} />
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group controlId={`assessment-chest-${assessment.id}`}>
                    <Form.Label>Peitoral (cm)</Form.Label>
                    <Form.Control type="number" step="0.1" {...register('chest')} />
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group controlId={`assessment-waist-${assessment.id}`}>
                    <Form.Label>Cintura (cm)</Form.Label>
                    <Form.Control type="number" step="0.1" {...register('waist')} />
                  </Form.Group>
                </Col>
              </Row>

              <Row className="g-3">
                <Col md={4}>
                  <Form.Group controlId={`assessment-hips-${assessment.id}`}>
                    <Form.Label>Quadril (cm)</Form.Label>
                    <Form.Control type="number" step="0.1" {...register('hips')} />
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group controlId={`assessment-thigh-${assessment.id}`}>
                    <Form.Label>Coxa (cm)</Form.Label>
                    <Form.Control type="number" step="0.1" {...register('thigh')} />
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group controlId={`assessment-arm-${assessment.id}`}>
                    <Form.Label>Braço (cm)</Form.Label>
                    <Form.Control type="number" step="0.1" {...register('arm')} />
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

const AssessmentsTab = ({ studentId }: AssessmentsTabProps) => {
  const [assessments, setAssessments] = useState<AssessmentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<BaseAssessmentFormValues>({
    defaultValues: {
      date: new Date().toISOString().slice(0, 10),
      weight: '',
      bodyFat: '',
      muscleMass: '',
      chest: '',
      waist: '',
      hips: '',
      thigh: '',
      arm: '',
    },
  });

  const fetchAssessments = useCallback(async () => {
    if (!studentId) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await api.get(`/students/${studentId}/assessments`);
      const payload = response.data?.data ?? response.data ?? [];
      setAssessments(parseAssessments(payload));
    } catch (err) {
      console.error('Erro ao carregar avaliações físicas', err);
      setError('Não foi possível carregar as avaliações deste aluno.');
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  useEffect(() => {
    fetchAssessments();
  }, [fetchAssessments]);

  const handleCreate = handleSubmit(async (values) => {
    setMessage(null);

    try {
      const metricsJson = buildMetricsPayload(values);
      const payload: Record<string, unknown> = {
        metricsJson,
        date: new Date(values.date).toISOString(),
      };

      const response = await api.post(`/students/${studentId}/assessments`, payload);
      const created = parseAssessment(response.data?.data ?? response.data);

      if (!created) {
        throw new Error('Resposta inválida do servidor.');
      }

      setAssessments((prev) => [created, ...prev]);
      reset({
        date: new Date().toISOString().slice(0, 10),
        weight: '',
        bodyFat: '',
        muscleMass: '',
        chest: '',
        waist: '',
        hips: '',
        thigh: '',
        arm: '',
      });
      setError(null);
      setMessage('Avaliação cadastrada com sucesso.');
    } catch (err) {
      console.error('Erro ao registrar avaliação física', err);
      setError((err as Error).message || 'Não foi possível cadastrar a avaliação.');
    }
  });

  const handleUpdate: AssessmentUpdateHandler = async (id, values) => {
    const metricsJson = buildMetricsPayload(values);
    const payload: Record<string, unknown> = {
      metricsJson,
      date: new Date(values.date).toISOString(),
    };

    const response = await api.patch(`/assessments/${id}`, payload);
    const updated = parseAssessment(response.data?.data ?? response.data);

    if (!updated) {
      throw new Error('Resposta inválida do servidor');
    }

    setAssessments((prev) => prev.map((assessment) => (assessment.id === updated.id ? updated : assessment)));
    setMessage('Avaliação atualizada com sucesso.');
    setError(null);
  };

  const handleDelete: AssessmentDeleteHandler = async (id) => {
    await api.delete(`/assessments/${id}`);
    setAssessments((prev) => prev.filter((assessment) => assessment.id !== id));
    setMessage('Avaliação removida com sucesso.');
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
    <div className="d-flex flex-column gap-4">
      <Card bg="secondary" text="light" className="border-0 shadow-sm">
        <Card.Body>
          <div className="mb-3">
            <h2 className="h5 mb-1">Registrar nova avaliação física</h2>
            <p className="text-muted mb-0">
              Registre os principais indicadores corporais para acompanhar a evolução do aluno.
            </p>
          </div>

          {error && <Alert variant="danger">{error}</Alert>}
          {message && <Alert variant="success">{message}</Alert>}

          <Form onSubmit={handleCreate} noValidate className="d-flex flex-column gap-3">
            <Row className="g-3">
              <Col md={3}>
                <Form.Group controlId="assessment-date">
                  <Form.Label>Data</Form.Label>
                  <Form.Control
                    type="date"
                    isInvalid={Boolean(errors.date)}
                    {...register('date', { required: 'Informe a data da avaliação' })}
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.date?.message}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group controlId="assessment-weight">
                  <Form.Label>Peso (kg)</Form.Label>
                  <Form.Control
                    type="number"
                    step="0.01"
                    isInvalid={Boolean(errors.weight)}
                    {...register('weight', { required: 'Informe o peso atual' })}
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.weight?.message}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group controlId="assessment-bodyFat">
                  <Form.Label>% Gordura</Form.Label>
                  <Form.Control
                    type="number"
                    step="0.01"
                    isInvalid={Boolean(errors.bodyFat)}
                    {...register('bodyFat', { required: 'Informe a gordura corporal' })}
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.bodyFat?.message}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group controlId="assessment-muscleMass">
                  <Form.Label>Massa magra (kg)</Form.Label>
                  <Form.Control type="number" step="0.01" {...register('muscleMass')} />
                </Form.Group>
              </Col>
            </Row>

            <Row className="g-3">
              <Col md={3}>
                <Form.Group controlId="assessment-chest">
                  <Form.Label>Peitoral (cm)</Form.Label>
                  <Form.Control type="number" step="0.1" {...register('chest')} />
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group controlId="assessment-waist">
                  <Form.Label>Cintura (cm)</Form.Label>
                  <Form.Control type="number" step="0.1" {...register('waist')} />
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group controlId="assessment-hips">
                  <Form.Label>Quadril (cm)</Form.Label>
                  <Form.Control type="number" step="0.1" {...register('hips')} />
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group controlId="assessment-thigh">
                  <Form.Label>Coxa (cm)</Form.Label>
                  <Form.Control type="number" step="0.1" {...register('thigh')} />
                </Form.Group>
              </Col>
            </Row>

            <Row className="g-3">
              <Col md={3}>
                <Form.Group controlId="assessment-arm">
                  <Form.Label>Braço (cm)</Form.Label>
                  <Form.Control type="number" step="0.1" {...register('arm')} />
                </Form.Group>
              </Col>
            </Row>

            <div className="d-flex justify-content-end">
              <Button type="submit" variant="primary" disabled={isSubmitting}>
                {isSubmitting ? 'Registrando...' : 'Registrar avaliação'}
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>

      {assessments.length === 0 ? (
        <Alert variant="secondary" className="mb-0">
          Nenhuma avaliação registrada até o momento.
        </Alert>
      ) : (
        <div className="d-flex flex-column gap-3">
          {assessments.map((assessment) => (
            <AssessmentRow
              key={assessment.id}
              assessment={assessment}
              onUpdate={handleUpdate}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default AssessmentsTab;
