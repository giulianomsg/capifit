import { Card, Col, Row, Table } from 'react-bootstrap';

const students = [
  { name: 'Ana Souza', status: 'Ativa', nextSession: '24/10 - 08:00', goal: 'Hipertrofia', progress: '78%' },
  { name: 'João Lima', status: 'Renova em 3 dias', nextSession: '25/10 - 17:30', goal: 'Perda de peso', progress: '62%' },
  { name: 'Maria Fernanda', status: 'Avaliação pendente', nextSession: '27/10 - 07:15', goal: 'Performance', progress: '45%' }
];

const Students = () => (
  <div className="px-3">
    <Row className="g-3 mb-3">
      <Col xs={12} lg={4}>
        <Card className="bg-secondary bg-opacity-10 border-0 rounded-4">
          <Card.Body>
            <h5>Alertas inteligentes</h5>
            <ul className="small mt-3 mb-0">
              <li>Renovação de assinatura — João Lima (3 dias)</li>
              <li>Feedback não respondido — Maria Fernanda</li>
              <li>Exame de sangue enviado — Ana Souza</li>
            </ul>
          </Card.Body>
        </Card>
      </Col>
      <Col xs={12} lg={8}>
        <Card className="bg-dark border-0 rounded-4">
          <Card.Body>
            <h5 className="mb-3">Alunos ativos</h5>
            <Table hover responsive variant="dark" className="align-middle">
              <thead>
                <tr>
                  <th>Aluno</th>
                  <th>Status</th>
                  <th>Próxima sessão</th>
                  <th>Objetivo</th>
                  <th>Progresso</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student) => (
                  <tr key={student.name}>
                    <td>{student.name}</td>
                    <td>{student.status}</td>
                    <td>{student.nextSession}</td>
                    <td>{student.goal}</td>
                    <td>{student.progress}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Card.Body>
        </Card>
      </Col>
    </Row>
  </div>
);

export default Students;
