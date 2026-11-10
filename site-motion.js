(function(){
  // 3D tilt on product cards
  document.addEventListener('mousemove', function(e){
    const card = e.target.closest('.product-card');
    if(!card) return;
    const rect = card.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    card.style.transform = `perspective(800px) rotateY(${x*8}deg) rotateX(${-y*8}deg) translateY(-4px)`;
  });
  document.addEventListener('mouseleave', function(e){
    const card = e.target.closest && e.target.closest('.product-card');
    if(card) card.style.transform = '';
  }, true);
  // Scroll reveal
  if('IntersectionObserver' in window){
    const obs = new IntersectionObserver(function(entries){
      entries.forEach(function(en){
        if(en.isIntersecting){ en.target.classList.add('visible'); obs.unobserve(en.target); }
      });
    },{threshold:0.12});
    document.querySelectorAll('.product-card,.category-card,.benefit,.promo,.checkout-card').forEach(function(el){ el.classList.add('reveal'); obs.observe(el); });
  }
})();