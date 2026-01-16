/* ============================================
   CAR MODELS - Loading and Filtering
   ============================================ */

let carModelsData = [];
const modelsContainer = document.getElementById('models-container');
const filterButtons = document.querySelectorAll('.filter-btn');

// Show model details in modal
function showModelDetails(model) {
  const contentHtml = `
    <div class="space-y-6">
      <div class="text-center">
        <img src="${model.img}" alt="${model.name}" class="w-full max-w-md mx-auto rounded-lg shadow-lg mb-4">
      </div>
      <div class="space-y-4">
        <div>
          <h4 class="text-lg font-semibold text-gray-200 mb-2">Popis</h4>
          <p class="text-gray-300">${model.desc}</p>
        </div>
        <div>
          <h4 class="text-lg font-semibold text-gray-200 mb-2">Cena</h4>
          <p class="text-2xl font-bold text-red-600">${model.price}</p>
        </div>
        ${model.url ? `
          <div class="pt-4">
            <a href="${model.url}" target="_blank" rel="noopener noreferrer" class="inline-block bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg transition duration-300">
              Zjistit více na oficiálních stránkách
            </a>
          </div>
        ` : ''}
      </div>
    </div>
  `;

  // Use the modal system from main.js
  if (typeof openModal === 'function') {
    openModal(model.name, contentHtml);
  } else {
    console.error('Modal system not available');
  }
}

// Determine categories based on model name and description
function determineCategories(model) {
  const categories = ['all'];
  const searchText = `${model.name} ${model.desc}`.toLowerCase();

  // Check for SUV/Q models
  if (/\bq\d|suv/i.test(searchText)) {
    categories.push('suv');
  }

  // Check for Performance/RS models
  if (/\brs\d|rs |performance|sportovní|sport/i.test(searchText)) {
    categories.push('performance');
  }

  // Check for Electric/e-tron models
  if (/e-tron|elektrický|electric|ev\b/i.test(searchText)) {
    categories.push('ev');
  }

  // Check for Sedan/A models (if not SUV)
  if (/\ba\d|sedan/i.test(searchText) && !categories.includes('suv')) {
    categories.push('sedan');
  }

  return categories;
}

// Load car models from JSON
async function loadCarModels() {
  try {
    const response = await fetch('/api/cars');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const models = await response.json();

    // Add categories to each model
    carModelsData = models.map(model => ({
      ...model,
      categories: determineCategories(model)
    }));

    console.log('Car models loaded:', carModelsData.length);

    // Initial render
    renderModels('all');

  } catch (error) {
    console.error('Error loading car models:', error);
    if (modelsContainer) {
      modelsContainer.innerHTML = `
        <div class="col-span-full text-center py-12">
          <p class="text-red-400 text-lg mb-2">Nepodařilo se načíst modely</p>
          <p class="text-gray-500 text-sm">Zkuste obnovit stránku</p>
        </div>
      `;
    }
  }
}

// Render car models based on filter
function renderModels(filter = 'all') {
  if (!modelsContainer) return;

  const filteredModels = carModelsData.filter(model =>
    model.categories.includes(filter)
  );

  if (filteredModels.length === 0) {
    modelsContainer.innerHTML = `
      <div class="col-span-full text-center py-12">
        <p class="text-gray-400 text-lg">Žádné modely v této kategorii</p>
      </div>
    `;
    return;
  }

  modelsContainer.innerHTML = filteredModels.map((model, index) => `
    <article class="card animate-on-scroll" style="animation-delay: ${index * 0.1}s">
      <div class="overflow-hidden">
        <img src="${model.img}" alt="${model.name}" class="card-image" loading="lazy">
      </div>
      <div class="card-content">
        <h3 class="card-title">${model.name}</h3>
        <p class="card-description">${model.desc}</p>
        <div class="card-footer">
          <span class="card-price">${model.price}</span>
          <div class="flex gap-2 flex-wrap">
            <button class="btn-secondary px-4 py-2 text-sm model-details-btn" data-model="${escapeHtml(JSON.stringify(model))}">
              Detail
            </button>
            ${model.url ? `<a href="${model.url}" target="_blank" rel="noopener noreferrer" class="btn-primary px-4 py-2 text-sm">
              Zjistit více
            </a>` : ''}
          </div>
        </div>
      </div>
    </article>
  `).join('');

  // Re-observe new elements for scroll animation (if observer exists from main.js)
  if (typeof observer !== 'undefined') {
    const newAnimatedElements = modelsContainer.querySelectorAll('.animate-on-scroll');
    newAnimatedElements.forEach(el => observer.observe(el));
  }

  // Add event listeners for detail buttons
  const detailButtons = modelsContainer.querySelectorAll('.model-details-btn');
  detailButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const modelData = JSON.parse(btn.dataset.model);
      showModelDetails(modelData);
    });
  });
}

// Filter button click handlers
if (filterButtons) {
  filterButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const filter = btn.dataset.filter;

      // Update active state
      filterButtons.forEach(b => b.classList.add('active'));
      btn.classList.remove('active');

      // Render filtered models
      renderModels(filter);
    });
  });
}

// Initial load on page ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', loadCarModels);
} else {
  loadCarModels();
}