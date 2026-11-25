-- =============================================================================
-- Resgate de Alimentos — esquema do banco (Supabase / PostgreSQL)
--
-- Como usar: no painel do Supabase, abra SQL Editor, cole este arquivo inteiro
-- e clique em Run. Depois rode supabase/seed.sql para carregar os dados da demo.
-- Pode ser executado de novo: apaga e recria as tabelas (e os dados).
--
-- Regras de acesso (RLS):
--   * Qualquer visitante pode LER estabelecimentos, ONGs, doações e coletas.
--   * Qualquer visitante pode CADASTRAR doação (sempre como "disponivel").
--   * Reservar, cancelar e confirmar coleta só pelas funções abaixo, que
--     conferem o status atual dentro do banco. Isso impede, por exemplo, duas
--     ONGs reservarem a mesma doação ao mesmo tempo.
--
-- LIMITAÇÃO desta fase: ainda não há login, então a ONG é informada pelo
-- próprio app (p_ong) e não é verificada. Quando houver autenticação, trocar
-- p_ong pela ONG ligada a auth.uid().
-- =============================================================================

drop table if exists coletas cascade;
drop table if exists doacoes cascade;
drop table if exists ongs cascade;
drop table if exists estabelecimentos cascade;

-- Cadastros de referência ------------------------------------------------------

create table estabelecimentos (
  id        text primary key,
  nome      text not null,
  tipo      text not null check (tipo in ('mercado', 'padaria', 'restaurante', 'hortifruti')),
  endereco  text not null,
  bairro    text not null,
  lat       double precision not null,
  lng       double precision not null
);

create table ongs (
  id        text primary key,
  nome      text not null,
  endereco  text not null,
  bairro    text not null,
  lat       double precision not null,
  lng       double precision not null
);

-- Doações ----------------------------------------------------------------------

create table doacoes (
  id                 uuid primary key default gen_random_uuid(),
  estabelecimento_id text not null references estabelecimentos (id),
  categoria          text not null
                     check (categoria in ('paes', 'hortifruti', 'refeicoes_prontas', 'laticinios', 'graos', 'outros')),
  descricao          text not null check (char_length(trim(descricao)) between 5 and 200),
  quantidade_kg      numeric(7, 2) not null check (quantidade_kg > 0 and quantidade_kg <= 1000),
  validade           date not null,
  -- Janela de retirada em hora LOCAL de São Paulo (sem fuso), como o app usa.
  janela_inicio      timestamp not null,
  janela_fim         timestamp not null,
  endereco           text not null,
  bairro             text not null,
  lat                double precision not null,
  lng                double precision not null,
  status             text not null default 'disponivel'
                     check (status in ('disponivel', 'reservada', 'coletada')),
  ong_id             text references ongs (id),
  reservada_em       timestamptz,
  coletada_em        timestamptz,
  criada_em          timestamptz not null default now(),

  constraint janela_valida check (janela_fim > janela_inicio),
  constraint retirada_ate_validade check (janela_inicio::date <= validade),
  -- Doação reservada ou coletada sempre tem ONG; disponível nunca tem.
  constraint ong_conforme_status check ((status = 'disponivel') = (ong_id is null))
);

create index doacoes_status_idx on doacoes (status);
create index doacoes_ong_idx on doacoes (ong_id);

-- Coletas concluídas (base do painel de impacto) -------------------------------

create table coletas (
  id                 uuid primary key default gen_random_uuid(),
  doacao_id          uuid references doacoes (id) on delete set null,
  estabelecimento_id text not null references estabelecimentos (id),
  ong_id             text not null references ongs (id),
  categoria          text not null,
  kg                 numeric(7, 2) not null check (kg > 0),
  data               date not null default ((now() at time zone 'America/Sao_Paulo')::date)
);

create index coletas_data_idx on coletas (data);

-- Regras de acesso (Row Level Security) ----------------------------------------

alter table estabelecimentos enable row level security;
alter table ongs enable row level security;
alter table doacoes enable row level security;
alter table coletas enable row level security;

create policy "leitura publica" on estabelecimentos for select using (true);
create policy "leitura publica" on ongs for select using (true);
create policy "leitura publica" on doacoes for select using (true);
create policy "leitura publica" on coletas for select using (true);

-- Cadastro de doação: só entra como disponível, sem ONG e sem datas de reserva.
create policy "cadastro de doacao" on doacoes for insert
  with check (status = 'disponivel' and ong_id is null and reservada_em is null and coletada_em is null);

-- Mudanças de status (security definer: rodam com permissão do dono e
-- conferem o status atual na mesma instrução, sem condição de corrida) --------

create or replace function reservar_doacao(p_doacao uuid, p_ong text)
returns void language plpgsql security definer set search_path = public as $$
begin
  update doacoes
     set status = 'reservada', ong_id = p_ong, reservada_em = now()
   where id = p_doacao and status = 'disponivel';
  if not found then
    raise exception 'Esta doação não está mais disponível.' using errcode = 'P0001';
  end if;
end $$;

create or replace function cancelar_reserva(p_doacao uuid, p_ong text)
returns void language plpgsql security definer set search_path = public as $$
begin
  update doacoes
     set status = 'disponivel', ong_id = null, reservada_em = null
   where id = p_doacao and status = 'reservada' and ong_id = p_ong;
  if not found then
    raise exception 'Reserva não encontrada para esta ONG.' using errcode = 'P0001';
  end if;
end $$;

create or replace function confirmar_coleta(p_doacao uuid, p_ong text)
returns void language plpgsql security definer set search_path = public as $$
declare
  d doacoes;
begin
  update doacoes
     set status = 'coletada', coletada_em = now()
   where id = p_doacao and status = 'reservada' and ong_id = p_ong
  returning * into d;
  if not found then
    raise exception 'Reserva não encontrada para esta ONG.' using errcode = 'P0001';
  end if;

  insert into coletas (doacao_id, estabelecimento_id, ong_id, categoria, kg)
  values (d.id, d.estabelecimento_id, d.ong_id, d.categoria, d.quantidade_kg);
end $$;

revoke all on function reservar_doacao(uuid, text) from public;
revoke all on function cancelar_reserva(uuid, text) from public;
revoke all on function confirmar_coleta(uuid, text) from public;
grant execute on function reservar_doacao(uuid, text) to anon, authenticated;
grant execute on function cancelar_reserva(uuid, text) to anon, authenticated;
grant execute on function confirmar_coleta(uuid, text) to anon, authenticated;

-- Tempo real: avisa os apps abertos quando doações ou coletas mudam ------------

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    alter publication supabase_realtime add table doacoes, coletas;
  end if;
end $$;
