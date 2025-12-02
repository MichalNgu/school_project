function qs(selector, el = document) {
  return el.querySelector(selector);
}

function qsa(selector, el = document) {
  return Array.from(el.querySelectorAll(selector));
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Navigation elements
const mobileToggle = qs('.mobile-toggle');
const navLinks = qsa('.nav-link');
const nav = qs('nav');

// Mobile menu toggle
if (mobileToggle) {
  mobileToggle.addEventListener('click', () => {
    const linksContainer = qs('.nav-links');
    if (!linksContainer) return;
    
    const isHidden = linksContainer.classList.toggle('hidden');
    mobileToggle.setAttribute('aria-expanded', !isHidden);
    
    // Add animation class
    if (!isHidden) {
      linksContainer.style.animation = 'slideDown 0.3s ease-out';
    }
  });
}

// Smooth scrolling for anchor links
navLinks.forEach(link => {
  link.addEventListener('click', (e) => {
    const href = link.getAttribute('href');
    if (!href || !href.startsWith('#')) return;
    
    const target = document.querySelector(href);
    if (!target) return;
    
    e.preventDefault();
    
    // Close mobile menu if open
    const linksContainer = qs('.nav-links');
    if (linksContainer && !linksContainer.classList.contains('hidden')) {
      linksContainer.classList.add('hidden');
      mobileToggle?.setAttribute('aria-expanded', 'false');
    }
    
    // Smooth scroll to target
    target.scrollIntoView({ 
      behavior: 'smooth', 
      block: 'start' 
    });
    
    // Update URL without jumping
    history.pushState(null, '', href);
  });
});

// Header shrink effect on scroll
const SCROLL_THRESHOLD = 10;
let lastScrollY = 0;

function handleScroll() {
  if (!nav) return;
  
  const currentScrollY = window.scrollY;
  
  if (currentScrollY > SCROLL_THRESHOLD) {
    nav.classList.add('scrolled');
  } else {
    nav.classList.remove('scrolled');
  }
  
  lastScrollY = currentScrollY;
}

window.addEventListener('scroll', handleScroll, { passive: true });

// Improve focus visibility for keyboard navigation
window.addEventListener('keydown', (e) => {
  if (e.key === 'Tab') {
    document.body.classList.add('show-focus-outline');
  }
});

window.addEventListener('mousedown', () => {
  document.body.classList.remove('show-focus-outline');
});

// Modal functionality
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
    <div class="fixed inset-0 bg-black bg-opacity-80 backdrop-blur-sm" data-close></div>
    <div class="modal-body max-w-2xl w-full bg-gray-900 border border-gray-700 rounded-xl p-8 relative transform scale-95 transition-transform duration-300 shadow-2xl">
      <button aria-label="Zavřít" data-close class="absolute right-4 top-4 text-gray-400 hover:text-white text-2xl leading-none transition">
        ×
      </button>
      <div id="site-modal-content"></div>
    </div>
  `;
  
  document.body.appendChild(modal);
  return modal;
}

function openModal(title, contentHtml) {
  const modal = createModal();
  const content = qs('#site-modal-content', modal);
  
  if (content) {
    content.innerHTML = `
      <h3 class="text-2xl font-bold mb-6 text-gray-100">${escapeHtml(title)}</h3>
      ${contentHtml}
    `;
  }
  
  // Show modal with animation
  modal.setAttribute('aria-hidden', 'false');
  modal.classList.remove('opacity-0', 'pointer-events-none');
  
  const modalBody = qs('.modal-body', modal);
  if (modalBody) {
    modalBody.classList.remove('scale-95');
    modalBody.classList.add('scale-100');
  }
  
  // Add close handlers
  const closeElements = qsa('[data-close]', modal);
  closeElements.forEach(el => {
    el.addEventListener('click', closeModal);
  });
  
  // Close on Escape key
  document.addEventListener('keydown', handleModalKeys);
  
  // Prevent body scroll
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  const modal = qs('#site-modal');
  if (!modal) return;
  
  // Animate out
  modal.classList.add('opacity-0');
  const modalBody = qs('.modal-body', modal);
  if (modalBody) {
    modalBody.classList.remove('scale-100');
    modalBody.classList.add('scale-95');
  }
  
  setTimeout(() => {
    modal.setAttribute('aria-hidden', 'true');
    modal.classList.add('pointer-events-none');
    modal.remove();
  }, 300);
  
  // Remove event listener
  document.removeEventListener('keydown', handleModalKeys);
  
  // Restore body scroll
  document.body.style.overflow = '';
}

function handleModalKeys(e) {
  if (e.key === 'Escape') {
    closeModal();
  }
}

// Toast notifications
function showToast(message, type = 'info', duration = 4000) {
  let toastContainer = qs('#site-toast');
  
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'site-toast';
    toastContainer.className = 'fixed bottom-6 right-6 z-[60] space-y-2';
    document.body.appendChild(toastContainer);
  }
  
  const toast = document.createElement('div');
  const bgColor = type === 'success' ? 'bg-green-600' : 
                  type === 'error' ? 'bg-red-600' : 'bg-gray-800';
  
  toast.className = `${bgColor} text-white px-6 py-4 rounded-lg shadow-2xl border border-gray-700 
                     transform translate-x-full opacity-0 transition-all duration-300 max-w-sm`;
  toast.innerHTML = `
    <div class="flex items-start gap-3">
      <div class="flex-1">${escapeHtml(message)}</div>
      <button class="text-white hover:text-gray-300 text-xl leading-none" onclick="this.parentElement.parentElement.remove()">×</button>
    </div>
  `;
  
  toastContainer.appendChild(toast);
  
  // Trigger animation
  setTimeout(() => {
    toast.classList.remove('translate-x-full', 'opacity-0');
  }, 10);
  
  // Auto remove
  setTimeout(() => {
    toast.classList.add('translate-x-full', 'opacity-0');
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

// Handle button clicks (model details, test drive forms)
document.addEventListener('click', (e) => {
  const target = e.target;
  const btn = target.closest('.accent-btn');
  
  if (!btn) return;
  
  // Allow normal anchor navigation
  if (btn.tagName === 'A' && btn.getAttribute('href')?.startsWith('#')) {
    return;
  }
  
  e.preventDefault();
  
  // Check if button is in a model card
  const modelCard = btn.closest('.card-hover');
  if (modelCard) {
    const title = qs('h3', modelCard)?.textContent || 'Detail modelu';
    const description = qs('p', modelCard)?.textContent || '';
    const price = qs('.text-red-600', modelCard)?.textContent || '';
    
    const content = `
      <div class="space-y-4">
        <p class="text-gray-300 leading-relaxed">${escapeHtml(description)}</p>
        ${price ? `<p class="text-xl font-bold text-red-600">${escapeHtml(price)}</p>` : ''}
        <div class="pt-4 border-t border-gray-700">
          <p class="text-sm text-gray-400 mb-4">Pro více informací nebo objednání testovací jízdy nás kontaktujte.</p>
          <button class="accent-btn px-6 py-3 rounded-lg font-semibold" onclick="document.getElementById('kontakt').scrollIntoView({behavior:'smooth'}); closeModal();">
            Kontaktovat
          </button>
        </div>
      </div>
    `;
    
    openModal(title, content);
    return;
  }
  
  // Check if button is in an offer card (test drive booking)
  const offerCard = btn.closest('#nabidka .bg-gray-800');
  if (offerCard) {
    const modelName = qs('h3', offerCard)?.textContent || '';
    
    const formHtml = `
      <form id="test-drive-form" class="space-y-5">
        <div>
          <label class="block text-sm font-medium text-gray-300 mb-2">Model</label>
          <input name="model" value="${escapeHtml(modelName)}" readonly 
                 class="w-full p-3 rounded-lg bg-gray-800 border border-gray-700 text-gray-400">
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-300 mb-2">Jméno a příjmení *</label>
          <input name="name" required 
                 class="w-full p-3 rounded-lg bg-gray-800 border border-gray-700 focus:border-red-600 focus:outline-none transition">
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-300 mb-2">Email *</label>
          <input name="email" type="email" required 
                 class="w-full p-3 rounded-lg bg-gray-800 border border-gray-700 focus:border-red-600 focus:outline-none transition">
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-300 mb-2">Telefon *</label>
          <input name="phone" type="tel" required 
                 class="w-full p-3 rounded-lg bg-gray-800 border border-gray-700 focus:border-red-600 focus:outline-none transition">
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-300 mb-2">Preferovaný termín</label>
          <input name="date" type="date" 
                 class="w-full p-3 rounded-lg bg-gray-800 border border-gray-700 focus:border-red-600 focus:outline-none transition">
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-300 mb-2">Poznámka</label>
          <textarea name="message" rows="3" 
                    class="w-full p-3 rounded-lg bg-gray-800 border border-gray-700 focus:border-red-600 focus:outline-none transition"></textarea>
        </div>
        <div class="flex gap-3 pt-2">
          <button type="submit" class="accent-btn px-6 py-3 rounded-lg font-semibold flex-1">
            Odeslat žádost
          </button>
          <button type="button" data-close class="px-6 py-3 rounded-lg border border-gray-700 hover:bg-gray-800 transition">
            Zrušit
          </button>
        </div>
      </form>
    `;
    
    openModal('Objednat testovací jízdu', formHtml);
    return;
  }
  
  // Generic button action
  showToast('Funkce bude brzy dostupná', 'info');
});

// Handle form submissions
document.addEventListener('submit', (e) => {
  const form = e.target;
  
  // Test drive form
  if (form.id === 'test-drive-form') {
    e.preventDefault();
    
    const formData = new FormData(form);
    const name = formData.get('name');
    const model = formData.get('model');
    
    // Simulate form submission
    closeModal();
    showToast(`Děkujeme, ${name}! Vaše žádost o testovací jízdu modelu ${model} byla přijata. Brzy vás budeme kontaktovat.`, 'success', 5000);
    
    form.reset();
    return;
  }
  
  // Contact form
  if (form.action && form.action.includes('send.php')) {
    e.preventDefault();
    
    const formData = new FormData(form);
    const name = formData.get('name');
    
    showToast(`Děkujeme za zprávu, ${name}! Ozveme se vám co nejdříve.`, 'success', 5000);
    form.reset();
  }
});

// Add loading animation styles
const style = document.createElement('style');
style.textContent = `
  @keyframes slideDown {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  .show-focus-outline *:focus {
    outline: 2px solid #dc2626;
    outline-offset: 2px;
  }
  
  .line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  
  .line-clamp-3 {
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
`;
document.head.appendChild(style);

// Initialize
console.log('Site interactions loaded successfully');

// Expose utilities globally for debugging
window.showToast = showToast;
window.openModal = openModal;
window.closeModal = closeModal;