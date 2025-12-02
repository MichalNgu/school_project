async function loadModels() {
  const container = document.getElementById('models-container');
  
  try {
    // Načti JSON
    const response = await fetch('/Web_project/data/car.json');
    const models = await response.json();
    
    container.innerHTML = ''; // vyčistit kontejner
    
    models.forEach((model, index) => {
      const card = document.createElement('div');
      card.className = 'bg-gray-800 rounded-lg overflow-hidden shadow-xl card-hover';
      
      card.innerHTML = `
        <div class="h-48 bg-gray-700 flex items-center justify-center">
          <img src="${model.img}" alt="${model.name}" class="h-full w-full object-cover">
        </div>
        <div class="p-6">
          <h3 class="text-2xl font-bold mb-2">${model.name}</h3>
          <p class="text-gray-400 mb-4">${model.desc}</p>
          <div class="flex justify-between items-center">
            <span class="text-red-600 font-semibold">${model.price}</span>
            <a href="${model.url}" class="text-sm accent-btn px-4 py-2 rounded transition bg-red-600 hover:bg-red-700 text-white">
              Zjistit více
            </a>
          </div>
        </div>
      `;
      
      container.appendChild(card);
    });
    
  } catch (err) {
    console.error('Chyba při načítání modelů:', err);
    container.innerHTML = `
      <div class="col-span-full text-center py-12">
        <p class="text-gray-400 text-lg">Nepodařilo se načíst modely. Zkuste obnovit stránku.</p>
      </div>
    `;
  }
}

// Načtení po načtení stránky
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', loadModels);
} else {
  loadModels();
}