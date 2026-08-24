-- ============================================================
-- Brodshoes – Audit log tabel
-- Uitvoeren in: Supabase Dashboard → SQL Editor → New query
-- ============================================================

create table if not exists public.audit_log (
  id          uuid primary key default gen_random_uuid(),
  actie       text not null,
  object_type text not null,
  object_id   text,
  object_naam text,
  details     jsonb,
  gebruiker   text,
  gebruiker_id uuid references auth.users(id) on delete set null,
  uitgevoerd_op timestamptz not null default now()
);

-- RLS: alleen ingelogde gebruikers mogen lezen en schrijven
alter table public.audit_log enable row level security;

create policy "Ingelogd lezen audit_log"
  on public.audit_log for select
  to authenticated using (true);

create policy "Ingelogd schrijven audit_log"
  on public.audit_log for insert
  to authenticated with check (true);
