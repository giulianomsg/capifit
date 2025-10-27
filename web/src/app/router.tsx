import { Suspense, lazy } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import ProtectedRoute from '../components/ProtectedRoute';
import RoleRoute from '../components/RoleRoute';
import Dashboard from '../pages/Dashboard';

const LoginPage = lazy(() => import('../pages/Login'));
const ForgotPage = lazy(() => import('../pages/Forgot'));
const ResetPage = lazy(() => import('../pages/Reset'));
const TrainerStudentsListPage = lazy(() => import('../pages/trainer/StudentsList'));
const TrainerStudentFormPage = lazy(() => import('../pages/trainer/StudentForm'));
const TrainerStudentDetailsPage = lazy(() => import('../pages/trainer/StudentDetails'));
const StudentProfilePage = lazy(() => import('../pages/student/MyProfile'));
const StudentWorkoutsPage = lazy(() => import('../pages/student/MyWorkouts'));
const StudentDietsPage = lazy(() => import('../pages/student/MyDiets'));
const StudentAssessmentsPage = lazy(() => import('../pages/student/MyAssessments'));
const StudentMediaPage = lazy(() => import('../pages/student/MyMedia'));
const StudentMessagesPage = lazy(() => import('../pages/student/MyMessages'));

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
            <Route path="/trainer/students" element={<TrainerStudentsListPage />} />
            <Route path="/trainer/students/new" element={<TrainerStudentFormPage />} />
            <Route path="/trainer/students/:studentId" element={<TrainerStudentDetailsPage />} />
          </Route>

          <Route element={<RoleRoute allowedRoles={['STUDENT']} />}>
            <Route path="/student/profile" element={<StudentProfilePage />} />
            <Route path="/student/workouts" element={<StudentWorkoutsPage />} />
            <Route path="/student/diets" element={<StudentDietsPage />} />
            <Route path="/student/assessments" element={<StudentAssessmentsPage />} />
            <Route path="/student/media" element={<StudentMediaPage />} />
            <Route path="/student/messages" element={<StudentMessagesPage />} />
          </Route>
        </Route>

        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Suspense>
  </BrowserRouter>
);

export default AppRouter;
