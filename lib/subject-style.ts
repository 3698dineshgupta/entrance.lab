import {
  Atom, FlaskConical, Leaf, PawPrint, Dna, Calculator, Languages, Brain, Layers,
  Move, Scale, Zap, Orbit, RefreshCw, Droplet, Waves, Thermometer, Sun, Cpu,
  TestTube, Beaker, Sigma, Divide, PieChart, SpellCheck, MessageSquare, BookOpen, Hash, TrendingUp,
  type LucideIcon,
} from "lucide-react";

export const SUBJECT_ICON: Record<string, LucideIcon> = {
  Physics: Atom,
  Chemistry: FlaskConical,
  Botany: Leaf,
  Zoology: PawPrint,
  Biology: Dna,
  Mathematics: Calculator,
  MAT: Brain,
  English: Languages,
};

export function getSubjectIcon(subject: string): LucideIcon {
  return SUBJECT_ICON[subject] ?? Layers;
}

// [text, background+border] gradient-friendly accent pairs per subject,
// used for icon chips, hero backgrounds and hover glows.
export const SUBJECT_COLOR: Record<string, { text: string; from: string; to: string; ring: string }> = {
  Physics: { text: "text-blue-600 dark:text-blue-400", from: "from-blue-500/20", to: "to-indigo-600/10", ring: "border-blue-400/20" },
  Chemistry: { text: "text-orange-600 dark:text-orange-400", from: "from-orange-500/20", to: "to-amber-600/10", ring: "border-orange-400/20" },
  Botany: { text: "text-green-600 dark:text-green-400", from: "from-green-500/20", to: "to-emerald-600/10", ring: "border-green-400/20" },
  Zoology: { text: "text-amber-600 dark:text-amber-400", from: "from-amber-500/20", to: "to-yellow-600/10", ring: "border-amber-400/20" },
  Biology: { text: "text-teal-600 dark:text-teal-400", from: "from-teal-500/20", to: "to-cyan-600/10", ring: "border-teal-400/20" },
  Mathematics: { text: "text-purple-600 dark:text-purple-400", from: "from-purple-500/20", to: "to-fuchsia-600/10", ring: "border-purple-400/20" },
  MAT: { text: "text-pink-600 dark:text-pink-400", from: "from-pink-500/20", to: "to-rose-600/10", ring: "border-pink-400/20" },
  English: { text: "text-cyan-600 dark:text-cyan-400", from: "from-cyan-500/20", to: "to-sky-600/10", ring: "border-cyan-400/20" },
};

export function getSubjectColor(subject: string) {
  return SUBJECT_COLOR[subject] ?? { text: "text-cyan-600 dark:text-cyan-400", from: "from-cyan-500/20", to: "to-blue-600/10", ring: "border-cyan-400/20" };
}

// Custom banner artwork per subject (already has the subject name and topic
// list baked into the image). Falls back to the gradient+icon treatment for
// any subject without one.
export const SUBJECT_IMAGE: Record<string, string> = {
  Physics: "/practice/physics_new.png",
  Chemistry: "/practice/chemistry_new.png",
  Botany: "/practice/botany_new.png",
  Zoology: "/practice/zoology_new.png",
  Biology: "/practice/biology_new.png",
  Mathematics: "/practice/mathematics_new.png",
  English: "/practice/english_new.png",
  MAT: "/practice/mat_new.png",
};

export function getSubjectImage(subject: string, exam?: string): string | null {
  if (exam) {
    const examKey = `${exam}_${subject}`;
    if (SUBJECT_IMAGE[examKey]) {
      return SUBJECT_IMAGE[examKey];
    }
  }
  return SUBJECT_IMAGE[subject] ?? null;
}

// Keyword-based icon picker for individual subtopic/topic cards, so the
// practice browser grid doesn't show the same one icon for every card in a
// subject. Falls back to the caller-provided default (usually the subject's
// own icon) when nothing matches.
const SUBTOPIC_ICON_RULES: [RegExp, LucideIcon][] = [
  [/vector|kinemat|projectile|relative motion/i, Move],
  [/newton|friction|law of motion|laws of motion/i, Scale],
  [/work|energy|power|momentum|collision/i, Zap],
  [/circular|gravitat|orbit|satellite/i, Orbit],
  [/rotation|angular/i, RefreshCw],
  [/fluid|pressure|viscosity|surface tension|hydro/i, Droplet],
  [/elastic|shm|oscillat|simple harmonic|spring/i, Waves],
  [/thermodynam|calorimetry|kinetic theory|specific heat|expansion/i, Thermometer],
  [/light|optic|reflection|refraction|lens|mirror|photo/i, Sun],
  [/wave|sound|doppler|interference|diffraction|acoustic/i, Waves],
  [/electr|magnet|circuit|current|capacitor/i, Zap],
  [/modern physics|atom|nuclear|quantum|semiconductor/i, Cpu],
  [/organic|hydrocarbon|alcohol|carbonyl|polymer/i, FlaskConical],
  [/inorganic|periodic|metal|acid|base|salt/i, TestTube],
  [/physical chemistry|equilibrium|thermochemistry|electrochemistry|kinetics|solution/i, Beaker],
  [/cell biology|genetic|dna|chromosom|heredity/i, Dna],
  [/plant|photosynth|transpiration|bryophyte|pteridophyte|fungi|algae/i, Leaf],
  [/animal|tissue|histology|physiology|human biology/i, PawPrint],
  [/ecology|biodivers|conservation|environment|monera|virus/i, Leaf],
  [/algebra|equation|polynomial|matrix|complex number/i, Sigma],
  [/trigonomet/i, TrendingUp],
  [/geometry|coordinate|conic/i, Hash],
  [/calculus|differen|integra|limit|continuity/i, Divide],
  [/statistic|probabilit/i, PieChart],
  [/set|logic|function|relation/i, Layers],
  [/grammar|tense|voice|clause|preposition|article/i, SpellCheck],
  [/phonetic|pronunciation|stress|intonation/i, MessageSquare],
  [/reading|comprehension|passage|vocabulary/i, BookOpen],
  [/verbal|reasoning|logical|numerical|sequenc/i, Brain],
];

export function getSubtopicIcon(label: string, fallback: LucideIcon = Layers): LucideIcon {
  for (const [pattern, icon] of SUBTOPIC_ICON_RULES) {
    if (pattern.test(label)) return icon;
  }
  return fallback;
}
