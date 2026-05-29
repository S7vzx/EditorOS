## Objetivo

Tornar o EditorOS funcional com persistência real e adicionar um painel de cliente separado em `/cliente` para envio de demandas (ex.: "vídeo às 11h e vídeo às 14h do dia 21"). As demandas caem numa **Caixa de Entrada** no painel do editor, que pode aprovar (vira projeto no Kanban + evento no calendário) ou recusar.

## Arquitetura de rotas

```
/                    → landing simples (escolher: Sou Editor | Sou Cliente)
/app                 → painel do editor (layout atual com sidebar)
  /app               → dashboard
  /app/projetos      → kanban
  /app/pedidos       → NOVO: caixa de entrada de demandas
  /app/calendario    → calendário (agora puxa do banco)
  /app/thumb-ai
  /app/assets
  /app/prompt-vault
  /app/workflow
  /app/configuracoes
/cliente             → painel do cliente (layout próprio, mais simples)
  /cliente           → "Meus pedidos" + botão "Nova demanda"
  /cliente/novo      → formulário de nova demanda
```

Sem autenticação: o cliente se identifica por **nome + email** no primeiro acesso (salvo em `localStorage` apenas para preencher o formulário; o registro real fica no banco).

## Backend (Supabase)

Tabelas:

- **`clients`**: `id`, `name`, `email` (unique), `created_at`
- **`demands`** (pedidos do cliente):
  - `id`, `client_id` (FK), `title`, `type` (`video` | `thumbnail` | `outro`),
  - `scheduled_date` (date), `scheduled_time` (time, nullable),
  - `description`, `priority` (`baixa`|`media`|`alta`),
  - `references` (text/url, nullable),
  - `status` (`pendente`|`aprovado`|`recusado`), `created_at`
- **`projects`** (substitui o mock atual): `id`, `title`, `client_name`, `status` (colunas do Kanban), `deadline`, `priority`, `thumbnail_url`, `demand_id` (FK nullable), `position` (ordem no Kanban), `created_at`

RLS: tabelas abertas para leitura/escrita pública (sem auth nesta fase) — registrado como decisão consciente já que não há login. Validação de inputs feita no client + check constraints.

Sem server functions complexas: acesso direto via `supabase` browser client com queries tipadas.

## Painel do Cliente (`/cliente`)

- **Header minimalista** com logo "EditorOS" e nome do cliente (se preenchido).
- **Tela inicial**: cards dos pedidos do cliente (filtrados por email), com status pill colorido (pendente=âmbar, aprovado=verde, recusado=vermelho) e CTA grande "Nova demanda".
- **Formulário `/cliente/novo`** (campos padrão sensatos, já que não foi especificado):
  - Título
  - Tipo: Vídeo | Thumbnail | Outro
  - Data (date picker)
  - Horário (time picker, opcional)
  - Descrição
  - Prioridade: Baixa | Média | Alta
  - Links de referência (textarea)
  - Botão "Enviar demanda" → insere em `demands` com `status=pendente`, toast de sucesso, redireciona para `/cliente`.

Suporte ao caso "vídeo às 11h e vídeo às 14h do dia 21": cliente cria duas demandas (uma por horário). Sem necessidade de múltiplas entradas no mesmo form.

## Painel do Editor — mudanças

### Nova rota `/app/pedidos` (Caixa de Entrada)

- Lista de demandas com `status=pendente` em ordem cronológica.
- Cada card mostra: cliente, título, tipo, data/hora, prioridade, descrição, refs.
- Ações: **Aprovar** (cria registro em `projects` com `status=briefing`, marca demand como `aprovado`) | **Recusar** (marca como `recusado`).
- Filtros por status (pendente/aprovado/recusado/todos) e busca.
- Badge com contador de pendentes na sidebar.

### Projetos (`/app/projetos`)

- Migrar do mock para `projects` no banco.
- Drag-and-drop persiste `status` e `position` no banco (debounce 300ms).
- Botão "Novo projeto" abre dialog para criar manualmente (sem passar por demanda).

### Calendário (`/app/calendario`)

- Puxa eventos de `projects` (deadline) + `demands` aprovadas (scheduled_date).
- Click em dia → drawer com lista de eventos daquele dia.

### Dashboard

- Stat cards: agora baseados em dados reais (projetos ativos, pendentes na caixa, entregas da semana).
- Mantém visual atual.

### Demais seções (Thumb AI, Assets, Prompt Vault, Workflow, Configurações)

- **Permanecem com mock nesta fase** — escopo focado em projetos/pedidos/calendário, que é o pedido central.

## Otimizações de navegação

- `defaultPreload: "intent"` no router (preload no hover dos links).
- `Link` com `activeProps` em todos os itens da sidebar (já tem).
- Queries com TanStack Query: `staleTime` curto, `invalidateQueries` após mutations.
- Loading skeletons nas listas (projetos, pedidos, calendário) em vez de telas em branco.
- Cmd+K continua funcional, agora busca em projetos + pedidos reais.

## Stack adicional

- Supabase: tabelas + RLS abertas (sem auth).
- `@tanstack/react-query` (já instalado) para cache e revalidação.
- Mantém `@dnd-kit`, `date-fns`, design tokens roxo/dark já em `src/styles.css`.

## Fora de escopo

- Login real (descartado pelo usuário).
- Notificações em tempo real para o editor quando cliente cria pedido (pode ser adicionado depois com Supabase Realtime).
- Edição de demandas após envio (cliente só cria; editor aprova/recusa).
- Upload de arquivos de referência (apenas links nesta fase).
