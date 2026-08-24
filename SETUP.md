# Brodshoes Bestellijst – Setup instructies

## Stap 1: Supabase project aanmaken

1. Ga naar https://supabase.com en maak een gratis account
2. Klik **New project**
3. Geef het project een naam, bijv. `brodshoes`
4. Kies een sterk wachtwoord (bewaar dit!)
5. Kies regio: **West EU (Frankfurt)**
6. Klik **Create new project** en wacht ~2 minuten

---

## Stap 2: Database tabellen aanmaken

1. Ga in je Supabase project naar **SQL Editor**
2. Klik **New query**
3. Kopieer de inhoud van `supabase-schema.sql` en plak deze in de editor
4. Klik **Run**
5. Je ziet: "Success. No rows returned"

---

## Stap 3: Supabase URL en key invullen

1. Ga naar **Project Settings → API**
2. Kopieer:
   - **Project URL** (bijv. `https://xyzxyz.supabase.co`)
   - **anon public** key (begint met `eyJ...`)
3. Open `supabase-config.js` en vul in:
   ```js
   const SUPABASE_URL  = 'https://jouw-project.supabase.co';
   const SUPABASE_ANON = 'eyJ...jouw-anon-key...';
   ```

---

## Stap 4: Eerste gebruiker aanmaken

1. Ga in Supabase naar **Authentication → Users**
2. Klik **Invite user** of **Add user**
3. Vul een e-mailadres en wachtwoord in
4. Dit zijn de inloggegevens voor `login.html`

---

## Stap 5: Storage bucket controleren

Het schema maakt automatisch een bucket `template-fotos` aan.
Controleer via **Storage** in Supabase of de bucket bestaat.
Zo niet: klik **New bucket**, naam `template-fotos`, zet **Public** aan.

---

## Stap 6: Pushen naar GitHub Pages

```bash
git add .
git commit -m "Supabase config ingevuld"
git push
```

Activeer GitHub Pages via:
https://github.com/corneeboorsma/brods-demo/settings/pages
→ Branch: main / root → Save

---

## Pagina overzicht

| Pagina | URL | Doel |
|---|---|---|
| Bestellijst | `/index.html` | Klantpagina (fallback localStorage) |
| Bestellijst (template) | `/index.html?slug=pasen-2026` | Klantpagina via Supabase template |
| Login | `/login.html` | Inloggen beheerders |
| Templates | `/templates.html` | CRUD templates + publicaties |

---

## Bestaande admin (localStorage)

De oude `admin.html` werkt nog steeds voor snelle lokale tests.
Voor productiegebruik: gebruik `templates.html` via Supabase.
