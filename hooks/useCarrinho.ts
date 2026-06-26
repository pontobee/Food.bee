"use client";

import { useState } from "react";
import type { ProdutoDTO, ItemAdicionalDTO } from "@/types";

export interface LinhaCarrinho {
  produto:    ProdutoDTO;
  quantidade: number;
  adicionais: (ItemAdicionalDTO & { selecionado: boolean })[];
}

export function useCarrinho() {
  const [carrinho, setCarrinho] = useState<LinhaCarrinho[]>([]);

  function adicionarProduto(produto: ProdutoDTO) {
    setCarrinho((prev) => {
      const existente = prev.find((l) => l.produto.id === produto.id);
      if (existente) {
        return prev.map((l) =>
          l.produto.id === produto.id ? { ...l, quantidade: l.quantidade + 1 } : l
        );
      }
      return [
        ...prev,
        {
          produto,
          quantidade: 1,
          adicionais: produto.adicionais.map((a) => ({ ...a, selecionado: false })),
        },
      ];
    });
  }

  function ajustarQtd(produtoId: string, delta: number) {
    setCarrinho((prev) =>
      prev
        .map((l) =>
          l.produto.id === produtoId ? { ...l, quantidade: l.quantidade + delta } : l
        )
        .filter((l) => l.quantidade > 0)
    );
  }

  function toggleAdicional(produtoId: string, adicionalId: string) {
    setCarrinho((prev) =>
      prev.map((l) =>
        l.produto.id === produtoId
          ? {
              ...l,
              adicionais: l.adicionais.map((a) =>
                a.id === adicionalId ? { ...a, selecionado: !a.selecionado } : a
              ),
            }
          : l
      )
    );
  }

  const total = carrinho.reduce((acc, l) => {
    const extras = l.adicionais
      .filter((a) => a.selecionado && a.tipo === "ADICIONAL")
      .reduce((s, a) => s + a.preco_extra, 0);
    return acc + (l.produto.preco_venda + extras) * l.quantidade;
  }, 0);

  return { carrinho, adicionarProduto, ajustarQtd, toggleAdicional, total };
}
