import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, useEffect } from "react";
import { Heart, Search, Upload, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { ASSET_CATEGORIES, ASSET_LABEL, initialAssets, type Asset } from "@/data/mock";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/_app/assets")({
  head: () => ({
    meta: [
      { title: "Assets — EditorOS" },
      {
        name: "description",
        content: "Biblioteca premium de overlays, LUTs, fontes, SFX, presets e templates.",
      },
    ],
  }),
  component: AssetsPage,
});

function AssetsPage() {
  const [cat, setCat] = useState<Asset["category"] | "todos">("todos");
  const [query, setQuery] = useState("");

  // Sincronização LocalStorage com fallback ao mock
  const [assets, setAssets] = useState<Asset[]>(() => {
    if (typeof window === "undefined") return initialAssets;
    const saved = localStorage.getItem("editoros:assets");
    return saved ? JSON.parse(saved) : initialAssets;
  });

  useEffect(() => {
    localStorage.setItem("editoros:assets", JSON.stringify(assets));
  }, [assets]);

  // Estados do Dialog de Cadastro
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [formName, setFormName] = useState("");
  const [formCategory, setFormCategory] = useState<Asset["category"]>("overlays");
  const [formTags, setFormTags] = useState("");
  const [formHue, setFormHue] = useState(180);

  const filtered = useMemo(
    () =>
      assets.filter(
        (a) =>
          (cat === "todos" || a.category === cat) &&
          (a.name.toLowerCase().includes(query.toLowerCase()) ||
            a.tags.some((t) => t.includes(query.toLowerCase()))),
      ),
    [assets, cat, query],
  );

  const toggleFav = (id: string) =>
    setAssets((prev) => prev.map((a) => (a.id === id ? { ...a, favorite: !a.favorite } : a)));

  const handleDelete = (id: string) => {
    const target = assets.find((a) => a.id === id);
    setAssets((prev) => prev.filter((a) => a.id !== id));
    toast.success("Asset excluído", { description: target?.name });
  };

  const handleAdd = () => {
    if (!formName.trim()) {
      toast.error("Informe o nome do asset.");
      return;
    }

    const parsedTags = formTags
      .split(",")
      .map((t) => t.trim().toLowerCase())
      .filter((t) => t.length > 0);

    const newAsset: Asset = {
      id: `ast-${Date.now()}`,
      name: formName,
      category: formCategory,
      tags: parsedTags.length > 0 ? parsedTags : ["novo"],
      favorite: false,
      hue: formHue,
    };

    setAssets((prev) => [newAsset, ...prev]);
    toast.success("Asset adicionado!", { description: formName });
    setIsAddOpen(false);
  };

  const openAddModal = () => {
    setFormName("");
    setFormCategory("overlays");
    setFormTags("");
    setFormHue(Math.floor(Math.random() * 360));
    setIsAddOpen(true);
  };

  return (
    <div className="mx-auto max-w-7xl space-y-8 p-6 md:p-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">Assets</h1>
          <p className="mt-1 text-muted-foreground">{filtered.length} itens na biblioteca</p>
        </div>
        <button
          onClick={openAddModal}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground ring-2 ring-primary/20 transition hover:brightness-110"
        >
          <Upload className="size-4" /> Enviar asset
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-64">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por nome ou tag..."
            className="w-full rounded-lg bg-neutral-900/40 py-2 pl-10 pr-3 text-sm outline-none ring-1 ring-neutral-800 focus:bg-neutral-900 focus:ring-primary/50"
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <CatPill active={cat === "todos"} onClick={() => setCat("todos")}>
          Todos
        </CatPill>
        {ASSET_CATEGORIES.map((c) => (
          <CatPill key={c} active={cat === c} onClick={() => setCat(c)}>
            {ASSET_LABEL[c]}
          </CatPill>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {filtered.map((a) => (
          <div
            key={a.id}
            className="group overflow-hidden rounded-[24px] bg-surface ring-1 ring-black/5 transition hover:ring-primary/30"
          >
            <div
              className="relative aspect-[4/3] overflow-hidden"
              style={{
                background: `linear-gradient(135deg, hsl(${a.hue} 60% 25%), hsl(${(a.hue + 60) % 360} 50% 15%))`,
              }}
            >
              {/* Delete button (Left) */}
              <button
                onClick={() => handleDelete(a.id)}
                className="absolute left-3 top-3 grid size-8 place-items-center rounded-full bg-black/40 backdrop-blur-md text-white/70 opacity-0 group-hover:opacity-100 hover:text-rose-400 transition-all duration-200"
                title="Excluir asset"
              >
                <Trash2 className="size-4" />
              </button>

              {/* Favorite button (Right) */}
              <button
                onClick={() => toggleFav(a.id)}
                className={cn(
                  "absolute right-3 top-3 grid size-8 place-items-center rounded-full bg-black/40 backdrop-blur-md transition-all duration-200",
                  a.favorite ? "text-rose-400" : "text-white/70 hover:text-white",
                )}
              >
                <Heart className={cn("size-4", a.favorite && "fill-current")} />
              </button>

              <span className="absolute bottom-3 left-3 rounded-full bg-black/40 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-white/80 backdrop-blur-md">
                {ASSET_LABEL[a.category]}
              </span>
            </div>
            <div className="p-4">
              <h4 className="truncate text-sm font-medium" title={a.name}>
                {a.name}
              </h4>
              <div className="mt-2 flex flex-wrap gap-1">
                {a.tags.map((t) => (
                  <span
                    key={t}
                    className="rounded-full bg-neutral-800 px-2 py-0.5 text-[10px] text-muted-foreground"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}

        <button
          onClick={openAddModal}
          className="grid aspect-[4/3] place-items-center rounded-[24px] border border-dashed border-neutral-800 text-muted-foreground transition hover:border-primary/40 hover:text-foreground"
        >
          <div className="flex flex-col items-center gap-2">
            <Plus className="size-5" />
            <span className="text-xs">Adicionar asset</span>
          </div>
        </button>
      </div>

      {/* Modal para Adicionar Asset */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enviar novo asset</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="asset-name">Nome do Asset</Label>
              <Input
                id="asset-name"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Ex: Light Leak Warm 4k"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Categoria</Label>
                <Select
                  value={formCategory}
                  onValueChange={(v) => setFormCategory(v as Asset["category"])}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ASSET_CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {ASSET_LABEL[c]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="asset-tags">Tags (separadas por vírgula)</Label>
                <Input
                  id="asset-tags"
                  value={formTags}
                  onChange={(e) => setFormTags(e.target.value)}
                  placeholder="transição, luz, 4k"
                />
              </div>
            </div>

            {/* Slider de Matiz (Hue) com Visual Gradient Preview */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Aparência visual (Matiz de Cor)</Label>
                <span className="text-xs font-mono text-muted-foreground">{formHue}°</span>
              </div>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="0"
                  max="360"
                  value={formHue}
                  onChange={(e) => setFormHue(Number(e.target.value))}
                  className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-neutral-800 accent-primary"
                  style={{
                    background: `linear-gradient(to right, 
                      hsl(0, 100%, 50%), 
                      hsl(60, 100%, 50%), 
                      hsl(120, 100%, 50%), 
                      hsl(180, 100%, 50%), 
                      hsl(240, 100%, 50%), 
                      hsl(300, 100%, 50%), 
                      hsl(360, 100%, 50%))`,
                  }}
                />
                <div
                  className="size-9 rounded-xl border border-white/10 shrink-0 shadow-inner"
                  style={{
                    background: `linear-gradient(135deg, hsl(${formHue} 60% 40%), hsl(${(formHue + 60) % 360} 50% 25%))`,
                  }}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <button
              onClick={handleAdd}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:brightness-110"
            >
              Adicionar à Biblioteca
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CatPill({
  children,
  active,
  onClick,
}: {
  children: React.ReactNode;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-full border px-3.5 py-1.5 text-xs font-medium transition",
        active
          ? "border-primary/50 bg-primary/10 text-foreground"
          : "border-neutral-800 text-muted-foreground hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}
