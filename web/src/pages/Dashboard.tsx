import { Col, Row } from 'react-bootstrap';
import StatCard from '../components/StatCard';
import TimelineCard from '../components/TimelineCard';

const summary = [
  { title: 'Alunos ativos', value: 42, trend: '+8% vs semana passada', variant: 'primary' },
  { title: 'Treinos entregues', value: 128, trend: '+14 novos hoje', variant: 'success' },
  { title: 'Mensagens', value: 23, trend: '3 não lidas', variant: 'warning' },
  { title: 'Receita mensal', value: 'R$ 12.540', trend: '+18% mês', variant: 'info' }
];

const timeline = [
  { time: '08:00', title: 'Avaliação física — Ana Souza', description: 'Check-in mensal e atualização de medidas.' },
  { time: '11:30', title: 'Treino HIIT — Sala 02', description: 'Grupo intermediário SmartBurn.' },
  { time: '15:00', title: 'Retorno nutricional — João Lima', description: 'Ajuste de macros e ingestão hídrica.' },
  { time: '19:00', title: 'Live com alunos', description: 'Perguntas e respostas sobre recuperação muscular.' }
];

const Dashboard = () => (
  <div className="px-3">
    <h1 className="mb-4">Visão Geral</h1>
    <Row className="g-3">
      {summary.map((item) => (
        <Col key={item.title} xs={12} md={6} xl={3}>
          <StatCard {...item} />
        </Col>
      ))}
    </Row>
    <Row className="g-3 mt-2">
      <Col xs={12} lg={8}>
        <TimelineCard title="Agenda do dia" items={timeline} />
      </Col>
      <Col xs={12} lg={4}>
        <div className="bg-secondary bg-opacity-10 rounded-4 p-3 h-100">
          <h5>Metas da semana</h5>
          <ul className="mt-3 list-unstyled small">
            <li>✅ 90% de treinos concluídos</li>
            <li>✅ 12 avaliações físicas realizadas</li>
            <li>⬜️ 30 feedbacks respondidos (faltam 7)</li>
            <li>⬜️ Receita recorrente +20%</li>
          </ul>
        </div>
      </Col>
    </Row>
  </div>
);

export default Dashboard;
