import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/configuracoes")({
  head: () => ({
    meta: [
      { title: "Configurações — EditorOS" },
      { name: "description", content: "Preferências de perfil, aparência e atalhos." },
    ],
  }),
  component: ConfigPage,
});

function ConfigPage() {
  const [notifications, setNotifications] = useState(true);
  const [autosave, setAutosave] = useState(true);
  const [compact, setCompact] = useState(false);

  return (
    <div className="mx-auto max-w-4xl space-y-8 p-6 md:p-10">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">Configurações</h1>
        <p className="mt-1 text-muted-foreground">Personalize sua experiência no EditorOS.</p>
      </div>

      {/* Profile */}
      <Section title="Perfil">
        <div className="flex items-center gap-5">
          <div className="size-16 rounded-full bg-gradient-to-br from-primary to-fuchsia-500 ring-4 ring-primary/10" />
          <div className="flex-1 space-y-2">
            <Field label="Nome">
              <input defaultValue="Rafael Editor" className="input" />
            </Field>
          </div>
        </div>
        <Field label="Email">
          <input defaultValue="rafael@editor.os" className="input" />
        </Field>
        <Field label="Função">
          <input defaultValue="Editor de vídeo & Designer de thumbnails" className="input" />
        </Field>
      </Section>

      {/* Preferences */}
      <Section title="Preferências">
        <Toggle
          label="Notificações desktop"
          desc="Receba alertas de deadlines e atualizações de projetos."
          value={notifications}
          onChange={setNotifications}
        />
        <Toggle
          label="Salvamento automático"
          desc="Salva suas alterações em tempo real."
          value={autosave}
          onChange={setAutosave}
        />
        <Toggle
          label="Modo compacto"
          desc="Reduz espaçamentos para telas pequenas."
          value={compact}
          onChange={setCompact}
        />
      </Section>

      {/* Shortcuts */}
      <Section title="Atalhos">
        <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
          {[
            { k: "⌘ K", d: "Abrir busca rápida" },
            { k: "⌘ N", d: "Novo projeto" },
            { k: "G então D", d: "Ir para Dashboard" },
            { k: "G então P", d: "Ir para Projetos" },
          ].map((s) => (
            <div
              key={s.k}
              className="flex items-center justify-between rounded-xl bg-neutral-900/40 px-4 py-3 ring-1 ring-neutral-800"
            >
              <span className="text-sm text-muted-foreground">{s.d}</span>
              <kbd className="rounded border border-neutral-800 bg-neutral-900 px-2 py-0.5 font-mono text-[10px]">
                {s.k}
              </kbd>
            </div>
          ))}
        </div>
      </Section>

      <div className="flex justify-end">
        <button
          onClick={() => toast.success("Configurações salvas")}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground ring-2 ring-primary/20 transition hover:brightness-110"
        >
          Salvar alterações
        </button>
      </div>

      <style>{`
        .input { width:100%; background:#171717; border:1px solid rgba(64,64,64,0.6); border-radius:10px; padding:10px 12px; font-size:14px; outline:none; color:inherit; transition:border-color .2s; }
        .input:focus { border-color: color-mix(in oklab, var(--primary) 50%, transparent); }
      `}</style>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-5 rounded-[28px] bg-surface p-8 ring-1 ring-black/5">
      <h2 className="text-lg font-medium tracking-tight">{title}</h2>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
        {label}
      </span>
      {children}
    </label>
  );
}

function Toggle({
  label,
  desc,
  value,
  onChange,
}: {
  label: string;
  desc: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{desc}</p>
      </div>
      <button
        onClick={() => onChange(!value)}
        className={cn(
          "relative h-6 w-11 rounded-full transition",
          value ? "bg-primary" : "bg-neutral-700",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 size-5 rounded-full bg-white transition-transform",
            value ? "translate-x-5" : "translate-x-0.5",
          )}
        />
      </button>
    </div>
  );
}
