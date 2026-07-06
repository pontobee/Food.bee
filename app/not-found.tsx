import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-dark-900 text-white flex items-center justify-center px-4">
      <div className="text-center max-w-sm">
        <p className="text-4xl font-bold text-brand-500 mb-2">404</p>
        <p className="text-white font-semibold text-lg">Página não encontrada</p>
        <p className="text-gray-500 text-sm mt-2">
          O endereço que você acessou não existe ou foi removido.
        </p>
        <Link
          href="/dashboard"
          className="mt-6 inline-block px-5 py-2 bg-brand-500 hover:bg-brand-600
                     text-white rounded-lg text-sm font-semibold transition-colors"
        >
          Voltar ao painel
        </Link>
      </div>
    </div>
  );
}
