# Byte Bay — Informe de seguridad y rediseño del panel interno

**Proyecto Supabase:** `inwugycvtaaceugvtfpv`
**Fecha:** 6 de noviembre de 2026
**Alcance:** tienda pública (`index.html`), panel interno (`admin.html`), base de datos PostgreSQL/Supabase, Edge Functions y cabeceras HTTP.

---

## 1. Resumen ejecutivo

La auditoría encontró **8 problemas reales**, de los cuales **2 eran críticos** (escalamiento de privilegios y exposición de datos internos). Todos los problemas críticos y altos quedaron **corregidos y verificados en producción**. En una segunda pasada se corrigieron además **un fallo bloqueante de checkout** y se completó el panel con dashboard, clientes, movimientos y ofertas automáticas.

También se rediseñó por completo el panel interno con un sistema de diseño profesional, manteniendo intacta la lógica existente.

| Área | Antes | Ahora |
|---|---|---|
| Escritura directa a tablas desde el navegador | Permitida en varias tablas | Bloqueada: todo pasa por RPC/Edge Functions |
| `asignar_personal` | Cualquiera (incluido anónimo) podía hacerse `jefe` | Solo un `jefe` activo puede asignar roles |
| Login de clientes | Sin límite de intentos | Bloqueo tras 5 intentos durante 15 min |
| Vistas de reportes | Ignoraban RLS | `security_invoker = true` |
| RPC de administración | Ejecutables por `anon` | Solo `authenticated` / `service_role` |
| Datos internos legibles por cualquier cliente | Sí (con RLS como única barrera) | Sin `SELECT` directo: solo RPC |
| Cabeceras de seguridad | Inexistentes | CSP, HSTS, X-Frame-Options, nosniff, etc. |
| Panel interno | Funcional, sin jerarquía visual | Diseño profesional con sidebar, breadcrumb, KPIs y modo noche |

---

## 2. Hallazgos y correcciones

### 2.1 Críticos

| # | Hallazgo | Riesgo | Corrección aplicada |
|---|---|---|---|
| 1 | `asignar_personal()` era `SECURITY DEFINER` sin comprobar quién llamaba. Un usuario anónimo o un empleado podía ascenderse a `jefe`. | **Toma total del negocio**: acceso a personal, precios, inventario y auditoría. | La función exige ahora un `jefe` activo. `anon` recibe `permission denied for function asignar_personal`. |
| 2 | `reporte_inventario_lotes` se ejecutaba con permisos del dueño e ignoraba RLS: exponía proveedores, lotes, costos y vencimientos a cualquiera con la clave pública. | Fuga de información comercial y de proveedores. | `security_invoker = true` + `REVOKE` de `anon`. Respuesta actual: `permission denied for view reporte_inventario_lotes`. |

### 2.2 Altos

| # | Hallazgo | Riesgo | Corrección aplicada |
|---|---|---|---|
| 3 | 15+ RPC `SECURITY DEFINER` de administración eran ejecutables por `anon` (`listar_productos_inventario_personal`, `guardar_producto_personal`, `resumen_reportes_jefe`, `moderar_comentario_personal`, etc.). | Enumeración de inventario, proveedores, reclamos y auditoría. | `REVOKE ALL ... FROM public, anon` + `GRANT EXECUTE` solo a `authenticated, service_role`. Se publicó una lista blanca mínima. |
| 4 | `iniciar_sesion_cliente` no limitaba intentos. | Fuerza bruta de contraseñas. | Bloqueo tras 5 fallos / 15 minutos usando las columnas `login_failed_attempts` y `lockout_until`; mensaje genérico. |
| 5 | Políticas `"Crear pedidos propios"` y `"Crear detalle de pedido propio"` permitían insertar pedidos y líneas arbitrarias. | Manipulación de pedidos e inventario. | Políticas eliminadas. El checkout usa `crear_pedido_yape`. |
| 6 | `crear_pedido_yape` aceptaba correos inválidos, cantidades ilimitadas y códigos Yape repetidos. | Pedidos basura, stock negativo, fraude con el mismo voucher. | Validación de correo, cantidad 1–20, nombre mínimo, código Yape único. |
| 7 | `REVOKE` de escritura incompleto: `authenticated` conservaba `INSERT/UPDATE/DELETE` en tablas de negocio. | Un cliente con sesión podía alterar datos si una política futura lo permitía. | `REVOKE INSERT, UPDATE, DELETE, TRUNCATE` en todo el esquema; solo se conservan las preferencias de notificación propias. |
| 8 | Vistas de compatibilidad (`customer_accounts`, `orders`, `profiles`, etc.) y tablas internas seguían con `SELECT` para `authenticated`. | Defensa en profundidad insuficiente: cualquier política nueva habría abierto los datos. | `REVOKE SELECT` en 14 tablas/vistas internas. El navegador ya no puede leer `pedidos`, `personal`, `lotes_inventario`, `auditoria_personal`, `cuentas_clientes`, etc. |

### 2.3 Medios

| # | Hallazgo | Corrección aplicada |
|---|---|---|
| 9 | XSS en el catálogo: nombres, marcas, categorías, imágenes y comentarios se insertaban con `innerHTML` sin escapar. | `escapeHtml()` en tarjetas, hero, categorías, carrito, comentarios, modal y tarjetas del asistente. |
| 10 | `imagenSegura()` aceptaba cualquier cadena (incluido `javascript:`). | Valida esquema, extensión y rutas relativas; cae a imagen predeterminada. |
| 11 | Sin cabeceras de seguridad ni CSP. | `_headers` (Netlify/Cloudflare), `vercel.json` y `<meta>` CSP en ambas páginas. |
| 12 | Contraseña mínima de 6 caracteres. | `password_min_length: 10` + requisitos de mayúscula, minúscula y número. Formularios y validaciones del panel alineados a 10. |
| 13 | Sin reautenticación para cambiar contraseña ni aviso al cambiar correo. | `security_update_password_require_reauthentication: true` y `mailer_secure_email_change_enabled: true`. |
| 14 | Faltaban RPC de ofertas (`guardar_oferta_personal`, `listar_ofertas_personal`). | Creadas y probadas: un empleado activo puede listar y crear ofertas; `anon` recibe `permission denied`. |
| 15 | Edge Function `crear-personal` aceptaba contraseñas de 8 caracteres, por debajo de la política de Auth. | Validación subida a 10 y función redesplegada. |
| 16 | Imágenes del catálogo sin carga diferida. | `loading="lazy"` y `decoding="async"` en tarjetas y categorías. |
| 17 | Sin metadatos sociales ni color de tema. | Open Graph, Twitter Card y `theme-color` en `index.html`. |

### 2.4 Bajos

| # | Hallazgo | Corrección |
|---|---|---|
| 18 | `admin.js` mostraba “Ejecuta primero el SQL de pruebas” ante cualquier error. | Mensaje real: “No se pudieron cargar las ofertas/movimientos: …”. |
| 19 | `minlength="8"` en el formulario de recuperación, incoherente con la política de 10. | Actualizado a `minlength="10"`. |
| 20 | Enlace “Olvidé mi contraseña” con bajo contraste en modo noche. | Color `#8ad9c9` y texto secundario `--adm-muted`. |

### 2.5 Correcciones funcionales críticas

| # | Hallazgo | Impacto | Corrección aplicada |
|---|---|---|---|
| 21 | El trigger heredado `orders_assign_customer_account` llamaba a `assign_order_customer_account()`, que escribía en la columna inexistente `customer_account_id`. | **El checkout fallaba siempre**: `record "new" has no field "customer_account_id"`. Ningún cliente podía comprar. | Trigger y función reescritos contra `id_cuenta_cliente`. Verificado: `crear_pedido_yape` devuelve `id_pedido`, `estado_pago: "pendiente"` y `codigo_verificacion`. |
| 22 | `sincronizar_cuenta_cliente_google()` usaba la columna inexistente `activo` y podía reactivar cuentas anuladas. | El registro con Google fallaba o revivía cuentas dadas de baja. | Corregida contra `estado_cuenta`; solo actualiza cuentas activas. |
| 23 | El aviso automático de ofertas no existía como flujo completo. | Las super ofertas y liquidaciones no generaban avisos visibles. | Trigger `notificar_oferta_especial` crea, actualiza o elimina el aviso según `super_oferta`, `liquidacion_stock`, `activa` y `id_oferta` (sin duplicados). |
| 24 | `registrar_cuenta_cliente` no distinguía correo duplicado ni estado explícito. | Mensajes confusos y cuentas sin estado consistente. | Estado `activo` explícito y error claro ante correo ya registrado. |

---

## 3. Estado final de permisos

### 3.1 Lo que el navegador puede leer

| Rol | Tablas/vistas | Motivo |
|---|---|---|
| `anon` | `catalogo_productos`, `comentarios_publicos_productos`, `productos`, `ofertas_producto` | El catálogo es una vista `security_invoker`; necesita las tablas base. |
| `authenticated` | Lo anterior + `perfiles`, `preferencias_notificacion` | Perfil propio y preferencias de notificación. |

> `comentarios_publicos_productos` se mantiene con permisos del dueño **a propósito**: solo expone alias, calificación y texto de comentarios publicados, y evita abrir `cuentas_clientes`.

### 3.2 RPC públicas (`anon`)

- `obtener_configuracion_publica`
- `iniciar_sesion_cliente`
- `registrar_cuenta_cliente`
- `crear_pedido_yape`
- `listar_notificaciones_ofertas_publicas`
- `guardar_comentario_producto`
- `guardar_comentario_producto_google`
- `eliminar_comentario_producto`

> `sincronizar_cuenta_cliente_google` ya **no** es anónima: se ejecuta tras el inicio de sesión con Google y requiere `authenticated`.

Todo lo demás exige sesión (`authenticated`) o `service_role`. Los intentos anónimos devuelven `permission denied`.

### 3.3 RPC internas de operación

Todas se crearon con `SECURITY DEFINER`, `search_path` fijo, `REVOKE` de `public`/`anon` y `GRANT EXECUTE` únicamente a `authenticated`.

| RPC | Quién puede ejecutarla | Uso |
|---|---|---|
| `dashboard_operativo_personal(p_desde, p_hasta)` | Todo el personal activo | KPIs, ventas por día, estados, top productos. Para empleados, `ingresos_confirmados`, `ticket_promedio` e `ingresos` por día devuelven `null`. |
| `clientes_registrados_hoy_personal()` | Todo el personal activo | Dato operativo del día, sin importes. |
| `listar_ofertas_automaticas_personal(p_limite)` | Todo el personal activo | Avisos generados por el sistema; solo lectura. |
| `listar_movimientos_inventario_filtrado(...)` / `resumen_movimientos_personal(...)` | Todo el personal activo | Movimientos con filtros por fecha, tipo, búsqueda y resumen. |
| `listar_clientes_jefe(...)` / `resumen_clientes_jefe(...)` | Solo `jefe` activo | Listado, KPIs y exportación de clientes. |
| `cambiar_estado_cliente_jefe(...)` | Solo `jefe` activo | Activar, inactivar o anular con motivo obligatorio y registro en auditoría. |
| `regenerar_avisos_ofertas_jefe()` | Solo `jefe` activo | Reconstruye los avisos automáticos faltantes. |

Los intentos de un empleado sobre RPC de jefe devuelven `Solo el jefe puede consultar clientes`; `anon` recibe `Solo el personal activo puede consultar el panel`.

---

## 4. Rediseño del panel interno

Se añadió una capa de presentación y módulos operativos nuevos sin romper los contratos existentes:

- **`admin-pro.css`** — sistema de diseño completo: variables, tipografía Manrope, sidebar con iconos SVG, chip de usuario, header sticky con breadcrumb, tarjetas KPI, tablas, badges, formularios, modo noche y responsive.
- **`admin-pro.js`** — rellena el chip con la sesión real (`nombres`, `apellidos`, `rol`), actualiza breadcrumb y título por sección, marca `aria-current`, limpia mensajes de estado, atajos `Ctrl+K` / `Esc` y aviso de “sin conexión”.
- **Login en dos paneles** — panel de marca a la izquierda y formulario a la derecha; en móvil se apila. Verificado a 1440 px, 768 px y 390 px sin desbordamiento horizontal.

### 4.1 Nuevos módulos operativos

- **Dashboard** (`#resumen`) — presets Hoy / 7 días / 30 días / Este mes / Este año, rango personalizado, KPIs de ventas, pedidos, clientes, ofertas, stock y reclamos; gráficos SVG de pedidos y clientes por día, distribución por estado y top 5 de productos. Los ingresos y el ticket promedio solo se muestran al `jefe`; el servidor devuelve `null` para empleados.
- **Clientes** (`#clientes`, solo `jefe`) — abre en «Todo» para no ocultar clientes antiguos, con búsqueda global, filtro por estado, presets de fecha de registro, KPIs (incluido «Clientes registrados hoy») y tabla con pedidos y total gastado. El diálogo permite activar, inactivar o anular; la anulación exige motivo y queda en `auditoria_logs`.
- **Movimientos de inventario** — presets Hoy / 7 días / 30 días / Este mes / Todo, rango manual, filtro por tipo, búsqueda por producto, código, pedido, lote o nota, KPIs de resumen y tabla con scroll interno en móvil.
- **Ofertas automáticas** — visibles para todo el personal en el dashboard y en la pestaña Ofertas. El `jefe` puede regenerar avisos y quitar un aviso (la oferta deja de ser especial). Los empleados solo ven el estado, sin acciones.
- **Exportación Excel profesional** — SheetJS CE con fila de título, subtítulo, fecha de generación, merges, anchos de columna, autofiltro, formatos numéricos y hoja «Resumen» ejecutiva. Exporta clientes y movimientos con los filtros activos; si no hay datos, informa en lugar de generar un archivo vacío.

Se conservaron todos los `id`, clases y contratos de `admin.js`, por lo que ninguna función del panel se rompió. La lógica nueva vive en `admin-dashboard.js` (IIFE) y expone solo `window.bbCargarDashboard`, `window.bbCargarClientes` y `window.bbCargarMovimientosFiltrados`.

---

## 5. Verificación realizada

| Prueba | Resultado |
|---|---|
| Catálogo público | 12 tarjetas, 11 categorías, 0 errores de consola |
| Comentarios públicos | Lectura correcta |
| Escritura directa a `productos` | `permission denied for table productos` |
| Lectura de `reporte_inventario_lotes` | `permission denied for view reporte_inventario_lotes` |
| Lectura de `customer_accounts`, `pedidos`, `personal`, `lotes_inventario`, `auditoria_personal` | Bloqueada |
| RPC de administración como `anon` | `permission denied` (401) |
| RPC de ofertas como empleado activo | Lista y crea correctamente (probado con rollback) |
| `crear_pedido_yape` con carrito vacío | `Pedido vacío` |
| `iniciar_sesion_cliente` con credenciales falsas | `Correo o contraseña incorrectos` |
| `registrar_cuenta_cliente` con correo inválido | `Correo no válido` |
| Panel interno (login) | Layout correcto en 1440/768/390 px, modo noche correcto |
| Panel interno (autenticado simulado) | Sidebar 272 px, chip, breadcrumb “Byte Bay / Catálogo”, `aria-current` |
| CSP | Activa en ambas páginas |
| Imágenes del catálogo | 12/12 con `loading="lazy"` y sin errores |
| Metadatos sociales | Open Graph y `theme-color` presentes |
| Edge Function `crear-personal` | Redesplegada con política de 10 caracteres |

### 5.1 Verificación de los módulos nuevos (6 de noviembre)

| Prueba | Resultado |
|---|---|
| Checkout real (`crear_pedido_yape`) | Devuelve `id_pedido`, `estado_pago: "pendiente"` y `codigo_verificacion`; el trigger ya no falla |
| Dashboard como `jefe` | 11 KPIs, 5 presets de fecha correctos, gráficos SVG y top productos renderizados; 0 errores de consola |
| Dashboard como `empleado` | 9 KPIs sin Ingresos ni Ticket promedio; `null` en importes; 0 errores |
| Pestañas por rol | Empleado: ocultas Avisos, Clientes, Auditoría, Marca y Personal. Jefe: todas visibles |
| Clientes (jefe) | 3 clientes reales visibles por defecto, búsqueda global por correo, filtro por estado y KPIs correctos |
| Diálogo de estado | Selector, aviso de anulación, motivo obligatorio y mensaje de validación funcionando |
| Cambio de estado + auditoría | `INACTIVACION_CLIENTE`, `ANULACION_CLIENTE`, `REACTIVACION_CLIENTE` con responsable y motivo |
| Clientes como empleado | `Solo el jefe puede consultar clientes` |
| Dashboard como `anon` | `Solo el personal activo puede consultar el panel` |
| Movimientos | Presets, rango manual, filtro por tipo y búsqueda; estado vacío correcto; 0 errores |
| Ofertas automáticas | Al marcar una oferta como super oferta aparece en dashboard y Ofertas; «Regenerar» informa 0/0; «Quitar aviso» elimina el aviso y revierte la marca |
| Exportación Excel | `clientes-byte-bay-2026-11-06.xlsx` (21 KB), hojas Clientes y Resumen, merges A1:J1–A3:J3, autofiltro A5:J9 |
| Responsive 390 px / 768 px | 0 desbordamiento horizontal; tabla de clientes con scroll interno (309/712 px); diálogo de 337 px dentro del viewport |
| Consola del panel | 0 mensajes ni errores tras login y navegación completa |

---

## 6. APIs y servicios recomendados

### Prioridad alta (seguridad y operación)

| Servicio / API | Para qué | Por qué conviene |
|---|---|---|
| **Cloudflare Turnstile** o **hCaptcha** | Captcha invisible en registro, login y reclamos | Frena bots y fuerza bruta sin molestar al cliente. Turnstile es gratis y no requiere resolver puzzles. |
| **Cloudflare (proxy + WAF)** | CDN, WAF, rate limiting y bot fight mode | Protege la web antes de que llegue a Supabase; incluye reglas anti-DDoS y caché. |
| **Supabase Pro** | Backups diarios, PITR y protección de contraseñas filtradas | Hoy los respaldos dependen del plan gratuito; PITR permite volver a un minuto exacto. |
| **Sentry** o **Better Stack** | Monitoreo de errores y uptime | Detecta fallos antes que el cliente y alerta por correo/Slack. |
| **Resend**, **Brevo** o **SendGrid** | Correos transaccionales (pedido, reclamo, recuperación) | EmailJS funciona, pero estos ofrecen plantillas, dominio propio y métricas de entrega. |

### Prioridad media (ventas y atención)

| Servicio / API | Para qué |
|---|---|
| **Culqi**, **Mercado Pago** o **Niubiz** | Cobros con tarjeta, Yape y Plin automatizados (hoy el Yape es manual). |
| **WhatsApp Cloud API** | Confirmación de pedido y avisos de estado sin costo por mensaje saliente dentro de la ventana de 24 h. |
| **Nubefact** o **Efact** | Boleta/factura electrónica válida ante SUNAT. |
| **Google Analytics 4** o **Plausible** | Medir productos más vistos, embudo de compra y conversión. |

### Prioridad baja (crecimiento)

| Servicio / API | Para qué |
|---|---|
| **Algolia** o **Meilisearch** | Búsqueda instantánea con tolerancia a errores tipográficos cuando el catálogo supere ~2 000 productos. |
| **Shippo** o API del courier local | Cotización y seguimiento de envíos. |
| **OneSignal** | Notificaciones push y recuperación de carritos abandonados. |

---

## 7. Recomendaciones pendientes

Estas acciones necesitan decisiones o claves que solo el propietario puede aportar:

1. **Captcha en el registro/login de clientes** — requiere claves de hCaptcha o Cloudflare Turnstile (site key + secret). Hoy está desactivado.
2. **Protección de contraseñas filtradas** — Supabase la ofrece en el plan Pro. Recomendada si el negocio crece.
3. **MFA para el rol `jefe`** — activar 2FA en las cuentas de jefe desde Supabase Auth.
4. **Monitoreo y alertas** — conectar un servicio de uptime (Better Stack, UptimeRobot) y alertas de errores 5xx.
5. **Rotar las claves compartidas por chat** — el token de Supabase y la clave de Gemini deben rotarse; ya están expuestas en el historial.
6. **Backups automáticos** — confirmar la política de respaldos diarios del proyecto.
7. **Revisar el correo de soporte y las plantillas de Auth** — personalizar remitente y plantilla de recuperación.
8. **Migrar de `'unsafe-inline'` a nonces** — la CSP actual lo permite porque quedan `onerror=` estáticos y `onclick=` generados. Es una mejora futura, no una urgencia.

---

## 8. Archivos relevantes

| Archivo | Contenido |
|---|---|
| `migrations_seguridad.sql` | Bloqueo de login, RLS de vistas, permisos mínimos, checkout endurecido, índices. |
| `migrations_seguridad_2.sql` | RPC de ofertas + permisos de ejecución + limpieza de `SELECT`. |
| `migrations_seguridad_3.sql` | Defensa en profundidad: `REVOKE SELECT` en tablas internas. |
| `migrations_dashboard_clientes.sql` | Checkout, sincronización Google, avisos automáticos, dashboard, clientes, movimientos y auditoría de estados. |
| `migrations_dashboard_clientes_2.sql` | `clientes_registrados_hoy_personal()` para todo el personal activo. |
| `admin-dashboard.js` | Dashboard, clientes, movimientos, ofertas automáticas y exportación Excel. |
| `admin-pro.css` | Sistema de diseño del panel interno, KPIs, gráficos, tablas y diálogos. |
| `admin-pro.js` | Chip de usuario, breadcrumb, atajos, estado y conexión. |
| `_headers` / `vercel.json` | Cabeceras de seguridad para Netlify/Cloudflare y Vercel. |
| `app.js` | Escapado de HTML, validación de imágenes y asistente con reintentos. |
| `supabase/functions/asistente-bytebay/index.ts` | Asistente con cascada de modelos, reintentos y salida JSON estructurada. |

---

## 9. Conclusión

El proyecto pasó de tener **dos fallos críticos explotables** a un modelo de **mínimo privilegio**: el navegador solo puede leer el catálogo y los comentarios publicados, y toda operación sensible ocurre en RPC `SECURITY DEFINER` con validación de rol. El checkout quedó reparado y verificado, y el panel interno ahora cubre el ciclo operativo completo —dashboard con filtros, clientes con activación/anulación auditada, movimientos filtrables y ofertas automáticas visibles— con exportación profesional a Excel y presentación coherente con la marca.

**Estado:** listo para operación y auditoría. Las únicas acciones pendientes dependen de decisiones o claves del propietario (captcha, MFA, backups, rotación de claves y monitoreo), detalladas en la sección 7.
