-- ─────────────────────────────────────────────────────────────
-- SCHEMA — slanche (lanchonete-saas)
-- Espelha os tipos definidos em types/index.ts
--
-- Como aplicar:
--   1. Abra o projeto no Supabase → SQL Editor → New query
--   2. Cole este arquivo inteiro e clique em "Run"
-- ─────────────────────────────────────────────────────────────

-- PRODUTOS (estoque)
create table if not exists products (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid not null references auth.users (id) on delete cascade,
  name        text not null,
  category    text not null,
  price       numeric(10, 2) not null default 0,
  cost        numeric(10, 2) not null default 0,
  stock       integer not null default 0,
  min_stock   integer not null default 0,
  unit        text not null default 'un',
  active      boolean not null default true,
  created_at  timestamptz not null default now()
);

-- PEDIDOS
create table if not exists orders (
  id              uuid primary key default gen_random_uuid(),
  owner_id        uuid not null references auth.users (id) on delete cascade,
  customer_name   text not null,
  customer_phone  text not null,
  total           numeric(10, 2) not null default 0,
  status          text not null default 'pending'
                    check (status in ('pending', 'preparing', 'ready', 'delivered', 'cancelled')),
  payment_method  text not null default 'cash'
                    check (payment_method in ('cash', 'card', 'pix')),
  notes           text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- ITENS DE PEDIDO (um pedido tem vários itens)
create table if not exists order_items (
  id            uuid primary key default gen_random_uuid(),
  order_id      uuid not null references orders (id) on delete cascade,
  product_id    uuid references products (id) on delete set null,
  product_name  text not null,
  quantity      integer not null default 1,
  unit_price    numeric(10, 2) not null default 0,
  total         numeric(10, 2) not null default 0
);

-- TRANSAÇÕES FINANCEIRAS (entradas/saídas)
create table if not exists transactions (
  id           uuid primary key default gen_random_uuid(),
  owner_id     uuid not null references auth.users (id) on delete cascade,
  type         text not null check (type in ('income', 'expense')),
  category     text not null,
  description  text not null,
  amount       numeric(10, 2) not null default 0,
  date         timestamptz not null default now(),
  order_id     uuid references orders (id) on delete set null
);

-- MENSAGENS WHATSAPP (histórico de envios)
create table if not exists whatsapp_messages (
  id              uuid primary key default gen_random_uuid(),
  owner_id        uuid not null references auth.users (id) on delete cascade,
  customer_name   text not null,
  customer_phone  text not null,
  message         text not null,
  type            text not null
                    check (type in ('order_confirm', 'order_ready', 'promo', 'custom')),
  sent_at         timestamptz not null default now(),
  status          text not null default 'sent'
                    check (status in ('sent', 'delivered', 'read', 'failed'))
);

-- Índices para as buscas mais comuns das telas
create index if not exists idx_products_owner on products (owner_id);
create index if not exists idx_orders_owner_created on orders (owner_id, created_at desc);
create index if not exists idx_order_items_order on order_items (order_id);
create index if not exists idx_transactions_owner_date on transactions (owner_id, date desc);
create index if not exists idx_whatsapp_owner_sent on whatsapp_messages (owner_id, sent_at desc);

-- Mantém "updated_at" de orders sempre atualizado
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_orders_updated_at on orders;
create trigger trg_orders_updated_at
  before update on orders
  for each row execute function set_updated_at();

-- ─────────────────────────────────────────────────────────────
-- ROW LEVEL SECURITY (RLS)
-- Cada usuário (dono da lanchonete) só enxerga e altera os
-- próprios dados — identificados pela coluna owner_id.
-- ─────────────────────────────────────────────────────────────
alter table products          enable row level security;
alter table orders            enable row level security;
alter table order_items       enable row level security;
alter table transactions      enable row level security;
alter table whatsapp_messages enable row level security;

create policy "owner manages own products"
  on products for all
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

create policy "owner manages own orders"
  on orders for all
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

-- order_items não tem owner_id próprio: a permissão segue o pedido "pai"
create policy "owner manages own order items"
  on order_items for all
  using (exists (
    select 1 from orders
    where orders.id = order_items.order_id
      and orders.owner_id = auth.uid()
  ))
  with check (exists (
    select 1 from orders
    where orders.id = order_items.order_id
      and orders.owner_id = auth.uid()
  ));

create policy "owner manages own transactions"
  on transactions for all
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

create policy "owner manages own whatsapp messages"
  on whatsapp_messages for all
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);
