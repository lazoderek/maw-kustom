/**
 * MAW Theme — Main JavaScript
 * Makayla Wray Fashion Portfolio + Shop
 *
 * Globals provided by CDN scripts loaded before this file:
 *   gsap, ScrollTrigger (GSAP), Alpine
 */

// Pinch zoom: viewport meta alone is unreliable on iOS Safari; WebKit fires gesture* events.
(function () {
  var mq = window.matchMedia('(max-width: 749px)');
  function blockPinch(e) {
    if (mq.matches) e.preventDefault();
  }
  document.addEventListener('gesturestart', blockPinch, { passive: false });
  document.addEventListener('gesturechange', blockPinch, { passive: false });
  document.addEventListener('gestureend', blockPinch, { passive: false });
})();

// ── Alpine stores (registered before Alpine initialises the DOM) ───────────
document.addEventListener('alpine:init', () => {
  Alpine.store('menu', {
    open: false,
    toggle() { this.open = !this.open; },
    close() { this.open = false; },
  });

  Alpine.store('cart', {
    open: false,
    count: 0,
    toggle() { this.open = !this.open; },
    close() { this.open = false; },
  });

  Alpine.store('search', {
    open: false,
    toggle() { this.open = !this.open; },
    close() { this.open = false; },
  });
});

// ── Scroll reveal ──────────────────────────────────────────────────────────
function initReveal(scope) {
  const root = scope || document;
  const els = root.querySelectorAll('[data-reveal]');

  els.forEach((el) => {
    const type  = el.dataset.reveal || 'up';
    const delay = parseFloat(el.dataset.revealDelay) || 0;
    const stagger = el.dataset.revealStagger;

    const fromVars = { opacity: 0 };
    if (type === 'up')    fromVars.y = 40;
    if (type === 'down')  fromVars.y = -40;
    if (type === 'left')  fromVars.x = -40;
    if (type === 'right') fromVars.x = 40;
    if (type === 'scale') fromVars.scale = 0.92;

    const toVars = {
      opacity: 1, x: 0, y: 0, scale: 1,
      duration: 0.9,
      ease: 'power3.out',
      delay,
      scrollTrigger: {
        trigger: el,
        start: 'top 88%',
        toggleActions: 'play none none none',
      },
    };

    if (stagger) {
      const children = el.querySelectorAll('[data-reveal-child]');
      const targets = children.length ? children : el.children;
      gsap.from(targets, { ...fromVars, ...toVars, stagger: parseFloat(stagger) });
    } else {
      gsap.fromTo(el, fromVars, toVars);
    }
  });
}

// ── Horizontal scrapbook scroll ────────────────────────────────────────────
function initScrapbookScroll(scope) {
  const root = scope || document;
  root.querySelectorAll('[data-h-scroll]').forEach((track) => {
    const inner = track.querySelector('[data-h-scroll-inner]');
    if (!inner) return;

    const getScrollAmount = () => -(inner.scrollWidth - track.clientWidth);

    const tween = gsap.to(inner, {
      x: getScrollAmount,
      ease: 'none',
      scrollTrigger: {
        trigger: track,
        start: 'top top',
        end: () => `+=${inner.scrollWidth}`,
        pin: true,
        scrub: 1.2,
        invalidateOnRefresh: true,
      },
    });

    // Independent parallax per floating element
    track.querySelectorAll('[data-floater]').forEach((floater, i) => {
      const speed = parseFloat(floater.dataset.floater) || (i % 2 === 0 ? 0.6 : 1.4);
      gsap.to(floater, {
        x: () => getScrollAmount() * speed * -0.3,
        ease: 'none',
        scrollTrigger: tween.scrollTrigger,
      });
    });
  });
}

// ── Parallax ───────────────────────────────────────────────────────────────
function initParallax(scope) {
  const root = scope || document;
  root.querySelectorAll('[data-parallax]').forEach((el) => {
    const speed = parseFloat(el.dataset.parallax) || 0.3;
    gsap.fromTo(el,
      { yPercent: -15 * speed },
      {
        yPercent: 15 * speed,
        ease: 'none',
        scrollTrigger: {
          trigger: el.closest('[data-parallax-wrap]') || el,
          start: 'top bottom',
          end: 'bottom top',
          scrub: true,
        },
      }
    );
  });
}

// ── Marquee ticker ─────────────────────────────────────────────────────────
function initMarquee(scope) {
  const root = scope || document;
  root.querySelectorAll('[data-marquee]').forEach((el) => {
    const inner = el.querySelector('[data-marquee-inner]');
    if (!inner) return;

    const speed = parseFloat(el.dataset.marquee) || 30;
    const clone = inner.cloneNode(true);
    el.appendChild(clone);

    gsap.to([inner, clone], {
      xPercent: -100,
      repeat: -1,
      duration: speed,
      ease: 'none',
    });
  });
}

// ── Cart count badge ───────────────────────────────────────────────────────
function updateCartCount() {
  fetch('/cart.js')
    .then((r) => r.json())
    .then((cart) => {
      document.querySelectorAll('[data-cart-count]').forEach((b) => {
        b.textContent = cart.item_count;
        b.hidden = cart.item_count === 0;
      });
      if (typeof Alpine !== 'undefined' && Alpine.store('cart')) {
        Alpine.store('cart').count = cart.item_count;
      }
    })
    .catch(() => {});
}

// ── Add to cart helper (used by product forms) ─────────────────────────────
window.MAWCart = {
  async add(formData) {
    const res = await fetch('/cart/add.js', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });
    if (!res.ok) throw new Error('Cart add failed');
    await updateCartCount();
    return res.json();
  },
};

// ── Boot ───────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  gsap.registerPlugin(ScrollTrigger);

  initReveal();
  initScrapbookScroll();
  initParallax();
  initMarquee();
  updateCartCount();
});

// Re-init after Shopify theme editor loads a section
document.addEventListener('shopify:section:load', (e) => {
  const section = e.target;
  ScrollTrigger.refresh();
  initReveal(section);
  initScrapbookScroll(section);
  initMarquee(section);
});
