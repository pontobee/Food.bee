"use client";

import { useState, type FormEvent } from "react";
import { useParams, useRouter }      from "next/navigation";
import Link                          from "next/link";
import { Lock, Eye, EyeOff, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { Wordmark } from "@/components/brand/Wordmark";

export default function ResetPasswordPage() {
  const params = useParams();
  const router = useRouter();
  const token  = decodeURIComponent(params.token as string);

  const [senha,    setSenha]    = useState("");
  const [confirma, setConfirma] = useState("");
  const [verSenha, setVerSenha] = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [sucesso,  setSucesso]  = useState(false);
  const [error,    setError]    = useState<string | null>(null);

  const senhaMin  = senha.length >= 6;
  const senhaOk   = senha === confirma;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!senhaMin) { setError("A senha precisa ter ao menos 6 caracteres."); return; }
    if (!senhaOk)  { setError("As senhas não coincidem."); return; }

    setError(null);
    setLoading(true);

    const res = await fetch("/api/auth/reset-password", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ token, senha }),
    });

    const data = await res.json().catch(() => ({}));
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Erro ao redefinir senha.");
      return;
    }

    setSucesso(true);
    setTimeout(() => router.replace("/login"), 2500);
  }

  return (
    <main className="min-h-screen bg-dark-900 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">

        <div className="flex flex-col items-center mb-8">
          <Wordmark size="lg" />
          <p className="text-dark-300 text-sm mt-2">Nova senha</p>
        </div>

        <div className="card p-6">
          {sucesso ? (
            <div className="flex flex-col items-center text-center gap-3 py-2">
              <CheckCircle2 size={32} className="text-emerald-400" />
              <p className="text-white font-semibold">Senha redefinida!</p>
              <p className="text-sm text-gray-400">Redirecionando para o login...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Nova senha</label>
                <div className="relative">
                  <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input
                    type={verSenha ? "text" : "password"}
                    required
                    autoComplete="new-password"
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    className="input pl-10 pr-10 h-11"
                  />
                  <button
                    type="button"
                    onClick={() => setVerSenha((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white p-1"
                  >
                    {verSenha ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Confirmar senha</label>
                <div className="relative">
                  <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input
                    type={verSenha ? "text" : "password"}
                    required
                    autoComplete="new-password"
                    value={confirma}
                    onChange={(e) => setConfirma(e.target.value)}
                    placeholder="Repita a senha"
                    className="input pl-10 h-11"
                  />
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30
                                rounded-xl px-4 py-3 text-sm text-red-400">
                  <AlertCircle size={15} className="shrink-0" /> {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full justify-center"
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : "Redefinir senha"}
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-sm text-gray-500 mt-4">
          <Link href="/login" className="text-brand-400 hover:text-brand-300 transition-colors">
            Voltar ao login
          </Link>
        </p>

      </div>
    </main>
  );
}
