import NextAuth, { getServerSession } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";

const config = {
  providers: [
    CredentialsProvider({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials: any) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const email = String(credentials.email);
        const password = String(credentials.password);

        const user = await db.user.findUnique({
          where: { email },
        });

        if (!user) {
          return null;
        }

        const passwordMatch = await bcrypt.compare(password, user.password || "");
        if (!passwordMatch) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt" as const,
  },
  pages: {
    signIn: "/auth/signin",
  },
  callbacks: {
    async jwt({ token, user }: any) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }: any) {
      (session.user as any).id = token.id;
      return session;
    },
  },
  events: {
    async signIn({ user }: any) {
      try {
        const existing = await db.workspace.findFirst({
          where: { ownerId: user.id },
        });
        if (!existing) {
          await db.workspace.create({
            data: {
              name: "My Workspace",
              ownerId: user.id,
            },
          });
        }
      } catch (err) {
        // Ignore
      }
    },
  },
};

const handler = NextAuth(config);
export { handler as GET, handler as POST };
export const auth = () => getServerSession(config);
