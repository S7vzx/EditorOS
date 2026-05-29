import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * SSR-safety guard rails.
 *
 * These tests statically scan every route file under `src/routes/` and assert
 * two invariants that previously broke our SSR pass:
 *
 *   1. No module-level reference to a browser-only global
 *      (`window`, `document`, `localStorage`, `sessionStorage`, `navigator`).
 *      Module-level code runs on every SSR pass — touching these crashes.
 *
 *   2. Every `loader:` is either wrapped in `clientOnlyLoader(...)` or does
 *      not reference a browser-only global in its body. Loaders run on BOTH
 *      server and client; the only safe way to read `localStorage` from one
 *      is to opt out of SSR via `clientOnlyLoader`.
 *
 * The scan is intentionally lexical (no full TS parse) — it strips comments
 * and string literals so matches inside strings don't cause false positives,
 * then walks the source character-by-character to track brace depth and
 * find loader bodies.
 */

const ROUTES_DIR = resolve(__dirname, "../routes");
const BROWSER_GLOBALS = [
  "window",
  "document",
  "localStorage",
  "sessionStorage",
  "navigator",
] as const;

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (/\.(ts|tsx)$/.test(entry)) out.push(full);
  }
  return out;
}

/** Replace JS/TS comments and string literals with whitespace of equal length. */
function stripCommentsAndStrings(src: string): string {
  const out = src.split("");
  let i = 0;
  while (i < out.length) {
    const c = out[i];
    const n = out[i + 1];
    // line comment
    if (c === "/" && n === "/") {
      while (i < out.length && out[i] !== "\n") {
        out[i] = " ";
        i++;
      }
      continue;
    }
    // block comment
    if (c === "/" && n === "*") {
      while (i < out.length && !(out[i] === "*" && out[i + 1] === "/")) {
        if (out[i] !== "\n") out[i] = " ";
        i++;
      }
      if (i < out.length) {
        out[i] = " ";
        out[i + 1] = " ";
        i += 2;
      }
      continue;
    }
    // strings + template literals
    if (c === '"' || c === "'" || c === "`") {
      const quote = c;
      out[i] = " ";
      i++;
      while (i < out.length) {
        if (out[i] === "\\") {
          out[i] = " ";
          out[i + 1] = " ";
          i += 2;
          continue;
        }
        if (out[i] === quote) {
          out[i] = " ";
          i++;
          break;
        }
        if (out[i] !== "\n") out[i] = " ";
        i++;
      }
      continue;
    }
    i++;
  }
  return out.join("");
}

/** Return character offsets where brace depth is 0 (i.e. module scope). */
function moduleLevelMatches(cleaned: string, pattern: RegExp): number[] {
  const positions: number[] = [];
  let depth = 0;
  const matches = [...cleaned.matchAll(pattern)];
  // Pre-compute depth at every index lazily
  let cursor = 0;
  for (const match of matches) {
    while (cursor < (match.index ?? 0)) {
      const ch = cleaned[cursor];
      if (ch === "{" || ch === "(" || ch === "[") depth++;
      else if (ch === "}" || ch === ")" || ch === "]") depth--;
      cursor++;
    }
    if (depth === 0) positions.push(match.index ?? 0);
  }
  return positions;
}

/** Extract every `loader: (...) => { ... }` or `loader: async (...) => { ... }` body. */
function extractLoaderBodies(cleaned: string): { body: string; raw: string }[] {
  const bodies: { body: string; raw: string }[] = [];
  const loaderRe = /\bloader\s*:\s*/g;
  let match: RegExpExecArray | null;
  while ((match = loaderRe.exec(cleaned))) {
    let i = match.index + match[0].length;
    // Skip optional `clientOnlyLoader(` or `async ` etc — capture the *expression*
    // following `loader:` up to the next top-level comma in the surrounding object.
    let depth = 0;
    const start = i;
    while (i < cleaned.length) {
      const ch = cleaned[i];
      if (ch === "{" || ch === "(" || ch === "[") depth++;
      else if (ch === "}" || ch === ")" || ch === "]") {
        if (depth === 0) break;
        depth--;
      } else if (ch === "," && depth === 0) break;
      i++;
    }
    const raw = cleaned.slice(start, i);
    bodies.push({ body: raw, raw });
  }
  return bodies;
}

const files = walk(ROUTES_DIR).filter((f) => !f.endsWith(".gen.ts"));

describe("SSR safety: route files", () => {
  it("finds route files to scan", () => {
    expect(files.length).toBeGreaterThan(0);
  });

  for (const file of files) {
    const rel = relative(resolve(__dirname, "../.."), file);
    const cleaned = stripCommentsAndStrings(readFileSync(file, "utf8"));

    it(`${rel} — no module-level browser-global access`, () => {
      for (const global of BROWSER_GLOBALS) {
        // Match `global.` or `global[` or `global)` at word boundary,
        // but NOT inside `typeof window` guards.
        const pattern = new RegExp(`(?<!typeof\\s)\\b${global}\\b`, "g");
        const offsets = moduleLevelMatches(cleaned, pattern);
        expect(
          offsets,
          `${rel} references \`${global}\` at module scope (offsets: ${offsets.join(
            ", ",
          )}). Move it into useEffect, an event handler, or a <ClientOnly> block.`,
        ).toHaveLength(0);
      }
    });

    it(`${rel} — loaders are SSR-safe`, () => {
      const loaders = extractLoaderBodies(cleaned);
      for (const { body } of loaders) {
        const wrapped = /\bclientOnlyLoader\s*\(/.test(body);
        const hasGuard = /typeof\s+window\s*===\s*["']undefined["']/.test(body);
        const touchesBrowser = BROWSER_GLOBALS.some((g) =>
          new RegExp(`(?<!typeof\\s)\\b${g}\\b`).test(body),
        );
        // A loader may also indirectly touch localStorage via helpers like
        // `getOrCreateOwner()`. We treat ANY un-wrapped loader as suspicious
        // when used in routes that read owner data — flag here, fix at source.
        const callsOwnerHelper = /\bownerQuery\s*\(|\bgetOrCreateOwner\s*\(/.test(body);

        if (touchesBrowser || callsOwnerHelper) {
          expect(
            wrapped || hasGuard,
            `${rel} has a loader that touches a browser API (or calls ownerQuery/getOrCreateOwner) without \`clientOnlyLoader(...)\`. Wrap it: \`loader: clientOnlyLoader((args) => ...)\`.`,
          ).toBe(true);
        }
      }
    });
  }
});

describe("SSR safety: clientOnlyLoader helper exists", () => {
  it("exports clientOnlyLoader from src/lib/client-loader.ts", () => {
    const src = readFileSync(resolve(__dirname, "../lib/client-loader.ts"), "utf8");
    expect(src).toMatch(/export\s+function\s+clientOnlyLoader\b/);
    expect(src).toMatch(/typeof\s+window\s*===\s*["']undefined["']/);
  });
});
