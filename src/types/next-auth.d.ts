import { UserRole } from "@prisma/client";
import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: UserRole;
      username: string;
      karma: number;
      isBanned: boolean;
    } & DefaultSession["user"];
  }

  interface User {
    role?: UserRole;
    username?: string;
    karma?: number;
    isBanned?: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: UserRole;
    username: string;
    karma: number;
    isBanned: boolean;
  }
}
