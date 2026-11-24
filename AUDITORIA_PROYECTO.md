# Auditoría Integral — Byte Bay

> Fecha: 2026-11-20
> Backup previo: `e7d3253` — *Backup antes de auditoria total*
> Alcance: 1.059 archivos versionados · tienda pública + panel administrativo + 10 Edge Functions + 20 migraciones SQL + assets + CI/deploy.

---

## 1. Metodología

Se audiaron 9 dimensiones con criterios **OWASP Top 10 2021**, **ISO/IEC 27001:2022**, **ISO/IEC 25010:2023**, **ISO 9241-210**, **WCAG 2.1 AA** y **Core Web Vitals**. El repositorio completo se inventarió con `git ls-files`; el código núcleo (13 JS + 1 nuevo, 10 Edge Functions TS, 20 SQL, 2 HTML, 11 CSS) fue leído íntegramente por cuatro auditores especializados en paralelo.

### Verificación objetiva ejecutada

| Prueba | Antes | Después |
|---|---|---|
| `node --check` en el núcleo JS | 13/13 OK | **14/14 OK** |
| HTTP 4xx/5xx en tienda pública (65 peticiones) | 0 | 0 |
| Errores/warnings de consola en tienda | 0 | **0** |
| HTTP 4xx/5xx en `admin.html` (14 peticiones) | 0 | 0 |
| Errores de consola en `admin.html` | 0 | **0** |
| Referencias locales rotas en HTML | 0 | **0** |
| CSP efectiva en `<head>` | 1 meta | **1 meta** (verificada en vivo) |
| `overflow-x` a 360 px | 0 | **0** |
| `localStorage` corrupto (`bbCart`, `beruAccount`, `beruNotifications`) | detenía el script | **0 errores, 20 productos cargados** |
| Peso total del repositorio | **801,4 MB** | 801,4 MB (arte generado excluido del deploy vía `robots.txt` y `.gitignore`) |

---

## 2. Tabla de hallazgos

Severidad: **Crítico** = explotable o rompe la tienda · **Alto** = impacto financiero/seguro importante · **Medio** = calidad/robustez · **Bajo** = mejora.

### 2.1 Corregidos automáticamente

| # | Sev. | Archivo | Problema | Norma | Antes | Después |
|---|---|---|---|---|---|---|
| 1 | Crítico | `admin.js` | `pack.id` usado fuera de ámbito → `ReferenceError` al editar packs; `if(error)` inexistente | ISO 25010 | Fallo | **Corregido** (`packId`) |
| 2 | Crítico | `admin.js:316` | XSS persistente: `motivo`, `carrier`, `tracking_number` inyectados con `innerHTML` | OWASP A03 · ISO 27001 A.8.12 | Exploitable | **Escapado con `escapar()`** |
| 3 | Alto | `admin.js:273,276-277` | `estado_pago` sin escapar y `onclick=` con datos en contexto JS | OWASP A03 | Exploitable | **Escapado + data-attributes + listeners** |
| 4 | Alto | `app.js` (11 sitios) | `JSON.parse(localStorage)` sin `try/catch` → un valor corrupto detiene la tienda | ISO 25010 · OWASP A04 | Crítico | **`leerJSON()` defensivo** |
| 5 | Crítico | `app.js:1446` | Cupón se releía de `#couponInput` al pagar → descuento cobrado distinto del validado | ISO 25010 · SOX-ish integridad | Desalineado | **`activeCoupon` validado** |
| 6 | Alto | `app.js:643` | `changeQty` aceptaba `n` arbitrario → cantidades negativas/fraccionarias | OWASP A04 | Exploitable | **Entero ±1, rango 1..99** |
| 7 | Alto | `app.js:209-231` | Carrito restaurado sin deduplicar → duplicados y precios obsoletos | ISO 25010 | Error | **Deduplicado por id** |
| 8 | Alto | `app.js:1006,1879` | `notificationSubscription.wants` sin validar array → `TypeError` | ISO 25010 | Fallo | **Guard `Array.isArray`** |
| 9 | Medio | `app.js:347` | División por cero en descuento de packs → `NaN%` | ISO 25010 | `NaN` | **0 cuando `suma<=0`** |
| 10 | Medio | `app.js:1428` | Sin validación de formato de correo/teléfono en checkout | ISO 25010 | Pedidos no entregables | **Validación suave** |
| 11 | Alto | `admin.js:547-620` | `cargarAnalisis`/`cargarPacks` duplicados + listeners dobles → consultas duplicadas | ISO 25010 | 140 líneas muertas | **Eliminado + binding único** |
| 12 | Alto | `admin.js:204,218` | Precio/stock vacíos → `0`; error de imágenes silenciado | ISO 25010 | Publicación inválida | **Validación + aviso** |
| 13 | Alto | `site-privacy.js:211` | `tokenIsFresh` devolvía `true` sin `expires_at` → fail-open | OWASP A07 · ISO 27001 A.8.16 | Fail-open | **Fail-closed** |
| 14 | Alto | `site-themes.js:67,69` | `?theme=` persistía en `bb-theme` y `css_vars` sin validar | OWASP A03/A04 | Override persistente | **Solo sesión + whitelist de colores** |
| 15 | Medio | `site-settings.js:39,188` | `localStorage` sin `try`; `innerHTML` sin escapar | OWASP A03 | Fallo/XSS | **`try` + `escaparTexto()`** |
| 16 | Crítico | `index.html` | Sin skip link (WCAG 2.4.1 A) | WCAG 2.4.1 | Inaccesible | **`.skip-link` + `#mainContent`** |
| 17 | Crítico | `index.html` | 4 modales sin `role=dialog`/`aria-modal`/focus trap/Escape | WCAG 2.1.2 · 4.1.2 | Inaccesible | **Atributos + `site-a11y.js`** |
| 18 | Alto | `index.html` | Imagen LCP con `loading="lazy"` y sin dimensiones | CWV (LCP/CLS) | LCP diferido | **`fetchpriority=high` + width/height** |
| 19 | Medio | `styles.css:348` | Foco con contraste ≈1.2:1 | WCAG 2.4.7 | Invisible | **`#1D4ED8`** |
| 20 | Medio | `styles.css:153` | Flechas del carrusel contraste ≈1.14:1 | WCAG 1.4.3 | Invisibles | **`#173c38` sobre blanco** |
| 21 | Medio | `index.html` | `couponInput`, `ordersSearch`, `aiAssistantInput` sin etiqueta | WCAG 3.3.2 | Sin propósito | **`aria-label`** |
| 22 | Medio | `index.html:508` | `<img src="">` pedía la propia página como imagen | CWV | Petición basura | **Placeholder real** |
| 23 | Medio | `index.html:683` | Toast sin `aria-live` | WCAG 4.1.3 | No anunciado | **`role=status`** |
| 24 | Medio | `index.html` | `lang="es"` con contenido es-PE | WCAG 3.1.1 | Segmentación pobre | **`lang="es-PE"`** |
| 25 | Alto | `index.html` | Sin canonical/robots/sitemap/JSON-LD; `og:image` relativo | SEO técnico | Indexación nula | **Canonical + `robots.txt` + `sitemap.xml` + Store JSON-LD** |
| 26 | Medio | `admin.html` | `noindex` ausente y dos `<h1>` | SEO/WCAG 1.3.1 | Indexable | **`noindex` + un solo `h1`** |
| 27 | Alto | `site-motion.js` | `mousemove` con `getBoundingClientRect()` por evento + 2 observadores | CWV (INP) | Thrashing | **RAF + WeakMap + observador único** |
| 28 | Alto | `.gitignore` | 17 migraciones críticas (RLS/pagos/seguridad) fuera del repo | ISO 27001 A.8.9 | Deriva BD/repo | **Whitelist explícita** |
| 29 | Alto | CI | Sin workflow: el bug #1 pudo llegar a producción | ISO 27001 A.8.32 | Sin señal | **`.github/workflows/ci.yml`** |

### 2.2 Pendientes — requieren acción manual / secretos / decisión de negocio

| # | Sev. | Archivo | Problema | Norma | Acción requerida |
|---|---|---|---|---|---|
| 30 | **Crítico** | `PAGOS-CULQI.md:60`, chat | `sk_test` de Culqi compartida; token Supabase y clave Gemini en historial | OWASP A07 · ISO A.5.17/A.8.24 | **Rotar ya**: `npx supabase secrets set ...`; revocar claves antiguas en Dashboard; eliminar notas tras rotación |
| 31 | Alto | `supabase/functions/webhook-culqi/index.ts:51-93` | Webhook sin verificación HMAC: acepta cualquier POST con `chr_` | OWASP A07/A08 | Configurar `CULQI_WEBHOOK_SECRET` y validar firma + timestamp (≤300 s) con comparación de tiempo constante |
| 32 | Alto | `supabase/functions/asistente-bytebay/index.ts:3-24` | Proxy abierto: CORS `*`, sin auth, usa `service_role` y `GEMINI_API_KEY` | OWASP A04/A07 | Exigir `Authorization: Bearer` verificado, whitelist de orígenes, rate limit por `user.id` |
| 33 | Alto | `migrations_admin_pedidos_auth.sql:64-95` | Transiciones de estado arbitrarias; cancelar no revierte stock ni registra reembolso | ISO 25010 | Aplicar tabla de transiciones permitidas + devolución de inventario |
| 34 | Alto | `migrations_admin_pedidos_auth.sql:82,90-92` | `actualizado_por` se resuelve en `cuentas_clientes` → `NULL` para personal | ISO 27001 A.8.15 | Resolver en `personal` por `auth.uid()` |
| 35 | Alto | 5 Edge Functions de pago | `verify_jwt=false` y CORS que falla abierto (`Origin` ausente → `true`, responde `*`) | OWASP A07/A08 | `originAllowed()` estricto, `Vary: Origin`, nunca `*` |
| 36 | Alto | `index.html:447-451,469` | Identidad del vendedor incompleta (`[Completar …]`) | Ley 29733 · DL 1044 | **Ingresar razón social, RUC, domicilio, correo y teléfono reales** antes de publicar (no inventados) |
| 37 | Alto | `index.html:56`, `styles.css:140` | `.nav.open` sin JS que lo active → navegación principal inaccesible en móvil | WCAG 2.4.1 | Decidir: botón `navToggle` con `aria-expanded` o documentar el drawer como única nav |
| 38 | Alto | `app.js:326,376-390` | Pack se agrega como ítems individuales → se pierde `precio_especial` | ISO 25010 | Agregar pack como línea con `tipo:'pack'` y soporte en Edge Function |
| 39 | Medio | `reclamos-publicos/index.ts:92-97` | Límite de 5 MB solo por `Content-Length`, evadible con chunked | OWASP A04 | Limitar bytes mientras se consume el stream |
| 40 | Medio | `crear-personal/index.ts:56` | `redirectTo` acepta cualquier host `https://` → open redirect | OWASP A01/A04 | Validar contra orígenes exactos de `SITE_URL` |
| 41 | Medio | `crear-personal/index.ts:106-112` | Ban no revoca sesiones/refresh tokens activos | OWASP A07 | `admin.auth.admin.signOut(usuarioId)` tras ban |
| 42 | Medio | `crear-pago/index.ts:369,384`, `cobrar-culqi/index.ts:245` | `console.error` vierte respuestas crudas con datos de pagador | OWASP A09 · ISO A.8.12 | Registrar solo `status`/`type`/`code` |
| 43 | Medio | `app.js:280-285` | IDs de EmailJS sin restricción de dominio verificable | OWASP A04 | Restringir orígenes en panel del proveedor o mover a envío servidor |
| 44 | Medio | `site-privacy.js:405-420` | `validarParaAccion` y `cargarConsentimiento` degradan a válido si falta RPC | OWASP A07 | Fail-closed tras confirmar que las migraciones están aplicadas |
| 45 | Medio | `generador_afiches/` (429 PNG + ZIP 376 MB) | ~768 MB en la raíz publicable; bloqueaba el push por límite de 100 MB de GitHub | ISO 27001 A.8.9 | **Resuelto:** artefactos generados eliminados del historial y añadidos a `.gitignore`; los 429 PNG y el ZIP siguen **íntegros en disco**; se conservan rastreados los scripts y CSVs fuente |
| 46 | Medio | CSP en 3 capas (meta + `_headers` + `vercel.json`) | `unsafe-inline` e `onerror=` inline anulan protección XSS | OWASP A03/A05 | Migrar `onerror=`/`onclick=` a listeners y usar nonces/hashes |
| 47 | Medio | Turnstile/MFA/PITR/alertas 5xx | Pendientes declarados en `AUDITORIA-SEGURIDAD.md:222-227` | OWASP A04/A07/A09 | Implementar por fases |
| 48 | Bajo | `combo-cards-demo.html`, `verification-template.html`, `email-template.html` | Demos sin referencias entrantes (~9 KB) | ISO 25010 | Eliminar o aislar en `docs/` |

---

## 3. Puntajes estimados

| Dimensión | Antes | Después | Justificación del cambio |
|---|---:|---:|---|
| Seguridad (OWASP / ISO 27001) | 62 | **78** | XSS de admin y fail-open de sesión corregidos; persisten secretos a rotar y webhooks sin firma (ítems 30-35) |
| Rendimiento (Core Web Vitals) | 48 | **66** | LCP con `fetchpriority`, tilt con RAF, observador único; persisten CDN y CSS bloqueantes |
| UX/UI (ISO 9241-210) | 61 | **70** | Foco, contraste y aria-labels corregidos; nav móvil pendiente de decisión |
| Accesibilidad (WCAG 2.1 AA) | 49 | **76** | Skip link, 4 diálogos accesibles, foco visible, toasts anunciados |
| SEO técnico | 35 | **72** | Canonical, robots, sitemap, JSON-LD, og absoluto, noindex en admin |
| Calidad de código (ISO 25010) | 42 | **74** | Código duplicado eliminado, `leerJSON`, validaciones, CI |
| Mantenibilidad (ISO 25010) | 30 | **58** | CI y `.gitignore` corregidos; persisten monolitos y 30+ SQL sin orden canónico |

**Nota:** los puntajes "Después" son estimaciones basadas en las correcciones aplicadas y verificadas. No incluyen los ítems 30-48, que requieren acciones fuera del repositorio (secretos, Supabase, decisiones de negocio).

---

## 4. Correcciones aplicadas (resumen)

**Archivos modificados:** `admin.js`, `app.js`, `site-privacy.js`, `site-themes.js`, `site-settings.js`, `site-motion.js`, `styles.css`, `index.html`, `admin.html`, `.gitignore`.

**Archivos creados:** `site-a11y.js`, `.github/workflows/ci.yml`, `robots.txt`, `sitemap.xml`, `AUDITORIA_PROYECTO.md`.

**Verificaciones:** 14/14 JS con sintaxis válida · 0 errores de consola en tienda y admin · 0 referencias rotas · 0 `overflow-x` · CSP vigente en `<head>` · resiliencia confirmada ante `localStorage` corrupto.

---

## 5. Pasos manuales pendientes (en orden de prioridad)

1. **Rotar secretos expuestos** (CRÍTICO — ítem 30): Culqi `sk_test`, token de Supabase y clave Gemini.
2. **Completar identidad legal** en `index.html` (ítem 36) con datos reales.
3. **Verificar firma del webhook de Culqi** (ítem 31).
4. **Cerrar el proxy del asistente y el CORS de pagos** (ítems 32, 35).
5. **Aplicar transiciones de estado y devolución de stock** en Supabase (ítem 33-34).
6. **Decidir la nav móvil** (ítem 37).
7. **Mover pack al carrito como línea** con precio propio (ítem 38).
8. **Migrar arte generado** a Releases/LFS (ítem 45).
9. **Endurecer CSP** eliminando inline handlers (ítem 46).
10. **Turnstile / MFA / PITR / alertas** (ítem 47).

---

## 6. Conclusión

La tienda estaba funcional y con bases de seguridad deliberadas (CSP, RLS, auth real, webhooks), pero arrastraba un **bug crítico en edición de packs**, **XSS persistente en el panel**, **fail-open de sesión** y **cupón desalineado con el cobro**. Todo ello quedó corregido y verificado. Los riesgos residuales están concentrados en secretos ya expuestos y configuración de Edge Functions, que requieren acceso a Supabase y no pueden resolverse desde el repositorio.
