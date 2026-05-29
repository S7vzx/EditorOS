import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { AppSidebar } from "@/components/editoros/AppSidebar";
import { AppTopbar } from "@/components/editoros/AppTopbar";

export const Route = createFileRoute("/_app")({
  component: AppLayout,
  notFoundComponent: () => (
    <div className="flex h-screen items-center justify-center bg-background text-foreground">
      <div className="text-center">
        <h1 className="text-2xl font-semibold">Página não encontrada</h1>
        <Link to="/" className="mt-4 inline-block text-primary hover:underline">
          Voltar ao Dashboard
        </Link>
      </div>
    </div>
  ),
  errorComponent: ({ error, reset }) => (
    <div className="flex h-screen items-center justify-center bg-background text-foreground">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold">Algo deu errado</h1>
        <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
        <button
          onClick={reset}
          className="mt-4 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
        >
          Tentar novamente
        </button>
      </div>
    </div>
  ),
});

function AppLayout() {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-background text-foreground">
      <AppSidebar />
      <main className="flex flex-1 flex-col overflow-hidden">
        <AppTopbar />
        <div className="flex-1 overflow-y-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
