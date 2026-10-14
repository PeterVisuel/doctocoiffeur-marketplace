# Mise en service de la base de données Supabase

À faire **une seule fois**, dans l'ordre. Rien de secret n'est à mettre dans GitHub ni à envoyer dans une conversation.

## 1. Créer les tables (Supabase)

1. Supabase › votre projet › **SQL Editor** › **New query**.
2. Copier tout le contenu de `supabase/migrations/20261014000000_init.sql` (dans GitHub : ouvrir le fichier › bouton
   « Copy raw file »), le coller, puis **Run**.
3. Résultat attendu : « Success. No rows returned ». Dans **Table Editor**, on voit `profiles`, `prestataires`
   (avec Salon Élégance et Studio Artisan), `reservations`, `promo_codes`, `settings`.

## 2. Désactiver la confirmation d'e-mail (pour l'instant)

**Authentication › Sign In / Providers › Email** : décocher **Confirm email** › Save.
Le site sait déjà gérer la confirmation : il suffira de recocher la case plus tard (voir étape 6).

## 3. Adresses du site (liens « mot de passe oublié »)

**Authentication › URL Configuration** :

- **Site URL** : l'adresse de production, par ex. `https://doctocoiffeur-marketplace.vercel.app`
- **Redirect URLs** › Add URL :
  - `https://doctocoiffeur-marketplace.vercel.app/**`
  - les liens Preview : copier l'adresse d'un Preview Vercel, par ex.
    `https://doctocoiffeur-marketplace-git-xxx-votre-equipe.vercel.app`, et remplacer la partie qui change par `*` :
    `https://doctocoiffeur-marketplace-*-votre-equipe.vercel.app/**`. Éviter `https://*.vercel.app/**`, trop large
    (n'importe quel site Vercel pourrait recevoir les liens de connexion).

## 4. Clé secrète pour la gestion des comptes par l'admin (Vercel)

Nécessaire seulement pour que l'admin **crée** ou **supprime** des comptes depuis le site.

1. Supabase › **Project Settings › API Keys** : copier la clé **service_role** (ou « secret », `sb_secret_…`).
2. Vercel › projet › **Settings › Environment Variables** › Add :
   - Name : `SUPABASE_SERVICE_ROLE_KEY`
   - Value : la clé copiée
   - Type : **Secret** (Production et Preview)
3. Redéployer (Deployments › … › Redeploy) pour qu'elle soit prise en compte.

Cette clé donne tous les droits sur la base : ne jamais la mettre dans le code, dans GitHub ou dans une conversation.

Rappel des autres variables : `REACT_APP_SUPABASE_URL` et `REACT_APP_SUPABASE_ANON_KEY` (type Config, déjà faites) ;
`RESEND_API_KEY` (Secret) et `REMINDER_FROM` pour les e-mails de rappel.

## 5. Désigner les administrateurs

1. Chaque futur admin crée un compte normal sur le site (« Connexion Client » › « Créer un compte client »).
2. Supabase › **SQL Editor** :

   ```sql
   update public.profiles set role = 'admin'
   where email in ('premier.admin@exemple.fr', 'second.admin@exemple.fr');
   ```

3. Se déconnecter / reconnecter sur le site : le panneau admin apparaît.

On peut avoir autant d'admins que voulu. Pour retirer un admin : `update public.profiles set role = 'client' where email = '…';`

## 6. E-mails envoyés par Supabase (mot de passe oublié, confirmation)

Sans réglage, Supabase n'envoie ses e-mails **qu'aux adresses des membres de l'équipe Supabase** du projet, avec une
limite de quelques e-mails par heure. Pour tester « Mot de passe oublié » tout de suite, utilisez une adresse membre de
l'équipe (la vôtre). Pour les vrais clients, configurer un SMTP personnalisé :

**Project Settings › Authentication › SMTP Settings** › Enable custom SMTP, avec Resend (domaine vérifié) :
hôte `smtp.resend.com`, port `465`, utilisateur `resend`, mot de passe = une clé API Resend, expéditeur sur le domaine
vérifié. Ensuite seulement, réactiver « Confirm email » si souhaité.

## 7. Vérifier sur le lien Preview

- [ ] Accueil : Beauté avant Artisans, les deux salons de démonstration apparaissent dans la recherche.
- [ ] Réserver sans être connecté : le site demande de se connecter ou de créer un compte, puis reprend la réservation.
- [ ] La réservation apparaît dans Supabase (Table Editor › `reservations`) et dans « Mes réservations ».
- [ ] Ouvrir le site sur un **autre appareil** avec le même compte : la réservation y est aussi.
- [ ] Créneau réservé grisé pour un autre client.
- [ ] Inscription prestataire : « Compte en attente de validation », salon invisible tant que l'admin n'a pas approuvé.
- [ ] Admin : approuver le salon, activer un code promo, régler le parrainage, créer / supprimer un compte (étape 4).
- [ ] Mot de passe oublié (avec une adresse membre de l'équipe Supabase tant que le SMTP n'est pas configuré).
- [ ] Modifier / annuler un rendez-vous (jusqu'à 24 h avant).
