import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id:                string;
      lanchonete_id:     string;
      lanchonete_nome:   string;
      role:              "ADMIN" | "CAIXA";
      assinatura_status: string;
    } & DefaultSession["user"];
  }
}
