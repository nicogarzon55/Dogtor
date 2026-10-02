-- =============================================================================
-- Dogtor · Datos de ejemplo para pruebas (no ejecutar en producción)
-- =============================================================================

with sedes as (
  insert into public.sedes (nombre, direccion, ciudad, telefono, urgencias_24h, antelacion_minima_cancelacion_horas)
  values
    ('Dogtor Chapinero', 'Cra. 13 # 54-20', 'Bogotá', '601 555 0101', true, 4),
    ('Dogtor Suba', 'Av. Suba # 115-40', 'Bogotá', '601 555 0202', false, 12)
  returning id, nombre
),
doctores as (
  insert into public.doctores (nombre_completo, especialidad, tarjeta_profesional, sede_id)
  select d.nombre, d.especialidad::public.especialidad, d.tarjeta, s.id
  from (values
    ('Dra. Laura Méndez',   'medicina_general', 'MV-10234', 'Dogtor Chapinero'),
    ('Dr. Andrés Rojas',    'cirugia',          'MV-10871', 'Dogtor Chapinero'),
    ('Dra. Camila Torres',  'dermatologia',     'MV-11502', 'Dogtor Suba'),
    ('Dr. Felipe Castaño',  'urgencias',        'MV-12046', 'Dogtor Chapinero'),
    ('Dra. Natalia Pardo',  'odontologia',      'MV-12790', 'Dogtor Suba')
  ) as d (nombre, especialidad, tarjeta, sede)
  join sedes s on s.nombre = d.sede
  returning id, especialidad
)
insert into public.turnos (doctor_id, dia_semana, hora_inicio, hora_fin)
select d.id, dia, t.inicio, t.fin
from doctores d
cross join generate_series(1, 6) as dia
cross join lateral (
  -- Urgencias cubre noche; el resto, jornada diurna.
  select * from (values
    (case when d.especialidad = 'urgencias' then time '18:00' else time '08:00' end,
     case when d.especialidad = 'urgencias' then time '23:30' else time '12:00' end),
    (case when d.especialidad = 'urgencias' then null else time '14:00' end,
     case when d.especialidad = 'urgencias' then null else time '18:00' end)
  ) as v (inicio, fin)
  where v.inicio is not null
) as t;

-- Refugio de demostración (sin usuario dueño) con su catálogo.
with refugio as (
  insert into public.refugios (nombre, ciudad, descripcion, telefono, email_contacto, redes_sociales, aprobado)
  values ('Fundación Huellitas (demo)', 'Bogotá',
          'Rescatamos perros y gatos en situación de calle en el sur de Bogotá.',
          '300 555 0303', 'adopciones@huellitas.example', '@huellitasdemo', true)
  returning id
)
insert into public.mascotas_adopcion
  (refugio_id, nombre, especie, edad_meses, tamano, sexo, ciudad, descripcion, estado_salud, estado)
select r.id, m.nombre, m.especie::public.especie, m.edad, m.tamano::public.tamano,
       m.sexo::public.sexo, m.ciudad, m.descripcion, m.salud, m.estado::public.estado_adopcion
from refugio r
cross join (values
  ('Canela',  'perro', 8,  'mediano', 'hembra', 'Bogotá', 'Juguetona y muy cariñosa con niños.', 'Vacunada y desparasitada', 'disponible'),
  ('Tigre',   'gato',  24, 'pequeno', 'macho',  'Bogotá', 'Tranquilo, ideal para apartamento.', 'Esterilizado', 'disponible'),
  ('Max',     'perro', 60, 'grande',  'macho',  'Soacha', 'Guardián noble, necesita patio.',   'Vacunado, tratamiento dermatológico finalizado', 'en_proceso'),
  ('Luna',    'gato',  4,  'pequeno', 'hembra', 'Bogotá', 'Cachorra curiosa, usa arenero.',    'Primera dosis de vacunas', 'disponible'),
  ('Rocky',   'perro', 110,'mediano', 'macho',  'Chía',   'Senior tranquilo, busca hogar calmado.', 'Control cardiológico al día', 'disponible'),
  ('Kiwi',    'ave',   18, 'pequeno', 'macho',  'Bogotá', 'Periquito sociable, viene con jaula.', 'Sano', 'disponible')
) as m (nombre, especie, edad, tamano, sexo, ciudad, descripcion, salud, estado);
