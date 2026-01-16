let userAllowedCookies = null;

function setCookie(name, value, days) {
  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Lax`;
}

function getCookie(name) {
  const nameEQ = name + "=";
  const ca = document.cookie.split(';');
  for (let c of ca) {
    c = c.trim();
    if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length);
  }
  return null;
}

function checkCookieConsent() {
  const consent = localStorage.getItem('audiCookiesAccepted');
  if (consent !== null) {
    userAllowedCookies = consent === 'true';
    return true;
  }
  return false;
}

async function saveCookiePreference(allowed) {
  try {
    await fetch('/api/cookies', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        allowed,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent
      })
    });
  } catch (error) {
    console.warn('Nepodařilo se uložit cookie preference na backend:', error.message);
  }
}

function initCookieBanner() {
  const banner = document.getElementById('cookie-banner');
  const acceptBtn = document.getElementById('cookie-accept');
  const denyBtn = document.getElementById('cookie-deny');
  
  console.log('Cookie banner init:', { banner, acceptBtn, denyBtn });
  
  if (!banner || !acceptBtn || !denyBtn) {
    console.error('Cookie banner elements not found!');
    return;
  }

  // Zkontrolovat, zda už uživatel rozhodl
  if (checkCookieConsent()) {
    console.log('User already decided on cookies');
    banner.style.display = 'none';
    return;
  }

  console.log('Showing cookie banner...');
  
  // Zobrazit banner
  banner.classList.remove('hidden');
  banner.style.display = 'block';
  
  // Animace s malým zpožděním
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      banner.classList.add('show');
    });
  });

  acceptBtn.addEventListener('click', async (e) => {
    e.stopPropagation();
    e.preventDefault();
    console.log('Cookies accepted');
    userAllowedCookies = true;
    localStorage.setItem('audiCookiesAccepted', 'true');
    setCookie('audiCookiesAccepted', 'true', 365);
    await saveCookiePreference(true);
    hideCookieBannerElement();
    showToast('Děkujeme za souhlas s cookies!', 'success');
  });

  denyBtn.addEventListener('click', async (e) => {
    e.stopPropagation();
    e.preventDefault();
    console.log('Cookies denied');
    userAllowedCookies = false;
    localStorage.setItem('audiCookiesAccepted', 'false');
    setCookie('audiCookiesAccepted', 'false', 365);
    await saveCookiePreference(false);
    hideCookieBannerElement();
    showToast('Cookies byly odmítnuty', 'info');
  });
}

function hideCookieBannerElement() {
  const banner = document.getElementById('cookie-banner');
  if (banner) {
    banner.classList.remove('show');
    setTimeout(() => {
      banner.style.display = 'none';
      banner.classList.add('hidden');
    }, 400);
  }
}

// ===== UTILITY FUNCTIONS =====
function qs(selector, el = document) { return el.querySelector(selector); }
function qsa(selector, el = document) { return Array.from(el.querySelectorAll(selector)); }
function escapeHtml(text) { const div = document.createElement('div'); div.textContent = text; return div.innerHTML; }

// ===== NAVIGATION =====
const nav = qs('nav');
const mobileToggle = qs('.mobile-toggle');
const navLinks = qs('.nav-links');
const navLinkElements = qsa('.nav-link');

console.log('Nav elements:', { nav, mobileToggle, navLinks, navLinkCount: navLinkElements.length });

if (mobileToggle && navLinks) {
  mobileToggle.addEventListener('click', () => {
    const isActive = navLinks.classList.toggle('active');
    mobileToggle.setAttribute('aria-expanded', isActive);
    document.body.style.overflow = isActive ? 'hidden' : '';
  });
}

navLinkElements.forEach(link => {
  link.addEventListener('click', e => {
    const href = link.getAttribute('href');
    if (!href || !href.startsWith('#')) return;

    const target = document.querySelector(href);
    if (!target) return;

    e.preventDefault();
    
    // Zavřít mobilní menu
    if (navLinks && navLinks.classList.contains('active')) {
      navLinks.classList.remove('active');
      if (mobileToggle) mobileToggle.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    }

    // Smooth scroll
    const navHeight = nav?.offsetHeight || 80;
    const targetPosition = target.offsetTop - navHeight;
    window.scrollTo({ top: targetPosition, behavior: 'smooth' });
    history.pushState(null, '', href);
  });
});

let lastScrollY = 0;
const SCROLL_THRESHOLD = 50;

function handleNavScroll() {
  if (!nav) return;
  const currentScrollY = window.scrollY;
  nav.classList.toggle('scrolled', currentScrollY > SCROLL_THRESHOLD);
  lastScrollY = currentScrollY;
}

window.addEventListener('scroll', handleNavScroll, { passive: true });

// ===== SCROLL ANIMATIONS =====
const observerOptions = { threshold: 0.1, rootMargin: '0px 0px -50px 0px' };
const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => { if (entry.isIntersecting) entry.target.classList.add('visible'); });
}, observerOptions);

// ===== MODAL SYSTEM =====
function createModal() {
  let modal = qs('#site-modal');
  if (modal) return modal;

  modal = document.createElement('div');
  modal.id = 'site-modal';
  modal.setAttribute('role', 'dialog');
  modal.setAttribute('aria-modal', 'true');
  modal.setAttribute('aria-hidden', 'true');
  modal.className = 'fixed inset-0 flex items-center justify-center z-50 p-6 opacity-0 pointer-events-none transition-opacity duration-300';
  modal.innerHTML = `
    <div class="fixed inset-0 bg-black bg-opacity-90 backdrop-blur-sm" data-close></div>
    <div class="modal-body max-w-2xl w-full bg-gray-900 border border-gray-700 rounded-xl p-8 relative transform scale-95 transition-transform duration-300 shadow-2xl" style="z-index:51;">
      <button aria-label="Zavřít" data-close class="absolute right-4 top-4 text-gray-400 hover:text-white text-3xl leading-none transition">×</button>
      <div id="site-modal-content"></div>
    </div>
  `;
  document.body.appendChild(modal);
  return modal;
}

function openModal(title, contentHtml) {
  const modal = createModal();
  const content = qs('#site-modal-content', modal);
  if (content) content.innerHTML = `<h3 class="text-2xl font-bold mb-6 text-gray-100">${escapeHtml(title)}</h3>${contentHtml}`;
  modal.setAttribute('aria-hidden', 'false');
  modal.classList.remove('opacity-0', 'pointer-events-none');
  const modalBody = qs('.modal-body', modal);
  if (modalBody) modalBody.classList.replace('scale-95', 'scale-100');
  qsa('[data-close]', modal).forEach(el => el.addEventListener('click', closeModal));
  document.addEventListener('keydown', handleModalKeys);
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  const modal = qs('#site-modal');
  if (!modal) return;
  modal.classList.add('opacity-0');
  const modalBody = qs('.modal-body', modal);
  if (modalBody) modalBody.classList.replace('scale-100', 'scale-95');
  setTimeout(() => { modal.setAttribute('aria-hidden', 'true'); modal.classList.add('pointer-events-none'); modal.remove(); }, 300);
  document.removeEventListener('keydown', handleModalKeys);
  document.body.style.overflow = '';
}

function handleModalKeys(e) { if (e.key === 'Escape') closeModal(); }

// ===== TOAST NOTIFICATIONS =====
function showToast(message, type = 'info', duration = 4000) {
  let toastContainer = qs('#site-toast');
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'site-toast';
    toastContainer.className = 'fixed bottom-6 right-6 z-[60] space-y-2';
    document.body.appendChild(toastContainer);
  }

  const toast = document.createElement('div');
  const bgColor = type === 'success' ? 'bg-green-600' : type === 'error' ? 'bg-red-600' : 'bg-gray-800';
  toast.className = `${bgColor} text-white px-6 py-4 rounded-lg shadow-2xl border border-gray-700 transform translate-x-full opacity-0 transition-all duration-300 max-w-sm`;
  toast.innerHTML = `<div class="flex items-start gap-3"><div class="flex-1">${escapeHtml(message)}</div><button class="text-white hover:text-gray-300 text-xl leading-none" onclick="this.parentElement.parentElement.remove()">×</button></div>`;
  toastContainer.appendChild(toast);

  setTimeout(() => toast.classList.remove('translate-x-full', 'opacity-0'), 10);
  setTimeout(() => { toast.classList.add('translate-x-full', 'opacity-0'); setTimeout(() => toast.remove(), 300); }, duration);
}

// ===== LOAD CARS =====
async function loadCars() {
  try {
    const response = await fetch('/data/cars-offer.json');
    if (!response.ok) throw new Error('Nepodařilo se načíst auta z JSONu');

    const cars = await response.json();
    const container = qs('#offers-container');
    if (!container) return;
    container.innerHTML = '';

    cars.forEach(car => {
      const carHTML = document.createElement('div');
      carHTML.className = 'bg-gray-800 rounded-lg overflow-hidden shadow-xl flex flex-col md:flex-row animate-on-scroll';
      carHTML.innerHTML = `
        <div class="md:w-1/3 h-64 md:h-auto flex items-center justify-center">
          <img src="${car.image}" alt="${car.name}" class="w-full h-full object-cover">
        </div>
        <div class="p-8 md:w-2/3">
          <div class="flex justify-between items-start mb-4">
            <div>
              <h3 class="text-3xl font-bold mb-2">${car.name}</h3>
              <p class="text-gray-400">${car.year} | ${car.type} | ${car.fuel} | ${car.transmission}</p>
            </div>
            <span class="bg-red-600 text-white px-4 py-2 rounded-lg font-semibold">${car.stock}</span>
          </div>
          <div class="grid grid-cols-2 gap-4 mb-6">
            <div><p class="text-gray-400 text-sm">Výkon</p><p class="font-semibold">${car.power}</p></div>
            <div><p class="text-gray-400 text-sm">Spotřeba</p><p class="font-semibold">${car.consumption}</p></div>
            <div><p class="text-gray-400 text-sm">Barva</p><p class="font-semibold">${car.color}</p></div>
            <div><p class="text-gray-400 text-sm">Výbava</p><p class="font-semibold">${car.equipment}</p></div>
          </div>
          <div class="flex justify-between items-center">
            <div><p class="text-gray-400 text-sm">Cena</p><p class="text-3xl font-bold text-red-600">${car.price}</p></div>
            <button class="accent-btn px-6 py-3 rounded-lg font-semibold transition" data-model="${car.name}">Objednat testovací jízdu</button>
          </div>
        </div>`;
      container.appendChild(carHTML);
      observer.observe(carHTML);
    });
  } catch (error) {
    console.error(error);
    showToast('Nepodařilo se načíst nabídku aut', 'error', 5000);
  }
}

// ===== TEST DRIVE & CONTACT FORM HANDLING =====
document.addEventListener('click', e => {
  const testDriveBtn = e.target.closest('.accent-btn');
  if (testDriveBtn) {
    const modelName = testDriveBtn.dataset.model;
    const formHtml = `
      <form id="test-drive-form" class="space-y-5">
        <div class="form-group"><label class="form-label">Model</label><input name="model" value="${escapeHtml(modelName)}" readonly class="form-input bg-gray-800 text-gray-400"></div>
        <div class="form-group"><label class="form-label">Jméno a příjmení *</label><input name="name" required class="form-input" placeholder="Vaše jméno"></div>
        <div class="form-group"><label class="form-label">Email *</label><input name="email" type="email" required class="form-input" placeholder="vas@email.cz"></div>
        <div class="form-group"><label class="form-label">Telefon *</label><input name="phone" type="tel" required class="form-input" placeholder="+420 123 456 789"></div>
        <div class="form-group"><label class="form-label">Preferovaný termín</label><input name="date" type="date" class="form-input"></div>
        <div class="form-group"><label class="form-label">Poznámka</label><textarea name="message" rows="3" class="form-textarea" placeholder="Vaše poznámka..."></textarea></div>
        <div class="flex gap-3 pt-2">
          <button type="submit" class="btn-primary flex-1 justify-center">Odeslat žádost</button>
          <button type="button" data-close class="btn-secondary flex-1 justify-center">Zrušit</button>
        </div>
      </form>`;
    openModal('Objednat testovací jízdu', formHtml);
  }
});

document.addEventListener('submit', async e => {
  const form = e.target;
  e.preventDefault();
  const submitBtn = form.querySelector('button[type="submit"]');
  const originalText = submitBtn?.textContent || '';

  const formData = new FormData(form);
  const data = Object.fromEntries(formData.entries());

  submitBtn?.setAttribute('disabled', 'true');
  if (submitBtn) submitBtn.textContent = 'Odesílám...';

  const endpoint = form.id === 'test-drive-form' ? '/api/testdrive' : form.id === 'contact-form' ? '/api/contact' : null;
  if (!endpoint) return;

  try {
    const res = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    const result = await res.json();

    if (result.success) {
      closeModal();
      showToast(result.message || 'Formulář byl úspěšně odeslán!', 'success', 5000);
      form.reset();
    } else {
      showToast((result.errors || [result.message || 'Chyba při odesílání'])[0], 'error', 5000);
    }
  } catch (error) {
    console.error(error);
    showToast('Chyba připojení k serveru.', 'error', 6000);
  } finally {
    if (submitBtn) submitBtn.textContent = originalText;
    if (submitBtn) submitBtn.removeAttribute('disabled');
  }
});

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', () => {
  console.log('Main interactions loaded - DOMContentLoaded');
  handleNavScroll();
  initCookieBanner();
  loadCars();

  qsa('.animate-on-scroll').forEach(el => observer.observe(el));

  // ===== TECH INFO MODAL SYSTEM =====
  const techModal = document.getElementById('tech-modal');
  const modalTitle = document.getElementById('modal-title');
  const modalContent = document.getElementById('modal-content');
  const closeModalBtn = document.getElementById('close-modal-btn');
  const closeModalBtn2 = document.getElementById('close-modal-btn-2');
  const techInfoBtns = document.querySelectorAll('.tech-info-btn');

  // Tech data for modal
  const techData = {
    quattro: {
      title: 'Systém quattro',
      content: 'Systém Audi quattro je legendární pohon všech kol, který zajišťuje optimální přenos výkonu na všechny čtyři kola. Díky němu má vůz maximální trakci a stabilitu i na mokrých, kluzkých nebo nerovných površích, což zvyšuje bezpečnost a jistotu řidiče. Moderní verze využívají elektroniku a adaptivní rozdělování točivého momentu mezi přední a zadní nápravu, čímž zlepšují jízdní dynamiku, agilitu a komfort při každodenní i sportovní jízdě.'
    },
    mmi: {
      title: 'Audi MMI',
      content: 'Audi MMI je centrální multimediální a infotainment systém, který propojuje všechny elektronické funkce vozu do jednoho intuitivního rozhraní. Umožňuje ovládání navigace, audia, klimatizace, telefonních hovorů a dalších funkcí prostřednictvím dotykového displeje, otočného ovladače nebo hlasového příkazu. Moderní verze podporují propojení s chytrými telefony, online služby, streamování hudby, aktualizace map v reálném čase a přizpůsobení nastavení vozu podle preferencí řidiče. Díky MMI je jízda pohodlnější, bezpečnější a více propojená s digitálním světem, což posouvá zážitek z řízení na vyšší úroveň.'
    },
    ai: {
      title: 'Audi AI',
      content: 'Audi AI je komplexní soubor pokročilých technologií umělé inteligence navržených pro zlepšení bezpečnosti, komfortu a efektivity jízdy. Systém umožňuje částečně autonomní řízení, podporuje adaptivní tempomat, asistenci při udržování jízdního pruhu, parkovací asistenty a prediktivní systémy, které analyzují okolní provoz a podmínky na silnici. Audi AI také dokáže komunikovat s dalšími vozidly a dopravní infrastrukturou, optimalizovat spotřebu energie u elektrických modelů a pomáhá minimalizovat riziko nehod. Celkově poskytuje plynulejší, bezpečnější a více komfortní zážitek z jízdy, který umožňuje řidiči soustředit se na strategická rozhodnutí a méně na rutinní úkony. Tento systém představuje kombinaci inovativních senzorů, pokročilých algoritmů a strojového učení, což zajišťuje, že vozidlo dokáže adaptivně reagovat na neustále se měnící podmínky na silnici.'
    },
    safety: {
      title: 'Bezpečnost',
      content: 'Audi bezpečnost představuje komplexní soubor systémů a technologií, které dohromady zajišťují maximální ochranu řidiče, pasažérů a ostatních účastníků silničního provozu. Základem jsou aktivní bezpečnostní prvky, jako je prediktivní asistent nouzového brzdění, adaptivní tempomat, monitorování mrtvého úhlu, systémy varování při opuštění jízdního pruhu a pokročilé senzory pro detekci chodců a cyklistů. Další důležitou částí je pasivní bezpečnost – inteligentní airbagy, pevná ochranná struktura karoserie a aktivní ochranné mechanismy při nárazu, které minimalizují riziko zranění. Moderní vozy Audi využívají také 360° kamery, asistenty pro parkování a pokročilé kamerové systémy, které poskytují úplný přehled o okolí vozu a podporují řidiče při manévrování. Všechny tyto systémy spolupracují, aby předcházely nehodám, optimalizovaly reakce vozidla v kritických situacích a poskytovaly řidiči a cestujícím pocit jistoty a komfortu v každé jízdě. Vývoj bezpečnostních technologií Audi je neustálý, s cílem minimalizovat rizika v městském, dálničním i extrémním provozu a nabídnout inteligentní řešení pro komplexní ochranu všech účastníků silničního provozu. Pokud chceš, můžu ti z toho udělat i stručnější verzi vhodnou přímo na web do sekce „Technologie“. Chceš, abych to udělal?'
    }
  };

  // Open modal
  function openTechModal(techKey) {
    const tech = techData[techKey];
    if (tech) {
      modalTitle.textContent = tech.title;
      modalContent.textContent = tech.content;
      techModal.classList.remove('hidden');
    }
  }

  // Close modal
  function closeTechModal() {
    techModal.classList.add('hidden');
  }

  // Event listeners
  techInfoBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      e.preventDefault();
      const techKey = btn.getAttribute('data-tech');
      openTechModal(techKey);
    });
  });

  closeModalBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    closeTechModal();
  });
  closeModalBtn2.addEventListener('click', (e) => {
    e.stopPropagation();
    closeTechModal();
  });

  // Close modal when clicking outside
  techModal.addEventListener('click', (e) => {
    if (e.target === techModal) {
      e.stopPropagation();
      closeTechModal();
    }
  });

  // Close modal on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !techModal.classList.contains('hidden')) {
      e.stopPropagation();
      closeTechModal();
    }
  });
});

// Expose utilities globally
window.showToast = showToast;
window.openModal = openModal;
window.closeModal = closeModal;