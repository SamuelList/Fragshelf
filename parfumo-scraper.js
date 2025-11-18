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
    const pageTitle = titleElement ? titleElement.textContent.trim() : '';
    const [brand, ...nameParts] = pageTitle.split(' - ');
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
    
    // Create modal with copyable text
    const jsonData = JSON.stringify(fragranceData, null, 2);
    
    // Create modal overlay
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        z-index: 999999;
        display: flex;
        align-items: center;
        justify-content: center;
        font-family: Arial, sans-serif;
    `;
    
    // Create modal content
    const modalContent = document.createElement('div');
    modalContent.style.cssText = `
        background: white;
        padding: 30px;
        border-radius: 12px;
        max-width: 600px;
        width: 90%;
        max-height: 80vh;
        overflow: auto;
        box-shadow: 0 8px 32px rgba(0,0,0,0.3);
    `;
    
    const title = document.createElement('h2');
    title.textContent = '✅ FragShelf Data Ready!';
    title.style.cssText = 'margin: 0 0 15px 0; color: #4a90e2;';
    
    const instruction = document.createElement('p');
    instruction.textContent = 'Click the button below to copy, then paste into FragShelf:';
    instruction.style.cssText = 'margin: 0 0 15px 0; color: #666;';
    
    const textarea = document.createElement('textarea');
    textarea.value = jsonData;
    textarea.readOnly = true;
    textarea.style.cssText = `
        width: 100%;
        height: 300px;
        padding: 10px;
        border: 2px solid #4a90e2;
        border-radius: 6px;
        font-family: monospace;
        font-size: 12px;
        resize: vertical;
        margin-bottom: 15px;
    `;
    
    const buttonContainer = document.createElement('div');
    buttonContainer.style.cssText = 'display: flex; gap: 10px;';
    
    const copyButton = document.createElement('button');
    copyButton.textContent = '📋 Copy to Clipboard';
    copyButton.style.cssText = `
        flex: 1;
        padding: 12px 24px;
        background: #4a90e2;
        color: white;
        border: none;
        border-radius: 6px;
        font-size: 16px;
        cursor: pointer;
        font-weight: bold;
    `;
    
    const closeButton = document.createElement('button');
    closeButton.textContent = '✕ Close';
    closeButton.style.cssText = `
        padding: 12px 24px;
        background: #666;
        color: white;
        border: none;
        border-radius: 6px;
        font-size: 16px;
        cursor: pointer;
    `;
    
    // Copy button handler
    copyButton.onclick = () => {
        textarea.select();
        textarea.setSelectionRange(0, 99999); // For mobile
        
        try {
            document.execCommand('copy');
            copyButton.textContent = '✅ Copied!';
            copyButton.style.background = '#27ae60';
            setTimeout(() => {
                copyButton.textContent = '📋 Copy to Clipboard';
                copyButton.style.background = '#4a90e2';
            }, 2000);
        } catch (err) {
            copyButton.textContent = '❌ Failed - Select & Copy Manually';
            copyButton.style.background = '#e74c3c';
        }
    };
    
    // Close button handler
    closeButton.onclick = () => {
        document.body.removeChild(modal);
    };
    
    // Assemble modal
    buttonContainer.appendChild(copyButton);
    buttonContainer.appendChild(closeButton);
    modalContent.appendChild(title);
    modalContent.appendChild(instruction);
    modalContent.appendChild(textarea);
    modalContent.appendChild(buttonContainer);
    modal.appendChild(modalContent);
    document.body.appendChild(modal);
    
    // Auto-select text
    textarea.select();
    
    // Log to console as well
    console.log('✅ Fragrance data ready!');
    console.log('\n📋 Data:', fragranceData);
    console.log('\n💡 JSON:', jsonData);
})();
