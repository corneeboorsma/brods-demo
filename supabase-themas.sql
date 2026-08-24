-- ============================================================
-- Brodshoes – Thema's tabel migratie
-- Uitvoeren in: Supabase Dashboard → SQL Editor → New query
-- ============================================================

-- 1. Thema's tabel
create table if not exists public.themas (
  id            uuid primary key default gen_random_uuid(),
  naam          text not null,
  is_standaard  boolean not null default false,
  achtergrond   text not null default '#e8dcc8',
  kaart         text not null default '#1e3a3f',
  kaart_mid     text not null default '#254a50',
  accent        text not null default '#e85d4a',
  aangemaakt_op timestamptz not null default now(),
  aangemaakt_door uuid references auth.users(id) on delete set null
);

-- 2. RLS
alter table public.themas enable row level security;

create policy "Publiek lezen themas"
  on public.themas for select
  to anon, authenticated using (true);

create policy "Ingelogd aanmaken themas"
  on public.themas for insert
  to authenticated with check (true);

create policy "Ingelogd bewerken themas"
  on public.themas for update
  to authenticated using (not is_standaard);

create policy "Ingelogd verwijderen themas"
  on public.themas for delete
  to authenticated using (not is_standaard);

-- 3. De 10 standaard thema's invoegen
insert into public.themas (naam, is_standaard, achtergrond, kaart, kaart_mid, accent) values
  ('Pasen',         true, '#e8dcc8', '#1e3a3f', '#254a50', '#e85d4a'),
  ('Kerst',         true, '#1a0a0a', '#2d0d0d', '#3d1515', '#c9a84c'),
  ('Zomer',         true, '#f0f7f0', '#1a3d2b', '#244f38', '#f4a020'),
  ('Herfst',        true, '#f5ede0', '#3d2008', '#4e2a0e', '#d4621a'),
  ('Neutraal',      true, '#f2f2f2', '#1a1a1a', '#2e2e2e', '#555555'),
  ('Bordeaux',      true, '#f5eff0', '#4a0e1a', '#6b1525', '#c9a84c'),
  ('Asperge',       true, '#f4f9f0', '#2d5a1e', '#3d7a2a', '#a8c840'),
  ('Nacht',         true, '#0a0e1a', '#0f1635', '#1a2550', '#8ab4d4'),
  ('Rustiek',       true, '#f2ece4', '#3d2410', '#52300f', '#c07840'),
  ('Minimaal Wit',  true, '#ffffff', '#1a1a1a', '#333333', '#000000')
on conflict do nothing;
