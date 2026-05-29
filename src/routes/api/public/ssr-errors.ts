import { createFileRoute } from "@tanstack/react-router";
import {
  clearSsrErrors,
  getSsrError,
  getSsrErrors,
  getSsrErrorGroups,
  getSsrErrorsSince,
} from "@/lib/error-capture";

// Debug endpoint for the most recent SSR errors captured by `recordSsrError`.
// No PII is stored — only request URLs, route hints, sanitized headers and stacks.
//
// Query params:
//   ?id=<errorId>          → single record (full detail)
//   ?groups=1              → aggregated by fingerprint (count, firstSeen, lastSeen)
//   ?since=<ms epoch>      → only records at-or-after timestamp
//   ?limit=<n>             → cap list length (default all)
//   ?pretty=1              → JSON.stringify with 2-space indent
//
// DELETE clears the ring buffer.
export const Route = createFileRoute("/api/public/ssr-errors")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const pretty = url.searchParams.get("pretty") === "1";

        const respond = (payload: unknown, status = 200) =>
          new Response(JSON.stringify(payload, null, pretty ? 2 : undefined), {
            status,
            headers: { "content-type": "application/json; charset=utf-8" },
          });

        const id = url.searchParams.get("id");
        if (id) {
          const entry = getSsrError(id);
          if (!entry) return respond({ error: "not_found", id }, 404);
          return respond(entry);
        }

        if (url.searchParams.get("groups") === "1") {
          const groups = getSsrErrorGroups();
          return respond({ count: groups.length, groups });
        }

        const sinceParam = url.searchParams.get("since");
        const since = sinceParam ? Number(sinceParam) : 0;
        const all = since > 0 ? getSsrErrorsSince(since) : [...getSsrErrors()];
        const total = all.length;

        const offsetParam = url.searchParams.get("offset");
        const offset = offsetParam ? Math.max(0, Number(offsetParam)) : 0;
        const limitParam = url.searchParams.get("limit");
        const limitRaw = limitParam ? Number(limitParam) : total;
        const limit = Number.isFinite(limitRaw) ? Math.max(0, Math.min(limitRaw, total)) : total;

        const errors = all.slice(offset, offset + limit);
        const nextOffset = offset + errors.length < total ? offset + errors.length : null;

        return respond({
          count: errors.length,
          total,
          offset,
          limit,
          nextOffset,
          totalGroups: getSsrErrorGroups().length,
          errors,
        });
      },
      DELETE: async () => {
        clearSsrErrors();
        return new Response(null, { status: 204 });
      },
    },
  },
});
