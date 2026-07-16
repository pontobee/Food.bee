# LancheSmart — Análise pós-merge: próximo passo

## O que foi mergeado agora (`feat/fluxo-principal-mvp` → `features-principais`)

### Módulos novos e completos
- **Clientes** — API `/api/clientes`, página `/dashboard/clientes`, painel de detalhe e modal de cadastro/edição
- **Financeiro CRUD** — API `/api/transacoes`, página com filtros por período/tipo/categoria, paginação e exportação CSV
- **Signup/Onboarding** — `/signup`, `/forgot-password`, `/reset-password/[token]` (usa Resend para email)
- **Asaas (billing)** — `/api/assinatura/checkout`, `/api/assinatura/status`, webhook `/api/webhooks/asaas`
- **WhatsApp real** — QR code, status, config, desconectar, bot de pedidos com máquina de estados, worker autônomo (`scripts/worker.mjs`)
- **Equipe — remover membro** — `DELETE /api/equipe/[id]`
- **Pedidos — troco e busca de cliente** — campo "valor recebido" no modal de novo pedido + autocomplete de cliente

---

## O que precisa ser feito ANTES de ir para produção

### 1. Rodar as migrations no banco (Railway)
As migrations abaixo foram criadas mas ainda **não foram aplicadas** no banco de produção.
Precisam rodar `prisma migrate deploy` no Railway.

| Migration | O que adiciona |
|---|---|
| `20260626000003_add_whatsapp_config` | Tabela `WhatsAppConfig` |
| `20260626000004_add_sessao_whatsapp` | Tabela `SessaoWhatsApp` |
| `20260626000005_add_controlar_estoque` | Campo `controlar_estoque` no Produto |
| `20260626000006_add_tipo_mensagem_whatsapp` | Enum `TipoMensagemWhatsApp` |

> As migrations anteriores de delivery (`tipo_entrega`, `TaxaEntrega`) também precisam estar aplicadas.

---

### 2. Variáveis de ambiente novas

Essas variáveis **não existiam antes** e precisam ser configuradas no Railway (e no `.env.local` local):

| Variável | Onde pegar | Obrigatória? |
|---|---|---|
| `ASAAS_API_KEY` | app.asaas.com → Integrações → API | Sim (billing) |
| `ASAAS_API_URL` | `https://sandbox.asaas.com/api/v3` (dev) / `https://api.asaas.com/api/v3` (prod) | Sim |
| `RESEND_API_KEY` | resend.com → API Keys | Sim (forgot-password) |
| `WORKER_SECRET` | Qualquer string forte | Sim (worker autônomo) |
| `APP_URL` | URL pública do app no Railway | Sim (worker) |
| `WHATSAPP_WEBHOOK_SECRET` | Qualquer string forte — cadastrar na Evolution API | Recomendado |

---

## O que ainda FALTA implementar (não veio no merge)

| # | Módulo | Situação |
|---|---|---|
| 1 | **Mobile navigation** | Sidebar some em mobile, sem menu hambúrguer |
| 2 | **SEO** | Sem meta tags, `sitemap.xml`, `robots.txt` |
| 3 | **Preços inconsistentes** | Landing (`R$49,90 / R$99,90`) vs `/planos` (`R$79,90 / R$179,90 / R$199,90`) |
| 4 | **Histórico de estoque** | `MovimentacaoEstoque` existe no banco mas sem página de extrato |
| 5 | **Alterar role de membro** | Sem PUT/PATCH em `/api/equipe/[id]` para trocar ADMIN↔CAIXA |
| 6 | **Assinatura — fluxo completo** | Webhook Asaas recebe o evento mas precisa ativar/bloquear a conta no banco |

---

## O que precisamos decidir juntos

1. **Rodar as migrations agora ou testar local primeiro?**
   - Rodar antes = risco se tiver problema de schema
   - Testar local = mais seguro, mas precisa de banco local configurado

2. **Asaas ou Stripe/outro?**
   - O código usa Asaas. Confirmar se esse é o provedor definitivo.

3. **Worker WhatsApp — Railway ou Vercel Cron?**
   - `scripts/worker.mjs` foi feito para rodar como serviço separado no Railway
   - Existe também `/api/worker/whatsapp` para Vercel Cron
   - Precisam decidir qual usar em produção

4. **Prioridade do próximo sprint:**
   - Mobile nav (afeta todos os usuários)
   - Fluxo de assinatura completo (afeta monetização)
   - Histórico de estoque (afeta operação)
