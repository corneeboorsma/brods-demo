# Brodshoes bestelsysteem — projectregels

## Lettertypes

Twee lettertypes, consistent door de hele app:

| Lettertype | Gebruik |
|---|---|
| **Cormorant Garamond** | Koppen, titels, merknaam, sectieheaders, kaartnamen |
| **Lato** | Alle broodtekst, knoppen, labels, formulieren, bedragen in admin-UI |
| **Arial** | Fallback in e-mail HTML (e-mailclients laden geen Google Fonts) |
| **monospace** | URLs en code-tags |

**Regels:**
- Bedragen in de **admin-UI** (templates.html): Lato
- Bedragen op de **bestelpagina** (index.html): Cormorant Garamond mag (merkstijl, klant-facing)
- In **mail HTML** (zowel preview als Cloud Function): nooit Cormorant Garamond — altijd `'Lato', Arial, sans-serif` want Google Fonts laadt niet in e-mailclients
- Google Fonts `<link>` hoort altijd in `<head>`, nooit in `<body>` of binnen een tabel/fragment

## Architectuur

- **index.html** — klant-facing bestelpagina
- **templates.html** — admin beheer (templates, thema's, bestellingen, mail)
- **admin.html** — evenement configuratie
- **login.html** — authenticatie
- **functions/index.js** — Firebase Cloud Functions (mail via Resend)

## Firebase

- Project: `brodshoes-bestellen`
- Cloud Functions: us-central1, Node.js 22
- Resend API key: opgeslagen als Firebase Secret (`RESEND_API_KEY`), nooit in frontend
- Mail webhook token: opgeslagen in Firestore `_config/mail`
- From-adres: `Brodshoes <info@brodshoes.nl>` (wordt later `bestellingen@brodshoes.nl` na DNS verificatie)

## Mail

- Bevestigingsmail: automatisch via `onDocumentCreated` Firestore trigger
- Handmatige mail: HTTP endpoint `stuurHandmatigemail`
- Mail preview: `bouwVoorbeeldMailHTML()` geeft volledige `<!DOCTYPE html>` pagina terug (niet een fragment)
- Beide preview-functies (`toonBestellingMailVoorbeeld`, `toonMailVoorbeeld`) schrijven de volledige HTML direct naar `window.open()`

## Bestellingen tab

- Bestellingen laden pas na selecteren van een template (geen `orderBy` in Firestore query, client-side sorteren)
- Mailknoppen staan als derde kolom in de detail-grid, op dezelfde hoogte als contactgegevens

## Thema's

- Alle thema's zijn bewerkbaar en verwijderbaar, ook standaard thema's (`is_standaard: true` wordt genegeerd in de UI)
