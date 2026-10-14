// Fonction serveur Vercel : création et suppression de comptes par un administrateur.
//
// Créer un compte avec mot de passe ou supprimer un compte demande la clé secrète « service_role »
// de Supabase, qui ne doit jamais être envoyée au navigateur : elle reste ici, côté serveur.
//
// Variables d'environnement Vercel :
//   REACT_APP_SUPABASE_URL      adresse du projet Supabase (déjà utilisée par le site)
//   SUPABASE_SERVICE_ROLE_KEY   clé secrète « service_role » (type Secret dans Vercel)
// Sans la clé secrète, la fonction répond 501 et le site affiche un message.

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CATEGORIES = ['Beauté', 'Artisans'];

const clean = (value, maxLength) => String(value || '').trim().slice(0, maxLength);

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  const url = (process.env.SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL || '')
    .trim().replace(/\/+$/, '').replace(/\/(rest|auth)\/v1$/, '');
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    return res.status(501).json({ error: 'Gestion des comptes non configurée (clé SUPABASE_SERVICE_ROLE_KEY manquante)' });
  }

  const service = (path, method = 'GET', body) => fetch(`${url}${path}`, {
    method,
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation'
    },
    body: body ? JSON.stringify(body) : undefined
  });

  try {
    // 1. Qui appelle ? Le jeton de session doit appartenir à un administrateur.
    const token = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '');
    if (!token) return res.status(401).json({ error: 'Connexion requise' });
    const userResponse = await fetch(`${url}/auth/v1/user`, {
      headers: { apikey: serviceKey, Authorization: `Bearer ${token}` }
    });
    const caller = await userResponse.json().catch(() => ({}));
    if (!userResponse.ok || !caller.id) return res.status(401).json({ error: 'Session expirée : reconnectez-vous' });
    const profileResponse = await service(`/rest/v1/profiles?id=eq.${encodeURIComponent(caller.id)}&select=role`);
    const profiles = await profileResponse.json().catch(() => []);
    if (!Array.isArray(profiles) || !profiles[0] || profiles[0].role !== 'admin') {
      return res.status(403).json({ error: 'Réservé aux administrateurs' });
    }

    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});

    // 2. Action demandée
    if (body.action === 'create_client' || body.action === 'create_prestataire') {
      const isPrestataire = body.action === 'create_prestataire';
      const email = clean(body.email, 254).toLowerCase();
      const password = String(body.password || '');
      if (!EMAIL_PATTERN.test(email)) return res.status(400).json({ error: 'Adresse e-mail invalide' });
      if (password.length < 6) return res.status(400).json({ error: 'Le mot de passe doit contenir au moins 6 caractères' });

      const metadata = isPrestataire
        ? {
            role: 'prestataire',
            name: clean(body.name, 100),
            city: clean(body.city, 80),
            category: CATEGORIES.includes(body.category) ? body.category : 'Beauté'
          }
        : {
            role: 'client',
            first_name: clean(body.firstName, 60),
            last_name: clean(body.lastName, 60),
            phone: clean(body.phone, 30)
          };
      if (isPrestataire && (!metadata.name || !metadata.city)) return res.status(400).json({ error: 'Remplissez tous les champs' });
      if (!isPrestataire && (!metadata.first_name || !metadata.last_name || !metadata.phone)) {
        return res.status(400).json({ error: 'Remplissez tous les champs' });
      }

      // Compte créé avec l'adresse déjà confirmée ; le profil (et le salon) sont créés par la base
      const createResponse = await service('/auth/v1/admin/users', 'POST', {
        email, password, email_confirm: true, user_metadata: metadata
      });
      const created = await createResponse.json().catch(() => ({}));
      if (!createResponse.ok || !created.id) {
        const message = String(created.msg || created.message || created.error_description || '');
        if (/already|exists|registered/i.test(message)) return res.status(409).json({ error: 'Un compte existe déjà avec cet email' });
        return res.status(502).json({ error: 'Création du compte impossible' });
      }
      if (isPrestataire) {
        // Prestataire créé par l'admin : directement approuvé
        await service(`/rest/v1/prestataires?owner_id=eq.${created.id}`, 'PATCH', { approved: true });
      }
      return res.status(200).json({ id: created.id });
    }

    if (body.action === 'delete_user') {
      const userId = clean(body.userId, 64);
      if (!/^[0-9a-f-]{36}$/i.test(userId)) return res.status(400).json({ error: 'Identifiant invalide' });
      if (userId === caller.id) return res.status(400).json({ error: 'Vous ne pouvez pas supprimer votre propre compte' });
      const deleteResponse = await service(`/auth/v1/admin/users/${userId}`, 'DELETE');
      if (!deleteResponse.ok && deleteResponse.status !== 404) return res.status(502).json({ error: 'Suppression impossible' });
      return res.status(200).json({ deleted: true });
    }

    return res.status(400).json({ error: 'Action inconnue' });
  } catch (error) {
    console.error('Erreur gestion des comptes', error);
    return res.status(500).json({ error: 'Erreur interne' });
  }
};
