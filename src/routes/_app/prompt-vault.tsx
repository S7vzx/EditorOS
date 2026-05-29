import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, useEffect } from "react";
import { Heart, Search, Copy, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { initialPrompts, PROMPT_CATEGORIES, PROMPT_LABEL, type Prompt } from "@/data/mock";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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

export const Route = createFileRoute("/_app/prompt-vault")({
  head: () => ({
    meta: [
      { title: "Prompt Vault — EditorOS" },
      {
        name: "description",
        content: "Biblioteca premium de prompts de IA para thumbs, roteiro, copy e edição.",
      },
    ],
  }),
  component: PromptVaultPage,
});

function PromptVaultPage() {
  const [cat, setCat] = useState<Prompt["category"] | "todos">("todos");
  const [query, setQuery] = useState("");

  // Carrega do LocalStorage com fallback ao mock
  const [prompts, setPrompts] = useState<Prompt[]>(() => {
    if (typeof window === "undefined") return initialPrompts;
    const saved = localStorage.getItem("editoros:prompts");
    return saved ? JSON.parse(saved) : initialPrompts;
  });

  // Salva no LocalStorage
  useEffect(() => {
    localStorage.setItem("editoros:prompts", JSON.stringify(prompts));
  }, [prompts]);

  // Estados do Modal
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formId, setFormId] = useState<string | null>(null); // null = criar, string = editar
  const [formTitle, setFormTitle] = useState("");
  const [formCategory, setFormCategory] = useState<Prompt["category"]>("thumbnails");
  const [formBody, setFormBody] = useState("");

  const filtered = useMemo(
    () =>
      prompts.filter(
        (p) =>
          (cat === "todos" || p.category === cat) &&
          (p.title.toLowerCase().includes(query.toLowerCase()) ||
            p.body.toLowerCase().includes(query.toLowerCase())),
      ),
    [prompts, cat, query],
  );

  const toggleFav = (id: string) =>
    setPrompts((prev) => prev.map((p) => (p.id === id ? { ...p, favorite: !p.favorite } : p)));

  const copy = (body: string) => {
    navigator.clipboard.writeText(body);
    toast.success("Prompt copiado");
  };

  const openCreate = () => {
    setFormId(null);
    setFormTitle("");
    setFormCategory("thumbnails");
    setFormBody("");
    setIsFormOpen(true);
  };

  const openEdit = (p: Prompt) => {
    setFormId(p.id);
    setFormTitle(p.title);
    setFormCategory(p.category);
    setFormBody(p.body);
    setIsFormOpen(true);
  };

  const handleSave = () => {
    if (!formTitle.trim() || !formBody.trim()) {
      toast.error("Preencha o título e o conteúdo do prompt.");
      return;
    }

    if (formId) {
      // Atualização
      setPrompts((prev) =>
        prev.map((p) =>
          p.id === formId ? { ...p, title: formTitle, category: formCategory, body: formBody } : p,
        ),
      );
      toast.success("Prompt atualizado com sucesso!");
    } else {
      // Criação
      const newPrompt: Prompt = {
        id: `pr-${Date.now()}`,
        title: formTitle,
        category: formCategory,
        body: formBody,
        favorite: false,
      };
      setPrompts((prev) => [newPrompt, ...prev]);
      toast.success("Novo prompt criado!");
    }
    setIsFormOpen(false);
  };

  const handleDelete = (id: string) => {
    setPrompts((prev) => prev.filter((p) => p.id !== id));
    toast.success("Prompt excluído.");
  };

  return (
    <div className="mx-auto max-w-7xl space-y-8 p-6 md:p-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">Prompt Vault</h1>
          <p className="mt-1 text-muted-foreground">Sua biblioteca pessoal de prompts de IA.</p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground ring-2 ring-primary/20 transition active:scale-95 hover:brightness-110"
        >
          <Plus className="size-4" /> Novo prompt
        </button>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
        {/* Categories */}
        <aside className="space-y-1 lg:col-span-1">
          <CatRow
            label="Todos"
            count={prompts.length}
            active={cat === "todos"}
            onClick={() => setCat("todos")}
          />
          {PROMPT_CATEGORIES.map((c) => (
            <CatRow
              key={c}
              label={PROMPT_LABEL[c]}
              count={prompts.filter((p) => p.category === c).length}
              active={cat === c}
              onClick={() => setCat(c)}
            />
          ))}
        </aside>

        {/* List */}
        <div className="space-y-4 lg:col-span-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar prompt..."
              className="w-full rounded-lg bg-neutral-900/40 py-2.5 pl-10 pr-3 text-sm outline-none ring-1 ring-neutral-800 focus:bg-neutral-900 focus:ring-primary/50"
            />
          </div>

          <div className="space-y-3">
            {filtered.map((p) => (
              <div
                key={p.id}
                className="group rounded-[24px] bg-surface p-5 ring-1 ring-black/5 transition hover:ring-primary/20"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-base font-medium truncate max-w-[250px] sm:max-w-md">
                        {p.title}
                      </h4>
                      <span className="rounded-full bg-neutral-800 px-2 py-0.5 text-[10px] uppercase tracking-wider text-muted-foreground shrink-0">
                        {PROMPT_LABEL[p.category]}
                      </span>
                    </div>
                    <p className="mt-2 line-clamp-2 font-mono text-xs leading-relaxed text-muted-foreground select-all">
                      {p.body}
                    </p>
                  </div>
                  <div className="flex gap-1.5 opacity-0 transition-opacity group-hover:opacity-100 shrink-0">
                    <IconBtn onClick={() => toggleFav(p.id)} active={p.favorite}>
                      <Heart className={cn("size-3.5", p.favorite && "fill-current")} />
                    </IconBtn>
                    <IconBtn onClick={() => openEdit(p)}>
                      <Pencil className="size-3.5" />
                    </IconBtn>
                    <IconBtn onClick={() => copy(p.body)}>
                      <Copy className="size-3.5" />
                    </IconBtn>
                    <IconBtn
                      onClick={() => handleDelete(p.id)}
                      hoverColor="hover:border-rose-500/50 hover:text-rose-400"
                    >
                      <Trash2 className="size-3.5" />
                    </IconBtn>
                  </div>
                </div>
              </div>
            ))}
            {filtered.length === 0 && (
              <div className="rounded-[24px] border border-dashed border-neutral-800 p-12 text-center text-sm text-muted-foreground">
                Nenhum prompt encontrado.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal Criar / Editar Prompt */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{formId ? "Editar prompt" : "Novo prompt"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="prompt-title">Título</Label>
              <Input
                id="prompt-title"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder="Ex: Legenda MrBeast para Shorts"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Categoria</Label>
              <Select
                value={formCategory}
                onValueChange={(v) => setFormCategory(v as Prompt["category"])}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PROMPT_CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {PROMPT_LABEL[c]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="prompt-body">Instruções (Prompt)</Label>
              <Textarea
                id="prompt-body"
                value={formBody}
                onChange={(e) => setFormBody(e.target.value)}
                placeholder="Escreva as instruções completas para o modelo de IA..."
                className="h-32 font-mono text-xs leading-relaxed"
              />
            </div>
          </div>
          <DialogFooter>
            <button
              onClick={handleSave}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:brightness-110"
            >
              Salvar prompt
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CatRow({
  label,
  count,
  active,
  onClick,
}: {
  label: string;
  count: number;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm font-medium transition",
        active
          ? "bg-neutral-900 text-foreground ring-1 ring-black/5"
          : "text-muted-foreground hover:text-foreground",
      )}
    >
      <span>{label}</span>
      <span className="text-[10px] tabular-nums">{count}</span>
    </button>
  );
}

function IconBtn({
  children,
  onClick,
  active,
  hoverColor,
}: {
  children: React.ReactNode;
  onClick: () => void;
  active?: boolean;
  hoverColor?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "grid size-8 place-items-center rounded-lg border transition",
        active
          ? "border-primary/50 bg-primary/10 text-primary"
          : cn("border-neutral-800 text-muted-foreground hover:text-foreground", hoverColor),
      )}
    >
      {children}
    </button>
  );
}
