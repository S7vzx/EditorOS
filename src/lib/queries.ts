import { queryOptions, keepPreviousData } from "@tanstack/react-query";
import { fetchProjects, fetchDemands, fetchDemandsByClient, getOrCreateOwner } from "./db";

// Single source of truth para queryKeys + opções compartilhadas.
// Tudo abaixo herda staleTime do QueryClient default (60s), exceto onde
// faz sentido sobrescrever.

export const queryKeys = {
  projects: ["projects"] as const,
  demands: ["demands"] as const,
  owner: ["owner"] as const,
  ownerDemands: (ownerId: string | null | undefined) => ["owner-demands", ownerId ?? null] as const,
};

export const projectsQuery = () =>
  queryOptions({
    queryKey: queryKeys.projects,
    queryFn: fetchProjects,
    placeholderData: keepPreviousData,
    staleTime: 5 * 60_000,
  });

export const demandsQuery = () =>
  queryOptions({
    queryKey: queryKeys.demands,
    queryFn: fetchDemands,
    placeholderData: keepPreviousData,
    staleTime: 5 * 60_000,
  });

export const ownerQuery = () =>
  queryOptions({
    queryKey: queryKeys.owner,
    queryFn: getOrCreateOwner,
    staleTime: Infinity,
  });

export const ownerDemandsQuery = (ownerId: string | null | undefined) =>
  queryOptions({
    queryKey: queryKeys.ownerDemands(ownerId),
    queryFn: () => fetchDemandsByClient(ownerId!),
    enabled: !!ownerId,
    placeholderData: keepPreviousData,
    staleTime: 5 * 60_000,
  });
