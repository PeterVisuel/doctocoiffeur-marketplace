-- =====================================================================================
-- Rendez Vous : le salon (et l'admin) peut annuler ou déplacer un rendez-vous
--
-- À exécuter UNE FOIS dans Supabase : SQL Editor › New query › coller ce fichier › Run.
--
-- Avant : seul le client pouvait annuler / déplacer (jusqu'à 24 h avant), et l'admin.
-- Maintenant : le prestataire propriétaire du salon peut aussi le faire, sans la règle des 24 h
-- (par exemple quand un client téléphone), mais seulement pour un rendez-vous pas encore passé.
-- On mémorise qui a annulé (cancelled_by) et qui a déplacé (modified_by) : client, prestataire ou admin.
-- =====================================================================================

alter table public.reservations add column if not exists modified_by text;

-- Rôle de l'utilisateur connecté vis-à-vis d'une réservation : 'admin', 'prestataire', 'client' ou null
create or replace function public.reservation_actor(r public.reservations)
returns text language sql stable security definer set search_path = public as $$
  select case
    when public.is_admin() then 'admin'
    when exists (select 1 from public.prestataires p where p.id = r.prestataire_id and p.owner_id = auth.uid()) then 'prestataire'
    when r.client_id = auth.uid() then 'client'
  end;
$$;
revoke execute on function public.reservation_actor(public.reservations) from public, anon;

-- Annuler un rendez-vous
create or replace function public.cancel_reservation(p_id text)
returns jsonb language plpgsql volatile security definer set search_path = public as $$
declare
  r public.reservations;
  actor text;
begin
  select * into r from public.reservations where id = p_id for update;
  actor := case when r.id is null then null else public.reservation_actor(r) end;
  if actor is null then
    raise exception 'Réservation introuvable';
  end if;
  if r.status = 'cancelled' then return jsonb_build_object('reminder_email_id', null); end if;
  if actor = 'client' and public.appointment_at(r.date, r.time) - now() <= interval '24 hours' then
    raise exception 'Moins de 24 h avant votre rendez-vous : contactez directement le prestataire.';
  end if;
  if actor <> 'client' and public.appointment_at(r.date, r.time) <= now() then
    raise exception 'Ce rendez-vous est déjà passé';
  end if;
  update public.reservations
    set status = 'cancelled', cancelled_at = now(), cancelled_by = actor, reminder_email_id = null
    where id = r.id;
  perform public.release_promo(r);
  return jsonb_build_object('reminder_email_id', r.reminder_email_id);
end;
$$;

-- Déplacer un rendez-vous
create or replace function public.move_reservation(p_id text, p_date date, p_time text)
returns jsonb language plpgsql volatile security definer set search_path = public as $$
declare
  r public.reservations;
  p public.prestataires;
  actor text;
begin
  select * into r from public.reservations where id = p_id for update;
  actor := case when r.id is null then null else public.reservation_actor(r) end;
  if actor is null or r.status = 'cancelled' then
    raise exception 'Réservation introuvable';
  end if;
  if actor = 'client' and public.appointment_at(r.date, r.time) - now() <= interval '24 hours' then
    raise exception 'Moins de 24 h avant votre rendez-vous : contactez directement le prestataire.';
  end if;
  if actor <> 'client' and public.appointment_at(r.date, r.time) <= now() then
    raise exception 'Ce rendez-vous est déjà passé';
  end if;
  if p_time !~ '^[0-2][0-9]:[0-5][0-9]$' or public.appointment_at(p_date, p_time) <= now() then
    raise exception 'Ce créneau n''est pas disponible';
  end if;
  select * into p from public.prestataires where id = r.prestataire_id;
  if not public.slot_in_schedule(p.schedule, p_date, p_time) then
    raise exception 'Ce créneau n''est pas disponible';
  end if;
  begin
    update public.reservations
      set date = p_date, time = p_time, modified_at = now(), modified_by = actor,
          previous_slot = jsonb_build_object('date', r.date, 'time', r.time), reminder_email_id = null
      where id = r.id;
  exception when unique_violation then
    raise exception 'Ce créneau n''est pas disponible';
  end;
  return jsonb_build_object('reminder_email_id', r.reminder_email_id);
end;
$$;

-- Mémoriser l'e-mail de rappel programmé : aussi permis au salon (après un déplacement fait par le salon)
create or replace function public.set_reservation_reminder(p_id text, p_email_id text)
returns void language sql volatile security definer set search_path = public as $$
  update public.reservations r set reminder_email_id = p_email_id
  where r.id = p_id and public.reservation_actor(r) is not null;
$$;
