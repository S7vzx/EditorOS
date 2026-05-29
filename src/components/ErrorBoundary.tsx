import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { logError } from "@/lib/errorLog";

type Props = {
  children: ReactNode;
  fallback?: (args: { error: Error; reset: () => void }) => ReactNode;
  label?: string;
};

type State = { error: Error | null };

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    logError("react", error, {
      label: this.props.label,
      componentStack: info.componentStack,
    });
  }

  reset = () => this.setState({ error: null });

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;
    if (this.props.fallback) return this.props.fallback({ error, reset: this.reset });

    return (
      <div className="flex min-h-[40vh] items-center justify-center p-6">
        <div className="max-w-md rounded-2xl border border-rose-500/20 bg-rose-500/5 p-6 text-center">
          <div className="mx-auto mb-3 grid size-10 place-items-center rounded-full bg-rose-500/15 text-rose-300">
            <AlertTriangle className="size-5" />
          </div>
          <h2 className="text-base font-semibold">Algo quebrou nesta área</h2>
          <p className="mt-1 line-clamp-3 text-sm text-muted-foreground">{error.message}</p>
          <button
            onClick={this.reset}
            className="mt-5 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:brightness-110"
          >
            <RotateCcw className="size-4" /> Tentar novamente
          </button>
        </div>
      </div>
    );
  }
}
