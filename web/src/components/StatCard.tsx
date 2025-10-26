import { Card } from 'react-bootstrap';

type Props = {
  title: string;
  value: string | number;
  trend: string;
  variant: 'primary' | 'success' | 'warning' | 'info';
};

const StatCard = ({ title, value, trend, variant }: Props) => (
  <Card className={`border-0 rounded-4 bg-${variant} bg-opacity-25 text-light h-100`}>
    <Card.Body>
      <small className="text-uppercase fw-semibold text-secondary">{title}</small>
      <h3 className="fw-bold mt-2">{value}</h3>
      <p className="mb-0 text-secondary">{trend}</p>
    </Card.Body>
  </Card>
);

export default StatCard;
