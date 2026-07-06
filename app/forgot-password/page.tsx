"use client";

import { useState, type FormEvent } from "react";
import Link                          from "next/link";
import { UtensilsCrossed, Mail, ArrowLeft, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email,   setEmail]   = useState("");
  const [loading, setLoading] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await fetch("/api/auth/forgot-password", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ email }),
      });
      setEnviado(true);
    } catch {
      setError("Erro de conexão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-dark-900 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">

        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-brand-500 flex items-center justify-center mb-3">
            <UtensilsCrossed className="text-white" size={26} />
          </div>
          <h1 className="text-2xl font-bold text-white">LancheSmart</h1>
          <p className="text-gray-500 text-sm mt-1">Recuperar senha</p>
        </div>

        <div className="card p-6">
          {enviado ? (
            <div className="flex flex-col items-center text-center gap-3 py-2">
              <CheckCircle2 size={32} className="text-emerald-400" />
              <p className="text-white font-semibold">E-mail enviado!</p>
              <p className="text-sm text-gray-400">
                Se houver uma conta com este e-mail, você receberá as instruções em instantes.
                Verifique também a pasta de spam.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <p className="text-sm text-gray-400">
                Informe seu e-mail e enviaremos um link para criar uma nova senha.
              </p>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">E-mail</label>
                <div className="relative">
                  <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seu@email.com"
                    className="w-full h-11 bg-dark-700 border border-dark-600 rounded-xl
                               pl-10 pr-4 text-white text-sm placeholder:text-gray-600
                               focus:border-brand-500 focus:outline-none transition-colors"
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
                {loading ? <Loader2 size={16} className="animate-spin" /> : "Enviar link de recuperação"}
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-sm text-gray-500 mt-4">
          <Link href="/login" className="text-brand-400 hover:text-brand-300 transition-colors flex items-center justify-center gap-1">
            <ArrowLeft size={13} /> Voltar ao login
          </Link>
        </p>

      </div>
    </main>
  );
}
