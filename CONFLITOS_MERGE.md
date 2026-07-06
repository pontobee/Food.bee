# Relatório de Conflitos — `features-principais` vs `main`

> Gerado em: 2026-07-02  
> Branch base de divergência: `3816fa5` (merge do PR #4)

---

## Contexto

Os dois branches evoluíram **em paralelo** a partir do mesmo ponto:

| Branch | O que fez |
|---|---|
| `sprints/1-4` → já no `main` | Segurança, logging, rate limit, SSE, timezone, service layer |
| `features-principais` | Cardápio digital, PIX, Delivery, Logo, BI Charts |

Agora precisa-se fazer o merge de `main` → `features-principais` antes de abrir PR.

---

## Arquivos em conflito (10 arquivos)

### 🟢 FÁCIL — Adições independentes, resolver rapidamente

---

#### `app/dashboard/page.tsx`

| `main` fez | `features-principais` fez |
|---|---|
| Adicionou alerta de webhooks WhatsApp com falha | Adicionou bloco `<ChartsBI />` para ADMIN |

**Como resolver:** Manter os dois blocos. Colocar o alerta de webhooks primeiro, depois o `<ChartsBI />`.

---

#### `types/index.ts`

| `main` fez | `features-principais` fez |
|---|---|
| Adicionou `webhooks_pendentes` no `StatsDTO` | Adicionou `TipoEntrega`, `TaxaEntregaDTO`, expandiu `PedidoDTO` com campos de delivery |
| — | **Removeu** `FIADO` do `FormaPagamento` |

**Como resolver:** Juntar tudo. **Decisão pendente:** manter ou remover `FIADO`? (ver nota abaixo)

---

#### `components/pedidos/PedidoCard.tsx`

| `main` fez | `features-principais` fez |
|---|---|
| Adicionou estado de erro + feedback visual ao avançar status | Adicionou `ModalPix`, ícones de delivery, removeu `FIADO` |

**Como resolver:** Combinar os dois. Adições são independentes.

---

#### `app/api/produtos/route.ts`

| `main` fez | `features-principais` fez |
|---|---|
| Refatorou `GET` para usar `authGuard()` centralizado | Adicionou rota `POST` para criar produto (ADMIN only) via `createProduto` service |

**Como resolver:** `POST` novo do amigo + `GET` com `authGuard` do main. Sem sobreposição real.

---

### 🟡 MODERADO — Mesma função tocada, merge manual necessário

---

#### `auth.ts`

| `main` fez | `features-principais` fez |
|---|---|
| Adicionou rate limit por IP+email, classe `RateLimitError`, imports de `checkRateLimit`/`resetRateLimit` | Apenas reformatou espaçamento dos imports |

**Como resolver:** Usar a versão do `main` integralmente. O amigo só mexeu em estilo (espaçamento) — a lógica de segurança do sprint deve prevalecer.

---

#### `app/dashboard/configuracoes/page.tsx`

| `main` fez | `features-principais` fez |
|---|---|
| Converteu para Server Component com guard de role ADMIN | Adicionou seção de upload de logo e configuração de PIX (343 linhas novas) |

**Como resolver:** A base deve ser a versão do amigo (com as novas seções), mas aplicando o guard ADMIN do `main` no topo. Verificar se as novas seções (logo, PIX) precisam do guard também.

---

### 🔴 COMPLEXO — Mesma função, lógica diferente, merge cuidadoso

---

#### `modules/orders/orders.service.ts` ⚠️

| `main` fez | `features-principais` fez |
|---|---|
| Adicionou `startOfDayBRT()` para timezone correto | Adicionou `TipoEntrega`, `taxa_entrega`, `endereco_entrega` |
| Importou `TenantContext` do módulo compartilhado (removeu interface local) | Adicionou validação de `tipo_entrega` e `DELIVERY` requer endereço |
| Adicionou validação de UUID antes do `$queryRaw` | Adicionou resolução server-side da taxa de entrega |
| Adicionou validação de `status` no `updateOrderStatus` | Adicionou campos no `prisma.pedido.create()` |

**Como resolver (passo a passo):**
1. Partir da versão do `features-principais` como base (tem mais adições de negócio)
2. Adicionar os imports do `main`: `startOfDayBRT`, `TenantContext` do módulo compartilhado
3. Remover a interface `TenantContext` local (já foi para `modules/shared/tenant.types.ts` no main)
4. Substituir `inicioDia` manual por `startOfDayBRT()` no `getTodaysOrders`
5. Adicionar validação de UUID antes do `$queryRaw` (do main)
6. Adicionar validação de `status` no `updateOrderStatus` (do main)

---

#### `components/pedidos/NovoPedidoModal.tsx` ⚠️

| `main` fez | `features-principais` fez |
|---|---|
| Refatorou para usar hook `useCarrinho` (lógica extraída) | Adicionou UI completa de delivery: tipo de entrega, seleção de taxa, endereço |
| Manteve `FIADO` nas formas de pagamento | **Removeu** `FIADO` |

**Como resolver:**
- O amigo adicionou bastante UI nova (delivery). O sprint mudou a estrutura interna (hook).
- Opção mais segura: partir da versão do amigo e aplicar o hook `useCarrinho` nos estados de carrinho.
- **Decisão necessária sobre `FIADO`** (ver abaixo).

---

## Decisão pendente: `FIADO`

O amigo **removeu** `FIADO` das formas de pagamento em `types/index.ts`, `PedidoCard.tsx` e `NovoPedidoModal.tsx`. O sprint não tinha mexido nisso e manteve.

**Pergunta:** o `FIADO` foi removido por decisão de produto ou por acidente? Se foi decisão, precisamos remover do banco também (migração). Se foi acidente, precisa ser recolocado.

---

## Plano de ação sugerido

```
1. git checkout features-principais
2. git merge main
   → vai mostrar os 10 arquivos em conflito
3. Resolver na ordem: tipos → auth → dashboard/page → PedidoCard → produtos → configuracoes → NovoPedidoModal → orders.service
4. git add .
5. git commit -m "merge: integrar segurança/logging do sprint com features de cardápio/delivery"
6. Abrir PR features-principais → main
```

**Estimativa:** ~2-3h resolvendo os conflitos juntos, sendo `orders.service.ts` e `NovoPedidoModal.tsx` os mais trabalhosos.
