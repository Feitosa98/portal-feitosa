# Portal de Clientes e Administradores - Guia de Instalação

Este é um sistema completo de portal multiplataforma (Web + Mobile) com backend API compartilhado.

## 📁 Estrutura do Projeto

```
portal/
├── backend/          # API Node.js + Express + Prisma
├── web/              # Frontend Next.js
└── mobile/           # App React Native (a ser criado)
```

## 🚀 Instalação e Configuração

### 1. Backend API

```bash
cd backend

# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp .env.example .env
# Edite o arquivo .env com suas configurações

# Configurar banco de dados PostgreSQL
# Certifique-se de ter o PostgreSQL instalado e rodando
# Atualize a DATABASE_URL no .env

# Gerar Prisma Client e criar tabelas
npm run prisma:generate
npm run prisma:push

# Iniciar servidor de desenvolvimento
npm run dev
```

O backend estará rodando em `http://localhost:3001`

### 2. Frontend Web

```bash
cd web

# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp .env.example .env.local
# O arquivo já está configurado para apontar para http://localhost:3001/api

# Iniciar servidor de desenvolvimento
npm run dev
```

O frontend estará rodando em `http://localhost:3000`

## 📱 Próximos Passos - Mobile App

Para criar o aplicativo mobile:

```bash
# Criar projeto Expo
npx create-expo-app@latest mobile --template blank-typescript

cd mobile
npm install axios @react-navigation/native @react-navigation/stack react-native-screens react-native-safe-area-context
```

## 🔑 Primeiro Acesso

### Criar Usuário Administrador

Você pode criar o primeiro usuário admin de duas formas:

**Opção 1: Via API (Postman/Insomnia)**
```
POST http://localhost:3001/api/auth/register
Content-Type: application/json

{
  "email": "admin@portal.com",
  "password": "senha123",
  "name": "Administrador",
  "role": "ADMIN"
}
```

**Opção 2: Diretamente no banco de dados**
```sql
-- Conecte ao PostgreSQL e execute:
INSERT INTO users (id, email, password, name, role, active, "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  'admin@portal.com',
  '$2a$10$YourHashedPasswordHere',  -- Use bcrypt para gerar o hash
  'Administrador',
  'ADMIN',
  true,
  NOW(),
  NOW()
);
```

### Login

1. Acesse `http://localhost:3000`
2. Faça login com as credenciais criadas
3. Se for ADMIN, será redirecionado para `/admin/dashboard`
4. Se for CLIENT, será redirecionado para `/dashboard`

## ⚙️ Configurações Importantes

### Email (SMTP)

Configure o servidor SMTP na interface de admin em `/admin/email-config` ou diretamente no banco:

```sql
INSERT INTO email_configs (id, host, port, "user", password, "from", secure, active, "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  'smtp.gmail.com',
  587,
  'seu-email@gmail.com',
  'sua-senha-app',
  'Portal <noreply@portal.com>',
  true,
  true,
  NOW(),
  NOW()
);
```

### Integrações

#### NF-e (Nota Fiscal Eletrônica)

Edite `backend/.env` e configure:
```
NFE_API_URL=https://api.focusnfe.com.br  # ou seu provedor
NFE_API_KEY=sua-chave-api
NFE_API_SECRET=seu-secret
```

Implemente a lógica específica em `backend/src/services/nfe.service.ts`

#### Boletos

Edite `backend/.env` e configure:
```
PAYMENT_API_URL=https://www.asaas.com/api/v3  # ou seu gateway
PAYMENT_API_KEY=sua-chave-api
```

Implemente a lógica específica em `backend/src/services/boleto.service.ts`

## 📚 Funcionalidades

### Área do Cliente
- ✅ Dashboard com estatísticas
- ✅ Visualização de Notas Fiscais
- ✅ Visualização de Recibos
- ✅ Inventários
- ✅ Repositório de Certificados
- ✅ Drive de Arquivos

### Área Administrativa
- ✅ Dashboard administrativo
- ✅ Gerenciamento de clientes (CRUD)
- ✅ Configuração de email SMTP
- ✅ Confirmação de pagamentos
- ✅ Geração de boletos
- ✅ Geração automática de recibos e NF-e após pagamento

### Automação
- ✅ Ao confirmar um pagamento, o sistema automaticamente:
  1. Gera um recibo
  2. Emite a nota fiscal (NF-e)
  3. Envia emails para o cliente

## 🛠️ Desenvolvimento

### Backend
- Node.js + Express + TypeScript
- Prisma ORM + PostgreSQL
- JWT Authentication
- Multer para upload de arquivos

### Web
- Next.js 14 (App Router)
- React + TypeScript
- Tailwind CSS
- Axios para API calls

### Mobile (a implementar)
- React Native + Expo
- TypeScript
- React Navigation
- Axios para API calls

## 📝 Notas

- O sistema está preparado para integrações com NF-e e boletos, mas você precisará configurar as credenciais específicas do seu provedor
- Os serviços de integração (`nfe.service.ts` e `boleto.service.ts`) contêm implementações placeholder que devem ser adaptadas para sua API específica
- Certifique-se de configurar o PostgreSQL antes de iniciar o backend
- Para produção, configure variáveis de ambiente adequadas e use HTTPS

## 🔒 Segurança

- Nunca commite arquivos `.env` no Git
- Use senhas fortes para JWT_SECRET
- Configure CORS adequadamente para produção
- Use HTTPS em produção
- Implemente rate limiting para APIs públicas
