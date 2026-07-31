// Official topic → subtopic structure, transcribed from the government syllabi:
//   - CEE: "Syllabus for Bachelor level Common Entrance Examination" (Medical
//     Education Commission, 2026 revision)
//   - IOE: "Detail Syllabus of B.E./B.Arch. Entrance Examination-2080"
// Used to (a) order topics in curriculum sequence rather than by question
// count, and (b) show each topic's real subtopic coverage in the practice
// browser.
export interface SyllabusTopic {
  topic: string;
  subtopics: string[];
}

export const SYLLABUS: Record<string, Record<string, SyllabusTopic[]>> = {
  CEE: {
    Zoology: [
      { topic: "Evolutionary Biology", subtopics: ["Origin of life", "Evidences of evolution", "Lamarckism, Darwinism, Neo-Darwinism", "Human evolution"] },
      { topic: "Animal Diversity and Classification", subtopics: ["Classification from Protozoa to Chordata"] },
      { topic: "Animal Tissues and Histology", subtopics: ["Epithelial tissue", "Connective tissue", "Muscular tissue", "Nervous tissue"] },
      { topic: "Study of Selected Animals", subtopics: ["Plasmodium", "Earthworm (Pheretima)", "Frog (Rana)"] },
      { topic: "Human Biology and Physiology", subtopics: ["Digestive system", "Respiratory system", "Circulatory system", "Excretory system", "Nervous system", "Sense organs", "Endocrinology", "Reproductive system"] },
      { topic: "Microbial Diseases and Immunology", subtopics: ["Typhoid, TB, HIV, Cholera, Influenza, Hepatitis, Candidiasis", "Innate and acquired immunity", "Vaccines"] },
      { topic: "Medical Technology and Applied Biology", subtopics: ["Tissue and organ transplantation", "IVF, amniocentesis, transgenic animals", "Applied microbiology"] },
      { topic: "Biota, Environment and Conservation", subtopics: ["Animal behavior", "Environmental pollution", "Adaptations", "Conservation biology"] },
    ],
    Botany: [
      { topic: "Basic Components of Life", subtopics: ["Carbohydrates", "Lipids and minerals", "Proteins and enzymes"] },
      { topic: "Biodiversity", subtopics: ["Classification systems", "Monera and virus", "Fungi and lichens", "Algae", "Bryophytes", "Pteridophytes", "Gymnosperms", "Angiosperms", "Economic importance of plants"] },
      { topic: "Ecology and Vegetation", subtopics: ["Ecosystem ecology", "Biogeochemical cycles and ecological imbalances", "Vegetation and adaptation"] },
      { topic: "Cell Biology", subtopics: ["Prokaryotic and eukaryotic cells", "Cell organelles", "Cell cycle and division"] },
      { topic: "Genetics", subtopics: ["Genetic material (DNA/RNA)", "Mendelian genetics", "Sex-linked inheritance", "Mutation and polyploidy"] },
      { topic: "Plant Anatomy", subtopics: ["Plant tissues", "Vascular bundles", "Monocot and dicot anatomy"] },
      { topic: "Plant Physiology", subtopics: ["Water relations", "Photosynthesis", "Respiration", "Plant growth"] },
      { topic: "Developmental Botany", subtopics: ["Asexual and sexual reproduction", "Pollination and fertilization", "Embryo and endosperm"] },
      { topic: "Applied Botany", subtopics: ["Plant tissue culture", "Genetic engineering", "Biofertilizers and plant breeding"] },
    ],
    // Unsplit "Biology" bucket (a combined CEE upload) — topics span both
    // Zoology and Botany units, kept in the same order as the split lists.
    Biology: [
      { topic: "Evolutionary Biology", subtopics: ["Evidences of evolution", "Human evolution"] },
      { topic: "Animal Diversity and Classification", subtopics: ["Classification from Protozoa to Chordata"] },
      { topic: "Human Biology and Physiology", subtopics: ["Digestive, respiratory, circulatory, excretory, nervous, endocrine and reproductive systems"] },
      { topic: "Microbial Diseases and Immunology", subtopics: ["Diseases, immunity and vaccines"] },
      { topic: "Biota, Environment and Conservation", subtopics: ["Ecosystem, pollution, conservation"] },
      { topic: "Cell Biology", subtopics: ["Cell organelles"] },
      { topic: "Genetics", subtopics: ["Genetic material", "Mendelian genetics"] },
      { topic: "Plant Physiology", subtopics: ["Photosynthesis", "Transpiration", "Plant growth"] },
      { topic: "Biodiversity", subtopics: ["Algae, fungi, bryophytes, gymnosperms, angiosperms"] },
    ],
    Chemistry: [
      { topic: "Physical Chemistry", subtopics: ["Basic concepts & stoichiometry", "Atomic structure", "Classification & periodicity", "Chemical bonding", "Redox reactions", "States of matter", "Chemical equilibrium", "Volumetric analysis", "Ionic equilibrium", "Chemical kinetics", "Electrochemistry", "Chemical thermodynamics", "Nuclear chemistry"] },
      { topic: "Inorganic Chemistry", subtopics: ["Chemistry of non-metals", "Chemistry of metals", "Bio-inorganic chemistry"] },
      { topic: "Organic Chemistry", subtopics: ["General organic chemistry", "Hydrocarbons", "Aromatic hydrocarbons", "Haloalkanes and haloarenes", "Alcohols and phenols", "Ethers", "Aldehydes and ketones", "Carboxylic acids and derivatives", "Nitro-compounds", "Amines", "Organometallic compounds"] },
      { topic: "Applied Chemistry", subtopics: ["Manufacturing processes", "Applications of non-metals, metals & compounds", "Chemistry in service to mankind"] },
      { topic: "Analytical Chemistry", subtopics: ["Chemical tests", "Separation techniques", "Types of titration"] },
    ],
    Physics: [
      { topic: "Mechanics", subtopics: ["Physical quantities, vectors and scalars", "Kinematics", "Dynamics", "Rotational dynamics", "Fluid statics and dynamics", "Circular and periodic motion", "Gravity", "Elasticity"] },
      { topic: "Heat and Thermodynamics", subtopics: ["Thermal energy, heat and temperature", "Thermal expansion", "Quantity of heat", "Ideal gas", "First and second law of thermodynamics"] },
      { topic: "Waves and Optics", subtopics: ["Wave motion", "Stationary waves", "Acoustic phenomena", "Reflection, refraction and dispersion", "Interference", "Diffraction and polarization"] },
      { topic: "Current Electricity and Magnetism", subtopics: ["Electrical quantities", "Electrical circuits", "Thermoelectric effect", "Alternating currents", "Magnetic properties of materials", "Magnetic field", "Electromagnetic induction"] },
      { topic: "Electrostatics and Capacitors", subtopics: ["Electric charge and electric field", "Electric field strength, potential and potential energy", "Capacitors"] },
      { topic: "Modern Physics", subtopics: ["Nuclear physics", "Electron", "Photon", "Wave-particle duality", "Radioactivity", "Solid and semiconductor devices", "Particle physics and recent trends"] },
    ],
    MAT: [
      { topic: "Verbal Reasoning", subtopics: ["Blood relations", "Analogies", "Direction sense", "Coding-decoding", "Classification"] },
      { topic: "Numerical Reasoning", subtopics: ["Percentages and ratios", "Speed, distance and time", "Ages and averages"] },
      { topic: "Logical Sequencing", subtopics: ["Number series", "Letter series", "Pattern continuation"] },
      { topic: "Spatial Relation / Abstract Reasoning", subtopics: ["Shape and pattern recognition", "Figure folding"] },
    ],
  },
  IOE: {
    Mathematics: [
      { topic: "Set, Logic and Functions", subtopics: ["Set, real number system, intervals, absolute value", "Logic and connectives", "Function types, inverse and composite functions"] },
      { topic: "Algebra", subtopics: ["Matrices and determinants", "Complex numbers and polynomial equations", "Sequence, series, permutation and combination", "Binomial theorem"] },
      { topic: "Trigonometry", subtopics: ["Trigonometric equations", "Inverse trigonometric functions", "Properties of triangles"] },
      { topic: "Coordinate Geometry", subtopics: ["Straight lines and pair of lines", "Circles", "Conic sections", "Coordinates in space"] },
      { topic: "Calculus", subtopics: ["Limit and continuity", "Derivatives and their applications", "Integration and its applications", "Differential equations"] },
      { topic: "Vectors and their Products", subtopics: ["Vectors in plane and space", "Scalar and vector product", "Scalar triple product"] },
      { topic: "Statistics and Probability", subtopics: ["Measures of location and dispersion", "Correlation and regression", "Probability and Bayes' theorem"] },
    ],
    Physics: [
      { topic: "Mechanics", subtopics: ["Physical quantities, vectors and kinematics", "Newton's laws of motion and friction", "Work, energy and power", "Circular motion, gravitation and SHM", "Rotational dynamics", "Elasticity", "Fluid mechanics"] },
      { topic: "Heat and Thermodynamics", subtopics: ["Temperature and quantity of heat", "Thermal expansion", "Transfer of heat", "Thermal properties of matter", "Laws of thermodynamics"] },
      { topic: "Geometric and Physical Optics", subtopics: ["Reflection", "Refraction", "Dispersion", "Nature and propagation of light", "Interference", "Diffraction", "Polarization"] },
      { topic: "Waves and Sound", subtopics: ["Wave motion", "Mechanical waves", "Waves in pipes and strings", "Acoustic phenomena"] },
      { topic: "Electricity & Magnetism", subtopics: ["Electrostatics", "DC circuits", "Thermoelectric effect", "Magnetic effect", "Magnetic properties of matter", "Electromagnetic induction", "Alternating currents"] },
      { topic: "Modern Physics", subtopics: ["Electrons", "Photons and quantization of energy", "Solids and semiconductor devices", "Radioactivity and nuclear reaction", "Recent trends in physics"] },
    ],
    Chemistry: [
      { topic: "Physical Chemistry", subtopics: ["Chemical arithmetic", "States of matter", "Atomic structure and periodic classification", "Oxidation, reduction and equilibrium", "Volumetric analysis", "Ionic equilibrium", "Electrochemistry", "Chemical kinetics", "Chemical bonding"] },
      { topic: "Inorganic Chemistry", subtopics: ["Non-metals", "Metals", "Extraction of metals"] },
      { topic: "Organic Chemistry", subtopics: ["Introduction and nomenclature", "Hydrocarbons", "Haloalkanes and haloarenes", "Alcohols, phenols and ethers", "Aldehydes, ketones and carboxylic acids", "Nitro compounds and amines"] },
    ],
    English: [
      { topic: "Grammar I", subtopics: ["Sequence of tense", "Concord/agreement", "Direct and indirect speech", "Kinds and transformation of sentences"] },
      { topic: "Grammar II", subtopics: ["Basic grammatical patterns, conditional sentences", "Parts of speech, active/passive voice", "Infinitives, gerund and participles", "Punctuation and prepositions", "Vocabulary and idiomatic expressions"] },
      { topic: "Phonetics", subtopics: ["Phonemes (vowels/consonants)", "Syllables and stress"] },
      { topic: "Reading Comprehension", subtopics: ["General and technical English passages"] },
    ],
  },
};

export function getSubtopics(exam: string, subject: string, topic: string): string[] {
  return SYLLABUS[exam]?.[subject]?.find((t) => t.topic === topic)?.subtopics ?? [];
}

export function getTopicOrder(exam: string, subject: string): string[] {
  return (SYLLABUS[exam]?.[subject] ?? []).map((t) => t.topic);
}
