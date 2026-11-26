/* Disuasivo de inspección: bloquea los atajos habituales de DevTools y el
   menú contextual. NO es una medida de seguridad: DevTools puede abrirse por
   otros medios y todo lo que llega al navegador es público por diseño.
   Los secretos y las operaciones sensibles viven solo en el servidor. */
(function () {
  'use strict';

  var MENSAJE = 'Las herramientas de inspección están desactivadas en esta tienda.';
  var ultimoAviso = 0;

  function avisar() {
    var ahora = Date.now();
    if (ahora - ultimoAviso < 2500) return;
    ultimoAviso = ahora;

    var nota = document.getElementById('bbInspectionNotice');
    if (!nota) {
      nota = document.createElement('div');
      nota.id = 'bbInspectionNotice';
      nota.setAttribute('role', 'status');
      nota.setAttribute('aria-live', 'polite');
      nota.style.cssText = 'position:fixed;left:50%;bottom:24px;z-index:2147483647;' +
        'transform:translateX(-50%);max-width:min(92vw,420px);padding:10px 14px;' +
        'border-radius:12px;background:#123832;color:#F2FFF9;font:700 13px/1.35 Manrope,sans-serif;' +
        'box-shadow:0 10px 30px rgba(0,0,0,.28);text-align:center;pointer-events:none';
      document.body.appendChild(nota);
    }
    nota.textContent = MENSAJE;
    nota.hidden = false;
    window.clearTimeout(avisar.temporizador);
    avisar.temporizador = window.setTimeout(function () { nota.hidden = true; }, 2200);
  }

  function esAtajo(evento) {
    var clave = String(evento.key || '').toUpperCase();
    if (clave === 'F12') return true;
    if (evento.ctrlKey && evento.shiftKey && ['I', 'J', 'C', 'K'].indexOf(clave) >= 0) return true;
    if (evento.ctrlKey && !evento.shiftKey && clave === 'U') return true;
    if (evento.metaKey && evento.altKey && ['I', 'J', 'C'].indexOf(clave) >= 0) return true;
    return false;
  }

  document.addEventListener('keydown', function (evento) {
    if (!esAtajo(evento)) return;
    evento.preventDefault();
    evento.stopPropagation();
    avisar();
  }, true);

  document.addEventListener('contextmenu', function (evento) {
    evento.preventDefault();
    avisar();
  }, true);
})();
