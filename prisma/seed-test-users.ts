import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

async function main() {
  // Test user credentials
  const testUsers = [
    {
      email: "test@example.com",
      password: "Password123!",
      name: "Test User",
    },
    {
      email: "demo@example.com",
      password: "DemoPass123!",
      name: "Demo User",
    },
  ];

  for (const userData of testUsers) {
    const existing = await db.user.findUnique({
      where: { email: userData.email },
    });

    if (!existing) {
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      const user = await db.user.create({
        data: {
          email: userData.email,
          name: userData.name,
          password: hashedPassword,
        },
      });

      // Create default workspace
      const workspace = await db.workspace.create({
        data: {
          name: `${userData.name}'s Workspace`,
          ownerId: user.id,
        },
      });

      // Add user to workspace
      await db.workspaceMember.create({
        data: {
          workspaceId: workspace.id,
          userId: user.id,
          role: "OWNER",
        },
      });

      console.log(
        `✅ Created user: ${userData.email} with password: ${userData.password}`
      );
    } else {
      console.log(`⏭️  User already exists: ${userData.email}`);
    }
  }

  console.log("\n📝 Test Credentials:");
  console.log("Email: test@example.com | Password: Password123!");
  console.log("Email: demo@example.com | Password: DemoPass123!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
