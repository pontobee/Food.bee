"use client";

import { useState, type FormEvent } from "react";
import { signIn }                    from "next-auth/react";
import { useRouter }                 from "next/navigation";
import Link                          from "next/link";
import { Mail, Lock, AlertCircle, Loader2 } from "lucide-react";
import { Wordmark } from "@/components/brand/Wordmark";

export default function LoginPage() {
  const router = useRouter();
  const [email,     setEmail]     = useState("");
  const [password,  setPassword]  = useState("");
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (res?.error) {
      if (res.code === "rate_limited") {
        const wait = parseInt(res.error ?? "0", 10);
        setError(
          wait > 0
            ? `Muitas tentativas. Aguarde ${Math.ceil(wait / 60)} min para tentar novamente.`
            : "Muitas tentativas. Tente novamente em alguns minutos."
        );
      } else {
        setError("E-mail ou senha incorretos.");
      }
      setLoading(false);
      return;
    }

    router.replace("/dashboard");
  }

  return (
    <main className="min-h-screen bg-dark-900 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <Wordmark size="lg" />
          <p className="text-dark-300 text-sm mt-2">Acesse o painel de gestão</p>
        </div>

        <div className="card p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label" htmlFor="email">E-mail</label>
              <div className="relative">
                <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-dark-300" />
                <input
                  id="email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@seuestabelecimento.com"
                  className="input pl-10 h-11"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-dark-200" htmlFor="password">Senha</label>
                <Link href="/forgot-password" className="text-xs text-brand-400 hover:text-brand-300 transition-colors">
                  Esqueci minha senha
                </Link>
              </div>
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-dark-300" />
                <input
                  id="password"
                  type="password"
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input pl-10 h-11"
                />
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30
                              rounded-lg px-4 py-3 text-sm text-red-400">
                <AlertCircle size={15} className="shrink-0" />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full justify-center"
            >
              {loading
                ? <Loader2 size={16} className="animate-spin" />
                : "Entrar"}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-dark-300 mt-4">
          Não tem uma conta?{" "}
          <Link href="/signup" className="text-brand-400 hover:text-brand-300 transition-colors">
            Criar conta grátis
          </Link>
        </p>
      </div>
    </main>
  );
}
