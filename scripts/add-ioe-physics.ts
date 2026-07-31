import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const EXTRA_IOE_PHYSICS: any[] = [
  { subject: "Physics", text: "A projectile is fired at 30° to horizontal with speed 40 m/s. Its range is (g=10):", options: ["80√3 m", "160 m", "80 m", "40√3 m"], correctIndex: 0, marks: 1, negativeMarks: 0.1 },
  { subject: "Physics", text: "The velocity of sound in air at 27°C is 340 m/s. At 127°C it will be approximately:", options: ["393 m/s", "350 m/s", "420 m/s", "310 m/s"], correctIndex: 0, marks: 1, negativeMarks: 0.1 },
  { subject: "Physics", text: "The unit of coefficient of viscosity is:", options: ["Pa·s", "N/m²", "N·s", "J/m³"], correctIndex: 0, marks: 1, negativeMarks: 0.1 },
  { subject: "Physics", text: "When a metallic sphere is heated, its density:", options: ["decreases", "increases", "remains same", "first increases then decreases"], correctIndex: 0, marks: 1, negativeMarks: 0.1 },
  { subject: "Physics", text: "The work done in moving a charge of 5 C through a potential difference of 12 V is:", options: ["60 J", "2.4 J", "17 J", "7 J"], correctIndex: 0, marks: 1, negativeMarks: 0.1 },
  { subject: "Physics", text: "The frequency of the third harmonic of a string of length L vibrating with tension T and mass per unit length μ is:", options: ["(3/2L)√(T/μ)", "(1/2L)√(T/μ)", "(3/L)√(T/μ)", "(2/3L)√(T/μ)"], correctIndex: 0, marks: 1, negativeMarks: 0.1 },
  { subject: "Physics", text: "A wire of resistance 12 Ω is stretched to double its length. Its new resistance is:", options: ["48 Ω", "24 Ω", "6 Ω", "3 Ω"], correctIndex: 0, marks: 1, negativeMarks: 0.1 },
  { subject: "Physics", text: "A body is dropped from a height of 80 m. Time taken to reach the ground (g=10 m/s²):", options: ["4 s", "8 s", "2 s", "6 s"], correctIndex: 0, marks: 1, negativeMarks: 0.1 },
  { subject: "Physics", text: "Pressure exerted by a gas is due to:", options: ["random motion of molecules", "repulsion between molecules", "attraction between molecules", "weight of molecules"], correctIndex: 0, marks: 1, negativeMarks: 0.1 },
  { subject: "Physics", text: "The angle of friction is the angle between the normal reaction and:", options: ["resultant reaction", "limiting friction", "applied force", "weight"], correctIndex: 0, marks: 1, negativeMarks: 0.1 },
  { subject: "Physics", text: "A body moves in a circle of radius r with speed v. Its centripetal acceleration is:", options: ["v²/r", "vr", "v/r", "v²r"], correctIndex: 0, marks: 1, negativeMarks: 0.1 },
  { subject: "Physics", text: "The ratio of specific heats Cp/Cv for a diatomic gas is:", options: ["7/5", "5/3", "4/3", "8/5"], correctIndex: 0, marks: 1, negativeMarks: 0.1 },
  { subject: "Physics", text: "An ideal transformer has 100 turns in primary and 50 turns in secondary. If primary voltage is 220 V, secondary voltage is:", options: ["110 V", "440 V", "55 V", "220 V"], correctIndex: 0, marks: 1, negativeMarks: 0.1 },
  { subject: "Physics", text: "A particle executes SHM with amplitude A. Its speed is maximum at:", options: ["mean position", "extreme position", "midpoint", "all positions equally"], correctIndex: 0, marks: 1, negativeMarks: 0.1 },
  { subject: "Physics", text: "Which type of wave cannot be polarized?", options: ["longitudinal waves", "transverse waves", "EM waves", "light waves"], correctIndex: 0, marks: 1, negativeMarks: 0.1 },
  { subject: "Physics", text: "A convex lens of focal length 20 cm forms a real image at 60 cm. Object distance is:", options: ["30 cm", "15 cm", "40 cm", "25 cm"], correctIndex: 0, marks: 1, negativeMarks: 0.1 },
  { subject: "Physics", text: "The escape velocity from Earth's surface is approximately:", options: ["11.2 km/s", "7.9 km/s", "3.0 km/s", "8.0 km/s"], correctIndex: 0, marks: 1, negativeMarks: 0.1 },
  { subject: "Physics", text: "In Ohm's law, the graph between V and I is a:", options: ["straight line", "parabola", "hyperbola", "circle"], correctIndex: 0, marks: 1, negativeMarks: 0.1 },
  { subject: "Physics", text: "The energy stored in a capacitor C charged to voltage V is:", options: ["½CV²", "CV²", "CV", "2CV²"], correctIndex: 0, marks: 1, negativeMarks: 0.1 },
  { subject: "Physics", text: "The de Broglie wavelength of a particle of mass m moving with velocity v is:", options: ["h/mv", "mv/h", "h·mv", "m/hv"], correctIndex: 0, marks: 1, negativeMarks: 0.1 },
  { subject: "Physics", text: "When light travels from denser to rarer medium, its speed:", options: ["increases", "decreases", "remains same", "becomes zero"], correctIndex: 0, marks: 1, negativeMarks: 0.1 },
  { subject: "Physics", text: "Kirchhoff's current law is based on conservation of:", options: ["charge", "energy", "momentum", "mass"], correctIndex: 0, marks: 1, negativeMarks: 0.1 },
  { subject: "Physics", text: "The half-life of a radioactive substance is 20 years. After 60 years, the fraction remaining is:", options: ["1/8", "1/4", "1/16", "1/6"], correctIndex: 0, marks: 1, negativeMarks: 0.1 },
  { subject: "Physics", text: "In a series LCR circuit at resonance, the impedance is:", options: ["R only", "maximum", "zero", "inductive"], correctIndex: 0, marks: 1, negativeMarks: 0.1 },
  { subject: "Physics", text: "The refractive index of glass is 1.5. The speed of light in glass is:", options: ["2×10⁸ m/s", "3×10⁸ m/s", "1.5×10⁸ m/s", "4×10⁸ m/s"], correctIndex: 0, marks: 1, negativeMarks: 0.1 },
  { subject: "Physics", text: "The gravitational potential energy of a body of mass m at height h above Earth's surface is:", options: ["-GMm/(R+h)", "mgh", "-mgh", "GMm/h"], correctIndex: 0, marks: 1, negativeMarks: 0.1 },
  { subject: "Physics", text: "The unit of magnetic flux is:", options: ["Weber (Wb)", "Tesla (T)", "Henry (H)", "Farad (F)"], correctIndex: 0, marks: 1, negativeMarks: 0.1 },
  { subject: "Physics", text: "Newton's second law of motion gives the measure of:", options: ["force", "velocity", "acceleration", "momentum"], correctIndex: 0, marks: 1, negativeMarks: 0.1 },
  { subject: "Physics", text: "In a Young's double slit experiment, the fringe width β is proportional to:", options: ["λD/d", "λd/D", "Dd/λ", "λ/Dd"], correctIndex: 0, marks: 1, negativeMarks: 0.1 },
  { subject: "Physics", text: "The photoelectric effect was explained by:", options: ["Einstein", "Newton", "Maxwell", "Planck"], correctIndex: 0, marks: 1, negativeMarks: 0.1 },
  { subject: "Physics", text: "Electromagnetic induction was discovered by:", options: ["Faraday", "Maxwell", "Hertz", "Ampere"], correctIndex: 0, marks: 1, negativeMarks: 0.1 },
  { subject: "Physics", text: "A body of mass 2 kg moving with velocity 4 m/s collides with a stationary body of mass 2 kg and they stick together. Their common velocity is:", options: ["2 m/s", "4 m/s", "0 m/s", "1 m/s"], correctIndex: 0, marks: 1, negativeMarks: 0.1 },
  { subject: "Physics", text: "The SI unit of luminous intensity is:", options: ["candela (cd)", "lumen (lm)", "lux (lx)", "watt (W)"], correctIndex: 0, marks: 1, negativeMarks: 0.1 },
  { subject: "Physics", text: "An object is placed at 2F from a converging lens. The image formed is:", options: ["real, inverted, same size at 2F", "virtual, erect at infinity", "real, inverted magnified", "real, erect at F"], correctIndex: 0, marks: 1, negativeMarks: 0.1 },
  { subject: "Physics", text: "Lenz's law is a consequence of conservation of:", options: ["energy", "charge", "momentum", "mass"], correctIndex: 0, marks: 1, negativeMarks: 0.1 },
  { subject: "Physics", text: "The threshold frequency of photoelectric effect depends on:", options: ["nature of metal surface", "intensity of light", "frequency of light", "wavelength of light"], correctIndex: 0, marks: 1, negativeMarks: 0.1 },
  { subject: "Physics", text: "Superconductors have electrical resistance:", options: ["zero", "infinite", "very high", "very low but non-zero"], correctIndex: 0, marks: 1, negativeMarks: 0.1 },
  { subject: "Physics", text: "The magnetic field inside a solenoid is:", options: ["uniform and parallel to axis", "radial", "zero", "circular"], correctIndex: 0, marks: 1, negativeMarks: 0.1 },
  { subject: "Physics", text: "Which of the following is a vector quantity?", options: ["displacement", "speed", "time", "temperature"], correctIndex: 0, marks: 1, negativeMarks: 0.1 },
  { subject: "Physics", text: "Power dissipated in a resistor R carrying current I is:", options: ["I²R", "IR", "I/R", "IR²"], correctIndex: 0, marks: 1, negativeMarks: 0.1 },
  { subject: "Physics", text: "Terminal velocity of a body falling through viscous fluid is reached when:", options: ["drag force equals weight", "acceleration is maximum", "velocity is zero", "weight equals buoyancy"], correctIndex: 0, marks: 1, negativeMarks: 0.1 },
  { subject: "Physics", text: "The phenomenon of total internal reflection requires light to travel from:", options: ["denser to rarer medium at angle > critical angle", "rarer to denser medium", "any medium at any angle", "vacuum to any medium"], correctIndex: 0, marks: 1, negativeMarks: 0.1 },
  { subject: "Physics", text: "The moment of inertia of a uniform disk of mass M and radius R about its central axis is:", options: ["MR²/2", "MR²", "2MR²/3", "MR²/4"], correctIndex: 0, marks: 1, negativeMarks: 0.1 },
  { subject: "Physics", text: "A ball thrown vertically upward with velocity u reaches maximum height h. At height h/2, its velocity is:", options: ["u/√2", "u/2", "u√2", "zero"], correctIndex: 0, marks: 1, negativeMarks: 0.1 },
  { subject: "Physics", text: "Beta particles emitted from a nucleus are:", options: ["fast-moving electrons", "helium nuclei", "electromagnetic radiation", "neutrons"], correctIndex: 0, marks: 1, negativeMarks: 0.1 },
  { subject: "Physics", text: "The critical angle for total internal reflection depends on:", options: ["the two media's refractive indices", "intensity of light", "frequency only", "thickness of the medium"], correctIndex: 0, marks: 1, negativeMarks: 0.1 },
  { subject: "Physics", text: "In Rutherford's alpha particle scattering experiment, most particles:", options: ["passed straight through", "were scattered at large angles", "were absorbed", "rebounded back"], correctIndex: 0, marks: 1, negativeMarks: 0.1 },
  { subject: "Physics", text: "A transformer operates on the principle of:", options: ["mutual induction", "self induction", "electrostatic induction", "piezoelectric effect"], correctIndex: 0, marks: 1, negativeMarks: 0.1 },
].map(q => ({ ...q, difficulty: "medium" }));

async function main() {
  // 1. Add questions to IOE Physics Practice Set 1 (subject test)
  const physicsSet = await prisma.testSet.findFirst({
    where: { title: "IOE Physics — Practice Set 1" }
  });

  if (physicsSet) {
    // Delete old questions
    await prisma.question.deleteMany({ where: { testId: physicsSet.id } });
    // Add new full set
    await prisma.testSet.update({
      where: { id: physicsSet.id },
      data: {
        durationMinutes: 60,
        questions: { create: EXTRA_IOE_PHYSICS }
      }
    });
    console.log(`Updated IOE Physics Practice Set 1 with ${EXTRA_IOE_PHYSICS.length} questions.`);
  } else {
    console.log("IOE Physics Practice Set 1 not found in DB, creating it...");
    await prisma.testSet.create({
      data: {
        title: "IOE Physics — Practice Set 1",
        exam: "IOE",
        mode: "subject",
        subject: "Physics",
        difficulty: "medium",
        durationMinutes: 60,
        isPublished: true,
        questions: { create: EXTRA_IOE_PHYSICS }
      }
    });
    console.log(`Created IOE Physics Practice Set 1 with ${EXTRA_IOE_PHYSICS.length} questions.`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
