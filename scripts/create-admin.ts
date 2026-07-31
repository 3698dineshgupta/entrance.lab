import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = "entrance.whiztest@gmail.com";
  const password = "WhizAdmin@2026"; // Default password

  const existing = await prisma.user.findUnique({ where: { email } });

  if (existing) {
    // Just promote to ADMIN if already exists
    await prisma.user.update({
      where: { email },
      data: { role: "ADMIN" }
    });
    console.log(`✓ Promoted existing user "${email}" to ADMIN.`);
  } else {
    const hashed = await bcrypt.hash(password, 12);
    await prisma.user.create({
      data: {
        email,
        name: "WhizTest Admin",
        password: hashed,
        role: "ADMIN"
      }
    });
    console.log(`✓ Created ADMIN account: ${email}`);
    console.log(`  Default password: ${password}`);
    console.log(`  ⚠ Please change the password after first login.`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
