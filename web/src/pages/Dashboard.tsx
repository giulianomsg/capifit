import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Card,
  Col,
  ListGroup,
  Row,
  Spinner,
} from 'react-bootstrap';
import api from '../services/api';
import { useAuth } from '../store/auth';
import StatCard from '../components/StatCard';

type Role = 'ADMIN' | 'TRAINER' | 'STUDENT';

interface UserProfile {
   id?: string;
   name?: string;
   email?: string;
   role?: Role;
   trainer?: { id?: string } | null;
   trainerId?: string | null;
   student?: { id?: string } | null;
   studentId?: string | null;
 }

interface StudentResponse {
   id: string;
   userId: string;
   trainerId: string;
   name: string;
   email: string;
   isActive: boolean;
   trainer?: {
     id: string;
     name: string;
   };
   createdAt?: string;
   updatedAt?: string;
 }

interface WorkoutResponse {
   id: string;
   studentId: string;
   title: string;
   planJson: unknown;
   startDate?: string | null;
   endDate?: string | null;
   createdAt?: string;
 }

interface DietResponse {
   id: string;
   studentId: string;
   title: string;
   planJson: unknown;
   calories?: number | null;
   macrosJson?: unknown;
   createdAt?: string;
 }

interface AssessmentResponse {
   id: string;
   studentId: string;
   trainerId: string;
   metricsJson: Record<string, unknown>;
   date: string;
   createdAt?: string;
 }

interface MediaResponse {
   id: string;
   studentId: string;
   type: 'PHOTO' | 'EXAM';
   path: string;
   createdAt?: string;
 }

interface SubscriptionResponse {
   id: string;
   ownerType: 'TRAINER' | 'STUDENT';
   ownerId: string;
   planType: 'MONTHLY' | 'ANNUAL';
   status: 'TRIAL' | 'ACTIVE' | 'OVERDUE' | 'CANCELED';
   startsAt?: string;
   endsAt?: string;
   createdAt?: string;
   updatedAt?: string;
 }

type SummaryItem = {
   title: string;
   value: number | string;
   trend: string;
   variant: 'primary' | 'success' | 'warning' | 'info';
 };

type SectionItem = {
   id: string;
   title: string;
   subtitle?: string;
   meta?: string;
 };

type DashboardSection = {
   title: string;
   emptyMessage: string;
   items: SectionItem[];
 };

 const safeDate = (value?: string | null): Date | null => {
   if (!value) {
     return null;
   }

       const date = new Date(value);
   return Number.isNaN(date.getTime()) ? null : date;
 };

 const formatDateTime = (value?: string | null): string | null => {
   const date = safeDate(value);
   if (!date) {
     return null;
   }

   return new Intl.DateTimeFormat('pt-BR', {
     dateStyle: 'short',
     timeStyle: 'short',
   }).format(date);
 };

 const formatDate = (value?: string | null): string | null => {
   const date = safeDate(value);
   if (!date) {
     return null;
   }

   return new Intl.DateTimeFormat('pt-BR', {
     dateStyle: 'short',
   }).format(date);
 };

 const unwrap = <T>(response: { data: unknown }): T => {
   const payload = (response as { data: unknown }).data as unknown;

   if (
     payload &&
     typeof payload === 'object' &&
     !Array.isArray(payload) &&
     'data' in payload &&
     (payload as Record<string, unknown>).data !== undefined
   ) {
     return ((payload as Record<string, unknown>).data ?? {}) as T;
   }

   return (payload ?? {}) as T;
 };

 const unwrapArray = <T>(response: { data: unknown }): T[] => {
   const payload = (response as { data: unknown }).data as unknown;

   if (Array.isArray(payload)) {
     return payload as T[];
   }

   if (
     payload &&
     typeof payload === 'object' &&
     'data' in payload &&
     Array.isArray((payload as Record<string, unknown>).data)
   ) {
     return ((payload as Record<string, unknown>).data ?? []) as T[];
   }

   return [];
 };

 const resolveRole = (value: unknown, fallback: Role): Role => {
   if (typeof value === 'string') {
     const normalized = value.toUpperCase();
     if (normalized === 'ADMIN' || normalized === 'TRAINER' || normalized === 'STUDENT') {
       return normalized;
     }
   }

   return fallback;
 };

 const Dashboard = () => {
   const {
     state: { user },
   } = useAuth();
   const [profileName, setProfileName] = useState<string>('');
   const [role, setRole] = useState<Role>('STUDENT');
   const [summary, setSummary] = useState<SummaryItem[]>([]);
   const [sections, setSections] = useState<DashboardSection[]>([]);
   const [loading, setLoading] = useState<boolean>(true);
   const [error, setError] = useState<string | null>(null);

   useEffect(() => {
     if (!user) {
       setSummary([]);
       setSections([]);
       setLoading(false);
       return;
     }

     let cancelled = false;

     const load = async () => {
       setLoading(true);
       setError(null);

       try {
         const meResponse = await api.get('/users/me');
         const profile = unwrap<UserProfile>(meResponse);
         const resolvedRole = resolveRole(profile?.role, user.role);

         const baseName = typeof profile?.name === 'string' && profile.name.trim()
           ? profile.name
           : user.name;

         if (!cancelled) {
           setProfileName(baseName ?? user.name);
           setRole(resolvedRole);
         }

         if (resolvedRole === 'ADMIN') {
           await loadForAdmin(cancelled);
           return;
         }

         if (resolvedRole === 'TRAINER') {
           await loadForTrainer(cancelled);
           return;
         }

         await loadForStudent(profile, cancelled);
       } catch (err) {
         console.error('Falha ao carregar o dashboard', err);
         if (!cancelled) {
           setError('Não foi possível carregar os dados do dashboard. Tente novamente em instantes.');
           setSummary([]);
           setSections([]);
         }
       } finally {
         if (!cancelled) {
           setLoading(false);
         }
       }
     };

     const loadForAdmin = async (isCancelled: boolean) => {
       const [studentsRes, trainerSubsRes, studentSubsRes] = await Promise.all([
         api.get('/students'),
         api.get('/subscriptions', { params: { ownerType: 'TRAINER' } }),
         api.get('/subscriptions', { params: { ownerType: 'STUDENT' } }),
       ]);

       if (isCancelled) {
         return;
       }

       const students = unwrapArray<StudentResponse>(studentsRes);
       const trainerSubs = unwrapArray<SubscriptionResponse>(trainerSubsRes);
       const studentSubs = unwrapArray<SubscriptionResponse>(studentSubsRes);

       const activeTrainerSubs = trainerSubs.filter((sub) => sub.status === 'ACTIVE').length;
       const activeStudentSubs = studentSubs.filter((sub) => sub.status === 'ACTIVE').length;
       const overdueStudentSubs = studentSubs.filter((sub) => sub.status === 'OVERDUE').length;
       const cancelledStudentSubs = studentSubs.filter((sub) => sub.status === 'CANCELED').length;

       const latestStudent = [...students]
         .sort((a, b) => {
           const left = safeDate(a.createdAt) ?? safeDate(a.updatedAt) ?? new Date(0);
           const right = safeDate(b.createdAt) ?? safeDate(b.updatedAt) ?? new Date(0);
           return right.getTime() - left.getTime();
         })[0];

       const adminSummary: SummaryItem[] = [
         {
           title: 'Alunos cadastrados',
           value: students.length,
           trend: latestStudent
             ? `Último cadastro: ${latestStudent.name}`
             : 'Nenhum cadastro registrado',
           variant: 'primary',
         },
         {
           title: 'Assinaturas de Trainers ativas',
           value: activeTrainerSubs,
           trend: `Total de planos: ${trainerSubs.length}`,
           variant: 'success',
         },
         {
           title: 'Assinaturas de Alunos ativas',
           value: activeStudentSubs,
           trend: `Planos de alunos: ${studentSubs.length}`,
           variant: 'info',
         },
         {
           title: 'Alunos com pendências',
           value: overdueStudentSubs,
           trend: `Canceladas: ${cancelledStudentSubs}`,
           variant: 'warning',
         },
       ];

       const studentHighlights: SectionItem[] = students
         .slice()
         .sort((a, b) => {
           const left = safeDate(a.createdAt) ?? new Date(0);
           const right = safeDate(b.createdAt) ?? new Date(0);
           return right.getTime() - left.getTime();
         })
         .slice(0, 6)
         .map((student) => ({
           id: student.id,
           title: student.name,
           subtitle: student.email,
           meta: [
             student.trainer?.name ? `Trainer: ${student.trainer.name}` : null,
             formatDateTime(student.createdAt ?? student.updatedAt ?? undefined),
           ]
             .filter(Boolean)
             .join(' • '),
         }));

       if (!isCancelled) {
         setSummary(adminSummary);
         setSections([
           {
             title: 'Últimos alunos cadastrados',
             emptyMessage: 'Nenhum aluno cadastrado até o momento.',
             items: studentHighlights,
           },
         ]);
       }
     };

    const loadForTrainer = async (isCancelled: boolean) => {
       const studentsRes = await api.get('/students');
       if (isCancelled) {
         return;
       }

       const students = unwrapArray<StudentResponse>(studentsRes);
       const studentMap = new Map(students.map((student) => [student.id, student] as const));

       const [workoutResponses, dietResponses, assessmentResponses] = await Promise.all([
         Promise.all(
           students.map((student) => api.get(`/students/${student.id}/workouts`).catch(() => ({ data: [] })))
         ),
         Promise.all(
           students.map((student) => api.get(`/students/${student.id}/diets`).catch(() => ({ data: [] })))
         ),
         Promise.all(
           students
             .map((student) => api.get(`/students/${student.id}/assessments`).catch(() => ({ data: [] })))
         ),
       ]);

       if (isCancelled) {
         return;
       }

       const workouts = workoutResponses.flatMap((response) => unwrapArray<WorkoutResponse>(response));
       const diets = dietResponses.flatMap((response) => unwrapArray<DietResponse>(response));
       const assessments = assessmentResponses.flatMap((response) => unwrapArray<AssessmentResponse>(response));

       const latestStudent = [...students]
         .sort((a, b) => {
           const left = safeDate(a.createdAt) ?? new Date(0);
           const right = safeDate(b.createdAt) ?? new Date(0);
           return right.getTime() - left.getTime();
         })[0];

       const latestWorkout = [...workouts]
         .sort((a, b) => {
           const left = safeDate(a.startDate ?? a.createdAt) ?? new Date(0);
           const right = safeDate(b.startDate ?? b.createdAt) ?? new Date(0);
           return right.getTime() - left.getTime();
         })[0];

       const latestDiet = [...diets]
         .sort((a, b) => {
           const left = safeDate(a.createdAt) ?? new Date(0);
           const right = safeDate(b.createdAt) ?? new Date(0);
           return right.getTime() - left.getTime();
         })[0];

       const latestAssessment = [...assessments]
         .sort((a, b) => {
           const left = safeDate(a.date) ?? new Date(0);
           const right = safeDate(b.date) ?? new Date(0);
           return right.getTime() - left.getTime();
         })[0];

       const trainerSummary: SummaryItem[] = [
         {
           title: 'Alunos ativos',
           value: students.length,
           trend: latestStudent ? `Último cadastro: ${latestStudent.name}` : 'Cadastre seus primeiros alunos',
           variant: 'primary',
         },
         {
           title: 'Treinos planejados',
           value: workouts.length,
           trend: latestWorkout
             ? `Mais recente: ${latestWorkout.title}`
             : 'Nenhum treino cadastrado',
           variant: 'success',
         },
         {
           title: 'Planos alimentares',
           value: diets.length,
           trend: latestDiet ? `Último plano: ${latestDiet.title}` : 'Cadastre uma nova dieta',
           variant: 'info',
         },
         {
           title: 'Avaliações físicas',
           value: assessments.length,
           trend: latestAssessment
             ? `Última avaliação em ${formatDate(latestAssessment.date)}`
             : 'Nenhuma avaliação registrada',
           variant: 'warning',
         },
       ];

       const workoutHighlights: SectionItem[] = workouts
         .slice()
         .sort((a, b) => {
           const left = safeDate(a.startDate ?? a.createdAt) ?? new Date(0);
           const right = safeDate(b.startDate ?? b.createdAt) ?? new Date(0);
           return right.getTime() - left.getTime();
         })
         .slice(0, 6)
         .map((workout) => {
           const student = studentMap.get(workout.studentId);
           return {
             id: workout.id,
             title: workout.title,
             subtitle: student ? `Aluno: ${student.name}` : undefined,
             meta: [
               workout.startDate ? `Início: ${formatDate(workout.startDate)}` : null,
               workout.endDate ? `Término: ${formatDate(workout.endDate)}` : null,
             ]
               .filter(Boolean)
               .join(' • '),
           };
         });

       const dietHighlights: SectionItem[] = diets
         .slice()
         .sort((a, b) => {
           const left = safeDate(a.createdAt) ?? new Date(0);
           const right = safeDate(b.createdAt) ?? new Date(0);
           return right.getTime() - left.getTime();
         })
         .slice(0, 6)
         .map((diet) => {
           const student = studentMap.get(diet.studentId);
           return {
             id: diet.id,
             title: diet.title,
             subtitle: student ? `Aluno: ${student.name}` : undefined,
             meta: diet.calories != null ? `${diet.calories} kcal` : undefined,
           };
         });

       const assessmentHighlights: SectionItem[] = assessments
         .slice()
         .sort((a, b) => {
           const left = safeDate(a.date) ?? new Date(0);
           const right = safeDate(b.date) ?? new Date(0);
           return right.getTime() - left.getTime();
         })
         .slice(0, 6)
         .map((assessment) => {
           const student = studentMap.get(assessment.studentId);
           const weight =
             typeof assessment.metricsJson?.weight === 'number'
               ? `${assessment.metricsJson.weight.toFixed(1)} kg`
               : undefined;
           const bodyFat =
             typeof assessment.metricsJson?.bodyFat === 'number'
               ? `${assessment.metricsJson.bodyFat.toFixed(1)}% gordura`
               : undefined;

           return {
             id: assessment.id,
             title: student ? `Avaliação de ${student.name}` : 'Avaliação física',
             meta: [weight, bodyFat, formatDate(assessment.date)].filter(Boolean).join(' • '),
           };
         });

       if (!isCancelled) {
         setSummary(trainerSummary);
         setSections([
           {
             title: 'Treinos mais recentes',
             emptyMessage: 'Cadastre o primeiro treino dos seus alunos.',
             items: workoutHighlights,
           },
           {
             title: 'Dietas cadastradas recentemente',
             emptyMessage: 'Nenhum plano alimentar disponível.',
             items: dietHighlights,
           },
           {
             title: 'Avaliações físicas recentes',
             emptyMessage: 'Nenhuma avaliação registrada ainda.',
             items: assessmentHighlights,
           },
         ]);
       }
     };

     const loadForStudent = async (profile: UserProfile, isCancelled: boolean) => {
       const studentId =
         profile?.student?.id ?? profile?.studentId ?? (typeof profile?.id === 'string' ? profile.id : null);

       if (!studentId) {
         throw new Error('Perfil de aluno não localizado.');
       }

       const [workoutsRes, dietsRes, assessmentsRes, mediaRes] = await Promise.all([
         api.get(`/students/${studentId}/workouts`),
         api.get(`/students/${studentId}/diets`),
         api.get(`/students/${studentId}/assessments`),
         api.get(`/students/${studentId}/media`),
       ]);

       if (isCancelled) {
         return;
       }

       const workouts = unwrapArray<WorkoutResponse>(workoutsRes);
       const diets = unwrapArray<DietResponse>(dietsRes);
       const assessments = unwrapArray<AssessmentResponse>(assessmentsRes);
       const media = unwrapArray<MediaResponse>(mediaRes);

       const upcomingWorkout = [...workouts]
         .map((workout) => ({ workout, date: safeDate(workout.startDate ?? workout.createdAt) }))
         .filter((entry): entry is { workout: WorkoutResponse; date: Date } => Boolean(entry.date))
         .sort((a, b) => a.date.getTime() - b.date.getTime())
         .find((entry) => entry.date.getTime() >= Date.now())?.workout;

       const latestDiet = [...diets]
         .sort((a, b) => {
           const left = safeDate(a.createdAt) ?? new Date(0);
           const right = safeDate(b.createdAt) ?? new Date(0);
           return right.getTime() - left.getTime();
         })[0];

       const latestAssessment = [...assessments]
         .sort((a, b) => {
           const left = safeDate(a.date) ?? new Date(0);
           const right = safeDate(b.date) ?? new Date(0);
           return right.getTime() - left.getTime();
         })[0];

       const latestMedia = [...media]
         .sort((a, b) => {
           const left = safeDate(a.createdAt) ?? new Date(0);
           const right = safeDate(b.createdAt) ?? new Date(0);
           return right.getTime() - left.getTime();
         })[0];

       const studentSummary: SummaryItem[] = [
         {
           title: 'Meus treinos',
           value: workouts.length,
           trend: upcomingWorkout
             ? `Próximo: ${formatDate(upcomingWorkout.startDate ?? upcomingWorkout.createdAt)}`
             : 'Nenhum treino agendado',
           variant: 'primary',
         },
         {
           title: 'Planos alimentares',
           value: diets.length,
           trend: latestDiet
             ? `Atualizado em ${formatDate(latestDiet.createdAt)}`
             : 'Nenhum plano disponível',
           variant: 'success',
         },
         {
           title: 'Avaliações físicas',
           value: assessments.length,
           trend: latestAssessment
             ? `Última em ${formatDate(latestAssessment.date)}`
             : 'Ainda sem avaliações',
           variant: 'info',
         },
         {
           title: 'Arquivos enviados',
           value: media.length,
           trend: latestMedia
             ? `Último envio em ${formatDateTime(latestMedia.createdAt)}`
             : 'Nenhum arquivo anexado',
           variant: 'warning',
         },
       ];

       const workoutHighlights: SectionItem[] = workouts
         .slice()
         .sort((a, b) => {
           const left = safeDate(a.startDate ?? a.createdAt) ?? new Date(0);
           const right = safeDate(b.startDate ?? b.createdAt) ?? new Date(0);
           return right.getTime() - left.getTime();
         })
         .slice(0, 6)
         .map((workout) => ({
           id: workout.id,
           title: workout.title,
           subtitle: workout.startDate
             ? `Início: ${formatDate(workout.startDate)}`
             : undefined,
           meta: workout.endDate ? `Termina em ${formatDate(workout.endDate)}` : undefined,
         }));

       const dietHighlights: SectionItem[] = diets
         .slice()
         .sort((a, b) => {
           const left = safeDate(a.createdAt) ?? new Date(0);
           const right = safeDate(b.createdAt) ?? new Date(0);
           return right.getTime() - left.getTime();
         })
         .slice(0, 6)
         .map((diet) => ({
           id: diet.id,
           title: diet.title,
           subtitle: diet.calories != null ? `${diet.calories} kcal` : undefined,
           meta: formatDateTime(diet.createdAt ?? undefined) ?? undefined,
         }));

       const assessmentHighlights: SectionItem[] = assessments
         .slice()
         .sort((a, b) => {
           const left = safeDate(a.date) ?? new Date(0);
           const right = safeDate(b.date) ?? new Date(0);
           return right.getTime() - left.getTime();
         })
         .slice(0, 6)
         .map((assessment) => {
           const weight =
             typeof assessment.metricsJson?.weight === 'number'
               ? `${assessment.metricsJson.weight.toFixed(1)} kg`
               : undefined;
           const bodyFat =
             typeof assessment.metricsJson?.bodyFat === 'number'
               ? `${assessment.metricsJson.bodyFat.toFixed(1)}% gordura`
               : undefined;
           return {
             id: assessment.id,
             title: `Avaliação ${formatDate(assessment.date) ?? ''}`.trim(),
             meta: [weight, bodyFat].filter(Boolean).join(' • ') || undefined,
           };
         });

       const mediaHighlights: SectionItem[] = media
         .slice()
         .sort((a, b) => {
           const left = safeDate(a.createdAt) ?? new Date(0);
           const right = safeDate(b.createdAt) ?? new Date(0);
           return right.getTime() - left.getTime();
         })
         .slice(0, 6)
         .map((item) => ({
           id: item.id,
           title: item.type === 'PHOTO' ? 'Foto de progresso' : 'Exame enviado',
           meta: formatDateTime(item.createdAt ?? undefined) ?? undefined,
         }));

       if (!isCancelled) {
         setSummary(studentSummary);
         setSections([
           {
             title: 'Últimos treinos recebidos',
             emptyMessage: 'Nenhum treino disponível no momento.',
             items: workoutHighlights,
           },
           {
             title: 'Dietas e avaliações recentes',
             emptyMessage: 'Aguarde atualizações do seu treinador.',
             items: [...dietHighlights, ...assessmentHighlights].slice(0, 6),
           },
           {
             title: 'Uploads enviados',
             emptyMessage: 'Envie fotos de progresso ou exames para o seu treinador.',
             items: mediaHighlights,
           },
         ]);
       }
     };

     load();

     return () => {
       cancelled = true;
     };
   }, [user?.id, user?.role]);

   const greeting = useMemo(() => {
     if (!profileName) {
       return 'Visão Geral';
     }

     const salutation = role === 'ADMIN' ? 'Painel administrativo' : 'Bem-vindo(a)';
     return `${salutation}, ${profileName.split(' ')[0] ?? profileName}`;
   }, [profileName, role]);

   return (
     <div className="px-2 px-md-3">
       <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4">
         <div>
           <h1 className="h3 mb-1 text-light">{greeting}</h1>
           <p className="text-secondary mb-0">
             Monitoramento em tempo real das atividades do {role === 'ADMIN' ? 'ecossistema Capifit' : 'seu acompanhamento'}.
           </p>
         </div>
       </div>

       {error && (
         <Alert variant="danger" className="bg-danger bg-opacity-25 border-0 text-light">
           {error}
         </Alert>
       )}

       {loading ? (
         <div className="d-flex justify-content-center align-items-center py-5">
           <Spinner animation="border" role="status" />
         </div>
       ) : (
         <>
           <Row className="g-3">
             {summary.map((item) => (
               <Col key={item.title} xs={12} md={6} xl={3}>
                 <StatCard {...item} />
               </Col>
             ))}
           </Row>

           <Row className="g-3 mt-1">
             {sections.map((section) => (
               <Col key={section.title} xs={12} md={6} xl={4}>
                 <Card bg="secondary" text="light" className="border-0 shadow-sm h-100">
                   <Card.Header className="bg-transparent border-0 pb-0">
                     <h5 className="mb-0">{section.title}</h5>
                   </Card.Header>
                   <ListGroup variant="flush" className="bg-transparent">
                     {section.items.length === 0 ? (
                       <ListGroup.Item className="bg-transparent text-secondary border-secondary">
                         {section.emptyMessage}
                       </ListGroup.Item>
                     ) : (
                       section.items.map((item) => (
                         <ListGroup.Item
                           key={item.id}
                           className="bg-transparent text-light border-secondary"
                         >
                           <div className="fw-semibold">{item.title}</div>
                           {item.subtitle && (
                             <div className="small text-secondary">{item.subtitle}</div>
                           )}
                           {item.meta && (
                             <div className="small text-secondary mt-1">{item.meta}</div>
                           )}
                         </ListGroup.Item>
                       ))
                     )}
                   </ListGroup>
                 </Card>
               </Col>
             ))}
           </Row>
         </>
       )}
     </div>
   );
 };

 export default Dashboard;
