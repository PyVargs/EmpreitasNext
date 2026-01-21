# Empreitas 2.0

Sistema de Gestão para Empresas de Obras e Reformas

## 🚀 Tecnologias

- **Frontend**: Next.js 15, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: PostgreSQL (Render) + Prisma ORM
- **Autenticação**: NextAuth.js com credenciais
- **State Management**: TanStack Query, Zustand
- **Forms**: React Hook Form + Zod
- **Charts**: Recharts

## 📋 Funcionalidades

- **Funcionários**: Cadastro, histórico, saldos
- **Empreitadas**: Gestão de obras/serviços
- **Retiradas**: Adiantamentos e pagamentos
- **Contratos**: Parcelas e medições de obra
- **Ferramentas**: Inventário com QR Code, empréstimos
- **Contas a Pagar**: Com importação de XML NFe
- **Pedidos de Materiais**: Entregas parciais

## 🛠️ Setup

### Pré-requisitos

- Node.js 18+
- npm ou yarn
- Banco PostgreSQL (Render)

### Instalação

```bash
# Clonar repositório
git clone <repo-url>
cd empreitas-app

# Instalar dependências
npm install

# Configurar variáveis de ambiente
# Crie um arquivo .env com:
DATABASE_URL="postgresql://user:password@host:5432/database?sslmode=require"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="sua-chave-secreta-gere-com-openssl-rand-base64-32"
ADMIN_ACTION_PASSWORD="sua-senha-para-acoes-criticas"

# Gerar cliente Prisma
npx prisma generate

# Sincronizar schema (opcional - se o banco já existe)
npx prisma db pull

# Ou aplicar migrations
npx prisma migrate dev
```

### Executar

```bash
# Desenvolvimento
npm run dev

# Build
npm run build

# Produção
npm start
```

## 📁 Estrutura do Projeto

```
src/
├── app/                    # App Router (Next.js)
│   ├── (auth)/            # Rotas de autenticação
│   ├── (dashboard)/       # Rotas protegidas
│   └── api/               # API Routes
├── components/
│   ├── layout/            # Sidebar, Header, etc
│   ├── providers/         # Context providers
│   └── ui/                # Componentes shadcn/ui
├── hooks/                 # Custom hooks
├── lib/                   # Utilitários
│   ├── auth.ts           # Configuração NextAuth
│   └── prisma.ts         # Cliente Prisma
├── types/                 # TypeScript types
└── prisma/
    └── schema.prisma     # Schema do banco
```

## 🔐 Autenticação

O sistema usa NextAuth.js com:
- Login por usuário/senha (campo `login` na tabela `usuarios`)
- Hash de senha com bcrypt (campo `senha_hash`)
- Proteção contra brute force (bloqueio após 5 tentativas)
- Sessão JWT com duração de 24 horas

## 📊 Dashboard

Métricas em tempo real:
- Valor total em empreitadas
- Total retirado
- Ferramentas por localização
- Contratos ativos
- Contas vencidas

## 🗄️ Banco de Dados

O sistema conecta ao PostgreSQL existente do Empreitas v1.0 no Render.

**Tabelas principais:**
- `usuarios` - Usuários do sistema
- `funcionarios` - Funcionários/empreiteiros
- `condominios` - Clientes
- `empreitadas` - Obras/serviços
- `retiradas` - Pagamentos
- `contratos` - Contratos com parcelas
- `ferramentas` - Inventário

## 🎨 UI/UX

- Tema escuro por padrão
- Cores: Amber/Orange (primária)
- Design responsivo
- Animações suaves
- Feedback visual (toasts, loading states)

## 📝 Scripts

```bash
# Desenvolvimento
npm run dev

# Build produção
npm run build

# Lint
npm run lint

# Prisma Studio (visualizar banco)
npx prisma studio

# Gerar tipos Prisma
npx prisma generate

# Sincronizar schema do banco
npx prisma db pull
```

## 🚀 Deploy no Render

1. Crie um novo Web Service no Render
2. Conecte ao repositório
3. Configure as variáveis de ambiente:
   - `DATABASE_URL`
   - `NEXTAUTH_URL` (URL do seu app)
   - `NEXTAUTH_SECRET`
4. Build command: `npm install && npx prisma generate && npm run build`
5. Start command: `npm start`

## 📄 Licença

Proprietary - © 2024-2026
