# EditorOS Suite

> Ecossistema de produtividade para editores de vídeo, designers de thumbnail e criadores de conteúdo — centralizando projetos, clientes, assets e fluxos de trabalho em um único painel.

![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?style=flat-square&logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black)
![TanStack Start](https://img.shields.io/badge/TanStack_Start-1.x-FF4154?style=flat-square)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?style=flat-square&logo=supabase&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)

---

## Visão Geral

O **EditorOS Suite** é uma plataforma web full-stack construída com foco em performance, tipagem segura e experiência de usuário premium. O sistema é dividido em dois painéis principais:

- **Painel do Editor** (`/app`) — gestão de projetos, demandas de clientes, calendário, assets e ferramentas de IA.
- **Painel do Cliente** (`/cliente`) — envio e acompanhamento de demandas de produção de forma simples e direta.

---

## Funcionalidades

### Dashboard de Produtividade
Visão consolidada de projetos ativos, pedidos pendentes e metas semanais com gráficos interativos de rendimento.

### Kanban de Projetos
Pipeline de produção estruturado em colunas — *Briefing*, *Edição*, *Thumbnail*, *Revisão* e *Entregue* — com drag-and-drop nativo via `@dnd-kit` e persistência em banco de dados.

### Caixa de Entrada de Demandas
Fluxo completo de aprovação: o cliente envia uma demanda → o editor aprova (gera projeto no Kanban + evento no calendário) ou recusa, tudo em tempo real via Supabase.

### Painel do Cliente
Interface minimalista para clientes enviarem demandas (título, tipo, data/hora, prioridade, links de referência) sem necessidade de cadastro com senha — identificação por nome e e-mail.

### Thumb AI
Motor de geração de conceitos de thumbnail que mapeia nicho, estilo e emoção para produzir composições visuais com mockup 16:9 interativo e prompt otimizado para Midjourney / Stable Diffusion.

### Prompt Vault
Cofre pessoal de prompts de IA categorizados (Thumbnails, Roteiro, Copy, Edição, Imagem, Automações) com CRUD completo.

### Biblioteca de Assets
Organização de overlays, LUTs, fontes, efeitos sonoros, presets e templates com upload interativo e categorização por cor.

### Calendário Integrado
Visualização mensal com eventos puxados de projetos (deadline) e demandas aprovadas (data agendada).

---

## Stack Tecnológica

| Camada | Tecnologia |
|---|---|
| Framework UI | [React 19](https://react.dev/) |
| Build & SSR | [Vite 7](https://vite.dev/) + [TanStack Start 1.x](https://tanstack.com/start) |
| Roteamento | [TanStack Router](https://tanstack.com/router) (file-based) |
| Estado & Cache | [TanStack Query v5](https://tanstack.com/query) |
| Banco de Dados | [Supabase](https://supabase.com/) (PostgreSQL + RLS) |
| Estilização | [Tailwind CSS v4](https://tailwindcss.com/) |
| Componentes | [Radix UI](https://www.radix-ui.com/) + [shadcn/ui](https://ui.shadcn.com/) |
| Drag & Drop | [@dnd-kit](https://dndkit.com/) |
| Deploy | [Cloudflare Workers](https://workers.cloudflare.com/) |
| Linting | ESLint 9 + Prettier |
| Linguagem | TypeScript 5.8 (strict) |

---

## Estrutura de Rotas

```
/                     → Landing (escolher: Sou Editor | Sou Cliente)
/app                  → Painel do Editor
  /app                → Dashboard
  /app/projetos       → Kanban de Projetos
  /app/pedidos        → Caixa de Entrada de Demandas
  /app/calendario     → Calendário
  /app/thumb-ai       → Gerador de Conceitos de Thumbnail
  /app/assets         → Biblioteca de Assets
  /app/prompt-vault   → Cofre de Prompts
  /app/workflow       → Workflow
  /app/configuracoes  → Configurações
/cliente              → Painel do Cliente
  /cliente            → Meus Pedidos
  /cliente/novo       → Nova Demanda
```

---

## Configuração e Execução Local

### Pré-requisitos

- [Node.js](https://nodejs.org/) >= 20 **ou** [Bun](https://bun.sh/) >= 1.x

### 1. Clonar o repositório

```bash
git clone https://github.com/S7vzx/EditorOS.git
cd EditorOS
```

### 2. Instalar dependências

```bash
npm install
# ou
bun install
```

### 3. Configurar variáveis de ambiente

Copie o arquivo de exemplo e preencha com as credenciais do seu projeto Supabase:

```bash
cp .env.example .env
```

| Variável | Descrição |
|---|---|
| `SUPABASE_URL` | URL do projeto Supabase (server-side) |
| `SUPABASE_PUBLISHABLE_KEY` | Chave anon/public do Supabase (server-side) |
| `SUPABASE_SERVICE_ROLE_KEY` | Chave de serviço do Supabase (apenas server, bypassa RLS) |
| `VITE_SUPABASE_URL` | URL do projeto Supabase (client-side, exposta pelo Vite) |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Chave anon/public do Supabase (client-side, exposta pelo Vite) |

> [!WARNING]
> Nunca comite o arquivo `.env`. Ele já está incluído no `.gitignore`. A `SUPABASE_SERVICE_ROLE_KEY` bypassa o Row Level Security — use-a **apenas em funções server-side**.

### 4. Criar as tabelas no Supabase

Execute o script SQL disponível em [`full-schema.sql`](./full-schema.sql) no SQL Editor do seu projeto Supabase.

### 5. Rodar em modo desenvolvimento

```bash
npm run dev
# ou
bun dev
```

Acesse em `http://localhost:8080`.

---

## Scripts Disponíveis

```bash
npm run dev          # Servidor de desenvolvimento com HMR
npm run build        # Build de produção
npm run build:dev    # Build em modo development (para debug)
npm run preview      # Preview do build de produção
npm run lint         # Verificação de lint (ESLint)
npm run format       # Formatação automática (Prettier)
npm run test         # Testes unitários (Vitest, modo run)
npm run test:watch   # Testes em modo watch
```

---

## Decisões de Arquitetura

- **Sem autenticação por senha**: o cliente se identifica apenas por nome e e-mail. Adequado para o escopo atual; autenticação completa pode ser adicionada posteriormente.
- **RLS aberto**: as tabelas Supabase permitem leitura/escrita pública nesta fase. Validações de input são feitas no client e via `CHECK constraints` no banco.
- **Acesso direto ao Supabase**: sem server functions intermediárias para as queries principais — o client browser acessa o Supabase diretamente com o SDK tipado.
- **TanStack Query**: `staleTime` curto + `invalidateQueries` após mutations garantem consistência sem polling manual.

---

## Licença

Distribuído sob a licença MIT. Veja [`LICENSE`](./LICENSE) para mais detalhes.