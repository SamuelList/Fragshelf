/**
 * Parfumo Data Scraper for FragShelf
 * 
 * HOW TO USE:
 * 1. Go to a fragrance page on parfumo.com (e.g., https://www.parfumo.com/Perfumes/...)
 * 2. Open browser console (F12)
 * 3. Paste this entire script and press Enter
 * 4. The fragrance data will be copied to your clipboard
 * 5. Paste it into FragShelf (or save for later)
 */

(function() {
  try {
    // Get brand and name
    const titleElement = document.querySelector('h1[itemprop="name"]');
    const title = titleElement ? titleElement.textContent.trim() : '';
    const [brand, ...nameParts] = title.split(' - ');
    const name = nameParts.join(' - ').trim();

    // Get image
    const imageElement = document.querySelector('img[itemprop="image"]');
    const imageUrl = imageElement ? imageElement.src : '';

    // Get notes/accords (this will map to types)
    const notes = [];
    const noteElements = document.querySelectorAll('.note-pyramid a');
    noteElements.forEach(el => {
      const noteName = el.textContent.trim().toLowerCase();
      notes.push(noteName);
    });

    // Map notes to FragShelf types
    const typeMapping = {
      'citrus': ['lemon', 'orange', 'bergamot', 'grapefruit', 'lime', 'mandarin'],
      'fresh': ['mint', 'lavender', 'sage', 'basil', 'eucalyptus'],
      'fruity': ['apple', 'peach', 'pear', 'plum', 'cherry', 'berry', 'raspberry'],
      'floral': ['rose', 'jasmine', 'lily', 'iris', 'violet', 'gardenia', 'tuberose'],
      'spicy': ['pepper', 'cinnamon', 'ginger', 'cardamom', 'nutmeg', 'clove'],
      'woody': ['cedar', 'sandalwood', 'vetiver', 'pine', 'oak'],
      'oriental': ['amber', 'incense', 'myrrh', 'benzoin'],
      'sweet': ['vanilla', 'caramel', 'honey', 'tonka'],
      'gourmand': ['chocolate', 'coffee', 'almond', 'coconut'],
      'earthy': ['patchouli', 'moss', 'mushroom', 'soil'],
      'green': ['grass', 'tea', 'bamboo', 'leaves'],
      'aquatic': ['sea', 'ocean', 'marine', 'water'],
      'leathery': ['leather', 'suede'],
      'animalic': ['musk', 'ambergris', 'civet', 'castoreum'],
      'powdery': ['iris', 'heliotrope', 'violet'],
      'resinous': ['frankincense', 'myrrh', 'labdanum'],
      'smoky': ['smoke', 'tobacco', 'birch']
    };

    // Calculate type scores based on notes
    const types = {};
    notes.forEach(note => {
      Object.entries(typeMapping).forEach(([type, keywords]) => {
        if (keywords.some(keyword => note.includes(keyword))) {
          types[type] = (types[type] || 0) + 25;
        }
      });
    });

    // Get seasons (if available, otherwise use defaults)
    const seasons = {
      spring: 20,
      summer: 20,
      autumn: 30,
      winter: 30
    };

    // Try to get season info from page
    const seasonText = document.body.textContent.toLowerCase();
    if (seasonText.includes('summer') || seasonText.includes('fresh')) {
      seasons.summer = 40;
      seasons.spring = 30;
      seasons.autumn = 15;
      seasons.winter = 15;
    } else if (seasonText.includes('winter') || seasonText.includes('cold')) {
      seasons.winter = 45;
      seasons.autumn = 30;
      seasons.spring = 15;
      seasons.summer = 10;
    }

    // Get occasions (default distribution)
    const occasions = {
      daily: 25,
      business: 15,
      leisure: 25,
      sport: 10,
      evening: 15,
      'night out': 10
    };

    // Try to detect formal/evening scents
    if (seasonText.includes('evening') || seasonText.includes('formal') || seasonText.includes('date')) {
      occasions.evening = 30;
      occasions['night out'] = 25;
      occasions.business = 20;
      occasions.daily = 15;
      occasions.leisure = 10;
      occasions.sport = 0;
    }

    // Create FragShelf-compatible object
    const fragranceData = {
      brand: brand || 'Unknown',
      name: name || 'Unnamed Fragrance',
      imageUrl: imageUrl || 'https://images.unsplash.com/photo-1541643600914-78b084683601?w=400',
      seasons,
      occasions,
      types
    };

    // Copy to clipboard
    const jsonData = JSON.stringify(fragranceData, null, 2);
    navigator.clipboard.writeText(jsonData).then(() => {
      console.log('✅ Fragrance data copied to clipboard!');
      console.log('\n📋 Data:', fragranceData);
      console.log('\n💡 Paste this into FragShelf or save it for later.');
      
      // Show visual confirmation
      const notice = document.createElement('div');
      notice.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #4a90e2;
        color: white;
        padding: 15px 25px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        z-index: 999999;
        font-family: Arial, sans-serif;
        font-size: 14px;
      `;
      notice.textContent = '✅ Copied to clipboard for FragShelf!';
      document.body.appendChild(notice);
      setTimeout(() => notice.remove(), 3000);
    });

  } catch (error) {
    console.error('❌ Error scraping Parfumo data:', error);
    alert('Error: Could not scrape data from this page. Make sure you\'re on a fragrance detail page.');
  }
})();
