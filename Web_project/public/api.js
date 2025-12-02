const NEWS_SOURCES = [
  {
    name: 'iDNES Auto',
    url: 'https://www.idnes.cz/rss/auto.xml',
    requiresFilter: true
  },
  {
    name: 'Auto.cz',
    url: 'https://www.auto.cz/rss',
    requiresFilter: true
  },
  {
    name: 'Seznam Auto-Moto',
    url: 'https://www.seznamzpravy.cz/rss/auto-moto',
    requiresFilter: true
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

// Utility functions
function setContainerHTML(html) {
  if (!$newsContainer) return;
  $newsContainer.innerHTML = html;
}

function showLoader() {
  setContainerHTML(`
    <div class="col-span-full text-center py-12" id="news-loader">
      <div class="inline-block animate-spin rounded-full h-12 w-12 border-4 border-red-600 border-t-transparent mb-4"></div>
      <p class="text-gray-400 text-lg">Načítám nejnovější aktuality…</p>
    </div>
  `);
}

function showEmpty() {
  setContainerHTML(`
    <div class="col-span-full text-center py-12">
      <div class="text-6xl mb-4">📰</div>
      <p class="text-gray-400 text-lg mb-2">Zatím nebyly nalezeny žádné položky</p>
      <p class="text-gray-500 text-sm">Zkuste to prosím později</p>
    </div>
  `);
}

function showError(msg = '') {
  setContainerHTML(`
    <div class="col-span-full text-center py-12">
      <div class="text-6xl mb-4">⚠️</div>
      <p class="text-red-400 text-lg mb-2">Nepodařilo se načíst aktuality</p>
      ${msg ? `<p class="text-gray-500 text-sm mb-4">${msg}</p>` : ''}
      <button onclick="location.reload()" class="mt-4 px-6 py-3 bg-red-600 hover:bg-red-700 rounded-lg font-semibold transition-all transform hover:scale-105">
        Zkusit znovu
      </button>
    </div>
  `);
}

function stripHtml(input = '') {
  const div = document.createElement('div');
  div.innerHTML = input;
  return (div.textContent || div.innerText || '').trim();
}

function truncateText(text, maxLength = 180) {
  text = text.trim();
  if (text.length <= maxLength) return text;
  return text.substr(0, maxLength).trim() + '…';
}

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

function renderNewsCard(item, index) {
  const title = item.title || 'Bez titulku';
  const link = item.link || '#';
  const pubDate = formatDate(item.pubDate);
  const description = truncateText(stripHtml(item.description || ''));
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
      
      <a href="${link}" 
         class="block text-xl font-bold text-gray-100 group-hover:text-red-500 transition-colors mb-3 line-clamp-2 leading-tight" 
         target="_blank" 
         rel="noopener noreferrer">
        ${title}
      </a>
      
      ${description ? `<p class="text-gray-400 text-sm line-clamp-3 leading-relaxed mb-4">${description}</p>` : ''}
      
      <div class="flex items-center text-sm text-red-500 font-medium group-hover:text-red-400 transition-colors">
        <a href="${link}" target="_blank" rel="noopener noreferrer" class="flex items-center gap-2">
          Číst více 
          <svg class="w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6"/>
          </svg>
        </a>
      </div>
    </article>
  `;
}

async function fetchWithProxy(url, proxyUrl) {
  const fullUrl = proxyUrl + encodeURIComponent(url);
  const response = await fetch(fullUrl, {
    method: 'GET',
    headers: {
      'Accept': 'application/xml, text/xml, */*'
    }
  });
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  
  return await response.text();
}

async function fetchXml(url) {
  let lastError;
  
  // Try each proxy in sequence
  for (let i = 0; i < CORS_PROXIES.length; i++) {
    const proxyIndex = (currentProxyIndex + i) % CORS_PROXIES.length;
    const proxy = CORS_PROXIES[proxyIndex];
    
    try {
      console.log(`Trying proxy ${proxyIndex + 1}/${CORS_PROXIES.length}: ${proxy}`);
      const text = await fetchWithProxy(url, proxy);
      
      const parser = new DOMParser();
      const doc = parser.parseFromString(text, 'text/xml');
      
      const parserError = doc.querySelector('parsererror');
      if (parserError) {
        throw new Error('XML parsing failed');
      }
      
      // Success! Remember this proxy for next time
      currentProxyIndex = proxyIndex;
      console.log(`✓ Success with proxy ${proxyIndex + 1}`);
      return doc;
    } catch (error) {
      console.warn(`✗ Proxy ${proxyIndex + 1} failed:`, error.message);
      lastError = error;
      continue;
    }
  }
  
  throw lastError || new Error('All proxies failed');
}

function parseRssItems(doc, sourceName) {
  const items = Array.from(doc.querySelectorAll('item, entry'));
  
  return items.map(item => {
    const title = item.querySelector('title')?.textContent?.trim() || '';
    const link = item.querySelector('link')?.textContent?.trim() || 
                 item.querySelector('link')?.getAttribute('href') || '';
    const pubDate = item.querySelector('pubDate')?.textContent?.trim() ||
                    item.querySelector('published')?.textContent?.trim() ||
                    item.querySelector('updated')?.textContent?.trim() || '';
    const description = item.querySelector('description')?.textContent?.trim() ||
                       item.querySelector('summary')?.textContent?.trim() ||
                       item.querySelector('content')?.textContent?.trim() || '';
    
    return {
      title,
      link,
      pubDate,
      description,
      source: sourceName
    };
  }).filter(item => item.title && item.link);
}

async function tryFetchFromSource(source) {
  try {
    console.log(`Fetching from: ${source.name}`);
    const doc = await fetchXml(source.url);
    let items = parseRssItems(doc, source.name);
    
    if (source.requiresFilter) {
      items = items.filter(isAudiRelated);
    }
    
    console.log(`✓ ${source.name}: ${items.length} items`);
    return items;
  } catch (error) {
    console.warn(`✗ ${source.name} failed:`, error.message);
    return [];
  }
}

async function fetchNews() {
  const now = Date.now();
  if (newsCache.items.length > 0 && (now - newsCache.timestamp) < CACHE_DURATION) {
    console.log('Using cached news');
    return newsCache.items;
  }
  
  showLoader();
  
  let allItems = [];
  
  // Try sources sequentially (to not overwhelm proxies)
  for (const source of NEWS_SOURCES) {
    const items = await tryFetchFromSource(source);
    if (items.length > 0) {
      allItems.push(...items);
    }
    
    // If we have enough items, stop fetching
    if (allItems.length >= MAX_NEWS_ITEMS) {
      break;
    }
  }
  
  // Remove duplicates
  const uniqueItems = [];
  const seenTitles = new Set();
  
  for (const item of allItems) {
    const normalizedTitle = item.title.toLowerCase().replace(/\s+/g, '');
    if (!seenTitles.has(normalizedTitle)) {
      seenTitles.add(normalizedTitle);
      uniqueItems.push(item);
    }
  }
  
  // Sort by date
  uniqueItems.sort((a, b) => {
    const dateA = new Date(a.pubDate).getTime() || 0;
    const dateB = new Date(b.pubDate).getTime() || 0;
    return dateB - dateA;
  });
  
  const finalItems = uniqueItems.slice(0, MAX_NEWS_ITEMS);
  
  // Update cache
  newsCache = {
    items: finalItems,
    timestamp: now
  };
  
  return finalItems;
}

function renderNews(items) {
  if (!items || items.length === 0) {
    showEmpty();
    return;
  }
  
  const html = items.map((item, index) => renderNewsCard(item, index)).join('\n');
  setContainerHTML(html);
}

async function initNews() {
  try {
    const items = await fetchNews();
    renderNews(items);
  } catch (error) {
    console.error('Failed to load news:', error);
    showError('Zkuste prosím obnovit stránku');
  }
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

// Auto-start
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initNews);
} else {
  initNews();
}

window.refreshNews = initNews;