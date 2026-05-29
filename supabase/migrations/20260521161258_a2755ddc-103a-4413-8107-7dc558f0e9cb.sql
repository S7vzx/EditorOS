
-- Clients
create table public.clients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null unique,
  created_at timestamptz not null default now()
);

-- Demands (pedidos do cliente)
create table public.demands (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  title text not null,
  type text not null default 'video' check (type in ('video','thumbnail','outro')),
  scheduled_date date not null,
  scheduled_time time,
  description text,
  priority text not null default 'media' check (priority in ('baixa','media','alta')),
  refs text,
  status text not null default 'pendente' check (status in ('pendente','aprovado','recusado')),
  created_at timestamptz not null default now()
);
create index demands_status_idx on public.demands(status);
create index demands_client_idx on public.demands(client_id);

-- Projects
create table public.projects (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  client_name text,
  type text not null default 'video' check (type in ('video','thumb','shorts','reels')),
  status text not null default 'briefing' check (status in ('briefing','edicao','thumbnail','revisao','entregue')),
  deadline date,
  priority text not null default 'media' check (priority in ('baixa','media','alta')),
  notes text,
  demand_id uuid references public.demands(id) on delete set null,
  position int not null default 0,
  created_at timestamptz not null default now()
);
create index projects_status_idx on public.projects(status);

-- RLS: tabelas públicas (sem autenticação nesta fase)
alter table public.clients enable row level security;
alter table public.demands enable row level security;
alter table public.projects enable row level security;

create policy "public read clients"   on public.clients   for select using (true);
create policy "public insert clients" on public.clients   for insert with check (true);
create policy "public update clients" on public.clients   for update using (true) with check (true);

create policy "public read demands"   on public.demands   for select using (true);
create policy "public insert demands" on public.demands   for insert with check (true);
create policy "public update demands" on public.demands   for update using (true) with check (true);
create policy "public delete demands" on public.demands   for delete using (true);

create policy "public read projects"   on public.projects   for select using (true);
create policy "public insert projects" on public.projects   for insert with check (true);
create policy "public update projects" on public.projects   for update using (true) with check (true);
create policy "public delete projects" on public.projects   for delete using (true);

-- Seed inicial de projetos (compatível com a interface atual)
insert into public.projects (title, client_name, type, status, deadline, priority, position) values
  ('Masterclass: Finanças 2024', 'Bruno Perini', 'video',  'edicao',   '2026-05-22', 'alta',  0),
  ('Thumbnail Pack #12',         'Tech World',   'thumb',  'revisao',  '2026-05-24', 'media', 0),
  ('Cortes Podcast Ep. 88',      'Flow State',   'shorts', 'entregue', '2026-05-20', 'baixa', 0),
  ('Reels Lançamento Curso',     'Ana Lima',     'reels',  'briefing', '2026-05-28', 'alta',  0),
  ('Vídeo institucional Q2',     'Nuvem SaaS',   'video',  'thumbnail','2026-05-26', 'media', 0),
  ('Apple Vision Pro: Review',   'TechVibe',     'video',  'edicao',   '2026-05-25', 'alta',  1),
  ('Pack thumbs gaming',         'PixelCraft',   'thumb',  'briefing', '2026-05-30', 'baixa', 1);
