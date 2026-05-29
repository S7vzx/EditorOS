import { createStart, createMiddleware } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";

import { recordSsrError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";

const errorMiddleware = createMiddleware().server(async ({ next }) => {
  try {
    return await next();
  } catch (error) {
    if (error != null && typeof error === "object" && "statusCode" in error) {
      throw error;
    }
    let request: Request | undefined;
    try {
      request = getRequest();
    } catch {
      // getRequest() may throw outside a request context — safe to ignore.
    }
    const entry = recordSsrError(error, { request });
    return new Response(renderErrorPage(entry.id), {
      status: 500,
      headers: {
        "content-type": "text/html; charset=utf-8",
        "x-ssr-error-id": entry.id,
      },
    });
  }
});

export const startInstance = createStart(() => ({
  requestMiddleware: [errorMiddleware],
}));
