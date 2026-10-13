// Fonction serveur Vercel : programme (ou annule) l'e-mail de rappel envoyé 24 h avant un rendez-vous.
//
// L'envoi est confié à Resend (https://resend.com), qui sait programmer un e-mail jusqu'à 30 jours
// à l'avance : aucune base de données ni tâche planifiée n'est nécessaire.
//
// Variables d'environnement à définir dans Vercel (Settings → Environment Variables) :
//   RESEND_API_KEY  clé API Resend (secrète, jamais dans le code)
//   REMINDER_FROM   expéditeur, sur un domaine vérifié chez Resend, ex. "Rendez Vous <rappels@mondomaine.fr>"
// Sans ces variables, la fonction répond 501 et le site continue sans e-mail de rappel.

const RESEND_URL = 'https://api.resend.com/emails';
const MAX_SCHEDULE_DAYS = 30; // limite de programmation chez Resend

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const TIME_PATTERN = /^\d{2}:\d{2}$/;

const clean = (value, maxLength) => String(value || '').trim().slice(0, maxLength);

const escapeHtml = (text) => String(text)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;');

const buildEmail = ({ firstName, prestataireName, prestataireCity, serviceName, dateLabel, time }) => {
  const e = escapeHtml;
  const subject = `Rappel : votre rendez-vous demain à ${time} chez ${prestataireName}`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; color: #111;">
      <h2 style="margin-bottom: 8px;">Rappel de rendez-vous</h2>
      <p>Bonjour ${e(firstName || '')},</p>
      <p>Nous vous rappelons votre rendez-vous de demain :</p>
      <div style="border: 1px solid #eee; border-radius: 12px; padding: 16px; margin: 16px 0;">
        <p style="margin: 0 0 6px;"><strong>${e(serviceName)}</strong></p>
        <p style="margin: 0 0 6px;">${e(prestataireName)}${prestataireCity ? ` • ${e(prestataireCity)}` : ''}</p>
        <p style="margin: 0;">📅 ${e(dateLabel)} à ${e(time)}</p>
      </div>
      <p>Pour modifier ou annuler, contactez directement le prestataire.</p>
      <p style="color: #666; font-size: 13px;">À bientôt sur Rendez Vous.</p>
    </div>`;
  const text = `Bonjour ${firstName || ''},\n\nRappel de votre rendez-vous de demain :\n`
    + `${serviceName} chez ${prestataireName}${prestataireCity ? ` (${prestataireCity})` : ''}\n`
    + `${dateLabel} à ${time}\n\nPour modifier ou annuler, contactez directement le prestataire.\n\nRendez Vous`;
  return { subject: subject.slice(0, 200), html, text };
};

const resend = (path, method, apiKey, body) => fetch(`${RESEND_URL}${path}`, {
  method,
  headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
  body: body ? JSON.stringify(body) : undefined
});

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.REMINDER_FROM;
  if (!apiKey || !from) {
    return res.status(501).json({ error: 'Rappels par e-mail non configurés' });
  }

  const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});

  try {
    if (body.action === 'cancel') {
      const id = clean(body.id, 100);
      if (!/^[\w-]+$/.test(id)) return res.status(400).json({ error: 'Identifiant invalide' });
      const response = await resend(`/${id}/cancel`, 'POST', apiKey);
      return res.status(response.ok ? 200 : 502).json({ cancelled: response.ok });
    }

    if (body.action === 'schedule') {
      const to = clean(body.to, 254).toLowerCase();
      const date = clean(body.date, 10);
      const time = clean(body.time, 5);
      const remindAt = new Date(body.remindAt);
      if (!EMAIL_PATTERN.test(to) || !DATE_PATTERN.test(date) || !TIME_PATTERN.test(time)) {
        return res.status(400).json({ error: 'Données de réservation invalides' });
      }
      const delay = remindAt.getTime() - Date.now();
      if (Number.isNaN(delay) || delay <= 0) {
        return res.status(422).json({ error: 'Rendez-vous trop proche pour programmer un rappel' });
      }
      if (delay > MAX_SCHEDULE_DAYS * 24 * 60 * 60 * 1000) {
        return res.status(422).json({ error: `Rappel au-delà de ${MAX_SCHEDULE_DAYS} jours non programmable` });
      }

      const email = buildEmail({
        firstName: clean(body.firstName, 60),
        prestataireName: clean(body.prestataireName, 100),
        prestataireCity: clean(body.prestataireCity, 60),
        serviceName: clean(body.serviceName, 100),
        dateLabel: clean(body.dateLabel, 60) || date,
        time
      });
      const response = await resend('', 'POST', apiKey, {
        from,
        to: [to],
        subject: email.subject,
        html: email.html,
        text: email.text,
        scheduled_at: remindAt.toISOString()
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.id) {
        return res.status(502).json({ error: "L'e-mail de rappel n'a pas pu être programmé" });
      }
      return res.status(200).json({ id: result.id, scheduledAt: remindAt.toISOString() });
    }

    return res.status(400).json({ error: 'Action inconnue' });
  } catch (error) {
    console.error('Erreur rappel e-mail', error);
    return res.status(500).json({ error: 'Erreur interne' });
  }
};
