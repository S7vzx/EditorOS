import { Link, useNavigate } from "@tanstack/react-router";
import { Search, Plus, UserCircle2 } from "lucide-react";

export function AppTopbar() {
  const navigate = useNavigate();
  return (
    <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-neutral-900/70 bg-background/80 px-6 backdrop-blur-md md:px-10">
      <div className="group relative w-full max-w-md">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" />
        <input
          type="text"
          placeholder="Pesquisar projetos, pedidos, assets..."
          className="w-full rounded-lg bg-neutral-900/40 py-1.5 pl-10 pr-16 text-sm outline-none ring-1 ring-neutral-800 transition-all focus:bg-neutral-900 focus:ring-primary/50"
        />
        <kbd className="absolute right-3 top-1/2 hidden -translate-y-1/2 rounded border border-neutral-800 px-1.5 py-0.5 text-[10px] text-muted-foreground sm:inline">
          ⌘K
        </kbd>
      </div>

      <div className="ml-4 flex items-center gap-3">
        <Link
          to="/cliente"
          className="hidden items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium text-muted-foreground ring-1 ring-neutral-800 transition hover:text-foreground hover:ring-primary/40 sm:inline-flex"
        >
          <UserCircle2 className="size-3.5" /> Painel do cliente
        </Link>
        <button
          onClick={() => navigate({ to: "/projetos" })}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground ring-2 ring-primary/20 transition active:scale-95 hover:brightness-110"
        >
          <Plus className="size-4" strokeWidth={2.5} />
          <span className="hidden sm:inline">Novo Projeto</span>
        </button>
        <div className="size-8 rounded-full border border-neutral-700 bg-gradient-to-br from-neutral-700 to-neutral-900" />
      </div>
    </header>
  );
}
