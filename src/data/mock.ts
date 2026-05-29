export type ProjectStatus = "briefing" | "edicao" | "thumbnail" | "revisao" | "entregue";

export type ProjectType = "video" | "thumb" | "shorts" | "reels";

export interface Project {
  id: string;
  name: string;
  client: string;
  type: ProjectType;
  status: ProjectStatus;
  dueDate: string; // ISO
  priority: "alta" | "media" | "baixa";
  notes?: string;
}

export const STATUS_LABEL: Record<ProjectStatus, string> = {
  briefing: "Briefing",
  edicao: "Edição",
  thumbnail: "Thumbnail",
  revisao: "Revisão",
  entregue: "Entregue",
};

export const STATUS_ORDER: ProjectStatus[] = [
  "briefing",
  "edicao",
  "thumbnail",
  "revisao",
  "entregue",
];

export const initialProjects: Project[] = [
  {
    id: "p1",
    name: "Masterclass: Finanças 2024",
    client: "Bruno Perini",
    type: "video",
    status: "edicao",
    dueDate: "2026-05-22",
    priority: "alta",
  },
  {
    id: "p2",
    name: "Thumbnail Pack #12",
    client: "Tech World",
    type: "thumb",
    status: "revisao",
    dueDate: "2026-05-24",
    priority: "media",
  },
  {
    id: "p3",
    name: "Cortes Podcast Ep. 88",
    client: "Flow State",
    type: "shorts",
    status: "entregue",
    dueDate: "2026-05-20",
    priority: "baixa",
  },
  {
    id: "p4",
    name: "Reels Lançamento Curso",
    client: "Ana Lima",
    type: "reels",
    status: "briefing",
    dueDate: "2026-05-28",
    priority: "alta",
  },
  {
    id: "p5",
    name: "Vídeo institucional Q2",
    client: "Nuvem SaaS",
    type: "video",
    status: "thumbnail",
    dueDate: "2026-05-26",
    priority: "media",
  },
  {
    id: "p6",
    name: "Apple Vision Pro: Review",
    client: "TechVibe",
    type: "video",
    status: "edicao",
    dueDate: "2026-05-25",
    priority: "alta",
  },
  {
    id: "p7",
    name: "Pack thumbs gaming",
    client: "PixelCraft",
    type: "thumb",
    status: "briefing",
    dueDate: "2026-05-30",
    priority: "baixa",
  },
];

export interface Task {
  id: string;
  title: string;
  context?: string;
  done: boolean;
}

export const initialTasks: Task[] = [
  {
    id: "t1",
    title: "Ajustar color grading do vídeo B-roll",
    context: "Masterclass Finanças",
    done: false,
  },
  { id: "t2", title: "Exportar thumb Pack #12", context: "Tech World", done: true },
  { id: "t3", title: "Responder feedback do Flow State", done: false },
  { id: "t4", title: "Renderizar versão final – Vision Pro", context: "TechVibe", done: false },
];

export interface Asset {
  id: string;
  name: string;
  category: "overlays" | "luts" | "fontes" | "musicas" | "memes" | "sfx" | "presets" | "templates";
  tags: string[];
  favorite: boolean;
  hue: number; // visual color
}

export const ASSET_CATEGORIES: Asset["category"][] = [
  "overlays",
  "luts",
  "fontes",
  "musicas",
  "memes",
  "sfx",
  "presets",
  "templates",
];

export const ASSET_LABEL: Record<Asset["category"], string> = {
  overlays: "Overlays",
  luts: "LUTs",
  fontes: "Fontes",
  musicas: "Músicas",
  memes: "Memes",
  sfx: "Efeitos Sonoros",
  presets: "Presets",
  templates: "Templates",
};

export const initialAssets: Asset[] = [
  {
    id: "a1",
    name: "Light Leak Cinematic",
    category: "overlays",
    tags: ["cinematic", "warm"],
    favorite: true,
    hue: 28,
  },
  {
    id: "a2",
    name: "Teal & Orange Master",
    category: "luts",
    tags: ["color", "filme"],
    favorite: false,
    hue: 200,
  },
  {
    id: "a3",
    name: "Neue Haas Display",
    category: "fontes",
    tags: ["sans", "swiss"],
    favorite: true,
    hue: 295,
  },
  {
    id: "a4",
    name: "Lo-fi Beats Vol.3",
    category: "musicas",
    tags: ["chill", "loop"],
    favorite: false,
    hue: 320,
  },
  {
    id: "a5",
    name: "Pedro Pascal Meme",
    category: "memes",
    tags: ["reaction"],
    favorite: false,
    hue: 50,
  },
  {
    id: "a6",
    name: "Whoosh Pack v2",
    category: "sfx",
    tags: ["transition"],
    favorite: true,
    hue: 180,
  },
  {
    id: "a7",
    name: "DaVinci Vlog Preset",
    category: "presets",
    tags: ["vlog"],
    favorite: false,
    hue: 130,
  },
  {
    id: "a8",
    name: "Talking Head Template",
    category: "templates",
    tags: ["youtube"],
    favorite: false,
    hue: 260,
  },
  {
    id: "a9",
    name: "Film Grain 35mm",
    category: "overlays",
    tags: ["analog"],
    favorite: false,
    hue: 15,
  },
  {
    id: "a10",
    name: "Sunset Orange LUT",
    category: "luts",
    tags: ["warm"],
    favorite: false,
    hue: 25,
  },
  {
    id: "a11",
    name: "Geist Mono",
    category: "fontes",
    tags: ["mono", "code"],
    favorite: false,
    hue: 220,
  },
  { id: "a12", name: "Sub Bass Hit", category: "sfx", tags: ["impact"], favorite: true, hue: 280 },
];

export interface Prompt {
  id: string;
  title: string;
  category: "thumbnails" | "roteiro" | "copy" | "edicao" | "imagem" | "automacoes";
  body: string;
  favorite: boolean;
}

export const PROMPT_CATEGORIES: Prompt["category"][] = [
  "thumbnails",
  "roteiro",
  "copy",
  "edicao",
  "imagem",
  "automacoes",
];

export const PROMPT_LABEL: Record<Prompt["category"], string> = {
  thumbnails: "Thumbnails",
  roteiro: "Roteiro",
  copy: "Copy",
  edicao: "Edição",
  imagem: "Imagem",
  automacoes: "Automações",
};

export const initialPrompts: Prompt[] = [
  {
    id: "pr1",
    title: "Thumb high-CTR rosto + texto",
    category: "thumbnails",
    favorite: true,
    body: "Crie uma thumbnail YouTube 16:9 com rosto humano em close, expressão de surpresa, fundo desfocado escuro, texto curto em amarelo neon (max 3 palavras), iluminação cinematográfica, estilo MrBeast.",
  },
  {
    id: "pr2",
    title: "Hook de roteiro 7s",
    category: "roteiro",
    favorite: false,
    body: "Escreva 5 hooks de 7 segundos para um vídeo sobre {tema}. Cada hook deve criar curiosidade ou paradoxo, sem clickbait barato.",
  },
  {
    id: "pr3",
    title: "Copy carrossel Instagram",
    category: "copy",
    favorite: true,
    body: "Escreva 7 slides para um carrossel sobre {tema}. Tom: direto e útil. Cada slide com headline + 1 linha de apoio.",
  },
  {
    id: "pr4",
    title: "Color grading cinematográfico",
    category: "edicao",
    favorite: false,
    body: "Sugira uma curva de color grading para um vídeo {estilo} com lift teal, gamma neutro, gain warm. Inclui valores RGB iniciais.",
  },
  {
    id: "pr5",
    title: "Cinematic hyper-realistic bokeh",
    category: "imagem",
    favorite: true,
    body: "cinematic hyper-realistic bokeh, anamorphic lens flare, 35mm film grain, golden hour, {sujeito}, ultra-detailed, shot on ARRI Alexa",
  },
  {
    id: "pr6",
    title: "Renomear arquivos por data",
    category: "automacoes",
    favorite: false,
    body: "Crie um script Node.js que renomeie todos os arquivos .mp4 em um diretório no formato YYYY-MM-DD_ordem.mp4 baseado na data de criação.",
  },
];

export interface WorkflowStage {
  id: string;
  name: string;
  items: { id: string; label: string; done: boolean }[];
}

export const initialWorkflow: WorkflowStage[] = [
  {
    id: "w1",
    name: "Briefing",
    items: [
      { id: "w1-1", label: "Reunião com cliente", done: true },
      { id: "w1-2", label: "Documento de escopo", done: true },
      { id: "w1-3", label: "Definir entregáveis", done: false },
    ],
  },
  {
    id: "w2",
    name: "Organização",
    items: [
      { id: "w2-1", label: "Importar mídia", done: true },
      { id: "w2-2", label: "Sincronizar áudio", done: false },
    ],
  },
  {
    id: "w3",
    name: "Edição",
    items: [
      { id: "w3-1", label: "Rough cut", done: false },
      { id: "w3-2", label: "Fine cut", done: false },
    ],
  },
  {
    id: "w4",
    name: "Sound Design",
    items: [
      { id: "w4-1", label: "SFX e foley", done: false },
      { id: "w4-2", label: "Mixagem", done: false },
    ],
  },
  {
    id: "w5",
    name: "Color Grading",
    items: [
      { id: "w5-1", label: "Aplicar LUT base", done: false },
      { id: "w5-2", label: "Skin tones", done: false },
    ],
  },
  {
    id: "w6",
    name: "Exportação",
    items: [
      { id: "w6-1", label: "Master ProRes", done: false },
      { id: "w6-2", label: "H.264 para web", done: false },
    ],
  },
  { id: "w7", name: "Thumbnail", items: [{ id: "w7-1", label: "3 variações A/B", done: false }] },
  {
    id: "w8",
    name: "Entrega",
    items: [
      { id: "w8-1", label: "Upload Frame.io", done: false },
      { id: "w8-2", label: "Aprovação final", done: false },
    ],
  },
];

export interface CalendarEvent {
  id: string;
  date: string; // ISO YYYY-MM-DD
  title: string;
  kind: "deadline" | "tarefa" | "entrega";
}

export const initialEvents: CalendarEvent[] = [
  { id: "e1", date: "2026-05-22", title: "Entrega Masterclass Finanças", kind: "entrega" },
  { id: "e2", date: "2026-05-24", title: "Revisão Thumb Pack #12", kind: "deadline" },
  { id: "e3", date: "2026-05-25", title: "Render Vision Pro Review", kind: "tarefa" },
  { id: "e4", date: "2026-05-26", title: "Apresentar conceito SaaS", kind: "tarefa" },
  { id: "e5", date: "2026-05-28", title: "Deadline Reels Ana Lima", kind: "deadline" },
  { id: "e6", date: "2026-05-30", title: "Entrega Pack Gaming", kind: "entrega" },
];
