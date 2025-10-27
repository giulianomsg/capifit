import { Container, Nav, Navbar } from 'react-bootstrap';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import Dashboard from './Dashboard';
import Students from './Students';
import Workouts from './Workouts';

function App() {
  return (
    <BrowserRouter>
      <div className="d-flex flex-column min-vh-100 bg-dark text-light">
        <Navbar bg="dark" variant="dark" expand="lg" className="shadow-sm">
          <Container>
            <Navbar.Brand href="/">Capifit</Navbar.Brand>
            <Navbar.Toggle aria-controls="basic-navbar-nav" />
            <Navbar.Collapse id="basic-navbar-nav">
              <Nav className="me-auto">
                <Nav.Link href="/">Dashboard</Nav.Link>
                <Nav.Link href="/students">Alunos</Nav.Link>
                <Nav.Link href="/workouts">Treinos</Nav.Link>
              </Nav>
            </Navbar.Collapse>
          </Container>
        </Navbar>
        <Container fluid className="flex-grow-1 py-4">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/students" element={<Students />} />
            <Route path="/workouts" element={<Workouts />} />
          </Routes>
        </Container>
        <footer className="text-center py-3 bg-black-50">
          <small>© {new Date().getFullYear()} Capifit Platform</small>
        </footer>
      </div>
    </BrowserRouter>
  );
}

export default App;
