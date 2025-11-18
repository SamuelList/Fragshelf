/**
 * Parfumo Data Scraper for FragShelf
 * 
 * HOW TO USE - PASTE MODE:
 * 1. Go to a fragrance page on parfumo.com
 * 2. Open browser console (F12)
 * 3. Paste this entire script and press Enter
 * 4. When prompted, paste the copied console output from the other scraper
 * 5. The fragrance data will be copied to your clipboard
 * 6. Paste it into FragShelf
 */

(function() {
  console.log('--- PARFUMO DATA SCRAPER ---');
  
  // Get image URL
  const imageElement = document.querySelector('img[itemprop="image"]');
  const imageUrl = imageElement ? imageElement.src : '';
  console.log('IMAGE URL:');
  console.log(imageUrl);
  console.log('');
  
  // Get TYPE data
  console.log('--- TYPE ---');
  const typeElements = document.querySelectorAll('[data-chart-label]');
  const typeData = [];
  typeElements.forEach(el => {
    const label = el.getAttribute('data-chart-label');
    const value = el.getAttribute('data-chart-value');
    if (label && value) {
      typeData.push(`${label}: ${value}%`);
    }
  });
  
  // If no data-chart-label, try alternative selectors
  if (typeData.length === 0) {
    const chartItems = document.querySelectorAll('.chart-item, .accord-item');
    chartItems.forEach(el => {
      const text = el.textContent.trim();
      const match = text.match(/(.+?):\s*([\d.]+)%/);
      if (match) {
        typeData.push(`${match[1].trim()}: ${match[2]}%`);
      }
    });
  }
  
  typeData.forEach(line => console.log(line));
  console.log('');
  
  // Get SEASONAL data
  console.log('--- SEASONAL ---');
  const seasonElements = document.querySelectorAll('[data-season]');
  const seasonData = [];
  seasonElements.forEach(el => {
    const season = el.getAttribute('data-season');
    const value = el.textContent.match(/([\d.]+)%/);
    if (season && value) {
      seasonData.push(`${season}: ${value[1]}%`);
    }
  });
  
  seasonData.forEach(line => console.log(line));
  console.log('');
  
  // Get OCCASIONS data
  console.log('--- OCCASIONS ---');
  const occasionElements = document.querySelectorAll('[data-occasion]');
  const occasionData = [];
  occasionElements.forEach(el => {
    const occasion = el.getAttribute('data-occasion');
    const value = el.textContent.match(/([\d.]+)%/);
    if (occasion && value) {
      occasionData.push(`${occasion}: ${value[1]}%`);
    }
  });
  
  occasionData.forEach(line => console.log(line));
  console.log('');
  
  console.log('📋 Copy the console output above and paste it when prompted below:');
  console.log('');
  
  // Wait for user to paste data
  setTimeout(() => {
    const pastedData = prompt('Paste the console output here (including VM numbers):');
    
    if (!pastedData) {
      console.log('❌ No data pasted');
      return;
    }
    
    try {
      // Parse the pasted data
      const lines = pastedData.split('\n').map(line => {
        // Remove VM line numbers (e.g., "VM3760:66 ")
        return line.replace(/^VM\d+:\d+\s*/, '').trim();
      }).filter(line => line.length > 0);
      
      // Extract image URL
      let imageUrl = '';
      const imageIndex = lines.findIndex(line => line.includes('IMAGE URL:'));
      if (imageIndex !== -1 && imageIndex + 1 < lines.length) {
        imageUrl = lines[imageIndex + 1];
      }
      
      // Extract types
      const types = {};
      const typeIndex = lines.findIndex(line => line.includes('--- TYPE ---'));
      const seasonalIndex = lines.findIndex(line => line.includes('--- SEASONAL ---'));
      if (typeIndex !== -1 && seasonalIndex !== -1) {
        for (let i = typeIndex + 1; i < seasonalIndex; i++) {
          const match = lines[i].match(/^(.+?):\s*([\d.]+)%/);
          if (match) {
            const typeName = match[1].trim().toLowerCase();
            const percentage = parseFloat(match[2]);
            types[typeName] = percentage;
          }
        }
      }
      
      // Extract seasons
      const seasons = {};
      const occasionsIndex = lines.findIndex(line => line.includes('--- OCCASIONS ---'));
      if (seasonalIndex !== -1 && occasionsIndex !== -1) {
        for (let i = seasonalIndex + 1; i < occasionsIndex; i++) {
          const match = lines[i].match(/^(.+?):\s*([\d.]+)%/);
          if (match) {
            const seasonName = match[1].trim().toLowerCase();
            const percentage = parseFloat(match[2]);
            seasons[seasonName] = percentage;
          }
        }
      }
      
      // Extract occasions
      const occasions = {};
      if (occasionsIndex !== -1) {
        for (let i = occasionsIndex + 1; i < lines.length; i++) {
          const match = lines[i].match(/^(.+?):\s*([\d.]+)%/);
          if (match) {
            const occasionName = match[1].trim().toLowerCase();
            const percentage = parseFloat(match[2]);
            occasions[occasionName] = percentage;
          }
        }
      }
      
      // Get brand and name from page
      const titleElement = document.querySelector('h1[itemprop="name"]');
      const title = titleElement ? titleElement.textContent.trim() : '';
      const [brand, ...nameParts] = title.split(' - ');
      const name = nameParts.join(' - ').trim();
      
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
        console.log('\n💡 Paste this into FragShelf!');
        
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
      console.error('❌ Error parsing pasted data:', error);
      alert('Error parsing data. Make sure you copied all the console output including the VM numbers.');
    }
  }, 1000);
})();
