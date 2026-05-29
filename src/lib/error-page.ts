// Self-contained HTML fallback. MUST NOT import app code — the same
// module-init failure that triggered this page could break any dependency.

function escape(s: string): string {
  return s.replace(/[&<>"']/g, (c) =>
    c === "&" ? "&amp;" : c === "<" ? "&lt;" : c === ">" ? "&gt;" : c === '"' ? "&quot;" : "&#39;",
  );
}

export function renderErrorPage(errorId?: string): string {
  const ref = errorId ? `<p class="ref">Código do erro: <code>${escape(errorId)}</code></p>` : "";
  return `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <title>Algo deu errado — EditorOS</title>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="robots" content="noindex" />
    <style>
      :root { color-scheme: dark; }
      * { box-sizing: border-box; }
      html, body { height: 100%; }
      body {
        margin: 0;
        font: 15px/1.5 -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif;
        background: #0a0a0a;
        color: #fafafa;
        display: grid;
        place-items: center;
        padding: 1.5rem;
      }
      .card {
        max-width: 28rem;
        width: 100%;
        text-align: center;
        padding: 2rem;
        background: rgba(244, 63, 94, 0.05);
        border: 1px solid rgba(244, 63, 94, 0.2);
        border-radius: 1.25rem;
      }
      .icon {
        width: 2.5rem;
        height: 2.5rem;
        margin: 0 auto 0.75rem;
        display: grid;
        place-items: center;
        border-radius: 999px;
        background: rgba(244, 63, 94, 0.15);
        color: #fda4af;
        font-size: 1.25rem;
      }
      h1 { font-size: 1.125rem; margin: 0 0 0.5rem; font-weight: 600; }
      p { color: #a3a3a3; margin: 0 0 1rem; font-size: 0.875rem; }
      .ref { font-size: 0.75rem; color: #737373; margin-bottom: 1.5rem; }
      .ref code { background: rgba(255,255,255,0.06); padding: 2px 6px; border-radius: 4px; font-size: 0.75rem; }
      .actions { display: flex; gap: 0.5rem; justify-content: center; flex-wrap: wrap; }
      button, a {
        padding: 0.6rem 1.1rem;
        border-radius: 0.5rem;
        font: inherit;
        font-size: 0.875rem;
        font-weight: 600;
        cursor: pointer;
        text-decoration: none;
        border: 1px solid transparent;
        display: inline-flex;
        align-items: center;
        gap: 0.4rem;
        transition: filter 0.15s, background 0.15s;
      }
      .primary { background: #fafafa; color: #0a0a0a; }
      .primary:hover { filter: brightness(0.9); }
      .secondary { background: #171717; color: #fafafa; border-color: rgba(255,255,255,0.1); }
      .secondary:hover { background: #262626; }
    </style>
  </head>
  <body>
    <div class="card" role="alert">
      <div class="icon" aria-hidden="true">!</div>
      <h1>Não foi possível carregar a página</h1>
      <p>Tivemos um problema ao preparar esta tela. Recarregue para tentar novamente ou volte para o início.</p>
      ${ref}
      <div class="actions">
        <button class="primary" onclick="location.reload()" type="button">Recarregar</button>
        <a class="secondary" href="/">Ir para o início</a>
      </div>
    </div>
  </body>
</html>`;
}
