-- ============================================================
-- Brodshoes Bestellijst – Supabase Schema
-- Uitvoeren in: Supabase Dashboard → SQL Editor → New query
-- ============================================================

-- 1. TEMPLATES
create table public.templates (
  id            uuid primary key default gen_random_uuid(),
  naam          text not null,
  slug          text not null unique,
  config        jsonb not null default '{}',
  status        text not null default 'concept' check (status in ('concept','gepubliceerd','gearchiveerd')),
  aangemaakt_op timestamptz not null default now(),
  bijgewerkt_op timestamptz not null default now(),
  aangemaakt_door uuid references auth.users(id) on delete set null
);

-- 2. PUBLICATIES
create table public.publicaties (
  id                uuid primary key default gen_random_uuid(),
  template_id       uuid not null references public.templates(id) on delete cascade,
  slug              text not null,
  gepubliceerd_op   timestamptz not null default now(),
  gepubliceerd_door uuid references auth.users(id) on delete set null
);

-- 3. Automatisch bijgewerkt_op updaten
create or replace function public.set_bijgewerkt_op()
returns trigger language plpgsql as $$
begin
  new.bijgewerkt_op = now();
  return new;
end;
$$;

create trigger templates_bijgewerkt_op
  before update on public.templates
  for each row execute function public.set_bijgewerkt_op();

-- 4. RLS (Row Level Security) — alleen ingelogde gebruikers
alter table public.templates  enable row level security;
alter table public.publicaties enable row level security;

-- Templates: ingelogde gebruikers mogen alles lezen
create policy "Ingelogd lezen templates"
  on public.templates for select
  to authenticated using (true);

-- Templates: ingelogde gebruikers mogen aanmaken
create policy "Ingelogd aanmaken templates"
  on public.templates for insert
  to authenticated with check (auth.uid() = aangemaakt_door);

-- Templates: ingelogde gebruikers mogen eigen templates bewerken
create policy "Ingelogd bewerken templates"
  on public.templates for update
  to authenticated using (true);

-- Templates: ingelogde gebruikers mogen verwijderen
create policy "Ingelogd verwijderen templates"
  on public.templates for delete
  to authenticated using (true);

-- Publicaties: ingelogde gebruikers mogen alles lezen
create policy "Ingelogd lezen publicaties"
  on public.publicaties for select
  to authenticated using (true);

-- Publicaties: ingelogde gebruikers mogen aanmaken
create policy "Ingelogd aanmaken publicaties"
  on public.publicaties for insert
  to authenticated with check (true);

-- 5. Publiek lezen van gepubliceerde templates (voor index.html?slug=xxx)
create policy "Publiek lezen gepubliceerde templates"
  on public.templates for select
  to anon using (status = 'gepubliceerd');

create policy "Publiek lezen publicaties"
  on public.publicaties for select
  to anon using (true);

-- 6. Storage bucket voor foto's
-- Uitvoeren via Supabase Dashboard → Storage → New bucket → naam: "template-fotos" → Public: aan
-- Of via SQL:
insert into storage.buckets (id, name, public)
values ('template-fotos', 'template-fotos', true)
on conflict do nothing;

create policy "Publiek lezen fotos"
  on storage.objects for select
  to public using (bucket_id = 'template-fotos');

create policy "Ingelogd uploaden fotos"
  on storage.objects for insert
  to authenticated with check (bucket_id = 'template-fotos');

create policy "Ingelogd verwijderen fotos"
  on storage.objects for delete
  to authenticated using (bucket_id = 'template-fotos');
