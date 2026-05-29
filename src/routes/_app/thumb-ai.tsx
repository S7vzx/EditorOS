import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Sparkles, Copy, Heart, Save } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/thumb-ai")({
  head: () => ({
    meta: [
      { title: "Thumb AI — EditorOS" },
      {
        name: "description",
        content: "Gere ideias de thumbnail com IA: conceito, composição, paleta e prompt.",
      },
    ],
  }),
  component: ThumbAIPage,
});

interface Concept {
  conceito: string;
  composicao: string;
  expressao: string;
  texto: string;
  paleta: string[];
  iluminacao: string;
  cta: string;
  prompt: string;
}

function generateConcept(title: string, niche: string, style: string, emotion: string): Concept {
  // 1. Nicho mapping
  let paleta = ["#0a0a0a", "#a78bfa", "#facc15", "#f5f5f5"]; // Default
  let bgDesc = "";
  let detailDesc = "";
  let colorPrompt = "";

  if (niche === "tech") {
    paleta = ["#09090b", "#06b6d4", "#a78bfa", "#f4f4f5"];
    bgDesc =
      "Fundo escuro tecnológico com elementos de hologramas virtuais em azul-ciano e traços finos de código flutuando desfocados.";
    detailDesc =
      "Sujeito usa um fone de ouvido futurista discreto com luzes ciano em harmonia com o tema.";
    colorPrompt =
      "cyberpunk aesthetics, tech holographic HUD interface in background, neon cyan and purple accent lights";
  } else if (niche === "financas") {
    paleta = ["#0f172a", "#10b981", "#fbbf24", "#f8fafc"];
    bgDesc =
      "Fundo slate escuro sóbrio e profissional com o skyline de arranha-céus noturnos desfocados e um gráfico financeiro luminoso ascendente.";
    detailDesc =
      "Visual sofisticado de terno/blazer moderno, iluminação refinada que transmite autoridade e sucesso.";
    colorPrompt =
      "corporate financial success theme, dark luxury slate background with glowing emerald green upward trend line graph, warm golden accents";
  } else if (niche === "lifestyle") {
    paleta = ["#1c1917", "#f97316", "#fef3c7", "#fafaf9"];
    bgDesc =
      "Fundo aconchegante de loft urbano industrial, plantas verdes de fundo sob um efeito bokeh oval suave criado pela iluminação de fim de tarde.";
    detailDesc =
      "Sujeito em trajes casuais elegantes, com tom natural e iluminação calorosa que gera empatia instantânea.";
    colorPrompt =
      "modern cozy urban loft background with plants, warm sunset golden hour lighting, cozy photorealistic personal branding";
  } else if (niche === "gaming") {
    paleta = ["#09090b", "#ef4444", "#3b82f6", "#ffffff"];
    bgDesc =
      "Fundo escuro e dinâmico de setup gamer, com tiras de LED neon vermelho e azul, fumaça sutil iluminada e partículas suspensas.";
    detailDesc =
      "Sujeito usa um headset gamer profissional com microfone, com brilho colorido refletindo sutilmente nas laterais do rosto.";
    colorPrompt =
      "immersive gaming room setup background, vibrant red and blue neon gamer aesthetic, professional headset, cybernetic dust particles";
  } else if (niche === "educacao") {
    paleta = ["#172554", "#38bdf8", "#facc15", "#f8fafc"];
    bgDesc =
      "Fundo com efeito bokeh simulando uma lousa preta clássica com rabiscos matemáticos abstratos e prateleiras de livros desfocadas.";
    detailDesc =
      "Postura didática e focada, transmitindo curiosidade intelectual e clareza de ideias com óculos de armação fina.";
    colorPrompt =
      "scholarly blackboard background with abstract formulas, books on bookshelves, intellectual studio lighting, high contrast classroom vibe";
  }

  // 2. Estilo mapping
  let styleConcept = "";
  let styleComp = "";
  let stylePrompt = "";
  let cta = "Seta amarela em neon apontando para o elemento de maior curiosidade.";

  if (style === "MrBeast") {
    paleta = ["#0284c7", "#f43f5e", "#facc15", "#ffffff"]; // High saturation override
    styleConcept =
      "Sujeito centralizado com contornos de brilho denso em neon rosa e amarelo, expressões faciais super exageradas para atrair cliques.";
    styleComp =
      "Composição de impacto centralizado. O sujeito ocupa o centro da tela (2/3 da altura), com elementos em escala monumental atrás dele e o texto em 3D gigante na base.";
    stylePrompt =
      "exaggerated hyper-expressive style, highly saturated bright colors, thick glowing neon pink stroke outline around the subject, explosive energy elements in background, cinematic commercial pop art style";
    cta =
      "Seta amarela gigante com contorno preto 3D apontando direto para a face chocada do sujeito.";
  } else if (style === "cinemático") {
    styleConcept =
      "Retrato altamente cinematográfico com luz volumétrica marcante e flares horizontais característicos de lentes anamórficas.";
    styleComp =
      "Regra dos terços cinematográfica. Sujeito posicionado à esquerda (1/3), olhando levemente em direção à direita, onde o texto elegante está inserido com espaço negativo.";
    stylePrompt =
      "cinematic anamorphic lens flare, dramatic volumetric lighting, highly professional color grading, moody cinematic shadow depth, shot on ARRI Alexa LF, 35mm lens, depth of field";
    cta =
      "Círculo luminoso neon roxo desfocado atrás da cabeça do sujeito como halo de atenção + vinheta nas bordas.";
  } else if (style === "minimalista") {
    styleConcept =
      "Design limpo e sofisticado com alto espaço negativo, focando puramente no sujeito e na mensagem, sem ruídos desnecessários.";
    styleComp =
      "Composição simétrica minimalista. Sujeito perfeitamente centralizado ou na extrema esquerda, cercado por um espaço vazio amplo e texto sans-serif refinado em tamanho generoso.";
    stylePrompt =
      "elegant minimalist composition, solid studio background with clean premium textures, dramatic shadow play, maximum negative space, ultra-high-end design";
    cta =
      "Foco visual por contraste extremo — iluminação concentrada puramente no rosto e texto sob fundo escuro.";
  } else if (style === "documentário") {
    styleConcept =
      "Abordagem realista de alta carga dramática, destacando texturas reais da pele, poeira de estúdio e contraste chiaroscuro denso.";
    styleComp =
      "Enquadramento central profundo e honesto. O sujeito olha diretamente na câmera de forma penetrante, com luz lateral marcante cortando o rosto em 50%.";
    stylePrompt =
      "gritty documentary style, photorealistic high contrast, dramatic chiaroscuro side lighting, hard realistic shadows, gritty film grain, authentic raw textures, award-winning journalism look";
    cta =
      "Destaque por luz de contorno branca fria (rim light) recortando o ombro e o perfil do sujeito contra a escuridão.";
  }

  // 3. Emoção mapping
  let emotionDesc = "";
  let emotionPrompt = "";
  if (emotion === "surpresa") {
    emotionDesc =
      "Olhos extremamente arregalados, sobrancelhas arqueadas ao limite e boca semiaberta expressando choque e surpresa absolutos.";
    emotionPrompt =
      "shocked surprised face expression, wide open eyes, mouth agape in disbelief, genuine high-stakes dramatic reaction";
  } else if (emotion === "curiosidade") {
    emotionDesc =
      "Olhar inteligente e semicerrado, cabeça levemente inclinada de lado com um sorriso instigante de canto de boca que desafia o espectador.";
    emotionPrompt =
      "intrigued curious face expression, one eyebrow arched higher, mysterious micro-smile, look of deep intellect and question";
  } else if (emotion === "raiva") {
    emotionDesc =
      "Cenho franzido profundamente, dentes levemente cerrados e olhar de confronto extremamente focado e agressivo para a lente.";
    emotionPrompt =
      "intense angry expression, deeply furrowed brow, fierce direct confrontational stare, dramatic serious mood";
  } else if (emotion === "alegria") {
    emotionDesc =
      "Sorriso largo e contagiante exibindo os dentes, com rugas de felicidade nos cantos dos olhos e bochechas elevadas.";
    emotionPrompt =
      "joyful ecstatic smile, eyes creased with authentic laughter, radiating positive welcoming energy";
  } else if (emotion === "medo") {
    emotionDesc =
      "Olhar tenso com olhos arregalados de pânico, sobrancelhas contraídas no centro e lábios ligeiramente tensos.";
    emotionPrompt =
      "fearful terrified expression, wide anxious panic eyes, cold dramatic atmosphere, sweat glistening";
  }

  // 4. Combine into Concept
  const texto = title.split(" ").slice(0, 3).join(" ").toUpperCase() || "ATENÇÃO";
  const conceito = `${styleConcept} ${bgDesc} ${detailDesc}`;
  const composicao = styleComp;
  const iluminacao = `Iluminação estilo: ${style === "cinemático" ? "Cinematográfica com Rim Light" : style === "MrBeast" ? "Estúdio Neon com Backlight de Energia" : "Estúdio Clean com High Contrast"}. Key light forte baseada no nicho ${niche === "tech" ? "Tecnologia" : niche === "financas" ? "Finanças" : niche === "lifestyle" ? "Lifestyle" : niche === "gaming" ? "Gaming" : "Educação"}, criando excelente volumetria e destacando a emoção de ${emotion}.`;

  const prompt = `cinematic 16:9 YouTube thumbnail, ${stylePrompt}, ${colorPrompt}, featuring close-up portrait of a creator with ${emotionPrompt}, ${bgDesc.replace("Fundo ", "").toLowerCase()}, bold yellow short overlay typography reads "${texto}", highly detailed, photorealistic, 8k resolution, raytracing --ar 16:9 --style raw --v 6.0`;

  return {
    conceito,
    composicao,
    expressao: emotionDesc,
    texto,
    paleta,
    iluminacao,
    cta,
    prompt,
  };
}

function ThumbnailMockup({
  result,
  emotion,
  style,
  niche,
}: {
  result: Concept;
  emotion: string;
  style: string;
  niche: string;
}) {
  const [bg, primary, accent, text] = result.paleta;

  // Render SVG Face based on emotion
  let faceElements = null;
  if (emotion === "surpresa") {
    faceElements = (
      <>
        {/* Shocked brows */}
        <path
          d="M 28 35 Q 38 22 48 30"
          stroke="currentColor"
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
        />
        <path
          d="M 62 30 Q 72 22 82 35"
          stroke="currentColor"
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
        />
        {/* Shocked eyes */}
        <circle cx="38" cy="45" r="7" fill="none" stroke="currentColor" strokeWidth="2.5" />
        <circle cx="38" cy="45" r="3" fill="currentColor" />
        <circle cx="72" cy="45" r="7" fill="none" stroke="currentColor" strokeWidth="2.5" />
        <circle cx="72" cy="45" r="3" fill="currentColor" />
        {/* Disbelief mouth */}
        <circle cx="55" cy="68" r="9" fill="none" stroke="currentColor" strokeWidth="3" />
      </>
    );
  } else if (emotion === "curiosidade") {
    faceElements = (
      <>
        {/* Curious brows - one raised */}
        <path
          d="M 28 35 Q 38 20 48 32"
          stroke="currentColor"
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
        />
        <path
          d="M 62 35 Q 72 32 82 35"
          stroke="currentColor"
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
        />
        {/* Intelligent eyes looking slightly askance */}
        <ellipse
          cx="38"
          cy="45"
          rx="7"
          ry="5"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
        />
        <circle cx="40" cy="45" r="3" fill="currentColor" />
        <ellipse
          cx="72"
          cy="45"
          rx="7"
          ry="5"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
        />
        <circle cx="74" cy="45" r="3" fill="currentColor" />
        {/* Smirk mouth */}
        <path
          d="M 43 65 Q 57 72 65 62"
          stroke="currentColor"
          strokeWidth="3.5"
          fill="none"
          strokeLinecap="round"
        />
      </>
    );
  } else if (emotion === "raiva") {
    faceElements = (
      <>
        {/* Angry angled brows */}
        <path
          d="M 28 28 L 48 38"
          stroke="currentColor"
          strokeWidth="3.5"
          fill="none"
          strokeLinecap="round"
        />
        <path
          d="M 62 38 L 82 28"
          stroke="currentColor"
          strokeWidth="3.5"
          fill="none"
          strokeLinecap="round"
        />
        {/* Intense focused eyes */}
        <circle cx="38" cy="48" r="6" fill="none" stroke="currentColor" strokeWidth="2.5" />
        <circle cx="38" cy="48" r="3" fill="currentColor" />
        <circle cx="72" cy="48" r="6" fill="none" stroke="currentColor" strokeWidth="2.5" />
        <circle cx="72" cy="48" r="3" fill="currentColor" />
        {/* Angry mouth */}
        <path
          d="M 45 68 Q 55 60 65 68"
          stroke="currentColor"
          strokeWidth="3.5"
          fill="none"
          strokeLinecap="round"
        />
      </>
    );
  } else if (emotion === "alegria") {
    faceElements = (
      <>
        {/* Happy high brows */}
        <path
          d="M 28 32 Q 38 22 48 32"
          stroke="currentColor"
          strokeWidth="2.5"
          fill="none"
          strokeLinecap="round"
        />
        <path
          d="M 62 32 Q 72 22 82 32"
          stroke="currentColor"
          strokeWidth="2.5"
          fill="none"
          strokeLinecap="round"
        />
        {/* Happy creased eyes */}
        <path
          d="M 32 45 Q 38 39 44 45"
          stroke="currentColor"
          strokeWidth="3.5"
          fill="none"
          strokeLinecap="round"
        />
        <path
          d="M 66 45 Q 72 39 78 45"
          stroke="currentColor"
          strokeWidth="3.5"
          fill="none"
          strokeLinecap="round"
        />
        {/* Big open smile */}
        <path d="M 40 60 Q 55 75 70 60 Z" fill="currentColor" />
      </>
    );
  } else if (emotion === "medo") {
    faceElements = (
      <>
        {/* Worried brows */}
        <path
          d="M 28 28 Q 38 34 48 30"
          stroke="currentColor"
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
        />
        <path
          d="M 62 30 Q 72 34 82 28"
          stroke="currentColor"
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
        />
        {/* Wide terrified eyes */}
        <circle cx="38" cy="45" r="7.5" fill="none" stroke="currentColor" strokeWidth="2" />
        <circle cx="38" cy="45" r="2" fill="currentColor" />
        <circle cx="72" cy="45" r="7.5" fill="none" stroke="currentColor" strokeWidth="2" />
        <circle cx="72" cy="45" r="2" fill="currentColor" />
        {/* Nervous wavy mouth */}
        <path
          d="M 45 68 Q 50 63 55 68 Q 60 73 65 68"
          stroke="currentColor"
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
        />
      </>
    );
  }

  const isCenterLayout = style === "MrBeast" || style === "minimalista";
  const isCinematic = style === "cinemático";
  const isMrBeast = style === "MrBeast";

  return (
    <div
      className="relative aspect-video w-full overflow-hidden rounded-[24px] border border-neutral-800/80 shadow-2xl ring-1 ring-black/40"
      style={{
        background: `radial-gradient(circle at ${isCenterLayout ? "center" : "25% 45%"}, ${primary}30 0%, ${bg} 85%)`,
        backgroundColor: bg,
      }}
    >
      {/* Background HUD or Grid effects depending on niche */}
      {niche === "tech" && (
        <svg className="absolute inset-0 size-full opacity-15" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse">
              <path d="M 30 0 L 0 0 0 30" fill="none" stroke={primary} strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
          <circle
            cx="20%"
            cy="40%"
            r="50"
            fill="none"
            stroke={primary}
            strokeWidth="1.5"
            strokeDasharray="5 5"
            className="animate-pulse"
          />
          <circle
            cx="20%"
            cy="40%"
            r="35"
            fill="none"
            stroke={primary}
            strokeWidth="1"
            strokeDasharray="20 10"
          />
        </svg>
      )}

      {niche === "financas" && (
        <div className="absolute inset-0 flex items-end opacity-20">
          <svg
            className="size-full animate-pulse"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 400 225"
          >
            <path
              d="M 0 180 Q 80 160 150 110 T 300 70 T 400 30"
              fill="none"
              stroke={primary}
              strokeWidth="4"
              strokeLinecap="round"
            />
          </svg>
        </div>
      )}

      {niche === "gaming" && (
        <div className="absolute inset-0 opacity-25">
          <div
            className="absolute -left-10 top-0 h-full w-24 -rotate-12 blur-[40px]"
            style={{ background: `linear-gradient(to bottom, ${primary}, transparent)` }}
          />
          <div
            className="absolute -right-10 top-0 h-full w-24 rotate-12 blur-[40px]"
            style={{ background: `linear-gradient(to bottom, ${accent}, transparent)` }}
          />
        </div>
      )}

      {niche === "lifestyle" && (
        <div
          className="absolute inset-0 mix-blend-overlay opacity-35"
          style={{ background: `radial-gradient(circle at 80% 20%, ${accent}, transparent 60%)` }}
        />
      )}

      {niche === "educacao" && (
        <div className="absolute inset-0 opacity-10">
          <svg
            className="size-full stroke-white"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 400 225"
            strokeWidth="1"
          >
            <text x="75%" y="30%" fontSize="12" fontFamily="monospace">
              E = mc²
            </text>
            <text x="70%" y="45%" fontSize="10" fontFamily="monospace">
              f(x) = sin(x)
            </text>
            <path d="M 280 120 L 320 120 L 300 80 Z" fill="none" />
          </svg>
        </div>
      )}

      {/* Ambient glow blobs */}
      <div
        className="absolute -right-20 -top-20 size-64 rounded-full blur-[80px] opacity-25 animate-pulse"
        style={{ background: accent }}
      />
      <div
        className="absolute -left-20 -bottom-20 size-64 rounded-full blur-[80px] opacity-20"
        style={{ background: primary }}
      />

      {/* Subject representation (Silhouette Avatar) */}
      <div
        className={cn(
          "absolute transition-all duration-500 flex flex-col items-center justify-end h-[90%] bottom-0 text-white/90",
          isCenterLayout ? "left-1/2 -translate-x-1/2 w-[35%]" : "left-[10%] w-[32%]",
        )}
      >
        <div className="relative w-full h-full flex flex-col items-center justify-end">
          {/* Glow Behind Subject for MrBeast */}
          {isMrBeast && (
            <div
              className="absolute inset-0 scale-[1.1] rounded-t-full filter blur-[15px] opacity-80 animate-pulse"
              style={{ background: `radial-gradient(circle, ${accent} 40%, transparent)` }}
            />
          )}

          <svg
            viewBox="0 0 110 130"
            className="absolute bottom-0 w-full h-full overflow-visible"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Silhouette outline */}
            <path
              d="M 15 130 C 15 85 30 70 30 60 C 30 50 25 50 25 35 C 25 15 40 10 55 10 C 70 10 85 15 85 35 C 85 50 80 50 80 60 C 80 70 95 85 95 130 Z"
              fill={bg}
              stroke={isMrBeast ? accent : isCinematic ? primary : "rgba(255,255,255,0.12)"}
              strokeWidth={isMrBeast ? "5" : "2"}
              filter={isMrBeast ? "url(#glow)" : undefined}
              className="transition-all duration-300"
            />

            {/* Clothing neck detail */}
            <path
              d="M 40 90 L 55 105 L 70 90"
              fill="none"
              stroke="rgba(255,255,255,0.15)"
              strokeWidth="2.5"
              strokeLinecap="round"
            />

            {/* Rendered facial expression details */}
            <g
              className="text-white transition-all duration-300"
              style={{ transform: "translate(0px, 0px)" }}
            >
              {faceElements}
            </g>

            {/* Gaming headset */}
            {niche === "gaming" && (
              <path
                d="M 22 35 C 20 22, 90 22, 88 35 M 18 30 Q 23 35 23 45 Q 23 55 18 60 Z M 92 30 Q 87 35 87 45 Q 87 55 92 60 Z"
                fill="none"
                stroke={primary}
                strokeWidth="3.5"
                strokeLinecap="round"
              />
            )}
          </svg>
        </div>
      </div>

      {/* Cinematic horizontal flare */}
      {isCinematic && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-65 mix-blend-screen">
          <div className="h-[2px] w-[140%] -rotate-2 bg-gradient-to-r from-transparent via-cyan-400 to-transparent blur-[1.5px]" />
          <div className="absolute h-10 w-44 rounded-full bg-cyan-500/20 blur-[25px]" />
        </div>
      )}

      {/* Title Text Layer */}
      <div
        className={cn(
          "absolute transition-all duration-500 flex flex-col justify-center",
          isCenterLayout
            ? "left-1/2 -translate-x-1/2 bottom-5 text-center w-[90%] items-center"
            : "right-8 top-1/2 -translate-y-1/2 text-right w-[48%] items-end",
        )}
      >
        <h2
          className={cn(
            "font-black leading-[0.9] tracking-tighter uppercase",
            isMrBeast ? "text-4xl italic drop-shadow-lg" : "text-3xl tracking-tight",
          )}
          style={{
            color: isMrBeast ? accent : text,
            fontFamily: 'Impact, "Arial Black", sans-serif',
            textShadow: isMrBeast
              ? `0 0 10px ${primary}, -3px -3px 0 #000, 3px -3px 0 #000, -3px 3px 0 #000, 3px 3px 0 #000`
              : `2px 2px 8px rgba(0,0,0,0.95)`,
          }}
        >
          {result.texto}
        </h2>
      </div>

      {/* Visual CTA Arrow */}
      {result.cta && !isCenterLayout && (
        <div
          className="absolute right-1/3 bottom-8 animate-bounce"
          style={{ animationDuration: "2s" }}
        >
          <svg
            width="45"
            height="45"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="text-yellow-400 filter drop-shadow-[0_0_5px_rgba(250,204,21,0.6)]"
          >
            <path
              d="M5 12h14M12 5l7 7-7 7"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ transform: "rotate(135deg)", transformOrigin: "center" }}
            />
          </svg>
        </div>
      )}
    </div>
  );
}

function ThumbAIPage() {
  const [title, setTitle] = useState("");
  const [niche, setNiche] = useState("tech");
  const [style, setStyle] = useState("cinemático");
  const [emotion, setEmotion] = useState("surpresa");
  const [ref, setRef] = useState("");
  const [result, setResult] = useState<Concept | null>(null);
  const [loading, setLoading] = useState(false);
  const [favorite, setFavorite] = useState(false);

  const handleGenerate = () => {
    if (!title.trim()) {
      toast.error("Informe o título do vídeo.");
      return;
    }
    setLoading(true);
    setResult(null);
    setFavorite(false);
    setTimeout(() => {
      setResult(generateConcept(title, niche, style, emotion));
      setLoading(false);
    }, 700);
  };

  const copyPrompt = () => {
    if (!result) return;
    navigator.clipboard.writeText(result.prompt);
    toast.success("Prompt copiado");
  };

  return (
    <div className="mx-auto max-w-7xl space-y-8 p-6 md:p-10">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">Thumb AI</h1>
        <p className="mt-1 max-w-[60ch] text-muted-foreground">
          Descreva seu vídeo e a IA gera conceito de thumb, composição, paleta, iluminação e prompt
          pronto para Midjourney.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-5">
        {/* Form */}
        <div className="rounded-[32px] bg-surface p-8 ring-1 ring-black/5 lg:col-span-2 space-y-5 self-start">
          <Field label="Título do vídeo">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex.: Por que ninguém te conta isso sobre IA"
              className="input"
            />
          </Field>
          <Field label="Nicho">
            <select value={niche} onChange={(e) => setNiche(e.target.value)} className="input">
              <option value="tech">Tecnologia</option>
              <option value="financas">Finanças</option>
              <option value="lifestyle">Lifestyle</option>
              <option value="gaming">Gaming</option>
              <option value="educacao">Educação</option>
            </select>
          </Field>
          <Field label="Estilo">
            <div className="grid grid-cols-2 gap-2">
              {["cinemático", "minimalista", "MrBeast", "documentário"].map((s) => (
                <button
                  key={s}
                  onClick={() => setStyle(s)}
                  className={cn(
                    "rounded-lg border px-3 py-2 text-xs transition",
                    style === s
                      ? "border-primary/50 bg-primary/10 text-foreground"
                      : "border-neutral-800 text-muted-foreground hover:text-foreground",
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
          </Field>
          <Field label="Emoção principal">
            <select value={emotion} onChange={(e) => setEmotion(e.target.value)} className="input">
              <option>surpresa</option>
              <option>curiosidade</option>
              <option>raiva</option>
              <option>alegria</option>
              <option>medo</option>
            </select>
          </Field>
          <Field label="Referência (opcional)">
            <input
              value={ref}
              onChange={(e) => setRef(e.target.value)}
              placeholder="Link de uma thumb de referência"
              className="input"
            />
          </Field>
          <button
            onClick={handleGenerate}
            disabled={loading}
            className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground transition active:scale-[0.99] hover:brightness-110 disabled:opacity-60"
          >
            <Sparkles className="size-4" strokeWidth={2.5} />
            {loading ? "Gerando conceito..." : "Gerar conceito"}
          </button>
        </div>

        {/* Result */}
        <div className="space-y-6 lg:col-span-3">
          {!result && !loading && (
            <div className="grid h-full place-items-center rounded-[32px] border border-dashed border-neutral-800 p-12 text-center min-h-[400px]">
              <div className="space-y-3">
                <Sparkles className="mx-auto size-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Preencha os campos e gere o primeiro conceito.
                </p>
              </div>
            </div>
          )}
          {loading && (
            <div className="grid h-full place-items-center rounded-[32px] bg-surface p-12 ring-1 ring-black/5 min-h-[400px]">
              <div className="size-10 animate-spin rounded-full border-2 border-neutral-800 border-t-primary" />
            </div>
          )}
          {result && (
            <>
              {/* Visual Interactive 16:9 Mockup Preview */}
              <div className="space-y-2">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground px-1">
                  Visualização da Thumbnail
                </p>
                <ThumbnailMockup result={result} emotion={emotion} style={style} niche={niche} />
              </div>

              <div className="flex items-center justify-between rounded-[24px] bg-surface p-5 ring-1 ring-black/5">
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">
                    Texto da thumb
                  </p>
                  <p className="mt-1 text-2xl font-bold tracking-tight">{result.texto}</p>
                </div>
                <div className="flex gap-2">
                  <IconBtn onClick={() => setFavorite((f) => !f)} active={favorite}>
                    <Heart className={cn("size-4", favorite && "fill-current")} />
                  </IconBtn>
                  <IconBtn onClick={() => toast.success("Ideia salva")}>
                    <Save className="size-4" />
                  </IconBtn>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <ResultCard title="Conceito" body={result.conceito} />
                <ResultCard title="Composição" body={result.composicao} />
                <ResultCard title="Expressão facial" body={result.expressao} />
                <ResultCard title="Iluminação" body={result.iluminacao} />
                <ResultCard title="CTA visual" body={result.cta} />
                <div className="rounded-[24px] bg-surface p-5 ring-1 ring-black/5">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">Paleta</p>
                  <div className="mt-3 flex gap-2">
                    {result.paleta.map((c) => (
                      <div key={c} className="flex-1 space-y-1">
                        <div
                          className="h-12 rounded-lg ring-1 ring-black/10"
                          style={{ background: c }}
                        />
                        <p className="text-[10px] font-mono text-muted-foreground">{c}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="rounded-[24px] bg-primary/10 p-5 ring-1 ring-primary/20">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-wider text-primary">
                    Prompt para IA
                  </p>
                  <button
                    onClick={copyPrompt}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition hover:brightness-110"
                  >
                    <Copy className="size-3.5" /> Copiar
                  </button>
                </div>
                <p className="mt-3 font-mono text-xs leading-relaxed text-foreground/90 select-all">
                  {result.prompt}
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      <style>{`
        .input {
          width: 100%;
          background: rgba(23,23,23,1);
          border: 1px solid rgba(64,64,64,0.6);
          border-radius: 10px;
          padding: 10px 12px;
          font-size: 14px;
          outline: none;
          color: inherit;
          transition: border-color .2s;
        }
        .input:focus { border-color: color-mix(in oklab, var(--primary) 50%, transparent); }
      `}</style>
    </div>
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

function ResultCard({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-[24px] bg-surface p-5 ring-1 ring-black/5">
      <p className="text-xs uppercase tracking-wider text-muted-foreground">{title}</p>
      <p className="mt-2 text-sm leading-relaxed">{body}</p>
    </div>
  );
}

function IconBtn({
  children,
  onClick,
  active,
}: {
  children: React.ReactNode;
  onClick: () => void;
  active?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "grid size-9 place-items-center rounded-lg border transition",
        active
          ? "border-primary/50 bg-primary/10 text-primary"
          : "border-neutral-800 text-muted-foreground hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}
