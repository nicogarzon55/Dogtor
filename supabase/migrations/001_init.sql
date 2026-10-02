-- =============================================================================
-- Dogtor · Migración inicial (iteración 1: autenticación, citas y adopción)
-- =============================================================================
-- Cómo aplicarla: Supabase → SQL Editor → pegar este archivo completo → Run.
-- Es idempotente solo en las extensiones; ejecútala una vez sobre un proyecto
-- vacío. Después ejecuta 002_storage.sql y, si quieres datos de ejemplo,
-- 003_seed.sql.
--
-- Requerimientos cubiertos:
--   Seguridad (RNF)  Contraseñas cifradas (Supabase Auth) y RLS por rol.
--   REQ-AGC-01       Franjas disponibles calculadas desde los turnos.
--   REQ-AGC-02       Restricción EXCLUDE que impide cruces de agenda.
--   REQ-AGC-04       Cancelación / reprogramación con antelación mínima.
--   REQ-AGC-05       Doctores filtrables por especialidad.
--   REQ-AGC-07       Motivo de consulta obligatorio.
--   REQ-AGC-08       Historial de citas por propietario.
--   REQ-DOC-01/02/03/05  Datos base de doctores, turnos, sedes 24h, bloqueos.
--   REQ-ADO-01..05   Refugios aprobados publican mascotas con estado.
-- =============================================================================

create extension if not exists btree_gist with schema extensions;

-- ----------------------------------------------------------------------------
-- Tipos
-- ----------------------------------------------------------------------------

create type public.rol_usuario as enum (
  'propietario', 'doctor', 'admin_clinica', 'admin_refugio', 'adoptante', 'admin_sistema'
);
create type public.especialidad as enum (
  'medicina_general', 'cirugia', 'dermatologia', 'odontologia', 'urgencias'
);
create type public.especie as enum ('perro', 'gato', 'ave', 'roedor', 'otro');
create type public.sexo as enum ('macho', 'hembra');
create type public.tamano as enum ('pequeno', 'mediano', 'grande');
create type public.tipo_consulta as enum ('control', 'vacunacion', 'urgencia', 'cirugia');
create type public.estado_cita as enum ('programada', 'atendida', 'cancelada', 'reprogramada');
create type public.motivo_bloqueo as enum ('vacaciones', 'incapacidad', 'permiso', 'otro');
create type public.estado_adopcion as enum ('disponible', 'en_proceso', 'adoptada');

-- ----------------------------------------------------------------------------
-- Perfiles (1:1 con auth.users)
-- ----------------------------------------------------------------------------

create table public.perfiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  nombre      text not null default '',
  apellido    text not null default '',
  telefono    text,
  rol         public.rol_usuario not null default 'propietario',
  -- Habeas Data (Ley 1581 de 2012): fecha en que aceptó el tratamiento de datos.
  acepto_tratamiento_datos_en timestamptz,
  creado_en   timestamptz not null default now()
);

-- Rol del usuario autenticado. SECURITY DEFINER para poder usarlo dentro de
-- las políticas RLS sin recursión.
create or replace function public.rol_actual()
returns public.rol_usuario
language sql stable security definer set search_path = ''
as $$
  select rol from public.perfiles where id = auth.uid()
$$;

create or replace function public.es_personal_clinica()
returns boolean
language sql stable security definer set search_path = ''
as $$
  select coalesce(public.rol_actual() in ('doctor', 'admin_clinica', 'admin_sistema'), false)
$$;

-- Al registrarse se crea el perfil. Solo se permiten dos tipos de cuenta desde
-- el formulario público: propietario y refugio. Los demás roles los asigna un
-- administrador del sistema.
create or replace function public.crear_perfil_nuevo_usuario()
returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
begin
  insert into public.perfiles (id, nombre, apellido, telefono, rol, acepto_tratamiento_datos_en)
  values (
    new.id,
    coalesce(meta ->> 'nombre', ''),
    coalesce(meta ->> 'apellido', ''),
    nullif(meta ->> 'telefono', ''),
    case when meta ->> 'tipo_cuenta' = 'refugio'
         then 'admin_refugio'::public.rol_usuario
         else 'propietario'::public.rol_usuario end,
    case when (meta ->> 'acepta_datos')::boolean then now() end
  );
  return new;
end;
$$;

create trigger al_crear_usuario
  after insert on auth.users
  for each row execute function public.crear_perfil_nuevo_usuario();

-- Un usuario no puede cambiarse el rol a sí mismo.
create or replace function public.proteger_rol_perfil()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  if new.rol is distinct from old.rol
     and coalesce(public.rol_actual() <> 'admin_sistema', true)
     and auth.uid() is not null then
    raise exception 'Solo un administrador del sistema puede cambiar roles';
  end if;
  return new;
end;
$$;

create trigger proteger_rol
  before update on public.perfiles
  for each row execute function public.proteger_rol_perfil();

-- ----------------------------------------------------------------------------
-- Clínica: sedes, doctores, turnos, bloqueos
-- ----------------------------------------------------------------------------

create table public.sedes (
  id            uuid primary key default gen_random_uuid(),
  nombre        text not null,
  direccion     text not null,
  ciudad        text not null default 'Bogotá',
  telefono      text not null,
  urgencias_24h boolean not null default false,                     -- REQ-DOC-03
  antelacion_minima_cancelacion_horas int not null default 4         -- REQ-AGC-04
    check (antelacion_minima_cancelacion_horas >= 0),
  creado_en     timestamptz not null default now()
);

create table public.doctores (
  id                  uuid primary key default gen_random_uuid(),
  perfil_id           uuid unique references public.perfiles (id) on delete set null,
  nombre_completo     text not null,
  especialidad        public.especialidad not null,
  tarjeta_profesional text not null unique,                         -- REQ-DOC-01
  sede_id             uuid not null references public.sedes (id),
  activo              boolean not null default true,
  creado_en           timestamptz not null default now()
);

create table public.turnos (                                         -- REQ-DOC-02
  id          uuid primary key default gen_random_uuid(),
  doctor_id   uuid not null references public.doctores (id) on delete cascade,
  dia_semana  smallint not null check (dia_semana between 0 and 6), -- 0 = domingo
  hora_inicio time not null,
  hora_fin    time not null,
  check (hora_fin > hora_inicio)
);

create table public.bloqueos_disponibilidad (                       -- REQ-DOC-05
  id        uuid primary key default gen_random_uuid(),
  doctor_id uuid not null references public.doctores (id) on delete cascade,
  desde     timestamptz not null,
  hasta     timestamptz not null,
  motivo    public.motivo_bloqueo not null default 'otro',
  check (hasta > desde)
);

-- ----------------------------------------------------------------------------
-- Mascotas de los propietarios
-- ----------------------------------------------------------------------------

create table public.mascotas (
  id               uuid primary key default gen_random_uuid(),
  propietario_id   uuid not null references public.perfiles (id) on delete cascade,
  nombre           text not null,
  especie          public.especie not null,
  raza             text,
  sexo             public.sexo not null,
  fecha_nacimiento date,
  peso             numeric(5, 2) check (peso > 0),
  creado_en        timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- Citas
-- ----------------------------------------------------------------------------

create table public.citas (
  id             uuid primary key default gen_random_uuid(),
  mascota_id     uuid not null references public.mascotas (id) on delete cascade,
  propietario_id uuid not null references public.perfiles (id) on delete cascade,
  doctor_id      uuid not null references public.doctores (id),
  sede_id        uuid not null references public.sedes (id),
  inicio         timestamptz not null,
  fin            timestamptz not null,
  tipo_consulta  public.tipo_consulta not null default 'control',
  motivo         text not null check (length(trim(motivo)) >= 3),   -- REQ-AGC-07
  estado         public.estado_cita not null default 'programada',
  creado_en      timestamptz not null default now(),
  actualizado_en timestamptz not null default now(),
  check (fin > inicio),
  -- REQ-AGC-02: un doctor no puede tener dos citas activas que se crucen.
  constraint sin_cruce_doctor exclude using gist (
    doctor_id with =, tstzrange(inicio, fin) with &&
  ) where (estado in ('programada', 'reprogramada')),
  -- Una mascota tampoco puede estar en dos citas a la vez.
  constraint sin_cruce_mascota exclude using gist (
    mascota_id with =, tstzrange(inicio, fin) with &&
  ) where (estado in ('programada', 'reprogramada'))
);

create index citas_propietario_idx on public.citas (propietario_id, inicio desc);
create index citas_doctor_idx on public.citas (doctor_id, inicio);

-- Duración estándar de una franja de agenda.
create or replace function public.duracion_franja()
returns interval language sql immutable as $$ select interval '30 minutes' $$;

-- REQ-AGC-01: franjas libres de un doctor en una fecha (hora de Bogotá).
-- SECURITY DEFINER porque un propietario no puede leer las citas de otros,
-- pero sí necesita saber qué horarios están ocupados.
create or replace function public.franjas_disponibles(p_doctor_id uuid, p_fecha date)
returns table (inicio timestamptz, fin timestamptz)
language sql stable security definer set search_path = ''
as $$
  select s.inicio, s.inicio + public.duracion_franja()
  from public.turnos t
  join public.doctores d on d.id = t.doctor_id and d.activo
  cross join lateral generate_series(
    (p_fecha + t.hora_inicio) at time zone 'America/Bogota',
    (p_fecha + t.hora_fin) at time zone 'America/Bogota' - public.duracion_franja(),
    public.duracion_franja()
  ) as s (inicio)
  where t.doctor_id = p_doctor_id
    and t.dia_semana = extract(dow from p_fecha)
    and s.inicio > now()
    and not exists (
      select 1 from public.citas c
      where c.doctor_id = p_doctor_id
        and c.estado in ('programada', 'reprogramada')
        and tstzrange(c.inicio, c.fin) && tstzrange(s.inicio, s.inicio + public.duracion_franja())
    )
    and not exists (
      select 1 from public.bloqueos_disponibilidad b
      where b.doctor_id = p_doctor_id
        and tstzrange(b.desde, b.hasta) && tstzrange(s.inicio, s.inicio + public.duracion_franja())
    )
  order by s.inicio
$$;

-- Valida y completa la cita antes de guardarla: el propietario y la sede se
-- derivan de la mascota y del doctor (no se confía en el cliente), y la franja
-- debe caer dentro de un turno, en el futuro y sin bloqueos.
create or replace function public.validar_cita()
returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  local_inicio timestamp;
begin
  select m.propietario_id into new.propietario_id
  from public.mascotas m where m.id = new.mascota_id;

  select d.sede_id into new.sede_id
  from public.doctores d where d.id = new.doctor_id and d.activo;
  if new.sede_id is null then
    raise exception 'El doctor no existe o no está activo';
  end if;

  if tg_op = 'INSERT' or new.inicio is distinct from old.inicio or new.doctor_id is distinct from old.doctor_id then
    new.fin := new.inicio + public.duracion_franja();

    if new.inicio <= now() then
      raise exception 'La cita debe programarse en una fecha futura';
    end if;

    local_inicio := new.inicio at time zone 'America/Bogota';
    if not exists (
      select 1 from public.turnos t
      where t.doctor_id = new.doctor_id
        and t.dia_semana = extract(dow from local_inicio)
        and local_inicio::time >= t.hora_inicio
        and (local_inicio + public.duracion_franja())::time <= t.hora_fin
        and (local_inicio + public.duracion_franja())::date = local_inicio::date
        and extract(epoch from local_inicio::time - t.hora_inicio)::int
            % extract(epoch from public.duracion_franja())::int = 0  -- alineada a la franja
    ) then
      raise exception 'La franja está fuera del turno del doctor';
    end if;

    if exists (
      select 1 from public.bloqueos_disponibilidad b
      where b.doctor_id = new.doctor_id
        and tstzrange(b.desde, b.hasta) && tstzrange(new.inicio, new.fin)
    ) then
      raise exception 'El doctor no está disponible en esa franja';
    end if;
  end if;

  new.actualizado_en := now();
  return new;
end;
$$;

create trigger validar_cita
  before insert or update on public.citas
  for each row execute function public.validar_cita();

-- Comprueba quién puede tocar una cita y, para el propietario, la antelación.
create or replace function public.verificar_permiso_cita(p_cita public.citas)
returns void
language plpgsql stable security definer set search_path = ''
as $$
declare
  rol public.rol_usuario := public.rol_actual();
  antelacion int;
begin
  if rol in ('admin_clinica', 'admin_sistema') then
    return;
  end if;
  if rol = 'doctor' and exists (
    select 1 from public.doctores d where d.id = p_cita.doctor_id and d.perfil_id = auth.uid()
  ) then
    return;
  end if;
  if p_cita.propietario_id is distinct from auth.uid() then
    raise exception 'No tienes permiso sobre esta cita';
  end if;

  select s.antelacion_minima_cancelacion_horas into antelacion
  from public.sedes s where s.id = p_cita.sede_id;

  if now() > p_cita.inicio - make_interval(hours => antelacion) then
    raise exception 'Las citas solo se pueden modificar con % horas de antelación', antelacion;
  end if;
end;
$$;

-- REQ-AGC-04: cancelación.
create or replace function public.cancelar_cita(p_cita_id uuid)
returns public.citas
language plpgsql security definer set search_path = ''
as $$
declare
  c public.citas;
begin
  select * into c from public.citas where id = p_cita_id for update;
  if not found then raise exception 'La cita no existe'; end if;
  if c.estado not in ('programada', 'reprogramada') then
    raise exception 'Solo se pueden cancelar citas activas';
  end if;
  perform public.verificar_permiso_cita(c);

  update public.citas set estado = 'cancelada' where id = p_cita_id returning * into c;
  return c;
end;
$$;

-- REQ-AGC-04: reprogramación a una nueva franja del mismo doctor.
create or replace function public.reprogramar_cita(p_cita_id uuid, p_nuevo_inicio timestamptz)
returns public.citas
language plpgsql security definer set search_path = ''
as $$
declare
  c public.citas;
begin
  select * into c from public.citas where id = p_cita_id for update;
  if not found then raise exception 'La cita no existe'; end if;
  if c.estado not in ('programada', 'reprogramada') then
    raise exception 'Solo se pueden reprogramar citas activas';
  end if;
  perform public.verificar_permiso_cita(c);

  update public.citas
     set inicio = p_nuevo_inicio, estado = 'reprogramada'
   where id = p_cita_id
  returning * into c;
  return c;
end;
$$;

-- ----------------------------------------------------------------------------
-- Adopción
-- ----------------------------------------------------------------------------

create table public.refugios (
  id             uuid primary key default gen_random_uuid(),
  perfil_id      uuid unique references public.perfiles (id) on delete cascade,
  nombre         text not null,
  ciudad         text not null default 'Bogotá',
  descripcion    text not null default '',
  telefono       text,
  email_contacto text,
  redes_sociales text,
  aprobado       boolean not null default false,                    -- REQ-ADO-03
  creado_en      timestamptz not null default now()
);

-- REQ-ADO-03: solo el administrador del sistema aprueba refugios.
create or replace function public.proteger_aprobacion_refugio()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  if auth.uid() is null or public.rol_actual() = 'admin_sistema' then
    return new;
  end if;
  if tg_op = 'INSERT' then
    new.aprobado := false;
  elsif new.aprobado is distinct from old.aprobado then
    raise exception 'Solo un administrador puede aprobar refugios';
  end if;
  return new;
end;
$$;

create trigger proteger_aprobacion
  before insert or update on public.refugios
  for each row execute function public.proteger_aprobacion_refugio();

create table public.mascotas_adopcion (
  id            uuid primary key default gen_random_uuid(),
  refugio_id    uuid not null references public.refugios (id) on delete cascade,
  nombre        text not null,
  especie       public.especie not null,
  edad_meses    int not null check (edad_meses >= 0),
  tamano        public.tamano not null,
  sexo          public.sexo not null,
  ciudad        text not null,
  descripcion   text not null default '',
  estado_salud  text not null default '',
  foto_url      text,
  estado        public.estado_adopcion not null default 'disponible', -- REQ-ADO-02/05
  publicada_en  timestamptz not null default now(),
  adoptada_en   timestamptz
);

create index mascotas_adopcion_catalogo_idx
  on public.mascotas_adopcion (estado, especie, tamano, ciudad);

create or replace function public.registrar_fecha_adopcion()
returns trigger language plpgsql as $$
begin
  if new.estado = 'adoptada' and old.estado is distinct from 'adoptada' then
    new.adoptada_en := now();
  elsif new.estado <> 'adoptada' then
    new.adoptada_en := null;
  end if;
  return new;
end;
$$;

create trigger fecha_adopcion
  before update on public.mascotas_adopcion
  for each row execute function public.registrar_fecha_adopcion();

-- El refugio dueño del usuario autenticado, solo si está aprobado.
create or replace function public.refugio_aprobado_de(p_refugio_id uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.refugios r
    where r.id = p_refugio_id and r.perfil_id = auth.uid() and r.aprobado
  )
$$;

-- ----------------------------------------------------------------------------
-- Row Level Security
-- ----------------------------------------------------------------------------

alter table public.perfiles               enable row level security;
alter table public.sedes                  enable row level security;
alter table public.doctores               enable row level security;
alter table public.turnos                 enable row level security;
alter table public.bloqueos_disponibilidad enable row level security;
alter table public.mascotas               enable row level security;
alter table public.citas                  enable row level security;
alter table public.refugios               enable row level security;
alter table public.mascotas_adopcion      enable row level security;

-- Perfiles
create policy "perfil propio o personal" on public.perfiles for select to authenticated
  using (id = auth.uid() or public.es_personal_clinica());
create policy "editar perfil propio" on public.perfiles for update to authenticated
  using (id = auth.uid() or public.rol_actual() = 'admin_sistema')
  with check (id = auth.uid() or public.rol_actual() = 'admin_sistema');

-- Sedes, doctores y turnos: lectura pública (el propietario elige doctor y
-- sede antes de agendar); escritura del administrador de la clínica.
create policy "sedes visibles" on public.sedes for select to anon, authenticated using (true);
create policy "sedes admin" on public.sedes for all to authenticated
  using (public.rol_actual() in ('admin_clinica', 'admin_sistema'))
  with check (public.rol_actual() in ('admin_clinica', 'admin_sistema'));

create policy "doctores visibles" on public.doctores for select to anon, authenticated using (true);
create policy "doctores admin" on public.doctores for all to authenticated
  using (public.rol_actual() in ('admin_clinica', 'admin_sistema'))
  with check (public.rol_actual() in ('admin_clinica', 'admin_sistema'));

create policy "turnos visibles" on public.turnos for select to anon, authenticated using (true);
create policy "turnos admin" on public.turnos for all to authenticated
  using (public.rol_actual() in ('admin_clinica', 'admin_sistema'))
  with check (public.rol_actual() in ('admin_clinica', 'admin_sistema'));

create policy "bloqueos personal" on public.bloqueos_disponibilidad for select to authenticated
  using (public.es_personal_clinica());
create policy "bloqueos admin" on public.bloqueos_disponibilidad for all to authenticated
  using (public.rol_actual() in ('admin_clinica', 'admin_sistema'))
  with check (public.rol_actual() in ('admin_clinica', 'admin_sistema'));

-- Mascotas: el propietario gestiona las suyas; el personal las consulta.
create policy "mascotas lectura" on public.mascotas for select to authenticated
  using (propietario_id = auth.uid() or public.es_personal_clinica());
create policy "mascotas alta" on public.mascotas for insert to authenticated
  with check (propietario_id = auth.uid() or public.rol_actual() in ('admin_clinica', 'admin_sistema'));
create policy "mascotas edicion" on public.mascotas for update to authenticated
  using (propietario_id = auth.uid() or public.rol_actual() in ('admin_clinica', 'admin_sistema'))
  with check (propietario_id = auth.uid() or public.rol_actual() in ('admin_clinica', 'admin_sistema'));
create policy "mascotas borrado" on public.mascotas for delete to authenticated
  using (propietario_id = auth.uid());

-- Citas: el propietario ve y crea las suyas; el doctor ve su agenda; el
-- administrador ve todo. Cancelar/reprogramar va por las funciones RPC.
create policy "citas lectura" on public.citas for select to authenticated
  using (
    propietario_id = auth.uid()
    or public.rol_actual() in ('admin_clinica', 'admin_sistema')
    or exists (select 1 from public.doctores d where d.id = doctor_id and d.perfil_id = auth.uid())
  );
create policy "citas alta" on public.citas for insert to authenticated
  with check (
    propietario_id = auth.uid()
    or public.rol_actual() in ('admin_clinica', 'admin_sistema')
  );
create policy "citas gestion personal" on public.citas for update to authenticated
  using (
    public.rol_actual() in ('admin_clinica', 'admin_sistema')
    or exists (select 1 from public.doctores d where d.id = doctor_id and d.perfil_id = auth.uid())
  );

-- Refugios: los aprobados son públicos (el adoptante necesita el contacto).
create policy "refugios lectura" on public.refugios for select to anon, authenticated
  using (aprobado or perfil_id = auth.uid() or public.rol_actual() = 'admin_sistema');
create policy "refugios alta" on public.refugios for insert to authenticated
  with check (perfil_id = auth.uid() and public.rol_actual() = 'admin_refugio');
create policy "refugios edicion" on public.refugios for update to authenticated
  using (perfil_id = auth.uid() or public.rol_actual() = 'admin_sistema')
  with check (perfil_id = auth.uid() or public.rol_actual() = 'admin_sistema');

-- Mascotas en adopción: catálogo público solo de refugios aprobados y sin
-- adoptar; el refugio gestiona las suyas.
create policy "adopcion catalogo" on public.mascotas_adopcion for select to anon, authenticated
  using (
    (estado in ('disponible', 'en_proceso')
      and exists (select 1 from public.refugios r where r.id = refugio_id and r.aprobado))
    or public.refugio_aprobado_de(refugio_id)
    or exists (select 1 from public.refugios r where r.id = refugio_id and r.perfil_id = auth.uid())
    or public.rol_actual() = 'admin_sistema'
  );
create policy "adopcion alta" on public.mascotas_adopcion for insert to authenticated
  with check (public.refugio_aprobado_de(refugio_id));
create policy "adopcion edicion" on public.mascotas_adopcion for update to authenticated
  using (public.refugio_aprobado_de(refugio_id) or public.rol_actual() = 'admin_sistema')
  with check (public.refugio_aprobado_de(refugio_id) or public.rol_actual() = 'admin_sistema');
create policy "adopcion borrado" on public.mascotas_adopcion for delete to authenticated
  using (public.refugio_aprobado_de(refugio_id) or public.rol_actual() = 'admin_sistema');

-- Las funciones de negocio solo las invocan usuarios autenticados, excepto la
-- consulta de franjas que también se muestra antes de iniciar sesión.
revoke execute on function public.cancelar_cita(uuid) from public, anon;
revoke execute on function public.reprogramar_cita(uuid, timestamptz) from public, anon;
revoke execute on function public.verificar_permiso_cita(public.citas) from public, anon, authenticated;
grant execute on function public.cancelar_cita(uuid) to authenticated;
grant execute on function public.reprogramar_cita(uuid, timestamptz) to authenticated;
grant execute on function public.franjas_disponibles(uuid, date) to anon, authenticated;
