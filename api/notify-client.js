// Fonction serveur Vercel : prévient le client par e-mail quand le SALON (ou un admin) annule ou déplace son
// rendez-vous. L'adresse du client et les détails sont relus dans la base : la fonction n'accepte qu'un
// identifiant de réservation, elle ne peut donc pas servir à écrire à n'importe qui.
//
// Variables d'environnement Vercel (déjà utilisées ailleurs) :
//   REACT_APP_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY   lecture de la réservation et vérification des droits
//   RESEND_API_KEY, REMINDER_FROM                       envoi de l'e-mail
// Sans elles, la fonction répond 501 et le site affiche « pensez à prévenir le client ».
//   SITE_URL (facultatif)  adresse du site dans les e-mails ; par défaut https://www.rendezvous-ici.fr
//                          (jamais l'adresse du lien Preview, même quand on teste depuis celui-ci)

const DEFAULT_SITE_URL = 'https://www.rendezvous-ici.fr';

const escapeHtml = (text) => String(text)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');

// « lundi 16 novembre 2026 » à partir de « 2026-11-16 »
const dateLabel = (date) => new Intl.DateTimeFormat('fr-FR', {
  weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC'
}).format(new Date(`${date}T12:00:00Z`));

const buildEmail = ({ event, reservation, prestataire, siteUrl }) => {
  const e = escapeHtml;
  const time = String(reservation.time).slice(0, 5);
  const when = `${dateLabel(reservation.date)} à ${time}`;
  const previous = reservation.previous_slot
    ? `${dateLabel(reservation.previous_slot.date)} à ${String(reservation.previous_slot.time).slice(0, 5)}`
    : null;
  const cancelled = event === 'cancelled';
  const subject = cancelled
    ? `Votre rendez-vous chez ${prestataire.name} est annulé`
    : `Votre rendez-vous chez ${prestataire.name} est déplacé au ${when}`;
  const intro = cancelled
    ? `${prestataire.name} a dû annuler votre rendez-vous :`
    : `${prestataire.name} a déplacé votre rendez-vous${previous ? ` (prévu initialement le ${previous})` : ''}. Nouveau créneau :`;
  const outro = cancelled
    ? 'Nous sommes désolés pour ce contretemps. Vous pouvez reprendre rendez-vous à tout moment sur le site.'
    : "Si ce nouveau créneau ne vous convient pas, contactez directement le prestataire ou modifiez-le depuis « Mes réservations ».";
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; color: #111;">
      <h2 style="margin-bottom: 8px;">${cancelled ? 'Rendez-vous annulé' : 'Rendez-vous déplacé'}</h2>
      <p>Bonjour ${e(reservation.client_first_name || '')},</p>
      <p>${e(intro)}</p>
      <div style="border: 1px solid #eee; border-radius: 12px; padding: 16px; margin: 16px 0;">
        <p style="margin: 0 0 6px;"><strong>${e(reservation.service_name)}</strong></p>
        <p style="margin: 0 0 6px;">${e(prestataire.name)}${prestataire.city ? ` • ${e(prestataire.city)}` : ''}</p>
        <p style="margin: 0;">📅 ${cancelled ? `<s>${e(when)}</s>` : e(when)}</p>
      </div>
      <p>${e(outro)}</p>
      <p style="margin: 24px 0;">
        <a href="${e(siteUrl)}" style="background: #000; color: #fff; text-decoration: none; padding: 12px 22px; border-radius: 999px; display: inline-block; font-weight: bold;">Voir mes réservations</a>
      </p>
      <p>À bientôt,<br>L'équipe Rendez Vous</p>
    </div>`;
  const text = [
    `Bonjour ${reservation.client_first_name || ''},`, '', intro, '',
    `${reservation.service_name}`, `${prestataire.name}${prestataire.city ? ` • ${prestataire.city}` : ''}`,
    `${cancelled ? 'Annulé : ' : ''}${when}`, '', outro, '', `Voir mes réservations : ${siteUrl}`, '', "À bientôt,", "L'équipe Rendez Vous"
  ].join('\n');
  return { subject, html, text };
};

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }
  const url = (process.env.SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL || '')
    .trim().replace(/\/+$/, '').replace(/\/(rest|auth)\/v1$/, '');
  const serviceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
  const resendKey = (process.env.RESEND_API_KEY || '').trim();
  const from = (process.env.REMINDER_FROM || '').trim();
  if (!url || !serviceKey || !resendKey || !from) {
    return res.status(501).json({ error: 'E-mails non configurés' });
  }
  // Nouvelle clé secrète (sb_secret_…) : seulement dans apikey ; ancienne clé service_role : aussi dans Authorization
  const serviceHeaders = {
    apikey: serviceKey,
    ...(serviceKey.startsWith('eyJ') ? { Authorization: `Bearer ${serviceKey}` } : {})
  };
  const read = async (path) => {
    const response = await fetch(`${url}/rest/v1/${path}`, { headers: serviceHeaders });
    const rows = await response.json().catch(() => null);
    return response.ok && Array.isArray(rows) ? rows[0] || null : null;
  };

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const reservationId = String(body.reservationId || '').trim().slice(0, 64);
    const event = body.event === 'cancelled' || body.event === 'moved' ? body.event : null;
    if (!/^[\w-]+$/.test(reservationId) || !event) return res.status(400).json({ error: 'Demande invalide' });

    // 1. Qui appelle ?
    const token = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '');
    if (!token) return res.status(401).json({ error: 'Connexion requise' });
    const userResponse = await fetch(`${url}/auth/v1/user`, { headers: { apikey: serviceKey, Authorization: `Bearer ${token}` } });
    const caller = await userResponse.json().catch(() => ({}));
    if (!userResponse.ok || !caller.id) return res.status(401).json({ error: 'Session expirée : reconnectez-vous' });

    // 2. La réservation, son salon, et le droit d'agir (propriétaire du salon ou admin)
    const reservation = await read(`reservations?id=eq.${encodeURIComponent(reservationId)}&select=*`);
    if (!reservation) return res.status(404).json({ error: 'Réservation introuvable' });
    const prestataire = await read(`prestataires?id=eq.${reservation.prestataire_id}&select=name,city,owner_id`);
    const profile = await read(`profiles?id=eq.${encodeURIComponent(caller.id)}&select=role`);
    const allowed = (profile && profile.role === 'admin') || (prestataire && prestataire.owner_id === caller.id);
    if (!prestataire || !allowed) return res.status(403).json({ error: 'Réservé au salon et aux administrateurs' });

    // 3. L'e-mail doit correspondre à ce qui vient de se passer (pas d'envoi répété ou inventé)
    const recent = (iso) => iso && Date.now() - new Date(iso).getTime() < 10 * 60 * 1000;
    const matches = event === 'cancelled'
      ? reservation.status === 'cancelled' && reservation.cancelled_by !== 'client' && recent(reservation.cancelled_at)
      : reservation.status !== 'cancelled' && reservation.modified_by && reservation.modified_by !== 'client' && recent(reservation.modified_at);
    if (!matches) return res.status(409).json({ error: 'Aucun changement récent à signaler' });
    if (!reservation.client_email) return res.status(422).json({ error: "Pas d'adresse e-mail pour ce client" });

    // 4. Envoi immédiat
    const siteUrl = (process.env.SITE_URL || DEFAULT_SITE_URL).trim().replace(/\/+$/, '');
    const email = buildEmail({ event, reservation, prestataire, siteUrl });
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from, to: [reservation.client_email], subject: email.subject, html: email.html, text: email.text })
    });
    if (!response.ok) return res.status(502).json({ error: "L'e-mail n'a pas pu être envoyé" });
    return res.status(200).json({ sent: true });
  } catch (error) {
    console.error('Erreur e-mail client', error);
    return res.status(500).json({ error: 'Erreur interne' });
  }
};
