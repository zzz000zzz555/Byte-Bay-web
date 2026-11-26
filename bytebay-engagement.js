/* Byte · reacciones globales, contador de visitas y compartir productos.
   Las tablas de Supabase no son accesibles desde el navegador: solo se
   llaman las RPC bb_reaccionar, bb_registrar_vista y bb_estado_reacciones. */
(function () {
  'use strict';

  var SUPABASE_URL = 'https://inwugycvtaaceugvtfpv.supabase.co';
  var SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_5cTHcYI6byM03VSffW0OlQ_JlBB8D9u';
  var SITE_URL = 'https://zzz000zzz555.github.io/Byte-Bay-web/';
  var WHATSAPP_URL = 'https://wa.me/51963058461';
  var KEY_VISITANTE = 'bytebay_visitante_id';

  var ICONO_ARRIBA = '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 10v11H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3Z"/><path d="M7 10l4.2-7.2a1.7 1.7 0 0 1 3 .8V9h5.1a2 2 0 0 1 2 2.4l-1.5 7A2 2 0 0 1 17.7 20H7"/></svg>';
  var ICONO_ABAJO = '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 14V3H4a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h3Z"/><path d="M7 14l4.2 7.2a1.7 1.7 0 0 0 3-.8V15h5.1a2 2 0 0 0 2-2.4l-1.5-7A2 2 0 0 0 17.7 4H7"/></svg>';

  var cliente = window.supabase && typeof window.supabase.createClient === 'function'
    ? window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
        auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
      })
    : null;

  var estado = {
    productos: {},
    pagina: { likes: 0, dislikes: 0 },
    mias: {},
    visitas: 0
  };
  var enProceso = Object.create(null);
  var enlaceProfundoHecho = false;

  function visitante() {
    try {
      var actual = localStorage.getItem(KEY_VISITANTE);
      if (actual && /^[A-Za-z0-9_-]{16,80}$/.test(actual)) return actual;
      var nuevo;
      if (window.crypto && typeof window.crypto.randomUUID === 'function') {
        nuevo = window.crypto.randomUUID();
      } else if (window.crypto && typeof window.crypto.getRandomValues === 'function') {
        var bytes = new Uint8Array(16);
        window.crypto.getRandomValues(bytes);
        nuevo = Array.prototype.map.call(bytes, function (b) {
          return ('0' + b.toString(16)).slice(-2);
        }).join('');
      } else {
        nuevo = 'bb' + Date.now().toString(36) + Math.random().toString(36).slice(2);
      }
      nuevo = nuevo.replace(/[^A-Za-z0-9_-]/g, '').slice(0, 80);
      if (nuevo.length < 16) nuevo = nuevo + 'bytebay' + nuevo;
      localStorage.setItem(KEY_VISITANTE, nuevo);
      return nuevo;
    } catch (error) {
      return 'visitante_bytebay_local_0001';
    }
  }

  var ID_VISITANTE = visitante();

  function numero(value) {
    var n = Number(value);
    return isFinite(n) && n > 0 ? Math.round(n) : 0;
  }

  function claveProducto(id) {
    return 'producto:' + String(id);
  }

  function clavePagina() {
    return 'pagina:';
  }

  function botones(markupId) {
    return '<div class="bb-engage-buttons" role="group" aria-label="Opinión sobre ' + markupId + '">' +
      '<button type="button" class="bb-engage-btn" data-reaccion="like" aria-pressed="false">' +
        ICONO_ARRIBA + '<span>Me gusta</span><b data-conteo="like">0</b></button>' +
      '<button type="button" class="bb-engage-btn" data-reaccion="dislike" aria-pressed="false">' +
        ICONO_ABAJO + '<span>No me gusta</span><b data-conteo="dislike">0</b></button>' +
      '</div>';
  }

  function urlProducto(id) {
    return SITE_URL + '?producto=' + encodeURIComponent(id);
  }

  function mensajeProducto(nombre) {
    return 'Hola Byte-Bay, me interesa comprar el producto: ' + nombre + '. ¿Tienen stock?';
  }

  function enviar(markupId, texto) {
    if (!cliente) return Promise.resolve(null);
    return cliente.rpc(markupId, texto).then(function (resultado) {
      return resultado && resultado.data ? resultado.data : null;
    }).catch(function () {
      return null;
    });
  }

  function pintarGrupo(grupo, datos, seleccion) {
    if (!grupo) return;
    var like = grupo.querySelector('[data-reaccion="like"]');
    var dislike = grupo.querySelector('[data-reaccion="dislike"]');
    if (like) {
      like.querySelector('[data-conteo="like"]').textContent = String(numero(datos && datos.likes));
      like.setAttribute('aria-pressed', seleccion === 'like' ? 'true' : 'false');
    }
    if (dislike) {
      dislike.querySelector('[data-conteo="dislike"]').textContent = String(numero(datos && datos.dislikes));
      dislike.setAttribute('aria-pressed', seleccion === 'dislike' ? 'true' : 'false');
    }
  }

  function pintarEstado() {
    document.querySelectorAll('.product-card[data-bb-engage="1"]').forEach(function (card) {
      var id = card.getAttribute('data-id');
      var grupo = card.querySelector('.bb-engage-buttons');
      pintarGrupo(grupo, estado.productos[id] || {}, estado.mias[claveProducto(id)] || '');
    });
    pintarGrupo(document.querySelector('.bb-engage-page .bb-engage-buttons'),
      estado.pagina, estado.mias[clavePagina()] || '');
    var contador = document.querySelector('#bbContadorVisitas');
    if (contador) contador.textContent = numero(estado.visitas).toLocaleString('es-PE');
  }

  function aplicarRespuesta(markupId, id, respuesta) {
    if (!respuesta || respuesta.ok === false) return;
    var clave = markupId === 'bb_reaccionar'
      ? (id === 'pagina' ? clavePagina() : claveProducto(id))
      : '';

    if (markupId === 'bb_registrar_vista') {
      estado.visitas = numero(respuesta.total);
    } else if (markupId === 'bb_reaccionar') {
      if (id === 'pagina') {
        estado.pagina = { likes: numero(respuesta.likes), dislikes: numero(respuesta.dislikes) };
      } else {
        estado.productos[String(id)] = {
          likes: numero(respuesta.likes),
          dislikes: numero(respuesta.dislikes)
        };
      }
      if (respuesta.seleccion) estado.mias[clave] = respuesta.seleccion;
      else delete estado.mias[clave];
    }
    pintarEstado();
  }

  function reaccionar(tipo, id, grupo) {
    var objetivo = id === 'pagina' ? 'pagina' : 'producto';
    var objetivoId = id === 'pagina' ? '' : String(id);
    var clave = id === 'pagina' ? clavePagina() : claveProducto(objetivoId);
    if (enProceso[clave]) return;
    enProceso[clave] = true;
    grupo.setAttribute('aria-busy', 'true');

    enviar('bb_reaccionar', {
      p_objetivo: objetivo,
      p_objetivo_id: objetivoId,
      p_tipo: tipo,
      p_visitante: ID_VISITANTE
    }).then(function (respuesta) {
      aplicarRespuesta('bb_reaccionar', id, respuesta);
    }).then(function () {
      enProceso[clave] = false;
      grupo.removeAttribute('aria-busy');
    });
  }

  function copiar(texto) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(texto).catch(function () { return fallbackCopiar(texto); });
    }
    return fallbackCopiar(texto);
  }

  function fallbackCopiar(texto) {
    try {
      var area = document.createElement('textarea');
      area.value = texto;
      area.setAttribute('readonly', '');
      area.style.position = 'fixed';
      area.style.opacity = '0';
      document.body.appendChild(area);
      area.select();
      document.execCommand('copy');
      document.body.removeChild(area);
    } catch (error) { /* Copiado opcional. */ }
    return Promise.resolve();
  }

  function realzarProducto(card) {
    if (card.getAttribute('data-bb-engage') === '1') return;
    var id = card.getAttribute('data-id') || '';
    if (!/^[0-9]{1,12}$/.test(id)) return;
    card.setAttribute('data-bb-engage', '1');

    var barra = document.createElement('div');
    barra.className = 'bb-engage-card';
    barra.innerHTML = botones('este producto') +
      '<div class="bb-engage-share" role="group" aria-label="Compartir este producto">' +
        '<a class="bb-share" data-compartir="whatsapp" href="#" aria-label="Compartir por WhatsApp">WhatsApp</a>' +
        '<a class="bb-share" data-compartir="facebook" href="#" target="_blank" rel="noopener noreferrer" aria-label="Compartir en Facebook">Facebook</a>' +
        '<a class="bb-share" data-compartir="x" href="#" target="_blank" rel="noopener noreferrer" aria-label="Compartir en X">X</a>' +
        '<button type="button" class="bb-share" data-compartir="copiar" aria-label="Copiar enlace del producto">Copiar enlace</button>' +
      '</div>';
    card.appendChild(barra);

    var grupo = barra.querySelector('.bb-engage-buttons');
    grupo.addEventListener('click', function (event) {
      var boton = event.target.closest('[data-reaccion]');
      if (!boton) return;
      event.preventDefault();
      event.stopPropagation();
      reaccionar(boton.getAttribute('data-reaccion'), Number(id), grupo);
    });

    barra.querySelector('.bb-engage-share').addEventListener('click', function (event) {
      var control = event.target.closest('[data-compartir]');
      if (!control) return;
      event.preventDefault();
      event.stopPropagation();

      var nombre = card.querySelector('h3') ? card.querySelector('h3').textContent.trim() : 'producto';
      var enlace = urlProducto(id);
      var tipo = control.getAttribute('data-compartir');

      if (tipo === 'whatsapp') {
        window.open(WHATSAPP_URL + '?text=' + encodeURIComponent(mensajeProducto(nombre)), '_blank', 'noopener,noreferrer');
      } else if (tipo === 'facebook') {
        control.href = 'https://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent(enlace);
        window.open(control.href, '_blank', 'noopener,noreferrer');
      } else if (tipo === 'x') {
        control.href = 'https://twitter.com/intent/tweet?text=' +
          encodeURIComponent('Recomiendo ' + nombre + ' en Byte Bay') + '&url=' + encodeURIComponent(enlace);
        window.open(control.href, '_blank', 'noopener,noreferrer');
      } else if (tipo === 'copiar') {
        copiar(enlace).then(function () {
          if (typeof window.showToast === 'function') window.showToast('Enlace del producto copiado');
        });
      }
    });

    pintarGrupo(grupo, estado.productos[id] || {}, estado.mias[claveProducto(id)] || '');
  }

  function realzarVisibles() {
    document.querySelectorAll('#productGrid .product-card').forEach(realzarProducto);
    if (!enlaceProfundoHecho) {
      var parametros = new URLSearchParams(window.location.search);
      var producto = parametros.get('producto');
      var busqueda = parametros.get('q');
      if (producto && /^[0-9]{1,12}$/.test(producto) &&
          document.querySelector('#productGrid .product-card[data-id="' + producto + '"]')) {
        enlaceProfundoHecho = true;
        if (typeof window.openProductModal === 'function') window.openProductModal(Number(producto));
      } else if (busqueda && document.querySelector('#searchForm')) {
        enlaceProfundoHecho = true;
        document.querySelector('#searchInput').value = busqueda;
        document.querySelector('#searchForm').requestSubmit();
      }
    }
  }

  function crearWidgetPagina() {
    if (document.querySelector('.bb-engage-page')) return;
    var footer = document.querySelector('footer#ayuda');
    if (!footer) return;
    var seccion = document.createElement('section');
    seccion.className = 'bb-engage-page';
    seccion.setAttribute('aria-label', 'Opinión y visitas de Byte Bay');
    seccion.innerHTML = '<div class="bb-engage-page__texto"><strong>¿Te gusta Byte Bay?</strong>' +
      '<span>Tu opinión nos ayuda a mejorar la tienda.</span></div>' +
      botones('la tienda') +
      '<div class="bb-engage-visitas">Visitas a la página: <b id="bbContadorVisitas">0</b></div>';
    var inferior = footer.querySelector('.footer-bottom');
    if (inferior) footer.insertBefore(seccion, inferior);
    else footer.appendChild(seccion);

    seccion.querySelector('.bb-engage-buttons').addEventListener('click', function (event) {
      var boton = event.target.closest('[data-reaccion]');
      if (!boton) return;
      event.preventDefault();
      event.stopPropagation();
      reaccionar(boton.getAttribute('data-reaccion'), 'pagina', seccion.querySelector('.bb-engage-buttons'));
    });
  }

  function cargarEstado() {
    return enviar('bb_estado_reacciones', { p_visitante: ID_VISITANTE }).then(function (respuesta) {
      if (!respuesta || respuesta.ok === false) return;
      estado.productos = respuesta.productos || {};
      estado.pagina = respuesta.pagina || { likes: 0, dislikes: 0 };
      estado.mias = respuesta.mias || {};
      estado.visitas = numero(respuesta.visitas);
      pintarEstado();
    });
  }

  function registrarVista() {
    return enviar('bb_registrar_vista', { p_visitante: ID_VISITANTE }).then(function (respuesta) {
      aplicarRespuesta('bb_registrar_vista', '', respuesta);
    });
  }

  function iniciar() {
    crearWidgetPagina();
    realzarVisibles();
    var grid = document.querySelector('#productGrid');
    if (grid && typeof MutationObserver === 'function') {
      var observador = new MutationObserver(realzarVisibles);
      observador.observe(grid, { childList: true, subtree: true });
    }
    document.addEventListener('bb:catalogo-actualizado', realzarVisibles);
    cargarEstado().then(registrarVista);
  }

  window.ByteBayEngagement = {
    visitante: function () { return ID_VISITANTE; },
    estado: function () { return estado; },
    reaccionar: function (id, tipo) {
      return reaccionar(tipo, id, document.querySelector('.bb-engage-page .bb-engage-buttons'));
    },
    actualizar: realzarVisibles,
    urlProducto: urlProducto
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar);
  else iniciar();
}());
