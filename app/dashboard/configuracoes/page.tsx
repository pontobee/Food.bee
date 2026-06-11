"use client";

import { useSession } from "next-auth/react";
import { Settings, User, Bell } from "lucide-react";

export default function ConfiguracoesPage() {
  const { data: session } = useSession();
  const role = session?.user?.role;

  return (
    <div className="space-y-5 max-w-2xl">
      <div>
        <h1 className="text-xl font-bold text-white">Configurações</h1>
        <p className="text-sm text-gray-500 mt-0.5">Preferências do sistema</p>
      </div>

      {/* Perfil */}
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-4">
          <User size={15} className="text-brand-400" />
          <h2 className="font-semibold text-white text-sm">Meu perfil</h2>
        </div>
        <div className="space-y-3">
          <div>
            <p className="text-xs text-gray-500 mb-1">Nome</p>
            <p className="text-sm text-white">{session?.user?.name}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">E-mail</p>
            <p className="text-sm text-white">{session?.user?.email}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Perfil de acesso</p>
            <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${
              role === "ADMIN"
                ? "bg-brand-500/15 text-brand-400"
                : "bg-blue-500/15 text-blue-400"
            }`}>
              {role}
            </span>
          </div>
        </div>
      </div>

      {/* Lanchonete — somente ADMIN */}
      {role === "ADMIN" && (
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Settings size={15} className="text-brand-400" />
            <h2 className="font-semibold text-white text-sm">Lanchonete</h2>
          </div>
          <p className="text-sm text-gray-500">
            Edição dos dados da lanchonete estará disponível em breve.
          </p>
        </div>
      )}

      {/* Assinatura */}
      {role === "ADMIN" && (
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-2">
            <Bell size={15} className="text-brand-400" />
            <h2 className="font-semibold text-white text-sm">Assinatura</h2>
          </div>
          <p className="text-sm text-gray-500">
            Status: <span className="text-emerald-400 font-medium">
              {session?.user?.assinatura_status}
            </span>
          </p>
        </div>
      )}
    </div>
  );
}
