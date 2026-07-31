import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// One-time backfill: assigns a `topic` to every existing question using
// keyword rules per subject. This is a best-effort first pass — questions
// that don't match any rule fall into a "General <Subject>" bucket and can
// be re-tagged later via admin re-upload once topic is set at ingest time.
type Rule = { topic: string; patterns: RegExp[] };

function rx(...words: string[]): RegExp {
  return new RegExp(words.join("|"), "i");
}

const RULES: Record<string, Rule[]> = {
  Mathematics: [
    { topic: "Complex Numbers", patterns: [rx("conjugate", "\\bz =", "imaginary", "complex number")] },
    { topic: "Vectors", patterns: [rx("vector product", "scalar product", "triple product", "linearly independent", "\\bvectors\\b")] },
    { topic: "Statistics & Probability", patterns: [rx("central tendency", "\\bprobability\\b", "bayes", "\\bmean\\b", "\\bmedian\\b", "\\bmode\\b")] },
    { topic: "Trigonometry", patterns: [rx("sin\\(", "cos\\(", "tan\\(", "sin\\^-1", "cos\\^-1", "cosine rule", "trigonometric")] },
    { topic: "Coordinate Geometry", patterns: [rx("slope", "straight line", "\\bcircle\\b", "parabola", "ellipse", "hyperbola", "eccentricity", "3d space", "equation of a plane", "distance of a point")] },
    { topic: "Calculus", patterns: [rx("limit", "l'hospital", "derivative", "differential equation", "integral", "integrating factor", "tangent to a curve", "local maximum")] },
    { topic: "Algebra", patterns: [rx("quadratic", "\\broots\\b", "common difference", "geometric series", "permutation", "combination", "binomial expansion", "matrix", "\\bap\\b")] },
    { topic: "Sets, Relations & Functions", patterns: [rx("intersection", "bijective", "\\bf\\(x\\)", "\\bfunction\\b", "negation of the statement", "\\bset\\b")] },
  ],
  Physics: [
    { topic: "Heat & Thermodynamics", patterns: [rx("thermodynamic", "carnot", "specific heat", "calorimetr", "entropy", "newton's law of cooling", "ideal gas", "isothermal", "adiabatic", "expansion", "gas.*(pressure|volume)", "rms speed", "specific heats", "coefficient of linear expansion", "thermal conductivity", "heat transfer")] },
    { topic: "Optics", patterns: [rx("lens", "mirror", "refract", "reflect", "interference", "diffraction", "polariz", "prism", "dispersion", "telescope", "microscope", "fringe", "focal length", "double slit", "critical angle", "total internal reflection", "resolving power", "luminous intensity", "luminous efficiency", "blue color of sea", "blue colour of sea")] },
    { topic: "Electricity & Magnetism", patterns: [rx("electric", "current", "voltage", "resistance", "resistor", "capacitor", "capacitance", "magnetic", "induction", "circuit", "charge", "coulomb", "ohm", "kirchhoff", "transformer", "solenoid", "galvanometer", "\\bemf\\b", "dielectric", "self-induct", "hysteresis", "ac into dc")] },
    { topic: "Modern Physics", patterns: [rx("photoelectric", "radioactiv", "quantum", "semiconductor", "photon", "de broglie", "de-broglie", "bohr", "half-life", "nuclear", "transistor", "diode", "modulation", "atomic number", "nucleus", "electron.*proton.*neutron", "binding energy")] },
    { topic: "Oscillations, Waves & Sound", patterns: [rx("\\bshm\\b", "oscillat", "pendulum", "\\bwave\\b", "wavelength", "frequency", "resonance", "beats", "doppler", "organ pipe", "stationary wave", "harmonic", "tuning fork")] },
    { topic: "Properties of Matter & Fluids", patterns: [rx("young's modulus", "viscosity", "surface tension", "capillary", "elastic", "stress", "strain", "bernoulli", "buoyan", "terminal velocity", "bulk modulus", "density")] },
    { topic: "Mechanics", patterns: [rx("velocity", "acceleration", "projectile", "newton", "force", "friction", "collision", "momentum", "work done", "circular motion", "centripetal", "moment of inertia", "torque", "angular momentum", "equilibrium", "vectors of equal magnitude", "gravitation", "gravity", "escape velocity", "satellite", "spring constant", "kinetic energy", "potential energy", "dropped from a height", "thrown vertically", "block of mass", "body of mass", "vector quantity", "dimensional formula", "dimension ml", "rotate about its axis")] },
  ],
  Chemistry: [
    { topic: "Organic Chemistry", patterns: [rx("alkane", "alkyne", "alkene", "benzene", "hydrocarbon", "phenol", "carboxylic", "amine", "\\bester\\b", "alcohol", "aldehyde", "ketone", "isomer", "iupac", "ethanol", "ethanoic", "ethyl", "polymer", "rubber", "markovnikov", "friedel-crafts", "aldol", "aniline", "\\burea\\b", "iodoform", "grignard", "rmgx", "functional group", "organic compound", "hybridization of carbon", "glucose", "denaturation", "sweetest sugar", "gammexane", "different structures are called", "acetylene", "phenyl isocyanide")] },
    { topic: "Inorganic Chemistry", patterns: [rx("periodic table", "atomic radius", "electronegativ", "ionization energy", "electronic configuration", "noble gas", "alkali metal", "transition", "\\bore\\b", "metallurg", "extract(ed|ion|ing)? of", "\\balloy\\b", "coordinate covalent", "oxidation state", "bonding in", "halogen", "phosphorus", "sulphur", "nitrogen shows", "chlorine", "steel contains", "matte contains", "bell.metal", "brass", "allotrop", "manufactured industrially", "coinage metal", "pseudo halide", "fajans", "protons and neutrons", "atomic nucleus", "unit cell", "edge atom", "orbitals present", "shape of nh3", "h3bo3", "reducing agent", "displaces cu", "amphoteric", "hardest naturally occurring", "antiknock")] },
    { topic: "Physical Chemistry", patterns: [rx("\\bmole\\b", "avogadro", "gas.*volume", "wrong for gases", "\\bph\\b", "buffer", "equilibrium", "rate of.*reaction", "activation energy", "catalyst", "enthalpy", "\\bentropy\\b", "gibbs", "electrode", "galvanic cell", "solubility", "molarity", "van der waals", "electrolyt", "colloidal", "conservation of mass", "heat of formation", "oxidation is defined", "endothermic", "exothermic", "deposits.*g of", "electrolysis")] },
    { topic: "Environmental & Analytical Chemistry", patterns: [rx("pollution", "ozone layer", "greenhouse", "qualitative analysis", "volumetric analysis", "water gas", "atmospheric pollution")] },
  ],
  English: [
    { topic: "Grammar & Sentence Structure", patterns: [rx("tense", "\\bverb\\b", "sentence", "passive", "active voice", "conditional", "preposition", "gerund", "participle", "infinitive", "punctuation", "question tag", "subject-verb", "indirect speech", "part of speech")] },
    { topic: "Vocabulary & Idioms", patterns: [rx("idiom", "meaning of", "antonym", "synonym", "benevolent", "scarce")] },
    { topic: "Phonetics & Pronunciation", patterns: [rx("vowel", "syllable", "spelled", "phonetics", "stress")] },
    { topic: "Reading Comprehension", patterns: [rx("^read:", "passage", "comprehension", "according to this statement")] },
  ],
  MAT: [
    { topic: "Blood Relations", patterns: [rx("related to the man", "related to that boy", "how is the woman", "how d is related", "family consists", "daughter-in-law", "brother of|sister of|father of|mother of")] },
    { topic: "Coding-Decoding", patterns: [rx("is coded", "coded as", "is written as", "if.*means")] },
    { topic: "Number & Letter Series", patterns: [rx("series", "missing number", "next number", "comes next", "sequence", "fraction comes next", "missing letters", "replaces the question mark")] },
    { topic: "Direction Sense", patterns: [rx("walks.*(east|west|north|south)", "direction is he facing", "become\\?", "south-east")] },
    { topic: "Clock & Calendar", patterns: [rx("clock", "day before yesterday", "hands.*clock", "hour hand")] },
    { topic: "Analogy & Classification", patterns: [rx("is to.*as", "odd one out", "does not belong", "least like", "related word", "cannot be formed", "different from the others")] },
    { topic: "Logical Reasoning & Puzzles", patterns: [rx("statement:", "conclusion:", "cube.*painted", "train \\d", "minimum number of members", "triangles are there", "row of \\d+ students", "position from the (left|right)")] },
  ],
  Biology: [
    { topic: "Genetics & Molecular Biology", patterns: [rx("\\bdna\\b", "\\brna\\b", "\\bgene\\b", "mendel", "chromosome", "allele", "meiosis", "mitosis", "heredity", "genetic engineering", "\\bpcr\\b", "bt cotton", "crossing over", "replication", "transcription", "genotype", "blood group")] },
    { topic: "Cell Biology", patterns: [rx("powerhouse of the cell", "organelle", "cell wall", "golgi", "mitochondria", "nucleus is", "membranous")] },
    { topic: "Plant Physiology", patterns: [rx("photosynthesis", "transpiration", "translocation", "plant hormone", "fruit ripening", "glycolysis", "calvin cycle")] },
    { topic: "Plant Diversity", patterns: [rx("bryophyte", "\\bfern", "gymnosperm", "angiosperm", "\\balgae\\b")] },
    { topic: "Human Physiology", patterns: [rx("kidney", "\\bbrain\\b", "insulin", "\\bheart\\b", "haemoglobin", "\\blung", "nervous system", "digestion", "bile", "\\bgland\\b", "puberty", "sperm", "gamete", "fertili[sz]ation")] },
    { topic: "Nutrition, Health & Diseases", patterns: [rx("vitamin", "deficiency", "scurvy", "iodine", "\\baids\\b", "tuberculosis", "malaria", "vector-borne", "antibod")] },
    { topic: "Ecology & Evolution", patterns: [rx("ecosystem", "food chain", "decompose", "biodiversity", "darwin", "\\bfossil", "analogous organ", "homologous organ", "taxonomic", "classification", "\\bkingdom\\b", "binomial nomenclature", "\\bphylum\\b", "global warming")] },
  ],
  Zoology: [
    { topic: "Genetics & Molecular Biology", patterns: [rx("\\bdna\\b", "\\brna\\b", "synapsis", "crossing over", "replication", "genetic material")] },
    { topic: "Animal Diversity & Classification", patterns: [rx("phylum", "vestigial organ", "bacteriophage", "scientific name")] },
    { topic: "Human Physiology", patterns: [rx("peristalsis", "hormone", "\\bgland\\b", "blood", "immunit", "kidney", "\\bbrain\\b", "muscle", "\\bheart\\b", "\\blung", "epiglottis", "digestion", "rennin", "reproduct", "spermatogenesis", "fertilisation", "nephron", "cranial nerves", "sa node", "corpus callosum")] },
  ],
  Botany: [
    { topic: "Genetics", patterns: [rx("homozygous", "crossing over", "genetic engineering", "totipotency")] },
    { topic: "Cell Biology", patterns: [rx("golgi complex", "quiescent centre", "spindle fibre")] },
    { topic: "Plant Physiology", patterns: [rx("imbibition", "water potential", "stomata", "companion cells", "photosynthesis", "calvin cycle", "pyruvic acid", "abscisic acid", "growth hormone", "\\bdwarf\\b", "pigment")] },
    { topic: "Plant Diversity & Morphology", patterns: [rx("nostoc", "columella", "\\bnut\\b", "inflorescence", "\\bcork\\b", "nepenthes", "lichen", "fungi imperfecti", "deuteromycetes")] },
    { topic: "Ecology", patterns: [rx("niche", "ozone layer", "biofertilizer", "energy enters an ecosystem")] },
  ],
};

function classify(subject: string, text: string): string {
  const rules = RULES[subject];
  if (!rules) return "General";
  for (const rule of rules) {
    if (rule.patterns.some((p) => p.test(text))) return rule.topic;
  }
  return `General ${subject}`;
}

async function main() {
  const questions = await prisma.question.findMany({ select: { id: true, subject: true, text: true } });
  console.log(`Classifying ${questions.length} questions...`);

  const counts: Record<string, number> = {};
  for (const q of questions) {
    const topic = classify(q.subject, q.text);
    counts[`${q.subject} :: ${topic}`] = (counts[`${q.subject} :: ${topic}`] ?? 0) + 1;
    await prisma.question.update({ where: { id: q.id }, data: { topic } });
  }

  console.log("\nTopic distribution:");
  for (const [k, v] of Object.entries(counts).sort()) {
    console.log(`  ${k}: ${v}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
