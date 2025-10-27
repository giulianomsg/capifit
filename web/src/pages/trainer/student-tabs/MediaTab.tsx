import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Badge, Button, Card, Col, Form, Row, Spinner } from 'react-bootstrap';
import { useForm } from 'react-hook-form';
import api from '../../../services/api';

export type MediaType = 'PHOTO' | 'EXAM';

export interface MediaItem {
  id: string;
  studentId: string;
  type: MediaType;
  path: string;
  createdAt: string;
}

export type MediaPayload = Record<string, unknown> | null | undefined;

const apiBaseURL = api.defaults.baseURL ?? import.meta.env.VITE_API_URL ?? '';

export const resolveMediaUrl = (path: string): string => {
  if (!path) {
    return '#';
  }

  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  const baseWithoutApi = apiBaseURL.replace(/\/?api\/?$/i, '');
  const trimmed = path.replace(/^\/+/, '');
  return `${baseWithoutApi.replace(/\/$/, '')}/${trimmed}`;
};

export const parseMediaItem = (payload: MediaPayload): MediaItem | null => {
  if (!payload || typeof payload !== 'object') {
    return null;
  }

  const data = payload as Record<string, unknown>;
  const id = typeof data.id === 'string' ? data.id : null;
  const studentId = typeof data.studentId === 'string' ? data.studentId : null;
  const type = typeof data.type === 'string' ? data.type : null;
  const path = typeof data.path === 'string' ? data.path : null;
  const createdAt = typeof data.createdAt === 'string' ? data.createdAt : null;

  if (!id || !studentId || !type || !path || !createdAt) {
    return null;
  }

  if (type !== 'PHOTO' && type !== 'EXAM') {
    return null;
  }

  return {
    id,
    studentId,
    type,
    path,
    createdAt,
  } satisfies MediaItem;
};

export const parseMediaList = (payload: unknown): MediaItem[] => {
  if (!Array.isArray(payload)) {
    return [];
  }

  return payload
    .map((item) => parseMediaItem(item as MediaPayload))
    .filter((media): media is MediaItem => Boolean(media));
};

const formatDate = (value: string) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString();
};

interface MediaTabProps {
  studentId: string;
}

interface UploadMediaFormValues {
  type: MediaType;
  file: FileList;
}

const isImage = (media: MediaItem) => media.type === 'PHOTO' && /\.(png|jpe?g)$/i.test(media.path);

const MediaTab = ({ studentId }: MediaTabProps) => {
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<UploadMediaFormValues>({
    defaultValues: { type: 'PHOTO' },
  });

  const fetchMedia = useCallback(async () => {
    if (!studentId) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await api.get(`/students/${studentId}/media`);
      const payload = response.data?.data ?? response.data ?? [];
      setMediaItems(parseMediaList(payload));
    } catch (err) {
      console.error('Erro ao carregar mídias do aluno', err);
      setError('Não foi possível carregar as mídias deste aluno.');
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  useEffect(() => {
    fetchMedia();
  }, [fetchMedia]);

  const onSubmit = handleSubmit(async (values) => {
    setMessage(null);

    const file = values.file?.[0];
    if (!file) {
      setError('Selecione um arquivo para enviar.');
      return;
    }

    const formData = new FormData();
    formData.append('type', values.type);
    formData.append('file', file);

    try {
      const response = await api.post(`/students/${studentId}/media`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const created = parseMediaItem(response.data?.data ?? response.data);

      if (!created) {
        throw new Error('Resposta inválida do servidor');
      }

      setMediaItems((prev) => [created, ...prev]);
      reset({ type: values.type, file: undefined as unknown as FileList });
      setError(null);
      setMessage('Arquivo enviado com sucesso.');
    } catch (err) {
      console.error('Erro ao enviar arquivo', err);
      setError('Não foi possível enviar o arquivo.');
    }
  });

  const mediaPreview = useMemo(
    () =>
      mediaItems.map((media) => ({
        ...media,
        url: resolveMediaUrl(media.path),
      })),
    [mediaItems]
  );

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
            <h2 className="h5 mb-1">Enviar arquivos do aluno</h2>
            <p className="text-muted mb-0">
              Anexe fotos de progresso ou exames laboratoriais para manter o histórico do aluno sempre atualizado.
            </p>
          </div>

          {error && <Alert variant="danger">{error}</Alert>}
          {message && <Alert variant="success">{message}</Alert>}

          <Form onSubmit={onSubmit} className="d-flex flex-column gap-3" noValidate>
            <Row className="g-3 align-items-end">
              <Col md={4}>
                <Form.Group controlId="media-type">
                  <Form.Label>Tipo de arquivo</Form.Label>
                  <Form.Select {...register('type', { required: true })}>
                    <option value="PHOTO">Foto de progresso</option>
                    <option value="EXAM">Exame / Documento</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={5}>
                <Form.Group controlId="media-file">
                  <Form.Label>Arquivo</Form.Label>
                  <Form.Control
                    type="file"
                    accept=".jpg,.jpeg,.png,.pdf"
                    isInvalid={Boolean(errors.file)}
                    {...register('file', { required: 'Selecione um arquivo' })}
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.file?.message ?? 'Selecione um arquivo válido.'}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col md={3}>
                <Button type="submit" variant="primary" disabled={isSubmitting}>
                  {isSubmitting ? 'Enviando...' : 'Enviar arquivo'}
                </Button>
              </Col>
            </Row>
          </Form>
        </Card.Body>
      </Card>

      {mediaPreview.length === 0 ? (
        <Alert variant="secondary" className="mb-0">
          Nenhum arquivo enviado ainda.
        </Alert>
      ) : (
        <Row className="g-3">
          {mediaPreview.map((media) => (
            <Col key={media.id} xs={12} md={6} lg={4}>
              <Card bg="dark" text="light" className="border-0 shadow-sm h-100">
                <Card.Body className="d-flex flex-column gap-3">
                  <div className="d-flex justify-content-between align-items-start gap-2">
                    <div>
                      <h3 className="h6 mb-1">{media.type === 'PHOTO' ? 'Foto de progresso' : 'Exame'}</h3>
                      <div className="text-muted small">Enviado em {formatDate(media.createdAt)}</div>
                    </div>
                    <Badge bg={media.type === 'PHOTO' ? 'info' : 'warning'} text="dark">
                      {media.type === 'PHOTO' ? 'Foto' : 'Exame'}
                    </Badge>
                  </div>

                  {isImage(media) ? (
                    <div className="bg-black bg-opacity-25 rounded-3 overflow-hidden text-center">
                      <img
                        src={media.url}
                        alt={media.type === 'PHOTO' ? 'Foto de progresso' : 'Documento do aluno'}
                        className="img-fluid"
                        style={{ maxHeight: 240, objectFit: 'cover', width: '100%' }}
                      />
                    </div>
                  ) : (
                    <div className="bg-black bg-opacity-25 rounded-3 p-3 text-center">
                      <p className="mb-2">Arquivo disponível para download.</p>
                      <Button variant="outline-light" size="sm" href={media.url} target="_blank" rel="noreferrer">
                        Abrir arquivo
                      </Button>
                    </div>
                  )}

                  <div className="d-flex justify-content-between align-items-center small text-muted">
                    <span>ID {media.id.slice(0, 8)}</span>
                    <a href={media.url} target="_blank" rel="noreferrer" className="link-light">
                      Ver arquivo
                    </a>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      )}
    </div>
  );
};

export default MediaTab;
