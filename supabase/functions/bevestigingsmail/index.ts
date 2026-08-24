// Supabase Edge Function: bevestigingsmail
// Wordt getriggerd via een database webhook op de bestellingen tabel
// Deploy: supabase functions deploy bevestigingsmail

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
const FROM_EMAIL     = Deno.env.get('FROM_EMAIL') || 'bestellingen@brodshoes.nl';

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  let payload;
  try {
    payload = await req.json();
  } catch {
    return new Response('Invalid JSON', { status: 400 });
  }

  // Supabase database webhook stuurt { type, record, old_record }
  const bestelling = payload.record;
  if (!bestelling?.email) {
    return new Response('No email in record', { status: 400 });
  }

  const regels = (bestelling.regels || [])
    .map(r => `<tr>
      <td style="padding:8px 12px;border-bottom:1px solid #ece3d6;">${r.label}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #ece3d6;text-align:center;">${r.qty}×</td>
      <td style="padding:8px 12px;border-bottom:1px solid #ece3d6;text-align:right;">€ ${r.subtotaal.toFixed(2).replace('.', ',')}</td>
    </tr>`).join('');

  const html = `<!DOCTYPE html>
<html lang="nl">
<head><meta charset="UTF-8" /></head>
<body style="font-family:'Georgia',serif;background:#e8dcc8;margin:0;padding:32px 20px;">
  <div style="max-width:560px;margin:0 auto;background:#1e3a3f;color:#fff;">
    <div style="padding:36px 40px;text-align:center;border-bottom:1px solid rgba(255,255,255,0.1)">
      <div style="font-size:11px;letter-spacing:3px;text-transform:uppercase;color:rgba(255,255,255,0.5);margin-bottom:10px;">Brodshoes · Rijssen</div>
      <div style="font-family:Georgia,serif;font-size:32px;font-weight:700;">Bedankt voor uw bestelling!</div>
      <div style="width:1px;height:24px;background:rgba(255,255,255,0.15);margin:16px auto;"></div>
      <div style="font-size:14px;color:rgba(255,255,255,0.7);">Geachte ${bestelling.voornaam} ${bestelling.achternaam},<br>uw bestelling is ontvangen en in behandeling.</div>
    </div>

    <div style="padding:32px 40px;">
      <table style="width:100%;border-collapse:collapse;background:rgba(255,255,255,0.05);">
        <thead>
          <tr style="border-bottom:1px solid rgba(255,255,255,0.15)">
            <th style="padding:10px 12px;text-align:left;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:rgba(255,255,255,0.5)">Product</th>
            <th style="padding:10px 12px;text-align:center;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:rgba(255,255,255,0.5)">Aantal</th>
            <th style="padding:10px 12px;text-align:right;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:rgba(255,255,255,0.5)">Bedrag</th>
          </tr>
        </thead>
        <tbody style="color:rgba(255,255,255,0.85)">
          ${regels}
        </tbody>
        <tfoot>
          <tr>
            <td colspan="2" style="padding:12px;font-weight:700;font-size:14px;letter-spacing:1px;text-transform:uppercase;color:rgba(255,255,255,0.6)">Totaal</td>
            <td style="padding:12px;text-align:right;font-family:Georgia,serif;font-size:22px;font-weight:700;color:#fff">€ ${parseFloat(bestelling.totaal).toFixed(2).replace('.', ',')}</td>
          </tr>
        </tfoot>
      </table>

      <div style="margin-top:24px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);padding:18px 20px;font-size:14px;color:rgba(255,255,255,0.8);line-height:1.8;">
        <strong style="color:#fff">Afhaalmoment:</strong> ${bestelling.tijdslot || '–'}<br>
        <strong style="color:#fff">Adres:</strong> ${bestelling.adres || '–'}
        ${bestelling.opmerking ? `<br><strong style="color:#e85d4a">Opmerking:</strong> ${bestelling.opmerking}` : ''}
      </div>
    </div>

    <div style="padding:20px 40px;text-align:center;border-top:1px solid rgba(255,255,255,0.1);font-size:11px;color:rgba(255,255,255,0.4);letter-spacing:1px;text-transform:uppercase;">
      Brodshoes · Rijssen · brodshoes.nl
    </div>
  </div>
</body>
</html>`;

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: FROM_EMAIL,
      to:   bestelling.email,
      subject: `Bevestiging uw bestelling – Brodshoes`,
      html,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    return new Response(`Resend error: ${err}`, { status: 500 });
  }

  return new Response(JSON.stringify({ ok: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
