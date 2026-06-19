"use client";

import React, { useRef } from "react";
import { TicketComanda, PedidoParaImpressao } from "@/components/pedidos/TicketComanda";
import { PrinterIcon } from "lucide-react";

export default function PreviewComandaPage() {
  // Pedido fake para demonstração no novo formato exato solicitado
  const mockPedido: PedidoParaImpressao = {
    id: "1042",
    cliente: "Nome do Cliente",
    telefone: "(88) 99999-9999",
    tipo: "DELIVERY",
    endereco: {
      rua: "Rua São Pedro, 123",
      bairro: "Centro",
      cidade: "Juazeiro do Norte - CE",
      referencia: "Em frente à farmácia"
    },
    data: new Date(2026, 5, 18, 23, 21), // 18/06/2026 23:21
    fop: "PIX",
    statusPagamento: "PAGO",
    subtotal: 52.00,
    taxaEntrega: 5.00,
    total: 57.00,
    trocoPara: 100.00,
    itens: [
      {
        quantidade: 2,
        nome: "X-TUDO DA CASA",
        remocoes: ["SEM CEBOLA", "SEM MAIONESE"],
        adicionais: ["ADICIONAL DE BACON"],
      },
      {
        quantidade: 1,
        nome: "BATATA FRITA GRANDE",
      },
      {
        quantidade: 1,
        nome: "COCA-COLA LATA 350ML",
      }
    ]
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-dark-900 p-8">
      <div className="max-w-4xl mx-auto">
        
        {/* Área de Interface de Usuário */}
        <div className="no-print mb-8 p-6 bg-dark-800 rounded-xl border border-dark-600 flex flex-col items-center text-center">
          <h1 className="text-2xl font-bold text-white mb-2">Simulador de Comanda</h1>
          <p className="text-gray-400 mb-6">
            Abaixo está a visualização da comanda no exato formato texto solicitado. <br/>
            Clique no botão para simular a impressão.
          </p>
          
          <button 
            onClick={handlePrint}
            className="btn-primary px-8 py-3 text-lg"
          >
            <PrinterIcon size={24} />
            Simular Impressão Agora
          </button>
        </div>

        {/* Container visual */}
        <div className="relative mx-auto bg-gray-200 p-4 rounded-md shadow-2xl flex justify-center w-[100mm] print:bg-transparent print:shadow-none print:p-0">
          <div className="no-print absolute -top-4 text-xs font-bold text-gray-500 uppercase">
            Preview do Papel Térmico
          </div>
          
          <div className="relative z-10 shadow-md">
            <TicketComanda pedido={mockPedido} />
          </div>
        </div>

      </div>
    </div>
  );
}

