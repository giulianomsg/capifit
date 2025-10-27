import { useState } from 'react';
import { Alert, Button, Card, Col, Form, Row, Spinner } from 'react-bootstrap';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import api from '../../services/api';

type ForgotFormValues = {
  email: string;
};

const ForgotPasswordPage = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotFormValues>({ defaultValues: { email: '' } });
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'danger'; message: string } | null>(null);

  const onSubmit = handleSubmit(async (values) => {
    setSubmitting(true);
    setFeedback(null);

    try {
      await api.post('/auth/forgot', values);
      setFeedback({ type: 'success', message: 'Enviamos instruções de redefinição para o seu e-mail.' });
    } catch (error) {
      setFeedback({ type: 'danger', message: 'Não foi possível iniciar a recuperação de senha. Tente novamente.' });
    } finally {
      setSubmitting(false);
    }
  });

  return (
    <Row className="justify-content-center align-items-center min-vh-100 bg-dark text-light m-0">
      <Col md={4} sm={10} className="py-5">
        <Card bg="secondary" text="light" className="shadow-lg">
          <Card.Body>
            <h1 className="h4 text-center mb-4">Recuperar senha</h1>
            {feedback && <Alert variant={feedback.type}>{feedback.message}</Alert>}
            <Form onSubmit={onSubmit} noValidate>
              <Form.Group controlId="email" className="mb-3">
                <Form.Label>E-mail</Form.Label>
                <Form.Control
                  type="email"
                  placeholder="nome@empresa.com"
                  isInvalid={Boolean(errors.email)}
                  {...register('email', { required: 'Informe o e-mail', pattern: { value: /.+@.+\..+/, message: 'E-mail inválido' } })}
                />
                <Form.Control.Feedback type="invalid">{errors.email?.message}</Form.Control.Feedback>
              </Form.Group>

              <div className="d-grid gap-2">
                <Button type="submit" variant="primary" disabled={submitting}>
                  {submitting ? <Spinner as="span" animation="border" size="sm" role="status" /> : 'Enviar instruções'}
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

export default ForgotPasswordPage;
