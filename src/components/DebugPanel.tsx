import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useQueryClient, onlineManager } from "@tanstack/react-query";
import { useRouterState } from "@tanstack/react-router";
import { Activity, X, AlertTriangle } from "lucide-react";
import { clearErrors, getErrors, subscribeErrors, type AppErrorEntry } from "@/lib/errorLog";

type QueryTiming = {
  key: string;
  status: string;
  fetchMs: number;
  updatedAt: number;
  dataSize: number;
};

const STORAGE_KEY = "editoros:debug";
const renderCounts = new Map<string, number>();

function useRouteRenderCount() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const lastPath = useRef(pathname);
  if (lastPath.current !== pathname) {
    lastPath.current = pathname;
  }
  const current = (renderCounts.get(pathname) ?? 0) + 1;
  renderCounts.set(pathname, current);
  return { pathname, count: current, all: renderCounts };
}

export function DebugPanel() {
  const [open, setOpen] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(STORAGE_KEY) === "1";
  });
  const [, force] = useState(0);
  const queryClient = useQueryClient();
  const { pathname, count, all } = useRouteRenderCount();
  const navStartRef = useRef<number>(typeof performance !== "undefined" ? performance.now() : 0);
  const lastPathRef = useRef(pathname);
  const [navMs, setNavMs] = useState(0);

  useEffect(() => {
    if (lastPathRef.current !== pathname) {
      lastPathRef.current = pathname;
      navStartRef.current = performance.now();
      setNavMs(0);
    } else {
      setNavMs(performance.now() - navStartRef.current);
    }
  }, [pathname]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "d" && (e.ctrlKey || e.metaKey) && e.shiftKey) {
        e.preventDefault();
        setOpen((v) => {
          const next = !v;
          try {
            localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
          } catch {
            /* ignore */
          }
          return next;
        });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (!open) return;
    const cache = queryClient.getQueryCache();
    const unsub = cache.subscribe(() => force((n) => n + 1));
    const tick = setInterval(() => force((n) => n + 1), 1000);
    return () => {
      unsub();
      clearInterval(tick);
    };
  }, [open, queryClient]);

  if (!open) {
    return (
      <button
        onClick={() => {
          setOpen(true);
          try {
            localStorage.setItem(STORAGE_KEY, "1");
          } catch {
            /* ignore */
          }
        }}
        className="fixed bottom-4 left-4 z-[9999] inline-flex items-center gap-1.5 rounded-full bg-neutral-900/80 px-3 py-1.5 text-[11px] font-medium text-neutral-300 ring-1 ring-white/10 backdrop-blur hover:text-white"
        title="Abrir diagnóstico (Ctrl/Cmd + Shift + D)"
      >
        <Activity className="size-3.5" /> diag
      </button>
    );
  }

  const queries = queryClient.getQueryCache().getAll();
  const timings: QueryTiming[] = queries.map((q) => {
    const state = q.state;
    const fetchMs =
      state.fetchStatus === "fetching" && state.fetchFailureCount === 0
        ? performance.now() -
          (state.fetchFailureReason ? 0 : state.dataUpdatedAt || performance.now())
        : 0;
    let dataSize = 0;
    try {
      dataSize = state.data ? JSON.stringify(state.data).length : 0;
    } catch {
      dataSize = -1;
    }
    return {
      key: JSON.stringify(q.queryKey),
      status: `${state.status}${state.fetchStatus !== "idle" ? `/${state.fetchStatus}` : ""}`,
      fetchMs,
      updatedAt: state.dataUpdatedAt,
      dataSize,
    };
  });

  const totalCacheBytes = timings.reduce((acc, t) => acc + Math.max(0, t.dataSize), 0);
  const fetching = timings.filter((t) => t.status.includes("fetching")).length;
  const totalRenders = Array.from(all.values()).reduce((a, b) => a + b, 0);

  return (
    <div className="fixed bottom-4 left-4 z-[9999] w-[360px] max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl border border-white/10 bg-neutral-950/95 text-[11px] text-neutral-200 shadow-2xl backdrop-blur">
      <div className="flex items-center justify-between border-b border-white/10 px-3 py-2">
        <div className="flex items-center gap-2">
          <Activity className="size-3.5 text-primary" />
          <span className="font-semibold tracking-tight">Diagnóstico</span>
          <span className="text-neutral-500">Ctrl/⌘+Shift+D</span>
        </div>
        <button
          onClick={() => {
            setOpen(false);
            try {
              localStorage.setItem(STORAGE_KEY, "0");
            } catch {
              /* ignore */
            }
          }}
          className="rounded p-1 text-neutral-400 hover:bg-white/5 hover:text-white"
        >
          <X className="size-3.5" />
        </button>
      </div>

      <div className="grid grid-cols-3 gap-px bg-white/5 text-center">
        <Stat label="rota" value={pathname} mono />
        <Stat label="nav (ms)" value={navMs.toFixed(0)} />
        <Stat label="online" value={onlineManager.isOnline() ? "sim" : "não"} />
        <Stat label="renders rota" value={String(count)} />
        <Stat label="renders total" value={String(totalRenders)} />
        <Stat label="queries" value={`${queries.length} (${fetching}↻)`} />
      </div>

      <div className="border-t border-white/10 px-3 py-2 text-neutral-400">
        Cache: ~{(totalCacheBytes / 1024).toFixed(1)} KB
      </div>

      <ErrorsSection />
      <SsrErrorsSection />

      <div className="max-h-[260px] overflow-y-auto border-t border-white/10">
        <table className="w-full text-left">
          <thead className="sticky top-0 bg-neutral-950/95 text-[10px] uppercase tracking-wide text-neutral-500">
            <tr>
              <th className="px-3 py-1.5">queryKey</th>
              <th className="px-2 py-1.5">status</th>
              <th className="px-2 py-1.5 text-right">idade</th>
              <th className="px-3 py-1.5 text-right">kb</th>
            </tr>
          </thead>
          <tbody>
            {timings.length === 0 && (
              <tr>
                <td colSpan={4} className="px-3 py-4 text-center text-neutral-500">
                  Nenhuma query ativa
                </td>
              </tr>
            )}
            {timings
              .sort((a, b) => b.updatedAt - a.updatedAt)
              .map((t) => {
                const age = t.updatedAt ? Math.max(0, Date.now() - t.updatedAt) : 0;
                const ageLabel =
                  age < 1000
                    ? `${age}ms`
                    : age < 60_000
                      ? `${(age / 1000).toFixed(1)}s`
                      : `${(age / 60_000).toFixed(1)}m`;
                const isFetching = t.status.includes("fetching");
                return (
                  <tr key={t.key} className="border-t border-white/5">
                    <td
                      className="truncate px-3 py-1.5 font-mono text-[10px] text-neutral-300"
                      title={t.key}
                    >
                      {t.key.length > 36 ? t.key.slice(0, 36) + "…" : t.key}
                    </td>
                    <td className="px-2 py-1.5">
                      <span
                        className={
                          isFetching
                            ? "text-amber-300"
                            : t.status.startsWith("error")
                              ? "text-rose-400"
                              : "text-emerald-400"
                        }
                      >
                        {t.status}
                      </span>
                    </td>
                    <td className="px-2 py-1.5 text-right text-neutral-400">{ageLabel}</td>
                    <td className="px-3 py-1.5 text-right text-neutral-400">
                      {t.dataSize > 0 ? (t.dataSize / 1024).toFixed(1) : "—"}
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between border-t border-white/10 px-3 py-2 text-neutral-500">
        <button
          onClick={() => {
            renderCounts.clear();
            force((n) => n + 1);
          }}
          className="rounded px-2 py-1 hover:bg-white/5 hover:text-neutral-200"
        >
          zerar renders
        </button>
        <button
          onClick={() => {
            queryClient.invalidateQueries();
          }}
          className="rounded px-2 py-1 hover:bg-white/5 hover:text-neutral-200"
        >
          invalidar queries
        </button>
      </div>
    </div>
  );
}

function Stat({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="bg-neutral-950 px-2 py-2">
      <div className="text-[9px] uppercase tracking-wide text-neutral-500">{label}</div>
      <div
        className={`mt-0.5 truncate text-[11px] text-neutral-100 ${mono ? "font-mono" : ""}`}
        title={value}
      >
        {value}
      </div>
    </div>
  );
}

function useErrors(): readonly AppErrorEntry[] {
  return useSyncExternalStore(
    (cb) => subscribeErrors(cb),
    () => getErrors(),
    () => getErrors(),
  );
}

function ErrorsSection() {
  const errors = useErrors();
  const [expanded, setExpanded] = useState<string | null>(null);
  if (errors.length === 0) {
    return (
      <div className="flex items-center gap-2 border-t border-white/10 px-3 py-2 text-emerald-400/80">
        <AlertTriangle className="size-3" /> Sem erros capturados
      </div>
    );
  }
  return (
    <div className="border-t border-white/10">
      <div className="flex items-center justify-between px-3 py-1.5 text-rose-300">
        <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold">
          <AlertTriangle className="size-3" /> {errors.length} erro
          {errors.length === 1 ? "" : "s"}
        </span>
        <button
          onClick={() => clearErrors()}
          className="rounded px-1.5 py-0.5 text-[10px] text-neutral-400 hover:bg-white/5 hover:text-white"
        >
          limpar
        </button>
      </div>
      <ul className="max-h-[160px] overflow-y-auto">
        {errors.map((e) => {
          const isOpen = expanded === e.id;
          return (
            <li key={e.id} className="border-t border-white/5">
              <button
                onClick={() => setExpanded(isOpen ? null : e.id)}
                className="flex w-full items-start gap-2 px-3 py-1.5 text-left hover:bg-white/5"
              >
                <span className="mt-0.5 rounded bg-rose-500/15 px-1.5 py-0.5 text-[9px] font-semibold uppercase text-rose-300">
                  {e.source}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[11px] text-neutral-200">{e.message}</span>
                  <span className="text-[10px] text-neutral-500">
                    {new Date(e.at).toLocaleTimeString()}
                  </span>
                </span>
              </button>
              {isOpen && (
                <pre className="max-h-40 overflow-auto whitespace-pre-wrap break-all bg-black/40 px-3 py-2 text-[10px] text-neutral-400">
                  {e.stack ?? e.message}
                  {e.context ? "\n\nContext:\n" + JSON.stringify(e.context, null, 2) : ""}
                </pre>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

type SsrErrorLite = {
  id: string;
  at: number;
  fingerprint: string;
  severity: string;
  category: string;
  pathname?: string;
  method?: string;
  name?: string;
  message: string;
  routeFile?: string;
  loader?: string;
  stack?: string;
};

const ALL = "__all__";

const LIMIT_OPTIONS = [10, 25, 50, 100, 200];

function SsrErrorsSection() {
  const [errors, setErrors] = useState<SsrErrorLite[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [limit, setLimit] = useState(25);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [fSeverity, setFSeverity] = useState<string>(ALL);
  const [fCategory, setFCategory] = useState<string>(ALL);
  const [fRoute, setFRoute] = useState<string>(ALL);

  const load = async (nextOffset = offset, nextLimit = limit) => {
    setLoading(true);
    try {
      const r = await fetch(`/api/public/ssr-errors?limit=${nextLimit}&offset=${nextOffset}`, {
        headers: { accept: "application/json" },
      });
      if (!r.ok) return;
      const data = (await r.json()) as {
        errors: SsrErrorLite[];
        total?: number;
        offset?: number;
      };
      setErrors(data.errors ?? []);
      setTotal(data.total ?? data.errors?.length ?? 0);
      setOffset(data.offset ?? nextOffset);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(0, limit);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const clear = async () => {
    await fetch("/api/public/ssr-errors", { method: "DELETE" }).catch(() => {});
    setErrors([]);
    setTotal(0);
    setOffset(0);
  };

  const severities = Array.from(new Set(errors.map((e) => e.severity).filter(Boolean))).sort();
  const categories = Array.from(new Set(errors.map((e) => e.category).filter(Boolean))).sort();
  const routes = Array.from(
    new Set(errors.map((e) => e.pathname).filter((v): v is string => Boolean(v))),
  ).sort();

  const filtered = errors.filter(
    (e) =>
      (fSeverity === ALL || e.severity === fSeverity) &&
      (fCategory === ALL || e.category === fCategory) &&
      (fRoute === ALL || e.pathname === fRoute),
  );

  const resetFilters = () => {
    setFSeverity(ALL);
    setFCategory(ALL);
    setFRoute(ALL);
  };
  const hasFilters = fSeverity !== ALL || fCategory !== ALL || fRoute !== ALL;

  const page = Math.floor(offset / Math.max(1, limit)) + 1;
  const pageCount = Math.max(1, Math.ceil(total / Math.max(1, limit)));
  const canPrev = offset > 0;
  const canNext = offset + errors.length < total;

  const goPrev = () => load(Math.max(0, offset - limit), limit);
  const goNext = () => load(offset + limit, limit);
  const onLimitChange = (n: number) => {
    setLimit(n);
    load(0, n);
  };

  const selectCls =
    "max-w-[110px] truncate rounded border border-white/10 bg-neutral-900 px-1 py-0.5 text-[10px] text-neutral-200 hover:bg-white/5 focus:outline-none";

  return (
    <div className="border-t border-white/10">
      <div className="flex items-center justify-between px-3 py-1.5">
        <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-amber-300">
          <AlertTriangle className="size-3" /> SSR
          <span className="text-neutral-500">
            ({filtered.length}
            {filtered.length !== errors.length ? `/${errors.length}` : ""}
            {total > errors.length ? ` · ${total} total` : ""})
          </span>
        </span>
        <div className="flex gap-1">
          <button
            onClick={() => load(offset, limit)}
            disabled={loading}
            className="rounded px-1.5 py-0.5 text-[10px] text-neutral-400 hover:bg-white/5 hover:text-white disabled:opacity-50"
          >
            {loading ? "…" : "atualizar"}
          </button>
          <button
            onClick={clear}
            className="rounded px-1.5 py-0.5 text-[10px] text-neutral-400 hover:bg-white/5 hover:text-white"
          >
            limpar
          </button>
        </div>
      </div>
      {total > 0 && (
        <div className="flex items-center justify-between gap-2 px-3 pb-1.5 text-[10px] text-neutral-400">
          <div className="flex items-center gap-1">
            <span>por página</span>
            <select
              value={limit}
              onChange={(e) => onLimitChange(Number(e.target.value))}
              className={selectCls}
              title="Itens por página"
            >
              {LIMIT_OPTIONS.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={goPrev}
              disabled={!canPrev || loading}
              className="rounded px-1.5 py-0.5 hover:bg-white/5 hover:text-white disabled:opacity-40"
            >
              ‹
            </button>
            <span className="tabular-nums">
              {page}/{pageCount}
            </span>
            <button
              onClick={goNext}
              disabled={!canNext || loading}
              className="rounded px-1.5 py-0.5 hover:bg-white/5 hover:text-white disabled:opacity-40"
            >
              ›
            </button>
          </div>
        </div>
      )}
      {errors.length > 0 && (
        <div className="flex flex-wrap items-center gap-1 px-3 pb-1.5">
          <select
            value={fSeverity}
            onChange={(e) => setFSeverity(e.target.value)}
            className={selectCls}
            title="Severidade"
          >
            <option value={ALL}>severidade</option>
            {severities.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <select
            value={fCategory}
            onChange={(e) => setFCategory(e.target.value)}
            className={selectCls}
            title="Categoria"
          >
            <option value={ALL}>categoria</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <select
            value={fRoute}
            onChange={(e) => setFRoute(e.target.value)}
            className={selectCls}
            title="Rota"
          >
            <option value={ALL}>rota</option>
            {routes.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
          {hasFilters && (
            <button
              onClick={resetFilters}
              className="rounded px-1.5 py-0.5 text-[10px] text-neutral-400 hover:bg-white/5 hover:text-white"
            >
              limpar filtros
            </button>
          )}
        </div>
      )}
      {errors.length === 0 ? (
        <div className="px-3 py-1.5 text-[10px] text-emerald-400/80">Nenhum erro SSR no buffer</div>
      ) : filtered.length === 0 ? (
        <div className="px-3 py-1.5 text-[10px] text-neutral-500">
          Nenhum erro corresponde aos filtros
        </div>
      ) : (
        <ul className="max-h-[160px] overflow-y-auto">
          {filtered.map((e) => {
            const isOpen = expanded === e.id;
            return (
              <li key={e.id} className="border-t border-white/5">
                <button
                  onClick={() => setExpanded(isOpen ? null : e.id)}
                  className="flex w-full items-start gap-2 px-3 py-1.5 text-left hover:bg-white/5"
                >
                  <span
                    className={`mt-0.5 rounded px-1.5 py-0.5 text-[9px] font-semibold uppercase ${
                      e.severity === "fatal"
                        ? "bg-rose-500/20 text-rose-300"
                        : e.severity === "warning"
                          ? "bg-amber-500/20 text-amber-300"
                          : "bg-orange-500/15 text-orange-300"
                    }`}
                  >
                    {e.category}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[11px] text-neutral-200">
                      {e.name ? `${e.name}: ` : ""}
                      {e.message}
                    </span>
                    <span className="text-[10px] text-neutral-500">
                      {e.method ?? "GET"} {e.pathname ?? "?"} ·{" "}
                      {new Date(e.at).toLocaleTimeString()} · fp:{e.fingerprint}
                    </span>
                  </span>
                </button>
                {isOpen && (
                  <pre className="max-h-40 overflow-auto whitespace-pre-wrap break-all bg-black/40 px-3 py-2 text-[10px] text-neutral-400">
                    {e.routeFile ? `route: ${e.routeFile}\n` : ""}
                    {e.loader ? `loader: ${e.loader}\n` : ""}
                    {e.stack ?? e.message}
                  </pre>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
