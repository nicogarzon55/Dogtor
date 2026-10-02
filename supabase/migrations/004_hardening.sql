-- =============================================================================
-- Dogtor · Ajustes del asesor de seguridad de Supabase
-- =============================================================================
-- Las funciones de trigger no deben poder invocarse por /rest/v1/rpc. Postgres
-- solo verifica EXECUTE al crear el trigger, así que revocarlo no los afecta.
revoke execute on function public.crear_perfil_nuevo_usuario() from public, anon, authenticated;
revoke execute on function public.proteger_rol_perfil() from public, anon, authenticated;
revoke execute on function public.proteger_aprobacion_refugio() from public, anon, authenticated;
revoke execute on function public.validar_cita() from public, anon, authenticated;
revoke execute on function public.registrar_fecha_adopcion() from public, anon, authenticated;

-- search_path fijo en las funciones que no lo tenían.
alter function public.duracion_franja() set search_path = '';
alter function public.registrar_fecha_adopcion() set search_path = '';

-- rol_actual, es_personal_clinica y refugio_aprobado_de se mantienen
-- ejecutables: las políticas RLS se evalúan con el rol de quien consulta y
-- solo devuelven información sobre el propio usuario.
