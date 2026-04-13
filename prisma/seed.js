// 1. Import your existing prisma config instead of a new client
import prisma from "../src/config/prisma.js";
import bcrypt from "bcryptjs";

async function main() {
  const adminEmail = "admin@leddar.com";
  const adminPassword = "SuperSecureAdminPassword123";

  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (existingAdmin) {
    console.log("Admin already exists. Skipping seed.");
    return;
  }

  const hashedPassword = await bcrypt.hash(adminPassword, 10);

  const admin = await prisma.user.create({
    data: {
      email: adminEmail,
      password: hashedPassword,
      role: "ADMIN",
      status: "APPROVED",
      emailVerified: true,
      admin: {
        create: {
          name: "System Administrator",
        },
      },
    },
  });

  console.log(`✅ Admin created: ${admin.email}`);
}

main()
  .catch((e) => {
    console.error("❌ Seed Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
