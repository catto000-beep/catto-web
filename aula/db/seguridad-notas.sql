-- ============================================================
-- Aula Catto — Candado de notas (correr ANTES de abrir a estudiantes)
-- Impide que un estudiante modifique la nota / concepto / comentario del
-- profesor aunque manipule la API. Solo el profesor puede calificar.
-- Ejecutar en Supabase → SQL Editor → pegar TODO → Run. Idempotente.
-- ============================================================
create or replace function proteger_notas()
returns trigger
language plpgsql security definer
set search_path = public, pg_temp
as $$
begin
  if not es_profesor() then
    -- El estudiante no puede tocar lo que califica el profesor:
    new.nota_num            := old.nota_num;
    new.nota_concepto       := old.nota_concepto;
    new.comentario_profesor := old.comentario_profesor;
    -- ni marcar su entrega como "calificada":
    if new.estado = 'calificado' and old.estado <> 'calificado' then
      new.estado := old.estado;
    end if;
  end if;
  return new;
end $$;

drop trigger if exists trg_proteger_notas on entrega;
create trigger trg_proteger_notas
  before update on entrega
  for each row execute function proteger_notas();
