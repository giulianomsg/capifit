import AppRouter from './app/router';
import { AuthProvider } from './store/auth';

const App = () => (
  <AuthProvider>
    <AppRouter />
  </AuthProvider>
);

export default App;
