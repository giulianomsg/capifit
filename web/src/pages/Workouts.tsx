import { Badge, Card, Col, Row } from 'react-bootstrap';
import WorkoutCard from '../components/WorkoutCard';

const workouts = [
  {
    title: 'Full Body Power',
    student: 'Ana Souza',
    schedule: 'Segunda, Quarta, Sexta',
    focus: ['Força', 'Mobilidade'],
    completion: 82
  },
  {
    title: 'Smart Burn HIIT',
    student: 'João Lima',
    schedule: 'Terça, Quinta',
    focus: ['Resistência', 'Cardio'],
    completion: 64
  }
];

const library = ['Supino reto', 'Agachamento livre', 'Remada curvada', 'Prancha abdominal', 'Burpee explosivo'];

const Workouts = () => (
  <div className="px-3">
    <Row className="g-3">
      <Col xs={12} lg={8}>
        <Row className="g-3">
          {workouts.map((workout) => (
            <Col key={workout.title} xs={12}>
              <WorkoutCard {...workout} />
            </Col>
          ))}
        </Row>
      </Col>
      <Col xs={12} lg={4}>
        <Card className="bg-secondary bg-opacity-10 border-0 rounded-4">
          <Card.Body>
            <h5 className="mb-3">Biblioteca de exercícios</h5>
            <p className="text-secondary">Integração com vídeos demonstrativos e ficha técnica TACO.</p>
            <div className="d-flex flex-wrap gap-2">
              {library.map((item) => (
                <Badge key={item} bg="info" text="dark">
                  {item}
                </Badge>
              ))}
            </div>
          </Card.Body>
        </Card>
      </Col>
    </Row>
  </div>
);

export default Workouts;
