(function () {
  'use strict';

  // 3D tilt con rect cacheado por tarjeta y una sola escritura por frame.
  var rectas = typeof WeakMap === 'function' ? new WeakMap() : null;
  var pendiente = null;
  var marcoTilt = 0;

  function aplicarTilt() {
    marcoTilt = 0;
    if (!pendiente) return;
    var card = pendiente.card;
    var x = pendiente.x;
    var y = pendiente.y;
    pendiente = null;
    if (!card || !card.isConnected) return;
    card.style.transform = 'perspective(800px) rotateY(' + (x * 8).toFixed(2) + 'deg) rotateX(' + (-y * 8).toFixed(2) + 'deg) translateY(-4px)';
  }

  document.addEventListener('pointermove', function (e) {
    if (e.pointerType === 'touch' || !window.matchMedia('(hover: hover)').matches) return;
    var card = e.target.closest ? e.target.closest('.product-card') : null;
    if (!card) return;
    var rect = rectas && rectas.get(card);
    if (!rect) { rect = card.getBoundingClientRect(); if (rectas) rectas.set(card, rect); }
    var x = (e.clientX - rect.left) / rect.width - 0.5;
    var y = (e.clientY - rect.top) / rect.height - 0.5;
    pendiente = { card: card, x: Math.max(-0.5, Math.min(0.5, x)), y: Math.max(-0.5, Math.min(0.5, y)) };
    if (!marcoTilt) marcoTilt = requestAnimationFrame(aplicarTilt);
  }, { passive: true });

  document.addEventListener('pointerenter', function (e) {
    var card = e.target.closest ? e.target.closest('.product-card') : null;
    if (card && rectas) rectas.set(card, card.getBoundingClientRect());
  }, true);

  document.addEventListener('pointerout', function (e) {
    var card = e.target.closest ? e.target.closest('.product-card') : null;
    if (!card) return;
    var relacionado = e.relatedTarget && e.relatedTarget.closest ? e.relatedTarget.closest('.product-card') : null;
    if (relacionado === card) return;
    card.style.transform = '';
    if (rectas) rectas.delete(card);
  }, true);

  // Un único observador de revelado para todos los elementos.
  var estados = new WeakSet();
  var revealObserver = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (en.isIntersecting) { en.target.classList.add('visible'); revealObserver.unobserve(en.target); }
    });
  }, { threshold: 0.1 });

  function observarNuevos() {
    document.querySelectorAll('.product-card,.category-card,.benefit,.promo,.checkout-card,.reveal').forEach(function (el) {
      if (estados.has(el)) return;
      estados.add(el);
      el.classList.add('reveal');
      revealObserver.observe(el);
    });
  }

  observarNuevos();
  window.addEventListener('bb:catalogo-actualizado', observarNuevos);
})();
