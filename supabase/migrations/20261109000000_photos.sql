-- =====================================================================================
-- Rendez Vous : stockage des photos des prestations (Supabase Storage)
--
-- À exécuter UNE FOIS dans Supabase : SQL Editor › New query › coller ce fichier › Run.
-- (Le script de création 20261014000000_init.sql doit avoir été exécuté avant.)
--
-- Les photos sont réduites par le site avant l'envoi (environ 200 Ko chacune) et rangées dans
-- l'espace « photos », un dossier par prestataire : photos/<id du prestataire>/<nom>.jpg
-- Tout le monde peut les voir (elles sont publiques, comme sur une vitrine) ; seuls le
-- prestataire propriétaire et les administrateurs peuvent en ajouter ou en supprimer.
-- =====================================================================================

-- Espace de stockage public, 2 Mo maximum par fichier, images seulement
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('photos', 'photos', true, 2097152, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Vrai si l'utilisateur connecté peut gérer les photos du dossier (= id du prestataire)
create or replace function public.can_manage_prestataire_photos(p_folder text)
returns boolean language sql stable security definer set search_path = public as $$
  select public.is_admin()
    or exists (select 1 from public.prestataires where id::text = p_folder and owner_id = auth.uid());
$$;
revoke execute on function public.can_manage_prestataire_photos(text) from public;
grant execute on function public.can_manage_prestataire_photos(text) to authenticated;

-- Règles d'accès aux fichiers de l'espace « photos »
-- (lecture publique par l'adresse de la photo ; ces règles concernent l'ajout et la suppression)
drop policy if exists "Photos : lecture par le prestataire" on storage.objects;
create policy "Photos : lecture par le prestataire" on storage.objects
  for select to authenticated
  using (bucket_id = 'photos' and public.can_manage_prestataire_photos((storage.foldername(name))[1]));

drop policy if exists "Photos : ajout par le prestataire" on storage.objects;
create policy "Photos : ajout par le prestataire" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'photos' and public.can_manage_prestataire_photos((storage.foldername(name))[1]));

drop policy if exists "Photos : suppression par le prestataire" on storage.objects;
create policy "Photos : suppression par le prestataire" on storage.objects
  for delete to authenticated
  using (bucket_id = 'photos' and public.can_manage_prestataire_photos((storage.foldername(name))[1]));
