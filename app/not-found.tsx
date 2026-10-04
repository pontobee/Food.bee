import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-dark-900 text-dark-100 flex items-center justify-center px-4">
      <div className="text-center max-w-sm">
        <p className="text-4xl font-semibold text-dark-100 mb-2 tabular-nums">404</p>
        <p className="text-dark-100 font-medium text-lg">Página não encontrada</p>
        <p className="text-dark-300 text-sm mt-2">
          O endereço que você acessou não existe ou foi removido.
        </p>
        <Link href="/dashboard" className="btn-primary mt-6 inline-flex">
          Voltar ao painel
        </Link>
      </div>
    </div>
  );
}
