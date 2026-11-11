-- =====================================================================================
-- Rendez Vous : espace privé « sauvegardes » pour les exports CSV quotidiens
--
-- À exécuter UNE FOIS dans Supabase : SQL Editor › New query › coller ce fichier › Run.
--
-- Chaque nuit, .github/workflows/sauvegarde-csv.yml lit les tables du site avec la clé secrète et dépose un
-- fichier CSV par table dans cet espace (un dossier par jour, 30 jours conservés).
-- L'espace est PRIVÉ et sans règle d'accès : seule la clé secrète (et vous, depuis le tableau de bord Supabase)
-- peut lire ces fichiers. Les visiteurs et les comptes du site n'y ont aucun accès.
-- =====================================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('sauvegardes', 'sauvegardes', false, 52428800, array['text/csv'])
on conflict (id) do update
  set public = false,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;
