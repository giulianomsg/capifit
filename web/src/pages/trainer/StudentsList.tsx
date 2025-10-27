import { useCallback, useEffect, useState } from 'react';
import { Alert, Badge, Button, Card, Spinner, Table } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';

export interface StudentSummary {
  id: string;
  userId: string;
  trainerId: string;
  name: string;
  email: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ApiStudentPayload {
  id?: string;
  userId?: string;
  trainerId?: string;
  name?: string;
  email?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

const parseStudents = (payload: unknown): StudentSummary[] => {
  if (!Array.isArray(payload)) {
    return [];
  }

  return payload
    .map((item) => {
      const data = item as ApiStudentPayload;
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
    })
    .filter((student): student is StudentSummary => Boolean(student));
};

const StudentsList = () => {
  const [students, setStudents] = useState<StudentSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.get('/students');
      const payload = response.data?.data ?? response.data ?? [];
      setStudents(parseStudents(payload));
    } catch (err) {
      console.error('Erro ao carregar alunos', err);
      setError('Não foi possível carregar os alunos. Tente novamente mais tarde.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  return (
    <div className="d-flex flex-column gap-4">
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3">
        <div>
          <h1 className="h4 mb-1">Meus alunos</h1>
          <p className="text-muted mb-0">Gerencie matrículas, status e dados pessoais dos seus alunos.</p>
        </div>
        <Button variant="primary" onClick={() => navigate('/trainer/students/new')}>
          Novo aluno
        </Button>
      </div>

      <Card bg="secondary" text="light" className="border-0 shadow-sm">
        <Card.Body>
          {loading ? (
            <div className="d-flex justify-content-center py-5">
              <Spinner animation="border" role="status" />
            </div>
          ) : error ? (
            <Alert variant="danger" className="mb-0">
              {error}
            </Alert>
          ) : students.length === 0 ? (
            <div className="py-5 text-center text-muted">
              Nenhum aluno cadastrado até o momento.
            </div>
          ) : (
            <div className="table-responsive">
              <Table hover responsive variant="dark" className="align-middle mb-0">
                <thead>
                  <tr>
                    <th>Nome</th>
                    <th>E-mail</th>
                    <th>Status</th>
                    <th>Cadastro</th>
                    <th className="text-end">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((student) => (
                    <tr key={student.id}>
                      <td className="fw-semibold">{student.name}</td>
                      <td>{student.email}</td>
                      <td>
                        <Badge bg={student.isActive ? 'success' : 'secondary'}>
                          {student.isActive ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </td>
                      <td>{student.createdAt ? new Date(student.createdAt).toLocaleDateString() : '—'}</td>
                      <td className="text-end">
                        <Button
                          as={Link}
                          to={`/trainer/students/${student.id}`}
                          size="sm"
                          variant="outline-light"
                        >
                          Detalhes
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          )}
        </Card.Body>
      </Card>
    </div>
  );
};

export default StudentsList;
