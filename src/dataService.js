// Échanges avec la base de données Supabase : lecture des données, connexion et actions.
// Les règles de sécurité (qui peut lire / modifier quoi) sont appliquées par la base (RLS),
// voir supabase/migrations/. Les colonnes SQL (snake_case) sont converties au format du site (camelCase).
import { supabase } from './supabaseClient';

// Lève une erreur lisible si Supabase renvoie une erreur
const must = ({ data, error }) => {
  if (error) throw new Error(error.message || 'Erreur de connexion à la base de données');
  return data;
};

// ----- Conversion base -> site -----
export const toPrestataire = (row) => ({
  id: row.id,
  ownerId: row.owner_id,
  name: row.name,
  city: row.city,
  category: row.category,
  email: row.email || '',
  approved: row.approved,
  emailVerified: row.approved,
  services: (row.services || []).map(s => ({ ...s, photos: s.photos || [] })),
  schedule: row.schedule || {},
  photos: row.photos || [],
  blockedHours: row.blocked_hours || [],
  reservations: []
});

const toPrice = (price) => (price ? { min: Number(price.min), max: Number(price.max) } : null);

export const toReservation = (row) => ({
  id: row.id,
  prestataireId: row.prestataire_id,
  clientId: row.client_id,
  clientName: row.client_name,
  clientFirstName: row.client_first_name,
  clientEmail: row.client_email,
  clientPhone: row.client_phone,
  serviceId: row.service_id,
  serviceName: row.service_name,
  date: row.date,
  time: row.time,
  paymentMethod: row.payment_method,
  status: row.status,
  price: toPrice(row.price),
  finalPrice: toPrice(row.final_price),
  promo: row.promo ? { ...row.promo, value: Number(row.promo.value) } : null,
  reminderEmailId: row.reminder_email_id,
  modifiedAt: row.modified_at,
  previousSlot: row.previous_slot,
  cancelledAt: row.cancelled_at,
  cancelledBy: row.cancelled_by
});

export const toPromo = (row) => ({
  id: row.id,
  code: row.code,
  kind: row.kind,
  prestataireId: row.prestataire_id,
  clientId: row.client_id,
  type: row.type,
  value: Number(row.value),
  serviceIds: row.service_ids || [],
  startDate: row.start_date || '',
  endDate: row.end_date || '',
  maxUses: row.max_uses,
  onePerClient: row.one_per_client,
  usedCount: row.used_count,
  usedBy: row.used_by || [],
  status: row.status,
  createdAt: row.created_at
});

export const toProfile = (row) => ({
  id: row.id,
  role: row.role,
  email: row.email,
  firstName: row.first_name,
  lastName: row.last_name,
  phone: row.phone,
  referralCode: row.referral_code,
  referredBy: row.referred_by,
  sponsorRewarded: row.sponsor_rewarded,
  createdAt: row.created_at
});

// ----- Lecture -----
// Charge tout ce que l'utilisateur a le droit de voir (la base filtre selon le compte connecté)
export const loadAll = async (signedIn) => {
  const [prestataireRows, settingsRow, reservationRows, promoRows, profileRows] = await Promise.all([
    supabase.from('prestataires').select('*').order('id').then(must),
    supabase.from('settings').select('referral').eq('id', 1).maybeSingle().then(must),
    signedIn ? supabase.from('reservations').select('*').order('date').then(must) : Promise.resolve([]),
    signedIn ? supabase.from('promo_codes').select('*').order('created_at').then(must) : Promise.resolve([]),
    signedIn ? supabase.from('profiles').select('*').order('created_at').then(must) : Promise.resolve([])
  ]);
  const reservations = reservationRows.map(toReservation);
  const prestataires = prestataireRows.map(row => {
    const p = toPrestataire(row);
    p.reservations = reservations.filter(r => r.prestataireId === p.id);
    return p;
  });
  return {
    prestataires,
    settings: settingsRow ? { referral: settingsRow.referral } : null,
    promoCodes: promoRows.map(toPromo),
    profiles: profileRows.map(toProfile)
  };
};

// Créneaux déjà pris chez un prestataire (sans information sur les autres clients)
export const fetchBookedSlots = async (prestataireId) =>
  must(await supabase.rpc('booked_slots', { p_prestataire_id: prestataireId }))
    .map(s => ({ date: s.date, time: s.time }));

// ----- Connexion -----
export const getSession = async () => must(await supabase.auth.getSession()).session;

export const getProfile = async (userId) =>
  toProfile(must(await supabase.from('profiles').select('*').eq('id', userId).single()));

export const signIn = async (email, password) => {
  const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password });
  if (error) {
    if (/not confirmed/i.test(error.message)) return { error: 'not-confirmed' };
    const status = must(await supabase.rpc('email_status', { p_email: email }));
    return { error: status === 'unknown' ? 'unknown-email' : 'wrong-password' };
  }
  return { session: data.session };
};

// Inscription ; renvoie { session } (connecté) ou { needsConfirmation: true } (e-mail de confirmation envoyé)
export const signUp = async (email, password, metadata) => {
  const { data, error } = await supabase.auth.signUp({
    email: email.trim().toLowerCase(),
    password,
    options: { data: metadata, emailRedirectTo: window.location.origin }
  });
  if (error) {
    if (/already registered|already exists/i.test(error.message)) throw new Error('Un compte existe déjà avec cet email');
    if (/password/i.test(error.message)) throw new Error('Le mot de passe doit contenir au moins 6 caractères');
    throw new Error(error.message);
  }
  return data.session ? { session: data.session } : { needsConfirmation: true };
};

export const signOut = async () => { await supabase.auth.signOut(); };

export const sendPasswordReset = async (email) => {
  const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
    redirectTo: window.location.origin
  });
  if (error && !/rate limit/i.test(error.message)) throw new Error(error.message);
  if (error) throw new Error("Trop de demandes : réessayez dans quelques minutes.");
};

export const updatePassword = async (password) => {
  const { error } = await supabase.auth.updateUser({ password });
  if (error) throw new Error(/password/i.test(error.message) ? 'Le mot de passe doit contenir au moins 6 caractères' : error.message);
};

export const referralCodeExists = async (code) =>
  must(await supabase.rpc('referral_code_exists', { p_code: code }));

// ----- Prestataires -----
export const savePrestataire = async (p) => must(await supabase.from('prestataires').update({
  name: p.name,
  city: p.city,
  category: p.category,
  email: p.email,
  services: p.services,
  schedule: p.schedule,
  photos: p.photos || [],
  blocked_hours: p.blockedHours || []
}).eq('id', p.id));

export const setPrestataireApproved = async (id, approved) =>
  must(await supabase.from('prestataires').update({ approved }).eq('id', id));

export const deletePrestataire = async (id) =>
  must(await supabase.from('prestataires').delete().eq('id', id));

export const updateProfile = async (id, fields) => must(await supabase.from('profiles').update({
  first_name: fields.firstName,
  last_name: fields.lastName,
  phone: fields.phone
}).eq('id', id));

// ----- Réservations (vérifiées par la base : créneau, prix, code promo, délai de 24 h) -----
export const bookReservation = async ({ prestataireId, serviceId, date, time, client, promoCode }) =>
  toReservation(must(await supabase.rpc('book_reservation', {
    p_prestataire_id: prestataireId,
    p_service_id: serviceId,
    p_date: date,
    p_time: time,
    p_client_name: client.clientName,
    p_client_first_name: client.clientFirstName,
    p_client_email: client.clientEmail,
    p_client_phone: client.clientPhone,
    p_promo_code: promoCode || null
  })));

export const cancelReservation = async (id) =>
  must(await supabase.rpc('cancel_reservation', { p_id: id }));

export const moveReservation = async (id, date, time) =>
  must(await supabase.rpc('move_reservation', { p_id: id, p_date: date, p_time: time }));

export const setReservationReminder = async (id, emailId) =>
  must(await supabase.rpc('set_reservation_reminder', { p_id: id, p_email_id: emailId }));

// ----- Codes promo et parrainage -----
export const checkPromo = async (code, prestataireId, serviceId) =>
  must(await supabase.rpc('check_promo', { p_code: code, p_prestataire_id: prestataireId, p_service_id: serviceId }));

export const createPromo = async (fields) => {
  const { error } = await supabase.from('promo_codes').insert({
    code: fields.code,
    prestataire_id: fields.prestataireId,
    type: fields.type,
    value: fields.value,
    service_ids: fields.serviceIds,
    start_date: fields.startDate || null,
    end_date: fields.endDate || null,
    max_uses: fields.maxUses,
    one_per_client: fields.onePerClient,
    status: fields.status
  });
  if (error) {
    if (/duplicate|unique/i.test(error.message)) throw new Error('Ce code existe déjà, choisissez-en un autre');
    throw new Error(error.message);
  }
};

export const updatePromoStatus = async (id, status) =>
  must(await supabase.from('promo_codes').update({ status }).eq('id', id));

export const deletePromo = async (id) =>
  must(await supabase.from('promo_codes').delete().eq('id', id));

export const updateReferralSettings = async (referral) =>
  must(await supabase.from('settings').update({ referral }).eq('id', 1));

// ----- Comptes créés / supprimés par l'admin (fonction serveur api/admin-users.js) -----
export const adminUsers = async (action, payload) => {
  const session = await getSession();
  let response;
  try {
    response = await fetch('/api/admin-users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session ? session.access_token : ''}`
      },
      body: JSON.stringify({ action, ...payload })
    });
  } catch (e) {
    throw new Error('Service indisponible : vérifiez votre connexion internet');
  }
  const result = await response.json().catch(() => ({}));
  if (response.status === 501 || response.status === 404) {
    throw new Error("Gestion des comptes indisponible : ajoutez la clé SUPABASE_SERVICE_ROLE_KEY dans Vercel");
  }
  if (!response.ok) throw new Error(result.error || 'Opération impossible');
  return result;
};
