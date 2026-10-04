"use client";

import { useState, type FormEvent } from "react";
import { signIn }                    from "next-auth/react";
import { useRouter }                 from "next/navigation";
import Link                          from "next/link";
import {
  Mail, Lock, User, Store, AlertCircle, Loader2,
} from "lucide-react";
import { Wordmark } from "@/components/brand/Wordmark";

export default function SignupPage() {
  const router = useRouter();

  const [nomeLanchonete, setNomeLanchonete] = useState("");
  const [nomeUsuario,    setNomeUsuario]    = useState("");
  const [email,          setEmail]          = useState("");
  const [senha,          setSenha]          = useState("");
  const [loading,        setLoading]        = useState(false);
  const [error,          setError]          = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await fetch("/api/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nome_lanchonete: nomeLanchonete,
        nome_usuario:    nomeUsuario,
        email,
        senha,
      }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Erro ao criar conta. Tente novamente.");
      setLoading(false);
      return;
    }

    // Conta criada — faz login automático
    const login = await signIn("credentials", {
      email,
      password: senha,
      redirect: false,
    });

    if (login?.error) {
      setError("Conta criada, mas não foi possível fazer login. Acesse a página de login.");
      setLoading(false);
      return;
    }

    router.replace("/dashboard");
  }

  return (
    <main className="min-h-screen bg-dark-900 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <Wordmark size="lg" />
          <p className="text-dark-300 text-sm mt-2">Crie sua conta grátis — 14 dias de trial</p>
        </div>

        {/* Card */}
        <div className="card p-6">
          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Nome do estabelecimento */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                Nome do estabelecimento
              </label>
              <div className="relative">
                <Store size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type="text"
                  required
                  value={nomeLanchonete}
                  onChange={(e) => setNomeLanchonete(e.target.value)}
                  placeholder="Hamburgueria do Zé"
                  className="input pl-10 h-11"
                />
              </div>
            </div>

            {/* Seu nome */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                Seu nome
              </label>
              <div className="relative">
                <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type="text"
                  required
                  value={nomeUsuario}
                  onChange={(e) => setNomeUsuario(e.target.value)}
                  placeholder="José Silva"
                  className="input pl-10 h-11"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                E-mail
              </label>
              <div className="relative">
                <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ze@hamburgueria.com"
                  className="input pl-10 h-11"
                />
              </div>
            </div>

            {/* Senha */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                Senha
              </label>
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type="password"
                  required
                  autoComplete="new-password"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className="input pl-10 h-11"
                />
              </div>
            </div>

            {/* Erro */}
            {error && (
              <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30
                              rounded-xl px-4 py-3 text-sm text-red-400">
                <AlertCircle size={15} className="shrink-0" />
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full justify-center"
            >
              {loading
                ? <Loader2 size={16} className="animate-spin" />
                : "Criar conta grátis"}
            </button>

          </form>
        </div>

        {/* Link para login */}
        <p className="text-center text-sm text-gray-500 mt-4">
          Já tem uma conta?{" "}
          <Link href="/login" className="text-brand-400 hover:text-brand-300 transition-colors">
            Entrar
          </Link>
        </p>

      </div>
    </main>
  );
}
