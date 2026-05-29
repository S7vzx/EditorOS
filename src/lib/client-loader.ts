import type { QueryClient } from "@tanstack/react-query";

/**
 * Subset of TanStack Router's loader argument that the helper exposes.
 * Typed loosely on purpose so it stays assignable from the router's
 * generated `LoaderFnContext` type without us depending on it.
 */
export type ClientLoaderArgs = {
  context: { queryClient: QueryClient } & Record<string, unknown>;
  params: Record<string, string>;
};

/**
 * Wraps a route loader so it only runs in the browser, skipping during SSR.
 *
 * Useful when the loader (or anything it primes via the query cache) touches
 * `localStorage`, `window`, `document`, or other browser-only APIs that would
 * crash the SSR pass. On the server it resolves immediately with `undefined`;
 * on the client it runs normally.
 *
 * The returned function accepts `any` so it remains assignable to
 * TanStack Router's `loader` slot regardless of the route's generated
 * argument type. Inside your callback, destructure with `ClientLoaderArgs`
 * (or annotate the param) for typed access to `context.queryClient`.
 *
 * @example
 * export const Route = createFileRoute("/cliente/")({
 *   loader: clientOnlyLoader(async ({ context }) => {
 *     const owner = await context.queryClient.ensureQueryData(ownerQuery());
 *     context.queryClient.prefetchQuery(ownerDemandsQuery(owner.id));
 *   }),
 *   component: ClientPage,
 * });
 */
export function clientOnlyLoader<TResult>(
  fn: (args: ClientLoaderArgs) => TResult,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): (args: any) => TResult | undefined {
  return (args) => {
    if (typeof window === "undefined") return undefined;
    return fn(args as ClientLoaderArgs);
  };
}
