import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Badge, Button, Card, Col, Form, Row, Spinner } from 'react-bootstrap';
import { useForm } from 'react-hook-form';
import api from '../../services/api';
import { useAuth } from '../../store/auth';
import { MediaItem, MediaType, parseMediaItem, parseMediaList, resolveMediaUrl } from '../trainer/student-tabs/MediaTab';

const formatDate = (value: string) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString();
};

const isImage = (media: MediaItem) => media.type === 'PHOTO' && /\.(png|jpe?g)$/i.test(media.path);

interface UploadFormValues {
  type: MediaType;
  file: FileList;
}

const MyMedia = () => {
  const {
    state: { user },
  } = useAuth();
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<UploadFormValues>({
    defaultValues: { type: 'PHOTO' },
  });

  const fetchMedia = useCallback(async () => {
    if (!user?.id) {
      setError('Não foi possível identificar o usuário. Faça login novamente.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await api.get(`/students/${user.id}/media`);
      const payload = response.data?.data ?? response.data ?? [];
      setMedia(parseMediaList(payload));
    } catch (err) {
      console.error('Erro ao carregar arquivos do aluno', err);
      setError('Não foi possível carregar seus arquivos no momento.');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchMedia();
  }, [fetchMedia]);

  const onSubmit = handleSubmit(async (values) => {
    if (!user?.id) {
      setError('Sessão expirada. Faça login novamente.');
      return;
    }

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
      const response = await api.post(`/students/${user.id}/media`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const mediaItem = parseMediaItem(response.data?.data ?? response.data);

      if (!mediaItem) {
        throw new Error('Resposta inválida do servidor');
      }

      setMedia((prev) => [mediaItem, ...prev]);
      reset();
      setError(null);
      setMessage('Arquivo enviado com sucesso.');
    } catch (err) {
      console.error('Erro ao enviar arquivo', err);
      setError('Não foi possível enviar o arquivo.');
    }
  });

  const mediaPreview = useMemo(
    () =>
      media.map((item) => ({
        ...item,
        url: resolveMediaUrl(item.path),
      })),
    [media]
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
        <h1 className="h4 mb-1">Minhas fotos e exames</h1>
        <p className="text-muted mb-0">
          Envie e acompanhe seus registros visuais e documentos de saúde compartilhados com o personal trainer.
        </p>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}
      {message && <Alert variant="success">{message}</Alert>}

      <Card bg="secondary" text="light" className="border-0 shadow-sm">
        <Card.Body>
          <Form onSubmit={onSubmit} className="d-flex flex-column gap-3" noValidate>
            <Row className="g-3 align-items-end">
              <Col md={4}>
                <Form.Group controlId="my-media-type">
                  <Form.Label>Tipo de arquivo</Form.Label>
                  <Form.Select {...register('type', { required: true })}>
                    <option value="PHOTO">Foto de progresso</option>
                    <option value="EXAM">Exame / Documento</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={5}>
                <Form.Group controlId="my-media-file">
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
        <Alert variant="secondary">
          Nenhum arquivo enviado ainda. Utilize o formulário acima para compartilhar registros com seu treinador.
        </Alert>
      ) : (
        <Row className="g-3">
          {mediaPreview.map((item) => (
            <Col key={item.id} xs={12} md={6} lg={4}>
              <Card bg="dark" text="light" className="border-0 shadow-sm h-100">
                <Card.Body className="d-flex flex-column gap-3">
                  <div className="d-flex justify-content-between align-items-start gap-2">
                    <div>
                      <h2 className="h6 mb-1">{item.type === 'PHOTO' ? 'Foto de progresso' : 'Exame / Documento'}</h2>
                      <div className="text-muted small">Enviado em {formatDate(item.createdAt)}</div>
                    </div>
                    <Badge bg={item.type === 'PHOTO' ? 'info' : 'warning'} text="dark">
                      {item.type === 'PHOTO' ? 'Foto' : 'Exame'}
                    </Badge>
                  </div>

                  {isImage(item) ? (
                    <div className="bg-black bg-opacity-25 rounded-3 overflow-hidden text-center">
                      <img
                        src={item.url}
                        alt={item.type === 'PHOTO' ? 'Foto de progresso' : 'Documento enviado'}
                        className="img-fluid"
                        style={{ maxHeight: 240, width: '100%', objectFit: 'cover' }}
                      />
                    </div>
                  ) : (
                    <div className="bg-black bg-opacity-25 rounded-3 p-3 text-center">
                      <p className="mb-2">Arquivo disponível para download.</p>
                      <Button variant="outline-light" size="sm" href={item.url} target="_blank" rel="noreferrer">
                        Abrir arquivo
                      </Button>
                    </div>
                  )}

                  <div className="d-flex justify-content-between align-items-center small text-muted">
                    <span>ID {item.id.slice(0, 8)}</span>
                    <a href={item.url} target="_blank" rel="noreferrer" className="link-light">
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

export default MyMedia;
