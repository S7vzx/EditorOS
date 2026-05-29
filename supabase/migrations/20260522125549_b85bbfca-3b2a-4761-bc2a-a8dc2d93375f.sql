ALTER TABLE public.demands
  ADD COLUMN IF NOT EXISTS kind text NOT NULL DEFAULT 'demanda',
  ADD COLUMN IF NOT EXISTS platform text,
  ADD COLUMN IF NOT EXISTS end_time time without time zone,
  ADD COLUMN IF NOT EXISTS location text;

CREATE INDEX IF NOT EXISTS demands_scheduled_date_idx ON public.demands (scheduled_date);
CREATE INDEX IF NOT EXISTS demands_kind_idx ON public.demands (kind);