import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// One-time (re-)backfill: assigns a `topic` to every existing question using
// keyword rules that match the OFFICIAL government syllabi:
//   - CEE: "Syllabus for Bachelor level Common Entrance Examination" (MEC, 2026 revision)
//   - IOE: "Detail Syllabus of B.E./B.Arch. Entrance Examination-2080"
// Rules are keyed by exam+subject because the two exams define different unit
// structures even for identically-named subjects (e.g. CEE splits Electrostatics
// & Capacitors from Current Electricity & Magnetism; IOE merges them into one
// "Electricity & Magnetism" unit. CEE combines Waves+Optics into one unit; IOE
// splits "Geometric and Physical Optics" from "Waves and Sound").
type Rule = { topic: string; patterns: RegExp[] };

function rx(...words: string[]): RegExp {
  return new RegExp(words.join("|"), "i");
}

const RULES: Record<string, Rule[]> = {
  // ───────────────────────── CEE ─────────────────────────
  "CEE::Zoology": [
    { topic: "Evolutionary Biology", patterns: [rx("evolution", "darwin", "natural selection", "ramapithecus", "homologous organ", "analogous organ", "fossil")] },
    { topic: "Study of Selected Animals", patterns: [rx("plasmodium", "malaria", "pheretima", "earthworm", "peristalsis", "\\brana\\b", "\\bfrog\\b")] },
    { topic: "Microbial Diseases and Immunology", patterns: [rx("typhoid", "tuberculosis", "\\bhiv\\b", "\\baids\\b", "cholera", "influenza", "hepatitis", "candidiasis", "immunit", "antigen", "antibod", "vaccine", "bacteriophage")] },
    { topic: "Medical Technology and Applied Biology", patterns: [rx("transplant", "in-vitro fertili[sz]ation", "\\bivf\\b", "amniocentesis", "transgenic", "genetic engineering", "\\bpcr\\b", "vector in genetic", "bt cotton", "biofertilizer", "genetically identical copies")] },
    { topic: "Biota, Environment and Conservation", patterns: [rx("ecosystem", "food chain", "decompose", "biodiversity", "global warming", "pollution", "endangered", "conservation", "migration", "taxis", "adaptation")] },
    { topic: "Animal Tissues and Histology", patterns: [rx("epithelial", "connective tissue", "muscular tissue", "nervous tissue", "\\btissue\\b")] },
    { topic: "Animal Diversity and Classification", patterns: [rx("\\bphylum\\b", "vestigial organ", "scientific name", "taxonomic category", "binomial nomenclature", "\\bkingdom\\b", "classification", "unicellular", "belong to which class", "warm-blooded", "malpighian tubules")] },
    { topic: "Human Biology and Physiology", patterns: [rx("digest", "respirat", "circulat", "\\bblood\\b", "\\bheart\\b", "kidney", "nephron", "nervous system", "\\bbrain\\b", "\\beye\\b", "\\bear\\b", "endocrin", "hormone", "\\bgland\\b", "reproduct", "spermatogenesis", "fertili[sz]ation", "gamete", "menstrual", "haemoglobin", "muscle", "epiglottis", "corpus callosum", "cranial nerves", "sa node", "homeostasis", "synapsis", "\\bdna\\b", "\\brna\\b", "insulin", "water balance", "graafian follicle", "henle's loop", "rennin", "colour of urine", "kupffer", "hardest substance in the human body", "clotting", "constant internal environment", "rh factor", "digestive and respiratory")] },
  ],
  "CEE::Botany": [
    { topic: "Basic Components of Life", patterns: [rx("carbohydrate", "\\blipid\\b", "\\bprotein\\b", "\\benzyme", "biological role of")] },
    { topic: "Cell Biology", patterns: [rx("golgi", "quiescent centre", "spindle fibre", "\\bmitosis\\b", "\\bmeiosis\\b", "cell organelle")] },
    { topic: "Genetics", patterns: [rx("homozygous", "heterozygous", "crossing over", "\\bmendel", "mutation", "polyploidy", "sex-linked")] },
    { topic: "Plant Anatomy", patterns: [rx("vascular bundle", "\\bcork\\b", "t\\.s\\.", "l\\.s\\.", "monocot.*root", "dicot.*root", "plant tissue", "secondary growth")] },
    { topic: "Plant Physiology", patterns: [rx("imbibition", "water potential", "osmosis", "plasmolysis", "stomata", "companion cells", "transpiration", "translocation", "photosynthesis", "calvin cycle", "pyruvic acid", "acetyl-coa", "abscisic acid", "growth hormone", "\\bdwarf\\b", "pigment", "light energy.*chemical energy", "aerobic and anaerobic respiration")] },
    { topic: "Developmental Botany", patterns: [rx("sporogenesis", "gametogenesis", "pollination", "double fertilisation", "endosperm", "dicot embryo", "pollen grain")] },
    { topic: "Applied Botany", patterns: [rx("tissue culture", "totipotency", "genetic engineering", "plant breeding", "biofertilizer")] },
    { topic: "Ecology and Vegetation", patterns: [rx("niche", "ozone layer", "greenhouse", "forest type", "ecological succession", "hydrosere", "xerosere", "biogeochemical", "energy enters an ecosystem")] },
    { topic: "Biodiversity", patterns: [rx("nostoc", "columella", "\\bnut\\b", "inflorescence", "nepenthes", "lichen", "fungi imperfecti", "deuteromycetes", "\\balgae\\b", "bryophyte", "\\bfern", "gymnosperm", "angiosperm", "medicinal plant", "largest leaf", "stimulant")] },
  ],
  // "Biology" is an unsplit CEE bucket (Set 2 upload) spanning both Botany and
  // Zoology content — classify each question into whichever list fits, unioning
  // both official topic sets since the DB doesn't separate them by subject here.
  "CEE::Biology": [
    { topic: "Genetics", patterns: [rx("\\bdna\\b", "\\brna\\b", "\\bgene\\b", "mendel", "chromosome", "allele", "\\bmeiosis\\b", "\\bmitosis\\b", "genetic engineering", "\\bpcr\\b", "bt cotton", "crossing over", "replication", "transcription", "genotype", "blood group", "heterozygous.*homozygous", "genetically identical copies")] },
    { topic: "Cell Biology", patterns: [rx("powerhouse of the cell", "organelle", "cell wall", "golgi", "mitochondria", "membranous", "energy currency")] },
    { topic: "Plant Physiology", patterns: [rx("photosynthesis", "transpiration", "translocation", "plant hormone", "fruit ripening", "glycolysis", "calvin cycle", "water and minerals", "vegetative propagation")] },
    { topic: "Biodiversity", patterns: [rx("bryophyte", "\\bfern", "gymnosperm", "angiosperm", "\\balgae\\b")] },
    { topic: "Human Biology and Physiology", patterns: [rx("kidney", "\\bbrain\\b", "insulin", "\\bheart\\b", "haemoglobin", "\\blung", "nervous system", "digestion", "\\bbile\\b", "\\bgland\\b", "puberty", "sperm", "gamete", "fertili[sz]ation", "clotting", "constant internal environment", "rh factor", "digestive and respiratory", "earthworm")] },
    { topic: "Microbial Diseases and Immunology", patterns: [rx("vitamin", "deficiency", "scurvy", "iodine", "\\baids\\b", "tuberculosis", "malaria", "vector-borne", "antibod")] },
    { topic: "Evolutionary Biology", patterns: [rx("darwin", "\\bfossil", "analogous organ", "homologous organ", "evolution")] },
    { topic: "Biota, Environment and Conservation", patterns: [rx("ecosystem", "food chain", "decompose", "biodiversity", "global warming", "uv rays")] },
    { topic: "Animal Diversity and Classification", patterns: [rx("taxonomic", "classification", "\\bkingdom\\b", "binomial nomenclature", "\\bphylum\\b", "scientific name of humans", "unicellular", "belong to which class", "warm-blooded", "malpighian tubules")] },
  ],
  "CEE::Chemistry": [
    { topic: "Analytical Chemistry", patterns: [rx("qualitative analysis", "volumetric analysis", "chromatography", "lassaigne", "distinguish between an aldehyde and a ketone", "detect chloride", "giv(es|ing)? white ppt")] },
    { topic: "Applied Chemistry", patterns: [rx("haber process", "ostwald", "contact process", "solvay", "greenhouse gas", "ozone layer depletion", "antiknock", "polymer", "manufactured industrially", "water gas", "atmospheric pollution", "bleaching agent")] },
    { topic: "Organic Chemistry", patterns: [rx("alkane", "alkyne", "alkene", "benzene", "hydrocarbon", "phenol", "carboxylic", "amine", "\\bester\\b", "alcohol", "aldehyde", "ketone", "isomer", "iupac", "ethanol", "ethanoic", "ethyl", "rubber", "markovnikov", "friedel-crafts", "aldol", "aniline", "\\burea\\b", "iodoform", "grignard", "rmgx", "functional group", "organic compound", "hybridization of carbon", "glucose", "denaturation", "sweetest sugar", "gammexane", "different structures are called", "acetylene", "phenyl isocyanide")] },
    { topic: "Inorganic Chemistry", patterns: [rx("periodic table", "atomic radius", "electronegativ", "ionization energy", "electronic configuration", "noble gas", "alkali metal", "transition", "\\bore\\b", "metallurg", "extract(ed|ion|ing)? of", "\\balloy\\b", "coordinate covalent", "oxidation state", "bonding in", "halogen", "phosphorus", "sulphur", "nitrogen shows", "chlorine", "steel contains", "matte contains", "bell.metal", "brass", "allotrop", "coinage metal", "pseudo halide", "fajans", "protons and neutrons", "atomic nucleus", "unit cell", "edge atom", "orbitals present", "shape of nh3", "h3bo3", "reducing agent", "displaces cu", "amphoteric", "hardest naturally occurring", "structure of h₂o₂", "hydrogen peroxide", "abundant metal.*earth's crust", "sodium carbonate", "h₃bo₃")] },
    { topic: "Physical Chemistry", patterns: [rx("\\bmole\\b", "avogadro", "gas.*volume", "wrong for gases", "\\bph\\b", "buffer", "equilibrium", "rate of.*reaction", "activation energy", "catalyst", "enthalpy", "\\bentropy\\b", "gibbs", "electrode", "galvanic cell", "solubility", "molarity", "van der waals", "electrolyt", "colloidal", "conservation of mass", "heat of formation", "oxidation is defined", "endothermic", "exothermic", "deposits.*g of", "electrolysis", "number of atoms in", "average velocity at constant temperature", "moles of naoh")] },
  ],
  "CEE::Physics": [
    { topic: "Electrostatics and Capacitors", patterns: [rx("capacitor", "capacitance", "dielectric", "coulomb's law", "electric field", "equipotential", "charge of 5 c", "point charges", "electrification")] },
    { topic: "Current Electricity and Magnetism", patterns: [rx("current", "resistance", "resistor", "\\bohm", "kirchhoff", "transformer", "solenoid", "galvanometer", "\\bemf\\b", "magnetic", "self-induct", "hysteresis", "ac into dc", "voltage", "circuit", "heater wires")] },
    { topic: "Modern Physics", patterns: [rx("photoelectric", "radioactiv", "quantum", "semiconductor", "photon", "de broglie", "de-broglie", "bohr", "half-life", "nuclear", "transistor", "diode", "modulation", "atomic number", "\\bnucleus\\b", "electron.*proton.*neutron", "binding energy")] },
    { topic: "Waves and Optics", patterns: [rx("lens", "mirror", "refract", "reflect", "interference", "diffraction", "polariz", "prism", "dispersion", "telescope", "microscope", "fringe", "focal length", "double slit", "critical angle", "total internal reflection", "resolving power", "luminous intensity", "luminous efficiency", "blue colou?r of sea", "\\bshm\\b", "oscillat", "pendulum", "\\bwave\\b", "wavelength", "frequency", "resonance", "beats", "doppler", "organ pipe", "stationary wave", "harmonic", "tuning fork")] },
    { topic: "Heat and Thermodynamics", patterns: [rx("thermodynamic", "carnot", "specific heat", "calorimetr", "entropy", "newton's law of cooling", "ideal gas", "isothermal", "adiabatic", "expand on both heating", "gas.*(pressure|volume)", "rms speed", "specific heats", "coefficient of linear expansion", "thermal conductivity", "heat transfer", "co₂ is removed", "land and sea breeze", "solar cooker")] },
    { topic: "Mechanics", patterns: [rx("velocity", "acceleration", "projectile", "newton", "force", "friction", "collision", "momentum", "work done", "circular motion", "centripetal", "moment of inertia", "torque", "angular momentum", "equilibrium", "vectors of equal magnitude", "gravitation", "gravity", "escape velocity", "satellite", "spring constant", "kinetic energy", "potential energy", "dropped from a height", "thrown vertically", "block of mass", "body of mass", "vector quantity", "dimensional formula", "dimension ml", "rotate about its axis", "young's modulus", "viscosity", "surface tension", "capillary", "elastic", "stress", "strain", "bernoulli", "buoyan", "terminal velocity", "bulk modulus", "density", "dot product of two vectors", "vector a makes", "released from a tower", "systematic error", "projected with", "droplet to be spherical")] },
  ],
  "CEE::MAT": [
    { topic: "Verbal Reasoning", patterns: [rx("related to the man", "related to that boy", "how is the woman", "how d is related", "family consists", "daughter-in-law", "brother of|sister of|father of|mother of", "is coded", "coded as", "is written as", "walks.*(east|west|north|south)", "direction is he facing", "become\\?", "south-east", "is to.*as", "odd one out", "does not belong", "least like", "related word", "cannot be formed", "different from the others", "statement:", "conclusion:")] },
    { topic: "Logical Sequencing", patterns: [rx("series", "missing number", "next number", "comes next", "sequence", "fraction comes next", "missing letters", "replaces the question mark", "cube.*painted", "triangles are there")] },
    { topic: "Numerical Reasoning", patterns: [rx("train \\d", "row of \\d+ students", "position from the (left|right)", "clock", "day before yesterday", "hands.*clock", "hour hand", "if.*means")] },
  ],
  // ───────────────────────── IOE ─────────────────────────
  "IOE::Mathematics": [
    { topic: "Statistics and Probability", patterns: [rx("central tendency", "\\bprobability\\b", "bayes", "\\bmean\\b", "\\bmedian\\b", "\\bmode\\b", "correlation", "regression", "events a and b are independent", "p\\(a and b\\)")] },
    { topic: "Trigonometry", patterns: [rx("sin\\(", "cos\\(", "tan\\(", "sin\\^-1", "cos\\^-1", "cosine rule", "trigonometric", "in-centre", "ortho-centre", "circum-centre", "point of concurrency")] },
    { topic: "Coordinate Geometry", patterns: [rx("slope", "straight line", "\\bcircle\\b", "parabola", "ellipse", "hyperbola", "eccentricity", "3d space", "equation of a plane", "distance of a point", "interval \\(")] },
    { topic: "Calculus", patterns: [rx("limit", "l'hospital", "derivative", "differential equation", "integral", "integrating factor", "tangent to a curve", "local maximum")] },
    { topic: "Vectors and their Products", patterns: [rx("vector product", "scalar product", "triple product", "linearly independent", "\\bvectors\\b")] },
    { topic: "Algebra", patterns: [rx("conjugate", "\\bz =", "imaginary", "complex number", "quadratic", "\\broots\\b", "common difference", "geometric series", "permutation", "combination", "binomial expansion", "matrix", "\\bap\\b", "ways to select")] },
    { topic: "Set, Logic and Functions", patterns: [rx("intersection", "bijective", "\\bf\\(x\\)", "\\bfunction\\b", "negation of the statement", "\\bset\\b")] },
  ],
  "IOE::Physics": [
    { topic: "Electricity & Magnetism", patterns: [rx("electric", "current", "voltage", "resistance", "resistor", "capacitor", "capacitance", "magnetic", "induction", "circuit", "charge", "coulomb", "ohm", "kirchhoff", "transformer", "solenoid", "galvanometer", "\\bemf\\b", "dielectric", "self-induct", "hysteresis", "ac into dc", "lenz")] },
    { topic: "Modern Physics", patterns: [rx("photoelectric", "radioactiv", "quantum", "semiconductor", "photon", "de broglie", "de-broglie", "bohr", "half-life", "nuclear", "transistor", "diode", "modulation", "atomic number", "\\bnucleus\\b", "electron.*proton.*neutron", "binding energy", "rutherford")] },
    { topic: "Geometric and Physical Optics", patterns: [rx("lens", "mirror", "refract", "reflect", "interference", "diffraction", "polariz", "prism", "dispersion", "telescope", "microscope", "fringe", "focal length", "double slit", "critical angle", "total internal reflection", "resolving power", "luminous intensity", "luminous efficiency", "denser to rarer")] },
    { topic: "Waves and Sound", patterns: [rx("\\bshm\\b", "oscillat", "pendulum", "\\bwave\\b", "wavelength", "frequency", "resonance", "beats", "doppler", "organ pipe", "stationary wave", "harmonic", "tuning fork", "blue colou?r of sea", "speed of sound")] },
    { topic: "Heat and Thermodynamics", patterns: [rx("thermodynamic", "carnot", "specific heat", "calorimetr", "entropy", "newton's law of cooling", "ideal gas", "isothermal", "adiabatic", "gas.*(pressure|volume)", "rms speed", "specific heats", "coefficient of linear expansion", "thermal conductivity", "heat transfer", "pressure exerted by a gas")] },
    { topic: "Mechanics", patterns: [rx("velocity", "acceleration", "projectile", "newton", "force", "friction", "collision", "momentum", "work done", "circular motion", "centripetal", "moment of inertia", "torque", "angular momentum", "equilibrium", "vectors of equal magnitude", "gravitation", "gravity", "escape velocity", "satellite", "spring constant", "kinetic energy", "potential energy", "dropped from a height", "thrown vertically", "block of mass", "body of mass", "vector quantity", "dimensional formula", "dimension ml", "rotate about its axis", "young's modulus", "viscosity", "surface tension", "capillary", "elastic", "stress", "strain", "bernoulli", "buoyan", "terminal velocity", "bulk modulus", "density")] },
  ],
  "IOE::Chemistry": [
    { topic: "Organic Chemistry", patterns: [rx("alkane", "alkyne", "alkene", "benzene", "hydrocarbon", "phenol", "carboxylic", "amine", "\\bester\\b", "alcohol", "aldehyde", "ketone", "isomer", "iupac", "ethanol", "ethanoic", "ethyl", "rubber", "markovnikov", "friedel-crafts", "aldol", "aniline", "\\burea\\b", "iodoform", "grignard", "rmgx", "functional group", "organic compound", "hybridization of carbon", "glucose", "different structures are called")] },
    { topic: "Inorganic Chemistry", patterns: [rx("periodic table", "atomic radius", "electronegativ", "ionization energy", "electronic configuration", "noble gas", "alkali metal", "transition", "\\bore\\b", "metallurg", "extract(ed|ion|ing)? of", "\\balloy\\b", "coordinate covalent", "oxidation state", "bonding in", "halogen", "phosphorus", "sulphur", "chlorine", "coinage metal", "allotrop", "manufactured industrially")] },
    { topic: "Physical Chemistry", patterns: [rx("\\bmole\\b", "avogadro", "gas.*volume", "\\bph\\b", "buffer", "equilibrium", "rate of.*reaction", "activation energy", "catalyst", "enthalpy", "\\bentropy\\b", "gibbs", "electrode", "galvanic cell", "solubility", "molarity", "van der waals", "electrolyt", "colloidal", "conservation of mass", "faraday", "deposits.*g of", "oxidation is defined", "volumetric analysis", "hydrogen gas is usually collected")] },
  ],
  "IOE::English": [
    { topic: "Grammar I", patterns: [rx("tense", "subject-verb", "indirect speech", "type of sentence", "transform.*sentence", "kinds of sentence", "question tag")] },
    { topic: "Phonetics", patterns: [rx("vowel", "syllable", "spelled", "phonetics", "stress")] },
    { topic: "Reading Comprehension", patterns: [rx("^read:", "passage", "comprehension", "according to this statement")] },
    { topic: "Grammar II", patterns: [rx("conditional", "preposition", "gerund", "participle", "infinitive", "punctuation", "passive", "active voice", "idiom", "meaning of", "antonym", "synonym", "benevolent", "scarce", "part of speech")] },
  ],
};

function classify(exam: string, subject: string, text: string): string {
  const rules = RULES[`${exam}::${subject}`];
  if (!rules) return "General";
  for (const rule of rules) {
    if (rule.patterns.some((p) => p.test(text))) return rule.topic;
  }
  return `General ${subject}`;
}

// Default: only classify rows that have never been tagged (topic IS NULL).
// This script's keyword classifier is a coarse fallback — many questions now
// have precise topic/subtopic data from real subtopic-wise source files
// (scripts/import-subtopic-mcqs.ts), and unconditionally reclassifying the
// whole table would silently overwrite that precise data with worse guesses.
// Pass --all to force reclassifying everything anyway (rarely correct — make
// sure you mean it), or --testId=<id> to scope to one test set (e.g. a
// freshly imported flat mock test with no subtopic data to protect).
async function main() {
  const args = process.argv.slice(2);
  const forceAll = args.includes("--all");
  const testIdArg = args.find((a) => a.startsWith("--testId="))?.split("=")[1];

  const where = testIdArg
    ? { testId: testIdArg }
    : forceAll
    ? {}
    : { topic: null };

  if (forceAll) {
    console.warn("--all: reclassifying EVERY question, including ones with existing precise topic/subtopic data. Make sure this is really what you want.");
  }

  const questions = await prisma.question.findMany({
    where,
    select: { id: true, subject: true, text: true, testSet: { select: { exam: true } } },
  });
  console.log(`Classifying ${questions.length} questions...`);

  const counts: Record<string, number> = {};
  for (const q of questions) {
    const exam = q.testSet.exam;
    const topic = classify(exam, q.subject, q.text);
    const key = `${exam} :: ${q.subject} :: ${topic}`;
    counts[key] = (counts[key] ?? 0) + 1;
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
