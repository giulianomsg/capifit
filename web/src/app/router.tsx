import { Suspense, lazy } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import ProtectedRoute from '../components/ProtectedRoute';
import RoleRoute from '../components/RoleRoute';
import Dashboard from '../pages/Dashboard';
import Students from '../pages/Students';
import Workouts from '../pages/Workouts';

const LoginPage = lazy(() => import('../pages/Login'));
const ForgotPage = lazy(() => import('../pages/Forgot'));
const ResetPage = lazy(() => import('../pages/Reset'));

const AppRouter = () => (
  <BrowserRouter>
    <Suspense fallback={<div className="py-5 text-center text-light bg-dark min-vh-100">Carregando...</div>}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot" element={<ForgotPage />} />
        <Route path="/reset" element={<ResetPage />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<Dashboard />} />

          <Route element={<RoleRoute allowedRoles={['ADMIN']} />}>
            <Route path="/admin/*" element={<Dashboard />} />
          </Route>

          <Route element={<RoleRoute allowedRoles={['TRAINER']} />}>
            <Route path="/trainer/students" element={<Students />} />
            <Route path="/trainer/workouts" element={<Workouts />} />
            <Route path="/trainer/diets" element={<Workouts />} />
          </Route>

          <Route element={<RoleRoute allowedRoles={['STUDENT']} />}>
            <Route path="/student/workouts" element={<Workouts />} />
            <Route path="/student/diets" element={<Workouts />} />
          </Route>
        </Route>

        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Suspense>
  </BrowserRouter>
);

export default AppRouter;
