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

let terminalTemplates = terminalFallback
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

  if (!terminalTemplates.length) {
    if (terminalFallback) terminalFallback.hidden = false;
    return;
  }

  if (terminalFallback) terminalFallback.hidden = true;
  termBody.innerHTML = '';

  if (prefersReducedMotion) {
    terminalTemplates.forEach(line => {
      const div = document.createElement('div');
      div.className = 'terminal-line';
      div.innerHTML = line.html;
      termBody.appendChild(div);
    });
    const cursor = document.createElement('span');
    cursor.className = 'terminal-cursor';
    if (termBody.lastElementChild) termBody.lastElementChild.appendChild(cursor);
    return;
  }

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

/* ═══════════ i18n — EN / FR / ES ═══════════ */
const I18N = {
  en: {
    "nav.about":"About","nav.experience":"Experience","nav.skills":"Skills","nav.markets":"Markets","nav.voices":"Voices","nav.education":"Education","nav.cta":"Let's Talk",
    "hero.title2":"VP Sales EMEA",
    "hero.sub":"Driving <strong>revenue growth</strong> across EMEA for Video Intelligence &amp; SaaS platforms. 15+ years turning complex tech into <strong>closed deals</strong> and lasting partnerships with Tier-1 Telcos, Broadcasters &amp; Streaming Platforms.",
    "hero.cta1":"Get in Touch","hero.cta2":"Explore my Journey",
    "hero.stat1":"Years Experience","hero.stat2":"Revenue Generated","hero.stat3":"Clients Served","hero.stat4":"Markets Covered",
    "about.tag":"Who I Am","about.title":"The Short Version",
    "exp.tag":"Career Path","exp.title":"Where I've Made Impact",
    "exp.0.role":"Sales Director South EMEA -> VP Sales EMEA, QoE BU",
    "exp.0.loc":"Madrid, Spain &bull; 51-200 employees &bull; SaaS / Video Intelligence",
    "exp.1.role":"Sales Manager - South Europe",
    "exp.1.loc":"Madrid, Spain &bull; 501-1000 employees &bull; Public Company &bull; Telecom",
    "exp.2.role":"Sales Manager -> Senior Sales Director - Iberia",
    "exp.2.loc":"Madrid, Spain &bull; 10,000+ employees &bull; Connected Home Division",
    "exp.3.role":"Account Developer -> Account Manager",
    "exp.3.loc":"Paris, France &bull; Unified Communications &bull; Cloud Services",
    "exp.4.role":"Government Relation Executive",
    "exp.4.loc":"Washington D.C., USA &bull; Nonprofit &bull; IT Consulting",
    "skills.tag":"Core Competencies","skills.title":"What I Bring to the Table",
    "skill.0.name":"Sales Strategy & Execution",
    "skill.0.det":"Full-cycle sales leadership from territory planning to deal closure. Proven track record of exceeding revenue targets across multi-market regions.",
    "skill.1.name":"Key Account Management",
    "skill.1.det":"Building and nurturing relationships with Tier-1 operators and media groups: Deutsche Telekom, Vodafone, Orange, Bouygues Telecom, Canal+, Mediaset, YES, Masmovil, Euskaltel, NOS, and many more across EMEA.",
    "skill.2.name":"Video & Streaming Tech",
    "skill.2.det":"Domain expertise in QoS, QoE, encoding, CDN, OTT, IPTV, Android TV, set-top boxes, and AI-powered video analytics.",
    "skill.3.name":"EMEA Market Development",
    "skill.3.det":"Entering, developing, and scaling business from zero across Southern Europe, MENA, and Africa. Multilingual: FR, EN, ES.",
    "skill.4.name":"SaaS & Platform Sales",
    "skill.4.det":"Selling complex AI-powered SaaS platforms to enterprise clients. Strong command of consultative and value-based selling methodologies.",
    "skill.5.name":"Team Leadership & P&L",
    "skill.5.det":"Leading customer-facing teams, managing regional P&L, and reporting to VP/C-suite. Strategic partner engagement and channel management.",
    "markets.tag":"Geographic Reach","markets.title":"Markets I've Conquered",
    "mkt.0.det":"Home market","mkt.1.det":"10+ years","mkt.2.det":"Tier-1 Telcos","mkt.3.det":"Broadcast & OTT","mkt.4.det":"Streaming","mkt.5.det":"Telco & Cable","mkt.6.det":"Telco & Media","mkt.7.det":"Tech & Media","mkt.8.det":"Gov Tech (DC)","mkt.9.det":"Continental scope",
    "lang.tag":"Multilingual Edge","lang.title":"I Speak Your Language",
    "lc.0.name":"French","lc.0.lvl":"Native","lc.1.name":"Spanish","lc.1.lvl":"Native / Bilingual","lc.2.name":"English","lc.2.lvl":"Full Professional",
    "test.tag":"What Others Say","test.title":"Trusted Voices",
    "edu.tag":"Foundation","edu.title":"Education",
    "edu.0.desc":"Top-tier French Grande Ecole, ranked among the best business schools in Europe. Specialization in global strategy, cross-cultural negotiations, and business development. Included a year-long international experience at GTRA in Washington D.C. (2007-2008) and a double degree with the University of Hull (UK).",
    "edu.1.desc":"Double degree obtained as part of the BEM Grande Ecole programme. Coursework in International Business Management delivered entirely in English, strengthening global business acumen and cross-cultural competence.",
    "edu.2.desc":"Business Sciences degree at one of Madrid's leading public universities. Coursework completed entirely in Spanish, strengthening bilingual business acumen and deepening ties with the Spanish market.",
    "edu.3.desc":"French scientific high school diploma with a Mathematics specialization, providing a rigorous analytical foundation.",
    "contact.tag":"Let's Connect",
    "contact.title":"Ready for the<br><span class=\"gradient-text\">Next Move?</span>",
    "contact.sub":"I'm always open to discussing new opportunities and partnerships.",
    "exp.0.desc":"Started as Sales Director maximizing NPAW's footprint across France, Spain, Portugal, Italy, Greece, Malta, Israel and Africa. Promoted to VP Sales EMEA leading all sales activities across the region for the QoE Business Unit. NPAW is the leading Video Intelligence SaaS company, processing <strong>100 billion plays/year</strong> for 150+ video services worldwide. Driving adoption of AI-powered solutions covering QoS &amp; QoE E2E Monitoring, Audience Insights, Content Performance, User Engagement, CDN Balancing, and Device &amp; Network Probes.",
    "exp.1.desc":"Owned the Southern Europe territory (Spain, Portugal, Italy, Malta), ensuring continuous business growth and customer satisfaction. Helped Broadcasters and Service Providers deliver best-in-class video services through ATEME's software-defined encoding, packaging and delivery solutions.",
    "exp.2.desc":"Built Technicolor's Connected Home presence in Spain &amp; Portugal from the ground up. In less than 5 years, got referenced by all major Tier-1 Telcos, closed strategic deals across all product categories (Service GWs, STBs, PSV), and grew the Spanish revenue to <strong>&gt;20 M€/year</strong>. Promoted to Senior Sales Director overseeing the Iberia P&amp;L, managing customer-facing teams and engaging strategic partners (Vodafone, Orange, Masmovil, Euskaltel, NOS). Technicolor's Connected Home division was rebranded as <strong>Vantiva</strong> in 2023, now an independent company and global leader in broadband and video devices.",
    "exp.3.desc":"Managed a 2 M€ portfolio of 150 customers (CAC 40 &amp; SBF 250) in Unified Communications and cloud collaboration. Closed strategic deals and consistently met sales targets for audio, web and video conferencing solutions (Cisco WebEx, Microsoft Lync, Office 365).",
    "exp.4.desc":"Business development and relationship management at the Government Technology Research Alliance, engaging with US federal agencies on technology adoption. International experience within the KEDGE Business School program.",
    "footer":"© 2026 Cédric Pesier - Crafted with precision"
  },
  fr: {
    "nav.about":"A propos","nav.experience":"Experience","nav.skills":"Competences","nav.markets":"Marches","nav.voices":"Temoignages","nav.education":"Formation","nav.cta":"Contactez-moi",
    "hero.title2":"VP Sales EMEA",
    "hero.sub":"Moteur de <strong>croissance du chiffre d'affaires</strong> en EMEA pour les plateformes de Video Intelligence &amp; SaaS. Plus de 15 ans a transformer des technologies complexes en <strong>contrats signes</strong> et en partenariats durables avec des operateurs Tier-1, des diffuseurs &amp; des plateformes de streaming.",
    "hero.cta1":"Me contacter","hero.cta2":"Decouvrir mon parcours",
    "hero.stat1":"Annees d'experience","hero.stat2":"CA genere","hero.stat3":"Clients servis","hero.stat4":"Marches couverts",
    "about.tag":"Qui suis-je","about.title":"En bref",
    "exp.tag":"Parcours professionnel","exp.title":"La ou j'ai fait la difference",
    "exp.0.role":"Directeur Commercial Sud EMEA -> VP Sales EMEA, QoE BU",
    "exp.0.loc":"Madrid, Espagne &bull; 51-200 employes &bull; SaaS / Video Intelligence",
    "exp.1.role":"Responsable Commercial - Europe du Sud",
    "exp.1.loc":"Madrid, Espagne &bull; 501-1000 employes &bull; Societe cotee &bull; Telecom",
    "exp.2.role":"Responsable Commercial -> Directeur Commercial Senior - Iberie",
    "exp.2.loc":"Madrid, Espagne &bull; 10 000+ employes &bull; Division Connected Home",
    "exp.3.role":"Developpeur de Comptes -> Responsable de Comptes",
    "exp.3.loc":"Paris, France &bull; Communications Unifiees &bull; Services Cloud",
    "exp.4.role":"Charge de Relations Gouvernementales",
    "exp.4.loc":"Washington D.C., Etats-Unis &bull; Association &bull; Conseil IT",
    "skills.tag":"Competences cles","skills.title":"Ce que j'apporte",
    "skill.0.name":"Strategie & Execution Commerciale",
    "skill.0.det":"Leadership commercial de bout en bout, de la planification territoriale a la conclusion des contrats. Track record eprouve de depassement des objectifs de CA sur des regions multi-marches.",
    "skill.1.name":"Gestion des Grands Comptes",
    "skill.1.det":"Construction et entretien de relations avec les operateurs Tier-1 et groupes medias : Deutsche Telekom, Vodafone, Orange, Bouygues Telecom, Canal+, Mediaset, YES, Masmovil, Euskaltel, NOS, et bien d'autres en EMEA.",
    "skill.2.name":"Technologies Video & Streaming",
    "skill.2.det":"Expertise sectorielle en QoS, QoE, encodage, CDN, OTT, IPTV, Android TV, decodeurs et analytique video alimentee par l'IA.",
    "skill.3.name":"Developpement Marche EMEA",
    "skill.3.det":"Entree, developpement et montee en puissance a partir de zero en Europe du Sud, MENA et Afrique. Multilingue : FR, EN, ES.",
    "skill.4.name":"Vente SaaS & Plateformes",
    "skill.4.det":"Vente de plateformes SaaS complexes alimentees par l'IA a des clients entreprises. Maitrise de la vente consultative et de la vente par la valeur.",
    "skill.5.name":"Leadership & P&L",
    "skill.5.det":"Direction d'equipes client, gestion du P&L regional et reporting VP/C-suite. Engagement de partenaires strategiques et gestion de canaux.",
    "markets.tag":"Portee geographique","markets.title":"Marches conquis",
    "mkt.0.det":"Marche d'origine","mkt.1.det":"10+ ans","mkt.2.det":"Operateurs Tier-1","mkt.3.det":"Diffusion & OTT","mkt.4.det":"Streaming","mkt.5.det":"Telecom & Cable","mkt.6.det":"Telecom & Media","mkt.7.det":"Tech & Media","mkt.8.det":"Gov Tech (DC)","mkt.9.det":"Envergure continentale",
    "lang.tag":"Atout multilingue","lang.title":"Je parle votre langue",
    "lc.0.name":"Francais","lc.0.lvl":"Langue maternelle","lc.1.name":"Espagnol","lc.1.lvl":"Bilingue","lc.2.name":"Anglais","lc.2.lvl":"Professionnel complet",
    "test.tag":"Ils temoignent","test.title":"Voix de confiance",
    "edu.tag":"Formation","edu.title":"Parcours academique",
    "edu.0.desc":"Grande Ecole francaise de premier plan, classee parmi les meilleures ecoles de commerce d'Europe. Specialisation en strategie internationale, negociations interculturelles et developpement commercial. Comprend une experience internationale d'un an chez GTRA a Washington D.C. (2007-2008) et un double diplome avec l'Universite de Hull (UK).",
    "edu.1.desc":"Double diplome obtenu dans le cadre du programme Grande Ecole de BEM. Cours en International Business Management dispenses entierement en anglais, renforcant les competences en affaires internationales et interculturelles.",
    "edu.2.desc":"Diplome en Sciences de l'Entreprise dans l'une des principales universites publiques de Madrid. Cursus entierement en espagnol, renforcant les competences commerciales bilingues et les liens avec le marche espagnol.",
    "edu.3.desc":"Baccalaureat scientifique avec specialisation Mathematiques, offrant une base analytique rigoureuse.",
    "contact.tag":"Connectons-nous",
    "contact.title":"Pret pour le<br><span class=\"gradient-text\">prochain defi ?</span>",
    "contact.sub":"Je suis toujours ouvert a discuter de nouvelles opportunites et de partenariats.",
    "exp.0.desc":"Debut en tant que Directeur Commercial maximisant l'empreinte de NPAW en France, Espagne, Portugal, Italie, Grece, Malte, Israel et Afrique. Promu VP Sales EMEA pour diriger toutes les activites commerciales de la region pour la Business Unit QoE. NPAW est le leader SaaS en Video Intelligence, traitant <strong>100 milliards de lectures/an</strong> pour plus de 150 services video dans le monde. Promotion de solutions alimentees par l'IA couvrant le monitoring QoS &amp; QoE E2E, Audience Insights, Performance du Contenu, Engagement Utilisateur, CDN Balancing et Sondes Reseau &amp; Appareils.",
    "exp.1.desc":"Responsable du territoire Europe du Sud (Espagne, Portugal, Italie, Malte), assurant une croissance commerciale continue et la satisfaction client. Accompagnement des diffuseurs et operateurs dans la livraison de services video de premier plan grace aux solutions logicielles d'encodage, de packaging et de diffusion d'ATEME.",
    "exp.2.desc":"Construction de la presence Connected Home de Technicolor en Espagne &amp; au Portugal en partant de zero. En moins de 5 ans, referencement chez tous les operateurs Tier-1 majeurs, conclusion de contrats strategiques sur toutes les categories de produits (GWs, STBs, PSV) et croissance du CA espagnol a <strong>&gt;20 M€/an</strong>. Promu Directeur Commercial Senior supervisant le P&amp;L Iberie, gestion des equipes clients et engagement de partenaires strategiques (Vodafone, Orange, Masmovil, Euskaltel, NOS). La division Connected Home de Technicolor a ete rebaptisee <strong>Vantiva</strong> en 2023, desormais entreprise independante et leader mondial des equipements haut debit et video.",
    "exp.3.desc":"Gestion d'un portefeuille de 2 M€ de 150 clients (CAC 40 &amp; SBF 250) en Communications Unifiees et collaboration cloud. Conclusion de contrats strategiques et atteinte constante des objectifs commerciaux pour les solutions d'audioconference, webconference et visioconference (Cisco WebEx, Microsoft Lync, Office 365).",
    "exp.4.desc":"Developpement commercial et gestion des relations a la Government Technology Research Alliance, en lien avec les agences federales americaines sur l'adoption technologique. Experience internationale dans le cadre du programme de KEDGE Business School.",
    "footer":"© 2026 Cedric Pesier - Concu avec precision"
  },
  es: {
    "nav.about":"Sobre mi","nav.experience":"Experiencia","nav.skills":"Competencias","nav.markets":"Mercados","nav.voices":"Testimonios","nav.education":"Formacion","nav.cta":"Hablemos",
    "hero.title2":"VP Sales EMEA",
    "hero.sub":"Impulsor del <strong>crecimiento de ingresos</strong> en EMEA para plataformas de Video Intelligence y SaaS. Mas de 15 anos convirtiendo tecnologia compleja en <strong>acuerdos cerrados</strong> y alianzas duraderas con operadores Tier-1, broadcasters y plataformas de streaming.",
    "hero.cta1":"Contactarme","hero.cta2":"Explorar mi trayectoria",
    "hero.stat1":"Anos de experiencia","hero.stat2":"Ingresos generados","hero.stat3":"Clientes atendidos","hero.stat4":"Mercados cubiertos",
    "about.tag":"Quien soy","about.title":"En breve",
    "exp.tag":"Trayectoria profesional","exp.title":"Donde he dejado huella",
    "exp.0.role":"Director Comercial Sur EMEA -> VP Sales EMEA, QoE BU",
    "exp.0.loc":"Madrid, Espana &bull; 51-200 empleados &bull; SaaS / Video Intelligence",
    "exp.1.role":"Responsable Comercial - Sur de Europa",
    "exp.1.loc":"Madrid, Espana &bull; 501-1000 empleados &bull; Empresa cotizada &bull; Telecom",
    "exp.2.role":"Responsable Comercial -> Director Comercial Senior - Iberia",
    "exp.2.loc":"Madrid, Espana &bull; 10.000+ empleados &bull; Division Connected Home",
    "exp.3.role":"Desarrollador de Cuentas -> Gestor de Cuentas",
    "exp.3.loc":"Paris, Francia &bull; Comunicaciones Unificadas &bull; Servicios Cloud",
    "exp.4.role":"Ejecutivo de Relaciones Gubernamentales",
    "exp.4.loc":"Washington D.C., EE.UU. &bull; ONG &bull; Consultoria IT",
    "skills.tag":"Competencias clave","skills.title":"Lo que aporto",
    "skill.0.name":"Estrategia & Ejecucion Comercial",
    "skill.0.det":"Liderazgo comercial de ciclo completo, desde la planificacion territorial hasta el cierre de acuerdos. Historial probado de superacion de objetivos de ingresos en regiones multi-mercado.",
    "skill.1.name":"Gestion de Grandes Cuentas",
    "skill.1.det":"Construccion y mantenimiento de relaciones con operadores Tier-1 y grupos de medios: Deutsche Telekom, Vodafone, Orange, Bouygues Telecom, Canal+, Mediaset, YES, Masmovil, Euskaltel, NOS, y muchos mas en EMEA.",
    "skill.2.name":"Tecnologia Video & Streaming",
    "skill.2.det":"Experiencia sectorial en QoS, QoE, codificacion, CDN, OTT, IPTV, Android TV, decodificadores y analitica de video impulsada por IA.",
    "skill.3.name":"Desarrollo de Mercado EMEA",
    "skill.3.det":"Entrada, desarrollo y escalado de negocio desde cero en el sur de Europa, MENA y Africa. Multilingue: FR, EN, ES.",
    "skill.4.name":"Ventas SaaS & Plataformas",
    "skill.4.det":"Venta de plataformas SaaS complejas impulsadas por IA a clientes empresariales. Dominio de metodologias de venta consultiva y basada en valor.",
    "skill.5.name":"Liderazgo & P&L",
    "skill.5.det":"Direccion de equipos de cara al cliente, gestion de P&L regional y reporte a VP/C-suite. Gestion de socios estrategicos y canales.",
    "markets.tag":"Alcance geografico","markets.title":"Mercados conquistados",
    "mkt.0.det":"Mercado de origen","mkt.1.det":"10+ anos","mkt.2.det":"Operadores Tier-1","mkt.3.det":"Difusion & OTT","mkt.4.det":"Streaming","mkt.5.det":"Telecom & Cable","mkt.6.det":"Telecom & Medios","mkt.7.det":"Tech & Medios","mkt.8.det":"Gov Tech (DC)","mkt.9.det":"Alcance continental",
    "lang.tag":"Ventaja multilingue","lang.title":"Hablo tu idioma",
    "lc.0.name":"Frances","lc.0.lvl":"Lengua materna","lc.1.name":"Espanol","lc.1.lvl":"Nativo / Bilingue","lc.2.name":"Ingles","lc.2.lvl":"Profesional completo",
    "test.tag":"Lo que dicen los demas","test.title":"Voces de confianza",
    "edu.tag":"Formacion","edu.title":"Formacion academica",
    "edu.0.desc":"Grande Ecole francesa de primer nivel, clasificada entre las mejores escuelas de negocios de Europa. Especializacion en estrategia global, negociaciones interculturales y desarrollo de negocio. Incluye una experiencia internacional de un ano en GTRA en Washington D.C. (2007-2008) y doble titulacion con la Universidad de Hull (UK).",
    "edu.1.desc":"Doble titulacion obtenida como parte del programa Grande Ecole de BEM. Cursos de International Business Management impartidos integramente en ingles, fortaleciendo las competencias en negocios internacionales e interculturales.",
    "edu.2.desc":"Diplomatura en Ciencias Empresariales en una de las principales universidades publicas de Madrid. Cursado integramente en espanol, reforzando las competencias comerciales bilingues y los vinculos con el mercado espanol.",
    "edu.3.desc":"Bachillerato cientifico con especializacion en Matematicas, proporcionando una base analitica rigurosa.",
    "contact.tag":"Conectemos",
    "contact.title":"Listo para el<br><span class=\"gradient-text\">proximo paso?</span>",
    "contact.sub":"Siempre estoy abierto a nuevas oportunidades y colaboraciones.",
    "exp.0.desc":"Inicio como Director Comercial maximizando la huella de NPAW en Francia, Espana, Portugal, Italia, Grecia, Malta, Israel y Africa. Promocionado a VP Sales EMEA liderando todas las actividades comerciales de la region para la Business Unit QoE. NPAW es el lider SaaS en Video Intelligence, procesando <strong>100 mil millones de reproducciones/ano</strong> para mas de 150 servicios de video en todo el mundo. Impulso de soluciones basadas en IA que cubren monitorizacion QoS &amp; QoE E2E, Audience Insights, Rendimiento de Contenido, Engagement de Usuario, CDN Balancing y Sondas de Red &amp; Dispositivos.",
    "exp.1.desc":"Responsable del territorio del sur de Europa (Espana, Portugal, Italia, Malta), asegurando un crecimiento comercial continuo y la satisfaccion del cliente. Apoyo a broadcasters y operadores en la entrega de servicios de video de primer nivel mediante las soluciones de codificacion, empaquetado y distribucion de ATEME.",
    "exp.2.desc":"Construccion de la presencia de Connected Home de Technicolor en Espana &amp; Portugal desde cero. En menos de 5 anos, referenciado en todos los operadores Tier-1 principales, cierre de acuerdos estrategicos en todas las categorias de producto (GWs, STBs, PSV) y crecimiento del ingreso espanol a <strong>&gt;20 M€/ano</strong>. Promocionado a Director Comercial Senior supervisando el P&amp;L de Iberia, gestion de equipos de cara al cliente y relacion con socios estrategicos (Vodafone, Orange, Masmovil, Euskaltel, NOS). La division Connected Home de Technicolor fue rebautizada como <strong>Vantiva</strong> en 2023, ahora empresa independiente y lider global en dispositivos de banda ancha y video.",
    "exp.3.desc":"Gestion de un portfolio de 2 M€ con 150 clientes (CAC 40 &amp; SBF 250) en Comunicaciones Unificadas y colaboracion cloud. Cierre de acuerdos estrategicos y cumplimiento constante de objetivos comerciales para soluciones de audioconferencia, webconferencia y videoconferencia (Cisco WebEx, Microsoft Lync, Office 365).",
    "exp.4.desc":"Desarrollo de negocio y gestion de relaciones en la Government Technology Research Alliance, trabajando con agencias federales estadounidenses en adopcion tecnologica. Experiencia internacional en el marco del programa de KEDGE Business School.",
    "footer":"© 2026 Cedric Pesier - Creado con precision"
  }
};

const TERM_LINES = {
  en: [
    { type: 'cmd', text: 'whoami' },
    { type: 'output', text: 'Cedric Pesier - VP Sales EMEA' },
    { type: 'blank' },
    { type: 'cmd', text: 'cat profile.json' },
    { type: 'output', text: '{' },
    { type: 'output', text: '  <span class="terminal-highlight">"mission"</span>: "Elevating the Streaming Industry",' },
    { type: 'output', text: '  <span class="terminal-highlight">"focus"</span>: "Video Intelligence & AI-Powered Solutions",' },
    { type: 'output', text: '  <span class="terminal-highlight">"industry"</span>: "OTT, Broadcast, Telco, SaaS",' },
    { type: 'output', text: '  <span class="terminal-highlight">"superpower"</span>: "Turning complex tech into revenue",' },
    { type: 'output', text: '  <span class="terminal-highlight">"languages"</span>: ["French", "Spanish", "English"],' },
    { type: 'output', text: '  <span class="terminal-highlight">"base"</span>: "Madrid, Spain",' },
    { type: 'output', text: '  <span class="terminal-highlight">"status"</span>: "Contributing to NPAW footprint expansion in EMEA"' },
    { type: 'output', text: '}' },
    { type: 'blank' },
    { type: 'cmd', text: 'cat life.json' },
    { type: 'output', text: '{' },
    { type: 'output', text: '  <span class="terminal-highlight">"family"</span>: "Proud father of two",' },
    { type: 'output', text: '  <span class="terminal-highlight">"passions"</span>: ["Nature", "Skiing", "Mountain Biking", "Cooking for friends"],' },
    { type: 'output', text: '  <span class="terminal-highlight">"lifestyle"</span>: "Outdoor sports & activities lover"' },
    { type: 'output', text: '}' },
    { type: 'blank' },
    { type: 'cmd', text: 'echo $MOTTO' },
    { type: 'output', text: '"Build trust. Close deals. Scale fast."' }
  ],
  fr: [
    { type: 'cmd', text: 'whoami' },
    { type: 'output', text: 'Cedric Pesier - VP Sales EMEA' },
    { type: 'blank' },
    { type: 'cmd', text: 'cat profil.json' },
    { type: 'output', text: '{' },
    { type: 'output', text: '  <span class="terminal-highlight">"mission"</span>: "Elever l\'industrie du Streaming",' },
    { type: 'output', text: '  <span class="terminal-highlight">"focus"</span>: "Video Intelligence & Solutions alimentees par l\'IA",' },
    { type: 'output', text: '  <span class="terminal-highlight">"secteur"</span>: "OTT, Diffusion, Telecom, SaaS",' },
    { type: 'output', text: '  <span class="terminal-highlight">"super-pouvoir"</span>: "Transformer la tech en chiffre d\'affaires",' },
    { type: 'output', text: '  <span class="terminal-highlight">"langues"</span>: ["Francais", "Espagnol", "Anglais"],' },
    { type: 'output', text: '  <span class="terminal-highlight">"base"</span>: "Madrid, Espagne",' },
    { type: 'output', text: '  <span class="terminal-highlight">"statut"</span>: "Contribution a l\'expansion de NPAW en EMEA"' },
    { type: 'output', text: '}' },
    { type: 'blank' },
    { type: 'cmd', text: 'cat vie.json' },
    { type: 'output', text: '{' },
    { type: 'output', text: '  <span class="terminal-highlight">"famille"</span>: "Papa fier de deux enfants",' },
    { type: 'output', text: '  <span class="terminal-highlight">"passions"</span>: ["Nature", "Ski", "VTT", "Cuisiner pour les amis"],' },
    { type: 'output', text: '  <span class="terminal-highlight">"mode de vie"</span>: "Passionne de sports et activites en plein air"' },
    { type: 'output', text: '}' },
    { type: 'blank' },
    { type: 'cmd', text: 'echo $DEVISE' },
    { type: 'output', text: '"Creer la confiance. Signer des contrats. Accelerer la croissance."' }
  ],
  es: [
    { type: 'cmd', text: 'whoami' },
    { type: 'output', text: 'Cedric Pesier - VP Sales EMEA' },
    { type: 'blank' },
    { type: 'cmd', text: 'cat perfil.json' },
    { type: 'output', text: '{' },
    { type: 'output', text: '  <span class="terminal-highlight">"mision"</span>: "Elevar la industria del Streaming",' },
    { type: 'output', text: '  <span class="terminal-highlight">"enfoque"</span>: "Video Intelligence & Soluciones impulsadas por IA",' },
    { type: 'output', text: '  <span class="terminal-highlight">"sector"</span>: "OTT, Difusion, Telecom, SaaS",' },
    { type: 'output', text: '  <span class="terminal-highlight">"superpoder"</span>: "Convertir tecnologia compleja en ingresos",' },
    { type: 'output', text: '  <span class="terminal-highlight">"idiomas"</span>: ["Frances", "Espanol", "Ingles"],' },
    { type: 'output', text: '  <span class="terminal-highlight">"base"</span>: "Madrid, Espana",' },
    { type: 'output', text: '  <span class="terminal-highlight">"estado"</span>: "Contribuyendo a la expansion de NPAW en EMEA"' },
    { type: 'output', text: '}' },
    { type: 'blank' },
    { type: 'cmd', text: 'cat vida.json' },
    { type: 'output', text: '{' },
    { type: 'output', text: '  <span class="terminal-highlight">"familia"</span>: "Orgulloso padre de dos hijos",' },
    { type: 'output', text: '  <span class="terminal-highlight">"pasiones"</span>: ["Naturaleza", "Esqui", "BTT", "Cocinar para amigos"],' },
    { type: 'output', text: '  <span class="terminal-highlight">"estilo de vida"</span>: "Amante del deporte y las actividades al aire libre"' },
    { type: 'output', text: '}' },
    { type: 'blank' },
    { type: 'cmd', text: 'echo $LEMA' },
    { type: 'output', text: '"Generar confianza. Cerrar acuerdos. Escalar rapido."' }
  ]
};

const EXTRA_I18N_TARGETS = [
  { selector: '.timeline-item .timeline-role', keys: ['exp.0.role', 'exp.1.role', 'exp.2.role', 'exp.3.role', 'exp.4.role'], html: false },
  { selector: '.timeline-item .timeline-location', keys: ['exp.0.loc', 'exp.1.loc', 'exp.2.loc', 'exp.3.loc', 'exp.4.loc'], html: true },
  { selector: '.timeline-item .timeline-desc p', keys: ['exp.0.desc', 'exp.1.desc', 'exp.2.desc', 'exp.3.desc', 'exp.4.desc'], html: true },
  { selector: '.skill-name', keys: ['skill.0.name', 'skill.1.name', 'skill.2.name', 'skill.3.name', 'skill.4.name', 'skill.5.name'], html: false },
  { selector: '.skill-details', keys: ['skill.0.det', 'skill.1.det', 'skill.2.det', 'skill.3.det', 'skill.4.det', 'skill.5.det'], html: false },
  { selector: '.market-detail', keys: ['mkt.0.det', 'mkt.1.det', 'mkt.2.det', 'mkt.3.det', 'mkt.4.det', 'mkt.5.det', 'mkt.6.det', 'mkt.7.det', 'mkt.8.det', 'mkt.9.det'], html: false },
  { selector: '.lang-name', keys: ['lc.0.name', 'lc.1.name', 'lc.2.name'], html: false },
  { selector: '.lang-level', keys: ['lc.0.lvl', 'lc.1.lvl', 'lc.2.lvl'], html: false },
  { selector: '.edu-desc', keys: ['edu.0.desc', 'edu.1.desc', 'edu.2.desc', 'edu.3.desc'], html: false }
];

function escapeHtml(value) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function buildTerminalTemplatesForLang(lang) {
  const lines = TERM_LINES[lang];
  if (!lines) return terminalTemplates;

  return lines.map(line => {
    if (line.type === 'blank') return { type: 'blank', html: '&nbsp;' };
    if (line.type === 'cmd') {
      return {
        type: 'cmd',
        html: `<span class="terminal-prompt">❯ </span><span class="terminal-cmd">${escapeHtml(line.text)}</span>`
      };
    }
    return {
      type: 'output',
      html: `<span class="terminal-output">${line.text}</span>`
    };
  });
}

let currentLang = 'en';

function applyExtraTranslations(lang) {
  EXTRA_I18N_TARGETS.forEach(target => {
    const nodes = Array.from(document.querySelectorAll(target.selector));
    nodes.forEach((node, index) => {
      const key = target.keys[index];
      const value = key ? I18N[lang][key] : undefined;
      if (value === undefined) return;
      if (target.html) {
        node.innerHTML = value;
      } else {
        node.textContent = value;
      }
    });
  });
}

function setLang(lang) {
  if (!I18N[lang]) return;
  currentLang = lang;
  document.documentElement.lang = lang;

  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (!key || I18N[lang][key] === undefined) return;
    el.textContent = I18N[lang][key];
  });

  document.querySelectorAll('[data-i18n-html]').forEach(el => {
    const key = el.getAttribute('data-i18n-html');
    if (!key || I18N[lang][key] === undefined) return;
    el.innerHTML = I18N[lang][key];
  });

  applyExtraTranslations(lang);

  terminalTemplates = buildTerminalTemplatesForLang(lang);
  terminalStarted = false;
  if (termBody) termBody.innerHTML = '';
  startTerminal();

  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.lang === lang);
  });
}

document.querySelectorAll('.lang-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    setLang(btn.dataset.lang);
  });
});
