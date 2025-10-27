import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Badge, Button, Card, Form, Spinner } from 'react-bootstrap';
import { useForm } from 'react-hook-form';
import api from '../../../services/api';

export interface MessageItem {
  id: string;
  studentId: string;
  trainerId: string;
  fromRole: 'TRAINER' | 'STUDENT';
  content: string;
  createdAt: string;
}

type MessagePayload = Record<string, unknown> | null | undefined;

type ConversationPayload = unknown;

const parseMessage = (payload: MessagePayload): MessageItem | null => {
  if (!payload || typeof payload !== 'object') {
    return null;
  }

  const data = payload as Record<string, unknown>;
  const id = typeof data.id === 'string' ? data.id : null;
  const studentId = typeof data.studentId === 'string' ? data.studentId : null;
  const trainerId = typeof data.trainerId === 'string' ? data.trainerId : null;
  const fromRole = typeof data.fromRole === 'string' ? data.fromRole : null;
  const content = typeof data.content === 'string' ? data.content : null;
  const createdAt = typeof data.createdAt === 'string' ? data.createdAt : null;

  if (!id || !studentId || !trainerId || !fromRole || !content || !createdAt) {
    return null;
  }

  if (fromRole !== 'TRAINER' && fromRole !== 'STUDENT') {
    return null;
  }

  return {
    id,
    studentId,
    trainerId,
    fromRole,
    content,
    createdAt,
  } satisfies MessageItem;
};

const parseConversation = (payload: ConversationPayload): MessageItem[] => {
  if (!Array.isArray(payload)) {
    return [];
  }

  return payload
    .map((item) => parseMessage(item as MessagePayload))
    .filter((message): message is MessageItem => Boolean(message));
};

const sortMessagesAsc = (messages: MessageItem[]): MessageItem[] =>
  [...messages].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );

const formatTimestamp = (value: string) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString();
};

interface MessagesTabProps {
  studentId: string;
}

interface SendMessageFormValues {
  content: string;
}

const MessagesTab = ({ studentId }: MessagesTabProps) => {
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<SendMessageFormValues>({
    defaultValues: { content: '' },
  });

  const fetchConversation = useCallback(async () => {
    if (!studentId) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await api.get(`/conversations/${studentId}`);
      const payload = response.data?.data ?? response.data ?? [];
      setMessages(sortMessagesAsc(parseConversation(payload)));
    } catch (err) {
      console.error('Erro ao carregar mensagens', err);
      setError('Não foi possível carregar as mensagens deste aluno.');
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  useEffect(() => {
    fetchConversation();
  }, [fetchConversation]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollTop = messagesEndRef.current.scrollHeight;
    }
  }, [messages]);

  const onSubmit = handleSubmit(async (values) => {
    setInfo(null);

    try {
      const response = await api.post(`/conversations/${studentId}/messages`, {
        content: values.content,
      });
      const created = parseMessage(response.data?.data ?? response.data);

      if (!created) {
        throw new Error('Resposta inválida do servidor');
      }

      setMessages((prev) => sortMessagesAsc([...prev, created]));
      reset({ content: '' });
      setError(null);
      setInfo('Mensagem enviada com sucesso.');
    } catch (err) {
      console.error('Erro ao enviar mensagem', err);
      setError('Não foi possível enviar a mensagem.');
    }
  });

  const conversation = useMemo(() => sortMessagesAsc(messages), [messages]);

  if (loading) {
    return (
      <div className="d-flex justify-content-center py-5">
        <Spinner animation="border" role="status" />
      </div>
    );
  }

  return (
    <div className="d-flex flex-column gap-4" style={{ height: '100%' }}>
      <Card bg="secondary" text="light" className="border-0 shadow-sm flex-grow-1">
        <Card.Body className="d-flex flex-column gap-3" style={{ minHeight: 320 }}>
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h2 className="h5 mb-1">Conversas com o aluno</h2>
              <p className="text-muted mb-0">Troque mensagens rápidas para ajustar treinos e rotinas.</p>
            </div>
            <Button variant="outline-light" size="sm" onClick={fetchConversation}>
              Atualizar
            </Button>
          </div>

          {error && <Alert variant="danger" className="mb-0">{error}</Alert>}
          {info && <Alert variant="success" className="mb-0">{info}</Alert>}

          <div
            ref={messagesEndRef}
            className="flex-grow-1 overflow-auto rounded-3 bg-dark bg-opacity-50 p-3"
            style={{ maxHeight: 360 }}
          >
            {conversation.length === 0 ? (
              <div className="text-center text-muted py-5">Nenhuma mensagem registrada ainda.</div>
            ) : (
              conversation.map((message) => {
                const isTrainer = message.fromRole === 'TRAINER';
                return (
                  <div
                    key={message.id}
                    className={`d-flex mb-3 ${isTrainer ? 'justify-content-end' : 'justify-content-start'}`}
                  >
                    <div
                      className={`px-3 py-2 rounded-3 shadow-sm ${
                        isTrainer ? 'bg-primary text-light' : 'bg-light text-dark'
                      }`}
                      style={{ maxWidth: '75%' }}
                    >
                      <div className="small fw-semibold mb-1 d-flex align-items-center gap-2">
                        {isTrainer ? 'Você' : 'Aluno'}
                        <Badge bg={isTrainer ? 'light' : 'dark'} text={isTrainer ? 'dark' : 'light'}>
                          {formatTimestamp(message.createdAt)}
                        </Badge>
                      </div>
                      <div className="small" style={{ whiteSpace: 'pre-wrap' }}>
                        {message.content}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <Form onSubmit={onSubmit} noValidate className="d-flex gap-2">
            <Form.Group className="flex-grow-1 mb-0">
              <Form.Control
                as="textarea"
                rows={2}
                placeholder="Digite uma mensagem"
                isInvalid={Boolean(errors.content)}
                {...register('content', { required: 'Informe uma mensagem' })}
              />
              <Form.Control.Feedback type="invalid">
                {errors.content?.message}
              </Form.Control.Feedback>
            </Form.Group>
            <div className="d-flex flex-column">
              <Button type="submit" variant="primary" disabled={isSubmitting} className="mb-1">
                {isSubmitting ? 'Enviando...' : 'Enviar'}
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </div>
  );
};

export default MessagesTab;
