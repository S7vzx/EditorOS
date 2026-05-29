import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Send, Video, ListChecks } from "lucide-react";
import { toast } from "sonner";
import { createDemand, type DemandKind } from "@/lib/db";
import { ownerQuery, queryKeys } from "@/lib/queries";
import { clientOnlyLoader } from "@/lib/client-loader";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/cliente/novo")({
  head: () => ({
    meta: [
      { title: "Adicionar — EditorOS Planejamento" },
      {
        name: "description",
        content: "Adicione uma gravação, postagem programada ou demanda para o editor.",
      },
    ],
  }),
  loader: clientOnlyLoader(({ context }) => {
    context.queryClient.ensureQueryData(ownerQuery());
  }),
  component: NewItemPage,
});

type Priority = "baixa" | "media" | "alta";

const KINDS: {
  id: DemandKind;
  label: string;
  desc: string;
  icon: typeof Video;
}[] = [
  {
    id: "gravacao",
    label: "Gravação",
    desc: "Bloque um dia/horário para gravar",
    icon: Video,
  },
  {
    id: "postagem",
    label: "Postagem",
    desc: "Programe um horário de publicação",
    icon: Send,
  },
  {
    id: "demanda",
    label: "Demanda",
    desc: "Pedido para o editor entregar",
    icon: ListChecks,
  },
];

const PLATFORMS = ["YouTube", "Instagram", "TikTok", "Shorts", "Reels", "LinkedIn", "X", "Outro"];

function NewItemPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data: owner } = useQuery(ownerQuery());
  const ownerId = owner?.id ?? null;

  const [kind, setKind] = useState<DemandKind>("gravacao");
  const [title, setTitle] = useState("");
  const [scheduledDate, setScheduledDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [scheduledTime, setScheduledTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [location, setLocation] = useState("");
  const [platform, setPlatform] = useState("YouTube");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<Priority>("media");
  const [type, setType] = useState<"video" | "thumbnail" | "outro">("video");
  const [refs, setRefs] = useState("");

  const submit = useMutation({
    mutationFn: async () => {
      if (!ownerId) throw new Error("Painel não inicializado");
      return createDemand({
        client_id: ownerId,
        title: title.trim(),
        kind,
        type: kind === "demanda" ? type : "video",
        scheduled_date: scheduledDate,
        scheduled_time: scheduledTime || null,
        end_time: kind === "gravacao" && endTime ? endTime : null,
        location: kind === "gravacao" ? location.trim() || null : null,
        platform: kind === "postagem" ? platform : null,
        description: description.trim() || null,
        priority,
        refs: refs.trim() || null,
        status: kind === "demanda" ? "pendente" : "aprovado",
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["owner-demands"] });
      qc.invalidateQueries({ queryKey: queryKeys.demands });
      toast.success("Adicionado à agenda");
      navigate({ to: "/cliente" });
    },
    onError: (e) =>
      toast.error("Não consegui salvar", {
        description: e instanceof Error ? e.message : "Tente novamente.",
      }),
  });

  const canSubmit = !!ownerId && title.trim() && scheduledDate && !submit.isPending;

  return (
    <div className="mx-auto max-w-3xl space-y-8 p-6 md:p-10">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">Adicionar à agenda</h1>
        <p className="text-muted-foreground">Escolha o tipo, defina o horário e pronto.</p>
      </header>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {KINDS.map((k) => {
          const Icon = k.icon;
          const active = kind === k.id;
          return (
            <button
              key={k.id}
              type="button"
              onClick={() => setKind(k.id)}
              className={cn(
                "flex flex-col items-start gap-2 rounded-2xl p-4 text-left ring-1 transition",
                active
                  ? "bg-primary/10 ring-primary/40"
                  : "bg-surface ring-black/5 hover:ring-primary/20",
              )}
            >
              <span
                className={cn(
                  "grid size-9 place-items-center rounded-xl",
                  active ? "bg-primary text-primary-foreground" : "bg-neutral-900",
                )}
              >
                <Icon className="size-4" />
              </span>
              <span className="text-sm font-semibold">{k.label}</span>
              <span className="text-xs text-muted-foreground">{k.desc}</span>
            </button>
          );
        })}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (canSubmit) submit.mutate();
        }}
        className="space-y-6 rounded-[28px] bg-surface p-6 ring-1 ring-black/5 md:p-8"
      >
        <div className="space-y-1.5">
          <Label htmlFor="title">Título</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={
              kind === "gravacao"
                ? "Ex: Gravar curso de finanças aula 03"
                : kind === "postagem"
                  ? "Ex: Publicar Reels do lançamento"
                  : "Ex: Editar vídeo aula 03"
            }
            required
          />
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="space-y-1.5">
            <Label htmlFor="date">Data</Label>
            <Input
              id="date"
              type="date"
              value={scheduledDate}
              onChange={(e) => setScheduledDate(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="time">{kind === "gravacao" ? "Início" : "Horário"}</Label>
            <Input
              id="time"
              type="time"
              value={scheduledTime}
              onChange={(e) => setScheduledTime(e.target.value)}
            />
          </div>
          {kind === "gravacao" ? (
            <div className="space-y-1.5">
              <Label htmlFor="end">Fim (opcional)</Label>
              <Input
                id="end"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </div>
          ) : kind === "postagem" ? (
            <div className="space-y-1.5">
              <Label>Plataforma</Label>
              <Select value={platform} onValueChange={setPlatform}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PLATFORMS.map((p) => (
                    <SelectItem key={p} value={p}>
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <div className="space-y-1.5">
              <Label>Tipo</Label>
              <Select
                value={type}
                onValueChange={(v) => setType(v as "video" | "thumbnail" | "outro")}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="video">Vídeo</SelectItem>
                  <SelectItem value="thumbnail">Thumbnail</SelectItem>
                  <SelectItem value="outro">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {kind === "gravacao" && (
          <div className="space-y-1.5">
            <Label htmlFor="location">Local (opcional)</Label>
            <Input
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Estúdio, home office, externa..."
            />
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Prioridade</Label>
            <Select value={priority} onValueChange={(v) => setPriority(v as Priority)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="baixa">Baixa</SelectItem>
                <SelectItem value="media">Média</SelectItem>
                <SelectItem value="alta">Alta</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="refs">Links (opcional)</Label>
            <Input
              id="refs"
              value={refs}
              onChange={(e) => setRefs(e.target.value)}
              placeholder="Drive, Frame.io, roteiro..."
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="desc">Notas</Label>
          <Textarea
            id="desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={
              kind === "gravacao"
                ? "Pauta, convidados, equipamento..."
                : kind === "postagem"
                  ? "Legenda, hashtags, observações..."
                  : "Descreva o que precisa ser entregue."
            }
            rows={5}
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-neutral-800/60 pt-6">
          <p className="text-xs text-muted-foreground">
            {kind === "demanda"
              ? "Será enviado como pedido pendente para o editor aprovar."
              : "Aparece direto na sua agenda e no calendário do editor."}
          </p>
          <button
            type="submit"
            disabled={!canSubmit}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground ring-2 ring-primary/20 transition hover:brightness-110 disabled:opacity-50"
          >
            {submit.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Send className="size-4" />
            )}
            Salvar
          </button>
        </div>
      </form>
    </div>
  );
}
