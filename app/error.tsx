"use client";

import { useEffect } from "react";
import { logger }    from "@/lib/logger";

interface Props {
  error:  Error & { digest?: string };
  reset:  () => void;
}

// Captura erros não tratados em Server Components — complementa o ErrorBoundary
// (que só cobre Client Components). Emite log estruturado para observabilidade.
export default function GlobalError({ error, reset }: Props) {
  useEffect(() => {
    logger.error("GlobalError", error.message, {
      digest: error.digest,
      stack:  error.stack,
    });
  }, [error]);

  return (
    <html lang="pt-BR">
      <body className="bg-dark-900 text-white antialiased">
        <div className="min-h-screen flex items-center justify-center px-4">
          <div className="text-center max-w-sm">
            <p className="text-4xl font-bold text-brand-500 mb-2">500</p>
            <p className="text-white font-semibold text-lg">Algo deu errado</p>
            <p className="text-gray-500 text-sm mt-2">
              Um erro inesperado ocorreu. Nosso time foi notificado.
            </p>
            <button
              onClick={reset}
              className="mt-6 px-5 py-2 bg-brand-500 hover:bg-brand-600 text-white
                         rounded-lg text-sm font-semibold transition-colors"
            >
              Tentar novamente
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
