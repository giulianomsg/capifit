import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Badge, Button, Card, Col, Row, Spinner, Tab, Tabs } from 'react-bootstrap';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../services/api';
import type { StudentSummary } from './StudentsList';
import { StudentForm } from './StudentForm';
import WorkoutsTab from './student-tabs/WorkoutsTab';
import DietsTab from './student-tabs/DietsTab';

interface ApiStudentResponse {
  data?: StudentSummary;
}

const resolveStudent = (payload: unknown): StudentSummary | null => {
  if (!payload || typeof payload !== 'object') {
    return null;
  }

  const data = payload as Partial<StudentSummary>;

  if (!data.id || !data.name || !data.email) {
    return null;
  }

  return {
    id: data.id,
    userId: data.userId ?? '',
    trainerId: data.trainerId ?? '',
    name: data.name,
    email: data.email,
    isActive: Boolean(data.isActive),
    createdAt: data.createdAt ?? '',
    updatedAt: data.updatedAt ?? '',
  } satisfies StudentSummary;
};

const StudentDetails = () => {
  const { studentId } = useParams<{ studentId: string }>();
  const navigate = useNavigate();
  const [student, setStudent] = useState<StudentSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStudent = useCallback(async () => {
    if (!studentId) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await api.get(`/students/${studentId}`);
      const payload = (response.data as ApiStudentResponse)?.data ?? response.data;
      const parsed = resolveStudent(payload);

      if (!parsed) {
        throw new Error('Aluno não encontrado');
      }

      setStudent(parsed);
    } catch (err) {
      console.error('Erro ao carregar aluno', err);
      setError('Não foi possível carregar os dados do aluno.');
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  useEffect(() => {
    fetchStudent();
  }, [fetchStudent]);

  const statusBadge = useMemo(() => {
    if (!student) {
      return null;
    }

    return (
      <Badge bg={student.isActive ? 'success' : 'secondary'} className="ms-2">
        {student.isActive ? 'Ativo' : 'Inativo'}
      </Badge>
    );
  }, [student]);

  if (loading) {
    return (
      <div className="d-flex justify-content-center py-5">
        <Spinner animation="border" role="status" />
      </div>
    );
  }

  if (error) {
    return (
      <Card bg="secondary" text="light" className="border-0 shadow-sm">
        <Card.Body>
          <Alert variant="danger" className="mb-0">
            {error}
          </Alert>
          <div className="d-flex justify-content-end mt-3">
            <Button variant="outline-light" onClick={fetchStudent}>
              Tentar novamente
            </Button>
          </div>
        </Card.Body>
      </Card>
    );
  }

  if (!student) {
    return (
      <Alert variant="warning">Aluno não encontrado.</Alert>
    );
  }

  return (
    <div className="d-flex flex-column gap-4">
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3">
        <div>
          <h1 className="h4 mb-1 d-flex align-items-center gap-2">
            {student.name}
            {statusBadge}
          </h1>
          <p className="text-muted mb-0">{student.email}</p>
        </div>
        <Button variant="outline-light" onClick={() => navigate('/trainer/students')}>
          Voltar para lista
        </Button>
      </div>

      <Row className="g-3">
        <Col xs={12} lg={8}>
          <Tabs defaultActiveKey="profile" className="bg-dark text-light rounded-3 p-3">
            <Tab eventKey="profile" title="Dados do aluno">
              <div className="mt-3">
                <StudentForm
                  mode="edit"
                  studentId={student.id}
                  initialData={student}
                  onSuccess={(updated) => setStudent(updated)}
                />
              </div>
            </Tab>
            <Tab eventKey="workouts" title="Treinos">
              <WorkoutsTab studentId={student.id} />
            </Tab>
            <Tab eventKey="diets" title="Dietas">
              <DietsTab studentId={student.id} />
            </Tab>
            <Tab eventKey="assessments" title="Avaliações">
              <div className="py-4 text-center text-muted">Área de avaliações será preenchida em breve.</div>
            </Tab>
            <Tab eventKey="media" title="Fotos & Exames">
              <div className="py-4 text-center text-muted">Área de mídia será preenchida em breve.</div>
            </Tab>
            <Tab eventKey="messages" title="Mensagens">
              <div className="py-4 text-center text-muted">Histórico de mensagens será preenchido em breve.</div>
            </Tab>
          </Tabs>
        </Col>
        <Col xs={12} lg={4}>
          <Card bg="secondary" text="light" className="border-0 shadow-sm">
            <Card.Body className="d-flex flex-column gap-2">
              <div>
                <h2 className="h6 text-uppercase text-muted mb-1">Status</h2>
                <div>{student.isActive ? 'Aluno ativo' : 'Aluno inativo'}</div>
              </div>
              <div>
                <h2 className="h6 text-uppercase text-muted mb-1">Cadastrado em</h2>
                <div>{student.createdAt ? new Date(student.createdAt).toLocaleString() : '—'}</div>
              </div>
              <div>
                <h2 className="h6 text-uppercase text-muted mb-1">Última atualização</h2>
                <div>{student.updatedAt ? new Date(student.updatedAt).toLocaleString() : '—'}</div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default StudentDetails;
