import { Badge, Card, ProgressBar } from 'react-bootstrap';

type Props = {
  title: string;
  student: string;
  schedule: string;
  focus: string[];
  completion: number;
};

const WorkoutCard = ({ title, student, schedule, focus, completion }: Props) => (
  <Card className="bg-dark border border-secondary-subtle rounded-4">
    <Card.Body>
      <div className="d-flex justify-content-between align-items-start">
        <div>
          <h4 className="mb-1">{title}</h4>
          <small className="text-secondary">Aluno: {student}</small>
        </div>
        <button className="btn btn-outline-light btn-sm">Ver detalhes</button>
      </div>
      <p className="mt-3 mb-1 text-secondary">Agenda: {schedule}</p>
      <div className="d-flex gap-2 mb-3">
        {focus.map((tag) => (
          <Badge key={tag} bg="primary" text="light">
            {tag}
          </Badge>
        ))}
      </div>
      <div>
        <div className="d-flex justify-content-between small text-secondary">
          <span>Progresso do aluno</span>
          <span>{completion}%</span>
        </div>
        <ProgressBar now={completion} variant="success" className="rounded-pill" />
      </div>
    </Card.Body>
  </Card>
);

export default WorkoutCard;
