# Hosting instructie – Brodshoes Bestelsysteem

## Wat is dit?

Dit is een bestelsysteem voor Brodshoes. Klanten kunnen via een webpagina salades en andere producten bestellen voor seizoensgebonden evenementen (Pasen, Kerst, etc.).

De applicatie bestaat uit statische HTML-bestanden die verbinding maken met Firebase (Google) als database. Er is geen server-side code nodig.

---

## Waar plaatsen?

De bestanden moeten geplaatst worden in een **submap** van de bestaande website:

```
brodshoes.nl/bestellen/
```

De bestaande WordPress-installatie in de root van `brodshoes.nl` wordt **niet** aangeraakt.

---

## Wat staat er in de zip?

| Bestand | Omschrijving |
|---|---|
| `index.html` | De bestelpagina voor klanten |
| `login.html` | Inlogpagina voor beheerders |
| `templates.html` | Beheerpagina (templates, bestellingen, thema's) |
| `firebase-config.js` | Verbindingsinstellingen Firebase database |
| `.htaccess` | URL-rewriting zodat mooie URLs werken |
| `header.png` | Standaard headerfoto |
| `footer.png` | Standaard footerfoto |

---

## Stappen

1. **Maak de map aan** `/bestellen/` op de server (via Plesk of FTP)
2. **Upload alle bestanden** uit de zip naar `/bestellen/`
3. **Controleer `.htaccess`** — dit bestand zorgt voor schone URLs zoals `brodshoes.nl/bestellen/kerst-2026`. Het mag **niet** worden samengevoegd met de `.htaccess` van WordPress in de root. Het staat in een eigen submap en werkt volledig zelfstandig.
4. **Test de URL** `brodshoes.nl/bestellen/login.html` — de inlogpagina moet zichtbaar zijn

---

## URL-structuur

| Pagina | URL |
|---|---|
| Inloggen (beheer) | `brodshoes.nl/bestellen/login.html` |
| Beheer | `brodshoes.nl/bestellen/templates.html` |
| Bestelpagina klant | `brodshoes.nl/bestellen/kerst-2026` |

De bestelpagina-URLs worden automatisch aangemaakt als een beheerder een template publiceert. De `.htaccess` zorgt dat deze URLs zonder `index.html` werken.

---

## Geen database-installatie nodig

De applicatie maakt gebruik van **Firebase (Google Cloud)** als database. Er hoeft geen MySQL-database aangemaakt te worden en er zijn geen PHP-bestanden. De bestanden werken puur als statische HTML.

---

## Vragen?

Neem contact op met de ontwikkelaar.
