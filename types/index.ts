// DTOs do frontend — espelham o retorno das API routes

export type StatusPedido =
  | "AGUARDANDO"
  | "EM_PREPARO"
  | "PRONTO"
  | "ENTREGUE"
  | "CANCELADO";

export type FormaPagamento =
  | "DINHEIRO"
  | "CARTAO_DEBITO"
  | "CARTAO_CREDITO"
  | "PIX";

export type TipoAdicional = "ADICIONAL" | "EXCECAO";
export type RoleUsuario   = "ADMIN" | "CAIXA";

export interface ItemAdicionalDTO {
  id:          string;
  nome:        string;
  tipo:        TipoAdicional;
  preco_extra: number;
}

export interface ItemPedidoDTO {
  id:                     string;
  produto_nome:           string;
  produto_preco_unitario: number;
  quantidade:             number;
  total:                  number;
  adicionais:             ItemAdicionalDTO[];
}

export type TipoEntrega = "BALCAO" | "DELIVERY";

export interface TaxaEntregaDTO {
  id:        string;
  nome:      string;
  taxa:      number;
  tempo_min: number | null;
}

export interface PedidoDTO {
  id:               string;
  numero_pedido:    number;
  status:           StatusPedido;
  forma_pagamento:  FormaPagamento;
  origem:           string;
  subtotal:         number;
  desconto:         number;
  total:            number;
  troco:            number | null;
  observacao:            string | null;
  motivo_cancelamento:   string | null;
  pago_em:               string | null;
  tipo_entrega:     TipoEntrega;
  taxa_entrega:     number | null;
  endereco_entrega: string | null;
  criado_em:        string;
  atualizado_em:    string;
  cliente:          { id: string; nome: string; telefone: string } | null;
  itens:            ItemPedidoDTO[];
}

export interface ProdutoDTO {
  id:                string;
  nome:              string;
  descricao:         string | null;
  preco_venda:       number;
  preco_custo:       number;
  estoque_atual:     number;
  estoque_minimo:    number;
  controlar_estoque: boolean;
  unidade:           string;
  imagem_url:        string | null;
  categoria:         { id: string; nome: string } | null;
  adicionais:        { id: string; nome: string; tipo: TipoAdicional; preco_extra: number }[];
}

// Membro da equipe — retorno de GET /api/equipe.
// Datas chegam como string (JSON não tem tipo Date nativo).
export interface MembroDTO {
  id:               string;
  nome:             string;
  email:            string;
  role:             RoleUsuario;
  ultimo_acesso_em: string | null;
  criado_em:        string;
}

export interface StatsDTO {
  pedidos_hoje:       number;
  faturamento_hoje:   number;
  ticket_medio:       number;
  estoque_critico:    number;
  webhooks_pendentes: number;
}

export interface ChartDataPoint {
  name:      string;
  receita:   number;
  pedidos:   number;
}

export interface ChartsDTO {
  faturamento7d: ChartDataPoint[];
  top5Produtos:  { nome: string; quantidade: number }[];
  pagamentos:    { name: string; value: number }[];
}

export type TipoTransacao = "RECEITA" | "DESPESA";

export interface TransacaoDTO {
  id:           string;
  tipo:         TipoTransacao;
  categoria:    string;
  descricao:    string;
  valor:        number;
  data:         string;
  pedido_id:    string | null;
  usuario_nome: string;
  criado_em:    string;
}

export interface TransacoesPageDTO {
  transacoes: TransacaoDTO[];
  total:      number;
  paginas:    number;
}

export interface ClienteDTO {
  id:            string;
  nome:          string;
  telefone:      string;
  endereco:      string | null;
  total_pedidos: number;
  total_gasto:   number;
  criado_em:     string;
}

export interface ClientesPageDTO {
  clientes: ClienteDTO[];
  total:    number;
  paginas:  number;
}
