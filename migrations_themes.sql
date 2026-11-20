
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
