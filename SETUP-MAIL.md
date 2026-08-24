# Bevestigingsmail instellen via Resend + Supabase Edge Function

## Stap 1: Resend account aanmaken

1. Ga naar https://resend.com en maak een gratis account aan
2. Ga naar **API Keys** → **Create API Key**
3. Geef het een naam (bijv. `brodshoes`) en klik **Add**
4. Kopieer de API key (begint met `re_...`) — je ziet hem maar één keer!

---

## Stap 2: Domein verifiëren (optioneel maar aanbevolen)

Voor de POC kun je ook mailen vanaf `onboarding@resend.dev` (gratis testadres).
Wil je mailen vanaf `bestellingen@brodshoes.nl`, voeg dan je domein toe via **Domains** in Resend.

---

## Stap 3: Supabase CLI installeren

```bash
npm install -g supabase
```

Of download via: https://supabase.com/docs/guides/cli

---

## Stap 4: Inloggen en project koppelen

```bash
supabase login
supabase link --project-ref rvredacgaphaoucmuosm
```

---

## Stap 5: Edge Function deployen

Vanuit de map `brodshoes-pasen/`:

```bash
supabase functions deploy bevestigingsmail
```

---

## Stap 6: Environment variabelen instellen

```bash
supabase secrets set RESEND_API_KEY=re_jouw_api_key_hier
supabase secrets set FROM_EMAIL=onboarding@resend.dev
```

---

## Stap 7: Database webhook instellen

1. Ga naar **Supabase Dashboard → Database → Webhooks**
2. Klik **Create a new hook**
3. Vul in:
   - **Name:** `bevestigingsmail`
   - **Table:** `bestellingen`
   - **Events:** `INSERT`
   - **Type:** Supabase Edge Functions
   - **Function:** `bevestigingsmail`
4. Klik **Create webhook**

Vanaf nu ontvangt elke besteller automatisch een bevestigingsmail!

---

## Keuken dashboard wachtwoord

Het wachtwoord voor `keuken.html` is: **keuken2026**

Dit kun je wijzigen in `keuken.html` regel:
```js
const KEUKEN_WW = 'keuken2026';
```
