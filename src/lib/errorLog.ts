// Lightweight in-memory error log with pub/sub. Also mirrors to console.

export type AppErrorSource =
  | "react"
  | "window"
  | "promise"
  | "query"
  | "mutation"
  | "router"
  | "manual";

export type AppErrorEntry = {
  id: string;
  at: number;
  source: AppErrorSource;
  message: string;
  stack?: string;
  context?: Record<string, unknown>;
};

const MAX = 50;
const entries: AppErrorEntry[] = [];
const listeners = new Set<() => void>();

function notify() {
  for (const l of listeners) l();
}

export function logError(
  source: AppErrorSource,
  error: unknown,
  context?: Record<string, unknown>,
) {
  const err =
    error instanceof Error
      ? error
      : new Error(typeof error === "string" ? error : safeStringify(error));
  const entry: AppErrorEntry = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    at: Date.now(),
    source,
    message: err.message || "Erro desconhecido",
    stack: err.stack,
    context,
  };
  entries.unshift(entry);
  if (entries.length > MAX) entries.length = MAX;
  // eslint-disable-next-line no-console
  console.error(`[${source}]`, err, context ?? "");
  notify();
  return entry;
}

export function getErrors(): readonly AppErrorEntry[] {
  return entries;
}

export function clearErrors() {
  entries.length = 0;
  notify();
}

export function subscribeErrors(fn: () => void) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function safeStringify(v: unknown) {
  try {
    return JSON.stringify(v);
  } catch {
    return String(v);
  }
}

let installed = false;
export function installGlobalErrorHandlers() {
  if (installed || typeof window === "undefined") return;
  installed = true;
  window.addEventListener("error", (e) => {
    logError("window", e.error ?? e.message, {
      filename: e.filename,
      lineno: e.lineno,
      colno: e.colno,
    });
  });
  window.addEventListener("unhandledrejection", (e) => {
    logError("promise", e.reason, { kind: "unhandledrejection" });
  });
}
