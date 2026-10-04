import React from "react";

export interface ItemPedido {
  quantidade: number;
  nome: string;
  adicionais?: string[]; // [+]
  remocoes?: string[];   // [-]
  observacao?: string;   // OBS
}

export interface PedidoParaImpressao {
  id: string;
  cliente: string;
  telefone?: string;
  tipo: "DELIVERY" | "RETIRADA" | "MESA";
  mesa?: string;
  endereco?: {
    rua: string;
    bairro: string;
    cidade: string;
    referencia?: string;
  };
  itens: ItemPedido[];
  data: Date;
  fop: string; // Forma de Pagamento
  statusPagamento: string; // ex: PAGO, PENDENTE
  subtotal: number;
  taxaEntrega?: number;
  total: number;
  trocoPara?: number; // Para alinhar com o pedido de 'Troco para: R$ 100,00'
}

interface TicketComandaProps {
  pedido: PedidoParaImpressao;
}

export function TicketComanda({ pedido }: TicketComandaProps) {
  // Helpers para formatação
  const padC = (str: string, length: number, char = " ") => {
    if (str.length >= length) return str;
    const leftPad = Math.floor((length - str.length) / 2);
    const rightPad = length - str.length - leftPad;
    return char.repeat(leftPad) + str + char.repeat(rightPad);
  };
  
  const padR = (str: string, length: number, char = " ") => str.padEnd(length, char);
  const padL = (str: string, length: number, char = " ") => str.padStart(length, char);

  // Preenchemos o valor com espaços (tamanho 6) para o R$ ficar perfeitamente alinhado
  const formatMoney = (val: number) => "R$ " + padL(val.toFixed(2).replace(".", ","), 6);
  
  const rowJustify = (left: string, right: string, totalWidth: number) => {
    const spaces = totalWidth - left.length - right.length;
    return left + " ".repeat(Math.max(0, spaces)) + right;
  };

  const width = 40;
  const lineEq = "=".repeat(width);
  const lineAst = "*".repeat(width);
  const lineDash = "-".repeat(width);

  const dataStr = pedido.data.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
  const horaStr = pedido.data.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

  const buildReceipt = () => {
    let out = "";
    
    // Header
    out += lineEq + "\n";
    out += padC(`PEDIDO #${pedido.id} (${pedido.tipo})`, width) + "\n";
    out += lineEq + "\n";
    
    // Cliente
    out += `Cliente: ${pedido.cliente}\n`;
    if (pedido.telefone) out += `Telefone: ${pedido.telefone}\n`;
    out += `Data: ${dataStr} | Hora: ${horaStr}\n\n`;

    // FOP
    out += lineAst + "\n";
    out += `   FOP: ${pedido.fop} (${pedido.statusPagamento})\n`;
    out += lineAst + "\n\n";

    // Itens
    out += padC(" ITENS ", width, "-") + "\n";
    pedido.itens.forEach(item => {
      out += `[ ${item.quantidade} ] ${item.nome.toUpperCase()}\n`;
      if (item.remocoes) {
        item.remocoes.forEach(rem => {
          out += `      [-] ${rem.toUpperCase()}\n`;
        });
      }
      if (item.adicionais) {
        item.adicionais.forEach(add => {
          out += `      [+] ${add.toUpperCase()}\n`;
        });
      }
      if (item.observacao) {
        out += `      [OBS] ${item.observacao.toUpperCase()}\n`;
      }
      out += "\n";
    });

    // Entrega
    if (pedido.tipo === "DELIVERY" && pedido.endereco) {
      out += padC(" ENTREGA ", width, "-") + "\n";
      out += `Endereço: ${pedido.endereco.rua}\n`;
      out += `Bairro: ${pedido.endereco.bairro}\n`;
      out += `Cidade: ${pedido.endereco.cidade}\n`;
      if (pedido.endereco.referencia) {
        out += `Referência: ${pedido.endereco.referencia}\n`;
      }
      out += "\n";
    }

    // Valores
    out += padC(" VALORES ", width, "-") + "\n";
    out += rowJustify("Subtotal:", formatMoney(pedido.subtotal), width) + "\n";
    if (pedido.taxaEntrega !== undefined) {
      out += rowJustify("Taxa de Entrega:", formatMoney(pedido.taxaEntrega), width) + "\n";
    }
    out += lineDash + "\n";
    out += rowJustify("TOTAL DO PEDIDO:", formatMoney(pedido.total), width) + "\n";
    
    // Linha do Troco adicionada
    if (pedido.trocoPara) {
      out += rowJustify("Troco para:", formatMoney(pedido.trocoPara), width) + "\n";
    }
    
    out += lineEq + "\n";
    out += padC("food.bee", width) + "\n";
    
    return out;
  };

  return (
    <div className="print-area bg-white p-2">
      <pre className="font-mono text-black whitespace-pre-wrap leading-tight text-sm tracking-tighter" style={{ width: "80mm", margin: "0 auto", overflowX: "hidden" }}>
        {buildReceipt()}
      </pre>
    </div>
  );
}

