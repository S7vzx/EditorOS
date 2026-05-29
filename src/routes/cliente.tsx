import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { UserCircle2, Plus, CalendarDays } from "lucide-react";

export const Route = createFileRoute("/cliente")({
  head: () => ({
    meta: [
      { title: "Planejamento — EditorOS" },
      {
        name: "description",
        content:
          "Sua central de planejamento: demandas, dias de gravação e horários de postagem em um só lugar.",
      },
    ],
  }),
  component: ClientLayout,
});

function ClientLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-10 border-b border-neutral-900/70 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link to="/cliente" className="flex items-center gap-3">
            <span className="grid size-8 place-items-center rounded-lg bg-primary ring-4 ring-primary/10">
              <span className="size-3 rounded-sm bg-background" />
            </span>
            <div>
              <span className="text-base font-medium tracking-tight">EditorOS</span>
              <span className="ml-2 text-xs text-muted-foreground">Planejamento</span>
            </div>
          </Link>
          <nav className="flex items-center gap-1.5 text-sm">
            <Link
              to="/cliente"
              activeOptions={{ exact: true }}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition ${
                pathname === "/cliente"
                  ? "bg-neutral-900 text-foreground ring-1 ring-black/5"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <CalendarDays className="size-4" /> Agenda
            </Link>
            <Link
              to="/cliente/novo"
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition ${
                pathname === "/cliente/novo"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Plus className="size-4" /> Adicionar
            </Link>
            <Link
              to="/"
              className="ml-2 hidden items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs text-muted-foreground ring-1 ring-neutral-800 transition hover:text-foreground sm:inline-flex"
            >
              <UserCircle2 className="size-3.5" /> Painel do editor
            </Link>
          </nav>
        </div>
      </header>
      <main>
        <Outlet />
      </main>
    </div>
  );
}
