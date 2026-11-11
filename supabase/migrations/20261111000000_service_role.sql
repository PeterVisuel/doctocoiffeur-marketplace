-- =====================================================================================
-- Rendez Vous : droits du compte technique « service_role » (clé secrète)
--
-- À exécuter UNE FOIS dans Supabase : SQL Editor › New query › coller ce fichier › Run.
--
-- La clé secrète (sb_secret_… ou l'ancienne service_role) est utilisée uniquement par la fonction serveur
-- api/admin-users.js (création / suppression de comptes par un administrateur). Le projet a été créé avec
-- l'option « exposer automatiquement les nouvelles tables » désactivée : les tables n'ont donc reçu aucun droit
-- pour service_role, et Supabase répondait « 403 » (permission refusée) à la fonction serveur.
-- =====================================================================================

grant usage on schema public to service_role;
grant select, insert, update, delete on all tables in schema public to service_role;
grant usage, select on all sequences in schema public to service_role;
