-- ============================================================
-- Brodshoes – Bestellingen tabel migratie
-- Uitvoeren in: Supabase Dashboard → SQL Editor → New query
-- ============================================================

create table if not exists public.bestellingen (
  id              uuid primary key default gen_random_uuid(),
  template_id     uuid references public.templates(id) on delete set null,
  template_slug   text,
  voornaam        text not null,
  achternaam      text not null,
  email           text not null,
  telefoon        text,
  adres           text,
  regels          jsonb not null default '[]',
  totaal          numeric(10,2) not null default 0,
  tijdslot        text,
  opmerking       text,
  status          text not null default 'nieuw' check (status in ('nieuw','in_behandeling','klaar')),
  besteld_op      timestamptz not null default now()
);

-- RLS
alter table public.bestellingen enable row level security;

-- Iedereen mag een bestelling plaatsen (anoniem)
create policy "Publiek bestellingen plaatsen"
  on public.bestellingen for insert
  to anon, authenticated with check (true);

-- Alleen ingelogde gebruikers mogen bestellingen lezen
create policy "Ingelogd bestellingen lezen"
  on public.bestellingen for select
  to authenticated using (true);

-- Ingelogde gebruikers mogen status bijwerken
create policy "Ingelogd bestellingen bijwerken"
  on public.bestellingen for update
  to authenticated using (true);
