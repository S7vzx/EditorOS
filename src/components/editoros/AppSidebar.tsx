import { Link, useRouterState } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  LayoutGrid,
  FolderKanban,
  Inbox,
  Sparkles,
  Library,
  MessageSquareCode,
  Workflow,
  Calendar,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { demandsQuery } from "@/lib/queries";

const items = [
  { to: "/", label: "Dashboard", icon: LayoutGrid },
  { to: "/projetos", label: "Projetos", icon: FolderKanban },
  { to: "/pedidos", label: "Pedidos", icon: Inbox, badge: true as const },
  { to: "/thumb-ai", label: "Thumb AI", icon: Sparkles },
  { to: "/assets", label: "Assets", icon: Library },
  { to: "/prompt-vault", label: "Prompt Vault", icon: MessageSquareCode },
  { to: "/workflow", label: "Workflow", icon: Workflow },
  { to: "/calendario", label: "Calendário", icon: Calendar },
] as const;

export function AppSidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  // Deriva do cache compartilhado de "demands": sem refetch extra,
  // só re-renderiza quando a contagem realmente muda.
  const { data: pendingCount = 0 } = useQuery({
    ...demandsQuery(),
    select: (rows) =>
      rows.filter((d) => d.status === "pendente" && (d.kind ?? "demanda") === "demanda").length,
  });

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-neutral-900/70 bg-background p-6 md:flex">
      <Link to="/" className="mb-10 flex items-center gap-3 px-2">
        <span className="grid size-8 place-items-center rounded-lg bg-primary ring-4 ring-primary/10">
          <span className="size-3 rounded-sm bg-background" />
        </span>
        <span className="text-lg font-medium tracking-tight">EditorOS</span>
      </Link>

      <nav className="flex-1 space-y-1">
        {items.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.to;
          const showBadge = "badge" in item && item.badge && pendingCount > 0;
          return (
            <Link
              key={item.to}
              to={item.to}
              preload="intent"
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-neutral-900 text-foreground ring-1 ring-black/5"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon className="size-4 shrink-0" strokeWidth={2} />
              <span className="flex-1">{item.label}</span>
              {showBadge && (
                <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-semibold text-primary-foreground">
                  {pendingCount}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <Link
        to="/configuracoes"
        preload="intent"
        className={cn(
          "mt-auto flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
          pathname === "/configuracoes"
            ? "bg-neutral-900 text-foreground ring-1 ring-black/5"
            : "text-muted-foreground hover:text-foreground",
        )}
      >
        <Settings className="size-4 shrink-0" strokeWidth={2} />
        <span>Configurações</span>
      </Link>
    </aside>
  );
}
