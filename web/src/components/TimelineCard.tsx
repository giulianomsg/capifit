import { Card, ListGroup } from 'react-bootstrap';

type TimelineItem = {
  time: string;
  title: string;
  description: string;
};

type Props = {
  title: string;
  items: TimelineItem[];
};

const TimelineCard = ({ title, items }: Props) => (
  <Card className="bg-dark border-0 rounded-4 h-100">
    <Card.Body>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          <h5 className="mb-0">{title}</h5>
          <small className="text-secondary">Sincronizado com Google Calendar</small>
        </div>
        <button className="btn btn-outline-info btn-sm">Agendar sessão</button>
      </div>
      <ListGroup variant="flush" className="timeline">
        {items.map((item) => (
          <ListGroup.Item key={item.title} className="bg-transparent border-secondary-subtle text-light">
            <div className="d-flex">
              <div className="me-3 text-info fw-bold">{item.time}</div>
              <div>
                <div className="fw-semibold">{item.title}</div>
                <small className="text-secondary">{item.description}</small>
              </div>
            </div>
          </ListGroup.Item>
        ))}
      </ListGroup>
    </Card.Body>
  </Card>
);

export default TimelineCard;
