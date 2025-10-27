import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Badge, Button, Card, Col, Form, Row, Spinner } from 'react-bootstrap';
import { useForm } from 'react-hook-form';
import api from '../../../services/api';

type DietPayload = Record<string, unknown> | null | undefined;

export interface DietItem {
  id: string;
  studentId: string;
  title: string;
  planJson: unknown;
  calories: number | null;
  macrosJson: unknown;
  createdAt: string;
}

interface DietsTabProps {
  studentId: string;
}

interface CreateDietFormValues {
  title: string;
  planJsonText: string;
  calories?: string;
  macrosJsonText?: string;
}

interface UpdateDietFormValues extends CreateDietFormValues {}

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

const formatMacrosPreview = (macros: unknown) => {
  if (!macros) {
    return 'Macros não cadastrados.';
  }

  try {
    return JSON.stringify(macros, null, 2);
  } catch (error) {
    return 'Não foi possível exibir as macros.';
  }
};

type DietUpdateHandler = (id: string, values: UpdateDietFormValues) => Promise<void>;
type DietDeleteHandler = (id: string) => Promise<void>;

interface DietRowProps {
  diet: DietItem;
  onUpdate: DietUpdateHandler;
  onDelete: DietDeleteHandler;
}

const DietRow = ({ diet, onUpdate, onDelete }: DietRowProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const planJsonText = useMemo(
    () => JSON.stringify(diet.planJson ?? {}, null, 2),
    [diet.planJson]
  );
  const macrosJsonText = useMemo(
    () => (diet.macrosJson ? JSON.stringify(diet.macrosJson, null, 2) : ''),
    [diet.macrosJson]
  );
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UpdateDietFormValues>({
    defaultValues: {
      title: diet.title,
      planJsonText,
      calories: diet.calories !== null ? String(diet.calories) : '',
      macrosJsonText,
    },
  });

  useEffect(() => {
    reset({
      title: diet.title,
      planJsonText,
      calories: diet.calories !== null ? String(diet.calories) : '',
      macrosJsonText,
    });
  }, [diet.calories, diet.title, macrosJsonText, planJsonText, reset]);

  const onSubmit = handleSubmit(async (values) => {
    setSubmitting(true);
    setError(null);

    try {
      await onUpdate(diet.id, values);
      setIsEditing(false);
    } catch (err) {
      console.error('Falha ao atualizar dieta', err);
      setError((err as Error).message || 'Não foi possível salvar as alterações.');
    } finally {
      setSubmitting(false);
    }
  });

  const handleDelete = async () => {
    if (submitting) {
      return;
    }

    if (!window.confirm('Deseja realmente excluir esta dieta?')) {
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await onDelete(diet.id);
    } catch (err) {
      console.error('Falha ao excluir dieta', err);
      setError('Não foi possível excluir esta dieta.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card bg="dark" text="light" className="border-0 shadow-sm">
      <Card.Body className="d-flex flex-column gap-3">
        <div className="d-flex flex-wrap justify-content-between align-items-start gap-3">
          <div>
            <h3 className="h5 mb-1">{diet.title}</h3>
            <div className="text-muted small">Criado em {new Date(diet.createdAt).toLocaleDateString()}</div>
          </div>
          {diet.calories !== null && (
            <Badge bg="info" text="dark">{diet.calories} kcal</Badge>
          )}
        </div>

        <div className="bg-black bg-opacity-25 rounded-3 p-3">
          <h4 className="h6">Plano alimentar</h4>
          <pre className="mb-0 small text-break" style={{ whiteSpace: 'pre-wrap' }}>
            {formatPlanPreview(diet.planJson)}
          </pre>
        </div>

        <div className="bg-black bg-opacity-25 rounded-3 p-3">
          <h4 className="h6">Macros</h4>
          <pre className="mb-0 small text-break" style={{ whiteSpace: 'pre-wrap' }}>
            {formatMacrosPreview(diet.macrosJson)}
          </pre>
        </div>

        <div className="d-flex flex-wrap gap-2">
          <Button variant="outline-light" size="sm" onClick={() => setIsEditing((prev) => !prev)}>
            {isEditing ? 'Cancelar edição' : 'Editar dieta'}
          </Button>
          <Button variant="outline-danger" size="sm" onClick={handleDelete} disabled={submitting}>
            Excluir
          </Button>
        </div>

        {isEditing && (
          <div className="bg-secondary bg-opacity-25 rounded-3 p-3">
            {error && <Alert variant="danger">{error}</Alert>}
            <Form onSubmit={onSubmit} noValidate className="d-flex flex-column gap-3">
              <Form.Group controlId={`diet-title-${diet.id}`}>
                <Form.Label>Título da dieta</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Ex: Bulking controlado"
                  isInvalid={Boolean(errors.title)}
                  {...register('title', { required: 'Informe o título da dieta' })}
                />
                <Form.Control.Feedback type="invalid">{errors.title?.message}</Form.Control.Feedback>
              </Form.Group>

              <Form.Group controlId={`diet-plan-${diet.id}`}>
                <Form.Label>Plano (JSON)</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={6}
                  placeholder='{"meals": []}'
                  isInvalid={Boolean(errors.planJsonText)}
                  {...register('planJsonText', {
                    required: 'Informe o plano alimentar em formato JSON',
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
                <Form.Control.Feedback type="invalid">{errors.planJsonText?.message}</Form.Control.Feedback>
              </Form.Group>

              <Row className="g-3">
                <Col md={6}>
                  <Form.Group controlId={`diet-calories-${diet.id}`}>
                    <Form.Label>Calorias totais (kcal)</Form.Label>
                    <Form.Control
                      type="number"
                      min={0}
                      placeholder="Ex: 2200"
                      {...register('calories', {
                        min: { value: 0, message: 'Calorias não podem ser negativas' },
                      })}
                    />
                    <Form.Control.Feedback type="invalid">{errors.calories?.message}</Form.Control.Feedback>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group controlId={`diet-macros-${diet.id}`}>
                    <Form.Label>Macros (JSON)</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={3}
                      placeholder='{"protein": 150, "carbs": 200, "fat": 60}'
                      isInvalid={Boolean(errors.macrosJsonText)}
                      {...register('macrosJsonText', {
                        validate: (value) => {
                          if (!value) {
                            return true;
                          }

                          try {
                            JSON.parse(value);
                            return true;
                          } catch (parseError) {
                            return 'JSON inválido';
                          }
                        },
                      })}
                    />
                    <Form.Control.Feedback type="invalid">{errors.macrosJsonText?.message}</Form.Control.Feedback>
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

const DietsTab = ({ studentId }: DietsTabProps) => {
  const [diets, setDiets] = useState<DietItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateDietFormValues>({
    defaultValues: {
      title: '',
      planJsonText: '{"meals": []}',
      calories: '',
      macrosJsonText: '',
    },
  });

  const fetchDiets = useCallback(async () => {
    if (!studentId) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await api.get(`/students/${studentId}/diets`);
      const payload = response.data?.data ?? response.data ?? [];
      setDiets(parseDiets(payload));
    } catch (err) {
      console.error('Erro ao carregar dietas', err);
      setError('Não foi possível carregar as dietas deste aluno.');
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  useEffect(() => {
    fetchDiets();
  }, [fetchDiets]);

  const handleCreate = handleSubmit(async (values) => {
    setMessage(null);

    let plan: unknown;
    try {
      plan = JSON.parse(values.planJsonText);
    } catch (parseError) {
      setError('Plano inválido. Certifique-se de enviar um JSON válido.');
      return;
    }

    let macros: unknown | undefined;
    if (values.macrosJsonText) {
      try {
        macros = JSON.parse(values.macrosJsonText);
      } catch (parseError) {
        setError('Macros inválidos. Utilize um JSON válido.');
        return;
      }
    }

    let calories: number | undefined;
    if (values.calories) {
      const parsedCalories = Number(values.calories);
      if (Number.isNaN(parsedCalories) || parsedCalories < 0) {
        setError('Informe um valor numérico válido para calorias.');
        return;
      }
      calories = parsedCalories;
    }

    const payload: Record<string, unknown> = {
      title: values.title,
      planJson: plan,
    };

    if (macros !== undefined) {
      payload.macrosJson = macros;
    }

    if (typeof calories === 'number') {
      payload.calories = calories;
    }

    try {
      const response = await api.post(`/students/${studentId}/diets`, payload);
      const created = parseDiet(response.data?.data ?? response.data);

      if (!created) {
        throw new Error('Resposta inválida do servidor');
      }

      setDiets((prev) => [created, ...prev]);
      reset({ title: '', planJsonText: '{"meals": []}', calories: '', macrosJsonText: '' });
      setMessage('Dieta criada com sucesso.');
      setError(null);
    } catch (err) {
      console.error('Erro ao criar dieta', err);
      setError('Não foi possível criar a dieta.');
    }
  });

  const handleUpdate: DietUpdateHandler = async (id, values) => {
    let parsedPlan: unknown | undefined;
    if (values.planJsonText) {
      try {
        parsedPlan = JSON.parse(values.planJsonText);
      } catch (parseError) {
        throw new Error('Plano inválido. Verifique o JSON informado.');
      }
    }

    let parsedMacros: unknown | undefined;
    if (values.macrosJsonText) {
      try {
        parsedMacros = JSON.parse(values.macrosJsonText);
      } catch (parseError) {
        throw new Error('Macros inválidos. Utilize um JSON válido.');
      }
    }

    let parsedCalories: number | undefined;
    if (values.calories) {
      const numberValue = Number(values.calories);
      if (Number.isNaN(numberValue) || numberValue < 0) {
        throw new Error('Informe um valor numérico válido para calorias.');
      }
      parsedCalories = numberValue;
    }

    const payload: Record<string, unknown> = {};

    if (values.title) {
      payload.title = values.title;
    }

    if (parsedPlan !== undefined) {
      payload.planJson = parsedPlan;
    }

    if (parsedMacros !== undefined) {
      payload.macrosJson = parsedMacros;
    }

    if (parsedCalories !== undefined) {
      payload.calories = parsedCalories;
    }

    const response = await api.patch(`/diets/${id}`, payload);
    const updated = parseDiet(response.data?.data ?? response.data);

    if (!updated) {
      throw new Error('Resposta inválida do servidor');
    }

    setDiets((prev) => prev.map((diet) => (diet.id === updated.id ? updated : diet)));
    setMessage('Dieta atualizada com sucesso.');
    setError(null);
  };

  const handleDelete: DietDeleteHandler = async (id) => {
    await api.delete(`/diets/${id}`);
    setDiets((prev) => prev.filter((diet) => diet.id !== id));
    setMessage('Dieta removida com sucesso.');
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
          <h2 className="h5 mb-3">Nova dieta</h2>
          <Form onSubmit={handleCreate} noValidate className="d-flex flex-column gap-3">
            <Form.Group controlId="create-diet-title">
              <Form.Label>Título da dieta</Form.Label>
              <Form.Control
                type="text"
                placeholder="Ex: Bulking controlado"
                isInvalid={Boolean(errors.title)}
                {...register('title', { required: 'Informe o título da dieta' })}
              />
              <Form.Control.Feedback type="invalid">{errors.title?.message}</Form.Control.Feedback>
            </Form.Group>

            <Form.Group controlId="create-diet-plan">
              <Form.Label>Plano (JSON)</Form.Label>
              <Form.Control
                as="textarea"
                rows={6}
                placeholder='{"meals": []}'
                isInvalid={Boolean(errors.planJsonText)}
                {...register('planJsonText', {
                  required: 'Informe o plano alimentar em formato JSON',
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
              <Form.Control.Feedback type="invalid">{errors.planJsonText?.message}</Form.Control.Feedback>
            </Form.Group>

            <Row className="g-3">
              <Col md={4}>
                <Form.Group controlId="create-diet-calories">
                  <Form.Label>Calorias totais (kcal)</Form.Label>
                  <Form.Control
                    type="number"
                    min={0}
                    placeholder="Ex: 2200"
                    {...register('calories', {
                      min: { value: 0, message: 'Calorias não podem ser negativas' },
                    })}
                  />
                  <Form.Control.Feedback type="invalid">{errors.calories?.message}</Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col md={8}>
                <Form.Group controlId="create-diet-macros">
                  <Form.Label>Macros (JSON)</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    placeholder='{"protein": 150, "carbs": 200, "fat": 60}'
                    isInvalid={Boolean(errors.macrosJsonText)}
                    {...register('macrosJsonText', {
                      validate: (value) => {
                        if (!value) {
                          return true;
                        }

                        try {
                          JSON.parse(value);
                          return true;
                        } catch (parseError) {
                          return 'JSON inválido';
                        }
                      },
                    })}
                  />
                  <Form.Control.Feedback type="invalid">{errors.macrosJsonText?.message}</Form.Control.Feedback>
                </Form.Group>
              </Col>
            </Row>

            <div className="d-flex justify-content-end">
              <Button type="submit" variant="primary" disabled={isSubmitting}>
                {isSubmitting ? 'Salvando...' : 'Adicionar dieta'}
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>

      <div className="d-flex flex-column gap-3">
        {diets.length === 0 ? (
          <Alert variant="secondary" className="text-center mb-0">
            Nenhuma dieta cadastrada para este aluno.
          </Alert>
        ) : (
          diets.map((diet) => (
            <DietRow key={diet.id} diet={diet} onUpdate={handleUpdate} onDelete={handleDelete} />
          ))
        )}
      </div>
    </div>
  );
};

export default DietsTab;
