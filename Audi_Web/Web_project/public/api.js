// Mock news data for reliable display
const MOCK_NEWS = [
  {
    title: 'Nový Audi A6 2025 - Elegance a technologie v novém světle',
    description: 'Objevte nejnovější generaci modelu A6 s pokročilými asistenčními systémy a luksusním interiérem. Kombinace německé kvality a inovativního designu.',
    pubDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    source: 'Audi News',
    link: '#'
  },
  {
    title: 'Audi e-tron GT - Revoluce v elektromobilitě',
    description: 'Sportovní elektrické vozidlo s výkonem 646 koní a dojezdem až 488 km. Technologie budoucnosti dostupná dnes.',
    pubDate: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    source: 'Audi News',
    link: '#'
  },
  {
    title: 'Systém quattro - 40 let řady a kontinuální vývoj',
    description: 'Legendární pohon všech kol systému quattro slaví 40. výročí. Pořádáme speciální výstavu v centrálních showroomech.',
    pubDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    source: 'Audi News',
    link: '#'
  },
  {
    title: 'Aktuální sleva na modely série Q - až 20% sleva',
    description: 'Limitovaná nabídka na vybrané modely řady Q. Moderní SUV s nejlepšími technologiemi za atraktivní ceny. Nabídka platí do konce měsíce.',
    pubDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    source: 'Audi Nabídka',
    link: '#'
  },
  {
    title: 'Bezpečnost vozů Audi - Nejlepší výsledky v testech',
    description: 'Vozidla značky Audi dosáhla 5 hvězd v testech bezpečnosti. Pokročilé systémy pro prevenci nehod jsou standardem.',
    pubDate: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
    source: 'Audi News',
    link: '#'
  },
  {
    title: 'Nové showroomy otevřeny v Praze a Brně',
    description: 'Moderní prodejní centra s nejnovějšími technologiemi. Nabízíme virtuální prohlídky a pokročilou konfiguraci vozů online.',
    pubDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    source: 'Audi News',
    link: '#'
  }
];

// Multiple CORS proxies - will try until one works
const CORS_PROXIES = [
  'https://api.allorigins.win/raw?url=',
  'https://corsproxy.io/?',
  'https://api.codetabs.com/v1/proxy?quest=',
  'https://thingproxy.freeboard.io/fetch/'
];

let currentProxyIndex = 0;
const MAX_NEWS_ITEMS = 6;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

let newsCache = {
  items: [],
  timestamp: 0
};

const $newsContainer = document.getElementById('news-container');

// Format date to Czech locale
function formatDate(dateString) {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    
    const now = new Date();
    const diffMs = now - date;
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffMinutes < 5) return 'Před chvílí';
    if (diffMinutes < 60) return `Před ${diffMinutes} min`;
    if (diffHours < 24) return `Před ${diffHours} h`;
    if (diffDays === 1) return 'Včera';
    if (diffDays < 7) return `Před ${diffDays} dny`;
    
    return date.toLocaleDateString('cs-CZ', {
      day: 'numeric',
      month: 'short'
    });
  } catch {
    return '';
  }
}

function isAudiRelated(item) {
  const searchText = `${item.title} ${item.description}`.toLowerCase();
  return /audi/i.test(searchText);
}

// Render news card
function renderNewsCard(item, index) {
  const title = item.title || 'Bez titulku';
  const pubDate = formatDate(item.pubDate);
  const description = item.description || '';
  const source = item.source || '';

  return `
    <article class="group bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 shadow-2xl hover:shadow-red-600/20 transition-all duration-500 hover:-translate-y-2 border border-gray-700/50 hover:border-red-600/50" style="animation: slideUp 0.5s ease-out ${index * 0.1}s backwards;">
      <div class="flex justify-between items-start mb-3 text-xs">
        ${pubDate ? `<time class="text-gray-500 font-medium flex items-center gap-1">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          ${pubDate}
        </time>` : ''}
        ${source ? `<span class="text-gray-600 text-xs px-2 py-1 bg-gray-700/50 rounded">${source}</span>` : ''}
      </div>
      
      <a href="${item.link}" 
         class="block text-xl font-bold text-gray-100 group-hover:text-red-500 transition-colors mb-3 line-clamp-2 leading-tight">
        ${title}
      </a>
      
      ${description ? `<p class="text-gray-400 text-sm line-clamp-3 leading-relaxed mb-4">${description}</p>` : ''}
      
      <div class="flex items-center text-sm text-red-500 font-medium group-hover:text-red-400 transition-colors">
        <a href="${item.link}" class="flex items-center gap-2">
          Více informací
          <svg class="w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6"/>
          </svg>
        </a>
      </div>
    </article>
  `;
}

// Render news
function renderNews() {
  if (!$newsContainer) return;

  if (!MOCK_NEWS || MOCK_NEWS.length === 0) {
    $newsContainer.innerHTML = `
      <div class="col-span-full text-center py-12">
        <div class="text-6xl mb-4">📰</div>
        <p class="text-gray-400 text-lg mb-2">Zatím nebyly nalezeny žádné aktuality</p>
      </div>
    `;
    return;
  }

  const html = MOCK_NEWS.map((item, index) => renderNewsCard(item, index)).join('\n');
  $newsContainer.innerHTML = html;
}


// Add animation keyframes
const style = document.createElement('style');
style.textContent = `
  @keyframes slideUp {
    from {
      opacity: 0;
      transform: translateY(30px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;
document.head.appendChild(style);

// Initialize on page load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', renderNews);
} else {
  renderNews();
}

// Expose globally
window.refreshNews = renderNews;