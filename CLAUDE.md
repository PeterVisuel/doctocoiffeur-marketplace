# Rendez Vous (doctocoiffeur-marketplace)

Marketplace de prise de rendez-vous entre clients et prestataires (catégories **Beauté** et **Artisans**).
Application React (Create React App), déployée automatiquement sur **Vercel** : chaque PR reçoit un lien Preview
et la fusion dans `main` met le site en production.

Langue : l'interface, les messages de commit et les descriptions de PR sont **en français**.

## Architecture

- Quasiment tout le code est dans `src/App.js` : un seul composant `RendezVousV6`.
- **Pas de backend ni de base de données** : toutes les données sont dans le `localStorage` du navigateur de chaque visiteur.
  - `rendez_v6_prestataires` : prestataires, avec leurs services, horaires (`schedule`) et réservations
  - `rendez_v6_clients` : comptes clients (avec `referralCode`, `referredBy`, `sponsorRewarded`)
  - `rendez_v6_promos` : codes promo et bons de parrainage
  - `rendez_v6_settings` : réglages de la plateforme (programme de parrainage)
- Les données anciennes sont normalisées au chargement (`normalizePrestataire`, `normalizeSchedule`, `loadClients`) :
  garder cette compatibilité quand on change un format.
- Navigation : un état `page` et un `switch` dans `renderPage()` (pas de routeur).
- Le logo est une image JPEG en base64 (`LOGO_BASE64`, ligne 3, très longue) ; utiliser `LOGO_SRC`.
  Ne pas lire `src/App.js` d'un seul bloc : la ligne 3 fait ~105 ko.

## Règles à respecter (bugs déjà rencontrés)

- **Ne jamais déclarer de composant à l'intérieur de `RendezVousV6`** puis l'utiliser en `<Page />` : il serait recréé
  à chaque rendu et les champs de saisie perdraient le curseur à chaque frappe. Les pages sont des fonctions de rendu
  appelées directement (`renderHomePage()`, `renderDashboardPage()`…) et ne doivent pas contenir de hooks.
- **Ne pas utiliser `alert()` ni `window.confirm()`** : ils bloquent le navigateur et dégradent l'INP (signalé par Vercel).
  Utiliser `notify(message)` (notification en bas d'écran) et `askConfirm(message, onConfirm)` (fenêtre intégrée).
- Mises à jour d'état fonctionnelles (`setX(prev => …)`) ; pour modifier le prestataire courant, passer par
  `updateCurrentPrestataire(p => …)`. Le prestataire courant est toujours relu depuis la liste (`currentPrestataire`).
- `index.css` impose `button { margin: 10px }` : annulé par `.rv-app button { margin: 0 }` dans `GLOBAL_CSS`.

## Décisions produit (validées lors des PR #1 à #3)

- **Devanture** : seulement « Connexion Client » et « Connexion Prestataire ». « Créer un compte client » n'est
  accessible que depuis la page Connexion Client.
- **Admin** : pas de bouton admin. Les identifiants listés dans `ADMIN_ACCOUNTS` saisis dans « Connexion Prestataire »
  donnent l'accès admin complet : prestataires (approuver, ajouter, modifier, gérer leur tableau de bord, supprimer),
  clients (ajouter, modifier, supprimer), codes promo et parrainage.
- **Inscription prestataire** : « Votre activité » est une **liste déroulante obligatoire** (Artisans / Beauté),
  sans valeur présélectionnée. Un prestataire inscrit est « En attente » jusqu'à l'approbation de l'admin
  (l'approbation vaut aussi validation de l'email). Un prestataire créé par l'admin est directement approuvé.
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
- **Design** : rester en **noir et blanc** (police Nunito, coins arrondis, boutons en pastille, ombres légères).

## Historique

- V6.6 : version de départ.
- PR #1 : correction de la perte de curseur dans les champs, fiabilisation (stockage, validations, double réservation).
- PR #2 : comptes clients, plusieurs créneaux par jour, logo agrandi, devanture simplifiée, admin via connexion prestataire.
- PR #3 : codes promo et parrainage, comptes créés par l'admin, paiement en ligne retiré, design plus convivial,
  correction INP (notifications au lieu d'`alert()`), activité obligatoire à l'inscription prestataire.

## Prochaines étapes envisagées

1. **Base de données partagée** (ex. Supabase) : aujourd'hui les réservations, comptes et codes ne sont pas partagés
   entre appareils et ne sont vérifiés que dans le navigateur. Prérequis à toute mise en service réelle.
2. Authentification côté serveur (les mots de passe, y compris admin, sont aujourd'hui en clair dans le navigateur / le code).
3. Paiement en ligne (Stripe), puis éventuellement Stripe Connect pour reverser aux prestataires.
4. Durée par prestation, emails de confirmation.

## Vérifier une modification

```bash
npm install --no-package-lock     # package-lock.json est désynchronisé (yaml manquant) : `npm ci` échoue
DISABLE_ESLINT_PLUGIN=true CI=true npx react-scripts build
npx eslint --no-eslintrc --parser-options=ecmaVersion:2022,sourceType:module,ecmaFeatures:{jsx:true} \
  --config node_modules/eslint-config-react-app/index.js src/App.js
```

- Le plugin ESLint du build échoue sans lockfile à jour (« Environment key "jest/globals" is unknown ») : d'où
  `DISABLE_ESLINT_PLUGIN=true` et le lint lancé séparément.
- `src/App.test.js` est le test par défaut de CRA (« learn react ») et ne teste pas l'application.
- Tester les parcours dans un vrai navigateur (Playwright) : saisie sans perte de curseur, réservation, codes promo,
  admin. Comptes de démonstration : prestataire `elegance@salon.fr` / `pass123`, admin `admin123` / `admin123`.
