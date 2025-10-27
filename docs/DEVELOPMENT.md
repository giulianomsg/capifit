# Guia de Desenvolvimento

## Pré-requisitos

- Node.js 18+
- Yarn ou npm
- Flutter SDK 3.19+
- MySQL 8+

## Backend (API)

```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

Endpoints disponíveis em `http://localhost:4000/api`.

## Web (Painel React)

```bash
cd web
npm install
npm run dev
```

A aplicação será exposta em `http://localhost:5173` com proxy para a API.

## Mobile (Flutter)

```bash
cd mobile
flutter pub get
flutter run
```

### Observações

- As camadas de dados utilizam armazenamento em memória para fins demonstrativos. Substitua por ORM (Prisma/TypeORM) e MySQL.
- Ajuste URLs da API nos clients (web/mobile) quando a infraestrutura estiver configurada.
- Configure push notifications via Firebase ou OneSignal utilizando os IDs definidos no `.env`.
