# Capifit — Arquitetura e Recursos

Este documento descreve a arquitetura recomendada para o ecossistema Capifit (web + mobile) orientado a personal trainers e seus alunos.

## Visão Geral

A solução é composta por três camadas principais:

1. **Backend (API RESTful)** — Node.js + Express, banco MySQL e autenticação JWT.
2. **Frontend Web** — React + Vite + Bootstrap 5. Painel administrativo e painel do personal.
3. **Aplicativo Mobile** — Flutter com sincronização via API, suporte a push notifications e modo offline parcial.

```
[Cliente Web]         [Aplicativo Flutter]
      \                    /
        ------[ API ]------
                   |
               [MySQL]
                   |
             [Armazenamento S3]
```

### Integrações

- **Pagamentos:** Mercado Pago, PagSeguro e Stripe via webhooks.
- **Notificações:** Firebase Cloud Messaging e OneSignal para push web/mobile.
- **Agenda:** Google Calendar (OAuth) e exportação de CSV/Excel.
- **Wearables:** Google Fit e Apple HealthKit via conectores específicos.

## Domínios Principais

| Domínio | Descrição | Entidades chave |
| --- | --- | --- |
| Identidade | Cadastro, login, OAuth | Usuário, sessão, refresh token |
| Treinos | Prescrição de treinos | Plano de treino, exercício, histórico |
| Nutrição | Planos alimentares | Dieta, refeição, alimento |
| Avaliações | Medidas físicas e exames | Avaliação física, exames, progresso |
| Comunicação | Mensagens, notificações | Mensagem, sala, notificação |
| Assinaturas | Cobranças e faturas | Plano, contrato, transação |
| Engajamento | Gamificação e desafios | Desafio, medalha, ranking |

## Modelo de Dados (resumo)

```
User (id, role, name, email, password_hash, avatar_url)
TrainerProfile (id, user_id, specialties, certifications, hourly_rate, bio)
StudentProfile (id, user_id, trainer_id, goals, medical_notes, status)
WorkoutPlan (id, trainer_id, student_id, title, schedule)
WorkoutExercise (id, workout_plan_id, name, muscle_group, sets, reps, rest)
DietPlan (id, trainer_id, student_id, title, total_calories)
DietMeal (id, diet_plan_id, time, title)
DietMealItem (id, diet_meal_id, food, quantity, macros)
PhysicalAssessment (id, student_id, trainer_id, date, metrics, notes)
ProgressPhoto (id, student_id, url, taken_at)
SubscriptionPlan (id, name, billing_cycle, price, commission)
SubscriptionContract (id, plan_id, trainer_id, student_id, renewal_date, status)
PaymentTransaction (id, contract_id, gateway, amount, status, paid_at)
Message (id, room_id, sender_id, content, created_at)
Notification (id, user_id, title, body, read_at)
Challenge (id, title, description, points, start_at, end_at)
ChallengeParticipant (id, challenge_id, student_id, score)
```

## Fluxos Essenciais

### Onboarding de Personal Trainer
1. Personal cria conta ou solicita acesso.
2. Administrador aprova, define plano de comissão e libera painel.
3. Personal configura perfil, especialidades, portfólio e agenda.
4. Personal convida alunos ou recebe solicitações via link público.

### Gestão de Treinos e Dietas
1. Personal seleciona aluno e consulta histórico (treinos, avaliações, feedbacks).
2. Monta plano com biblioteca de exercícios (vídeo + instruções).
3. Define cronograma (diário/semana/muscular) e metas.
4. Aluno recebe notificação push e agenda automática.
5. Aluno marca treinos concluídos, envia feedbacks e fotos de execução.

### Assinaturas e Cobranças
1. Administrador cadastra planos globais (mensal, trimestral, anual).
2. Personal escolhe plano para aluno; sistema gera contrato e cobrança recorrente.
3. Gateway envia webhook de pagamento confirmado → contrato atualizado para "ativo".
4. Ao se aproximar da data de renovação, notificação automática é enviada.
5. Falha de pagamento → bloqueio automático após período de tolerância.

## Segurança

- Criptografia de senhas com bcrypt.
- Tokens JWT com refresh tokens e expiração configurável.
- Rate limiting por IP para endpoints sensíveis.
- Auditoria de ações críticas (criação de planos, alterações financeiras).
- Backups automáticos noturnos com retenção de 30 dias.

## Infraestrutura Recomendada

- **API:** Docker + Kubernetes (GKE/AKS) com autoescalonamento horizontal.
- **Banco:** MySQL gerenciado (Cloud SQL, RDS) com read replica.
- **Arquivos:** S3 ou Cloud Storage para fotos e exames.
- **CI/CD:** GitHub Actions com pipelines separados (backend, web, mobile).
- **Observabilidade:** Prometheus + Grafana, logs centralizados em ELK.

## Roadmap de Implementação

1. **MVP Backend:** Autenticação, CRUD de usuários, treinos, dietas e avaliações.
2. **Painel Web:** Dashboard administrativo, cadastros básicos, gestão de planos.
3. **Aplicativo Flutter:** Dashboard aluno, treinos, dietas, chat básico.
4. **Integrações Financeiras:** Gateways de pagamento, webhooks, relatórios.
5. **Engajamento Avançado:** Gamificação, desafios, ranking, integrações com wearables.
6. **Escalabilidade:** Cache Redis, filas (BullMQ) para envios assíncronos.

## APIs (exemplos)

| Método | Endpoint | Descrição |
| --- | --- | --- |
| POST | `/api/auth/register` | Cadastro com role (admin, trainer, student) |
| POST | `/api/auth/login` | Login com JWT |
| GET | `/api/trainers` | Lista de personais (admin) |
| POST | `/api/workouts` | Criação de plano de treino |
| GET | `/api/diets/student/:id` | Dietas do aluno |
| POST | `/api/communications/messages` | Mensagem no chat |
| GET | `/api/subscriptions/trainer/:id` | Contratos ativos por personal |

## UX & UI

- Design system com cores configuráveis, tipografia legível e ícones Material Design 3.
- Dashboard com cards para Treinos, Dietas, Avaliações, Mensagens e Assinaturas.
- Dark Mode com persistência por usuário.
- Telas mobile inspiradas nas referências: TreinoPesado, SmartFit Coach, MyFitnessPal.

## Estratégia de Testes

- Testes unitários (Jest) nas services do backend.
- Testes de integração com Supertest para endpoints críticos.
- Testes end-to-end web (Playwright) e mobile (Flutter integration tests).
- Monitoramento contínuo com synthetic checks.

## Próximos Passos

- Implementar camada de persistência real (Prisma/TypeORM).
- Adicionar refresh tokens e fluxo de reset de senha via e-mail.
- Criar UI completa no `web/` e telas Flutter no `mobile/` com autenticação real.
- Integrar sockets (Socket.IO) para chat em tempo real.
