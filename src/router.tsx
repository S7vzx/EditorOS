import { QueryClient, QueryCache, MutationCache } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";
import { logError } from "@/lib/errorLog";
import { AlertTriangle, RotateCcw, Home } from "lucide-react";

function DefaultErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  logError("router", error, { boundary: "defaultErrorComponent" });
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md rounded-2xl border border-rose-500/20 bg-rose-500/5 p-6 text-center">
        <div className="mx-auto mb-3 grid size-10 place-items-center rounded-full bg-rose-500/15 text-rose-300">
          <AlertTriangle className="size-5" />
        </div>
        <h1 className="text-lg font-semibold">Erro inesperado</h1>
        <p className="mt-1 text-sm text-muted-foreground">{error.message}</p>
        <div className="mt-5 flex justify-center gap-2">
          <button
            onClick={reset}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:brightness-110"
          >
            <RotateCcw className="size-4" /> Tentar novamente
          </button>
          <a
            href="/"
            className="inline-flex items-center gap-2 rounded-lg bg-neutral-900 px-4 py-2 text-sm font-semibold text-neutral-200 ring-1 ring-white/10 transition hover:bg-neutral-800"
          >
            <Home className="size-4" /> Início
          </a>
        </div>
      </div>
    </div>
  );
}

export const getRouter = () => {
  const queryClient = new QueryClient({
    queryCache: new QueryCache({
      onError: (error, query) => {
        logError("query", error, { queryKey: query.queryKey });
      },
    }),
    mutationCache: new MutationCache({
      onError: (error, _vars, _ctx, mutation) => {
        logError("mutation", error, {
          mutationKey: mutation.options.mutationKey,
        });
      },
    }),
    defaultOptions: {
      queries: {
        staleTime: 60_000,
        gcTime: 5 * 60_000,
        refetchOnWindowFocus: false,
        retry: 1,
      },
    },
  });

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreload: "intent",
    defaultPreloadStaleTime: 30_000,
    defaultPendingMs: 0,
    defaultErrorComponent: DefaultErrorComponent,
  });

  return router;
};
