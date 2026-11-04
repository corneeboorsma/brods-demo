const { initializeApp } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const { getAuth } = require('firebase-admin/auth');
const { onDocumentCreated } = require('firebase-functions/v2/firestore');
const { onRequest } = require('firebase-functions/v2/https');
const { defineSecret } = require('firebase-functions/params');
const { Resend } = require('resend');
const crypto = require('crypto');

initializeApp();

const resendApiKey = defineSecret('RESEND_API_KEY');
const resendWebhookSecret = defineSecret('RESEND_WEBHOOK_SECRET');

// ── E-mail helpers ──────────────────────────────────────────────────

function vervangPlaceholders(tekst, bestelling, template) {
  if (!tekst) return '';
  const ev = template?.config?.evenement || {};
  const naam = `${bestelling.voornaam || ''} ${bestelling.achternaam || ''}`.trim();

  const regelsHTML = (bestelling.regels || [])
    .filter(r => parseFloat(r.qty) > 0)
    .map(r => `
      <tr>
        <td style="padding:6px 12px;border-bottom:1px solid rgba(255,255,255,0.1);">${r.label || ''}</td>
        <td style="padding:6px 12px;border-bottom:1px solid rgba(255,255,255,0.1);text-align:center;">${r.qty}×</td>
        <td style="padding:6px 12px;border-bottom:1px solid rgba(255,255,255,0.1);text-align:right;">€ ${(parseFloat(r.subtotaal) || 0).toFixed(2).replace('.', ',')}</td>
      </tr>`)
    .join('');

  const totaal = (parseFloat(bestelling.totaal) || 0).toFixed(2).replace('.', ',');

  return tekst
    .replace(/\{\{voornaam\}\}/gi, bestelling.voornaam || '')
    .replace(/\{\{achternaam\}\}/gi, bestelling.achternaam || '')
    .replace(/\{\{naam\}\}/gi, naam)
    .replace(/\{\{email\}\}/gi, bestelling.email || '')
    .replace(/\{\{telefoon\}\}/gi, bestelling.telefoon || '')
    .replace(/\{\{adres\}\}/gi, bestelling.adres || '')
    .replace(/\{\{tijdslot\}\}/gi, bestelling.tijdslot || '')
    .replace(/\{\{totaal\}\}/gi, `€ ${totaal}`)
    .replace(/\{\{datum\}\}/gi, new Date(bestelling.besteld_op || '').toLocaleDateString('nl-NL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }))
    .replace(/\{\{evenement_titel\}\}/gi, ev.titel || '')
    .replace(/\{\{evenement_dag\}\}/gi, ev.dag || '')
    .replace(/\{\{evenement_locatie\}\}/gi, ev.locatie || '')
    .replace(/\{\{evenement_badge\}\}/gi, ev.badge || '')
    .replace(/\{\{evenement_deadline\}\}/gi, ev.deadline || '')
    .replace(/\{\{bestelling_regels\}\}/gi, regelsHTML)
    .replace(/\{\{bestelling_totaal\}\}/gi, `€ ${totaal}`)
    .replace(/\{\{opmerking\}\}/gi, bestelling.opmerking || '');
}

function bouwMailHTML(bestelling, template, mailConfig) {
  const ev = template?.config?.evenement || {};
  const themaKleur = '#1e3a3f';
  const accentKleur = '#e85d4a';
  const achtergrondKleur = '#e8dcc8';
  const headerFoto = template?.config?.headerFoto || null;
  const footerFoto = template?.config?.footerFoto || null;

  const naam = `${bestelling.voornaam || ''} ${bestelling.achternaam || ''}`.trim();
  const totaal = (parseFloat(bestelling.totaal) || 0).toFixed(2).replace('.', ',');

  const regelsHTML = (bestelling.regels || [])
    .filter(r => parseFloat(r.qty) > 0)
    .map(r => `
      <tr>
        <td style="padding:8px 16px;border-bottom:1px solid rgba(255,255,255,0.08);font-size:14px;font-family:Arial,sans-serif;">${r.label || ''}</td>
        <td style="padding:8px 16px;border-bottom:1px solid rgba(255,255,255,0.08);text-align:center;font-size:14px;font-family:Arial,sans-serif;">${r.qty}×</td>
        <td style="padding:8px 16px;border-bottom:1px solid rgba(255,255,255,0.08);text-align:right;font-size:14px;font-family:Arial,sans-serif;">€ ${(parseFloat(r.subtotaal) || 0).toFixed(2).replace('.', ',')}</td>
      </tr>`)
    .join('');

  const opmerkingHtml = bestelling.opmerking
    ? `<div style="background:#fff3f2;border-left:3px solid ${accentKleur};padding:12px 16px;margin-top:16px;font-size:13px;color:#333;font-family:Arial,sans-serif;">
        <strong>Opmerking:</strong> ${bestelling.opmerking}
       </div>`
    : '';

  const intro = mailConfig?.intro
    ? vervangPlaceholders(mailConfig.intro, bestelling, template).replace(/\n/g, '<br>')
    : `Beste ${bestelling.voornaam || 'klant'},<br><br>Bedankt voor uw bestelling bij Brodshoes. Hieronder vindt u een overzicht.`;

  const afsluiting = mailConfig?.afsluiting
    ? vervangPlaceholders(mailConfig.afsluiting, bestelling, template).replace(/\n/g, '<br>')
    : `Met vriendelijke groet,<br><br>Team Brodshoes`;

  const headerBlok = headerFoto
    ? `<tr><td style="padding:0;line-height:0;"><img src="${headerFoto}" width="600" style="display:block;width:100%;max-width:600px;height:auto;" alt="" /></td></tr>`
    : `<tr><td style="background:${themaKleur};padding:28px 32px;text-align:center;">
        <div style="font-family:Arial,sans-serif;font-size:22px;font-weight:700;color:#fff;letter-spacing:3px;text-transform:uppercase;">Brodshoes</div>
        <div style="font-size:11px;color:rgba(255,255,255,0.5);letter-spacing:2px;text-transform:uppercase;margin-top:4px;font-family:Arial,sans-serif;">${ev.titel || 'Bestelling bevestiging'}</div>
      </td></tr>`;

  const footerBlok = footerFoto
    ? `<tr><td style="padding:0;line-height:0;"><img src="${footerFoto}" width="600" style="display:block;width:100%;max-width:600px;height:auto;" alt="" /></td></tr>`
    : `<tr><td style="background:${themaKleur};padding:16px 32px;text-align:center;">
        <div style="font-size:11px;color:rgba(255,255,255,0.4);letter-spacing:1px;font-family:Arial,sans-serif;">© Brodshoes · Dit is een automatisch gegenereerd bericht</div>
      </td></tr>`;

  return `<!DOCTYPE html>
<html lang="nl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Brodshoes</title>
  <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700&family=Lato:wght@300;400;600;700&display=swap" rel="stylesheet">
</head>
<body style="margin:0;padding:0;background:${achtergrondKleur};font-family:'Lato',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:${achtergrondKleur};padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

        ${headerBlok}

        <tr>
          <td style="background:#fff;padding:32px;">
            <p style="font-size:15px;line-height:1.7;color:#333;margin:0 0 24px;font-family:'Lato',Arial,sans-serif;">${intro}</p>

            ${ev.dag ? `<div style="background:${themaKleur};color:#fff;padding:16px 20px;margin-bottom:24px;">
              <div style="font-size:11px;letter-spacing:2px;text-transform:uppercase;color:rgba(255,255,255,0.6);margin-bottom:6px;font-family:'Lato',Arial,sans-serif;">Afhaalmoment</div>
              <div style="font-size:16px;font-weight:700;font-family:Arial,sans-serif;">${ev.badge || ev.dag}</div>
              ${ev.locatie ? `<div style="font-size:13px;color:rgba(255,255,255,0.7);margin-top:4px;font-family:'Lato',Arial,sans-serif;">${ev.locatie}</div>` : ''}
            </div>` : ''}

            <div style="font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#888;margin-bottom:10px;font-family:'Lato',Arial,sans-serif;">Uw bestelling</div>
            <table width="100%" cellpadding="0" cellspacing="0" style="background:${themaKleur};margin-bottom:24px;">
              <thead>
                <tr>
                  <th style="padding:10px 16px;text-align:left;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:rgba(255,255,255,0.5);font-weight:700;font-family:'Lato',Arial,sans-serif;">Product</th>
                  <th style="padding:10px 16px;text-align:center;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:rgba(255,255,255,0.5);font-weight:700;font-family:'Lato',Arial,sans-serif;">Aantal</th>
                  <th style="padding:10px 16px;text-align:right;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:rgba(255,255,255,0.5);font-weight:700;font-family:'Lato',Arial,sans-serif;">Bedrag</th>
                </tr>
              </thead>
              <tbody style="color:#fff;">${regelsHTML}</tbody>
              <tfoot>
                <tr>
                  <td colspan="2" style="padding:10px 16px;font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:rgba(255,255,255,0.5);border-top:1px solid rgba(255,255,255,0.15);font-family:'Lato',Arial,sans-serif;">Totaal</td>
                  <td style="padding:10px 16px;text-align:right;font-size:18px;font-weight:700;color:#fff;border-top:1px solid rgba(255,255,255,0.15);font-family:Arial,sans-serif;">€ ${totaal}</td>
                </tr>
              </tfoot>
            </table>

            ${opmerkingHtml}

            <div style="border-top:1px solid #eee;padding-top:20px;margin-top:20px;font-size:13px;color:#666;line-height:1.8;font-family:'Lato',Arial,sans-serif;">
              <strong style="color:#333;font-family:Arial,sans-serif;font-size:14px;font-weight:700;">${naam}</strong><br>
              ${bestelling.adres || ''}<br>
              ${bestelling.telefoon || ''}
            </div>

            <p style="font-size:14px;line-height:1.7;color:#333;margin:24px 0 0;font-family:'Lato',Arial,sans-serif;">${afsluiting}</p>
          </td>
        </tr>

        ${footerBlok}

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

async function stuurMail(resend, naar, onderwerp, html, metaData) {
  const result = await resend.emails.send({
    from: 'Brodshoes <info@brodshoes.nl>',
    to: [naar],
    subject: onderwerp,
    html,
  });

  if (result.error) {
    throw new Error(result.error.message || 'Resend fout');
  }

  return result.data?.id;
}

async function slaMailHistoryOp(db, bestellingId, type, status, onderwerp, resendId, errorMsg) {
  const bestRef = db.collection('bestellingen').doc(bestellingId);
  const historyRef = bestRef.collection('mail_history');

  await historyRef.add({
    type,
    status,
    onderwerp,
    resend_id: resendId || null,
    error: errorMsg || null,
    verstuurd_op: new Date().toISOString(),
  });

  // Update mail_status op de bestelling zelf
  const updateData = {};
  if (type === 'bevestiging') {
    updateData.mail_bevestiging_status = status;
    updateData.mail_bevestiging_op = new Date().toISOString();
  } else if (type === 'herinnering') {
    updateData.mail_herinnering_status = status;
    updateData.mail_herinnering_op = new Date().toISOString();
  }
  if (Object.keys(updateData).length) {
    await bestRef.update(updateData);
  }
}

// ── Cloud Function 1: Bevestigingsmail bij nieuwe bestelling ────────

exports.stuurBevestigingsmail = onDocumentCreated(
  { document: 'bestellingen/{bestellingId}', secrets: [resendApiKey], region: 'us-central1' },
  async (event) => {
    const db = getFirestore();
    const snap = event.data;
    if (!snap) return;

    const bestelling = snap.data();
    const bestellingId = event.params.bestellingId;

    if (!bestelling.email) {
      console.log('Geen e-mailadres op bestelling', bestellingId);
      return;
    }

    // Haal template op voor evenement-info en mail-config
    let template = null;
    let mailConfig = null;
    if (bestelling.template_id) {
      const tplSnap = await db.collection('templates').doc(bestelling.template_id).get();
      if (tplSnap.exists) {
        template = tplSnap.data();
        mailConfig = template?.mail_config || null;
      }
    }

    // Onderwerp
    const ev = template?.config?.evenement || {};
    const naam = `${bestelling.voornaam || ''} ${bestelling.achternaam || ''}`.trim();
    const onderwerp = mailConfig?.onderwerp_bevestiging
      ? vervangPlaceholders(mailConfig.onderwerp_bevestiging, bestelling, template)
      : `Bevestiging uw bestelling – Brodshoes${ev.titel ? ' ' + ev.titel : ''}`;

    const html = bouwMailHTML(bestelling, template, mailConfig);
    const resend = new Resend(resendApiKey.value());

    try {
      const resendId = await stuurMail(resend, bestelling.email, onderwerp, html);
      await slaMailHistoryOp(db, bestellingId, 'bevestiging', 'verzonden', onderwerp, resendId, null);
      console.log(`Bevestigingsmail verstuurd naar ${bestelling.email} (${resendId})`);
    } catch (err) {
      console.error('Fout bij versturen bevestigingsmail:', err.message);
      await slaMailHistoryOp(db, bestellingId, 'bevestiging', 'fout', onderwerp, null, err.message);
    }
  }
);

// ── Cloud Function 2: HTTP endpoint voor herinnerings-/herbevestigingsmail ──

exports.stuurHandmatigemail = onRequest(
  { secrets: [resendApiKey], cors: true },
  async (req, res) => {
    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Alleen POST toegestaan' });
      return;
    }

    // Verifieer Firebase ID token (zelfde patroon als beheerGebruiker)
    const authHeader = req.headers.authorization || '';
    const idToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!idToken) {
      res.status(401).json({ error: 'Niet geautoriseerd' });
      return;
    }
    try {
      await getAuth().verifyIdToken(idToken);
    } catch (err) {
      res.status(401).json({ error: 'Ongeldig token' });
      return;
    }

    const { bestellingId, type } = req.body;

    const db = getFirestore();

    if (!bestellingId || !type) {
      res.status(400).json({ error: 'bestellingId en type zijn verplicht' });
      return;
    }

    if (!['bevestiging', 'herinnering'].includes(type)) {
      res.status(400).json({ error: 'type moet bevestiging of herinnering zijn' });
      return;
    }

    // Haal bestelling op
    const bestSnap = await db.collection('bestellingen').doc(bestellingId).get();
    if (!bestSnap.exists) {
      res.status(404).json({ error: 'Bestelling niet gevonden' });
      return;
    }

    const bestelling = bestSnap.data();
    if (!bestelling.email) {
      res.status(400).json({ error: 'Bestelling heeft geen e-mailadres' });
      return;
    }

    // Haal template op
    let template = null;
    let mailConfig = null;
    if (bestelling.template_id) {
      const tplSnap = await db.collection('templates').doc(bestelling.template_id).get();
      if (tplSnap.exists) {
        template = tplSnap.data();
        mailConfig = template?.mail_config || null;
      }
    }

    const ev = template?.config?.evenement || {};
    const resend = new Resend(resendApiKey.value());

    let onderwerp, html;

    if (type === 'bevestiging') {
      onderwerp = mailConfig?.onderwerp_bevestiging
        ? vervangPlaceholders(mailConfig.onderwerp_bevestiging, bestelling, template)
        : `Bevestiging uw bestelling – Brodshoes${ev.titel ? ' ' + ev.titel : ''}`;
      html = bouwMailHTML(bestelling, template, mailConfig);
    } else {
      // Herinnering
      onderwerp = mailConfig?.onderwerp_herinnering
        ? vervangPlaceholders(mailConfig.onderwerp_herinnering, bestelling, template)
        : `Herinnering: uw afhaalmoment nadert – Brodshoes`;

      const herinneringIntro = mailConfig?.herinnering_intro
        ? vervangPlaceholders(mailConfig.herinnering_intro, bestelling, template)
        : null;

      const herinneringConfig = mailConfig
        ? { ...mailConfig, intro: herinneringIntro || mailConfig.intro }
        : null;

      html = bouwMailHTML(bestelling, template, herinneringConfig);
    }

    try {
      const resendId = await stuurMail(resend, bestelling.email, onderwerp, html);
      await slaMailHistoryOp(db, bestellingId, type, 'verzonden', onderwerp, resendId, null);
      res.json({ success: true, resend_id: resendId });
    } catch (err) {
      console.error('Fout bij handmatige mail:', err.message);
      await slaMailHistoryOp(db, bestellingId, type, 'fout', onderwerp, null, err.message);
      res.status(500).json({ error: 'Er is een fout opgetreden bij het versturen van de mail' });
    }
  }
);

// ── Cloud Function 3: Resend webhook voor delivery-status updates ───

exports.resendWebhook = onRequest(
  { cors: false, secrets: [resendWebhookSecret] },
  async (req, res) => {
    if (req.method !== 'POST') {
      res.status(405).send('Method Not Allowed');
      return;
    }

    // Verifieer Resend SVIX webhook signature
    const svixId        = req.headers['svix-id'];
    const svixTimestamp = req.headers['svix-timestamp'];
    const svixSignature = req.headers['svix-signature'];

    if (!svixId || !svixTimestamp || !svixSignature) {
      res.status(401).send('Ontbrekende webhook headers');
      return;
    }

    // Tijdstempel mag niet ouder dan 5 minuten zijn (replay-aanval bescherming)
    const ts = parseInt(svixTimestamp, 10);
    if (isNaN(ts) || Math.abs(Date.now() / 1000 - ts) > 300) {
      res.status(401).send('Webhook tijdstempel verlopen');
      return;
    }

    const rawBody = JSON.stringify(req.body);
    const signingPayload = `${svixId}.${svixTimestamp}.${rawBody}`;
    const secret = Buffer.from(resendWebhookSecret.value().replace(/^whsec_/, ''), 'base64');
    const expectedSig = crypto.createHmac('sha256', secret).update(signingPayload).digest('base64');

    const signatures = svixSignature.split(' ').map(s => s.replace(/^v1,/, ''));
    const valid = signatures.some(sig => {
      try {
        return crypto.timingSafeEqual(Buffer.from(sig, 'base64'), Buffer.from(expectedSig, 'base64'));
      } catch { return false; }
    });

    if (!valid) {
      res.status(401).send('Ongeldige webhook handtekening');
      return;
    }

    const event = req.body;
    const resendId = event?.data?.email_id;
    const eventType = event?.type; // email.sent, email.delivered, email.bounced, etc.

    if (!resendId || !eventType) {
      res.status(400).send('Ongeldig webhook payload');
      return;
    }

    const db = getFirestore();

    // Zoek de mail_history entry met dit resend_id
    const bestellingenSnap = await db.collection('bestellingen').get();

    for (const bestDoc of bestellingenSnap.docs) {
      const histSnap = await bestDoc.ref.collection('mail_history')
        .where('resend_id', '==', resendId).limit(1).get();

      if (!histSnap.empty) {
        const histDoc = histSnap.docs[0];
        const nieuweStatus = eventType === 'email.delivered' ? 'afgeleverd'
          : eventType === 'email.bounced' ? 'gebounced'
          : eventType === 'email.complained' ? 'spam_klacht'
          : eventType === 'email.opened' ? 'geopend'
          : eventType === 'email.clicked' ? 'geklikt'
          : null;

        if (nieuweStatus) {
          await histDoc.ref.update({
            status: nieuweStatus,
            webhook_event: eventType,
            bijgewerkt_op: new Date().toISOString(),
          });

          // Update ook de status op de bestelling zelf
          const histData = histDoc.data();
          if (histData.type === 'bevestiging') {
            await bestDoc.ref.update({ mail_bevestiging_status: nieuweStatus });
          } else if (histData.type === 'herinnering') {
            await bestDoc.ref.update({ mail_herinnering_status: nieuweStatus });
          }
        }
        break;
      }
    }

    res.status(200).send('OK');
  }
);

// ── Cloud Function 4: Gebruikersbeheer ─────────────────────────────

exports.beheerGebruiker = onRequest(
  { cors: true },
  async (req, res) => {
    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Alleen POST toegestaan' });
      return;
    }

    // Verifieer Firebase ID token en controleer admin custom claim
    const authHeader = req.headers.authorization || '';
    const idToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!idToken) {
      res.status(401).json({ error: 'Niet geautoriseerd' });
      return;
    }
    try {
      const decodedToken = await getAuth().verifyIdToken(idToken);
      if (!decodedToken.admin) {
        res.status(403).json({ error: 'Onvoldoende rechten' });
        return;
      }
    } catch (err) {
      res.status(401).json({ error: 'Ongeldig token' });
      return;
    }

    const { actie, email, password, uid } = req.body;

    try {
      if (actie === 'lijst') {
        const result = await getAuth().listUsers(1000);
        const gebruikers = result.users.map(u => ({
          uid: u.uid,
          email: u.email,
          aangemaakt_op: u.metadata.creationTime,
          laatste_login: u.metadata.lastSignInTime || null,
        }));
        res.json({ gebruikers });

      } else if (actie === 'aanmaken') {
        if (!email || !password) {
          res.status(400).json({ error: 'Email en wachtwoord zijn verplicht' });
          return;
        }
        if (password.length < 8) {
          res.status(400).json({ error: 'Wachtwoord moet minimaal 8 tekens zijn' });
          return;
        }
        const user = await getAuth().createUser({ email, password });
        await getAuth().setCustomUserClaims(user.uid, { admin: true });
        res.json({ success: true, uid: user.uid, email: user.email });

      } else if (actie === 'verwijderen') {
        if (!uid) {
          res.status(400).json({ error: 'uid is verplicht' });
          return;
        }
        await getAuth().deleteUser(uid);
        res.json({ success: true });

      } else {
        res.status(400).json({ error: 'Onbekende actie' });
      }
    } catch (err) {
      console.error('beheerGebruiker fout:', err.message);
      res.status(500).json({ error: 'Er is een fout opgetreden' });
    }
  }
);
