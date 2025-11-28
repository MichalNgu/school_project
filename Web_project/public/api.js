const RSS_URL = "https://www.auto.cz/rss"; 
console.log(RSS_URL)
const API_URL = "https://api.allorigins.win/get?url=" + encodeURIComponent(RSS_URL);

fetch(API_URL)
  .then(response => response.json())
  .then(data => {
      const parser = new DOMParser();
      const xml = parser.parseFromString(data.contents, "text/xml");

      const items = xml.querySelectorAll("item");
      const container = document.getElementById("news-container");

      let html = "";

      items.forEach((item, index) => {
          if (index >= 5) return;

          const title = item.querySelector("title")?.textContent || "";
          const link = item.querySelector("link")?.textContent || "";
          const desc = item.querySelector("description")?.textContent || "";
          const date = new Date(
              item.querySelector("pubDate")?.textContent
          ).toLocaleDateString("cs-CZ");

          html += `
            <div class="bg-gray-800 rounded-lg p-6 shadow-xl hover:shadow-2xl transition">
                <h3 class="text-2xl font-bold mb-3">${title}</h3>
                <p class="text-gray-400 text-sm mb-3">${date}</p>
                <p class="text-gray-300 mb-4">${desc.substring(0, 180)}...</p>
                <a href="${link}" target="_blank" 
                   class="text-red-600 font-semibold hover:underline">
                    Číst více →
                </a>
            </div>
          `;
      });

      container.innerHTML = html;
  })
  .catch(() => {
      document.getElementById("news-container").innerHTML =
        "<p class='text-gray-400 text-center'>Nepodařilo se načíst aktuality.</p>";
  });