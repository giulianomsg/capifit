import { useMemo, useState } from 'react';
import { Alert, Button, Card, Col, Form, Row, Spinner } from 'react-bootstrap';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import api from '../services/api';

interface ResetFormValues {
  password: string;
  confirmPassword: string;
}

const ResetPage = () => {
  const [searchParams] = useSearchParams();
  const token = useMemo(() => searchParams.get('token'), [searchParams]);
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ResetFormValues>({
    defaultValues: { password: '', confirmPassword: '' },
  });
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'danger'; message: string } | null>(null);

  const onSubmit = handleSubmit(async (values) => {
    if (!token) {
      setFeedback({ type: 'danger', message: 'Token inválido ou ausente.' });
      return;
    }

    setSubmitting(true);
    setFeedback(null);

    try {
      await api.post('/auth/reset', { token, password: values.password });
      setFeedback({ type: 'success', message: 'Senha redefinida com sucesso. Faça login novamente.' });
      setTimeout(() => navigate('/login', { replace: true }), 1500);
    } catch (error) {
      setFeedback({ type: 'danger', message: 'Não foi possível redefinir a senha. Verifique o token e tente novamente.' });
    } finally {
      setSubmitting(false);
    }
  });

  return (
    <Row className="justify-content-center align-items-center min-vh-100 bg-dark text-light m-0">
      <Col md={4} sm={10} className="py-5">
        <Card bg="secondary" text="light" className="shadow-lg border-0">
          <Card.Body>
            <h1 className="h4 text-center mb-4">Redefinir senha</h1>
            {feedback && <Alert variant={feedback.type}>{feedback.message}</Alert>}
            <Form onSubmit={onSubmit} noValidate>
              <Form.Group controlId="password" className="mb-3">
                <Form.Label>Nova senha</Form.Label>
                <Form.Control
                  type="password"
                  placeholder="Digite a nova senha"
                  isInvalid={Boolean(errors.password)}
                  {...register('password', {
                    required: 'Informe a nova senha',
                    minLength: { value: 6, message: 'A senha deve ter pelo menos 6 caracteres' },
                  })}
                />
                <Form.Control.Feedback type="invalid">{errors.password?.message}</Form.Control.Feedback>
              </Form.Group>

              <Form.Group controlId="confirmPassword" className="mb-3">
                <Form.Label>Confirme a senha</Form.Label>
                <Form.Control
                  type="password"
                  placeholder="Confirme a nova senha"
                  isInvalid={Boolean(errors.confirmPassword)}
                  {...register('confirmPassword', {
                    required: 'Confirme a senha',
                    validate: (value) => value === watch('password') || 'As senhas devem ser iguais',
                  })}
                />
                <Form.Control.Feedback type="invalid">{errors.confirmPassword?.message}</Form.Control.Feedback>
              </Form.Group>

              <div className="d-grid gap-2">
                <Button type="submit" variant="primary" disabled={submitting}>
                  {submitting ? <Spinner as="span" animation="border" size="sm" role="status" /> : 'Redefinir senha'}
                </Button>
                <Button as={Link} to="/login" variant="link" className="text-light">
                  Voltar ao login
                </Button>
              </div>
            </Form>
          </Card.Body>
        </Card>
      </Col>
    </Row>
  );
};

export default ResetPage;
