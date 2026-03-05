/* ═══════════ GLOBAL ELEMENTS ═══════════ */
const glow = document.getElementById('cursorGlow');
const nav = document.getElementById('navbar');
const burger = document.getElementById('burger');
const navLinks = document.getElementById('navLinks');
const sections = Array.from(document.querySelectorAll('section[id]'));
const statValues = Array.from(document.querySelectorAll('.stat-value'));
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ═══════════ CURSOR GLOW ═══════════ */
if (glow && !prefersReducedMotion) {
  let mouseX = 0;
  let mouseY = 0;
  let glowX = 0;
  let glowY = 0;

  document.addEventListener('mousemove', e => {
    mouseX = e.clientX;
    mouseY = e.clientY;
  }, { passive: true });

  (function animateGlow() {
    glowX += (mouseX - glowX) * 0.1;
    glowY += (mouseY - glowY) * 0.1;
    glow.style.left = glowX + 'px';
    glow.style.top = glowY + 'px';
    requestAnimationFrame(animateGlow);
  })();
}

/* ═══════════ NAVBAR + MOBILE MENU ═══════════ */
function setMenuState(isOpen) {
  if (!burger || !navLinks) return;

  burger.classList.toggle('open', isOpen);
  navLinks.classList.toggle('open', isOpen);
  burger.setAttribute('aria-expanded', String(isOpen));
  document.body.classList.toggle('nav-open', isOpen);

  if (isOpen) {
    const firstLink = navLinks.querySelector('a');
    if (firstLink) firstLink.focus();
  }
}

if (burger && navLinks) {
  burger.addEventListener('click', () => {
    setMenuState(!navLinks.classList.contains('open'));
  });

  navLinks.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => setMenuState(false));
  });

  document.addEventListener('click', e => {
    if (!navLinks.classList.contains('open')) return;
    if (navLinks.contains(e.target) || burger.contains(e.target)) return;
    setMenuState(false);
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      setMenuState(false);
      return;
    }

    if (e.key !== 'Tab' || !navLinks.classList.contains('open')) return;
    const focusable = navLinks.querySelectorAll('a, button:not([disabled]), [tabindex]:not([tabindex="-1"])');
    if (!focusable.length) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  });
}

/* ═══════════ SCROLL HANDLERS (THROTTLED) ═══════════ */
let sectionMetrics = [];
let scrollTicking = false;

function cacheSectionMetrics() {
  sectionMetrics = sections.map(section => ({
    id: section.getAttribute('id'),
    top: section.offsetTop,
    bottom: section.offsetTop + section.offsetHeight
  }));
}

function updateActiveNav(scrollY) {
  if (!navLinks) return;

  sectionMetrics.forEach(({ id, top, bottom }) => {
    const link = navLinks.querySelector(`a[href="#${id}"]`);
    if (link) link.classList.toggle('active', scrollY >= top && scrollY < bottom);
  });
}

function animateCounters() {
  statValues.forEach(el => {
    if (el.dataset.animated) return;
    const rect = el.getBoundingClientRect();
    if (rect.top > window.innerHeight || rect.bottom < 0) return;

    el.dataset.animated = 'true';

    const target = Number(el.dataset.count || 0);
    const suffix = el.dataset.suffix || '';
    const duration = 2000;
    const start = performance.now();

    (function tick(now) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.floor(target * eased) + suffix;
      if (progress < 1) requestAnimationFrame(tick);
    })(start);
  });
}

function runScrollHandlers() {
  const y = window.scrollY;
  if (nav) nav.classList.toggle('scrolled', y > 50);
  updateActiveNav(y + 200);
  animateCounters();
}

function onScroll() {
  if (scrollTicking) return;
  scrollTicking = true;
  requestAnimationFrame(() => {
    scrollTicking = false;
    runScrollHandlers();
  });
}

window.addEventListener('scroll', onScroll, { passive: true });
window.addEventListener('resize', () => {
  cacheSectionMetrics();
  runScrollHandlers();
});

cacheSectionMetrics();
runScrollHandlers();

/* ═══════════ SCROLL REVEAL ═══════════ */
function revealNode(el) {
  el.classList.add('visible');
  el.querySelectorAll('.skill-bar').forEach(bar => {
    bar.style.width = bar.dataset.width + '%';
  });
}

function revealAll() {
  document.querySelectorAll('.reveal').forEach(revealNode);
  document.querySelectorAll('.terminal-line').forEach(el => {
    el.style.opacity = '1';
  });
}

if ('IntersectionObserver' in window && !prefersReducedMotion) {
  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      revealNode(entry.target);
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.15 });

  document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));
} else {
  revealAll();
}

/* ═══════════ TIMELINE ACCORDION ═══════════ */
document.querySelectorAll('.timeline-item').forEach(item => {
  item.addEventListener('click', () => {
    const wasActive = item.classList.contains('active');
    document.querySelectorAll('.timeline-item').forEach(i => i.classList.remove('active'));
    if (!wasActive) item.classList.add('active');
  });
});

/* ═══════════ TERMINAL TYPING (from fallback HTML) ═══════════ */
let terminalStarted = false;
const termBody = document.getElementById('terminalBody');
const terminalFallback = document.getElementById('terminalFallback');
let suppressTerminalTrigger = false;
let suppressTerminalTimer = null;

const terminalTemplates = terminalFallback
  ? Array.from(terminalFallback.querySelectorAll('.terminal-line')).map(line => {
      const html = line.innerHTML;
      const isBlank = html.trim() === '&nbsp;';
      const isCmd = Boolean(line.querySelector('.terminal-cmd'));
      return { type: isBlank ? 'blank' : (isCmd ? 'cmd' : 'output'), html };
    })
  : [];

function startTerminal() {
  if (terminalStarted || !termBody) return;
  terminalStarted = true;

  if (!terminalTemplates.length || prefersReducedMotion) {
    if (terminalFallback) terminalFallback.hidden = false;
    return;
  }

  termBody.innerHTML = '';

  let i = 0;
  function addLine() {
    if (i >= terminalTemplates.length) {
      const cursor = document.createElement('span');
      cursor.className = 'terminal-cursor';
      if (termBody.lastElementChild) termBody.lastElementChild.appendChild(cursor);
      return;
    }

    const line = terminalTemplates[i];
    const div = document.createElement('div');
    div.className = 'terminal-line';
    div.style.animationDelay = '0s';
    div.innerHTML = line.html;

    termBody.appendChild(div);
    i += 1;
    setTimeout(addLine, line.type === 'cmd' ? 400 : 80);
  }

  addLine();
}

const terminalSection = document.getElementById('terminal');
if (terminalSection && 'IntersectionObserver' in window && !prefersReducedMotion) {
  const termObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      if (suppressTerminalTrigger) return;
      startTerminal();
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.3 });

  termObserver.observe(terminalSection);
} else {
  startTerminal();
}

/* ═══════════ SMOOTH SCROLL (fallback) ═══════════ */
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const selector = a.getAttribute('href');
    if (!selector || selector === '#') return;

    const target = document.querySelector(selector);
    if (!target) return;

    // Suppress terminal typing while navbar-driven smooth scrolling jumps
    // to lower sections (to avoid triggering while passing through About).
    const isNavbarLink = Boolean(a.closest('#navbar'));
    const isLowerJump = target.offsetTop > window.scrollY;
    const isAboutTarget = selector === '#about';
    if (isNavbarLink && isLowerJump && !isAboutTarget) {
      suppressTerminalTrigger = true;
      clearTimeout(suppressTerminalTimer);
      suppressTerminalTimer = setTimeout(() => {
        suppressTerminalTrigger = false;
      }, 1200);
    }

    e.preventDefault();
    target.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth' });
  });
});
