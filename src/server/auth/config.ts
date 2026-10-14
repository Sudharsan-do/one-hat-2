import { type DefaultSession, type NextAuthConfig } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { loginSchema } from "~/lib/validations/auth";
import bcrypt from "bcryptjs";

import { db } from "~/server/db";
import type { UserRole } from "@prisma/client";
import { generateSessionId } from "./session-util";

/**
 * Module augmentation for `next-auth` types. Allows us to add custom properties to the `session`
 * object and keep type safety.
 *
 * @see https://next-auth.js.org/getting-started/typescript#module-augmentation
 */
declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;
      role: UserRole;
    } & DefaultSession["user"];
    sessionId: string; // Add sessionId to Session type
  }
  interface User {
    role: UserRole;
  }
}

export const authConfig = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      id: "credentials",
      async authorize(credentials) {
        const model = loginSchema.safeParse({
          email: credentials.email,
          password: credentials.password
        });
        if(model.error) return null;
        const user = await db.user.findUnique({
          where: {
            email: credentials.email as string
          }
        });
        if(user){
          const match = await bcrypt.compare(model.data.password, user.hashedPassword!);
          if(match) return user;
        }
        console.error("Invalid credentials");
        return null;
      },
    }),
  ],
  session: { 
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 1 day
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        if (!token.sessionId) {
          token.sessionId = await generateSessionId();
          console.log("Generated new session ID:", token.sessionId);
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.role = token.role as UserRole;
        session.sessionId = token.sessionId as string;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;