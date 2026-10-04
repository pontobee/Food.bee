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
            <p className="text-4xl font-semibold text-dark-100 mb-2 tabular-nums">500</p>
            <p className="text-dark-100 font-medium text-lg">Algo deu errado</p>
            <p className="text-dark-300 text-sm mt-2">
              Um erro inesperado ocorreu. Nosso time foi notificado.
            </p>
            <button
              onClick={reset}
              className="btn-primary mt-6"
            >
              Tentar novamente
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
