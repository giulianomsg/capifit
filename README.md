# Capifit Platform

Sistema completo para gestão de personal trainers e alunos, com backend Node.js, painel web React e aplicativo Flutter.

## Tutorial de Implantação em Hospedagem (Hostinger)

O passo a passo abaixo descreve como publicar a plataforma completa (API, painel web e app mobile) em um VPS da Hostinger rodando Ubuntu 24.04 LTS e utilizando o domínio oficial `capifit.app.br`. O fluxo pode ser adaptado para outros provedores que permitam acesso root.

### 1. Preparar o servidor

1. Contrate um VPS com Ubuntu 24.04 LTS na Hostinger.
2. No **hPanel**, acesse **Servidores** → **Gerenciar** e anote o IP público.
3. Em **Domínios** → **Gerenciar DNS**, crie entradas **A** apontando `capifit.app.br` e `www.capifit.app.br` para o IP do VPS.
4. Conecte-se via SSH: `ssh root@SEU_IP`. Altere a senha inicial quando solicitado.
5. Atualize o sistema:
   ```bash
   apt update && apt upgrade -y
   ```

### 2. Instalar dependências essenciais

```bash
apt install -y nginx ufw git build-essential curl unzip
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs
npm install --global pm2
snap install --classic certbot
```

No servidor você cuidará apenas do backend (API) e do painel web. Para gerar builds do aplicativo mobile, utilize sua máquina local com Flutter instalado.

### 3. Configurar firewall

```bash
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw enable
```

### 4. Instalar e configurar o MySQL no Ubuntu 24.04

1. Instale o servidor MySQL nativo do Ubuntu 24.04:
   ```bash
   apt install -y mysql-server
   ```
2. Execute o assistente de segurança para definir senha do usuário `root`, remover acessos anônimos e bloquear logins remotos:
   ```bash
   mysql_secure_installation
   ```
3. Acesse o console MySQL e crie o banco, usuário dedicado e permissões (ajuste nomes conforme desejar):
   ```bash
   mysql -u root -p
   ```
   ```sql
   CREATE DATABASE capifit CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   CREATE USER 'capifit'@'localhost' IDENTIFIED BY 'SENHA_FORTE_AQUI';
   GRANT ALL PRIVILEGES ON capifit.* TO 'capifit'@'localhost';
   FLUSH PRIVILEGES;
   ```
4. Carregue a estrutura inicial com o script versionado `docs/capifit_schema.sql` (ele é idempotente e pode ser executado novamente sem apagar dados existentes):
   ```bash
   mysql -u capifit -p capifit < /var/www/capifit/docs/capifit_schema.sql
   ```
5. Para administração visual diretamente no VPS, instale o phpMyAdmin:
   ```bash
   apt install -y phpmyadmin php8.2-fpm
   ```
   - Durante a instalação selecione **nginx** como servidor web (se solicitado) e confirme a criação da base interna.
   - Habilite o pool PHP-FPM no Nginx criando um bloco dedicado, por exemplo:
     ```bash
     cat >/etc/nginx/snippets/phpmyadmin.conf <<'NGINX'
     location /phpmyadmin {
         alias /usr/share/phpmyadmin;
         index index.php index.html;
         location ~ \.php$ {
             include snippets/fastcgi-php.conf;
             fastcgi_pass unix:/run/php/php8.2-fpm.sock;
         }
     }
     NGINX
     ```
   - Em seguida, inclua `include snippets/phpmyadmin.conf;` dentro do bloco `server` do arquivo `/etc/nginx/sites-available/capifit`, teste a configuração (`nginx -t`) e recarregue o serviço (`systemctl reload nginx`).
   - Acesse `https://capifit.app.br/phpmyadmin`, informe as credenciais criadas anteriormente e administre o banco de dados de forma gráfica (criar tabelas, importar/exportar `.sql`, editar registros, etc.).
6. Caso prefira manter o banco de dados gerenciado via hPanel (MySQL gerenciado da Hostinger), basta repetir os passos de criação de banco e usuário no painel e importar o mesmo script `docs/capifit_schema.sql` via phpMyAdmin do provedor.

### 5. Clonar o projeto

```bash
cd /var/www
git clone https://github.com/seu-usuario/capifit.git
cd capifit
```

### 6. Configurar variáveis de ambiente

1. Copie o arquivo de exemplo:
   ```bash
   cp backend/.env.example backend/.env
   ```
2. Edite `backend/.env` preenchendo os dados do banco da Hostinger (host, porta 3306, usuário, senha e nome do banco), chaves JWT, configurações SMTP e integrações de terceiros.

### 7. Instalar dependências e gerar builds

```bash
# Backend
cd /var/www/capifit/backend
npm install
npm run build

# Frontend web
cd /var/www/capifit/web
npm install
npm run build
```

### 8. Executar o backend com PM2

```bash
cd /var/www/capifit/backend
pm2 start dist/index.js --name capifit-api
pm2 save
pm2 startup
```

### 9. Configurar Nginx como proxy reverso

```bash
cat >/etc/nginx/sites-available/capifit <<'EOF'
server {
    listen 80;
    server_name capifit.app.br;

    location /api/ {
        proxy_pass http://127.0.0.1:4000/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    root /var/www/capifit/web/dist;
    try_files $uri $uri/ /index.html;
}
EOF

ln -s /etc/nginx/sites-available/capifit /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx
```

Esse bloco publica o painel web diretamente em `https://capifit.app.br` e encaminha todas as chamadas de API para `https://capifit.app.br/api`.

### 10. Configurar HTTPS

```bash
certbot --nginx -d capifit.app.br -d www.capifit.app.br
```

Garanta que o domínio aponte para o IP do VPS antes de executar o Certbot.

### 11. Automação de deploy (opcional)

Crie uma chave SSH dedicada para o servidor, adicione-a como *Deploy Key* no GitHub e configure um workflow (GitHub Actions, por exemplo) para executar `git pull`, `npm install`, `npm run build` e reiniciar o PM2 após cada push para a branch principal.

### 12. Publicar o aplicativo mobile

1. Gere os binários do Flutter localmente (`flutter build apk` / `flutter build ipa`).
2. Ajuste as URLs da API no código do app antes da compilação, apontando para `https://capifit.app.br/api`.
3. Publique nas lojas seguindo as diretrizes do Google Play e da Apple.

## Estrutura do Monorepo

- `backend/` — API RESTful em Node.js + Express escrita em TypeScript.
- `web/` — Frontend web em React com Vite.
- `mobile/` — Aplicativo Flutter (Android/iOS).
- `docs/` — Documentação funcional, diagramas e guias operacionais.

Consulte `docs/ARCHITECTURE.md` para detalhes de implementação, fluxos e integrações.
