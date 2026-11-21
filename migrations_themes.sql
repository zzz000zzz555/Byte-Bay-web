
create table if not exists public.site_themes (
  id bigserial primary key,
  clave text not null unique,
  nombre text not null,
  descripcion text,
  activo boolean not null default false,
  css_vars jsonb not null default '{}'::jsonb,
  audio_url text,
  preview_color text,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);

-- ensure only one active theme
create or replace function public.fn_single_active_theme()
returns trigger as $$
begin
  if NEW.activo = true then
    update public.site_themes set activo = false where id <> NEW.id;
  end if;
  return NEW;
end;
$$ language plpgsql;

drop trigger if exists trg_single_active_theme on public.site_themes;
create trigger trg_single_active_theme
before insert or update of activo on public.site_themes
for each row execute function public.fn_single_active_theme();

grant select on public.site_themes to anon, authenticated;

-- seed themes
insert into public.site_themes (clave, nombre, descripcion, activo, css_vars, preview_color) values
('default', 'Byte Bay (Default)', 'Estética corporativa minimalista y moderna', true,
 '{"--bg-primary":"#ffffff","--bg-secondary":"#f8fafc","--text-primary":"#0f172a","--text-secondary":"#64748b","--accent":"#2563eb","--accent-light":"#eff6ff","--border":"#e2e8f0","--card-bg":"#ffffff","--header-bg":"#ffffff","--price-color":"#dc2626","--stock-color":"#16a34a"}'::jsonb, '#2563eb'),
('black_friday', 'Black Friday', 'Modo oscuro profundo con acentos dorado/neón', false,
 '{"--bg-primary":"#0a0a0a","--bg-secondary":"#171717","--text-primary":"#fafafa","--text-secondary":"#a3a3a3","--accent":"#fbbf24","--accent-light":"#422006","--border":"#262626","--card-bg":"#171717","--header-bg":"#0a0a0a","--price-color":"#fbbf24","--stock-color":"#22c55e"}'::jsonb, '#fbbf24'),
('navidad', 'Navidad', 'Rojo carmesí, verde pino, blanco nieve y dorado sutil', false,
 '{"--bg-primary":"#fef2f2","--bg-secondary":"#f0fdf4","--text-primary":"#1c1917","--text-secondary":"#57534e","--accent":"#dc2626","--accent-light":"#fee2e2","--border":"#fecaca","--card-bg":"#ffffff","--header-bg":"#fef2f2","--price-color":"#dc2626","--stock-color":"#16a34a"}'::jsonb, '#dc2626'),
('halloween', 'Halloween', 'Negro carbón, naranja calabaza y púrpura oscuro', false,
 '{"--bg-primary":"#0c0a09","--bg-secondary":"#1c1917","--text-primary":"#fafaf9","--text-secondary":"#a8a29e","--accent":"#f97316","--accent-light":"#431407","--border":"#292524","--card-bg":"#1c1917","--header-bg":"#0c0a09","--price-color":"#f97316","--stock-color":"#22c55e"}'::jsonb, '#f97316'),
('ano_nuevo', 'Año Nuevo', 'Azul medianoche, champán y destellos dorados', false,
 '{"--bg-primary":"#020617","--bg-secondary":"#0f172a","--text-primary":"#f8fafc","--text-secondary":"#94a3b8","--accent":"#f59e0b","--accent-light":"#451a03","--border":"#1e293b","--card-bg":"#0f172a","--header-bg":"#020617","--price-color":"#f59e0b","--stock-color":"#22c55e"}'::jsonb, '#f59e0b'),
('cyber_days', 'Cyber Days', 'Cyberpunk neón azul/violeta sobre fondo oscuro', false,
 '{"--bg-primary":"#0f0f23","--bg-secondary":"#1a1a2e","--text-primary":"#e2e8f0","--text-secondary":"#94a3b8","--accent":"#8b5cf6","--accent-light":"#2e1065","--border":"#312e81","--card-bg":"#1a1a2e","--header-bg":"#0f0f23","--price-color":"#ec4899","--stock-color":"#22c55e"}'::jsonb, '#8b5cf6')
on conflict (clave) do nothing;

-- Resto de festividades seleccionables desde Admin → Temas
insert into public.site_themes (clave, nombre, descripcion, activo, css_vars, preview_color) values
 ('san_valentin', 'San Valentín', 'Rosas, chocolates y flechas de Cupido', false,
  '{"--bg-primary":"#fff1f2","--bg-secondary":"#ffe4e6","--text-primary":"#4c0519","--text-secondary":"#9f1239","--accent":"#e11d48","--accent-light":"#ffe4e6","--border":"#fecdd3","--card-bg":"#ffffff","--header-bg":"#fff1f2","--price-color":"#be123c","--stock-color":"#16a34a"}'::jsonb, '#e11d48'),
 ('dia_madre_padre', 'Día de la Madre y el Padre', 'Flores, gratitud y tonos lila', false,
  '{"--bg-primary":"#faf5ff","--bg-secondary":"#f3e8ff","--text-primary":"#3b0764","--text-secondary":"#7e22ce","--accent":"#a855f7","--accent-light":"#f3e8ff","--border":"#e9d5ff","--card-bg":"#ffffff","--header-bg":"#faf5ff","--price-color":"#9333ea","--stock-color":"#16a34a"}'::jsonb, '#a855f7'),
 ('fiestas_patrias', 'Fiestas Patrias', 'Banderines, empanadas y rojo peruano', false,
  '{"--bg-primary":"#fef2f2","--bg-secondary":"#fff7ed","--text-primary":"#7f1d1d","--text-secondary":"#b91c1c","--accent":"#dc2626","--accent-light":"#fee2e2","--border":"#fecaca","--card-bg":"#ffffff","--header-bg":"#fef2f2","--price-color":"#b91c1c","--stock-color":"#16a34a"}'::jsonb, '#dc2626'),
 ('vuelta_clases', 'Vuelta a clases', 'Lápices, libros y azul academia', false,
  '{"--bg-primary":"#eff6ff","--bg-secondary":"#dbeafe","--text-primary":"#172554","--text-secondary":"#1d4ed8","--accent":"#2563eb","--accent-light":"#dbeafe","--border":"#bfdbfe","--card-bg":"#ffffff","--header-bg":"#eff6ff","--price-color":"#dc2626","--stock-color":"#16a34a"}'::jsonb, '#2563eb'),
 ('san_patricio', 'San Patricio', 'Tréboles, arcoíris y olla de oro', false,
  '{"--bg-primary":"#f0fdf4","--bg-secondary":"#dcfce7","--text-primary":"#14532d","--text-secondary":"#15803d","--accent":"#16a34a","--accent-light":"#dcfce7","--border":"#bbf7d0","--card-bg":"#ffffff","--header-bg":"#f0fdf4","--price-color":"#dc2626","--stock-color":"#16a34a"}'::jsonb, '#16a34a'),
 ('dia_de_la_bandera', 'Día de la Bandera', 'Escudo, laureles y bandera peruana', false,
  '{"--bg-primary":"#fff7ed","--bg-secondary":"#ffedd5","--text-primary":"#7c2d12","--text-secondary":"#c2410c","--accent":"#dc2626","--accent-light":"#ffedd5","--border":"#fed7aa","--card-bg":"#ffffff","--header-bg":"#fff7ed","--price-color":"#b91c1c","--stock-color":"#16a34a"}'::jsonb, '#dc2626'),
 ('dia_del_trabajo', 'Día del Trabajo', 'Herramientas, engranajes y medalla', false,
  '{"--bg-primary":"#f8fafc","--bg-secondary":"#f1f5f9","--text-primary":"#1e293b","--text-secondary":"#475569","--accent":"#d97706","--accent-light":"#fef3c7","--border":"#e2e8f0","--card-bg":"#ffffff","--header-bg":"#f8fafc","--price-color":"#b45309","--stock-color":"#16a34a"}'::jsonb, '#d97706'),
 ('dia_del_nino', 'Día del Niño', 'Globos, osito y cometa', false,
  '{"--bg-primary":"#fdf4ff","--bg-secondary":"#fae8ff","--text-primary":"#701a75","--text-secondary":"#a21caf","--accent":"#d946ef","--accent-light":"#fae8ff","--border":"#f5d0fe","--card-bg":"#ffffff","--header-bg":"#fdf4ff","--price-color":"#db2777","--stock-color":"#16a34a"}'::jsonb, '#d946ef'),
 ('primavera', 'Primavera', 'Flores y mariposas', false,
  '{"--bg-primary":"#f0fdf4","--bg-secondary":"#dcfce7","--text-primary":"#14532d","--text-secondary":"#166534","--accent":"#22c55e","--accent-light":"#dcfce7","--border":"#dcfce7","--card-bg":"#ffffff","--header-bg":"#f0fdf4","--price-color":"#dc2626","--stock-color":"#16a34a"}'::jsonb, '#22c55e'),
 ('verano', 'Verano', 'Sol, palmeras y helados', false,
  '{"--bg-primary":"#fffbeb","--bg-secondary":"#fef3c7","--text-primary":"#78350f","--text-secondary":"#b45309","--accent":"#f59e0b","--accent-light":"#fef3c7","--border":"#fde68a","--card-bg":"#ffffff","--header-bg":"#fffbeb","--price-color":"#dc2626","--stock-color":"#16a34a"}'::jsonb, '#f59e0b'),
 ('otonio', 'Otoño', 'Hojas, bellotas y tonos ámbar', false,
  '{"--bg-primary":"#fff7ed","--bg-secondary":"#ffedd5","--text-primary":"#431407","--text-secondary":"#9a3412","--accent":"#ea580c","--accent-light":"#ffedd5","--border":"#fed7aa","--card-bg":"#ffffff","--header-bg":"#fff7ed","--price-color":"#c2410c","--stock-color":"#16a34a"}'::jsonb, '#ea580c'),
 ('dia_de_muertos', 'Día de Muertos', 'Calaveras, cempasúchil y velas', false,
  '{"--bg-primary":"#1c1917","--bg-secondary":"#292524","--text-primary":"#fafaf9","--text-secondary":"#a8a29e","--accent":"#f97316","--accent-light":"#431407","--border":"#44403c","--card-bg":"#292524","--header-bg":"#1c1917","--price-color":"#fbbf24","--stock-color":"#22c55e"}'::jsonb, '#f97316')
on conflict (clave) do nothing;
