import React, { useState, useEffect, useRef } from 'react';

// Logo servi comme fichier statique (public/logo-rendez-vous.jpg), mis en cache par le navigateur
const LOGO_SRC = `${process.env.PUBLIC_URL}/logo-rendez-vous.jpg`;

const STORAGE_KEY = 'rendez_v6_prestataires';

// Styles globaux : survols, focus et typographie (impossible en style inline)
const GLOBAL_CSS = `
  .rv-app { font-family: 'Nunito', 'Segoe UI', Arial, sans-serif; color: #111; background: #fff; min-height: 100vh; }
  .rv-app h1, .rv-app h2, .rv-app h3, .rv-app h4 { font-weight: 800; letter-spacing: -0.01em; margin-bottom: 10px; }
  .rv-app p { line-height: 1.5; margin-bottom: 4px; }
  .rv-app label { font-size: 14px; font-weight: 600; color: #333; }
  .rv-app button, .rv-app input, .rv-app select { font-family: inherit; }
  /* annule la marge de 10px imposée à tous les boutons par index.css */
  .rv-app button { margin: 0; transition: transform 0.15s ease, box-shadow 0.15s ease; }
  .rv-app button:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15); }
  .rv-app button:active:not(:disabled) { transform: translateY(0); box-shadow: none; }
  .rv-app input, .rv-app select { transition: border-color 0.2s ease, box-shadow 0.2s ease; }
  .rv-app input:focus, .rv-app select:focus { outline: none; border-color: #000 !important; box-shadow: 0 0 0 3px rgba(0, 0, 0, 0.12); }
  .rv-app input[type=checkbox], .rv-app input[type=radio] { accent-color: #000; width: 16px; height: 16px; vertical-align: middle; }
  .rv-toast { animation: rv-toast-in 0.2s ease-out; }
  @keyframes rv-toast-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
  .rv-card-hover { transition: transform 0.2s ease, box-shadow 0.2s ease; }
  .rv-card-hover:hover { transform: translateY(-3px); box-shadow: 0 12px 28px rgba(0, 0, 0, 0.10) !important; }
  @media (max-width: 768px) {
    .rv-app h1 { font-size: 24px !important; }
    .rv-app h2 { font-size: 20px !important; }
    .rv-app h3 { font-size: 16px !important; }
    .rv-app h4 { font-size: 14px !important; }
    .rv-app p { font-size: 14px !important; }
    .rv-app label { font-size: 13px !important; }
  }
  @media (max-width: 480px) {
    .rv-app h1 { font-size: 21px !important; }
    .rv-app h2 { font-size: 18px !important; }
    .rv-app h3 { font-size: 15px !important; }
    .rv-app h4 { font-size: 13px !important; }
    .rv-app p, .rv-app button { font-size: 13px !important; }
  }
`;

const SAMPLE_DATA = [
  {
    id: 1,
    name: 'Salon Élégance',
    city: 'Paris',
    email: 'elegance@salon.fr',
    password: 'pass123',
    category: 'Beauté',
    approved: true,
    emailVerified: true,
    services: [
      { id: 101, name: 'Coupe Femme', minPrice: 45, maxPrice: 45, photos: [] },
      { id: 102, name: 'Coloration', minPrice: 70, maxPrice: 90, photos: [] },
    ],
    schedule: {
      monday: [{ start: '09:00', end: '12:00' }, { start: '14:00', end: '18:00' }],
      tuesday: [{ start: '09:00', end: '18:00' }]
    },
    blockedHours: [],
    reservations: [],
    photos: [],
  },
  {
    id: 2,
    name: 'Studio Artisan',
    city: 'Lyon',
    email: 'artisan@studio.fr',
    password: 'pass123',
    category: 'Artisans',
    approved: true,
    emailVerified: true,
    services: [
      { id: 201, name: 'Coaching Personnel', minPrice: 50, maxPrice: 100, photos: [] },
    ],
    schedule: {},
    blockedHours: [],
    reservations: [],
    photos: [],
  }
];

const CLIENTS_STORAGE_KEY = 'rendez_v6_clients';

// Comptes administrateurs : ils se connectent via « Connexion Prestataire ».
// Ajoutez une ligne par administrateur.
const ADMIN_ACCOUNTS = [
  { email: 'admin123', password: 'admin123' }
];

const DAYS = [
  { key: 'monday', label: 'Lundi' },
  { key: 'tuesday', label: 'Mardi' },
  { key: 'wednesday', label: 'Mercredi' },
  { key: 'thursday', label: 'Jeudi' },
  { key: 'friday', label: 'Vendredi' },
  { key: 'saturday', label: 'Samedi' },
  { key: 'sunday', label: 'Dimanche' }
];

// Horaires par défaut : chaque jour contient une liste de plages { start, end }
const DEFAULT_SCHEDULE = {
  monday: [{ start: '09:00', end: '18:00' }],
  tuesday: [{ start: '09:00', end: '18:00' }],
  wednesday: [{ start: '09:00', end: '18:00' }],
  thursday: [{ start: '09:00', end: '18:00' }],
  friday: [{ start: '09:00', end: '18:00' }],
  saturday: [{ start: '10:00', end: '17:00' }],
  sunday: []
};

const toMinutes = (time) => {
  const [h, m] = String(time).split(':').map(Number);
  return h * 60 + (m || 0);
};

const fromMinutes = (minutes) =>
  `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;

// "9:00" et "09:00" désignent la même heure
const normalizeTime = (time) => (time ? fromMinutes(toMinutes(time)) : '');

// Convertit les anciens formats ({ start, end } par jour) en listes de plages
const normalizeSchedule = (schedule) => {
  const result = {};
  DAYS.forEach(({ key }) => {
    const value = schedule?.[key];
    const slots = Array.isArray(value) ? value : value ? [value] : [];
    result[key] = slots
      .filter(slot => slot && slot.start && slot.end)
      .map(slot => ({ start: slot.start, end: slot.end }));
  });
  return result;
};

const hasAnySlot = (schedule) => DAYS.some(({ key }) => (schedule?.[key] || []).length > 0);

const formatDaySlots = (slots) =>
  slots && slots.length > 0 ? slots.map(slot => `${slot.start} - ${slot.end}`).join(', ') : 'Fermé';

// Vérifie les plages saisies ; renvoie un message d'erreur ou null
const validateSchedule = (schedule) => {
  for (const { key, label } of DAYS) {
    const slots = schedule[key] || [];
    if (slots.some(slot => !slot.start || !slot.end)) {
      return `${label} : renseignez le début et la fin de chaque plage (ou supprimez-la)`;
    }
    if (slots.some(slot => toMinutes(slot.start) >= toMinutes(slot.end))) {
      return `${label} : l'heure de fin doit être après l'heure de début`;
    }
    const sorted = [...slots].sort((a, b) => toMinutes(a.start) - toMinutes(b.start));
    for (let i = 1; i < sorted.length; i++) {
      if (toMinutes(sorted[i].start) < toMinutes(sorted[i - 1].end)) {
        return `${label} : les plages ${formatDaySlots([sorted[i - 1]])} et ${formatDaySlots([sorted[i]])} se chevauchent`;
      }
    }
  }
  return null;
};

// Jour de la semaine d'une date "AAAA-MM-JJ" (calculé en heure locale)
const dayKeyFromDate = (dateStr) => {
  const [y, m, d] = dateStr.split('-').map(Number);
  const index = new Date(y, m - 1, d).getDay(); // 0 = dimanche
  return DAYS[(index + 6) % 7].key;
};

const toDateString = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

const todayString = () => toDateString(new Date());

const addDays = (dateStr, days) => {
  const [y, m, d] = dateStr.split('-').map(Number);
  return toDateString(new Date(y, m - 1, d + days));
};

// Date et heure locales d'un rendez-vous ("AAAA-MM-JJ" + "HH:MM")
const appointmentDate = (date, time) => {
  const [y, m, d] = date.split('-').map(Number);
  const minutes = toMinutes(time || '00:00');
  return new Date(y, m - 1, d, Math.floor(minutes / 60), minutes % 60);
};

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

// Délai minimum avant le rendez-vous pour que le client puisse le modifier ou l'annuler
const CHANGE_DEADLINE_HOURS = 24;

// "mardi 20 octobre"
const formatDateLong = (dateStr) => {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
};

// Comparaison sans accents ni majuscules ("Épilation" ~ "epilation")
const normalizeText = (text) =>
  String(text || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

const isActiveReservation = (r) => r.status !== 'cancelled';

// Fichier agenda (.ics) avec une alarme 24 h avant : le téléphone du client fait le rappel
const buildIcs = (reservation, prestataire) => {
  const start = appointmentDate(reservation.date, reservation.time);
  const end = new Date(start.getTime() + HOUR_MS);
  const pad = (n) => String(n).padStart(2, '0');
  const local = (d) => `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`;
  const now = new Date();
  const utc = `${now.getUTCFullYear()}${pad(now.getUTCMonth() + 1)}${pad(now.getUTCDate())}T${pad(now.getUTCHours())}${pad(now.getUTCMinutes())}${pad(now.getUTCSeconds())}Z`;
  const escape = (text) => String(text || '').replace(/[\\;,]/g, (c) => `\\${c}`).replace(/\n/g, '\\n');
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Rendez Vous//Reservation//FR',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${reservation.id}@rendez-vous`,
    `DTSTAMP:${utc}`,
    `DTSTART:${local(start)}`,
    `DTEND:${local(end)}`,
    `SUMMARY:${escape(`${reservation.serviceName} - ${prestataire.name}`)}`,
    `LOCATION:${escape(`${prestataire.name}, ${prestataire.city}`)}`,
    `DESCRIPTION:${escape(`Rendez-vous réservé sur Rendez Vous.\nContact du prestataire : ${prestataire.email || ''}`)}`,
    'BEGIN:VALARM',
    'ACTION:DISPLAY',
    `DESCRIPTION:${escape(`Rappel : ${reservation.serviceName} demain chez ${prestataire.name}`)}`,
    'TRIGGER:-PT24H',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');
};

const downloadIcs = (reservation, prestataire) => {
  const blob = new Blob([buildIcs(reservation, prestataire)], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `rendez-vous-${reservation.date}.ics`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

// Rappel par e-mail 24 h avant : fonction serveur Vercel (api/reminders.js) qui programme
// l'envoi chez Resend. Si elle n'est pas configurée (ou en local), le site continue sans e-mail.
const callReminderApi = async (body) => {
  try {
    const response = await fetch('/api/reminders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    if (!response.ok) return null;
    return await response.json();
  } catch (e) {
    return null;
  }
};

// Heures de rendez-vous proposées (toutes les heures) pour une date donnée
const getTimeOptions = (schedule, dateStr) => {
  if (!dateStr) return [];
  // Prestataire sans horaires renseignés : créneaux par défaut de 8h à 19h
  if (!hasAnySlot(schedule)) {
    return Array.from({ length: 12 }, (_, i) => fromMinutes((8 + i) * 60));
  }
  const options = [];
  (schedule[dayKeyFromDate(dateStr)] || [])
    .slice()
    .sort((a, b) => toMinutes(a.start) - toMinutes(b.start))
    .forEach(slot => {
      for (let t = toMinutes(slot.start); t + 60 <= toMinutes(slot.end); t += 60) {
        options.push(fromMinutes(t));
      }
    });
  return options;
};

// Complète les champs manquants pour éviter les plantages sur d'anciennes données
const normalizePrestataire = (p) => ({
  ...p,
  services: (p.services || []).map(s => ({ ...s, photos: s.photos || [] })),
  reservations: p.reservations || [],
  blockedHours: p.blockedHours || [],
  photos: p.photos || [],
  schedule: normalizeSchedule(p.schedule)
});

const PROMOS_STORAGE_KEY = 'rendez_v6_promos';
const SETTINGS_STORAGE_KEY = 'rendez_v6_settings';

// Réglages de la plateforme modifiables par l'admin
const DEFAULT_SETTINGS = {
  referral: {
    enabled: false,
    refereeReward: { type: 'percent', value: 10 }, // offert au filleul (nouveau client)
    sponsorReward: { type: 'percent', value: 10 }  // offert au parrain après la 1re réservation du filleul
  }
};

const readStorage = (key) => {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : null;
  } catch (e) {
    console.error(`Données locales illisibles (${key}), réinitialisation`, e);
    return null;
  }
};

const writeStorage = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error(`Sauvegarde locale impossible (${key})`, e);
  }
};

const randomSuffix = (length) => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // sans 0/O ni 1/I, faciles à confondre
  let result = '';
  for (let i = 0; i < length; i++) result += chars[Math.floor(Math.random() * chars.length)];
  return result;
};

const makeReferralCode = (firstName) => {
  const base = String(firstName || '')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toUpperCase().replace(/[^A-Z]/g, '').slice(0, 6);
  return `${base || 'CLIENT'}-${randomSuffix(4)}`;
};

const normalizeCode = (code) => String(code || '').trim().toUpperCase().replace(/\s+/g, '');

const round2 = (n) => Math.round(n * 100) / 100;

const formatEuros = (n) =>
  `${Number.isInteger(n) ? n : n.toFixed(2).replace('.', ',')}€`;

const formatPriceRange = (min, max) =>
  min === max ? formatEuros(min) : `${formatEuros(min)} - ${formatEuros(max)}`;

const applyDiscount = (price, promo) => {
  if (!promo) return price;
  if (promo.type === 'percent') return round2(price * (1 - promo.value / 100));
  return Math.max(0, round2(price - promo.value));
};

const describeDiscount = (promo) =>
  promo.type === 'percent' ? `-${promo.value} %` : `-${formatEuros(promo.value)}`;

// Vérifie le montant d'une réduction saisie ; renvoie un message d'erreur ou null
const validateDiscount = (type, value) => {
  const v = parseFloat(value);
  if (Number.isNaN(v) || v <= 0) return 'La réduction doit être un nombre positif';
  if (type === 'percent' && v > 100) return 'Un pourcentage ne peut pas dépasser 100 %';
  return null;
};

const loadClients = () => {
  const parsed = readStorage(CLIENTS_STORAGE_KEY);
  if (!Array.isArray(parsed)) return [];
  // Chaque client possède un code de parrainage personnel
  return parsed.map(c => (c.referralCode ? c : { ...c, referralCode: makeReferralCode(c.firstName) }));
};

const loadPromoCodes = () => {
  const parsed = readStorage(PROMOS_STORAGE_KEY);
  return Array.isArray(parsed) ? parsed : [];
};

const loadSettings = () => {
  const parsed = readStorage(SETTINGS_STORAGE_KEY);
  if (!parsed || typeof parsed !== 'object') return DEFAULT_SETTINGS;
  return {
    ...DEFAULT_SETTINGS,
    ...parsed,
    referral: { ...DEFAULT_SETTINGS.referral, ...(parsed.referral || {}) }
  };
};

const EMPTY_PROMO_FORM = {
  code: '', type: 'percent', value: '', serviceIds: [],
  startDate: '', endDate: '', maxUses: '', onePerClient: false
};

const EMPTY_CLIENT_REGISTRATION = { lastName: '', firstName: '', email: '', phone: '', password: '', referralCode: '' };

const loadPrestataires = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return parsed.map(normalizePrestataire);
    }
  } catch (e) {
    console.error('Données locales illisibles, réinitialisation', e);
  }
  return SAMPLE_DATA.map(normalizePrestataire);
};

// Valide les prix saisis ; renvoie un message d'erreur ou null
const validatePrices = (minPrice, maxPrice) => {
  const min = parseFloat(minPrice);
  const max = parseFloat(maxPrice);
  if (Number.isNaN(min) || Number.isNaN(max)) return 'Les prix doivent être des nombres';
  if (min < 0 || max < 0) return 'Les prix ne peuvent pas être négatifs';
  if (min > max) return 'Le prix min doit être inférieur ou égal au prix max';
  return null;
};

const RendezVousV6 = () => {
  // State management
  const [currentUser, setCurrentUser] = useState(null);

  // Notifications et confirmations intégrées à la page. alert() / confirm()
  // bloquent le navigateur tant qu'ils sont ouverts, ce qui dégrade l'INP.
  const [toast, setToast] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState(null);
  const toastTimer = useRef(null);

  const notify = (message) => {
    clearTimeout(toastTimer.current);
    setToast({ message, id: Date.now() });
    toastTimer.current = setTimeout(() => setToast(null), Math.min(9000, 3500 + message.length * 40));
  };

  const askConfirm = (message, onConfirm) => setConfirmDialog({ message, onConfirm });

  useEffect(() => () => clearTimeout(toastTimer.current), []);

  // ----- Application installable (PWA) -----
  // Android / ordinateur (Chrome, Edge…) : le navigateur fournit une invite d'installation.
  // iPhone / iPad : pas d'invite, on explique « Partager › Sur l'écran d'accueil ».
  const [installPrompt, setInstallPrompt] = useState(null);
  const [showInstallHelp, setShowInstallHelp] = useState(false);
  const [isInstalled, setIsInstalled] = useState(() =>
    typeof window !== 'undefined' && (
      (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches)
      || window.navigator.standalone === true
    ));
  const isIOS = typeof navigator !== 'undefined'
    && (/iphone|ipad|ipod/i.test(navigator.userAgent)
      || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1));

  useEffect(() => {
    const onBeforeInstall = (e) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    const onInstalled = () => {
      setIsInstalled(true);
      setInstallPrompt(null);
    };
    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  const handleInstallApp = async () => {
    if (installPrompt) {
      installPrompt.prompt();
      const choice = await installPrompt.userChoice.catch(() => null);
      setInstallPrompt(null);
      if (choice && choice.outcome === 'accepted') notify('Rendez Vous est installé sur votre appareil ✓');
    } else {
      setShowInstallHelp(true);
    }
  };

  const canOfferInstall = !isInstalled && (Boolean(installPrompt) || isIOS);
  const [page, setPage] = useState('home');
  const [prestataires, setPrestataires] = useState(loadPrestataires);
  const [clients, setClients] = useState(loadClients);
  const [promoCodes, setPromoCodes] = useState(loadPromoCodes);
  const [settings, setSettings] = useState(loadSettings);
  const [searchResults, setSearchResults] = useState([]);
  // Dernière recherche lancée (pour « Aucun résultat » et la mise en avant des prestations)
  const [lastSearch, setLastSearch] = useState(null);
  // E-mail inconnu à la connexion client : affiche la fenêtre « Adresse e-mail inconnue »
  const [unknownEmail, setUnknownEmail] = useState(null);
  // Réservation qui vient d'être confirmée (page de confirmation)
  const [lastConfirmation, setLastConfirmation] = useState(null);
  // Réservation en cours de modification par le client : { id, prestataireId, date, time }
  const [editingReservation, setEditingReservation] = useState(null);
  const [selectedPrestataire, setSelectedPrestataire] = useState(null);
  const [selectedService, setSelectedService] = useState(null);
  const [adminFilter, setAdminFilter] = useState('Tous');
  const [adminTab, setAdminTab] = useState('prestataires');
  // Prestataire dont l'admin a ouvert le tableau de bord
  const [managedPrestataireId, setManagedPrestataireId] = useState(null);
  // Formulaire admin d'ajout / modification : { type: 'prestataire'|'client', id (édition), values }
  const [adminForm, setAdminForm] = useState(null);
  // Réglages du parrainage en cours de modification (null = pas de modification en cours)
  const [referralDraft, setReferralDraft] = useState(null);

  // Codes promo
  const [promoForm, setPromoForm] = useState(EMPTY_PROMO_FORM);
  const [promoInput, setPromoInput] = useState('');
  const [appliedPromoCode, setAppliedPromoCode] = useState('');
  
  // Reservation form state
  const [reservationData, setReservationData] = useState({
    clientName: '',
    clientFirstName: '',
    clientEmail: '',
    clientPhone: '',
    selectedDate: '',
    selectedTime: '',
    paymentMethod: 'prestataire' // paiement en ligne pas encore disponible
  });
  
  // Prestataire dashboard state
  const [dashboardTab, setDashboardTab] = useState('services');
  const [serviceName, setServiceName] = useState('');
  const [newServiceMinPrice, setNewServiceMinPrice] = useState('');
  const [newServiceMaxPrice, setNewServiceMaxPrice] = useState('');
  const [newPhotosForService, setNewPhotosForService] = useState([]);
  const [selectedServiceForPhotos, setSelectedServiceForPhotos] = useState(null);
  const [serviceSavedMessage, setServiceSavedMessage] = useState('');

  // Search state
  const [searchType, setSearchType] = useState('ville'); // 'ville', 'nom', 'type'
  const [searchValue, setSearchValue] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Beauté');

  // Registration state
  const [registrationData, setRegistrationData] = useState({
    name: '',
    city: '',
    email: '',
    password: '',
    category: '' // choisie obligatoirement à l'inscription
  });

  // Login form state
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });

  // Client registration state
  const [clientRegistration, setClientRegistration] = useState(EMPTY_CLIENT_REGISTRATION);

  // Edit service state
  const [editingServiceId, setEditingServiceId] = useState(null);
  const [editingService, setEditingService] = useState({ name: '', minPrice: '', maxPrice: '' });

  // Schedule state
  const [editingSchedule, setEditingSchedule] = useState(false);
  const [scheduleData, setScheduleData] = useState(DEFAULT_SCHEDULE);

  // Responsive design state
  const [screenWidth, setScreenWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);
  const isMobile = screenWidth < 768;
  const isTablet = screenWidth < 1024;

  useEffect(() => {
    const handleResize = () => {
      setScreenWidth(window.innerWidth);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const styles = {
    container: {
      padding: isMobile ? '10px' : '20px',
      maxWidth: '1400px',
      margin: '0 auto',
      backgroundColor: '#fff',
      color: '#000',
      minHeight: '100vh'
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: isMobile ? '15px' : '30px',
      borderBottom: '1px solid #ececec',
      paddingBottom: isMobile ? '10px' : '15px',
      flexWrap: 'wrap',
      gap: isMobile ? '10px' : '0'
    },
    logo: {
      height: isMobile ? '65px' : '105px',
      objectFit: 'contain'
    },
    nav: {
      display: 'flex',
      gap: isMobile ? '8px' : '15px',
      alignItems: 'center',
      flexWrap: 'wrap'
    },
    btn: {
      padding: isMobile ? '9px 16px' : '11px 22px',
      borderRadius: '999px',
      border: '1.5px solid #000',
      cursor: 'pointer',
      fontSize: isMobile ? '13px' : '14px',
      fontWeight: 700
    },
    btnPrimary: { backgroundColor: '#000', color: '#fff' },
    btnSecondary: { backgroundColor: '#fff', color: '#000' },
    btnDanger: { backgroundColor: '#ff6b6b', color: '#fff', borderColor: '#ff6b6b' },
    btnWarning: { backgroundColor: '#ffa500', color: '#fff', borderColor: '#ffa500' },
    input: {
      padding: '12px 14px',
      border: '1px solid #cfcfcf',
      borderRadius: '12px',
      marginBottom: '10px',
      width: '100%',
      boxSizing: 'border-box',
      backgroundColor: '#fff',
      fontSize: isMobile ? '16px' : '14px'
    },
    card: {
      border: '1px solid #eee',
      borderRadius: '16px',
      padding: isMobile ? '14px' : '20px',
      marginBottom: '15px',
      backgroundColor: '#fff',
      boxShadow: '0 2px 12px rgba(0, 0, 0, 0.05)'
    },
    grid: {
      display: 'grid',
      gridTemplateColumns: isMobile ? '1fr' : isTablet ? 'repeat(2, 1fr)' : 'repeat(auto-fill, minmax(280px, 1fr))',
      gap: isMobile ? '10px' : '20px',
      marginBottom: '20px'
    },
    tab: {
      padding: isMobile ? '8px 14px' : '10px 18px',
      border: '1.5px solid #000',
      borderRadius: '999px',
      cursor: 'pointer',
      backgroundColor: '#fff',
      color: '#000',
      marginRight: '8px',
      marginBottom: '8px',
      fontWeight: 700,
      fontSize: isMobile ? '12px' : '14px'
    },
    tabActive: { backgroundColor: '#000', color: '#fff' },
    badge: {
      display: 'inline-block',
      padding: '2px 8px',
      borderRadius: '10px',
      fontSize: '12px',
      fontWeight: 'bold'
    },
    successText: { color: '#1e7e34', fontSize: '14px', marginTop: '10px' },
    searchContainer: {
      display: 'flex',
      gap: isMobile ? '5px' : '10px',
      marginBottom: '20px',
      flexWrap: 'wrap',
      flexDirection: isMobile ? 'column' : 'row'
    },
    categoryTabs: {
      display: 'flex',
      gap: isMobile ? '5px' : '10px',
      marginBottom: '20px',
      flexWrap: 'wrap'
    },
    footer: {
      marginTop: isMobile ? '30px' : '50px',
      borderTop: '1px solid #ececec',
      paddingTop: isMobile ? '20px' : '30px',
      textAlign: 'center',
      fontSize: isMobile ? '12px' : '14px'
    },
  };

  // Save to localStorage (les photos en base64 peuvent dépasser le quota)
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(prestataires));
    } catch (e) {
      console.error('Sauvegarde locale impossible', e);
      notify('Sauvegarde impossible : espace de stockage plein (trop de photos ?)');
    }
  }, [prestataires]);

  useEffect(() => {
    try {
      localStorage.setItem(CLIENTS_STORAGE_KEY, JSON.stringify(clients));
    } catch (e) {
      console.error('Sauvegarde des comptes clients impossible', e);
    }
  }, [clients]);

  useEffect(() => { writeStorage(PROMOS_STORAGE_KEY, promoCodes); }, [promoCodes]);
  useEffect(() => { writeStorage(SETTINGS_STORAGE_KEY, settings); }, [settings]);

  // Le prestataire connecté est toujours lu depuis la liste, pour rester synchronisé
  // (nouvelles réservations, approbation admin, etc.)
  // Un admin peut ouvrir le tableau de bord de n'importe quel prestataire
  const isAdmin = Boolean(currentUser && currentUser.role === 'admin');
  const currentPrestataireId = currentUser?.role === 'prestataire'
    ? currentUser.id
    : isAdmin ? managedPrestataireId : null;
  const currentPrestataire = currentPrestataireId != null
    ? prestataires.find(p => p.id === currentPrestataireId) || null
    : null;

  const currentClient = currentUser && currentUser.role === 'client'
    ? clients.find(c => c.id === currentUser.id) || null
    : null;

  const updateCurrentPrestataire = (updater) => {
    if (currentPrestataireId == null) return;
    setPrestataires(prev => prev.map(p => (p.id === currentPrestataireId ? updater(p) : p)));
  };

  // Functions
  const handleRegisterPrestataire = (formData) => {
    const email = formData.email.trim().toLowerCase();
    if (prestataires.some(p => (p.email || '').toLowerCase() === email)) {
      notify('Un compte existe déjà avec cet email');
      return false;
    }
    setPrestataires(prev => [
      ...prev,
      {
        ...formData,
        email,
        id: Math.max(...prev.map(p => p.id || 0), 0) + 1,
        approved: false,
        emailVerified: false,
        services: [],
        photos: [],
        reservations: [],
        team: [],
        schedule: DEFAULT_SCHEDULE,
        blockedHours: []
      }
    ]);
    notify('Inscription envoyée. Votre compte sera actif après validation par un administrateur.');
    setPage('home');
    return true;
  };

  // Crée un bon de réduction personnel (parrainage), utilisable une fois
  const createReferralReward = (clientId, reward, label) => ({
    id: `${Date.now()}-${randomSuffix(6)}`,
    code: `${label}-${randomSuffix(6)}`,
    kind: 'parrainage',
    prestataireId: null, // valable chez tous les prestataires
    clientId,
    type: reward.type,
    value: reward.value,
    serviceIds: [],
    startDate: '',
    endDate: '',
    maxUses: 1,
    onePerClient: true,
    usedCount: 0,
    usedBy: [],
    status: 'active', // le programme a été activé par l'admin
    createdAt: new Date().toISOString()
  });

  const handleRegisterClient = (formData) => {
    const email = formData.email.trim().toLowerCase();
    if (clients.some(c => c.email === email)) {
      notify('Un compte client existe déjà avec cet email');
      return false;
    }
    const referralEnabled = settings.referral.enabled;
    const sponsorCode = normalizeCode(formData.referralCode);
    let sponsor = null;
    if (referralEnabled && sponsorCode) {
      sponsor = clients.find(c => normalizeCode(c.referralCode) === sponsorCode);
      if (!sponsor) {
        notify('Code de parrainage inconnu. Vérifiez-le ou laissez le champ vide.');
        return false;
      }
    }
    const newClient = {
      id: Math.max(...clients.map(c => c.id || 0), 0) + 1,
      lastName: formData.lastName.trim(),
      firstName: formData.firstName.trim(),
      email,
      phone: formData.phone.trim(),
      password: formData.password,
      referralCode: makeReferralCode(formData.firstName),
      referredBy: sponsor ? sponsor.id : null,
      sponsorRewarded: false,
      createdAt: new Date().toISOString()
    };
    setClients(prev => [...prev, newClient]);
    let welcome = `Bienvenue ${newClient.firstName} ! Votre compte est créé.`;
    if (sponsor) {
      const reward = createReferralReward(newClient.id, settings.referral.refereeReward, 'BIENVENUE');
      setPromoCodes(prev => [...prev, reward]);
      welcome += `\nGrâce au parrainage, vous bénéficiez de ${describeDiscount(reward)} sur votre première réservation (code ${reward.code}, visible dans « Mes réservations »).`;
    }
    setCurrentUser({ id: newClient.id, role: 'client' });
    notify(welcome);
    setPage('home');
    return true;
  };

  // ----- Ajout / modification de comptes par l'admin -----
  const openAdminForm = (type, existing = null) => {
    const values = type === 'prestataire'
      ? {
          name: existing?.name || '',
          category: existing?.category || 'Beauté',
          city: existing?.city || '',
          email: existing?.email || '',
          password: ''
        }
      : {
          lastName: existing?.lastName || '',
          firstName: existing?.firstName || '',
          email: existing?.email || '',
          phone: existing?.phone || '',
          password: ''
        };
    setAdminForm({ type, id: existing ? existing.id : null, values });
    window.scrollTo(0, 0);
  };

  const handleSaveAdminForm = () => {
    if (!adminForm) return;
    const { type, id, values } = adminForm;
    const isEdit = id != null;
    const email = values.email.trim().toLowerCase();
    const required = type === 'prestataire'
      ? [values.name, values.city, values.email]
      : [values.lastName, values.firstName, values.email, values.phone];
    if (required.some(v => !String(v).trim()) || (!isEdit && !values.password)) {
      notify('Remplissez tous les champs');
      return;
    }
    if (values.password && values.password.length < 6) {
      notify('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }
    const list = type === 'prestataire' ? prestataires : clients;
    if (list.some(item => (item.email || '').toLowerCase() === email && item.id !== id)) {
      notify('Un compte existe déjà avec cet email');
      return;
    }

    if (type === 'prestataire') {
      const fields = { name: values.name.trim(), category: values.category, city: values.city.trim(), email };
      if (values.password) fields.password = values.password;
      if (isEdit) {
        setPrestataires(prev => prev.map(p => (p.id === id ? { ...p, ...fields } : p)));
      } else {
        setPrestataires(prev => [
          ...prev,
          normalizePrestataire({
            ...fields,
            id: Math.max(...prev.map(p => p.id || 0), 0) + 1,
            approved: true, // créé par l'admin : directement actif
            emailVerified: true,
            services: [],
            reservations: [],
            team: [],
            schedule: DEFAULT_SCHEDULE
          })
        ]);
      }
    } else {
      const fields = {
        lastName: values.lastName.trim(),
        firstName: values.firstName.trim(),
        email,
        phone: values.phone.trim()
      };
      if (values.password) fields.password = values.password;
      if (isEdit) {
        setClients(prev => prev.map(c => (c.id === id ? { ...c, ...fields } : c)));
      } else {
        setClients(prev => [
          ...prev,
          {
            ...fields,
            id: Math.max(...prev.map(c => c.id || 0), 0) + 1,
            referralCode: makeReferralCode(fields.firstName),
            referredBy: null,
            sponsorRewarded: false,
            createdAt: new Date().toISOString()
          }
        ]);
      }
    }
    notify(isEdit ? 'Modifications enregistrées' : `${type === 'prestataire' ? 'Prestataire' : 'Client'} ajouté. Communiquez-lui son mot de passe provisoire.`);
    setAdminForm(null);
  };

  // ----- Codes promo -----
  // Vérifie qu'un code est utilisable ; renvoie { promo } ou { error }
  const checkPromoCode = (input, { prestataireId, serviceId, clientId }) => {
    const code = normalizeCode(input);
    if (!code) return { error: 'Saisissez un code' };
    const promo = promoCodes.find(pc => normalizeCode(pc.code) === code);
    if (!promo) return { error: 'Code inconnu' };
    if (promo.status === 'pending') return { error: "Ce code n'est pas encore activé" };
    if (promo.status !== 'active') return { error: "Ce code n'est plus actif" };
    if (promo.prestataireId != null && promo.prestataireId !== prestataireId) {
      return { error: "Ce code n'est pas valable chez ce prestataire" };
    }
    if (promo.serviceIds && promo.serviceIds.length > 0 && !promo.serviceIds.includes(serviceId)) {
      return { error: "Ce code n'est pas valable pour cette prestation" };
    }
    const today = todayString();
    if (promo.startDate && today < promo.startDate) return { error: `Ce code sera valable à partir du ${promo.startDate}` };
    if (promo.endDate && today > promo.endDate) return { error: 'Ce code a expiré' };
    if (promo.maxUses && (promo.usedCount || 0) >= promo.maxUses) {
      return { error: promo.clientId ? 'Ce bon a déjà été utilisé' : "Ce code a atteint son nombre maximum d'utilisations" };
    }
    if (promo.clientId != null && promo.clientId !== clientId) {
      return { error: 'Ce bon est personnel : connectez-vous avec le compte concerné' };
    }
    if (promo.onePerClient) {
      if (clientId == null) return { error: 'Connectez-vous à votre compte client pour utiliser ce code' };
      if ((promo.usedBy || []).includes(clientId)) return { error: 'Vous avez déjà utilisé ce code' };
    }
    return { promo };
  };

  const handleCreatePromo = () => {
    const code = normalizeCode(promoForm.code);
    if (!code || promoForm.value === '') {
      notify('Renseignez au moins le code et la réduction');
      return;
    }
    if (!/^[A-Z0-9-]{3,20}$/.test(code)) {
      notify('Le code doit contenir 3 à 20 caractères : lettres, chiffres ou tirets');
      return;
    }
    const discountError = validateDiscount(promoForm.type, promoForm.value);
    if (discountError) {
      notify(discountError);
      return;
    }
    if (promoForm.startDate && promoForm.endDate && promoForm.startDate > promoForm.endDate) {
      notify('La date de fin doit être après la date de début');
      return;
    }
    const maxUses = promoForm.maxUses === '' ? null : parseInt(promoForm.maxUses, 10);
    if (maxUses !== null && (Number.isNaN(maxUses) || maxUses < 1)) {
      notify("Le nombre maximum d'utilisations doit être un entier positif");
      return;
    }
    if (promoCodes.some(pc => normalizeCode(pc.code) === code)) {
      notify('Ce code existe déjà, choisissez-en un autre');
      return;
    }
    setPromoCodes(prev => [
      ...prev,
      {
        id: `${Date.now()}-${randomSuffix(6)}`,
        code,
        kind: 'promo',
        prestataireId: currentPrestataireId,
        clientId: null,
        type: promoForm.type,
        value: parseFloat(promoForm.value),
        serviceIds: promoForm.serviceIds,
        startDate: promoForm.startDate,
        endDate: promoForm.endDate,
        maxUses,
        onePerClient: promoForm.onePerClient,
        usedCount: 0,
        usedBy: [],
        // Un code créé par un prestataire doit être activé par l'admin
        status: isAdmin ? 'active' : 'pending',
        createdAt: new Date().toISOString()
      }
    ]);
    setPromoForm(EMPTY_PROMO_FORM);
    notify(isAdmin
      ? `Code ${code} enregistré et actif.`
      : `Code ${code} enregistré. Il sera utilisable dès qu'un administrateur l'aura activé.`);
  };

  const setPromoStatus = (id, status) => {
    setPromoCodes(prev => prev.map(pc => (pc.id === id ? { ...pc, status } : pc)));
  };

  const handleDeletePromo = (id) => {
    askConfirm('Supprimer ce code ?', () => {
      setPromoCodes(prev => prev.filter(pc => pc.id !== id));
    });
  };

  const handleSaveReferralSettings = () => {
    if (!referralDraft) return;
    for (const reward of [referralDraft.refereeReward, referralDraft.sponsorReward]) {
      const error = validateDiscount(reward.type, reward.value);
      if (error) {
        notify(error);
        return;
      }
    }
    setSettings(prev => ({
      ...prev,
      referral: {
        enabled: referralDraft.enabled,
        refereeReward: { type: referralDraft.refereeReward.type, value: parseFloat(referralDraft.refereeReward.value) },
        sponsorReward: { type: referralDraft.sponsorReward.type, value: parseFloat(referralDraft.sponsorReward.value) }
      }
    }));
    setReferralDraft(null);
    notify('Réglages du parrainage enregistrés');
  };

  const handleEditService = (serviceId, service) => {
    setEditingServiceId(serviceId);
    setEditingService({
      name: service.name,
      minPrice: String(service.minPrice ?? ''),
      maxPrice: String(service.maxPrice ?? '')
    });
  };

  const handleUpdateService = () => {
    if (!editingService.name.trim() || editingService.minPrice === '' || editingService.maxPrice === '') {
      notify('Remplissez tous les champs');
      return;
    }
    const priceError = validatePrices(editingService.minPrice, editingService.maxPrice);
    if (priceError) {
      notify(priceError);
      return;
    }

    updateCurrentPrestataire(p => ({
      ...p,
      services: p.services.map(s =>
        s.id === editingServiceId
          ? {
              ...s,
              name: editingService.name.trim(),
              minPrice: parseFloat(editingService.minPrice),
              maxPrice: parseFloat(editingService.maxPrice)
            }
          : s
      )
    }));
    setEditingServiceId(null);
    setEditingService({ name: '', minPrice: '', maxPrice: '' });
  };

  const handleSaveSchedule = () => {
    const scheduleError = validateSchedule(scheduleData);
    if (scheduleError) {
      notify(scheduleError);
      return;
    }
    const sortedSchedule = {};
    DAYS.forEach(({ key }) => {
      sortedSchedule[key] = [...(scheduleData[key] || [])]
        .sort((a, b) => toMinutes(a.start) - toMinutes(b.start));
    });
    updateCurrentPrestataire(p => ({ ...p, schedule: sortedSchedule }));
    setEditingSchedule(false);
    notify('Créneaux sauvegardés');
  };

  const handleLogin = (email, password, role) => {
    const normalizedEmail = email.trim().toLowerCase();
    if (role === 'prestataire') {
      // Identifiants administrateur saisis dans la connexion prestataire => accès admin
      const admin = ADMIN_ACCOUNTS.find(
        a => a.email.toLowerCase() === normalizedEmail && a.password === password
      );
      if (admin) {
        setCurrentUser({ email: admin.email, role: 'admin' });
        setManagedPrestataireId(null);
        setAdminTab('prestataires');
        setPage('admin');
        return true;
      }
      const prestataire = prestataires.find(
        p => (p.email || '').toLowerCase() === normalizedEmail && p.password === password
      );
      if (prestataire && !prestataire.emailVerified) return { error: 'pending' };
      if (prestataire) {
        setCurrentUser({ id: prestataire.id, role: 'prestataire' });
        setDashboardTab('services');
        setPage('dashboard');
        return { ok: true };
      }
    } else if (role === 'client') {
      const client = clients.find(c => c.email === normalizedEmail);
      if (!client) return { error: 'unknown-email' };
      if (client.password !== password) return { error: 'wrong-password' };
      setCurrentUser({ id: client.id, role: 'client' });
      setPage('home');
      return { ok: true };
    }
    return { error: 'invalid' };
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setManagedPrestataireId(null);
    setPage('home');
    setLoginForm({ email: '', password: '' });
    setEditingReservation(null);
    setLastConfirmation(null);
    setEditingServiceId(null);
    setEditingSchedule(false);
    setSelectedServiceForPhotos(null);
    setNewPhotosForService([]);
    setAdminForm(null);
    setReferralDraft(null);
    setPromoForm(EMPTY_PROMO_FORM);
    setPromoInput('');
    setAppliedPromoCode('');
    setServiceSavedMessage('');
    setReservationData({
      clientName: '', clientFirstName: '', clientEmail: '', clientPhone: '',
      selectedDate: '', selectedTime: '', paymentMethod: 'prestataire'
    });
  };

  const serviceMatches = (service, query) => normalizeText(service.name).includes(query);

  const handleSearch = () => {
    let results = prestataires.filter(p => p.approved && p.emailVerified && p.category === selectedCategory);
    const query = normalizeText(searchValue);

    if (query) {
      if (searchType === 'ville') {
        results = results.filter(p => normalizeText(p.city).includes(query));
      } else if (searchType === 'nom') {
        results = results.filter(p => normalizeText(p.name).includes(query));
      } else if (searchType === 'prestation') {
        results = results.filter(p => (p.services || []).some(s => serviceMatches(s, query)));
      }
    }
    setSearchResults(results);
    setLastSearch({ type: searchType, query });
  };

  const resetSearch = () => {
    setSearchValue('');
    setSearchResults([]);
    setLastSearch(null);
  };

  const checkAvailability = (prestaireId, date, time) => {
    const prestataire = prestataires.find(p => p.id === prestaireId);
    if (!prestataire) return false;

    // Simple availability check - in real app would be more complex
    if ((prestataire.blockedHours || []).includes(`${date}-${time}`)) return false;
    // Le créneau doit faire partie des horaires d'ouverture
    if (!getTimeOptions(prestataire.schedule, date).includes(normalizeTime(time))) return false;
    // Empêche la double réservation d'un même créneau
    return !isSlotBooked(prestataire, date, time);
  };

  // excludeId : la réservation en cours de modification ne bloque pas son propre créneau
  const isSlotBooked = (prestataire, date, time, excludeId = null) =>
    (prestataire.reservations || []).some(
      r => isActiveReservation(r) && r.id !== excludeId &&
        r.date === date && normalizeTime(r.time) === normalizeTime(time)
    );

  // Pré-remplit le formulaire de réservation avec les infos du client connecté
  const startReservation = (service, preset = null) => {
    setSelectedService(service);
    setPromoInput('');
    setAppliedPromoCode('');
    setReservationData(prev => ({
      ...prev,
      ...(currentClient ? {
        clientName: prev.clientName || currentClient.lastName,
        clientFirstName: prev.clientFirstName || currentClient.firstName,
        clientEmail: prev.clientEmail || currentClient.email,
        clientPhone: prev.clientPhone || currentClient.phone
      } : {}),
      selectedDate: preset ? preset.date : prev.selectedDate,
      selectedTime: preset ? preset.time : prev.selectedTime
    }));
    setPage('reservation');
  };

  // Reprendre rendez-vous chez un prestataire, éventuellement sur un créneau précis
  const rebook = (prestataire, service, preset = null) => {
    setSelectedPrestataire(prestataire);
    startReservation(service, preset);
  };

  // ----- Rappels par e-mail (fonction serveur, voir api/reminders.js) -----
  const updateReservation = (prestataireId, reservationId, fields) => {
    setPrestataires(prev => prev.map(p => (p.id === prestataireId
      ? { ...p, reservations: (p.reservations || []).map(r => (r.id === reservationId ? { ...r, ...fields } : r)) }
      : p)));
  };

  // Programme l'e-mail de rappel 24 h avant ; renvoie true si l'e-mail est programmé
  const scheduleReminderEmail = async (reservation, prestataire) => {
    const remindAt = appointmentDate(reservation.date, reservation.time).getTime() - DAY_MS;
    if (!reservation.clientEmail || remindAt <= Date.now() + 5 * 60 * 1000) return false;
    const result = await callReminderApi({
      action: 'schedule',
      to: reservation.clientEmail,
      firstName: reservation.clientFirstName,
      prestataireName: prestataire.name,
      prestataireCity: prestataire.city,
      serviceName: reservation.serviceName,
      date: reservation.date,
      time: normalizeTime(reservation.time),
      dateLabel: formatDateLong(reservation.date),
      remindAt: new Date(remindAt).toISOString()
    });
    if (result && result.id) {
      updateReservation(prestataire.id, reservation.id, { reminderEmailId: result.id });
      return true;
    }
    return false;
  };

  const cancelReminderEmail = (reservation) => {
    if (reservation.reminderEmailId) callReminderApi({ action: 'cancel', id: reservation.reminderEmailId });
  };

  // ----- Modification / annulation par le client -----
  const canClientChange = (reservation) =>
    appointmentDate(reservation.date, reservation.time).getTime() - Date.now() > CHANGE_DEADLINE_HOURS * HOUR_MS;

  const releasePromo = (reservation) => {
    if (!reservation.promo) return;
    const code = normalizeCode(reservation.promo.code);
    setPromoCodes(prev => prev.map(pc => {
      if (normalizeCode(pc.code) !== code) return pc;
      const usedBy = [...(pc.usedBy || [])];
      const index = usedBy.indexOf(reservation.clientId);
      if (index !== -1) usedBy.splice(index, 1);
      return { ...pc, usedCount: Math.max(0, (pc.usedCount || 0) - 1), usedBy };
    }));
  };

  const handleCancelReservation = (prestataire, reservation) => {
    if (!canClientChange(reservation)) {
      notify(`Moins de ${CHANGE_DEADLINE_HOURS} h avant votre rendez-vous : contactez directement le prestataire.`);
      return;
    }
    askConfirm(
      `Annuler votre rendez-vous « ${reservation.serviceName} » du ${formatDateLong(reservation.date)} à ${normalizeTime(reservation.time)} ?`,
      () => {
        updateReservation(prestataire.id, reservation.id, {
          status: 'cancelled',
          cancelledAt: new Date().toISOString(),
          cancelledBy: 'client',
          reminderEmailId: null
        });
        releasePromo(reservation);
        cancelReminderEmail(reservation);
        setEditingReservation(null);
        notify('Rendez-vous annulé. Le créneau est libéré.');
      }
    );
  };

  const handleSaveReservationChange = async () => {
    if (!editingReservation) return;
    const prestataire = prestataires.find(p => p.id === editingReservation.prestataireId);
    const reservation = prestataire && prestataire.reservations.find(r => r.id === editingReservation.id);
    if (!reservation) return;
    if (!canClientChange(reservation)) {
      notify(`Moins de ${CHANGE_DEADLINE_HOURS} h avant votre rendez-vous : contactez directement le prestataire.`);
      return;
    }
    const { date, time } = editingReservation;
    if (!date || !time) {
      notify('Choisissez une nouvelle date et une heure');
      return;
    }
    if (date === reservation.date && normalizeTime(time) === normalizeTime(reservation.time)) {
      setEditingReservation(null);
      return;
    }
    if (appointmentDate(date, time).getTime() <= Date.now()
      || !getTimeOptions(prestataire.schedule, date).includes(normalizeTime(time))
      || isSlotBooked(prestataire, date, time, reservation.id)) {
      notify("Ce créneau n'est pas disponible");
      return;
    }
    updateReservation(prestataire.id, reservation.id, {
      date,
      time,
      modifiedAt: new Date().toISOString(),
      previousSlot: { date: reservation.date, time: reservation.time },
      reminderEmailId: null
    });
    cancelReminderEmail(reservation);
    setEditingReservation(null);
    notify(`Rendez-vous déplacé au ${formatDateLong(date)} à ${time}.`);
    scheduleReminderEmail({ ...reservation, date, time }, prestataire);
  };

  // ----- Suggestions selon les habitudes du client -----
  const getClientReservations = (clientId) => prestataires
    .flatMap(p => (p.reservations || [])
      .filter(r => r.clientId === clientId)
      .map(r => ({ ...r, prestataire: p, at: appointmentDate(r.date, r.time).getTime() })));

  const getSuggestions = (client) => {
    const now = Date.now();
    const active = getClientReservations(client.id).filter(isActiveReservation);
    const past = active.filter(r => r.at < now).sort((a, b) => b.at - a.at);
    const upcoming = active.filter(r => r.at >= now);
    const bookable = (r) => {
      const prestataire = prestataires.find(p => p.id === r.prestataire.id);
      const service = prestataire && prestataire.approved && prestataire.services.find(s => s.id === r.serviceId);
      return service ? { prestataire, service } : null;
    };
    const suggestions = [];

    // A. Renouveler le dernier rendez-vous
    const last = past[0];
    const lastTarget = last && bookable(last);
    if (lastTarget && !upcoming.some(r => r.prestataire.id === last.prestataire.id && r.serviceId === last.serviceId)) {
      suggestions.push({
        key: 'renew',
        icon: '🔁',
        text: `Votre dernier rendez-vous « ${last.serviceName} » chez ${last.prestataire.name} remonte au ${formatDateLong(last.date)}. On le renouvelle ?`,
        actionLabel: 'Réserver à nouveau',
        action: () => rebook(lastTarget.prestataire, lastTarget.service)
      });
    }

    // B. Créneau habituel : même jour de la semaine et même heure au moins 2 fois
    const habits = {};
    active.forEach(r => {
      const key = `${dayKeyFromDate(r.date)}|${normalizeTime(r.time)}`;
      habits[key] = habits[key] || [];
      habits[key].push(r);
    });
    const habit = Object.values(habits)
      .filter(group => group.length >= 2)
      .sort((a, b) => b.length - a.length)[0];
    if (habit) {
      const reference = [...habit].sort((a, b) => b.at - a.at)[0];
      const target = bookable(reference);
      if (target) {
        const time = normalizeTime(reference.time);
        const dayKey = dayKeyFromDate(reference.date);
        let slot = null;
        for (let i = 0; i <= 56 && !slot; i++) {
          const date = addDays(todayString(), i);
          if (dayKeyFromDate(date) !== dayKey) continue;
          if (appointmentDate(date, time).getTime() <= now + HOUR_MS) continue;
          if (getTimeOptions(target.prestataire.schedule, date).includes(time)
            && !isSlotBooked(target.prestataire, date, time)
            && !upcoming.some(r => r.date === date)) {
            slot = { date, time };
          }
        }
        if (slot) {
          const dayLabel = DAYS.find(d => d.key === dayKey).label.toLowerCase();
          suggestions.push({
            key: 'habit',
            icon: '🗓️',
            text: `Vous réservez souvent le ${dayLabel} vers ${parseInt(time, 10)} h. Prochain créneau libre chez ${target.prestataire.name} : ${formatDateLong(slot.date)} à ${slot.time}.`,
            actionLabel: 'Réserver ce créneau',
            action: () => rebook(target.prestataire, target.service, slot)
          });
        }
      }
    }

    // C. Rythme habituel : intervalle moyen entre les rendez-vous passés
    if (past.length >= 2 && upcoming.length === 0 && lastTarget) {
      const chronological = [...past].sort((a, b) => a.at - b.at);
      const gaps = chronological.slice(1).map((r, i) => (r.at - chronological[i].at) / DAY_MS);
      const average = gaps.reduce((sum, g) => sum + g, 0) / gaps.length;
      if (average >= 7 && average <= 180) {
        const daysUntilDue = (last.at + average * DAY_MS - now) / DAY_MS;
        if (daysUntilDue <= 10) {
          const weeks = Math.max(1, Math.round(average / 7));
          const rhythm = weeks === 1 ? 'chaque semaine' : `environ toutes les ${weeks} semaines`;
          suggestions.push({
            key: 'rhythm',
            icon: '⏳',
            text: daysUntilDue > 0
              ? `Vous venez ${rhythm} : c'est bientôt le moment !`
              : `Vous venez ${rhythm} : c'est le moment de reprendre rendez-vous !`,
            actionLabel: 'Prendre rendez-vous',
            action: () => rebook(lastTarget.prestataire, lastTarget.service)
          });
        }
      }
    }
    return suggestions;
  };

  // Paiement en ligne (Stripe) pas encore développé : le client règle sur place
  const processPayment = () => {
    completeReservation();
  };

  const completeReservation = async () => {
    // TODO: Send email via SendGrid
    if (!selectedService || !selectedPrestataire) return;

    // Le code promo est revérifié au moment de confirmer
    let promo = null;
    if (appliedPromoCode) {
      const check = checkPromoCode(appliedPromoCode, {
        prestataireId: selectedPrestataire.id,
        serviceId: selectedService.id,
        clientId: currentClient ? currentClient.id : null
      });
      if (check.error) {
        notify(`Code promo refusé : ${check.error}`);
        setAppliedPromoCode('');
        return;
      }
      promo = check.promo;
    }
    const minPrice = selectedService.minPrice;
    const maxPrice = selectedService.maxPrice;

    const reservation = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      clientId: currentClient ? currentClient.id : null,
      clientName: reservationData.clientName,
      clientFirstName: reservationData.clientFirstName,
      clientEmail: reservationData.clientEmail,
      clientPhone: reservationData.clientPhone,
      serviceId: selectedService.id,
      serviceName: selectedService.name,
      date: reservationData.selectedDate,
      time: reservationData.selectedTime,
      paymentMethod: 'prestataire',
      status: 'pending',
      price: { min: minPrice, max: maxPrice },
      finalPrice: { min: applyDiscount(minPrice, promo), max: applyDiscount(maxPrice, promo) },
      promo: promo
        ? { code: promo.code, kind: promo.kind, type: promo.type, value: promo.value }
        : null
    };

    setPrestataires(prev => prev.map(p =>
      p.id === selectedPrestataire.id
        ? { ...p, reservations: [...(p.reservations || []), reservation] }
        : p
    ));

    const clientId = currentClient ? currentClient.id : null;
    if (promo) {
      setPromoCodes(prev => prev.map(pc => (pc.id === promo.id
        ? {
            ...pc,
            usedCount: (pc.usedCount || 0) + 1,
            usedBy: clientId != null ? [...(pc.usedBy || []), clientId] : (pc.usedBy || [])
          }
        : pc)));
    }

    // Parrainage : le parrain reçoit son bon à la première réservation du filleul
    if (currentClient && currentClient.referredBy != null && !currentClient.sponsorRewarded) {
      const sponsorExists = clients.some(c => c.id === currentClient.referredBy);
      if (settings.referral.enabled && sponsorExists) {
        const reward = createReferralReward(currentClient.referredBy, settings.referral.sponsorReward, 'PARRAIN');
        setPromoCodes(prev => [...prev, reward]);
      }
      setClients(prev => prev.map(c => (c.id === currentClient.id ? { ...c, sponsorRewarded: true } : c)));
    }

    const prestataireForReminder = prestataires.find(p => p.id === selectedPrestataire.id) || selectedPrestataire;
    const confirmationId = reservation.id;
    setLastConfirmation({ reservation, prestataire: prestataireForReminder, reminder: 'pending' });
    setPage('reservation-confirmed');
    scheduleReminderEmail(reservation, prestataireForReminder).then(scheduled => {
      setLastConfirmation(prev => (prev && prev.reservation.id === confirmationId
        ? { ...prev, reminder: scheduled ? 'scheduled' : 'unavailable' }
        : prev));
    });
    setPromoInput('');
    setAppliedPromoCode('');
    setReservationData({
      clientName: '', clientFirstName: '', clientEmail: '', clientPhone: '',
      selectedDate: '', selectedTime: '', paymentMethod: 'prestataire'
    });
  };

  const handleApprovePrestataire = (id) => {
    // Aucun flux de vérification d'email n'existe encore : l'approbation admin
    // vaut validation, sinon le prestataire ne pourrait jamais se connecter.
    setPrestataires(prev => prev.map(p =>
      p.id === id ? { ...p, approved: true, emailVerified: true } : p
    ));
  };

  const handleRejectPrestataire = (id) => {
    setPrestataires(prev => prev.filter(p => p.id !== id));
  };

  const handleAddService = () => {
    if (!serviceName.trim() || newServiceMinPrice === '' || newServiceMaxPrice === '') {
      notify('Remplissez tous les champs');
      return;
    }
    const priceError = validatePrices(newServiceMinPrice, newServiceMaxPrice);
    if (priceError) {
      notify(priceError);
      return;
    }

    updateCurrentPrestataire(p => ({
      ...p,
      services: [
        ...p.services,
        {
          id: Math.max(...p.services.map(s => s.id || 0), 0) + 1,
          name: serviceName.trim(),
          minPrice: parseFloat(newServiceMinPrice),
          maxPrice: parseFloat(newServiceMaxPrice),
          photos: []
        }
      ]
    }));
    setServiceSavedMessage(currentPrestataire && currentPrestataire.approved
      ? `✓ « ${serviceName.trim()} » est enregistrée et visible sur le site.`
      : `✓ « ${serviceName.trim()} » est enregistrée. Elle sera visible sur le site dès la validation du compte par l'administrateur.`);
    setServiceName('');
    setNewServiceMinPrice('');
    setNewServiceMaxPrice('');
  };

  const handleDeleteService = (serviceId) => {
    askConfirm('Supprimer cette prestation ?', () => {
      updateCurrentPrestataire(p => ({
        ...p,
        services: p.services.filter(s => s.id !== serviceId)
      }));
      // La fenêtre de confirmation bloque toute autre action : ces valeurs sont à jour
      if (editingServiceId === serviceId) setEditingServiceId(null);
      if (selectedServiceForPhotos === serviceId) {
        setSelectedServiceForPhotos(null);
        setNewPhotosForService([]);
      }
    });
  };

  const handlePhotoUploadForService = (e) => {
    const files = Array.from(e.target.files || []).filter(file => file.type.startsWith('image/'));
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setNewPhotosForService(prev => [...prev, ev.target.result]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleAddPhotosToService = () => {
    if (!selectedServiceForPhotos || newPhotosForService.length === 0) return;

    const photosToAdd = newPhotosForService;
    updateCurrentPrestataire(p => ({
      ...p,
      services: p.services.map(s =>
        s.id === selectedServiceForPhotos
          ? { ...s, photos: [...(s.photos || []), ...photosToAdd] }
          : s
      )
    }));

    setNewPhotosForService([]);
    setSelectedServiceForPhotos(null);
  };

  const handleDeleteServicePhoto = (serviceId, photoIndex) => {
    updateCurrentPrestataire(p => ({
      ...p,
      services: p.services.map(s =>
        s.id === serviceId
          ? { ...s, photos: (s.photos || []).filter((_, i) => i !== photoIndex) }
          : s
      )
    }));
  };

  // Pages
  // IMPORTANT : ces pages sont des fonctions de rendu appelées directement
  // (renderXxx()), et non des composants (<Xxx />). Déclarer un composant à
  // l'intérieur d'un autre le recrée à chaque rendu : React démonte alors toute
  // la page à chaque frappe et les champs de saisie perdent le curseur.
  // Barre de recherche, réutilisée sur l'accueil (fond noir) et dans « Mes réservations »
  const renderSearchBar = (variant) => {
    const placeholders = {
      ville: 'Entrez une ville...',
      nom: 'Entrez un nom...',
      prestation: 'Entrez une prestation (ex : coloration)...'
    };
    return (
      <div style={{...styles.searchContainer, maxWidth: '800px', margin: variant === 'dark' ? '0 auto' : '0 0 20px'}}>
        <select
          value={searchType}
          onChange={(e) => setSearchType(e.target.value)}
          aria-label="Type de recherche"
          style={{...styles.input, marginBottom: '0', width: isMobile ? '100%' : '170px'}}
        >
          <option value="ville">Par ville</option>
          <option value="nom">Par nom</option>
          <option value="prestation">Par prestation</option>
        </select>
        <input
          type="text"
          placeholder={placeholders[searchType]}
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); }}
          style={{...styles.input, marginBottom: '0', flex: 1}}
        />
        <button
          style={variant === 'dark'
            ? {...styles.btn, backgroundColor: '#fff', color: '#000', borderColor: '#fff'}
            : {...styles.btn, ...styles.btnPrimary}}
          onClick={handleSearch}
        >
          🔍 Rechercher
        </button>
      </div>
    );
  };

  const renderSearchResults = () => {
    if (searchResults.length === 0) {
      return lastSearch
        ? <p style={{textAlign: 'center', marginTop: '20px'}}>Aucun résultat trouvé</p>
        : null;
    }
    const highlight = lastSearch && lastSearch.type === 'prestation' && lastSearch.query;
    return (
      <div style={styles.grid}>
        {searchResults.map(p => {
          // Recherche par prestation : les prestations trouvées sont affichées en premier
          const services = highlight
            ? [...p.services].sort((a, b) => Number(serviceMatches(b, highlight)) - Number(serviceMatches(a, highlight)))
            : p.services;
          return (
            <div key={p.id} className="rv-card-hover" style={styles.card}>
              <h3>{p.name}</h3>
              <p>📍 {p.city}</p>
              <p style={{fontSize: '12px', color: '#666'}}>{p.category}</p>
              <div style={{marginBottom: '10px'}}>
                {services.map(s => {
                  const matched = highlight && serviceMatches(s, highlight);
                  return (
                    <div
                      key={s.id}
                      style={{
                        fontSize: '13px',
                        marginBottom: '5px',
                        ...(matched ? { backgroundColor: '#f0f0f0', borderRadius: '8px', padding: '4px 8px' } : {})
                      }}
                    >
                      <strong>{matched ? '✓ ' : ''}{s.name}</strong><br/>
                      {s.minPrice === s.maxPrice ? `${s.minPrice}€` : `${s.minPrice}€ - ${s.maxPrice}€`}
                    </div>
                  );
                })}
              </div>
              <button
                style={{...styles.btn, ...styles.btnPrimary, width: '100%'}}
                onClick={() => {
                  setSelectedPrestataire(p);
                  setPage('prestataire-detail');
                }}
              >
                Détails & Réserver
              </button>
            </div>
          );
        })}
      </div>
    );
  };

  // Rappel sur le site : rendez-vous du client dans les prochaines 24 h
  const renderClientReminderBanner = () => {
    const now = Date.now();
    const soon = getClientReservations(currentClient.id)
      .filter(r => isActiveReservation(r) && r.at > now && r.at - now <= DAY_MS)
      .sort((a, b) => a.at - b.at);
    if (soon.length === 0) return null;
    return (
      <div style={{...styles.card, backgroundColor: '#000', color: '#fff'}}>
        {soon.map(r => (
          <p key={r.id} style={{margin: 0}}>
            ⏰ <strong>Rappel :</strong> vous avez rendez-vous {r.date === todayString() ? "aujourd'hui" : 'demain'} à {normalizeTime(r.time)} chez {r.prestataire.name} ({r.serviceName}).
          </p>
        ))}
      </div>
    );
  };

  const renderSuggestions = () => {
    const suggestions = getSuggestions(currentClient);
    if (suggestions.length === 0) return null;
    return (
      <div style={{...styles.card, backgroundColor: '#fafafa'}}>
        <h3>Pour vous</h3>
        {suggestions.map(suggestion => (
          <div
            key={suggestion.key}
            style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', flexWrap: 'wrap', padding: '10px 0', borderTop: '1px solid #eee'}}
          >
            <span style={{flex: 1, minWidth: '200px'}}>{suggestion.icon} {suggestion.text}</span>
            <button style={{...styles.btn, ...styles.btnPrimary}} onClick={suggestion.action}>
              {suggestion.actionLabel}
            </button>
          </div>
        ))}
      </div>
    );
  };

  const renderHomePage = () => (
    <div style={styles.container}>
      <div style={styles.header}>
        <img src={LOGO_SRC} alt="Rendez Vous" style={styles.logo} />
        {/* Category Tabs on Right */}
        <div style={{display: 'flex', gap: '5px'}}>
          {['Artisans', 'Beauté'].map(cat => (
            <button
              key={cat}
              style={{
                ...styles.tab,
                ...(selectedCategory === cat ? styles.tabActive : {}),
                marginRight: '0'
              }}
              onClick={() => {
                setSelectedCategory(cat);
                resetSearch();
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {currentClient && (
        <div style={{...styles.card, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px'}}>
          <span>Bonjour <strong>{currentClient.firstName}</strong></span>
          <div style={{display: 'flex', gap: '10px', flexWrap: 'wrap'}}>
            <button style={{...styles.btn, ...styles.btnSecondary}} onClick={() => setPage('client-reservations')}>
              Mes réservations
            </button>
            <button style={{...styles.btn, ...styles.btnSecondary}} onClick={handleLogout}>
              Déconnexion
            </button>
          </div>
        </div>
      )}

      {currentClient && renderClientReminderBanner()}
      {currentClient && renderSuggestions()}

      {/* Bandeau d'accueil + recherche */}
      <div style={{
        backgroundColor: '#000',
        color: '#fff',
        borderRadius: '24px',
        padding: isMobile ? '24px 16px' : '45px 40px',
        marginBottom: '30px',
        textAlign: 'center'
      }}>
        <h1 style={{fontSize: isMobile ? '24px' : '36px', marginBottom: '8px'}}>
          Trouvez votre prochain rendez-vous, peu importe le domaine{'\u00a0'}: c'est ici{'\u00a0'}! ✨
        </h1>
        <p style={{color: '#ccc', fontSize: '16px', marginBottom: isMobile ? '18px' : '28px'}}>
          La plateforme qui simplifie les réservations des professionnels
        </p>
        {renderSearchBar('dark')}
      </div>

      {renderSearchResults()}

      <div style={styles.footer}>
        <p style={{marginBottom: '15px', color: '#666'}}>Accès rapide</p>
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
          {currentClient ? (
            <button style={{...styles.btn, ...styles.btnSecondary}} onClick={() => setPage('client-reservations')}>
              Mes réservations
            </button>
          ) : (
            <button style={{...styles.btn, ...styles.btnSecondary}} onClick={() => setPage('login-client')}>
              Connexion Client
            </button>
          )}
          <button style={{...styles.btn, ...styles.btnSecondary}} onClick={() => setPage('login-prestataire')}>
            Connexion Prestataire
          </button>
        </div>
        {canOfferInstall && (
          <p style={{marginTop: '20px'}}>
            <button
              onClick={handleInstallApp}
              style={{background: 'none', border: 'none', padding: 0, color: '#000', textDecoration: 'underline', cursor: 'pointer', fontWeight: 700, fontSize: '14px'}}
            >
              📲 Installer l'application Rendez Vous
            </button>
          </p>
        )}
      </div>
    </div>
  );

  const renderLoginPage = (role) => {
    const handleSubmit = (e) => {
      e.preventDefault();
      const result = handleLogin(loginForm.email, loginForm.password, role);
      if (result.ok) {
        setLoginForm({ email: '', password: '' });
      } else if (result.error === 'unknown-email') {
        setUnknownEmail(loginForm.email.trim());
      } else if (result.error === 'wrong-password') {
        notify('Mot de passe incorrect. Vérifiez-le et réessayez.');
      } else if (result.error === 'pending') {
        notify("Votre compte est en attente de validation par l'administrateur.");
      } else {
        notify('Identifiants invalides');
      }
    };

    return (
      <div style={styles.container}>
        <div style={styles.header}>
          <img src={LOGO_SRC} alt="Rendez Vous" style={styles.logo} />
          <button style={{...styles.btn, ...styles.btnSecondary}} onClick={() => setPage('home')}>
            Retour
          </button>
        </div>
        <div style={{maxWidth: '400px', margin: '60px auto'}}>
          {role === 'prestataire' && (
            <div style={{...styles.card, backgroundColor: '#000', color: '#fff', marginBottom: '25px'}}>
              <h3 style={{color: '#fff'}}>Vous souhaitez élargir votre activité ?</h3>
              <p style={{color: '#ddd', margin: 0}}>
                « Rendez Vous » est la plateforme faite pour vous. Centralisez vos rendez-vous et vos rappels en un seul lieu.
              </p>
            </div>
          )}
          <h2>Connexion {role === 'prestataire' ? 'Prestataire' : 'Client'}</h2>
          <form onSubmit={handleSubmit}>
            <input
              id="login-email"
              type="text"
              value={loginForm.email}
              onChange={(e) => {
                const { value } = e.target;
                setLoginForm(prev => ({ ...prev, email: value }));
              }}
              placeholder="Email"
              style={styles.input}
              required
            />
            <input
              type="password"
              value={loginForm.password}
              onChange={(e) => {
                const { value } = e.target;
                setLoginForm(prev => ({ ...prev, password: value }));
              }}
              placeholder="Mot de passe"
              style={styles.input}
              required
            />
            <button type="submit" style={{...styles.btn, ...styles.btnPrimary, width: '100%'}}>
              Se connecter
            </button>
          </form>
          {role === 'prestataire' && (
            <div style={{marginTop: '20px', textAlign: 'center', paddingTop: '15px', borderTop: '1px solid #ddd'}}>
              <p style={{marginBottom: '10px', fontSize: '14px'}}>Pas encore inscrit?</p>
              <button
                style={{...styles.btn, ...styles.btnSecondary, width: '100%'}}
                onClick={() => setPage('register-prestataire')}
              >
                S'inscrire comme Prestataire
              </button>
            </div>
          )}
          {role === 'client' && (
            <div style={{marginTop: '20px', textAlign: 'center', paddingTop: '15px', borderTop: '1px solid #ddd'}}>
              <p style={{marginBottom: '10px', fontSize: '14px'}}>Pas encore de compte ?</p>
              <button
                style={{...styles.btn, ...styles.btnSecondary, width: '100%'}}
                onClick={() => setPage('register-client')}
              >
                Créer un compte client
              </button>
            </div>
          )}
        </div>

        {unknownEmail !== null && (
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="unknown-email-title"
            onClick={() => setUnknownEmail(null)}
            style={{position: 'fixed', inset: 0, backgroundColor: 'rgba(0, 0, 0, 0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1001, padding: '16px'}}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{...styles.card, maxWidth: '420px', width: '100%', marginBottom: 0, textAlign: 'center'}}
            >
              <h3 id="unknown-email-title">Adresse e-mail inconnue</h3>
              <p>Aucun compte client n'est associé à l'adresse <strong>{unknownEmail}</strong>.</p>
              <p style={{marginBottom: '20px'}}>Vérifiez l'orthographe de votre adresse ou créez votre compte en moins d'une minute.</p>
              <div style={{display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap'}}>
                <button
                  autoFocus
                  style={{...styles.btn, ...styles.btnPrimary}}
                  onClick={() => {
                    setClientRegistration({ ...EMPTY_CLIENT_REGISTRATION, email: unknownEmail });
                    setUnknownEmail(null);
                    setLoginForm({ email: '', password: '' });
                    setPage('register-client');
                  }}
                >
                  Créer mon compte
                </button>
                <button
                  style={{...styles.btn, ...styles.btnSecondary}}
                  onClick={() => {
                    setUnknownEmail(null);
                    setTimeout(() => {
                      const input = document.getElementById('login-email');
                      if (input) { input.focus(); input.select(); }
                    }, 0);
                  }}
                >
                  Corriger l'adresse
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderClientRegisterPage = () => {
    const handleChange = (e) => {
      const { name, value } = e.target;
      setClientRegistration(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
      e.preventDefault();
      const { lastName, firstName, email, phone, password } = clientRegistration;
      if (!lastName.trim() || !firstName.trim() || !email.trim() || !phone.trim() || !password) {
        notify('Remplissez tous les champs');
        return;
      }
      if (password.length < 6) {
        notify('Le mot de passe doit contenir au moins 6 caractères');
        return;
      }
      if (handleRegisterClient(clientRegistration)) {
        setClientRegistration(EMPTY_CLIENT_REGISTRATION);
      }
    };

    const fields = [
      { name: 'lastName', label: 'Nom', type: 'text', placeholder: 'Ex: Dupont', autoComplete: 'family-name' },
      { name: 'firstName', label: 'Prénom', type: 'text', placeholder: 'Ex: Marie', autoComplete: 'given-name' },
      { name: 'email', label: 'Email', type: 'email', placeholder: 'Ex: marie@email.fr', autoComplete: 'email' },
      { name: 'phone', label: 'Téléphone', type: 'tel', placeholder: 'Ex: 06 12 34 56 78', autoComplete: 'tel' },
      { name: 'password', label: 'Mot de passe', type: 'password', placeholder: 'Minimum 6 caractères', autoComplete: 'new-password' },
      ...(settings.referral.enabled
        ? [{ name: 'referralCode', label: 'Code de parrainage (facultatif)', type: 'text', placeholder: 'Ex: JULIE-AB12', autoComplete: 'off' }]
        : [])
    ];

    return (
      <div style={styles.container}>
        <div style={styles.header}>
          <img src={LOGO_SRC} alt="Rendez Vous" style={styles.logo} />
          <button style={{...styles.btn, ...styles.btnSecondary}} onClick={() => setPage('home')}>
            Retour
          </button>
        </div>
        <div style={{maxWidth: '400px', margin: isMobile ? '20px auto' : '40px auto'}}>
          <h2>Créer un compte client</h2>
          <form onSubmit={handleSubmit}>
            {fields.map(field => (
              <div key={field.name} style={{marginBottom: '10px'}}>
                <label style={{display: 'block'}}>{field.label}</label>
                <input
                  type={field.type}
                  name={field.name}
                  placeholder={field.placeholder}
                  autoComplete={field.autoComplete}
                  value={clientRegistration[field.name] || ''}
                  onChange={handleChange}
                  style={styles.input}
                  required={field.name !== 'referralCode'}
                />
              </div>
            ))}
            <button type="submit" style={{...styles.btn, ...styles.btnPrimary, width: '100%'}}>
              Créer mon compte
            </button>
          </form>
          <p style={{textAlign: 'center', marginTop: '15px', fontSize: '12px', color: '#666'}}>
            Déjà un compte ? <button style={{background: 'none', border: 'none', color: '#000', textDecoration: 'underline', cursor: 'pointer'}} onClick={() => setPage('login-client')}>Connexion</button>
          </p>
        </div>
      </div>
    );
  };

  // Prix d'une réservation, avec la réduction éventuelle
  const renderReservationPrice = (res) => {
    if (!res.price) return null;
    const original = formatPriceRange(res.price.min, res.price.max);
    if (!res.promo) return <p>Prix : {original}</p>;
    return (
      <p>
        Prix : <s>{original}</s> <strong>{formatPriceRange(res.finalPrice.min, res.finalPrice.max)}</strong>
        {' '}({res.promo.kind === 'parrainage' ? 'parrainage' : 'code'} {res.promo.code} : {describeDiscount(res.promo)})
      </p>
    );
  };

  const renderPaymentLabel = (res) =>
    res.paymentMethod === 'site' ? 'Sur le site (payé)' : 'À régler au prestataire';

  const renderClientReservationsPage = () => {
    if (!currentClient) return null;

    const myVouchers = promoCodes.filter(pc =>
      pc.clientId === currentClient.id && pc.status === 'active' && (pc.usedCount || 0) < (pc.maxUses || 1)
    );

    const now = Date.now();
    const myReservations = getClientReservations(currentClient.id);
    const upcoming = myReservations.filter(r => isActiveReservation(r) && r.at >= now).sort((a, b) => a.at - b.at);
    const past = myReservations.filter(r => isActiveReservation(r) && r.at < now).sort((a, b) => b.at - a.at);
    const cancelled = myReservations.filter(r => !isActiveReservation(r)).sort((a, b) => b.at - a.at);

    const findBookable = (r) => {
      const prestataire = prestataires.find(p => p.id === r.prestataire.id);
      const service = prestataire && prestataire.approved && prestataire.services.find(s => s.id === r.serviceId);
      return service ? { prestataire, service } : null;
    };

    const renderEditor = (res) => {
      const prestataire = res.prestataire;
      const times = getTimeOptions(prestataire.schedule, editingReservation.date);
      return (
        <div style={{backgroundColor: '#f6f6f6', borderRadius: '12px', padding: '12px', marginTop: '10px'}}>
          <p style={{fontWeight: 700}}>Choisissez un nouveau créneau</p>
          <input
            type="date"
            min={todayString()}
            value={editingReservation.date}
            onChange={(e) => {
              const { value } = e.target;
              setEditingReservation(prev => ({ ...prev, date: value, time: '' }));
            }}
            style={styles.input}
          />
          <select
            value={editingReservation.time}
            onChange={(e) => {
              const { value } = e.target;
              setEditingReservation(prev => ({ ...prev, time: value }));
            }}
            style={styles.input}
          >
            <option value="">{times.length === 0 ? 'Fermé ce jour-là' : 'Choisir une heure'}</option>
            {times.map(time => {
              const unavailable = isSlotBooked(prestataire, editingReservation.date, time, res.id)
                || appointmentDate(editingReservation.date, time).getTime() <= Date.now();
              return (
                <option key={time} value={time} disabled={unavailable}>
                  {time}{unavailable ? ' (indisponible)' : ''}
                </option>
              );
            })}
          </select>
          <div style={{display: 'flex', gap: '10px', flexWrap: 'wrap'}}>
            <button style={{...styles.btn, ...styles.btnPrimary}} onClick={handleSaveReservationChange}>
              Enregistrer le nouveau créneau
            </button>
            <button style={{...styles.btn, ...styles.btnSecondary}} onClick={() => setEditingReservation(null)}>
              Annuler la modification
            </button>
          </div>
        </div>
      );
    };

    return (
      <div style={styles.container}>
        <div style={styles.header}>
          <img src={LOGO_SRC} alt="Rendez Vous" style={styles.logo} />
          <div style={styles.nav}>
            <button style={{...styles.btn, ...styles.btnSecondary}} onClick={() => setPage('home')}>
              Retour
            </button>
            <button style={{...styles.btn, ...styles.btnSecondary}} onClick={handleLogout}>
              Déconnexion
            </button>
          </div>
        </div>
        {renderClientReminderBanner()}
        {renderSuggestions()}
        {settings.referral.enabled && (
          <div style={{...styles.card, backgroundColor: '#fff8e1'}}>
            <h3>Parrainage</h3>
            <p>Votre code de parrainage : <strong style={{fontSize: '18px'}}>{currentClient.referralCode}</strong></p>
            <p style={{fontSize: '13px', color: '#666'}}>
              Partagez-le : votre filleul obtient {describeDiscount(settings.referral.refereeReward)} sur sa première réservation,
              et vous recevez {describeDiscount(settings.referral.sponsorReward)} dès qu'il a réservé.
            </p>
          </div>
        )}

        {myVouchers.length > 0 && (
          <div style={styles.card}>
            <h3>Mes bons de réduction</h3>
            {myVouchers.map(v => (
              <p key={v.id}>
                <strong>{v.code}</strong> : {describeDiscount(v)} sur une réservation, chez le prestataire de votre choix
              </p>
            ))}
            <p style={{fontSize: '13px', color: '#666'}}>Saisissez le code au moment de réserver.</p>
          </div>
        )}

        <h2>Mes réservations</h2>
        <h3>À venir ({upcoming.length})</h3>
        {upcoming.length === 0 && <p style={{color: '#666', marginBottom: '15px'}}>Aucun rendez-vous à venir</p>}
        {upcoming.map(res => {
          const changeable = canClientChange(res);
          const isEditing = editingReservation && editingReservation.id === res.id;
          return (
            <div key={res.id} style={styles.card}>
              <h4>{res.serviceName}</h4>
              <p><strong>{res.prestataire.name}</strong> • {res.prestataire.city}</p>
              <p>📅 {formatDateLong(res.date)} à {normalizeTime(res.time)}</p>
              {res.modifiedAt && <p style={{fontSize: '13px', color: '#666'}}>Rendez-vous déplacé</p>}
              {renderReservationPrice(res)}
              <p>Paiement : {renderPaymentLabel(res)}</p>
              {isEditing ? renderEditor(res) : (
                <div style={{display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '10px'}}>
                  <button style={{...styles.btn, ...styles.btnSecondary}} onClick={() => downloadIcs(res, res.prestataire)}>
                    📅 Ajouter à mon agenda
                  </button>
                  {changeable && (
                    <>
                      <button
                        style={{...styles.btn, ...styles.btnWarning}}
                        onClick={() => setEditingReservation({ id: res.id, prestataireId: res.prestataire.id, date: res.date, time: normalizeTime(res.time) })}
                      >
                        Modifier
                      </button>
                      <button style={{...styles.btn, ...styles.btnDanger}} onClick={() => handleCancelReservation(res.prestataire, res)}>
                        Annuler
                      </button>
                    </>
                  )}
                </div>
              )}
              {!changeable && (
                <p style={{fontSize: '13px', color: '#666', marginTop: '10px'}}>
                  Moins de {CHANGE_DEADLINE_HOURS} h avant votre rendez-vous : pour le modifier ou l'annuler, contactez directement
                  le prestataire{res.prestataire.email ? <> : <a href={`mailto:${res.prestataire.email}`}>{res.prestataire.email}</a></> : ''}.
                </p>
              )}
            </div>
          );
        })}

        <div style={{...styles.card, backgroundColor: '#fafafa'}}>
          <h3>Prendre un nouveau rendez-vous</h3>
          <div style={{marginBottom: '10px'}}>
            {['Artisans', 'Beauté'].map(cat => (
              <button
                key={cat}
                style={{...styles.tab, ...(selectedCategory === cat ? styles.tabActive : {})}}
                onClick={() => { setSelectedCategory(cat); resetSearch(); }}
              >
                {cat}
              </button>
            ))}
          </div>
          {renderSearchBar('light')}
          {renderSearchResults()}
        </div>

        {past.length > 0 && (
          <>
            <h3>Passés ({past.length})</h3>
            {past.map(res => {
              const target = findBookable(res);
              return (
                <div key={res.id} style={{...styles.card, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', flexWrap: 'wrap'}}>
                  <div>
                    <h4 style={{margin: 0}}>{res.serviceName}</h4>
                    <p style={{margin: 0}}>{res.prestataire.name} • {formatDateLong(res.date)} à {normalizeTime(res.time)}</p>
                  </div>
                  {target && (
                    <button style={{...styles.btn, ...styles.btnPrimary}} onClick={() => rebook(target.prestataire, target.service)}>
                      Réserver à nouveau
                    </button>
                  )}
                </div>
              );
            })}
          </>
        )}

        {cancelled.length > 0 && (
          <>
            <h3>Annulés ({cancelled.length})</h3>
            {cancelled.map(res => (
              <p key={res.id} style={{color: '#888', fontSize: '14px'}}>
                <s>{res.serviceName} chez {res.prestataire.name} • {formatDateLong(res.date)} à {normalizeTime(res.time)}</s>
              </p>
            ))}
          </>
        )}
      </div>
    );
  };

  const renderConfirmationPage = () => {
    if (!lastConfirmation) return null;
    const { reservation, prestataire, reminder } = lastConfirmation;
    return (
      <div style={styles.container}>
        <div style={styles.header}>
          <img src={LOGO_SRC} alt="Rendez Vous" style={styles.logo} />
        </div>
        <div style={{maxWidth: '520px', margin: '30px auto', textAlign: 'center'}}>
          <div style={{fontSize: '48px'}}>✅</div>
          <h2>Réservation confirmée !</h2>
          <div style={{...styles.card, textAlign: 'left'}}>
            <h4>{reservation.serviceName}</h4>
            <p><strong>{prestataire.name}</strong> • {prestataire.city}</p>
            <p>📅 {formatDateLong(reservation.date)} à {normalizeTime(reservation.time)}</p>
            {renderReservationPrice(reservation)}
            <p>Paiement : {renderPaymentLabel(reservation)}</p>
          </div>
          {reminder === 'scheduled' && (
            <p>📧 Un e-mail de rappel vous sera envoyé à {reservation.clientEmail} 24 h avant le rendez-vous.</p>
          )}
          <p style={{fontSize: '14px', color: '#666', marginBottom: '20px'}}>
            Ajoutez le rendez-vous à votre agenda : votre téléphone vous le rappellera 24 h avant.
          </p>
          <div style={{display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap'}}>
            <button style={{...styles.btn, ...styles.btnPrimary}} onClick={() => downloadIcs(reservation, prestataire)}>
              📅 Ajouter à mon agenda
            </button>
            {currentClient && (
              <button style={{...styles.btn, ...styles.btnSecondary}} onClick={() => setPage('client-reservations')}>
                Mes réservations
              </button>
            )}
            <button style={{...styles.btn, ...styles.btnSecondary}} onClick={() => setPage('home')}>
              Retour à l'accueil
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderRegisterPage = () => {
    const handleChange = (e) => {
      const { name, value } = e.target;
      setRegistrationData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
      e.preventDefault();
      const { name, email, password, city } = registrationData;
      if (!registrationData.category) {
        notify('Choisissez votre catégorie : Beauté ou Artisans');
        return;
      }
      if (!name.trim() || !email.trim() || !password || !city.trim()) {
        notify('Remplissez tous les champs');
        return;
      }
      if (password.length < 6) {
        notify('Le mot de passe doit contenir au moins 6 caractères');
        return;
      }
      if (handleRegisterPrestataire({ ...registrationData, name: name.trim(), city: city.trim() })) {
        setRegistrationData({ name: '', city: '', email: '', password: '', category: '' });
      }
    };

    return (
      <div style={styles.container}>
        <div style={styles.header}>
          <img src={LOGO_SRC} alt="Rendez Vous" style={styles.logo} />
          <button style={{...styles.btn, ...styles.btnSecondary}} onClick={() => setPage('home')}>
            Retour
          </button>
        </div>
        <div style={{maxWidth: '400px', margin: isMobile ? '20px auto' : '40px auto'}}>
          <h2>Inscription Prestataire</h2>
          <form onSubmit={handleSubmit}>
            <div style={{marginBottom: '10px'}}>
              <label style={{...styles.label, display: 'block'}}>Nom du salon</label>
              <input
                name="name"
                placeholder="Ex: Salon Élégance"
                value={registrationData.name}
                onChange={handleChange}
                style={styles.input}
                required
              />
            </div>
            <div style={{marginBottom: '10px'}}>
              <label htmlFor="register-category" style={{display: 'block'}}>Votre activité</label>
              <select
                id="register-category"
                name="category"
                value={registrationData.category}
                onChange={handleChange}
                style={{...styles.input, color: registrationData.category ? '#000' : '#757575'}}
                required
              >
                <option value="" disabled>Choisissez votre activité…</option>
                <option value="Artisans" style={{color: '#000'}}>Artisans</option>
                <option value="Beauté" style={{color: '#000'}}>Beauté</option>
              </select>
            </div>
            <div style={{marginBottom: '10px'}}>
              <label style={{...styles.label, display: 'block'}}>Ville</label>
              <input
                name="city"
                placeholder="Ex: Paris"
                value={registrationData.city}
                onChange={handleChange}
                style={styles.input}
                required
              />
            </div>
            <div style={{marginBottom: '10px'}}>
              <label style={{...styles.label, display: 'block'}}>Email</label>
              <input
                type="email"
                name="email"
                placeholder="Ex: salon@email.fr"
                value={registrationData.email}
                onChange={handleChange}
                style={styles.input}
                required
              />
            </div>
            <div style={{marginBottom: '10px'}}>
              <label style={{...styles.label, display: 'block'}}>Mot de passe</label>
              <input
                type="password"
                name="password"
                placeholder="Minimum 6 caractères"
                value={registrationData.password}
                onChange={handleChange}
                style={styles.input}
                required
              />
            </div>
            <button type="submit" style={{...styles.btn, ...styles.btnPrimary, width: '100%'}}>
              S'inscrire
            </button>
          </form>
          <p style={{textAlign: 'center', marginTop: '15px', fontSize: '12px', color: '#666'}}>
            Déjà inscrit? <button style={{background: 'none', border: 'none', color: '#000', textDecoration: 'underline', cursor: 'pointer'}} onClick={() => setPage('login-prestataire')}>Connexion</button>
          </p>
        </div>
      </div>
    );
  };

  const renderPrestataireDetailPage = () => {
    if (!selectedPrestataire) return null;

    return (
      <div style={styles.container}>
        <div style={styles.header}>
          <img src={LOGO_SRC} alt="Rendez Vous" style={styles.logo} />
          <button style={{...styles.btn, ...styles.btnSecondary}} onClick={() => setPage('home')}>
            Retour
          </button>
        </div>

        <h2>{selectedPrestataire.name}</h2>
        <p>{selectedPrestataire.city} • {selectedPrestataire.category}</p>

        <h3>Services disponibles</h3>
        <div style={styles.grid}>
          {selectedPrestataire.services.map(service => (
            <div key={service.id} style={styles.card}>
              <h4>{service.name}</h4>
              <p style={{fontSize: '16px', fontWeight: 'bold'}}>
                {service.minPrice === service.maxPrice ? `${service.minPrice}€` : `de ${service.minPrice}€ à ${service.maxPrice}€`}
              </p>
              <button
                style={{...styles.btn, ...styles.btnPrimary, width: '100%'}}
                onClick={() => startReservation(service)}
              >
                Réserver
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderReservationPage = () => {
    if (!selectedService || !selectedPrestataire) return null;

    const updateReservationField = (field) => (e) => {
      const { value } = e.target;
      setReservationData(prev => ({
        ...prev,
        [field]: value,
        ...(field === 'selectedDate' ? { selectedTime: '' } : {})
      }));
    };

    const prestataireActuel = prestataires.find(p => p.id === selectedPrestataire.id) || selectedPrestataire;
    const timeOptions = getTimeOptions(prestataireActuel.schedule, reservationData.selectedDate);
    const isClosedThatDay = Boolean(reservationData.selectedDate) && timeOptions.length === 0;

    const promoContext = {
      prestataireId: selectedPrestataire.id,
      serviceId: selectedService.id,
      clientId: currentClient ? currentClient.id : null
    };
    const appliedCheck = appliedPromoCode ? checkPromoCode(appliedPromoCode, promoContext) : null;
    const appliedPromo = appliedCheck && appliedCheck.promo ? appliedCheck.promo : null;
    const originalPrice = formatPriceRange(selectedService.minPrice, selectedService.maxPrice);
    const discountedPrice = appliedPromo
      ? formatPriceRange(applyDiscount(selectedService.minPrice, appliedPromo), applyDiscount(selectedService.maxPrice, appliedPromo))
      : null;
    // Bons personnels du client connecté utilisables ici
    const usableVouchers = currentClient
      ? promoCodes.filter(pc => pc.clientId === currentClient.id && !checkPromoCode(pc.code, promoContext).error)
      : [];

    const applyPromo = (code) => {
      const check = checkPromoCode(code, promoContext);
      if (check.error) {
        notify(check.error);
        return;
      }
      setAppliedPromoCode(check.promo.code);
      setPromoInput(check.promo.code);
    };

    return (
      <div style={styles.container}>
        <div style={styles.header}>
          <img src={LOGO_SRC} alt="Rendez Vous" style={styles.logo} />
          <button style={{...styles.btn, ...styles.btnSecondary}} onClick={() => setPage('prestataire-detail')}>
            Retour
          </button>
        </div>

        <div style={{maxWidth: '600px', margin: '40px auto'}}>
          <h2>Réservation: {selectedService.name}</h2>
          <p>Chez: <strong>{selectedPrestataire.name}</strong></p>
          <p>
            Prix : {appliedPromo ? <><s>{originalPrice}</s> <strong>{discountedPrice}</strong></> : <strong>{originalPrice}</strong>}
          </p>

          <form onSubmit={(e) => {
            e.preventDefault();
            if (!checkAvailability(selectedPrestataire.id, reservationData.selectedDate, reservationData.selectedTime)) {
              notify('Ce créneau n\'est pas disponible');
              return;
            }
            processPayment(reservationData.paymentMethod);
          }}>
            <h3>Vos informations</h3>
            <input
              type="text"
              placeholder="Nom"
              value={reservationData.clientName}
              onChange={updateReservationField('clientName')}
              style={styles.input}
              required
            />
            <input
              type="text"
              placeholder="Prénom"
              value={reservationData.clientFirstName}
              onChange={updateReservationField('clientFirstName')}
              style={styles.input}
              required
            />
            <input
              type="email"
              placeholder="Email"
              value={reservationData.clientEmail}
              onChange={updateReservationField('clientEmail')}
              style={styles.input}
              required
            />
            <input
              type="tel"
              placeholder="Téléphone"
              value={reservationData.clientPhone}
              onChange={updateReservationField('clientPhone')}
              style={styles.input}
              required
            />

            <h3>Sélectionnez un créneau</h3>
            <input
              type="date"
              min={todayString()}
              value={reservationData.selectedDate}
              onChange={updateReservationField('selectedDate')}
              style={styles.input}
              required
            />
            <select
              value={reservationData.selectedTime}
              onChange={updateReservationField('selectedTime')}
              style={styles.input}
              required
            >
              <option value="">
                {!reservationData.selectedDate ? "Choisissez d'abord une date" : isClosedThatDay ? 'Fermé ce jour-là' : 'Choisir une heure'}
              </option>
              {timeOptions.map(time => {
                const booked = isSlotBooked(prestataireActuel, reservationData.selectedDate, time);
                return (
                  <option key={time} value={time} disabled={booked}>
                    {time}{booked ? ' (déjà réservé)' : ''}
                  </option>
                );
              })}
            </select>
            {isClosedThatDay && (
              <p style={{color: '#c0392b', fontSize: '13px', marginTop: '-5px'}}>
                Le prestataire est fermé ce jour-là, choisissez une autre date.
              </p>
            )}

            <h3>Code promo ou parrainage</h3>
            {appliedPromo ? (
              <div style={{...styles.card, backgroundColor: '#e8f5e9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', flexWrap: 'wrap'}}>
                <span>
                  ✓ Code <strong>{appliedPromo.code}</strong> appliqué : {describeDiscount(appliedPromo)}
                  {' '}→ <strong>{discountedPrice}</strong>
                </span>
                <button
                  type="button"
                  style={{...styles.btn, ...styles.btnSecondary}}
                  onClick={() => { setAppliedPromoCode(''); setPromoInput(''); }}
                >
                  Retirer
                </button>
              </div>
            ) : (
              <>
                <div style={{display: 'flex', gap: '10px', marginBottom: '10px'}}>
                  <input
                    type="text"
                    placeholder="Code promo (facultatif)"
                    value={promoInput}
                    onChange={(e) => setPromoInput(e.target.value)}
                    style={{...styles.input, marginBottom: '0', flex: 1, textTransform: 'uppercase'}}
                  />
                  <button
                    type="button"
                    style={{...styles.btn, ...styles.btnSecondary}}
                    onClick={() => applyPromo(promoInput)}
                  >
                    Appliquer
                  </button>
                </div>
                {usableVouchers.length > 0 && (
                  <p style={{fontSize: '13px'}}>
                    Vos bons disponibles :{' '}
                    {usableVouchers.map(v => (
                      <button
                        key={v.id}
                        type="button"
                        style={{...styles.btn, ...styles.btnWarning, padding: '4px 10px', marginRight: '5px'}}
                        onClick={() => applyPromo(v.code)}
                      >
                        {v.code} ({describeDiscount(v)})
                      </button>
                    ))}
                  </p>
                )}
              </>
            )}

            <h3>Paiement</h3>
            <p style={{marginBottom: '5px'}}>
              Vous réglez directement au prestataire, le jour du rendez-vous
              {appliedPromo ? ', réduction déduite' : ''}.
            </p>
            <p style={{fontSize: '12px', color: '#666', marginBottom: '20px'}}>Paiement en ligne : bientôt disponible.</p>

            <button type="submit" style={{...styles.btn, ...styles.btnPrimary, width: '100%'}}>
              Confirmer la réservation
            </button>
          </form>
        </div>
      </div>
    );
  };

  // Rappel côté prestataire : les rendez-vous du lendemain
  const renderTomorrowAppointments = (prestataire) => {
    const tomorrow = addDays(todayString(), 1);
    const list = (prestataire.reservations || [])
      .filter(r => isActiveReservation(r) && r.date === tomorrow)
      .sort((a, b) => toMinutes(a.time) - toMinutes(b.time));
    return (
      <div style={{...styles.card, backgroundColor: '#000', color: '#fff'}}>
        <h3 style={{color: '#fff'}}>📅 Rendez-vous de demain ({list.length})</h3>
        {list.length === 0 && <p style={{color: '#ccc', margin: 0}}>Aucun rendez-vous prévu demain.</p>}
        {list.map(r => (
          <p key={r.id} style={{margin: '0 0 4px'}}>
            <strong>{normalizeTime(r.time)}</strong> — {r.serviceName} • {r.clientFirstName} {r.clientName} • ☎️ {r.clientPhone}
          </p>
        ))}
      </div>
    );
  };

  const renderDashboardPage = () => {
    if (!currentPrestataire) return null;

    const prestataire = currentPrestataire;

    return (
      <div style={styles.container}>
        <div style={styles.header}>
          <img src={LOGO_SRC} alt="Rendez Vous" style={styles.logo} />
          <div style={styles.nav}>
            <span>
              <strong>{prestataire.name}</strong>{isAdmin ? ' (mode admin)' : ''}
              {' '}<span style={{...styles.badge, backgroundColor: '#f0f0f0', color: '#000'}}>{prestataire.category}</span>
            </span>
            {isAdmin && (
              <button
                style={{...styles.btn, ...styles.btnPrimary}}
                onClick={() => {
                  setManagedPrestataireId(null);
                  setEditingServiceId(null);
                  setEditingSchedule(false);
                  setSelectedServiceForPhotos(null);
                  setNewPhotosForService([]);
                  setPage('admin');
                }}
              >
                Panneau admin
              </button>
            )}
            <button style={{...styles.btn, ...styles.btnSecondary}} onClick={handleLogout}>
              Déconnexion
            </button>
          </div>
        </div>

        {renderTomorrowAppointments(prestataire)}

        <div style={{marginBottom: '20px', borderBottom: '1px solid #ddd', paddingBottom: '10px'}}>
          {['services', 'schedule', 'reservations', 'promos'].map(tab => (
            <button
              key={tab}
              style={{
                ...styles.tab,
                ...(dashboardTab === tab ? styles.tabActive : {})
              }}
              onClick={() => setDashboardTab(tab)}
            >
              {tab === 'services' && 'Services & Tarifs'}
              {tab === 'schedule' && 'Créneaux'}
              {tab === 'reservations' && 'Réservations'}
              {tab === 'promos' && 'Codes promo'}
            </button>
          ))}
        </div>

        {dashboardTab === 'services' && (
          <div>
            <h2>Grille tarifaire</h2>

            {/* Ajouter une prestation */}
            <div style={{...styles.card, marginBottom: '30px', backgroundColor: '#f9f9f9'}}>
              <h3>Ajouter une prestation</h3>
              <div style={{marginBottom: '10px'}}>
                <label style={styles.label}>Nom du service</label>
                <input
                  type="text"
                  placeholder="Ex: Coupe cheveux"
                  value={serviceName}
                  onChange={(e) => { setServiceName(e.target.value); setServiceSavedMessage(''); }}
                  style={{...styles.input, marginBottom: '0'}}
                />
              </div>
              <div style={{marginBottom: '10px', display: 'flex', gap: '10px'}}>
                <div style={{flex: 1}}>
                  <label style={styles.label}>Prix min (€)</label>
                  <input
                    type="number"
                    placeholder="30"
                    value={newServiceMinPrice}
                    onChange={(e) => setNewServiceMinPrice(e.target.value)}
                    style={{...styles.input, marginBottom: '0'}}
                  />
                </div>
                <div style={{flex: 1}}>
                  <label style={styles.label}>Prix max (€)</label>
                  <input
                    type="number"
                    placeholder="50"
                    value={newServiceMaxPrice}
                    onChange={(e) => setNewServiceMaxPrice(e.target.value)}
                    style={{...styles.input, marginBottom: '0'}}
                  />
                </div>
              </div>
              <button
                style={{...styles.btn, ...styles.btnPrimary}}
                onClick={handleAddService}
              >
                Enregistrer la prestation
              </button>
              {(serviceName.trim() || newServiceMinPrice || newServiceMaxPrice) && (
                <p style={{fontSize: '13px', color: '#c0392b', marginTop: '10px'}}>
                  Prestation non enregistrée : cliquez sur « Enregistrer la prestation » pour qu'elle apparaisse sur le site.
                </p>
              )}
              {serviceSavedMessage && <p style={styles.successText}>{serviceSavedMessage}</p>}
            </div>

            {/* Liste des prestations */}
            {prestataire.services && prestataire.services.length > 0 ? (
              <div>
                <h3>Vos prestations ({prestataire.services.length})</h3>
                {prestataire.services.map(service => (
                  <div key={service.id} style={{...styles.card, backgroundColor: '#f0f0f0', marginBottom: '20px'}}>
                    {editingServiceId === service.id ? (
                      <div style={{backgroundColor: '#fff8e1', padding: '15px', borderRadius: '3px', marginBottom: '15px'}}>
                        <h3>Modifier la prestation</h3>
                        <div style={{marginBottom: '10px'}}>
                          <label style={styles.label}>Nom du service</label>
                          <input
                            type="text"
                            value={editingService.name}
                            onChange={(e) => { const { value } = e.target; setEditingService(prev => ({ ...prev, name: value })); }}
                            style={{...styles.input, marginBottom: '0'}}
                          />
                        </div>
                        <div style={{marginBottom: '10px', display: 'flex', gap: '10px'}}>
                          <div style={{flex: 1}}>
                            <label style={styles.label}>Prix min (€)</label>
                            <input
                              type="number"
                              value={editingService.minPrice}
                              onChange={(e) => { const { value } = e.target; setEditingService(prev => ({ ...prev, minPrice: value })); }}
                              style={{...styles.input, marginBottom: '0'}}
                            />
                          </div>
                          <div style={{flex: 1}}>
                            <label style={styles.label}>Prix max (€)</label>
                            <input
                              type="number"
                              value={editingService.maxPrice}
                              onChange={(e) => { const { value } = e.target; setEditingService(prev => ({ ...prev, maxPrice: value })); }}
                              style={{...styles.input, marginBottom: '0'}}
                            />
                          </div>
                        </div>
                        <button
                          style={{...styles.btn, ...styles.btnPrimary, marginRight: '10px'}}
                          onClick={handleUpdateService}
                        >
                          Enregistrer
                        </button>
                        <button
                          style={{...styles.btn, ...styles.btnSecondary}}
                          onClick={() => {
                            setEditingServiceId(null);
                            setEditingService({ name: '', minPrice: '', maxPrice: '' });
                          }}
                        >
                          Annuler
                        </button>
                      </div>
                    ) : (
                      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'start'}}>
                        <div>
                          <h3>{service.name}</h3>
                          <p style={{margin: '5px 0'}}>
                            {service.minPrice === service.maxPrice
                              ? `${service.minPrice}€`
                              : `${service.minPrice}€ - ${service.maxPrice}€`}
                          </p>
                          {prestataire.approved ? (
                            <span style={{...styles.badge, backgroundColor: '#e8f5e9', color: '#1e7e34'}}>✓ Enregistrée, visible sur le site</span>
                          ) : (
                            <span style={{...styles.badge, backgroundColor: '#fff3cd', color: '#856404'}}>Enregistrée, visible après validation du compte</span>
                          )}
                        </div>
                        <div style={{display: 'flex', gap: '10px'}}>
                          <button
                            style={{...styles.btn, ...styles.btnWarning}}
                            onClick={() => handleEditService(service.id, service)}
                          >
                            Modifier
                          </button>
                          <button
                            style={{...styles.btn, ...styles.btnDanger}}
                            onClick={() => handleDeleteService(service.id)}
                          >
                            Supprimer
                          </button>
                        </div>
                      </div>
                    )}

                    {editingServiceId !== service.id && (
                      <>
                    {/* Photos du service */}
                    {service.photos && service.photos.length > 0 && (
                      <div style={{marginTop: '15px', paddingTop: '15px', borderTop: '1px solid #ddd'}}>
                        <h4>Photos</h4>
                        <div style={{display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '10px'}}>
                          {service.photos.map((photo, i) => (
                            <div key={i} style={{position: 'relative'}}>
                              <img src={photo} alt={`${service.name} ${i}`} style={{width: '100px', height: '100px', objectFit: 'cover', border: '1px solid #ddd', borderRadius: '3px'}} />
                              <button
                                style={{
                                  position: 'absolute',
                                  top: '2px',
                                  right: '2px',
                                  padding: '2px 5px',
                                  backgroundColor: '#ff6b6b',
                                  color: '#fff',
                                  border: 'none',
                                  borderRadius: '3px',
                                  cursor: 'pointer',
                                  fontSize: '10px'
                                }}
                                onClick={() => handleDeleteServicePhoto(service.id, i)}
                              >
                                ✕
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Ajouter des photos */}
                    <div style={{marginTop: '15px', paddingTop: '15px', borderTop: '1px solid #ddd'}}>
                      {selectedServiceForPhotos === service.id ? (
                        <div>
                          <label style={styles.label}>Charger des photos</label>
                          <input
                            type="file"
                            multiple
                            accept="image/*"
                            onChange={handlePhotoUploadForService}
                            style={{marginBottom: '10px', display: 'block'}}
                          />
                          {newPhotosForService.length > 0 && (
                            <div>
                              <p style={{fontSize: '14px', marginBottom: '10px'}}>📸 {newPhotosForService.length} photo(s) sélectionnée(s)</p>
                              <button
                                style={{...styles.btn, ...styles.btnPrimary, marginRight: '10px'}}
                                onClick={handleAddPhotosToService}
                              >
                                Ajouter les photos
                              </button>
                              <button
                                style={{...styles.btn, ...styles.btnSecondary}}
                                onClick={() => {
                                  setSelectedServiceForPhotos(null);
                                  setNewPhotosForService([]);
                                }}
                              >
                                Annuler
                              </button>
                            </div>
                          )}
                        </div>
                      ) : (
                        <button
                          style={{...styles.btn, ...styles.btnWarning}}
                          onClick={() => setSelectedServiceForPhotos(service.id)}
                        >
                          Ajouter des photos
                        </button>
                      )}
                    </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p style={{fontStyle: 'italic', color: '#666'}}>Aucune prestation ajoutée</p>
            )}
          </div>
        )}

        {dashboardTab === 'schedule' && (
          <div>
            <h2>Gestion des créneaux</h2>

            {!editingSchedule ? (
              <div>
                <div style={{...styles.card, marginBottom: '20px'}}>
                  <h3>Horaires actuels</h3>
                  {DAYS.map(({ key, label }) => (
                    <p key={key} style={{marginBottom: '10px'}}>
                      <strong>{label} :</strong> {formatDaySlots(prestataire.schedule?.[key])}
                    </p>
                  ))}
                </div>
                <button
                  style={{...styles.btn, ...styles.btnPrimary}}
                  onClick={() => {
                    setEditingSchedule(true);
                    setScheduleData(hasAnySlot(prestataire.schedule)
                      ? normalizeSchedule(prestataire.schedule)
                      : DEFAULT_SCHEDULE);
                  }}
                >
                  Modifier les horaires
                </button>
              </div>
            ) : (
              <div style={styles.card}>
                <h3>Modifier les horaires</h3>
                <p style={{fontSize: '13px', color: '#666', marginBottom: '15px'}}>
                  Ajoutez plusieurs plages pour une même journée (ex : 09:00 - 12:00 puis 14:00 - 18:00). Un jour sans plage est fermé.
                </p>
                {DAYS.map(({ key, label }) => {
                  const slots = scheduleData[key] || [];
                  const updateSlot = (index, field, value) => {
                    setScheduleData(prev => ({
                      ...prev,
                      [key]: (prev[key] || []).map((slot, i) => (i === index ? { ...slot, [field]: value } : slot))
                    }));
                  };
                  const removeSlot = (index) => {
                    setScheduleData(prev => ({
                      ...prev,
                      [key]: (prev[key] || []).filter((_, i) => i !== index)
                    }));
                  };
                  const addSlot = () => {
                    setScheduleData(prev => {
                      const current = prev[key] || [];
                      const last = current[current.length - 1];
                      // Nouvelle plage proposée juste après la précédente
                      const startMin = last && last.end ? Math.min(toMinutes(last.end) + 60, 22 * 60) : 9 * 60;
                      const endMin = Math.min(startMin + 4 * 60, 23 * 60);
                      return { ...prev, [key]: [...current, { start: fromMinutes(startMin), end: fromMinutes(endMin) }] };
                    });
                  };
                  return (
                    <div key={key} style={{marginBottom: '15px', paddingBottom: '15px', borderBottom: '1px solid #ddd'}}>
                      <label style={{display: 'block', fontWeight: 'bold'}}>{label}</label>
                      {slots.length === 0 && (
                        <p style={{fontSize: '13px', color: '#666', margin: '8px 0'}}>Fermé</p>
                      )}
                      {slots.map((slot, index) => (
                        <div key={index} style={{display: 'flex', gap: '10px', marginTop: '10px', alignItems: 'flex-end', flexWrap: isMobile ? 'wrap' : 'nowrap'}}>
                          <div style={{flex: 1, minWidth: '110px'}}>
                            <label style={{fontSize: '13px'}}>Début</label>
                            <input
                              type="time"
                              value={slot.start}
                              onChange={(e) => updateSlot(index, 'start', e.target.value)}
                              style={{...styles.input, marginBottom: '0'}}
                            />
                          </div>
                          <div style={{flex: 1, minWidth: '110px'}}>
                            <label style={{fontSize: '13px'}}>Fin</label>
                            <input
                              type="time"
                              value={slot.end}
                              onChange={(e) => updateSlot(index, 'end', e.target.value)}
                              style={{...styles.input, marginBottom: '0'}}
                            />
                          </div>
                          <button
                            type="button"
                            style={{...styles.btn, ...styles.btnDanger}}
                            onClick={() => removeSlot(index)}
                            aria-label={`Supprimer la plage ${index + 1} du ${label}`}
                          >
                            Supprimer
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        style={{...styles.btn, ...styles.btnSecondary, marginTop: '10px'}}
                        onClick={addSlot}
                      >
                        + Ajouter une plage
                      </button>
                    </div>
                  );
                })}
                <div style={{marginTop: '20px', display: 'flex', gap: '10px'}}>
                  <button
                    style={{...styles.btn, ...styles.btnPrimary, flex: 1}}
                    onClick={handleSaveSchedule}
                  >
                    Enregistrer
                  </button>
                  <button
                    style={{...styles.btn, ...styles.btnSecondary, flex: 1}}
                    onClick={() => setEditingSchedule(false)}
                  >
                    Annuler
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {dashboardTab === 'reservations' && (
          <div>
            <h2>Réservations</h2>
            {prestataire.reservations && prestataire.reservations.length > 0 ? (
              [...prestataire.reservations]
                .sort((a, b) => appointmentDate(a.date, a.time) - appointmentDate(b.date, b.time))
                .map(res => (
                <div key={res.id} style={{...styles.card, ...(isActiveReservation(res) ? {} : { opacity: 0.6 })}}>
                  <h4>
                    {res.serviceName}{' '}
                    {!isActiveReservation(res) && (
                      <span style={{...styles.badge, backgroundColor: '#f8d7da', color: '#721c24'}}>Annulé par le client</span>
                    )}
                    {isActiveReservation(res) && res.modifiedAt && (
                      <span style={{...styles.badge, backgroundColor: '#fff3cd', color: '#856404'}}>Déplacé par le client</span>
                    )}
                  </h4>
                  <p><strong>{res.clientFirstName} {res.clientName}</strong></p>
                  <p>📅 {formatDateLong(res.date)} à {normalizeTime(res.time)}</p>
                  {res.previousSlot && isActiveReservation(res) && (
                    <p style={{fontSize: '13px', color: '#666'}}>
                      Initialement le {formatDateLong(res.previousSlot.date)} à {normalizeTime(res.previousSlot.time)}
                    </p>
                  )}
                  <p>📧 {res.clientEmail} | ☎️ {res.clientPhone}</p>
                  {renderReservationPrice(res)}
                  <p style={{marginTop: '10px'}}>
                    Paiement : {renderPaymentLabel(res)}
                  </p>
                </div>
              ))
            ) : (
              <p>Aucune réservation pour le moment</p>
            )}
          </div>
        )}

        {dashboardTab === 'promos' && renderPrestatairePromos(prestataire)}
      </div>
    );
  };

  const promoStatusBadge = (promo) => {
    if (promo.status === 'active') {
      return <span style={{...styles.badge, backgroundColor: '#e8f5e9', color: '#1e7e34'}}>Actif</span>;
    }
    if (promo.status === 'pending') {
      return <span style={{...styles.badge, backgroundColor: '#fff3cd', color: '#856404'}}>En attente d'activation par l'admin</span>;
    }
    return <span style={{...styles.badge, backgroundColor: '#f8d7da', color: '#721c24'}}>Désactivé par l'admin</span>;
  };

  const describePromoRules = (promo, services) => {
    const rules = [];
    if (promo.serviceIds && promo.serviceIds.length > 0) {
      const names = promo.serviceIds
        .map(id => (services || []).find(s => s.id === id)?.name)
        .filter(Boolean);
      rules.push(`Prestations : ${names.length > 0 ? names.join(', ') : 'supprimées'}`);
    } else if (promo.kind === 'promo') {
      rules.push('Toutes les prestations');
    }
    if (promo.startDate || promo.endDate) {
      rules.push(`Valable ${promo.startDate ? `du ${promo.startDate} ` : ''}${promo.endDate ? `jusqu'au ${promo.endDate}` : ''}`.trim());
    }
    rules.push(`Utilisations : ${promo.usedCount || 0}${promo.maxUses ? ` / ${promo.maxUses}` : ''}`);
    if (promo.onePerClient && promo.kind === 'promo') rules.push('1 fois par client (compte requis)');
    return rules.join(' • ');
  };

  const renderPrestatairePromos = (prestataire) => {
    const myPromos = promoCodes.filter(pc => pc.kind === 'promo' && pc.prestataireId === prestataire.id);
    const updatePromoForm = (field, value) => setPromoForm(prev => ({ ...prev, [field]: value }));
    const toggleService = (serviceId) => setPromoForm(prev => ({
      ...prev,
      serviceIds: prev.serviceIds.includes(serviceId)
        ? prev.serviceIds.filter(id => id !== serviceId)
        : [...prev.serviceIds, serviceId]
    }));

    return (
      <div>
        <h2>Codes promo</h2>
        <p style={{fontSize: '13px', color: '#666', marginBottom: '15px'}}>
          Vos clients saisissent le code au moment de réserver. Un nouveau code doit être activé par l'administrateur avant de pouvoir être utilisé.
        </p>

        <div style={{...styles.card, marginBottom: '30px'}}>
          <h3>Créer un code</h3>
          <div style={{display: 'flex', gap: '10px', flexWrap: 'wrap'}}>
            <div style={{flex: 2, minWidth: '160px'}}>
              <label>Code</label>
              <input
                type="text"
                placeholder="Ex: BIENVENUE10"
                value={promoForm.code}
                onChange={(e) => updatePromoForm('code', e.target.value.toUpperCase())}
                style={styles.input}
              />
            </div>
            <div style={{flex: 1, minWidth: '120px'}}>
              <label>Type</label>
              <select value={promoForm.type} onChange={(e) => updatePromoForm('type', e.target.value)} style={styles.input}>
                <option value="percent">Pourcentage (%)</option>
                <option value="amount">Montant (€)</option>
              </select>
            </div>
            <div style={{flex: 1, minWidth: '100px'}}>
              <label>Réduction</label>
              <input
                type="number"
                placeholder={promoForm.type === 'percent' ? '10' : '5'}
                value={promoForm.value}
                onChange={(e) => updatePromoForm('value', e.target.value)}
                style={styles.input}
              />
            </div>
          </div>

          <label style={{display: 'block', marginBottom: '5px'}}>Prestations concernées (aucune cochée = toutes)</label>
          <div style={{display: 'flex', gap: '15px', flexWrap: 'wrap', marginBottom: '10px'}}>
            {prestataire.services.length === 0 && <span style={{fontSize: '13px', color: '#666'}}>Aucune prestation enregistrée</span>}
            {prestataire.services.map(service => (
              <label key={service.id} style={{cursor: 'pointer'}}>
                <input
                  type="checkbox"
                  checked={promoForm.serviceIds.includes(service.id)}
                  onChange={() => toggleService(service.id)}
                />
                {' '}{service.name}
              </label>
            ))}
          </div>

          <div style={{display: 'flex', gap: '10px', flexWrap: 'wrap'}}>
            <div style={{flex: 1, minWidth: '140px'}}>
              <label>Début (facultatif)</label>
              <input type="date" value={promoForm.startDate} onChange={(e) => updatePromoForm('startDate', e.target.value)} style={styles.input} />
            </div>
            <div style={{flex: 1, minWidth: '140px'}}>
              <label>Fin (facultatif)</label>
              <input type="date" value={promoForm.endDate} onChange={(e) => updatePromoForm('endDate', e.target.value)} style={styles.input} />
            </div>
            <div style={{flex: 1, minWidth: '140px'}}>
              <label>Utilisations max (facultatif)</label>
              <input
                type="number"
                placeholder="Illimité"
                value={promoForm.maxUses}
                onChange={(e) => updatePromoForm('maxUses', e.target.value)}
                style={styles.input}
              />
            </div>
          </div>

          <label style={{display: 'block', marginBottom: '15px', cursor: 'pointer'}}>
            <input
              type="checkbox"
              checked={promoForm.onePerClient}
              onChange={(e) => updatePromoForm('onePerClient', e.target.checked)}
            />
            {' '}Une seule utilisation par client (le client doit être connecté)
          </label>

          <button style={{...styles.btn, ...styles.btnPrimary}} onClick={handleCreatePromo}>
            Enregistrer le code
          </button>
        </div>

        <h3>Vos codes ({myPromos.length})</h3>
        {myPromos.length === 0 && <p style={{fontStyle: 'italic', color: '#666'}}>Aucun code pour le moment</p>}
        {myPromos.map(promo => (
          <div key={promo.id} style={{...styles.card, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', flexWrap: 'wrap'}}>
            <div>
              <h4 style={{margin: '0 0 5px'}}>{promo.code} <span style={{fontWeight: 'normal'}}>({describeDiscount(promo)})</span></h4>
              <p style={{fontSize: '13px', margin: '0 0 5px'}}>{describePromoRules(promo, prestataire.services)}</p>
              {promoStatusBadge(promo)}
            </div>
            <button style={{...styles.btn, ...styles.btnDanger}} onClick={() => handleDeletePromo(promo.id)}>
              Supprimer
            </button>
          </div>
        ))}
      </div>
    );
  };

  const renderAdminAccountForm = () => {
    if (!adminForm) return null;
    const { type, id, values } = adminForm;
    const isEdit = id != null;
    const update = (field) => (e) => {
      const { value } = e.target;
      setAdminForm(prev => ({ ...prev, values: { ...prev.values, [field]: value } }));
    };
    const fields = type === 'prestataire'
      ? [
          { name: 'name', label: 'Nom du salon', type: 'text' },
          { name: 'category', label: 'Catégorie', type: 'select', options: ['Beauté', 'Artisans'] },
          { name: 'city', label: 'Ville', type: 'text' },
          { name: 'email', label: 'Email', type: 'email' }
        ]
      : [
          { name: 'lastName', label: 'Nom', type: 'text' },
          { name: 'firstName', label: 'Prénom', type: 'text' },
          { name: 'email', label: 'Email', type: 'email' },
          { name: 'phone', label: 'Téléphone', type: 'tel' }
        ];

    return (
      <div style={{...styles.card, backgroundColor: '#fff8e1', marginBottom: '25px'}}>
        <h3>
          {isEdit ? 'Modifier' : 'Ajouter'} {type === 'prestataire' ? 'un prestataire' : 'un client'}
        </h3>
        <div style={{display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '0 15px'}}>
          {fields.map(field => (
            <div key={field.name}>
              <label>{field.label}</label>
              {field.type === 'select' ? (
                <select value={values[field.name]} onChange={update(field.name)} style={styles.input}>
                  {field.options.map(option => <option key={option}>{option}</option>)}
                </select>
              ) : (
                <input type={field.type} value={values[field.name]} onChange={update(field.name)} style={styles.input} />
              )}
            </div>
          ))}
          <div>
            <label>{isEdit ? 'Nouveau mot de passe (laisser vide pour ne pas changer)' : 'Mot de passe provisoire'}</label>
            <input type="text" value={values.password} onChange={update('password')} placeholder="Minimum 6 caractères" style={styles.input} />
          </div>
        </div>
        {!isEdit && type === 'prestataire' && (
          <p style={{fontSize: '13px', color: '#666'}}>Le prestataire est directement approuvé et visible sur le site dès qu'il a enregistré ses prestations.</p>
        )}
        <div style={{display: 'flex', gap: '10px', marginTop: '10px'}}>
          <button style={{...styles.btn, ...styles.btnPrimary}} onClick={handleSaveAdminForm}>
            Enregistrer
          </button>
          <button style={{...styles.btn, ...styles.btnSecondary}} onClick={() => setAdminForm(null)}>
            Annuler
          </button>
        </div>
      </div>
    );
  };

  const renderAdminPromos = () => {
    const referral = referralDraft || settings.referral;
    const editReferral = (updater) => setReferralDraft(prev => updater(prev || {
      ...settings.referral,
      refereeReward: { ...settings.referral.refereeReward },
      sponsorReward: { ...settings.referral.sponsorReward }
    }));
    const rewardEditor = (key, label) => (
      <div style={{flex: 1, minWidth: '220px'}}>
        <label>{label}</label>
        <div style={{display: 'flex', gap: '10px'}}>
          <input
            type="number"
            value={referral[key].value}
            onChange={(e) => {
              const { value } = e.target;
              editReferral(prev => ({ ...prev, [key]: { ...prev[key], value } }));
            }}
            style={{...styles.input, flex: 1}}
          />
          <select
            value={referral[key].type}
            onChange={(e) => {
              const { value } = e.target;
              editReferral(prev => ({ ...prev, [key]: { ...prev[key], type: value } }));
            }}
            style={{...styles.input, width: '90px'}}
          >
            <option value="percent">%</option>
            <option value="amount">€</option>
          </select>
        </div>
      </div>
    );

    const sortedPromos = [...promoCodes].sort((a, b) => {
      const order = { pending: 0, active: 1, disabled: 2 };
      return (order[a.status] ?? 3) - (order[b.status] ?? 3);
    });

    return (
      <>
        <div style={{...styles.card, marginBottom: '30px'}}>
          <h3>Programme de parrainage</h3>
          <label style={{display: 'block', marginBottom: '15px', cursor: 'pointer'}}>
            <input
              type="checkbox"
              checked={referral.enabled}
              onChange={(e) => {
                const { checked } = e.target;
                editReferral(prev => ({ ...prev, enabled: checked }));
              }}
            />
            {' '}<strong>Activer le parrainage</strong> (chaque client reçoit un code à partager)
          </label>
          <div style={{display: 'flex', gap: '15px', flexWrap: 'wrap'}}>
            {rewardEditor('refereeReward', 'Réduction offerte au filleul (1re réservation)')}
            {rewardEditor('sponsorReward', 'Réduction offerte au parrain (après la 1re réservation du filleul)')}
          </div>
          <p style={{fontSize: '13px', color: '#666'}}>
            Ces réductions sont valables chez tous les prestataires et réglées sur place : elles sont à la charge de la plateforme.
          </p>
          {referralDraft && (
            <div style={{display: 'flex', gap: '10px'}}>
              <button style={{...styles.btn, ...styles.btnPrimary}} onClick={handleSaveReferralSettings}>
                Enregistrer les réglages
              </button>
              <button style={{...styles.btn, ...styles.btnSecondary}} onClick={() => setReferralDraft(null)}>
                Annuler
              </button>
            </div>
          )}
        </div>

        <h3>Codes ({promoCodes.length})</h3>
        {sortedPromos.length === 0 && <p style={{fontStyle: 'italic', color: '#666'}}>Aucun code pour le moment</p>}
        <div style={styles.grid}>
          {sortedPromos.map(promo => {
            const owner = promo.prestataireId != null
              ? prestataires.find(p => p.id === promo.prestataireId)
              : null;
            const client = promo.clientId != null ? clients.find(c => c.id === promo.clientId) : null;
            return (
              <div key={promo.id} style={styles.card}>
                <h4 style={{margin: '0 0 5px'}}>{promo.code} <span style={{fontWeight: 'normal'}}>({describeDiscount(promo)})</span></h4>
                <p style={{fontSize: '13px', margin: '0 0 5px'}}>
                  {promo.kind === 'parrainage'
                    ? `Bon de parrainage pour ${client ? `${client.firstName} ${client.lastName}` : 'un client supprimé'}`
                    : `Prestataire : ${owner ? owner.name : 'supprimé'}`}
                </p>
                <p style={{fontSize: '13px', margin: '0 0 8px'}}>{describePromoRules(promo, owner?.services)}</p>
                {promoStatusBadge(promo)}
                <div style={{display: 'flex', gap: '10px', marginTop: '10px', flexWrap: 'wrap'}}>
                  {promo.status !== 'active' && (
                    <button style={{...styles.btn, ...styles.btnPrimary, flex: 1}} onClick={() => setPromoStatus(promo.id, 'active')}>
                      Activer
                    </button>
                  )}
                  {promo.status === 'active' && (
                    <button style={{...styles.btn, ...styles.btnSecondary, flex: 1}} onClick={() => setPromoStatus(promo.id, 'disabled')}>
                      Désactiver
                    </button>
                  )}
                  <button style={{...styles.btn, ...styles.btnDanger, flex: 1}} onClick={() => handleDeletePromo(promo.id)}>
                    Supprimer
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </>
    );
  };

  const renderAdminPage = () => {
    if (!currentUser || currentUser.role !== 'admin') return null;

    const pendingPromos = promoCodes.filter(pc => pc.status === 'pending').length;

    return (
      <div style={styles.container}>
        <div style={styles.header}>
          <img src={LOGO_SRC} alt="Rendez Vous" style={styles.logo} />
          <button style={{...styles.btn, ...styles.btnSecondary}} onClick={handleLogout}>
            Déconnexion
          </button>
        </div>

        <h2>Panneau Administrateur</h2>

        <div style={{marginBottom: '20px', borderBottom: '1px solid #ddd', paddingBottom: '10px'}}>
          {[
            ['prestataires', `Prestataires (${prestataires.length})`],
            ['clients', `Clients (${clients.length})`],
            ['promos', `Codes promo & parrainage${pendingPromos > 0 ? ` (${pendingPromos} à activer)` : ''}`]
          ].map(([tab, label]) => (
            <button
              key={tab}
              style={{...styles.tab, ...(adminTab === tab ? styles.tabActive : {})}}
              onClick={() => { setAdminTab(tab); setAdminForm(null); }}
            >
              {label}
            </button>
          ))}
        </div>

        {adminTab === 'prestataires' && (
          <>
            {adminForm && adminForm.type === 'prestataire' ? renderAdminAccountForm() : (
              <button style={{...styles.btn, ...styles.btnPrimary, marginBottom: '20px'}} onClick={() => openAdminForm('prestataire')}>
                + Ajouter un prestataire
              </button>
            )}
            <div style={{marginBottom: '20px'}}>
              {['En attente', 'Approuvé', 'Tous'].map(label => (
                <button
                  key={label}
                  style={{
                    ...styles.tab,
                    ...(adminFilter === label ? styles.tabActive : {})
                  }}
                  onClick={() => setAdminFilter(label)}
                >
                  {label}
                </button>
              ))}
            </div>

            <div style={styles.grid}>
              {prestataires
                .filter(p => {
                  if (adminFilter === 'En attente') return !p.approved;
                  if (adminFilter === 'Approuvé') return p.approved;
                  return true;
                })
                .map(p => (
                  <div key={p.id} style={styles.card}>
                    <h3>{p.name}</h3>
                    <p>{p.city} • {p.category}</p>
                    <p><strong>Email:</strong> {p.email}</p>
                    <p><strong>Status:</strong> {p.approved ? 'Approuvé' : 'En attente'}</p>
                    <p><strong>Services:</strong> {p.services.length}</p>
                    <p><strong>Réservations:</strong> {p.reservations.length}</p>

                    <div style={{display: 'flex', gap: '10px', marginTop: '10px', flexWrap: 'wrap'}}>
                      {!p.approved && (
                        <button
                          style={{...styles.btn, ...styles.btnPrimary, flex: 1}}
                          onClick={() => handleApprovePrestataire(p.id)}
                        >
                          Approuver
                        </button>
                      )}
                      <button
                        style={{...styles.btn, ...styles.btnSecondary, flex: 1}}
                        onClick={() => openAdminForm('prestataire', p)}
                      >
                        Modifier
                      </button>
                      <button
                        style={{...styles.btn, ...styles.btnWarning, flex: 1}}
                        onClick={() => {
                          setManagedPrestataireId(p.id);
                          setDashboardTab('services');
                          setPage('dashboard');
                        }}
                      >
                        Gérer
                      </button>
                      <button
                        style={{...styles.btn, ...styles.btnDanger, flex: 1}}
                        onClick={() => {
                          if (p.approved) {
                            askConfirm(`Supprimer définitivement ${p.name} ?`, () => handleRejectPrestataire(p.id));
                          } else {
                            handleRejectPrestataire(p.id);
                          }
                        }}
                      >
                        {p.approved ? 'Supprimer' : 'Rejeter'}
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </>
        )}

        {adminTab === 'clients' && (adminForm && adminForm.type === 'client' ? renderAdminAccountForm() : (
          <button style={{...styles.btn, ...styles.btnPrimary, marginBottom: '20px'}} onClick={() => openAdminForm('client')}>
            + Ajouter un client
          </button>
        ))}

        {adminTab === 'clients' && (
          clients.length > 0 ? (
            <div style={styles.grid}>
              {clients.map(c => {
                const reservationsCount = prestataires.reduce(
                  (total, p) => total + (p.reservations || []).filter(r => r.clientId === c.id).length,
                  0
                );
                return (
                  <div key={c.id} style={styles.card}>
                    <h3>{c.firstName} {c.lastName}</h3>
                    <p><strong>Email:</strong> {c.email}</p>
                    <p><strong>Téléphone:</strong> {c.phone}</p>
                    <p><strong>Réservations:</strong> {reservationsCount}</p>
                    {settings.referral.enabled && <p><strong>Code parrainage:</strong> {c.referralCode}</p>}
                    <button
                      style={{...styles.btn, ...styles.btnSecondary, width: '100%', marginTop: '10px'}}
                      onClick={() => openAdminForm('client', c)}
                    >
                      Modifier
                    </button>
                    <button
                      style={{...styles.btn, ...styles.btnDanger, width: '100%', marginTop: '10px'}}
                      onClick={() => {
                        askConfirm(`Supprimer le compte de ${c.firstName} ${c.lastName} ?`, () => {
                          setClients(prev => prev.filter(client => client.id !== c.id));
                        });
                      }}
                    >
                      Supprimer le compte
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <p>Aucun compte client pour le moment</p>
          )
        )}

        {adminTab === 'promos' && renderAdminPromos()}
      </div>
    );
  };

  // Routing
  const renderPage = () => {
    switch (page) {
      case 'home': return renderHomePage();
      case 'login-client': return renderLoginPage('client');
      case 'login-prestataire': return renderLoginPage('prestataire');
      case 'register-prestataire': return renderRegisterPage();
      case 'register-client': return renderClientRegisterPage();
      case 'client-reservations': return renderClientReservationsPage() || renderHomePage();
      case 'prestataire-detail': return renderPrestataireDetailPage() || renderHomePage();
      case 'reservation': return renderReservationPage() || renderHomePage();
      case 'reservation-confirmed': return renderConfirmationPage() || renderHomePage();
      case 'dashboard': return renderDashboardPage() || renderHomePage();
      case 'admin': return renderAdminPage() || renderHomePage();
      default: return renderHomePage();
    }
  };

  return (
    <div className="rv-app">
      <style>{GLOBAL_CSS}</style>
      {renderPage()}

      <div
        role="status"
        aria-live="polite"
        style={{
          position: 'fixed',
          left: '50%',
          bottom: '24px',
          transform: 'translateX(-50%)',
          zIndex: 1000,
          maxWidth: 'calc(100% - 32px)',
          width: 'max-content',
          pointerEvents: toast ? 'auto' : 'none'
        }}
      >
        {toast && (
          <div
            key={toast.id}
            className="rv-toast"
            onClick={() => setToast(null)}
            style={{
              backgroundColor: '#000',
              color: '#fff',
              padding: '14px 20px',
              borderRadius: '14px',
              boxShadow: '0 10px 30px rgba(0, 0, 0, 0.25)',
              fontWeight: 600,
              whiteSpace: 'pre-line',
              cursor: 'pointer'
            }}
          >
            {toast.message}
          </div>
        )}
      </div>

      {showInstallHelp && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="install-help-title"
          onClick={() => setShowInstallHelp(false)}
          style={{position: 'fixed', inset: 0, backgroundColor: 'rgba(0, 0, 0, 0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1001, padding: '16px'}}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{...styles.card, maxWidth: '400px', width: '100%', marginBottom: 0}}
          >
            <div style={{textAlign: 'center'}}>
              <img src={`${process.env.PUBLIC_URL}/apple-touch-icon.png`} alt="" width="72" height="72" style={{borderRadius: '16px', boxShadow: '0 2px 10px rgba(0,0,0,0.12)'}} />
              <h3 id="install-help-title" style={{marginTop: '12px'}}>Installer Rendez Vous</h3>
            </div>
            <ol style={{paddingLeft: '20px', lineHeight: 1.7, marginBottom: '20px'}}>
              <li>Ouvrez ce site dans <strong>Safari</strong>.</li>
              <li>Touchez le bouton <strong>Partager</strong> (le carré avec une flèche vers le haut).</li>
              <li>Choisissez <strong>« Sur l'écran d'accueil »</strong>.</li>
              <li>Touchez <strong>« Ajouter »</strong> : l'icône Rendez Vous apparaît avec vos applications.</li>
            </ol>
            <div style={{textAlign: 'center'}}>
              <button autoFocus style={{...styles.btn, ...styles.btnPrimary}} onClick={() => setShowInstallHelp(false)}>
                J'ai compris
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmDialog && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setConfirmDialog(null)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1001,
            padding: '16px'
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{...styles.card, maxWidth: '400px', width: '100%', marginBottom: 0, textAlign: 'center'}}
          >
            <p style={{fontSize: '16px', fontWeight: 700, marginBottom: '20px'}}>{confirmDialog.message}</p>
            <div style={{display: 'flex', gap: '10px', justifyContent: 'center'}}>
              <button autoFocus style={{...styles.btn, ...styles.btnSecondary}} onClick={() => setConfirmDialog(null)}>
                Annuler
              </button>
              <button
                style={{...styles.btn, ...styles.btnDanger}}
                onClick={() => {
                  const { onConfirm } = confirmDialog;
                  setConfirmDialog(null);
                  onConfirm();
                }}
              >
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RendezVousV6;