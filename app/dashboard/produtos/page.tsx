"use client";

import { useState }   from "react";
import useSWR         from "swr";
import { useSession } from "next-auth/react";
import {
  BookOpen, Plus, Pencil, Trash2, X, AlertTriangle,
  Lock, Loader2, ImageOff, Tag,
} from "lucide-react";
import { formatCurrency } from "@/utils/formatCurrency";
import type { ProdutoDTO } from "@/types";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";

// ─── Types ──────────────────────────────────────────────────────────────────

interface CategoriaDTO {
  id:        string;
  nome:      string;
  descricao: string | null;
  ordem:     number;
}

// ─── Modal: Categoria ────────────────────────────────────────────────────────

function CategoriaModal({
  categoria,
  onClose,
  onSalvo,
}: {
  categoria: CategoriaDTO | null;
  onClose: () => void;
  onSalvo: () => void;
}) {
  const editando = !!categoria;
  const [nome,      setNome]      = useState(categoria?.nome ?? "");
  const [descricao, setDescricao] = useState(categoria?.descricao ?? "");
  const [ordem,     setOrdem]     = useState(String(categoria?.ordem ?? "0"));
  const [salvando,  setSalvando]  = useState(false);
  const [erro,      setErro]      = useState<string | null>(null);

  const podeSalvar = nome.trim().length >= 2 && !salvando;

  async function salvar() {
    if (!podeSalvar) return;
    setSalvando(true);
    setErro(null);
    try {
      const res = await fetch(
        editando ? `/api/categorias/${categoria.id}` : "/api/categorias",
        {
          method:  editando ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({ nome: nome.trim(), descricao: descricao.trim() || null, ordem: Number(ordem) }),
        },
      );
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error ?? "Erro ao salvar");
      }
      onSalvo();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro inesperado");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 px-0 sm:px-4">
      <div className="w-full max-w-md bg-dark-800 border border-dark-500/60 rounded-t-xl sm:rounded-xl flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 border-b border-dark-600 shrink-0">
          <h2 className="font-bold text-white">{editando ? "Editar categoria" : "Nova categoria"}</h2>
          <button onClick={onClose} className="btn-ghost px-2"><X size={16} /></button>
        </div>

        <div className="p-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1.5">Nome *</label>
            <input
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex.: Lanches, Bebidas, Sobremesas"
              className="input"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1.5">Descrição</label>
            <input
              type="text"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Opcional"
              className="input"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1.5">Ordem de exibição</label>
            <input
              type="number"
              min={0}
              value={ordem}
              onChange={(e) => setOrdem(e.target.value)}
              className="w-28 h-10 bg-dark-700 border border-dark-600 rounded-lg px-3
                         text-sm text-white focus:border-brand-500 focus:outline-none"
            />
            <p className="text-xs text-gray-500 mt-1">Menor número aparece primeiro no cardápio.</p>
          </div>

          {erro && (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 text-red-400 p-3 text-sm flex items-center gap-2">
              <AlertTriangle size={15} className="shrink-0" /> {erro}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-dark-600 shrink-0">
          <button onClick={onClose} className="btn-ghost text-sm">Cancelar</button>
          <button
            onClick={salvar}
            disabled={!podeSalvar}
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {salvando ? <Loader2 size={14} className="animate-spin" /> : editando ? "Salvar" : "Criar categoria"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Modal: Produto ──────────────────────────────────────────────────────────

function ProdutoModal({
  produto,
  categorias,
  isAdmin,
  onClose,
  onSalvo,
}: {
  produto:    ProdutoDTO | null;
  categorias: CategoriaDTO[];
  isAdmin:    boolean;
  onClose:    () => void;
  onSalvo:    () => void;
}) {
  const editando = !!produto;

  const [nome,             setNome]             = useState(produto?.nome ?? "");
  const [descricao,        setDescricao]        = useState(produto?.descricao ?? "");
  const [precoVenda,       setPrecoVenda]       = useState(String(produto?.preco_venda ?? ""));
  const [precoCusto,       setPrecoCusto]       = useState(String(produto?.preco_custo ?? "0"));
  const [categoriaId,      setCategoriaId]      = useState(produto?.categoria?.id ?? "");
  const [imagemUrl,        setImagemUrl]        = useState(produto?.imagem_url ?? "");
  const [unidade,          setUnidade]          = useState(produto?.unidade ?? "un");
  const [controlarEstoque, setControlarEstoque] = useState(produto?.controlar_estoque ?? false);
  const [estoqueMinimo,    setEstoqueMinimo]    = useState(String(produto?.estoque_minimo ?? "0"));
  const [salvando,         setSalvando]         = useState(false);
  const [erro,             setErro]             = useState<string | null>(null);

  const podeSalvar = nome.trim().length >= 2 && Number(precoVenda) > 0 && !salvando;

  async function salvar() {
    if (!podeSalvar) return;
    setSalvando(true);
    setErro(null);
    try {
      const body: Record<string, unknown> = {
        nome:              nome.trim(),
        descricao:         descricao.trim() || null,
        preco_venda:       Number(precoVenda),
        categoria_id:      categoriaId || null,
        imagem_url:        imagemUrl.trim() || null,
        unidade:           unidade.trim() || "un",
        controlar_estoque: controlarEstoque,
        estoque_minimo:    Number(estoqueMinimo),
      };
      if (isAdmin) body.preco_custo = Number(precoCusto);

      const res = await fetch(
        editando ? `/api/produtos/${produto.id}` : "/api/produtos",
        {
          method:  editando ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify(body),
        },
      );
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error ?? "Erro ao salvar");
      }
      onSalvo();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro inesperado");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 px-0 sm:px-4">
      <div className="w-full max-w-lg bg-dark-800 border border-dark-500/60 rounded-t-xl sm:rounded-xl flex flex-col max-h-[92dvh]">
        <div className="flex items-center justify-between px-4 py-3 border-b border-dark-600 shrink-0">
          <h2 className="font-bold text-white">{editando ? "Editar produto" : "Novo produto"}</h2>
          <button onClick={onClose} className="btn-ghost px-2"><X size={16} /></button>
        </div>

        <div className="p-4 space-y-4 overflow-y-auto">
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1.5">Nome *</label>
            <input
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex.: X-Burguer, Coca-Cola 350ml"
              className="input"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1.5">Descrição</label>
            <textarea
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Ingredientes, observações..."
              rows={2}
              className="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2
                         text-sm text-white placeholder:text-gray-600 focus:border-brand-500 focus:outline-none resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1.5">Preço de venda *</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">R$</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={precoVenda}
                  onChange={(e) => setPrecoVenda(e.target.value)}
                  placeholder="0,00"
                  className="w-full h-10 bg-dark-700 border border-dark-600 rounded-lg pl-9 pr-3
                             text-sm text-white focus:border-brand-500 focus:outline-none"
                />
              </div>
            </div>
            {isAdmin && (
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1.5">Preço de custo</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">R$</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={precoCusto}
                    onChange={(e) => setPrecoCusto(e.target.value)}
                    placeholder="0,00"
                    className="w-full h-10 bg-dark-700 border border-dark-600 rounded-lg pl-9 pr-3
                               text-sm text-white focus:border-brand-500 focus:outline-none"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1.5">Categoria</label>
              <select
                value={categoriaId}
                onChange={(e) => setCategoriaId(e.target.value)}
                className="w-full h-10 bg-dark-700 border border-dark-600 rounded-lg px-3
                           text-sm text-white focus:border-brand-500 focus:outline-none"
              >
                <option value="">Sem categoria</option>
                {categorias.map((c) => (
                  <option key={c.id} value={c.id}>{c.nome}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1.5">Unidade</label>
              <input
                type="text"
                value={unidade}
                onChange={(e) => setUnidade(e.target.value)}
                placeholder="un, kg, L..."
                className="w-full h-10 bg-dark-700 border border-dark-600 rounded-lg px-3
                           text-sm text-white placeholder:text-gray-600 focus:border-brand-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1.5">URL da imagem</label>
            <input
              type="url"
              value={imagemUrl}
              onChange={(e) => setImagemUrl(e.target.value)}
              placeholder="https://..."
              className="input"
            />
          </div>

          <div className="card p-3 space-y-3">
            <button
              type="button"
              onClick={() => setControlarEstoque((v) => !v)}
              className="flex items-center gap-3 w-full text-left"
            >
              <div className={`w-9 h-5 rounded-full transition-colors relative shrink-0 ${controlarEstoque ? "bg-brand-500" : "bg-dark-600"}`}>
                <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${controlarEstoque ? "translate-x-4" : "translate-x-0.5"}`} />
              </div>
              <span className="text-sm text-white font-medium">Controlar estoque</span>
            </button>

            {controlarEstoque && (
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1.5">Estoque mínimo (alerta)</label>
                <input
                  type="number"
                  min="0"
                  value={estoqueMinimo}
                  onChange={(e) => setEstoqueMinimo(e.target.value)}
                  className="w-28 h-10 bg-dark-700 border border-dark-600 rounded-lg px-3
                             text-sm text-white focus:border-brand-500 focus:outline-none"
                />
              </div>
            )}
          </div>

          {erro && (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 text-red-400 p-3 text-sm flex items-center gap-2">
              <AlertTriangle size={15} className="shrink-0" /> {erro}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-dark-600 shrink-0">
          <button onClick={onClose} className="btn-ghost text-sm">Cancelar</button>
          <button
            onClick={salvar}
            disabled={!podeSalvar}
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {salvando ? <Loader2 size={14} className="animate-spin" /> : editando ? "Salvar" : "Criar produto"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Modal: Confirmação ──────────────────────────────────────────────────────

function ConfirmModal({
  titulo,
  mensagem,
  onConfirm,
  onClose,
}: {
  titulo:    string;
  mensagem:  string;
  onConfirm: () => Promise<void>;
  onClose:   () => void;
}) {
  const [loading, setLoading] = useState(false);

  async function confirmar() {
    setLoading(true);
    await onConfirm();
    setLoading(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
      <div className="w-full max-w-sm bg-dark-800 border border-dark-500/60 rounded-xl p-5 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-red-500/10 flex items-center justify-center shrink-0">
            <AlertTriangle size={17} className="text-red-400" />
          </div>
          <h3 className="font-bold text-white">{titulo}</h3>
        </div>
        <p className="text-sm text-gray-400">{mensagem}</p>
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="btn-ghost text-sm">Cancelar</button>
          <button
            onClick={confirmar}
            disabled={loading}
            className="px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white text-sm font-semibold transition-colors disabled:opacity-50"
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : "Remover"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Página ──────────────────────────────────────────────────────────────────

type Aba = "produtos" | "categorias";

type ModalState =
  | null
  | { tipo: "novo-produto" }
  | { tipo: "editar-produto";    produto:   ProdutoDTO    }
  | { tipo: "excluir-produto";   produto:   ProdutoDTO    }
  | { tipo: "nova-categoria" }
  | { tipo: "editar-categoria";  categoria: CategoriaDTO  }
  | { tipo: "excluir-categoria"; categoria: CategoriaDTO  };

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function ProdutosPage() {
  const { data: session, status } = useSession();
  const isAdmin = session?.user?.role === "ADMIN";

  const [aba,    setAba]    = useState<Aba>("produtos");
  const [modal,  setModal]  = useState<ModalState>(null);
  const [filtro, setFiltro] = useState("");

  const { data: produtos   = [], isLoading: loadingP, mutate: mutateProdutos }   =
    useSWR<ProdutoDTO[]>("/api/produtos", fetcher);
  const { data: categorias = [], isLoading: loadingC, mutate: mutateCategorias } =
    useSWR<CategoriaDTO[]>("/api/categorias", fetcher);

  if (status === "loading") return null;

  if (!isAdmin) {
    return (
      <div className="card p-8 flex flex-col items-center text-center max-w-md mx-auto mt-10">
        <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center mb-4">
          <Lock size={22} className="text-red-400" />
        </div>
        <h1 className="text-lg font-semibold text-dark-100">Acesso restrito</h1>
        <p className="text-sm text-gray-500 mt-2">Apenas administradores podem gerenciar o cardápio.</p>
      </div>
    );
  }

  const produtosFiltrados = filtro
    ? produtos.filter((p) => p.nome.toLowerCase().includes(filtro.toLowerCase()))
    : produtos;

  async function excluirProduto(id: string) {
    await fetch(`/api/produtos/${id}`, { method: "DELETE" });
    mutateProdutos();
    setModal(null);
  }

  async function excluirCategoria(id: string) {
    await fetch(`/api/categorias/${id}`, { method: "DELETE" });
    mutateCategorias();
    setModal(null);
  }

  return (
    <>
      <div className="space-y-5">
        {/* Header */}
        <PageHeader
          title="Cardápio"
          description={`${produtos.length} ${produtos.length === 1 ? "produto" : "produtos"} · ${categorias.length} ${categorias.length === 1 ? "categoria" : "categorias"}`}
          actions={
            <div className="flex gap-2">
              <button
                onClick={() => setModal({ tipo: "nova-categoria" })}
                className="btn-ghost text-sm"
              >
                <Tag size={14} /> Nova categoria
              </button>
              <button
                onClick={() => setModal({ tipo: "novo-produto" })}
                className="btn-primary text-sm"
              >
                <Plus size={14} /> Novo produto
              </button>
            </div>
          }
        />

        {/* Abas */}
        <div className="flex gap-1 p-1 bg-dark-800 rounded-lg w-fit border border-dark-500/50">
          {(["produtos", "categorias"] as Aba[]).map((a) => (
            <button
              key={a}
              onClick={() => setAba(a)}
              className={aba === a ? "tab tab-active relative" : "tab"}
            >
              {a === "produtos" ? "Produtos" : "Categorias"}
              {aba === a && (
                <span className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full bg-brand-500" />
              )}
            </button>
          ))}
        </div>

        {/* ── Aba: Produtos ── */}
        {aba === "produtos" && (
          <div className="space-y-3">
            {produtos.length > 5 && (
              <input
                type="search"
                placeholder="Filtrar produtos..."
                value={filtro}
                onChange={(e) => setFiltro(e.target.value)}
                className="input w-64"
              />
            )}

            {loadingP ? (
              <p className="text-gray-500 text-sm">Carregando...</p>
            ) : produtosFiltrados.length === 0 ? (
              <EmptyState
                icon={<BookOpen size={18} />}
                title="Nenhum produto cadastrado"
                description="Crie o primeiro produto do seu cardápio."
                action={
                  <button
                    onClick={() => setModal({ tipo: "novo-produto" })}
                    className="btn-primary text-sm"
                  >
                    <Plus size={14} /> Novo produto
                  </button>
                }
              />
            ) : (
              <div className="card overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-dark-600 text-left">
                      <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Produto</th>
                      <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Categoria</th>
                      <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase text-right">Venda</th>
                      {isAdmin && (
                        <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase text-right">Custo</th>
                      )}
                      <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {produtosFiltrados.map((p) => (
                      <tr
                        key={p.id}
                        className="border-b border-dark-600/50 last:border-0 hover:bg-dark-700 transition-colors"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg bg-dark-700 border border-dark-600 flex items-center justify-center overflow-hidden shrink-0">
                              {p.imagem_url
                                ? <img src={p.imagem_url} alt={p.nome} className="w-full h-full object-cover" /> // eslint-disable-line @next/next/no-img-element
                                : <ImageOff size={14} className="text-gray-600" />}
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-white truncate">{p.nome}</p>
                              {p.descricao && (
                                <p className="text-xs text-gray-500 truncate max-w-xs">{p.descricao}</p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-400">
                          {p.categoria?.nome ?? <span className="text-gray-600">—</span>}
                        </td>
                        <td className="px-4 py-3 text-right font-medium text-white">
                          {formatCurrency(p.preco_venda)}
                        </td>
                        {isAdmin && (
                          <td className="px-4 py-3 text-right text-gray-500">
                            {p.preco_custo ? formatCurrency(p.preco_custo) : "—"}
                          </td>
                        )}
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => setModal({ tipo: "editar-produto", produto: p })}
                              className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-dark-600 transition-colors"
                            >
                              <Pencil size={14} />
                            </button>
                            <button
                              onClick={() => setModal({ tipo: "excluir-produto", produto: p })}
                              className="p-1.5 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── Aba: Categorias ── */}
        {aba === "categorias" && (
          <div className="space-y-3">
            {loadingC ? (
              <p className="text-gray-500 text-sm">Carregando...</p>
            ) : categorias.length === 0 ? (
              <EmptyState
                icon={<Tag size={18} />}
                title="Nenhuma categoria cadastrada"
                description="Crie categorias para organizar o cardápio."
                action={
                  <button
                    onClick={() => setModal({ tipo: "nova-categoria" })}
                    className="btn-primary text-sm"
                  >
                    <Plus size={14} /> Nova categoria
                  </button>
                }
              />
            ) : (
              <div className="card overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-dark-600 text-left">
                      <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Categoria</th>
                      <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase text-right">Ordem</th>
                      <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase text-right">Produtos</th>
                      <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {categorias.map((c) => {
                      const qtd = produtos.filter((p) => p.categoria?.id === c.id).length;
                      return (
                        <tr
                          key={c.id}
                          className="border-b border-dark-600/50 last:border-0 hover:bg-dark-700 transition-colors"
                        >
                          <td className="px-4 py-3">
                            <p className="font-medium text-white">{c.nome}</p>
                            {c.descricao && <p className="text-xs text-gray-500">{c.descricao}</p>}
                          </td>
                          <td className="px-4 py-3 text-right text-gray-400">{c.ordem}</td>
                          <td className="px-4 py-3 text-right text-gray-400">{qtd}</td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => setModal({ tipo: "editar-categoria", categoria: c })}
                                className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-dark-600 transition-colors"
                              >
                                <Pencil size={14} />
                              </button>
                              <button
                                onClick={() => setModal({ tipo: "excluir-categoria", categoria: c })}
                                className="p-1.5 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modais */}
      {(modal?.tipo === "novo-produto" || modal?.tipo === "editar-produto") && (
        <ProdutoModal
          produto={modal.tipo === "editar-produto" ? modal.produto : null}
          categorias={categorias}
          isAdmin={isAdmin}
          onClose={() => setModal(null)}
          onSalvo={() => { mutateProdutos(); setModal(null); }}
        />
      )}

      {(modal?.tipo === "nova-categoria" || modal?.tipo === "editar-categoria") && (
        <CategoriaModal
          categoria={modal.tipo === "editar-categoria" ? modal.categoria : null}
          onClose={() => setModal(null)}
          onSalvo={() => { mutateCategorias(); mutateProdutos(); setModal(null); }}
        />
      )}

      {modal?.tipo === "excluir-produto" && (
        <ConfirmModal
          titulo="Remover produto"
          mensagem={`"${modal.produto.nome}" será removido do cardápio. Esta ação não pode ser desfeita.`}
          onConfirm={() => excluirProduto(modal.produto.id)}
          onClose={() => setModal(null)}
        />
      )}

      {modal?.tipo === "excluir-categoria" && (
        <ConfirmModal
          titulo="Remover categoria"
          mensagem={`"${modal.categoria.nome}" será removida. Os produtos dessa categoria ficarão sem categoria.`}
          onConfirm={() => excluirCategoria(modal.categoria.id)}
          onClose={() => setModal(null)}
        />
      )}
    </>
  );
}
