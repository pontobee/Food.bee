/** Contexto do tenant autenticado — toda operação de serviço é isolada por lanchonete. */
export interface TenantContext {
  lanchoneteId: string;
  usuarioId:    string;
}
