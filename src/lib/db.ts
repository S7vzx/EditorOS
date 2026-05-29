import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert } from "@/integrations/supabase/types";

export type ProjectRow = Tables<"projects">;
export type DemandRow = Tables<"demands">;
export type ClientRow = Tables<"clients">;

export type DemandKind = "demanda" | "gravacao" | "postagem";

export type DemandWithClient = DemandRow & {
  clients: Pick<ClientRow, "id" | "name" | "email"> | null;
};

export type ProjectStatus = "briefing" | "edicao" | "thumbnail" | "revisao" | "entregue";

export const PROJECT_STATUS_LABEL: Record<ProjectStatus, string> = {
  briefing: "Briefing",
  edicao: "Edição",
  thumbnail: "Thumbnail",
  revisao: "Revisão",
  entregue: "Entregue",
};

export const PROJECT_STATUS_ORDER: ProjectStatus[] = [
  "briefing",
  "edicao",
  "thumbnail",
  "revisao",
  "entregue",
];

// ---------- Projects ----------

export async function fetchProjects(): Promise<ProjectRow[]> {
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .order("position", { ascending: true })
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function createProject(input: TablesInsert<"projects">): Promise<ProjectRow> {
  const { data, error } = await supabase.from("projects").insert(input).select().single();
  if (error) throw error;
  return data;
}

export async function updateProjectStatus(id: string, status: ProjectStatus) {
  const { error } = await supabase.from("projects").update({ status }).eq("id", id);
  if (error) throw error;
}

export async function deleteProject(id: string) {
  const { error } = await supabase.from("projects").delete().eq("id", id);
  if (error) throw error;
}

// ---------- Demands / Eventos do cliente ----------

export async function fetchDemands(): Promise<DemandWithClient[]> {
  const { data, error } = await supabase
    .from("demands")
    .select("*, clients(id, name, email)")
    .order("scheduled_date", { ascending: true });
  if (error) throw error;
  return (data ?? []) as DemandWithClient[];
}

export async function fetchDemandsByClient(clientId: string): Promise<DemandRow[]> {
  const { data, error } = await supabase
    .from("demands")
    .select("*")
    .eq("client_id", clientId)
    .order("scheduled_date", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function setDemandStatus(id: string, status: "pendente" | "aprovado" | "recusado") {
  const { error } = await supabase.from("demands").update({ status }).eq("id", id);
  if (error) throw error;
}

export async function deleteDemand(id: string) {
  const { error } = await supabase.from("demands").delete().eq("id", id);
  if (error) throw error;
}

export async function approveDemandAsProject(demand: DemandWithClient): Promise<void> {
  const typeMap: Record<string, ProjectRow["type"]> = {
    video: "video",
    thumbnail: "thumb",
    outro: "video",
  };
  const { error: insErr } = await supabase.from("projects").insert({
    title: demand.title,
    client_name: demand.clients?.name ?? null,
    type: typeMap[demand.type] ?? "video",
    status: "briefing",
    deadline: demand.scheduled_date,
    priority: demand.priority,
    notes: demand.description,
    demand_id: demand.id,
  });
  if (insErr) throw insErr;
  await setDemandStatus(demand.id, "aprovado");
}

// ---------- Clients ----------

const OWNER_EMAIL = "owner@editoros.local";
const OWNER_KEY = "editoros:owner-id";

/**
 * Painel pessoal: garante que existe um único "cliente dono" e retorna seu id.
 * Cacheia o id em localStorage para evitar round-trips.
 */
export async function getOrCreateOwner(): Promise<ClientRow> {
  try {
    const cached = localStorage.getItem(OWNER_KEY);
    if (cached) {
      const { data } = await supabase.from("clients").select("*").eq("id", cached).maybeSingle();
      if (data) return data;
    }
  } catch {
    /* ignore */
  }

  const existing = await supabase
    .from("clients")
    .select("*")
    .eq("email", OWNER_EMAIL)
    .maybeSingle();
  if (existing.error) throw existing.error;
  if (existing.data) {
    try {
      localStorage.setItem(OWNER_KEY, existing.data.id);
    } catch {
      /* ignore */
    }
    return existing.data;
  }

  const { data, error } = await supabase
    .from("clients")
    .insert({ name: "Eu", email: OWNER_EMAIL })
    .select()
    .single();
  if (error) throw error;
  try {
    localStorage.setItem(OWNER_KEY, data.id);
  } catch {
    /* ignore */
  }
  return data;
}

export async function createDemand(input: TablesInsert<"demands">): Promise<DemandRow> {
  const { data, error } = await supabase.from("demands").insert(input).select().single();
  if (error) throw error;
  return data;
}
