# Byte Bay

Tienda e-commerce de producción (vanilla JS + HTML/CSS + Supabase/PostgreSQL/Edge Functions).

- **Sitio público:** https://zzz000zzz555.github.io/Byte-Bay-web/
- **Panel admin:** `admin.html` (acceso con cuenta de personal de Supabase Auth)
- **Pagos:** Culqi (principal) y Mercado Pago (secundario), confirmación por webhook/API
- **Envío:** gratis a todo el Perú

## Despliegue

El sitio se publica en **GitHub Pages** desde la rama `main`. No se usa Jekyll:
las rutas son relativas para funcionar bajo el subpath `/Byte-Bay-web/`.

- `.github/workflows/ci.yml` valida sintaxis JS, secretos versionados, referencias locales y `git diff --check` en cada push.
- `_headers` y `vercel.json` mantienen las cabeceras de seguridad para Netlify/Vercel; GitHub Pages aplica la CSP de respaldo declarada en `<meta>` de `index.html` y `admin.html`.
- `robots.txt` y `sitemap.xml` controlan indexación.

## Estructura relevante

| Archivo | Responsabilidad |
|---|---|
| `index.html`, `admin.html` | Entradas pública y administrativa |
| `app.js` | Catálogo, carrito, checkout, pedidos |
| `admin.js`, `admin-*.js` | CRUD, RBAC, auditoría, dashboard |
| `site-themes.js`, `seasonal-art.js`, `seasonal-decor.css`, `site-atmosphere.js` | Temas y decoración estacional |
| `site-privacy.js`, `site-settings.js`, `site-a11y.js` | Consentimiento, preferencias y accesibilidad |
| `supabase/functions/` | Edge Functions de pagos, webhooks yRPC |
| `migrations_*.sql`, `database_schema_master.sql` | Esquema y migraciones |
| `AUDITORIA_PROYECTO.md` | Auditoría integral, hallazgos y puntajes |
| `AUDITORIA-SEGURIDAD.md`, `PAGOS-*.md` | Detalle de seguridad y pagos |

## Verificación local

```bash
# Sintaxis de todo el JS del núcleo
for f in *.js; do node --check "$f" || exit 1; done

# Servir en local
python -m http.server 8899
# Abrir http://127.0.0.1:8899/index.html
```

## Variables y secretos

**Nunca versionar** `sk_live_*`, `sb_secret_*`, `GEMINI_API_KEY` ni claves privadas.
El cliente solo usa la clave *publishable* de Supabase y claves públicas de Culqi/EmailJS.
Los secretos viven en Supabase Secrets y se configuran con:

```bash
npx supabase secrets set "CULQI_PRIVATE_KEY=..." "GEMINI_API_KEY=..." \
  --project-ref inwugycvtaaceugvtfpv --yes
```

## Temas

`?theme=clave` previsualiza un tema sin persistirlo. El selector del cliente está en
**Configuración → Apariencia → Tema de temporada** (`bb-season-theme`).
El administrador controla el tema activo global en `site_themes`.

## Auditoría

Ver `AUDITORIA_PROYECTO.md` para el estado de hallazgos, puntajes y pasos manuales pendientes.
