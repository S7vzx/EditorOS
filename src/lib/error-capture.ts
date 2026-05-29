// Captures the original Error out-of-band so server.ts can recover the stack
// when h3 has already swallowed the throw into a generic 500 Response.
//
// Also keeps a small in-memory ring buffer of the most recent SSR failures
// (with request URL, route path, http method, timestamp, stack, sanitized
// headers and a stable fingerprint) so they can be inspected via
// /api/public/ssr-errors when debugging a blank-screen.

export type SsrErrorSeverity = "fatal" | "error" | "warning";
export type SsrErrorCategory = "module-init" | "loader" | "render" | "route-handler" | "unknown";

export type SsrErrorRecord = {
  id: string;
  at: number;
  fingerprint: string;
  severity: SsrErrorSeverity;
  category: SsrErrorCategory;
  url?: string;
  pathname?: string;
  method?: string;
  loader?: string;
  routeFile?: string;
  userAgent?: string;
  referer?: string;
  cfRay?: string;
  host?: string;
  headers?: Record<string, string>;
  message: string;
  name?: string;
  stack?: string;
  cause?: string;
  body?: string;
};

export type SsrErrorGroup = {
  fingerprint: string;
  count: number;
  firstSeen: number;
  lastSeen: number;
  sample: SsrErrorRecord;
};

let lastCapturedError: { error: unknown; at: number } | undefined;
const TTL_MS = 5_000;

const RING_SIZE = 200;
const ring: SsrErrorRecord[] = [];
const groupCounts = new Map<string, { count: number; firstSeen: number }>();

function record(error: unknown) {
  lastCapturedError = { error, at: Date.now() };
}

if (typeof globalThis.addEventListener === "function") {
  globalThis.addEventListener("error", (event) => record((event as ErrorEvent).error ?? event));
  globalThis.addEventListener("unhandledrejection", (event) =>
    record((event as PromiseRejectionEvent).reason),
  );
}

export function consumeLastCapturedError(): unknown {
  if (!lastCapturedError) return undefined;
  if (Date.now() - lastCapturedError.at > TTL_MS) {
    lastCapturedError = undefined;
    return undefined;
  }
  const { error } = lastCapturedError;
  lastCapturedError = undefined;
  return error;
}

function toMessage(error: unknown): string {
  if (error instanceof Error) return error.message || error.name || "Unknown error";
  if (typeof error === "string") return error;
  try {
    return JSON.stringify(error);
  } catch {
    return String(error);
  }
}

function topFrame(stack: string | undefined): string | undefined {
  if (!stack) return undefined;
  const lines = stack.split("\n").map((l) => l.trim());
  return lines.find((l) => l.startsWith("at "));
}

function extractLoader(stack: string | undefined): string | undefined {
  if (!stack) return undefined;
  const match = stack.match(
    /at\s+([^\s]+)\s+\(?[^)]*\/(routes\/[^)\s]+|lib\/[^)\s]+|integrations\/[^)\s]+)/,
  );
  if (match) return `${match[1]} (${match[2]})`;
  const fileMatch = stack.match(/\(?[^)]*\/(routes\/[^):\s]+)/);
  return fileMatch ? fileMatch[1] : undefined;
}

function extractRouteFile(stack: string | undefined): string | undefined {
  if (!stack) return undefined;
  const m = stack.match(/\/(routes\/[^):\s]+)/);
  return m ? m[1] : undefined;
}

function inferCategory(err: Error, pathname: string | undefined): SsrErrorCategory {
  const stack = err.stack ?? "";
  if (pathname?.startsWith("/api/")) return "route-handler";
  if (/\bloader\b/i.test(stack)) return "loader";
  if (/at\s+\S*render|renderToString|renderToReadableStream/.test(stack)) return "render";
  if (/at\s+<anonymous>\s+\(.*(?:server-entry|virtual:)/.test(stack)) return "module-init";
  return "unknown";
}

function inferSeverity(err: Error): SsrErrorSeverity {
  const msg = err.message?.toLowerCase() ?? "";
  if (msg.includes("cannot read") || msg.includes("is not a function") || msg.includes("undefined"))
    return "fatal";
  if (msg.includes("warning")) return "warning";
  return "error";
}

// Tiny FNV-1a 32-bit. Stable across cold starts — same input → same id.
function fingerprint(parts: string[]): string {
  const str = parts.filter(Boolean).join("|");
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = (h + ((h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24))) >>> 0;
  }
  return h.toString(16).padStart(8, "0");
}

// Strip secret-bearing headers; keep diagnostic ones only.
const SAFE_HEADER_KEYS = new Set([
  "user-agent",
  "referer",
  "accept",
  "accept-language",
  "cf-ray",
  "cf-ipcountry",
  "host",
  "x-forwarded-proto",
  "x-request-id",
]);

function snapshotHeaders(request: Request): Record<string, string> {
  const out: Record<string, string> = {};
  request.headers.forEach((value, key) => {
    if (SAFE_HEADER_KEYS.has(key.toLowerCase())) {
      out[key.toLowerCase()] = value.length > 256 ? value.slice(0, 256) : value;
    }
  });
  return out;
}

export type SsrErrorContext = {
  request?: Request;
  body?: string;
};

export function recordSsrError(error: unknown, ctx: SsrErrorContext = {}): SsrErrorRecord {
  const err = error instanceof Error ? error : new Error(toMessage(error));
  let pathname: string | undefined;
  let url: string | undefined;
  let method: string | undefined;
  let host: string | undefined;
  let headers: Record<string, string> | undefined;
  let userAgent: string | undefined;
  let referer: string | undefined;
  let cfRay: string | undefined;
  try {
    if (ctx.request) {
      url = ctx.request.url;
      method = ctx.request.method;
      const u = new URL(ctx.request.url);
      pathname = u.pathname;
      host = u.host;
      headers = snapshotHeaders(ctx.request);
      userAgent = headers["user-agent"];
      referer = headers["referer"];
      cfRay = headers["cf-ray"];
    }
  } catch {
    // ignore malformed URLs
  }

  const fp = fingerprint([err.name, err.message, topFrame(err.stack) ?? ""]);
  const now = Date.now();
  const prev = groupCounts.get(fp);
  groupCounts.set(fp, {
    count: (prev?.count ?? 0) + 1,
    firstSeen: prev?.firstSeen ?? now,
  });

  const entry: SsrErrorRecord = {
    id: `${now.toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    at: now,
    fingerprint: fp,
    severity: inferSeverity(err),
    category: inferCategory(err, pathname),
    url,
    pathname,
    method,
    loader: extractLoader(err.stack),
    routeFile: extractRouteFile(err.stack),
    userAgent,
    referer,
    cfRay,
    host,
    headers,
    message: err.message,
    name: err.name,
    stack: err.stack,
    cause: err.cause ? toMessage(err.cause) : undefined,
    body: ctx.body && ctx.body.length < 2048 ? ctx.body : undefined,
  };
  ring.unshift(entry);
  if (ring.length > RING_SIZE) ring.length = RING_SIZE;

  // Structured single-line log so Cloudflare Worker Logs stay grep-friendly,
  // followed by the raw Error so the stack is preserved in the dashboard.
  // eslint-disable-next-line no-console
  console.error(
    `[ssr-error] id=${entry.id} fp=${entry.fingerprint} ${entry.severity}/${entry.category} ${entry.method ?? "GET"} ${entry.pathname ?? "?"} — ${entry.name ?? "Error"}: ${entry.message}`,
    {
      url: entry.url,
      loader: entry.loader,
      routeFile: entry.routeFile,
      cfRay: entry.cfRay,
      cause: entry.cause,
    },
  );
  // eslint-disable-next-line no-console
  console.error(err);

  return entry;
}

export function getSsrErrors(): readonly SsrErrorRecord[] {
  return ring;
}

export function getSsrError(id: string): SsrErrorRecord | undefined {
  return ring.find((e) => e.id === id);
}

export function getSsrErrorsSince(ts: number): SsrErrorRecord[] {
  return ring.filter((e) => e.at >= ts);
}

export function getSsrErrorGroups(): SsrErrorGroup[] {
  const map = new Map<string, SsrErrorGroup>();
  for (const e of ring) {
    const meta = groupCounts.get(e.fingerprint);
    const g = map.get(e.fingerprint);
    if (!g) {
      map.set(e.fingerprint, {
        fingerprint: e.fingerprint,
        count: meta?.count ?? 1,
        firstSeen: meta?.firstSeen ?? e.at,
        lastSeen: e.at,
        sample: e,
      });
    } else {
      g.lastSeen = Math.max(g.lastSeen, e.at);
    }
  }
  return [...map.values()].sort((a, b) => b.lastSeen - a.lastSeen);
}

export function clearSsrErrors() {
  ring.length = 0;
  groupCounts.clear();
}

export function getLatestSsrErrorId(): string | undefined {
  return ring[0]?.id;
}
