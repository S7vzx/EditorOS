-- Full SQL dump (schema + grants + RLS policies)
-- Generated: 2026-05-28T12:57:18Z

-- ==========================================
-- SCHEMA (pg_dump --schema-only)
-- ==========================================
--
-- PostgreSQL database dump
--

\restrict qjjLEjO7YhkzU2gOS2g0lPLhePldrngrid3aVtxTwaPAw1XUKlmbNj976HfXFEI

-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.9

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'SQL_ASCII';
SET standard_conforming_strings = off;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET escape_string_warning = off;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA public;


--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON SCHEMA public IS 'standard public schema';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: clients; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.clients (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    email text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: demands; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.demands (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    client_id uuid NOT NULL,
    title text NOT NULL,
    type text DEFAULT 'video'::text NOT NULL,
    scheduled_date date NOT NULL,
    scheduled_time time without time zone,
    description text,
    priority text DEFAULT 'media'::text NOT NULL,
    refs text,
    status text DEFAULT 'pendente'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    kind text DEFAULT 'demanda'::text NOT NULL,
    platform text,
    end_time time without time zone,
    location text,
    CONSTRAINT demands_priority_check CHECK ((priority = ANY (ARRAY['baixa'::text, 'media'::text, 'alta'::text]))),
    CONSTRAINT demands_status_check CHECK ((status = ANY (ARRAY['pendente'::text, 'aprovado'::text, 'recusado'::text]))),
    CONSTRAINT demands_type_check CHECK ((type = ANY (ARRAY['video'::text, 'thumbnail'::text, 'outro'::text])))
);


--
-- Name: projects; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.projects (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title text NOT NULL,
    client_name text,
    type text DEFAULT 'video'::text NOT NULL,
    status text DEFAULT 'briefing'::text NOT NULL,
    deadline date,
    priority text DEFAULT 'media'::text NOT NULL,
    notes text,
    demand_id uuid,
    "position" integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT projects_priority_check CHECK ((priority = ANY (ARRAY['baixa'::text, 'media'::text, 'alta'::text]))),
    CONSTRAINT projects_status_check CHECK ((status = ANY (ARRAY['briefing'::text, 'edicao'::text, 'thumbnail'::text, 'revisao'::text, 'entregue'::text]))),
    CONSTRAINT projects_type_check CHECK ((type = ANY (ARRAY['video'::text, 'thumb'::text, 'shorts'::text, 'reels'::text])))
);


--
-- Name: clients clients_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clients
    ADD CONSTRAINT clients_email_key UNIQUE (email);


--
-- Name: clients clients_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clients
    ADD CONSTRAINT clients_pkey PRIMARY KEY (id);


--
-- Name: demands demands_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.demands
    ADD CONSTRAINT demands_pkey PRIMARY KEY (id);


--
-- Name: projects projects_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT projects_pkey PRIMARY KEY (id);


--
-- Name: demands_client_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX demands_client_idx ON public.demands USING btree (client_id);


--
-- Name: demands_kind_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX demands_kind_idx ON public.demands USING btree (kind);


--
-- Name: demands_scheduled_date_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX demands_scheduled_date_idx ON public.demands USING btree (scheduled_date);


--
-- Name: demands_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX demands_status_idx ON public.demands USING btree (status);


--
-- Name: projects_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX projects_status_idx ON public.projects USING btree (status);


--
-- Name: demands demands_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.demands
    ADD CONSTRAINT demands_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE CASCADE;


--
-- Name: projects projects_demand_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT projects_demand_id_fkey FOREIGN KEY (demand_id) REFERENCES public.demands(id) ON DELETE SET NULL;


--
-- Name: clients; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

--
-- Name: demands; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.demands ENABLE ROW LEVEL SECURITY;

--
-- Name: projects; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

--
-- Name: demands public delete demands; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "public delete demands" ON public.demands FOR DELETE USING (true);


--
-- Name: projects public delete projects; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "public delete projects" ON public.projects FOR DELETE USING (true);


--
-- Name: clients public insert clients; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "public insert clients" ON public.clients FOR INSERT WITH CHECK (true);


--
-- Name: demands public insert demands; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "public insert demands" ON public.demands FOR INSERT WITH CHECK (true);


--
-- Name: projects public insert projects; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "public insert projects" ON public.projects FOR INSERT WITH CHECK (true);


--
-- Name: clients public read clients; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "public read clients" ON public.clients FOR SELECT USING (true);


--
-- Name: demands public read demands; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "public read demands" ON public.demands FOR SELECT USING (true);


--
-- Name: projects public read projects; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "public read projects" ON public.projects FOR SELECT USING (true);


--
-- Name: clients public update clients; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "public update clients" ON public.clients FOR UPDATE USING (true) WITH CHECK (true);


--
-- Name: demands public update demands; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "public update demands" ON public.demands FOR UPDATE USING (true) WITH CHECK (true);


--
-- Name: projects public update projects; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "public update projects" ON public.projects FOR UPDATE USING (true) WITH CHECK (true);


--
-- PostgreSQL database dump complete
--

\unrestrict qjjLEjO7YhkzU2gOS2g0lPLhePldrngrid3aVtxTwaPAw1XUKlmbNj976HfXFEI


-- ==========================================
-- GRANTS
-- ==========================================
GRANT INSERT, SELECT ON public.clients TO sandbox_exec;
GRANT INSERT, SELECT ON public.demands TO sandbox_exec;
GRANT INSERT, SELECT ON public.projects TO sandbox_exec;

-- ==========================================
-- RLS ENABLE + POLICIES
-- ==========================================
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.demands ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public insert clients" ON public.clients AS PERMISSIVE FOR INSERT TO public
  WITH CHECK (true);
CREATE POLICY "public read clients" ON public.clients AS PERMISSIVE FOR SELECT TO public
  USING (true);
CREATE POLICY "public update clients" ON public.clients AS PERMISSIVE FOR UPDATE TO public
  USING (true)
  WITH CHECK (true);
CREATE POLICY "public delete demands" ON public.demands AS PERMISSIVE FOR DELETE TO public
  USING (true);
CREATE POLICY "public insert demands" ON public.demands AS PERMISSIVE FOR INSERT TO public
  WITH CHECK (true);
CREATE POLICY "public read demands" ON public.demands AS PERMISSIVE FOR SELECT TO public
  USING (true);
CREATE POLICY "public update demands" ON public.demands AS PERMISSIVE FOR UPDATE TO public
  USING (true)
  WITH CHECK (true);
CREATE POLICY "public delete projects" ON public.projects AS PERMISSIVE FOR DELETE TO public
  USING (true);
CREATE POLICY "public insert projects" ON public.projects AS PERMISSIVE FOR INSERT TO public
  WITH CHECK (true);
CREATE POLICY "public read projects" ON public.projects AS PERMISSIVE FOR SELECT TO public
  USING (true);
CREATE POLICY "public update projects" ON public.projects AS PERMISSIVE FOR UPDATE TO public
  USING (true)
  WITH CHECK (true);
