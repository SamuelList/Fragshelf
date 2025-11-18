/**
 * Parfumo Data Scraper for FragShelf
 * 
 * HOW TO USE - PASTE MODE:
 * 1. Go to a fragrance page on parfumo.com
 * 2. Open browser console (F12)
 * 3. Paste this entire script and press Enter
 * 4. Copy ALL the console output (including VM line numbers)
 * 5. When prompted, paste the console output
 * 6. The fragrance data will be copied to your clipboard for FragShelf
 */

(() => {
    console.log("--- PARFUMO DATA SCRAPER ---");

    // --- 1. GET THE IMAGE URL ---
    let imgUrl = "Image not found";
    const imgElement = document.querySelector('.p-image img') || document.querySelector('.p_img_wrapper img');
    
    if (imgElement) {
        imgUrl = imgElement.src;
    } else {
        const metaImg = document.querySelector('meta[property="og:image"]');
        if (metaImg) imgUrl = metaImg.content;
    }
    
    console.log("IMAGE URL:");
    console.log(imgUrl);
    console.log("");

    // --- 2. GET CHART DATA ---
    const scripts = document.querySelectorAll('script');
    
    scripts.forEach(script => {
        const content = script.innerHTML;
        
        // Find JSON arrays containing "ct_name" (the vote data)
        const matches = content.match(/\[\{"ct_name".*?\}\]/g);
        
        if (matches) {
            matches.forEach(jsonString => {
                try {
                    const data = JSON.parse(jsonString);
                    const keys = data.map(x => x.ct_name);
                    let title = "";

                    // --- FILTERING LOGIC ---
                    
                    // 1. Seasonal Check
                    if (keys.includes("Spring") || keys.includes("Winter")) {
                        title = "SEASONAL";
                    }
                    // 2. Occasions Check
                    else if (keys.includes("Leisure") || keys.includes("Daily") || keys.includes("Business")) {
                        title = "OCCASIONS";
                    }
                    // 3. Type / Scent Profile Check
                    else if (keys.some(k => ["Woody", "Sweet", "Fresh", "Spicy", "Floral", "Fruity", "Oriental", "Citrus", "Gourmand", "Leather", "Aquatic", "Powdery", "Creamy"].includes(k))) {
                        title = "TYPE";
                    }
                    // Skip anything else
                    else {
                        return; 
                    }

                    // Calculate Total for percentages
                    const totalVotes = data.reduce((sum, item) => sum + parseInt(item.votes), 0);

                    console.log(`--- ${title} ---`);
                    
                    data.forEach(item => {
                        const votes = parseInt(item.votes);
                        const percent = totalVotes > 0 ? ((votes / totalVotes) * 100).toFixed(1) + "%" : "0%";
                        
                        console.log(`${item.ct_name}: ${percent} (${votes} votes)`);
                    });
                    console.log("");

                } catch (e) {
                    // Ignore parsing errors
                }
            });
        }
    });

    // Store collected data
    const collectedData = {
        types: {},
        seasons: {},
        occasions: {},
        imageUrl: imgUrl
    };

    // Process the data we just collected
    scripts.forEach(script => {
        const content = script.innerHTML;
        const matches = content.match(/\[\{"ct_name".*?\}\]/g);
        
        if (matches) {
            matches.forEach(jsonString => {
                try {
                    const data = JSON.parse(jsonString);
                    const keys = data.map(x => x.ct_name);
                    
                    // Calculate Total for percentages
                    const totalVotes = data.reduce((sum, item) => sum + parseInt(item.votes), 0);
                    
                    // Seasonal Check
                    if (keys.includes("Spring") || keys.includes("Winter")) {
                        data.forEach(item => {
                            const votes = parseInt(item.votes);
                            const percent = totalVotes > 0 ? ((votes / totalVotes) * 100).toFixed(1) : "0";
                            collectedData.seasons[item.ct_name.toLowerCase()] = parseFloat(percent);
                        });
                    }
                    // Occasions Check
                    else if (keys.includes("Leisure") || keys.includes("Daily") || keys.includes("Business")) {
                        data.forEach(item => {
                            const votes = parseInt(item.votes);
                            const percent = totalVotes > 0 ? ((votes / totalVotes) * 100).toFixed(1) : "0";
                            collectedData.occasions[item.ct_name.toLowerCase()] = parseFloat(percent);
                        });
                    }
                    // Type / Scent Profile Check
                    else if (keys.some(k => ["Woody", "Sweet", "Fresh", "Spicy", "Floral", "Fruity", "Oriental", "Citrus", "Gourmand", "Leather", "Aquatic", "Powdery", "Creamy"].includes(k))) {
                        data.forEach(item => {
                            const votes = parseInt(item.votes);
                            const percent = totalVotes > 0 ? ((votes / totalVotes) * 100).toFixed(1) : "0";
                            collectedData.types[item.ct_name.toLowerCase()] = parseFloat(percent);
                        });
                    }
                } catch (e) {
                    // Ignore parsing errors
                }
            });
        }
    });

    // Get brand and name from page
    const titleElement = document.querySelector('h1[itemprop="name"]');
    const title = titleElement ? titleElement.textContent.trim() : '';
    const [brand, ...nameParts] = title.split(' - ');
    const name = nameParts.join(' - ').trim();
    
    // Create FragShelf-compatible object
    const fragranceData = {
        brand: brand || 'Unknown',
        name: name || 'Unnamed Fragrance',
        imageUrl: collectedData.imageUrl || 'https://images.unsplash.com/photo-1541643600914-78b084683601?w=400',
        seasons: collectedData.seasons,
        occasions: collectedData.occasions,
        types: collectedData.types
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
    }).catch(err => {
        console.error('❌ Failed to copy to clipboard:', err);
        alert('Failed to copy to clipboard. Check the console for the JSON data.');
    });
})();
