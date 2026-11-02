# Mail systeem instellen

## Vereisten
- Firebase CLI geïnstalleerd: `npm install -g firebase-tools`
- Ingelogd op Firebase: `firebase login`
- Firebase project: `brodshoes-bestellen`

---

## Stap 1: Functions dependencies installeren

```bash
cd functions
npm install
cd ..
```

---

## Stap 2: Resend API key instellen als Firebase Secret

```bash
firebase functions:secrets:set RESEND_API_KEY
```

Voer de API key in wanneer gevraagd.

> Rotateer de key na ingebruikname via het Resend dashboard.

---

## Stap 3: Mail configuratie aanmaken in Firestore

```bash
node setup-mail-config.js
```

Dit maakt een uniek webhook token aan in Firestore (`_config/mail`).
Het token wordt getoond in de terminal — kopieer het.

---

## Stap 4: Cloud Functions deployen

```bash
firebase deploy --only functions
```

Dit deployt drie functies:
- `stuurBevestigingsmail` — wordt automatisch getriggerd bij nieuwe bestelling
- `stuurHandmatigemail` — HTTP endpoint voor handmatig/batch versturen
- `resendWebhook` — ontvangt delivery-status updates van Resend

---

## Stap 5: Resend webhook instellen

1. Ga naar resend.com → Webhooks
2. Voeg webhook toe met URL:
   ```
   https://resendwebhook-xib7mk6vva-uc.a.run.app
   ```
3. Selecteer events: `email.sent`, `email.delivered`, `email.bounced`, `email.complained`

---

## Stap 6: Firestore rules deployen

```bash
firebase deploy --only firestore:rules
```

---

## Stap 7: Domein instellen bij Resend

Ga naar Resend → Domains → voeg `brodshoes.nl` toe en volg de DNS-instructies.
Het from-adres is: `bestellingen@brodshoes.nl`

---

## Werking

### Automatische bevestigingsmail
- Klant plaatst bestelling op bestelpagina
- Firestore trigger stuurt direct bevestigingsmail via Resend
- Mail status wordt bijgehouden op de bestelling

### Handmatige mail (beheerder)
- Klik op "Bevestiging" of "Herinnering" per bestelling in templates.html
- Of klik "Herinneringsmail" in de toolbar om batch te sturen naar alle klanten zonder herinnering
- Vereist voor batch: selecteer eerst een template in het filter

### Mail templates aanpassen
- Ga naar Templates → bewerk een template → scroll naar "E-mail instellingen"
- Vul aangepaste onderwerpen en introteksten in
- Gebruik placeholders zoals `{{voornaam}}`, `{{tijdslot}}`, `{{totaal}}`

### Mail history bekijken
- Open een bestelling in de bestellingen-tab
- Klik op "Historie" om alle verstuurde mails te zien met status

---

## Troubleshooting

**Mail wordt niet verstuurd:**
- Controleer Firebase Functions logs: `firebase functions:log`
- Controleer of `RESEND_API_KEY` secret is ingesteld
- Controleer of domein `brodshoes.nl` geverifieerd is bij Resend

**"Mail niet geconfigureerd" melding:**
- Voer stap 3 opnieuw uit (setup-mail-config.js)
- Herlaad de beheer pagina
