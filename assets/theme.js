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

// Mobile: block long-press / context menu on images (save, copy, inspect).
(function () {
  var mq = window.matchMedia('(max-width: 749px)');

  function isProtectedImage(node) {
    if (!node || !node.closest) return false;
    if (node.tagName === 'IMG') return true;
    if (node.tagName === 'VIDEO') return true;
    return !!node.closest('picture, img, video');
  }

  function protectImages(root) {
    if (!mq.matches) return;
    (root || document).querySelectorAll('img').forEach(function (img) {
      img.setAttribute('draggable', 'false');
      img.decoding = img.decoding || 'async';
    });
  }

  function blockIfImage(e) {
    if (!mq.matches) return;
    if (isProtectedImage(e.target)) e.preventDefault();
  }

  document.addEventListener('contextmenu', blockIfImage, true);
  document.addEventListener('dragstart', blockIfImage, true);

  document.addEventListener('DOMContentLoaded', function () {
    protectImages(document);
  });

  document.addEventListener('shopify:section:load', function (e) {
    protectImages(e.target);
  });
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

// ── Home hero: slow horizontal pan (mobile, horizontal scroll — reliable on iOS) ─
function bindMediaChange(mq, fn) {
  if (mq.addEventListener) mq.addEventListener('change', fn);
  else if (mq.addListener) mq.addListener(fn);
}

function unbindMediaChange(mq, fn) {
  if (!fn) return;
  if (mq.removeEventListener) mq.removeEventListener('change', fn);
  else if (mq.removeListener) mq.removeListener(fn);
}

function initHomeHeroPan(scope) {
  const root = scope && scope.nodeType === 1 ? scope : document;
  root.querySelectorAll('[data-maw-home-hero]').forEach((hero) => {
    const pan = hero.querySelector('.home-hero__pan');
    if (!pan) return;

    const DURATION_MS = 98000;
    const mq = window.matchMedia('(max-width: 749px)');
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');

    function stopLoop() {
      if (pan._mawHeroPanRaf != null) {
        cancelAnimationFrame(pan._mawHeroPanRaf);
        pan._mawHeroPanRaf = null;
      }
      pan._mawHeroPanStart = null;
      pan.scrollLeft = 0;
    }

    function maxScroll() {
      return Math.max(0, pan.scrollWidth - pan.clientWidth);
    }

    /** One loop stride: first panel width + clone's negative margin (overlap). */
    function travelPx() {
      const maxS = maxScroll();
      const first = pan.querySelector('.home-hero__track .home-hero__img');
      const second = pan.querySelector('.home-hero__img--clone');
      if (!first || first.offsetWidth <= 0) return maxS;
      if (
        second
        && window.getComputedStyle(second).display !== 'none'
      ) {
        const ml = parseFloat(window.getComputedStyle(second).marginLeft, 10) || 0;
        const step = first.offsetWidth + ml;
        if (step > 0) return Math.min(step, maxS);
      }
      return Math.min(first.offsetWidth, maxS);
    }

    function loop(now) {
      pan._mawHeroPanRaf = null;
      if (!mq.matches || reduce.matches) {
        pan.scrollLeft = 0;
        return;
      }
      const ms = travelPx();
      if (ms <= 1) {
        pan._mawHeroPanRaf = requestAnimationFrame(loop);
        return;
      }
      if (pan._mawHeroPanStart == null) pan._mawHeroPanStart = now;
      /* Linear 0 → 1 per DURATION_MS, repeat (duplicate strip hides the wrap). */
      const t = (now - pan._mawHeroPanStart) % DURATION_MS;
      const u = t / DURATION_MS;
      pan.scrollLeft = u * ms;
      pan._mawHeroPanRaf = requestAnimationFrame(loop);
    }

    function kick() {
      stopLoop();
      if (!mq.matches || reduce.matches) return;
      pan._mawHeroPanRaf = requestAnimationFrame(loop);
    }

    unbindMediaChange(mq, pan._mawHeroPanKick);
    unbindMediaChange(reduce, pan._mawHeroPanKick);
    pan._mawHeroPanKick = kick;
    bindMediaChange(mq, kick);
    bindMediaChange(reduce, kick);
    kick();
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
      const count = cart.item_count;

      document.querySelectorAll('[data-cart-count]').forEach((b) => {
        b.textContent = count;
        b.hidden = count === 0;
      });

      document.querySelectorAll('[data-cart-pill]').forEach((pill) => {
        const mobile = pill.querySelector('.nav-banner__cart-pill-mobile');
        const desktop = pill.querySelector('.nav-banner__cart-pill-desktop');
        if (mobile) mobile.textContent = count;
        if (desktop) desktop.textContent = `Items | ${count}`;
        pill.hidden = count === 0;
        const label = count === 0
          ? 'Cart'
          : `Cart, ${count} ${count === 1 ? 'item' : 'items'}`;
        pill.setAttribute('aria-label', label);
      });

      if (typeof Alpine !== 'undefined' && Alpine.store('cart')) {
        Alpine.store('cart').count = count;
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

// ── Page transitions (swap #MainContent; bg + nav never reload) ─────────────
const PAGE_TRANSITION_MS = 500;
let navigationLock = false;

function pageTransitionsEnabled() {
  if (document.documentElement.classList.contains('shopify-design-mode')) return false;
  if (!document.documentElement.classList.contains('page-transitions-enabled')) return false;
  return true;
}

function setPageTransitionState(state) {
  const html = document.documentElement;
  html.classList.remove('page-is-entering', 'page-is-active', 'page-is-leaving');
  if (state) html.classList.add(state);
}

function fadeInPage() {
  if (!pageTransitionsEnabled()) return;
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      setPageTransitionState('page-is-active');
    });
  });
}

function fadeOutPage() {
  if (!pageTransitionsEnabled()) return Promise.resolve();
  setPageTransitionState('page-is-leaving');
  return new Promise((resolve) => {
    window.setTimeout(resolve, PAGE_TRANSITION_MS);
  });
}

function requiresFullReload(url) {
  if (url.origin !== window.location.origin) return true;
  const path = url.pathname;
  if (path.startsWith('/checkout')) return true;
  if (path.startsWith('/account/logout')) return true;
  return false;
}

function isInternalNavUrl(url) {
  if (requiresFullReload(url)) return false;
  if (
    url.pathname === window.location.pathname
    && url.search === window.location.search
    && url.hash
  ) return false;
  return true;
}

function isTransitionLink(anchor, event) {
  if (!anchor || anchor.dataset.noTransition === 'true') return false;
  if (anchor.target && anchor.target !== '_self') return false;
  if (anchor.hasAttribute('download')) return false;
  if (event && (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0)) {
    return false;
  }

  const href = anchor.getAttribute('href');
  if (!href || href === '#') return false;
  if (href.startsWith('#')) return false;
  if (/^(mailto:|tel:|javascript:)/i.test(href)) return false;

  try {
    return isInternalNavUrl(new URL(anchor.href, window.location.href));
  } catch {
    return false;
  }
}

async function fetchPage(url) {
  const response = await fetch(url, {
    credentials: 'same-origin',
    headers: {
      Accept: 'text/html',
      'X-Requested-With': 'MAW',
    },
  });
  if (!response.ok) throw new Error(`Fetch failed (${response.status})`);

  const html = await response.text();
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const main = doc.getElementById('MainContent');
  if (!main) throw new Error('MainContent missing');

  return {
    title: doc.querySelector('title')?.textContent?.trim() || document.title,
    mainNode: main,
    doc,
  };
}

function syncNavFromDocument(doc) {
  const currentNav = document.querySelector('.nav-banner');
  const fetchedNav = doc.querySelector('.nav-banner');
  if (!currentNav || !fetchedNav) return;

  currentNav.querySelectorAll('.nav-banner__link').forEach((link) => {
    link.removeAttribute('aria-current');
  });

  const currentLinks = [...currentNav.querySelectorAll('.nav-banner__link')];
  fetchedNav.querySelectorAll('.nav-banner__link[aria-current="page"]').forEach((fetchedLink) => {
    const fetchedPath = new URL(fetchedLink.href).pathname.replace(/\/$/, '') || '/';
    let matched = currentLinks.find((link) => {
      const linkPath = new URL(link.href).pathname.replace(/\/$/, '') || '/';
      return linkPath === fetchedPath;
    });

    if (!matched) {
      const label = fetchedLink.textContent.trim().toLowerCase();
      matched = currentLinks.find((link) => link.textContent.trim().toLowerCase() === label);
    }

    if (matched) matched.setAttribute('aria-current', 'page');
  });

  const panelSelector = '.nav-banner__panel, .nav-banner__panel--stockists';
  const currentPanel = currentNav.querySelector(panelSelector);
  const fetchedPanel = fetchedNav.querySelector(panelSelector);

  if (fetchedPanel && currentPanel) {
    currentPanel.replaceWith(document.importNode(fetchedPanel, true));
  } else if (fetchedPanel && !currentPanel) {
    const trailing = currentNav.querySelector('.nav-banner__trailing');
    const imported = document.importNode(fetchedPanel, true);
    if (trailing) trailing.before(imported);
    else currentNav.appendChild(imported);
  } else if (!fetchedPanel && currentPanel) {
    currentPanel.remove();
  }
}

function activateScripts(root) {
  root.querySelectorAll('script').forEach((oldScript) => {
    const script = document.createElement('script');
    Array.from(oldScript.attributes).forEach((attr) => {
      script.setAttribute(attr.name, attr.value);
    });
    script.textContent = oldScript.textContent;
    oldScript.replaceWith(script);
  });
}

function teardownMainContent(main) {
  main.querySelectorAll('[data-maw-home-hero]').forEach((hero) => {
    const pan = hero.querySelector('.home-hero__pan');
    if (!pan) return;
    const kick = pan._mawHeroPanKick;
    const mq = window.matchMedia('(max-width: 749px)');
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
    unbindMediaChange(mq, kick);
    unbindMediaChange(reduce, kick);
    if (pan._mawHeroPanRaf != null) cancelAnimationFrame(pan._mawHeroPanRaf);
    pan._mawHeroPanRaf = null;
    pan._mawHeroPanKick = null;
  });

  ScrollTrigger.getAll().forEach((st) => {
    const trigger = st.trigger;
    if (trigger === main || (trigger instanceof Element && main.contains(trigger))) {
      st.kill();
    }
  });
}

function bootSwappedPage(scope) {
  ScrollTrigger.refresh();
  initReveal(scope);
  initScrapbookScroll(scope);
  initParallax(scope);
  initMarquee(scope);
  initHomeHeroPan(scope);
  updateCartCount();
}

function applyPageSwap(page, url, { historyMode = 'push' } = {}) {
  const currentMain = document.getElementById('MainContent');
  if (!currentMain) throw new Error('MainContent missing');

  teardownMainContent(currentMain);

  const newMain = document.importNode(page.mainNode, true);
  currentMain.replaceWith(newMain);
  activateScripts(newMain);

  if (page.title) document.title = page.title;

  if (page.doc) syncNavFromDocument(page.doc);

  if (historyMode === 'push') {
    history.pushState({ mawSwap: true }, '', url);
  } else if (historyMode === 'replace') {
    history.replaceState({ mawSwap: true }, '', url);
  }

  newMain.scrollTop = 0;

  if (typeof Alpine !== 'undefined') {
    Alpine.initTree(newMain);
  }

  bootSwappedPage(newMain);
  newMain.focus({ preventScroll: true });
}

async function navigateWithTransition(url) {
  const target = new URL(url, window.location.href);

  if (!pageTransitionsEnabled() || requiresFullReload(target)) {
    window.location.assign(target.href);
    return;
  }

  if (navigationLock) return;
  navigationLock = true;

  try {
    const [, page] = await Promise.all([
      fadeOutPage(),
      fetchPage(target.href),
    ]);
    applyPageSwap(page, target.href);
    fadeInPage();
  } catch {
    window.location.assign(target.href);
  } finally {
    navigationLock = false;
  }
}

function initPageTransitions() {
  if (!pageTransitionsEnabled()) return;

  history.replaceState({ mawSwap: true }, '', window.location.href);
  fadeInPage();

  window.addEventListener('pageshow', (event) => {
    if (!event.persisted) return;
    setPageTransitionState('page-is-entering');
    fadeInPage();
  });

  window.addEventListener('popstate', async () => {
    if (!pageTransitionsEnabled() || navigationLock) return;

    navigationLock = true;

    try {
      const [, page] = await Promise.all([
        fadeOutPage(),
        fetchPage(window.location.href),
      ]);
      applyPageSwap(page, window.location.href, { historyMode: 'none' });
      fadeInPage();
    } catch {
      window.location.reload();
    } finally {
      navigationLock = false;
    }
  });

  document.addEventListener('click', (event) => {
    const link = event.target.closest('a[href]');
    if (!isTransitionLink(link, event)) return;
    event.preventDefault();
    navigateWithTransition(link.href);
  });

  document.addEventListener('submit', (event) => {
    const form = event.target;
    if (!form || form.tagName !== 'FORM') return;
    if (form.dataset.noTransition === 'true') return;
    if (event.defaultPrevented) return;
    if ((form.method || 'get').toLowerCase() !== 'get') return;

    const action = form.getAttribute('action') || window.location.href;
    let url;
    try {
      url = new URL(action, window.location.href);
    } catch {
      return;
    }
    if (!isInternalNavUrl(url)) return;

    event.preventDefault();
    const data = new FormData(form);
    url.search = new URLSearchParams(data).toString();
    navigateWithTransition(url.href);
  });
}

window.MAW = window.MAW || {};
window.MAW.navigate = navigateWithTransition;
window.MAW.refresh = () => navigateWithTransition(window.location.href);

// ── Boot ───────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  gsap.registerPlugin(ScrollTrigger);

  initPageTransitions();

  initReveal();
  initScrapbookScroll();
  initParallax();
  initMarquee();
  initHomeHeroPan();
  updateCartCount();
});

// Re-init after Shopify theme editor loads a section
document.addEventListener('shopify:section:unload', (e) => {
  const hero = e.target.querySelector('[data-maw-home-hero]');
  if (!hero) return;
  const pan = hero.querySelector('.home-hero__pan');
  if (!pan) return;
  const kick = pan._mawHeroPanKick;
  const mq = window.matchMedia('(max-width: 749px)');
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  unbindMediaChange(mq, kick);
  unbindMediaChange(reduce, kick);
  if (pan._mawHeroPanRaf != null) cancelAnimationFrame(pan._mawHeroPanRaf);
  pan._mawHeroPanRaf = null;
  pan._mawHeroPanKick = null;
});

document.addEventListener('shopify:section:load', (e) => {
  const section = e.target;
  ScrollTrigger.refresh();
  initReveal(section);
  initScrapbookScroll(section);
  initMarquee(section);
  initHomeHeroPan(section);
});
