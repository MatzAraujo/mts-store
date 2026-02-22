// app.js (módulo principal — usa libs globais: SplitType, Lenis, gsap, ScrollTrigger, Swiper)

const { gsap } = window;
const ScrollTrigger = window.ScrollTrigger || window.gsap?.ScrollTrigger;
const SplitType = window.SplitType;
const Lenis = window.Lenis;
const Swiper = window.Swiper;

if (ScrollTrigger && gsap) {
  gsap.registerPlugin(ScrollTrigger);
}

/* Initialization entry */
document.addEventListener('DOMContentLoaded', () => {
  initReducedMotion();
  initHeader();
  initMobileNav();
  initCartDrawer();
  initSwiper();
  initHeroAnimations();
  initScrollAnimations();
  initProductHoverSwap();
  setFooterYear();
});

/* Reduced motion respect */
function initReducedMotion(){
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(reduce){
    document.documentElement.classList.add('reduced-motion');
  }
}

/* Header: transparent -> solid on scroll */
function initHeader(){
  const header = document.getElementById('siteHeader');
  const hero = document.getElementById('homeHero');

  const update = () => {
    const scrolled = window.scrollY > (hero ? (hero.offsetHeight - 120) : 80);
    if(scrolled) header.classList.add('scrolled');
    else header.classList.remove('scrolled');
  };

  update();
  window.addEventListener('scroll', throttle(update, 50));
}

/* Mobile nav */
function initMobileNav(){
  const hamburger = document.getElementById('hamburger');
  const panel = document.getElementById('mobilePanel');

  hamburger.addEventListener('click', () => {
    const open = panel.classList.toggle('open');
    hamburger.setAttribute('aria-expanded', String(open));
    panel.setAttribute('aria-hidden', String(!open));
    if(open) panel.querySelector('a')?.focus();
  });
}

/* Hero animations: split title reveal + media */
function initHeroAnimations(){
  if (document.documentElement.classList.contains('reduced-motion')) return;

  const title = document.getElementById('heroTitle');
  const heroMedia = document.getElementById('heroMedia');

  if(!title) return;

  let split;
  try{
    if (typeof SplitType === 'function') {
      split = new SplitType(title, { types: 'lines,words,chars', absolute: true });
    } else {
      throw new Error('SplitType not available');
    }
  }catch(e){
    const text = title.textContent.trim();
    title.innerHTML = text.split('').map(c => `<span class="char">${c}</span>`).join('');
  }

  const chars = title.querySelectorAll('.char, .word, .line') || [];

  gsap.set([title, heroMedia], {autoAlpha:0});
  const tl = gsap.timeline({defaults:{ease:'power3.out', duration:0.9}});
  tl.to(heroMedia, {autoAlpha:1, scale:1.03, duration:1.2}, 0)
    .fromTo(chars, {y:24, autoAlpha:0}, {y:0, autoAlpha:1, stagger:0.02, duration:.8}, 0.12)
    .to(title, {autoAlpha:1}, 0.12);

  // small parallax on hero image
  if (ScrollTrigger) {
    gsap.to(heroMedia, {
      yPercent: 6,
      ease: 'none',
      scrollTrigger: {
        trigger: heroMedia,
        start: 'top top',
        end: 'bottom top',
        scrub: 0.6
      }
    });
  }
}

/* Scroll-based reveals */
function initScrollAnimations(){
  if (document.documentElement.classList.contains('reduced-motion')) return;

  // Categories tiles reveal
  document.querySelectorAll('#categoriesGrid .cat-tile').forEach((el, i) => {
    gsap.fromTo(el, {y:18, autoAlpha:0}, {
      y:0, autoAlpha:1, duration:.7, delay: i*0.06, ease:'power3.out',
      scrollTrigger:{trigger:el, start:'top 85%'}
    });
  });

  // Benefits
  document.querySelectorAll('#benefitsGrid .benefit').forEach((el, i) => {
    gsap.fromTo(el, {y:10, autoAlpha:0}, {
      y:0, autoAlpha:1, duration:.6, delay: i*0.06, ease:'power3.out',
      scrollTrigger:{trigger:el, start:'top 92%'}
    });
  });

  // Featured section header
  const featuredHead = document.querySelector('.section-head');
  if(featuredHead){
    gsap.from(featuredHead, {
      y:18, autoAlpha:0, duration:.7, ease:'power3.out',
      scrollTrigger:{trigger:featuredHead, start:'top 80%'}
    });
  }
}

/* Swiper init */
function initSwiper(){
  if (typeof Swiper !== 'function') return;

  const swiper = new Swiper('#productsSwiper', {
    slidesPerView: 1.2,
    spaceBetween: 18,
    grabCursor:true,
    navigation:{ nextEl:'.swiper-button-next', prevEl:'.swiper-button-prev' },
    pagination:{ el:'.swiper-pagination', clickable:true },
    breakpoints:{
      640:{ slidesPerView:2.1, spaceBetween:18 },
      900:{ slidesPerView:3.2, spaceBetween:22 },
      1200:{ slidesPerView:4.2, spaceBetween:24 }
    }
  });

  window.addEventListener('load', () => swiper.update());
}

/* Product hover image swap: crossfade */
function initProductHoverSwap(){
  const cards = document.querySelectorAll('.product-media');
  cards.forEach(card => {
    const img1 = card.querySelector('.img-front');
    const img2 = card.querySelector('.img-back');
    const src1 = card.dataset.image1;
    const src2 = card.dataset.image2;

    if(src2){
      const i = new Image(); i.src = src2;
      img2.src = src2;
    }

    card.addEventListener('mouseenter', () => {
      gsap.killTweensOf([img1,img2]);
      gsap.to(img1, {autoAlpha:0, duration:.48, ease:'power3.out'});
      gsap.to(img2, {autoAlpha:1, duration:.48, ease:'power3.out'});
    });

    card.addEventListener('mouseleave', () => {
      gsap.killTweensOf([img1,img2]);
      gsap.to(img1, {autoAlpha:1, duration:.48, ease:'power3.out'});
      gsap.to(img2, {autoAlpha:0, duration:.48, ease:'power3.out'});
    });

    card.parentElement.addEventListener('focusin', () => {
      gsap.to(img1, {autoAlpha:0, duration:.28, ease:'power3.out'});
      gsap.to(img2, {autoAlpha:1, duration:.28, ease:'power3.out'});
    });
    card.parentElement.addEventListener('focusout', () => {
      gsap.to(img1, {autoAlpha:1, duration:.28, ease:'power3.out'});
      gsap.to(img2, {autoAlpha:0, duration:.28, ease:'power3.out'});
    });
  });
}

/* Cart drawer */
function initCartDrawer(){
  const cartBtn = document.getElementById('cartBtn');
  const cartDrawer = document.getElementById('cartDrawer');
  const cartOverlay = document.getElementById('cartOverlay');
  const cartClose = document.getElementById('cartClose');

  let lastFocused = null;

  function openCart(){
    lastFocused = document.activeElement;
    cartOverlay.hidden = false;
    cartDrawer.hidden = false;
    setTimeout(()=>cartOverlay.classList.add('visible'), 10);
    cartDrawer.classList.add('open');
    cartBtn.setAttribute('aria-expanded','true');
    const focusable = cartDrawer.querySelector('button, [href], input, select, textarea');
    if(focusable) focusable.focus();
    document.addEventListener('focus', trap, true);
  }

  function closeCart(){
    cartOverlay.classList.remove('visible');
    cartDrawer.classList.remove('open');
    cartBtn.setAttribute('aria-expanded','false');
    setTimeout(()=>{ cartOverlay.hidden = true; cartDrawer.hidden = true; }, 320);
    if(lastFocused) lastFocused.focus();
    document.removeEventListener('focus', trap, true);
  }

  function trap(e){
    if(!cartDrawer.contains(e.target)){
      e.stopPropagation();
      cartDrawer.focus();
    }
  }

  cartBtn.addEventListener('click', openCart);
  cartOverlay.addEventListener('click', closeCart);
  cartClose.addEventListener('click', closeCart);

  document.addEventListener('keydown', (e) => {
    if(e.key === 'Escape' && cartDrawer.classList.contains('open')) closeCart();
  });
}

/* Lenis smooth scroll + ScrollTrigger syncing */
(function initLenis(){
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (typeof Lenis !== 'function') return;

  try{
    const lenis = new Lenis({
      duration: 1.1,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      smoothTouch: false
    });

    function raf(time){
      lenis.raf(time);
      if (typeof ScrollTrigger !== 'undefined') ScrollTrigger.update();
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);
  }catch(e){
    // fallback silently
  }
})();

/* Footer year */
function setFooterYear(){
  const el = document.getElementById('year');
  if(el) el.textContent = new Date().getFullYear();
}

/* Helpers */
function throttle(fn, wait){
  let time = Date.now();
  return function(...args){
    if ((time + wait - Date.now()) < 0) {
      fn.apply(this, args);
      time = Date.now();
    }
  };
}