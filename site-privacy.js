/* ============================================================
   Byte Bay · Privacidad, consentimiento y sesiones con tokens
   ------------------------------------------------------------
   - Emite y renueva access_token / refresh_token contra Supabase.
   - Valida el token en cada acción sensible (checkout, reseñas).
   - Lee y escribe el consentimiento en el servidor.
   - El consentimiento local solo activa recomendaciones locales en este
     dispositivo; las señales no se envían ni sincronizan sin el servidor.
   - Expone window.BBPrivacy para app.js y site-settings.js.
   ============================================================ */

(function () {
  'use strict';

  const NOTICE_VERSION = 'v2.1-2026';
  const KEYS = {
    session: 'bbSession',
    guest: 'bbGuestId',
    cache: 'bbPrivacyCache',
    localSignals: 'bbLocalRecommendationSignals',
    legacyConsent: 'byteBayPersonalizationConsent',
    legacyViewed: 'byteBayViewedProducts'
  };

  const PURPOSE_LIST = [
    { key: 'rec_navegacion', label: 'Navegación', drawer: 'purpRecNavegacion', pref: 'prefsRecNavegacion' },
    { key: 'rec_busquedas', label: 'Búsquedas', drawer: 'purpRecBusquedas', pref: 'prefsRecBusquedas' },
    { key: 'rec_carrito_compras', label: 'Carrito de compras', drawer: 'purpRecCarrito', pref: 'prefsRecCarrito' },
    { key: 'ui_secciones', label: 'Secciones de la interfaz', drawer: 'purpUiSecciones', pref: 'prefsUiSecciones' }
  ];

  const TYPE_TO_PURPOSE = {
    VISTA: 'rec_navegacion',
    CATEGORIA: 'rec_navegacion',
    BUSQUEDA: 'rec_busquedas',
    CARRITO: 'rec_carrito_compras'
  };

  const state = {
    sesion: null,
    disponible: true,
    consentimiento: null,
    recomendaciones: null,
    modalAbierto: null,
    refrescoTimer: 0,
    validacionTimer: 0,
    inicializado: false,
    consentimientoListo: false,
    focoPrevio: null,
    guardando: false
  };

  const $ = (id) => document.getElementById(id);

  function emptyPurposes() {
    return {
      rec_navegacion: false,
      rec_busquedas: false,
      rec_carrito_compras: false,
      ui_secciones: false
    };
  }

  function allPurposes() {
    return {
      rec_navegacion: true,
      rec_busquedas: true,
      rec_carrito_compras: true,
      ui_secciones: true
    };
  }

  function store() {
    return window.BBStore || null;
  }

  function client() {
    if (window.BBStore && window.BBStore.client) return window.BBStore.client;
    try {
      return typeof supabaseClient !== 'undefined' ? supabaseClient : null;
    } catch (error) {
      return null;
    }
  }

  function toast(text, type) {
    const fn = window.BBStore && window.BBStore.toast;
    if (typeof fn === 'function') {
      fn(text);
      return;
    }
    const node = $('toast');
    if (!node) return;
    node.textContent = text;
    node.classList.add('show');
    if (type === 'error') node.dataset.type = 'error';
    window.setTimeout(() => node.classList.remove('show'), 3200);
  }

  function uuid() {
    if (window.crypto && typeof window.crypto.randomUUID === 'function') return window.crypto.randomUUID();
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (char) => {
      const random = (Math.random() * 16) | 0;
      const value = char === 'x' ? random : (random & 0x3) | 0x8;
      return value.toString(16);
    });
  }

  function readJSON(key) {
    try {
      return JSON.parse(localStorage.getItem(key) || 'null');
    } catch (error) {
      return null;
    }
  }

  function writeJSON(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      /* almacenamiento lleno o bloqueado */
    }
  }

  function formatDate(value) {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '—';
    return new Intl.DateTimeFormat('es-PE', { dateStyle: 'medium', timeStyle: 'short' }).format(date);
  }

  function formatTime(value) {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '—';
    return new Intl.DateTimeFormat('es-PE', { hour: '2-digit', minute: '2-digit' }).format(date);
  }

  function isFunctionMissing(error) {
    if (!error) return false;
    const code = String(error.code || '');
    const message = String(error.message || error.details || '');
    return code === 'PGRST202' || code === '42883' || code === '42P01' || code === '404' ||
      /could not find the function|function .* does not exist|schema cache/i.test(message);
  }

  async function rpc(name, params) {
    const supabase = client();
    if (!supabase) return { data: null, error: { message: 'SIN_CLIENTE', code: 'NO_CLIENT' } };
    try {
      const { data, error } = await supabase.rpc(name, params || {});
      if (error && isFunctionMissing(error)) state.disponible = false;
      return { data, error };
    } catch (error) {
      return { data: null, error };
    }
  }

  /* ------------------------------------------------------------
     Sesión y tokens
     ------------------------------------------------------------ */

  function guestId() {
    let value = '';
    try {
      value = localStorage.getItem(KEYS.guest) || '';
    } catch (error) {
      value = '';
    }
    if (!value) {
      value = 'inv_' + uuid().replace(/-/g, '');
      try {
        localStorage.setItem(KEYS.guest, value);
      } catch (error) {
        /* sin almacenamiento */
      }
    }
    return value;
  }

  function readSession() {
    const session = readJSON(KEYS.session);
    return session && session.access_token ? session : null;
  }

  function persistSession(session) {
    if (!session || !session.access_token) {
      try {
        localStorage.removeItem(KEYS.session);
      } catch (error) {
        /* noop */
      }
      state.sesion = null;
      return;
    }
    writeJSON(KEYS.session, session);
    if (session.guest_id) {
      try {
        localStorage.setItem(KEYS.guest, session.guest_id);
      } catch (error) {
        /* noop */
      }
    }
    state.sesion = session;
  }

  function tokenIsFresh(session, marginSeconds) {
    if (!session || !session.expires_at) return true;
    const expires = new Date(session.expires_at).getTime();
    if (Number.isNaN(expires)) return true;
    return expires - Date.now() > (marginSeconds || 30) * 1000;
  }

  async function emitirInvitado() {
    const result = await rpc('bb_emitir_sesion_invitado', { p_guest_id: guestId() });
    if (result.data && result.data.access_token) {
      persistSession(result.data);
      return true;
    }
    if (result.error && !isFunctionMissing(result.error)) {
      console.warn('Byte Bay · sesión invitado:', result.error.message || result.error);
    }
    state.sesion = null;
    return false;
  }

  async function asegurarSesion() {
    if (!client()) {
      state.disponible = false;
      return;
    }

    const stored = readSession();
    if (stored) {
      const validation = await rpc('bb_validar_sesion', { p_access_token: stored.access_token });
      if (validation.data && validation.data.valid) {
        state.sesion = stored;
        return;
      }
      if (stored.refresh_token) {
        const refreshed = await rpc('bb_refrescar_sesion', { p_refresh_token: stored.refresh_token });
        if (refreshed.data && refreshed.data.ok) {
          persistSession(Object.assign({}, stored, refreshed.data));
          return;
        }
      }
      persistSession(null);
    }

    await emitirInvitado();
  }

  async function refrescarToken(force) {
    const session = state.sesion;
    if (!session || !session.refresh_token) return { ok: false, error: 'SIN_REFRESH' };
    if (!force && tokenIsFresh(session, 120)) return { ok: true, sinCambios: true };

    const result = await rpc('bb_refrescar_sesion', { p_refresh_token: session.refresh_token });
    if (result.data && result.data.ok) {
      const next = Object.assign({}, session, result.data);
      delete next.error;
      persistSession(next);
      renderSession();
      return { ok: true };
    }
    return { ok: false, error: (result.data && result.data.error) || (result.error && result.error.message) || 'REFRESH_INVALIDO' };
  }

  async function iniciarSesion(email, password) {
    const invited = (state.sesion && state.sesion.guest_id) || guestId();
    const result = await rpc('bb_iniciar_sesion_cliente', {
      p_correo: email,
      p_contrasena: password,
      p_guest_id: invited
    });

    if (result.data && result.data.access_token) {
      persistSession(result.data);
      if (result.data.consentimiento) {
        state.consentimiento = normalizeConsent(result.data.consentimiento, true);
        cacheConsent();
      } else {
        await cargarConsentimiento();
      }
      await cargarRecomendaciones();
      renderTodo();
      dispatchPrivacy();
      return { ok: true, token: true, cuenta: result.data.cuenta };
    }

    if (result.error && !isFunctionMissing(result.error)) {
      return { ok: false, message: result.error.message || 'No se pudo iniciar sesión.' };
    }

    // Compatibilidad con instalaciones sin el delta aplicado.
    const legacy = await rpc('iniciar_sesion_cliente', { p_correo: email, p_contrasena: password });
    if (legacy.error) return { ok: false, message: legacy.error.message || 'Correo o contraseña incorrectos.' };
    persistSession(null);
    await cargarConsentimiento();
    return { ok: true, token: false, cuenta: legacy.data };
  }

  async function registrarCuenta(payload) {
    const params = {
      p_correo: payload.email,
      p_nombres: payload.firstName || null,
      p_apellidos: payload.lastName || null,
      p_nombre_usuario: payload.username || null,
      p_contrasena: payload.password
    };
    const result = await rpc('bb_registrar_cuenta_cliente', params);
    if (result.data && result.data.id) return { ok: true, id: result.data.id };
    if (result.error && !isFunctionMissing(result.error)) {
      return { ok: false, error: result.error, message: result.error.message };
    }
    const legacy = await rpc('registrar_cuenta_cliente', params);
    if (legacy.error) return { ok: false, error: legacy.error, message: legacy.error.message };
    return { ok: true };
  }

  async function sincronizarSesionGoogle() {
    const result = await rpc('bb_emitir_sesion_google', { p_guest_id: guestId() });
    if (result.data && result.data.access_token) {
      persistSession(result.data);
      await cargarConsentimiento();
      await cargarRecomendaciones();
      renderTodo();
      dispatchPrivacy();
      return { ok: true };
    }
    return { ok: false, error: (result.data && result.data.error) || (result.error && result.error.message) };
  }

  async function cerrarSesionEnTodos() {
    const session = state.sesion;
    if (session && session.access_token) {
      await rpc('bb_revocar_sesiones_cliente', { p_access_token: session.access_token });
    }
    const account = readJSON('beruAccount');
    if (account && account.provider === 'google') {
      try {
        const supabase = client();
        if (supabase && supabase.auth) await supabase.auth.signOut();
      } catch (error) {
        /* la sesión local se cierra igual */
      }
    }
    await reiniciarComoInvitado();
    return { ok: true };
  }

  async function cerrarSesionActual() {
    const session = state.sesion;
    if (session && session.access_token) {
      await rpc('bb_revocar_sesion_actual', { p_access_token: session.access_token });
    }
    const account = readJSON('beruAccount');
    if (account && account.provider === 'google') {
      try {
        const supabase = client();
        if (supabase && supabase.auth) await supabase.auth.signOut();
      } catch (error) {
        /* noop */
      }
    }
    await reiniciarComoInvitado();
    return { ok: true };
  }

  async function reiniciarComoInvitado() {
    persistSession(null);
    state.recomendaciones = null;
    await emitirInvitado();
    await cargarConsentimiento();
    await cargarRecomendaciones();
    renderTodo();
    dispatchPrivacy();
  }

  async function validarParaAccion() {
    if (!client()) return true;
    if (!state.sesion || !state.sesion.access_token) {
      if (!state.disponible) return true;
      await asegurarSesion();
      return Boolean(state.sesion && state.sesion.access_token) || !state.disponible;
    }
    if (!tokenIsFresh(state.sesion, 15)) {
      const refreshed = await refrescarToken(true);
      if (!refreshed.ok) {
        renderSession();
        return false;
      }
    }
    const validation = await rpc('bb_validar_sesion', { p_access_token: state.sesion.access_token });
    if (validation.data && validation.data.valid) return true;
    if (validation.error && isFunctionMissing(validation.error)) return true;
    return false;
  }

  async function obtenerSesionCliente() {
    if (!client()) return { ok: false, error: 'SERVICIO_NO_DISPONIBLE' };
    await asegurarSesion();

    let session = state.sesion;
    if (!session || !session.access_token) return { ok: false, error: 'SESION_REQUERIDA' };
    if (!tokenIsFresh(session, 15)) {
      const refreshed = await refrescarToken(true);
      if (!refreshed.ok) return { ok: false, error: 'SESION_EXPIRADA' };
      session = state.sesion;
    }

    const validation = await rpc('bb_validar_sesion', { p_access_token: session.access_token });
    const customerId = Number(validation.data?.customer_id);
    if (
      validation.error ||
      validation.data?.valid !== true ||
      validation.data?.role !== 'cliente' ||
      !Number.isSafeInteger(customerId) ||
      customerId <= 0
    ) {
      return { ok: false, error: 'CUENTA_NO_VALIDADA' };
    }

    return { ok: true, access_token: session.access_token, customer_id: customerId };
  }

  /* ------------------------------------------------------------
     Consentimiento
     ------------------------------------------------------------ */

  function normalizeConsent(data, synced) {
    const source = data || {};
    const purposes = emptyPurposes();
    const incoming = source.finalidades || {};
    PURPOSE_LIST.forEach((purpose) => {
      purposes[purpose.key] = Boolean(incoming[purpose.key]);
    });
    return {
      estado: source.estado || 'pendiente',
      finalidades: purposes,
      aviso_version: source.aviso_version || NOTICE_VERSION,
      aceptado_en: source.aceptado_en || null,
      ultima_aceptacion_en: source.ultima_aceptacion_en || null,
      rechazado_en: source.rechazado_en || null,
      desactivado_en: source.desactivado_en || null,
      actualizado_en: source.actualizado_en || null,
      operation_id: source.operation_id || null,
      localOnly: Boolean(source.localOnly || source.local_only),
      sincronizado: Boolean(synced)
    };
  }

  function cacheConsent() {
    if (!state.consentimiento) return;
    writeJSON(KEYS.cache, {
      consentimiento: state.consentimiento,
      guardado_en: new Date().toISOString(),
      aviso_version: NOTICE_VERSION
    });
  }

  function readCachedConsent() {
    const cached = readJSON(KEYS.cache);
    if (!cached || !cached.consentimiento) return normalizeConsent({ estado: 'pendiente' }, false);
    return normalizeConsent(cached.consentimiento, false);
  }

  async function cargarConsentimiento() {
    const session = state.sesion;
    if (!session || !session.access_token) {
      state.consentimiento = readCachedConsent();
      state.consentimiento.sincronizado = false;
      state.consentimientoListo = true;
      return state.consentimiento;
    }
    const result = await rpc('bb_obtener_consentimiento', {
      p_access_token: session.access_token,
      p_registrar_consulta: false,
      p_action_medium: 'MENU_CONFIGURACION'
    });
    if (result.data && result.data.ok) {
      const serverConsent = normalizeConsent(result.data, true);
      const cachedConsent = readCachedConsent();
      state.consentimiento = serverConsent.estado === 'pendiente' &&
        cachedConsent.localOnly && cachedConsent.estado !== 'pendiente'
        ? cachedConsent
        : serverConsent;
      cacheConsent();
      state.consentimientoListo = true;
      return state.consentimiento;
    }
    state.consentimiento = readCachedConsent();
    state.consentimiento.sincronizado = false;
    state.consentimientoListo = true;
    return state.consentimiento;
  }

  function personalizacionActiva() {
    const consent = state.consentimiento;
    if (!consent || consent.estado !== 'aceptado') return false;
    if (!consent.sincronizado && !consent.localOnly) return false;
    return PURPOSE_LIST.some((purpose) => Boolean(consent.finalidades[purpose.key]));
  }

  function finalidadActiva(key) {
    return Boolean(personalizacionActiva() && state.consentimiento.finalidades[key]);
  }

  function localSignals() {
    const records = readJSON(KEYS.localSignals);
    return Array.isArray(records) ? records.slice(-100) : [];
  }

  function saveLocalSignals(records) {
    writeJSON(KEYS.localSignals, records.slice(-100));
  }

  function localRecommendations() {
    const storeRef = store();
    const products = storeRef && Array.isArray(storeRef.products) ? storeRef.products : [];
    const consent = state.consentimiento;
    const enabledSignals = localSignals().filter((signal) => {
      const purpose = TYPE_TO_PURPOSE[signal.tipo];
      return purpose && consent.finalidades[purpose];
    });
    const categoryWeights = new Map();
    const viewed = [];

    enabledSignals.forEach((signal) => {
      const category = String(signal.categoria || '').trim();
      if (category) {
        categoryWeights.set(category, (categoryWeights.get(category) || 0) + 1);
      }
      if (signal.tipo === 'VISTA' && signal.id_producto != null &&
          Number.isInteger(Number(signal.id_producto)) && Number(signal.id_producto) > 0) {
        const id = Number(signal.id_producto);
        if (!viewed.some((item) => item.id_producto === id)) viewed.push({ id_producto: id });
      }
    });

    const interests = [...categoryWeights.entries()]
      .sort((left, right) => right[1] - left[1])
      .slice(0, 5)
      .map(([categoria, peso]) => ({ categoria, peso }));
    const items = products
      .filter((product) => Number(product.stock) > 0)
      .map((product) => {
        const weight = categoryWeights.get(String(product.category || '').trim()) || 0;
        return {
          product,
          score: weight * 10 + Number(product.rating || 0),
          motivo: weight ? `Relacionado con ${product.category}` : 'Popular en Byte Bay'
        };
      })
      .sort((left, right) => right.score - left.score)
      .slice(0, 8)
      .map(({ product, motivo }) => ({ id_producto: product.id, motivo }));

    const viewedProducts = consent.finalidades.rec_navegacion ? viewed.slice(0, 4) : [];
    return { modo: interests.length ? 'personalizado' : 'general', items, intereses: interests, vistos: viewedProducts, local: true };
  }

  function fallbackLocal(estado, purposes) {
    const now = new Date().toISOString();
    state.consentimiento = normalizeConsent({
      estado: estado,
      finalidades: purposes,
      aviso_version: NOTICE_VERSION,
      rechazado_en: estado === 'rechazado' ? now : null,
      desactivado_en: estado === 'desactivado' ? now : null,
      actualizado_en: now,
      localOnly: true
    }, false);
    if (estado !== 'aceptado') {
      try {
        localStorage.removeItem(KEYS.localSignals);
      } catch (error) {
        console.warn('Byte Bay · no se pudo borrar el historial local de recomendaciones.', error);
      }
    } else {
      const allowed = PURPOSE_LIST.filter((purpose) => purposes[purpose.key]).map((purpose) => purpose.key);
      const allowedTypes = Object.keys(TYPE_TO_PURPOSE).filter((type) => allowed.includes(TYPE_TO_PURPOSE[type]));
      saveLocalSignals(localSignals().filter((signal) => allowedTypes.includes(signal.tipo)));
    }
    cacheConsent();
    state.consentimientoListo = true;
  }

  async function guardarConsentimiento(eventType, decision, purposes, medium) {
    if (state.guardando) return { ok: false, message: 'Hay una operación de privacidad en curso.' };
    const session = state.sesion;

    if (!session || !session.access_token) {
      const localDecision = decision === 'personalizado' ? 'aceptado'
        : decision === 'configurar' ? 'pendiente'
          : decision;
      fallbackLocal(localDecision, purposes || emptyPurposes());
      state.recomendaciones = localDecision === 'aceptado' ? localRecommendations() : genericRecommendations();
      renderTodo();
      dispatchPrivacy();
      return { ok: true, local: true };
    }

    state.guardando = true;
    try {
      const result = await rpc('bb_guardar_consentimiento', {
        p_access_token: session.access_token,
        p_operation_id: uuid(),
        p_event_type: eventType,
        p_decision: decision,
        p_purposes: purposes || emptyPurposes(),
        p_action_medium: medium || 'MENU_CONFIGURACION',
        p_privacy_notice_version: NOTICE_VERSION
      });

      if (result.data && result.data.ok) {
        state.consentimiento = normalizeConsent(result.data, true);
        try {
          localStorage.removeItem(KEYS.localSignals);
        } catch (error) {
          console.warn('Byte Bay · no se pudo limpiar el historial local de recomendaciones.', error);
        }
        cacheConsent();
        state.consentimientoListo = true;
        renderTodo();
        dispatchPrivacy();
        agendarRecomendaciones(120);
        return { ok: true, data: result.data };
      }

      if (decision === 'rechazado' || decision === 'desactivado' || !state.disponible) {
        const localDecision = decision === 'personalizado' ? 'aceptado'
          : decision === 'configurar' ? 'pendiente'
            : decision;
        fallbackLocal(localDecision, localDecision === 'aceptado' || localDecision === 'pendiente'
          ? purposes || emptyPurposes()
          : emptyPurposes());
        state.recomendaciones = personalizacionActiva() ? localRecommendations() : genericRecommendations();
        renderTodo();
        dispatchPrivacy();
        toast(personalizacionActiva()
          ? 'Personalización activada solo en este dispositivo. Tu historial no se sincroniza.'
          : 'Preferencia guardada solo en este dispositivo.');
        return { ok: true, local: true };
      }

      const message = (result.data && result.data.error) || (result.error && result.error.message) || 'No se pudo guardar el consentimiento.';
      return { ok: false, message: message };
    } finally {
      state.guardando = false;
    }
  }

  function dispatchPrivacy() {
    window.dispatchEvent(new CustomEvent('bb:privacy-updated', {
      detail: {
        estado: state.consentimiento ? state.consentimiento.estado : 'pendiente',
        personalizacion: personalizacionActiva(),
        sincronizado: Boolean(state.consentimiento && state.consentimiento.sincronizado)
      }
    }));
  }

  /* ------------------------------------------------------------
     Recomendaciones (servidor autoritativo)
     ------------------------------------------------------------ */

  function genericRecommendations() {
    const storeRef = store();
    const products = storeRef && Array.isArray(storeRef.products) ? storeRef.products : [];
    const items = products
      .filter((product) => Number(product.stock) > 0)
      .slice()
      .sort((a, b) => Number(b.rating || 0) - Number(a.rating || 0))
      .slice(0, 8)
      .map((product) => ({ id_producto: product.id, motivo: 'Popular en Byte Bay' }));
    return { modo: 'general', items: items, intereses: [], vistos: [], local: true };
  }

  function recommendationData() {
    if (!state.recomendaciones || (state.recomendaciones.local && state.recomendaciones.modo !== 'personalizado')) {
      return genericRecommendations();
    }
    return state.recomendaciones;
  }

  async function cargarRecomendaciones() {
    if (personalizacionActiva() && state.consentimiento.localOnly) {
      state.recomendaciones = localRecommendations();
      return;
    }
    const session = state.sesion;
    if (session && session.access_token && state.disponible) {
      const result = await rpc('bb_obtener_recomendaciones', {
        p_access_token: session.access_token,
        p_limite: 8
      });
      if (result.data && result.data.ok) {
        state.recomendaciones = result.data;
        return;
      }
    }
    state.recomendaciones = genericRecommendations();
  }

  async function registrarEvento(tipo, payload) {
    if (!personalizacionActiva()) return false;
    const purpose = TYPE_TO_PURPOSE[tipo];
    if (!purpose || !finalidadActiva(purpose)) return false;
    if (state.consentimiento.localOnly) {
      const records = localSignals();
      records.push({
        tipo,
        id_producto: payload && payload.idProducto != null ? Number(payload.idProducto) : null,
        categoria: payload && payload.categoria ? String(payload.categoria).slice(0, 80) : null,
        creado_en: Date.now()
      });
      saveLocalSignals(records);
      state.recomendaciones = localRecommendations();
      renderRecommendations();
      renderPanel();
      return true;
    }
    if (!state.sesion || !state.sesion.access_token) return false;

    const result = await rpc('bb_registrar_evento_recomendacion', {
      p_access_token: state.sesion.access_token,
      p_tipo: tipo,
      p_id_producto: payload && payload.idProducto != null ? payload.idProducto : null,
      p_categoria: payload && payload.categoria ? payload.categoria : null,
      p_termino: payload && payload.termino ? payload.termino : null
    });

    if (result.data && result.data.permitido) {
      agendarRecomendaciones(1400);
      return true;
    }
    return false;
  }

  function registrarVista(idProducto) {
    if (!personalizacionActiva()) return;
    const storeRef = store();
    const products = storeRef && Array.isArray(storeRef.products) ? storeRef.products : [];
    const product = products.find((item) => Number(item.id) === Number(idProducto));
    registrarEvento('VISTA', {
      idProducto: Number(idProducto),
      categoria: product ? product.category : null
    });
  }

  function agendarRecomendaciones(delay) {
    window.clearTimeout(state.refrescoTimer);
    state.refrescoTimer = window.setTimeout(async () => {
      await cargarRecomendaciones();
      renderRecommendations();
      renderPanel();
    }, typeof delay === 'number' ? delay : 900);
  }

  async function limpiarHistorial() {
    const session = state.sesion;
    if (session && session.access_token && state.disponible) {
      const result = await rpc('bb_limpiar_historial', { p_access_token: session.access_token });
      if (!(result.data && result.data.ok)) {
        toast((result.error && result.error.message) || 'No se pudo borrar el historial en el servidor.');
        return;
      }
    }
    if (state.recomendaciones) {
      state.recomendaciones.intereses = [];
      state.recomendaciones.vistos = [];
      if (state.recomendaciones.items) state.recomendaciones.items = [];
    }
    await cargarRecomendaciones();
    renderRecommendations();
    renderPanel();
    toast('Historial de intereses eliminado.');
  }

  /* ------------------------------------------------------------
     Render
     ------------------------------------------------------------ */

  function renderBanner() {
    const banner = $('personalizationConsent');
    if (!banner) return;
    const consent = state.consentimiento;
    const pending = !consent || consent.estado === 'pendiente';
    // Mientras se consulta al servidor no se muestra el banner: evitamos pedir
    // una decisión a quien ya la tomó en su cuenta.
    const hidden = !state.consentimientoListo || !pending || Boolean(state.modalAbierto);
    banner.classList.toggle('hidden', hidden);
    banner.setAttribute('aria-hidden', String(hidden));
  }

  function purposesLabel(purposes) {
    const list = PURPOSE_LIST.filter((purpose) => purposes && purposes[purpose.key]).map((purpose) => purpose.label);
    return list.length ? list.join(', ') : 'Ninguna';
  }

  function renderStatus() {
    const badge = $('privacyStatusBadge');
    if (!badge || !state.consentimiento) return;
    const consent = state.consentimiento;
    const labels = {
      aceptado: 'Personalización activa',
      rechazado: 'Personalización rechazada',
      desactivado: 'Personalización desactivada',
      pendiente: 'Consentimiento pendiente'
    };
    badge.dataset.state = consent.estado;
    badge.textContent = labels[consent.estado] || labels.pendiente;
  }

  function renderPanel() {
    if (!state.consentimiento) return;
    const consent = state.consentimiento;
    const active = personalizacionActiva();

    renderStatus();

    const master = $('privacyMasterToggle');
    if (master) master.checked = active;

    PURPOSE_LIST.forEach((purpose) => {
      const input = $(purpose.drawer);
      if (input) input.checked = Boolean(consent.finalidades[purpose.key]);
    });

    const realtime = $('privacyRealtimeText');
    if (realtime) {
      if (active) {
        realtime.textContent = consent.localOnly
          ? 'Activada solo en este dispositivo. Usamos tu actividad autorizada para sugerencias locales; no se envía ni sincroniza.'
          : 'Activada. El servidor valida tu token y tus finalidades autorizadas antes de calcular cada recomendación.';
      } else if (consent.estado === 'rechazado') {
        realtime.textContent = 'Desactivada. Mostramos recomendaciones generales (populares y novedades) sin usar tu historial.';
      } else if (consent.estado === 'desactivado') {
        realtime.textContent = 'Desactivada. Borramos el perfil de recomendaciones y dejamos de procesar tus datos personales.';
      } else {
        realtime.textContent = 'Consentimiento pendiente. Mientras no autorices, solo verás recomendaciones generales.';
      }
      if (!state.disponible && !consent.localOnly) realtime.textContent += ' Modo local: falta aplicar la migración de privacidad en Supabase.';
    }

    const reactivateNote = $('privacyReactivateText');
    if (reactivateNote) {
      reactivateNote.hidden = !(consent.estado === 'rechazado' || consent.estado === 'desactivado');
    }

    const accepted = $('privacyConsentAccepted');
    if (accepted) accepted.textContent = formatDate(consent.aceptado_en || consent.ultima_aceptacion_en);
    const updated = $('privacyConsentUpdated');
    if (updated) updated.textContent = formatDate(consent.actualizado_en || consent.desactivado_en || consent.rechazado_en);
    const version = $('privacyNoticeVersion');
    if (version) version.textContent = consent.aviso_version || NOTICE_VERSION;
    const purposes = $('privacyConsentPurposes');
    if (purposes) purposes.textContent = purposesLabel(consent.finalidades);

    const disableBtn = $('privacyDisableBtn');
    if (disableBtn) disableBtn.hidden = !active;
    const reactivateBtn = $('privacyReactivateBtn');
    if (reactivateBtn) reactivateBtn.hidden = active;

    renderInterests();
    renderSession();
  }

  function renderInterests() {
    const list = $('privacyInterestList');
    const why = $('privacyWhyText');
    if (!list) return;
    const data = recommendationData();
    const interests = Array.isArray(data.intereses) ? data.intereses : [];

    if (!personalizacionActiva()) {
      list.innerHTML = '<li class="bb-empty">Sin intereses registrados</li>';
      if (why) why.textContent = '¿Por qué veo este producto? Mientras la personalización esté desactivada, las recomendaciones son generales y no se basan en tu historial.';
      return;
    }

    if (!interests.length) {
      list.innerHTML = '<li class="bb-empty">Todavía no hay suficientes señales autorizadas</li>';
      if (why) why.textContent = '¿Por qué veo este producto? Aún no hay intereses suficientes. Navega un poco más con tu consentimiento activo.';
      return;
    }

    list.innerHTML = interests.map((interest) => {
      const label = String(interest.categoria || 'Interés');
      const weight = Number(interest.peso || 0);
      return `<li>${escapeHtml(label)} <b>${weight}</b></li>`;
    }).join('');

    const top = interests[0];
    if (why) {
      why.textContent = `¿Por qué veo este producto? La categoría con más señales autorizadas es ${top.categoria || 'tu interés principal'}. Cada tarjeta muestra el motivo concreto que originó la recomendación.`;
    }
  }

  function escapeHtml(value) {
    if (window.BBStore && typeof window.BBStore.escapeHtml === 'function') {
      return window.BBStore.escapeHtml(value);
    }
    return String(value == null ? '' : value).replace(/[&<>'"]/g, (char) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
    }[char]));
  }

  function renderSession() {
    const session = state.sesion;
    const account = readJSON('beruAccount');
    const authenticated = Boolean(session && session.customer_id);

    const stateNode = $('privacySessionState');
    if (stateNode) stateNode.textContent = authenticated ? 'Autenticado' : 'Invitado';

    const emailNode = $('privacySessionEmail');
    if (emailNode) {
      emailNode.textContent = authenticated
        ? (account && account.email) || (session.cuenta && session.cuenta.correo) || 'Cuenta Byte Bay'
        : 'Sin iniciar sesión';
    }

    const tokenNode = $('privacyTokenState');
    if (tokenNode) {
      tokenNode.className = '';
      if (!session || !session.access_token) {
        tokenNode.textContent = state.disponible ? 'Sin token' : 'Modo local · sin token';
        tokenNode.classList.add('bb-token-muted');
      } else if (tokenIsFresh(session, 0)) {
        tokenNode.textContent = 'Activo · expira ' + formatTime(session.expires_at);
        tokenNode.classList.add('bb-token-ok');
      } else {
        tokenNode.textContent = 'Expirado · renueva para continuar';
        tokenNode.classList.add('bb-token-bad');
      }
    }

    const idNode = $('privacySessionId');
    if (idNode) idNode.textContent = session && session.session_id ? String(session.session_id).slice(0, 8) + '…' : '—';

    const revoke = $('privacyRevokeAll');
    if (revoke) revoke.disabled = !authenticated;
    const refresh = $('privacyRefreshToken');
    if (refresh) refresh.disabled = !(session && session.refresh_token);
  }

  function renderRecommendations() {
    const storeRef = store();
    if (!storeRef || !Array.isArray(storeRef.products)) return;

    const data = recommendationData();
    const byId = new Map(storeRef.products.map((product) => [Number(product.id), product]));
    const items = (Array.isArray(data.items) ? data.items : [])
      .map((item) => {
        const product = byId.get(Number(item.id_producto));
        return product ? { product: product, motivo: item.motivo || '' } : null;
      })
      .filter(Boolean);

    const section = $('recommendationsSection');
    const grid = $('recommendationsGrid');
    if (section && grid) {
      const heading = section.querySelector('h2');
      const description = section.querySelector('.section-head p');
      const kicker = section.querySelector('.section-kicker');
      if (data.modo === 'personalizado' && personalizacionActiva()) {
        if (heading) heading.textContent = 'También te puede interesar';
        if (description) description.textContent = 'Selección basada únicamente en las finalidades que autorizaste.';
        if (kicker) kicker.textContent = 'SELECCIÓN PARA TI';
      } else {
        if (heading) heading.textContent = 'Recomendaciones populares';
        if (description) description.textContent = 'Selección general de Byte Bay, sin usar tu historial personal.';
        if (kicker) kicker.textContent = 'POPULARES EN BYTE BAY';
      }
      grid.innerHTML = items.slice(0, 8).map((item) => storeRef.card(item.product, item.motivo)).join('');
      section.classList.toggle('hidden', !items.length);
    }

    const viewedSection = $('recentlyViewedSection');
    const viewedGrid = $('recentlyViewedGrid');
    if (viewedSection && viewedGrid) {
      const viewedItems = (Array.isArray(data.vistos) ? data.vistos : [])
        .map((item) => byId.get(Number(item.id_producto)))
        .filter(Boolean)
        .slice(0, 4);
      const show = personalizacionActiva() && viewedItems.length > 0;
      viewedGrid.innerHTML = show ? viewedItems.map((product) => storeRef.card(product, '')).join('') : '';
      viewedSection.classList.toggle('hidden', !show);
    }

    if (typeof storeRef.bindCards === 'function') storeRef.bindCards();
  }

  function renderTodo() {
    renderBanner();
    renderPanel();
    renderRecommendations();
  }

  /* ------------------------------------------------------------
     Modales
     ------------------------------------------------------------ */

  function modalFocusables(modal) {
    return Array.from(modal.querySelectorAll('button, input, select, textarea, a[href], [tabindex]:not([tabindex="-1"])'))
      .filter((node) => !node.disabled && node.tabIndex !== -1 && node.offsetParent !== null);
  }

  function openModal(id) {
    const modal = $(id);
    if (!modal) return;
    state.focoPrevio = document.activeElement;
    state.modalAbierto = id;
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('bb-modal-open');
    renderBanner();
    const focusable = modalFocusables(modal)[0];
    if (focusable) window.setTimeout(() => focusable.focus({ preventScroll: true }), 60);
  }

  function closeModal(id) {
    const modal = $(id);
    if (!modal) return;
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    if (state.modalAbierto === id) state.modalAbierto = null;
    if (!document.querySelector('.bb-modal.open')) document.body.classList.remove('bb-modal-open');
    const previous = state.focoPrevio;
    state.focoPrevio = null;
    if (previous && typeof previous.focus === 'function' && document.contains(previous)) {
      window.setTimeout(() => previous.focus({ preventScroll: true }), 30);
    }
    renderBanner();
  }

  function syncPreferenceInputs() {
    const consent = state.consentimiento || normalizeConsent({ estado: 'pendiente' }, false);
    PURPOSE_LIST.forEach((purpose) => {
      const input = $(purpose.pref);
      if (input) input.checked = Boolean(consent.finalidades[purpose.key]);
    });
  }

  function readPreferenceInputs() {
    const purposes = emptyPurposes();
    PURPOSE_LIST.forEach((purpose) => {
      const input = $(purpose.pref);
      purposes[purpose.key] = Boolean(input && input.checked);
    });
    return purposes;
  }

  async function abrirPreferencias(medium) {
    syncPreferenceInputs();
    openModal('privacyPreferencesModal');
    if (state.sesion && state.sesion.access_token && state.disponible) {
      // El botón "Configurar preferencias" también queda auditado.
      await guardarConsentimiento(
        'PREFERENCIAS_ACTUALIZADAS',
        'configurar',
        state.consentimiento ? state.consentimiento.finalidades : emptyPurposes(),
        medium || 'MODAL_PREFERENCIAS'
      );
      renderBanner();
    }
  }

  async function aceptarDesdeBanner() {
    const result = await guardarConsentimiento('CONSENTIMIENTO_ACEPTADO', 'aceptado', allPurposes(), 'BANNER_INICIAL');
    if (result.ok) {
      toast(result.local
        ? 'Personalización activada solo en este dispositivo. Tu historial no se sincroniza.'
        : 'Personalización activada. Puedes cambiarla cuando quieras.');
    } else {
      toast(result.message || 'No se pudo registrar tu consentimiento.', 'error');
    }
  }

  async function rechazarDesdeBanner() {
    const result = await guardarConsentimiento('CONSENTIMIENTO_RECHAZADO', 'rechazado', emptyPurposes(), 'BANNER_INICIAL');
    if (result.ok) toast('Seguiremos mostrando recomendaciones generales.');
    else toast(result.message || 'No se pudo registrar tu decisión.', 'error');
  }

  async function confirmarDesactivacion() {
    const result = await guardarConsentimiento('PERSONALIZACION_DESACTIVADA', 'desactivado', emptyPurposes(), 'MENU_CONFIGURACION');
    closeModal('privacyDisableModal');
    if (result.ok) {
      state.recomendaciones = null;
      await cargarRecomendaciones();
      renderTodo();
      toast('Personalización desactivada. Tu historial de intereses fue eliminado.');
    } else {
      toast(result.message || 'No se pudo desactivar la personalización.', 'error');
    }
  }

  async function confirmarReactivacion() {
    const result = await guardarConsentimiento('PERSONALIZACION_REACTIVADA', 'personalizado', allPurposes(), 'MODAL_PREFERENCIAS');
    closeModal('privacyReactivateModal');
    if (result.ok) {
      await cargarRecomendaciones();
      renderTodo();
      toast(result.local
        ? 'Personalización reactivada solo en este dispositivo. Tu historial no se sincroniza.'
        : 'Personalización reactivada con tu nueva autorización.');
    } else {
      toast(result.message || 'No se pudo reactivar la personalización.', 'error');
    }
  }

  async function guardarPreferencias(activar) {
    const purposes = readPreferenceInputs();
    const consent = state.consentimiento;
    if (activar) {
      if (!PURPOSE_LIST.some((purpose) => purposes[purpose.key])) {
        toast('Selecciona al menos una finalidad para activar la personalización.');
        return;
      }
      const alreadyActive = personalizacionActiva();
      const eventType = alreadyActive
        ? 'PREFERENCIAS_ACTUALIZADAS'
        : (consent && consent.estado === 'desactivado' ? 'PERSONALIZACION_REACTIVADA' : 'CONSENTIMIENTO_ACEPTADO');
      const result = await guardarConsentimiento(eventType, 'personalizado', purposes, 'MODAL_PREFERENCIAS');
      if (result.ok) {
        closeModal('privacyPreferencesModal');
        toast(result.local
          ? 'Preferencias guardadas solo en este dispositivo; no se sincronizan.'
          : alreadyActive ? 'Preferencias actualizadas.' : 'Personalización activada.');
      } else {
        toast(result.message || 'No se pudieron guardar tus preferencias.', 'error');
      }
      return;
    }

    const eventType = 'PREFERENCIAS_ACTUALIZADAS';
    const decision = personalizacionActiva() ? 'personalizado' : 'configurar';
    const result = await guardarConsentimiento(eventType, decision, purposes, 'MODAL_PREFERENCIAS');
    if (result.ok) {
      closeModal('privacyPreferencesModal');
      toast(result.local
        ? 'Preferencias guardadas solo en este dispositivo; no se sincronizan.'
        : decision === 'configurar' ? 'Preferencias guardadas. La personalización sigue pendiente.' : 'Preferencias actualizadas.');
    } else {
      toast(result.message || 'No se pudieron guardar tus preferencias.', 'error');
    }
  }

  async function cambiarFinalidad(input) {
    if (!input) return;
    const purposes = emptyPurposes();
    PURPOSE_LIST.forEach((purpose) => {
      const node = $(purpose.drawer);
      purposes[purpose.key] = Boolean(node && node.checked);
    });
    const active = personalizacionActiva();
    // Un interruptor granular NUNCA activa el algoritmo por sí solo: solo
    // registra la preferencia. La activación exige el flujo explícito de
    // reactivación con su resumen y aceptación.
    const eventType = 'PREFERENCIAS_ACTUALIZADAS';
    const decision = active ? 'personalizado' : 'configurar';
    const result = await guardarConsentimiento(eventType, decision, purposes, 'MENU_CONFIGURACION');
    if (!result.ok) {
      // Revertir la interfaz si el servidor rechazó el cambio.
      renderPanel();
      toast(result.message || 'No se pudo actualizar la finalidad.', 'error');
    }
  }

  function descargarComprobante() {
    return (async () => {
      let payload = null;
      if (state.sesion && state.sesion.access_token && state.disponible) {
        const result = await rpc('bb_comprobante_consentimiento', { p_access_token: state.sesion.access_token });
        if (result.data && result.data.ok) payload = result.data;
      }
      if (!payload) {
        payload = {
          ok: true,
          origen: 'dispositivo',
          aviso_version: NOTICE_VERSION,
          entidad: 'Byte Bay',
          generado_en: new Date().toISOString(),
          consentimiento: state.consentimiento,
          historial_intereses: recommendationData().intereses,
          nota: 'Comprobante local. Aplica la migración de privacidad para obtener el registro firmado del servidor.'
        };
      }
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'byte-bay-consentimiento-' + NOTICE_VERSION + '.json';
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1500);
      toast('Comprobante de consentimiento descargado.');
    })();
  }

  /* ------------------------------------------------------------
     Eventos de interfaz
     ------------------------------------------------------------ */

  function bindUI() {
    const accept = $('acceptPersonalization');
    if (accept) accept.addEventListener('click', aceptarDesdeBanner);
    const reject = $('rejectPersonalization');
    if (reject) reject.addEventListener('click', rechazarDesdeBanner);
    const configure = $('configurePersonalization');
    if (configure) configure.addEventListener('click', () => abrirPreferencias('MODAL_PREFERENCIAS'));

    const master = $('privacyMasterToggle');
    if (master) {
      master.addEventListener('change', () => {
        if (master.checked) {
          openModal('privacyReactivateModal');
        } else {
          openModal('privacyDisableModal');
        }
      });
    }

    const disable = $('privacyDisableBtn');
    if (disable) disable.addEventListener('click', () => openModal('privacyDisableModal'));
    const reactivate = $('privacyReactivateBtn');
    if (reactivate) reactivate.addEventListener('click', () => openModal('privacyReactivateModal'));
    const openPrefs = $('privacyOpenPreferences');
    if (openPrefs) openPrefs.addEventListener('click', () => abrirPreferencias('MODAL_PREFERENCIAS'));

    const confirmDisable = $('confirmDisablePrivacy');
    if (confirmDisable) confirmDisable.addEventListener('click', confirmarDesactivacion);
    const confirmReactivate = $('confirmReactivatePrivacy');
    if (confirmReactivate) confirmReactivate.addEventListener('click', confirmarReactivacion);

    const prefsActivate = $('privacyPrefsActivate');
    if (prefsActivate) prefsActivate.addEventListener('click', () => guardarPreferencias(true));
    const prefsSave = $('privacyPrefsSave');
    if (prefsSave) prefsSave.addEventListener('click', () => guardarPreferencias(false));

    PURPOSE_LIST.forEach((purpose) => {
      const drawerInput = $(purpose.drawer);
      if (drawerInput) drawerInput.addEventListener('change', () => cambiarFinalidad(drawerInput));
    });

    const clearHistory = $('privacyClearHistory');
    if (clearHistory) clearHistory.addEventListener('click', limpiarHistorial);
    const clearViewed = $('clearViewed');
    if (clearViewed) clearViewed.addEventListener('click', limpiarHistorial);

    const receipt = $('privacyDownloadReceipt');
    if (receipt) receipt.addEventListener('click', descargarComprobante);

    const refresh = $('privacyRefreshToken');
    if (refresh) {
      refresh.addEventListener('click', async () => {
        const result = await refrescarToken(true);
        renderSession();
        if (result.ok) toast('Token renovado correctamente.');
        else toast('No se pudo renovar el token. Inicia sesión nuevamente.', 'error');
      });
    }

    const revokeAll = $('privacyRevokeAll');
    if (revokeAll) {
      revokeAll.addEventListener('click', async () => {
        const confirmed = window.confirm('Se cerrará la sesión en todos los dispositivos. Tendrás que iniciar sesión nuevamente en cada uno. ¿Continuar?');
        if (!confirmed) return;
        await cerrarSesionEnTodos();
        try {
          localStorage.removeItem('beruAccount');
        } catch (error) {
          /* noop */
        }
        if (window.BBStore && typeof window.BBStore.updateAccountHeader === 'function') {
          window.BBStore.updateAccountHeader();
        }
        toast('Sesión cerrada en todos los dispositivos.');
      });
    }

    document.querySelectorAll('[data-bb-close]').forEach((button) => {
      button.addEventListener('click', () => closeModal(button.dataset.bbClose));
    });

    document.querySelectorAll('.bb-modal').forEach((modal) => {
      modal.addEventListener('click', (event) => {
        if (event.target === modal) closeModal(modal.id);
      });
    });

    document.addEventListener('keydown', (event) => {
      if (!state.modalAbierto) return;
      if (event.key === 'Escape') {
        event.preventDefault();
        closeModal(state.modalAbierto);
        return;
      }
      if (event.key !== 'Tab') return;
      const modal = $(state.modalAbierto);
      if (!modal) return;
      const focusables = modalFocusables(modal);
      if (!focusables.length) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus({ preventScroll: true });
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus({ preventScroll: true });
      }
    });
  }

  function bindGlobalEvents() {
    window.addEventListener('bb:catalogo-actualizado', () => {
      renderRecommendations();
    });
    window.addEventListener('bb:store-ready', () => {
      renderRecommendations();
      renderPanel();
    });
    window.addEventListener('bb:drawer-open', () => {
      renderPanel();
      renderSession();
    });
    window.addEventListener('bb:account-updated', () => {
      renderSession();
    });
    window.addEventListener('online', () => {
      if (!state.inicializado) return;
      asegurarSesion().then(async () => {
        await cargarConsentimiento();
        await cargarRecomendaciones();
        renderTodo();
      });
    });
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible' && state.sesion && state.sesion.refresh_token) {
        refrescarToken(false);
      }
    });
    state.validacionTimer = window.setInterval(() => {
      if (document.visibilityState !== 'visible') return;
      if (state.sesion && state.sesion.refresh_token) refrescarToken(false);
    }, 5 * 60 * 1000);
  }

  /* ------------------------------------------------------------
     Arranque
     ------------------------------------------------------------ */

  async function initialize() {
    if (state.inicializado) return;
    state.inicializado = true;

    // Se elimina la simulación local anterior: no debe poder activar nada.
    try {
      localStorage.removeItem(KEYS.legacyConsent);
      localStorage.removeItem(KEYS.legacyViewed);
    } catch (error) {
      /* noop */
    }

    state.consentimiento = readCachedConsent();
    bindUI();
    bindGlobalEvents();
    renderTodo();

    await asegurarSesion();
    await cargarConsentimiento();
    await cargarRecomendaciones();
    renderTodo();
    dispatchPrivacy();
  }

  window.BBPrivacy = {
    initialize: initialize,
    inicializarBanner: renderBanner,
    actualizarPanel: () => {
      renderPanel();
      renderBanner();
    },
    actualizarSesionUI: renderSession,
    renderizarRecomendaciones: renderRecommendations,
    renderTodo: renderTodo,
    personalizacionActiva: personalizacionActiva,
    finalidadActiva: finalidadActiva,
    registrarEvento: registrarEvento,
    registrarVista: registrarVista,
    iniciarSesion: iniciarSesion,
    registrarCuenta: registrarCuenta,
    sincronizarSesionGoogle: sincronizarSesionGoogle,
    cerrarSesionActual: cerrarSesionActual,
    cerrarSesionEnTodos: cerrarSesionEnTodos,
    validarParaAccion: validarParaAccion,
    obtenerSesionCliente: obtenerSesionCliente,
    abrirCuenta: () => {
      if (window.BBStore && typeof window.BBStore.openAccountModal === 'function') window.BBStore.openAccountModal();
    },
    abrirPreferencias: abrirPreferencias,
    sesion: () => state.sesion,
    consentimiento: () => state.consentimiento,
    recomendaciones: () => recommendationData(),
    servidorDisponible: () => state.disponible,
    refrescarToken: () => refrescarToken(true),
    descargarComprobante: descargarComprobante
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize, { once: true });
  } else {
    initialize();
  }
})();
