-- ============================================================
-- Aula Catto — Varios docentes, etapa 4: aceptación de las condiciones
-- El alta de profesor exige aceptar las condiciones de uso y la política
-- de privacidad (/aula/condiciones) y guarda cuándo se aceptaron.
-- Va en una transacción. Se puede correr más de una vez.
-- ============================================================
begin;

alter table perfil add column if not exists condiciones_aceptadas timestamptz;

drop function if exists solicitar_alta_profesor(text, text);
create or replace function solicitar_alta_profesor(p_nombre text, p_apellido text, p_acepta boolean)
returns void
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if auth.uid() is null then raise exception 'Hace falta iniciar sesión.'; end if;
  if p_acepta is not true then
    raise exception 'Para pedir la cuenta hay que aceptar las condiciones de uso y la política de privacidad.';
  end if;
  if exists (select 1 from perfil where id = auth.uid()) then
    raise exception 'Esta cuenta ya tiene un perfil en el Aula.';
  end if;
  if coalesce(trim(p_nombre), '') = '' or coalesce(trim(p_apellido), '') = '' then
    raise exception 'Faltan el nombre o el apellido.';
  end if;
  insert into perfil (id, rol, estado, nombre, apellido, condiciones_aceptadas)
  values (auth.uid(), 'profesor', 'pendiente', trim(p_nombre), trim(p_apellido), now());
end $$;
revoke all on function solicitar_alta_profesor(text, text, boolean) from public, anon;
grant execute on function solicitar_alta_profesor(text, text, boolean) to authenticated;

commit;
notify pgrst, 'reload schema';
select pg_get_function_identity_arguments(oid) as solicitar_alta_profesor from pg_proc
where proname = 'solicitar_alta_profesor' and pronamespace = 'public'::regnamespace;
