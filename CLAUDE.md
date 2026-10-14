# Rendez Vous (doctocoiffeur-marketplace)

Marketplace de prise de rendez-vous entre clients et prestataires (catégories **Beauté** et **Artisans**).
Application React (Create React App), déployée automatiquement sur **Vercel** : chaque PR reçoit un lien Preview
et la fusion dans `main` met le site en production.

Langue : l'interface, les messages de commit et les descriptions de PR sont **en français**.

## Architecture

- L'interface est dans `src/App.js` : un seul composant `RendezVousV6`.
- **Base de données Supabase** (PostgreSQL + Auth, projet hébergé à Londres) depuis la PR #8 :
  - `supabase/migrations/20261014000000_init.sql` : tables (`profiles`, `prestataires`, `reservations`, `promo_codes`,
    `settings`), règles RLS, déclencheurs de protection, fonctions RPC et salons de démonstration. Toute évolution du
    schéma = **nouveau fichier** de migration (à exécuter dans le SQL Editor), ne pas modifier l'ancien.
  - `src/supabaseClient.js` : client Supabase (`REACT_APP_SUPABASE_URL`, `REACT_APP_SUPABASE_ANON_KEY`, variables
    Vercel de type Config : la clé anon est publique). Sans elles, le site affiche « Site en cours de configuration ».
    Flux `implicit` pour que les liens e-mail marchent sur un autre appareil.
  - `src/dataService.js` : toutes les lectures / écritures, et conversion snake_case (SQL) ↔ camelCase (site).
  - Les règles métier sensibles sont **dans la base** (fonctions `SECURITY DEFINER`) : `book_reservation` (prix recalculé,
    créneau unique, code promo, parrainage), `cancel_reservation` / `move_reservation` (règle des 24 h, heure de Paris),
    `check_promo`, `booked_slots`, `email_status`. Le navigateur n'est jamais cru sur parole.
  - Un compte = un utilisateur Supabase Auth + une ligne `profiles` (rôle `client`, `prestataire` ou `admin`) créée par
    le déclencheur `handle_new_user` à partir des métadonnées d'inscription (jamais `admin`). Un prestataire a en plus
    une ligne `prestataires` (`owner_id`).
  - Admins : désignés en SQL (`update public.profiles set role = 'admin' where email in (…)`), plusieurs possibles.
    Plus d'identifiants admin dans le code.
- `api/admin-users.js` (fonction Vercel) : l'admin crée / supprime des comptes avec la clé `SUPABASE_SERVICE_ROLE_KEY`
  (variable Vercel de type **Secret**, jamais dans le code ni dans le navigateur). Sans elle : 501 et message à l'écran.
- Guide de mise en service : `docs/SUPABASE.md`.
- Navigation : un état `page` et un `switch` dans `renderPage()` (pas de routeur).
- Autre fonction serveur : `api/reminders.js` (fonction Vercel) qui programme / annule chez **Resend** l'e-mail de
  rappel envoyé 24 h avant un rendez-vous. Variables d'environnement Vercel : `RESEND_API_KEY` et `REMINDER_FROM`
  (expéditeur sur un domaine vérifié chez Resend). Sans elles, la fonction répond 501 et le site fonctionne sans e-mail
  (en local avec `npm start` / `serve`, `/api` n'existe pas : même comportement).
- Le logo est le fichier `public/logo-rendez-vous.jpg` ; dans le code, utiliser `LOGO_SRC`.
- **Application installable (PWA)** : `public/manifest.json`, icônes générées depuis le logo (`icon-192.png`,
  `icon-512.png`, `icon-maskable-512.png`, `apple-touch-icon.png`, `favicon.ico`) et `public/service-worker.js`
  (enregistré dans `src/index.js`, en production seulement). Le service worker sert les pages en réseau d'abord et les
  fichiers statiques depuis le cache ; il ne met jamais `/api/` ni Supabase en cache (hors connexion : l'interface
  s'affiche mais les données ne chargent pas). Après une modification du service worker,
  incrémenter `CACHE_VERSION`.

## Règles à respecter (bugs déjà rencontrés)

- **Ne jamais déclarer de composant à l'intérieur de `RendezVousV6`** puis l'utiliser en `<Page />` : il serait recréé
  à chaque rendu et les champs de saisie perdraient le curseur à chaque frappe. Les pages sont des fonctions de rendu
  appelées directement (`renderHomePage()`, `renderDashboardPage()`…) et ne doivent pas contenir de hooks.
- **Ne pas utiliser `alert()` ni `window.confirm()`** : ils bloquent le navigateur et dégradent l'INP (signalé par Vercel).
  Utiliser `notify(message)` (notification en bas d'écran) et `askConfirm(message, onConfirm)` (fenêtre intégrée).
- Mises à jour d'état fonctionnelles (`setX(prev => …)`) ; pour modifier le prestataire courant, passer par
  `updateCurrentPrestataire(p => …)` (qui enregistre aussi dans la base). Le prestataire courant est toujours relu
  depuis la liste (`currentPrestataire`). Après une action en base, recharger avec `reloadData(currentUser)`.
- `index.css` impose `button { margin: 10px }` : annulé par `.rv-app button { margin: 0 }` dans `GLOBAL_CSS`.
- Une réservation annulée garde `status: 'cancelled'` (elle n'est pas supprimée) : filtrer avec `isActiveReservation`
  partout où l'on compte ou bloque des créneaux (`isSlotBooked` le fait déjà).
- Typographie française : espace insécable (`\u00a0`) avant « : » et « ! » dans les titres.

## Décisions produit (validées lors des PR #1 à #3)

- **Devanture** : seulement « Connexion Client » et « Connexion Prestataire ». « Créer un compte client » n'est
  accessible que depuis la page Connexion Client.
- **Admin** : pas de bouton admin. Un compte dont le profil a le rôle `admin` (désigné en SQL, 2 admins ou plus
  possibles) qui se connecte (« Connexion Prestataire » ou « Connexion Client ») a l'accès admin complet : prestataires (approuver, ajouter, modifier, gérer leur tableau de bord, supprimer),
  clients (ajouter, modifier, supprimer), codes promo et parrainage.
- **Inscription prestataire** : « Votre activité » est une **liste déroulante obligatoire** (Artisans / Beauté),
  sans valeur présélectionnée. Un prestataire inscrit est « En attente » jusqu'à l'approbation de l'admin :
  il peut se connecter et préparer son salon (bandeau « Compte en attente de validation »), mais le salon n'est
  visible sur le site qu'après approbation. Un prestataire créé par l'admin est directement approuvé.
- **Horaires** : plusieurs plages par jour (`schedule[jour] = [{ start, end }, …]`) ; les heures proposées au client
  suivent ces plages (créneaux d'1 h), les créneaux déjà réservés sont grisés, pas de date passée.
- **Prestations** : bouton « Enregistrer la prestation » avec confirmation et badge de visibilité sur le site.
- **Paiement en ligne : non développé pour l'instant.** Le client paie sur place (« Paiement en ligne : bientôt disponible »).
  Piste retenue pour plus tard : Stripe Checkout via des fonctions serveur Vercel (`api/`), clé `STRIPE_SECRET_KEY`
  dans les variables d'environnement Vercel (jamais dans le code), acompte fixé par le prestataire pour les prix en
  fourchette, et seulement après le passage à une base de données.
- **Codes promo** : créés par le prestataire (onglet « Codes promo » : % ou €, prestations ciblées, dates,
  utilisations max, 1 fois par client) ; un code n'est utilisable **qu'après activation par l'admin**.
- **Parrainage** : activé et réglé par l'admin (réduction filleul / parrain). Le filleul reçoit un bon à l'inscription,
  le parrain après la première réservation du filleul. Réductions réglées sur place, à la charge de la plateforme.
- **Compte obligatoire pour réserver** (PR #8) : sans connexion, la page de réservation propose de se connecter ou de
  créer un compte, puis la réservation reprend là où elle en était.
- **Mot de passe oublié** (client et prestataire) : lien « Mot de passe oublié ? » sur les pages de connexion, e-mail
  Supabase, page « Nouveau mot de passe ».
- **Confirmation d'e-mail** : gérée par le site mais **désactivée pour l'instant** dans Supabase (Authentication ›
  Sign In / Providers › Email › Confirm email). À activer quand un SMTP personnalisé (Resend) sera configuré.
- **Salons de démonstration** (Salon Élégance, Studio Artisan) conservés, sans compte propriétaire.
- **Design** : rester en **noir et blanc** (police Nunito, coins arrondis, boutons en pastille, ombres légères).
- **Accueil** : onglets **Beauté avant Artisans**. Titre « Trouvez votre prochain rendez-vous, peu importe le domaine : c'est ici ! ». Recherche par ville,
  par nom ou **par domaine** (libellé « Par domaine » : recherche dans les noms de prestations, sans tenir compte des
  accents ; les prestations trouvées sont mises en avant).
- **Connexion client** : on distingue « e-mail inconnu » (fenêtre « Adresse e-mail inconnue » avec « Créer mon compte »,
  e-mail pré-rempli, ou « Corriger l'adresse ») et « Mot de passe incorrect. Vérifiez-le et réessayez. ».
- **Page Connexion Prestataire** : encadré « Vous souhaitez élargir votre activité ? « Rendez Vous » est la plateforme
  faite pour vous. Centralisez vos rendez-vous et vos rappels en un seul lieu. »
- **Mes réservations** : rendez-vous à venir / passés / annulés, recherche pour prendre un nouveau rendez-vous sans
  revenir à l'accueil, « Réserver à nouveau » sur les rendez-vous passés.
- **Suggestions « Pour vous »** (client connecté, accueil et Mes réservations) : A. renouveler le dernier rendez-vous,
  B. créneau habituel (même jour et même heure au moins 2 fois → prochain créneau libre), C. rythme habituel
  (intervalle moyen entre les rendez-vous passés).
- **Rappels 24 h avant** : sans serveur, fichier agenda `.ics` avec alarme 24 h avant (« Ajouter à mon agenda »),
  bandeau de rappel pour le client et « Rendez-vous de demain » pour le prestataire ; avec serveur, e-mail programmé
  via Resend (`api/reminders.js`), annulé ou reprogrammé quand le client annule ou déplace.
- **Modifier / annuler** : le client peut déplacer ou annuler **jusqu'à 24 h avant** (`CHANGE_DEADLINE_HOURS`) ;
  ensuite il doit contacter le prestataire. Une annulation libère le créneau et rend le code promo utilisé.
- **Application installable** : icône = logo Rendez Vous sur fond blanc. Sur l'accueil, simple lien discret
  « 📲 Installer l'application Rendez Vous » sous le pied de page (pas un troisième bouton à côté des deux connexions),
  visible seulement si l'installation est possible : invite du navigateur sur Android / ordinateur, fenêtre
  d'explication sur iPhone (Partager › Sur l'écran d'accueil) et sur Android sans invite, par ex. Firefox
  (Menu ⋮ › Installer l'application), masqué une fois l'application installée (mémorisé dans le navigateur).

## Historique

- V6.6 : version de départ.
- PR #1 : correction de la perte de curseur dans les champs, fiabilisation (stockage, validations, double réservation).
- PR #2 : comptes clients, plusieurs créneaux par jour, logo agrandi, devanture simplifiée, admin via connexion prestataire.
- PR #3 : codes promo et parrainage, comptes créés par l'admin, paiement en ligne retiré, design plus convivial,
  correction INP (notifications au lieu d'`alert()`), activité obligatoire à l'inscription prestataire.
- PR #4 : ajout de ce fichier.
- PR #5 : recherche par prestation, e-mail inconnu à la connexion, nouveaux textes, Mes réservations enrichi,
  suggestions « Pour vous », rappels 24 h avant (agenda + e-mail Resend), modification / annulation jusqu'à 24 h avant.
- PR #6 : application installable (PWA) avec le logo, fonctionnement hors connexion, logo sorti du code.
- PR #7 : « Par prestation » renommé « Par domaine ».
- PR #8 : base de données Supabase (comptes, réservations, codes promo partagés entre appareils, règles vérifiées par
  la base), mot de passe oublié, compte obligatoire pour réserver, Beauté avant Artisans, création de comptes par
  l'admin via `api/admin-users.js`.
- PR #9 : aide à l'installation sur Android quand le navigateur ne propose pas d'invite (Firefox…).

## Prochaines étapes envisagées

1. ~~Base de données partagée~~ et 2. ~~authentification côté serveur~~ : faits (PR #8, Supabase).
   Reste : SMTP personnalisé (Resend) pour les e-mails Supabase, puis activer la confirmation d'e-mail.
3. Applications App Store / Google Play avec Capacitor (même code React), notifications push pour les rappels,
   suppression de compte dans l'application et politique de confidentialité (exigés par Apple / Google) ; après 1 et 2.
4. Paiement en ligne (Stripe), puis éventuellement Stripe Connect pour reverser aux prestataires.
5. Durée par prestation, e-mail de confirmation à la réservation, rappels SMS.
6. Protéger `api/reminders.js` contre les abus (limitation de débit, vérification de la réservation côté serveur) :
   maintenant possible avec la base de données.

## Vérifier une modification

```bash
npm ci                            # le package-lock.json est de nouveau synchronisé (PR #8)
CI=true npx react-scripts build   # le plugin ESLint du build fonctionne à nouveau
```

- `src/App.test.js` est le test par défaut de CRA (« learn react ») et ne teste pas l'application.
- Tester les parcours dans un vrai navigateur (Playwright) : saisie sans perte de curseur, réservation, codes promo,
  admin, mot de passe oublié, installabilité (CDP `Page.getInstallabilityErrors`) et mode hors connexion.
- `*.supabase.co` n'est pas joignable depuis l'environnement Claude Code : pour tester, monter une pile locale
  (PostgreSQL 16 + PostgREST + un faux GoTrue minimal qui imite `/auth/v1`), exécuter la migration, puis builder avec
  `REACT_APP_SUPABASE_URL=http://localhost:…`. Sinon, tester sur le Preview Vercel. Il n'y a plus de comptes de
  démonstration : créer un compte, et le passer admin en SQL si besoin.
