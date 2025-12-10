import { useMemo, useState, useEffect } from 'react';
import { Fragrance } from '../../types/fragrance';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { CHART_COLORS, getChartColor } from '../../constants/colors';
import styles from './Analytics.module.scss';

const SCRAPER_CODE = `/**
 * Parfumo Data Scraper for FragShelf
 * Fixed: Name/Brand detection & Image Quality
 */

(() => {
    console.log("--- STARTING SCRAPER ---");

    // --- 1. GET CLEAN NAME & BRAND (The Fix) ---
    let brand = "Unknown";
    let name = "Unnamed Fragrance";

    // Strategy A: Read the structured data (JSON-LD) - Most Accurate
    const ldScripts = document.querySelectorAll('script[type="application/ld+json"]');
    let jsonFound = false;

    ldScripts.forEach(s => {
        try {
            const json = JSON.parse(s.innerText);
            // Look for the Product definition
            if (json['@type'] === 'Product' || json['@type'] === 'ItemPage') {
                if (json.name) name = json.name;
                if (json.brand && json.brand.name) {
                    brand = json.brand.name;
                } else if (json.manufacturer && json.manufacturer.name) {
                    brand = json.manufacturer.name;
                }
                jsonFound = true;
            }
        } catch (e) {}
    });

    // Strategy B: Fallback to HTML tags if JSON-LD failed
    if (!jsonFound || name === "Unnamed Fragrance") {
        // Name is usually the H1
        const h1 = document.querySelector('h1');
        if (h1) name = h1.innerText.trim();

        // Brand is usually in a specific span with itemprop="brand"
        const brandEl = document.querySelector('[itemprop="brand"] span') || document.querySelector('[itemprop="brand"]');
        if (brandEl) brand = brandEl.innerText.trim();
    }

    // Cleanup: Sometimes name includes brand, strip it if so
    // e.g. Name: "Lattafa - Al Nashama" -> "Al Nashama"
    if (name.toLowerCase().startsWith(brand.toLowerCase())) {
        name = name.substring(brand.length).replace(/^[\\s-–]+/, '').trim();
    }

    console.log(\`FOUND: \${name} by \${brand}\`);

    // --- 2. GET HIGH RES IMAGE ---
    let imgUrl = "https://images.unsplash.com/photo-1541643600914-78b084683601?w=400";
    const imgElement = document.querySelector('.p_img img'); // The main bottle
    if (imgElement) {
        imgUrl = imgElement.currentSrc || imgElement.src;
    }

    // --- 3. EXTRACT CHART DATA ---
    const collectedData = {
        types: {},
        seasons: {},
        occasions: {}
    };

    const scripts = document.querySelectorAll('script');
    
    scripts.forEach(script => {
        const content = script.innerHTML;
        const matches = content.match(/\\[{\"ct_name\".*?}\\]/g);
        
        if (matches) {
            matches.forEach(jsonString => {
                try {
                    const data = JSON.parse(jsonString);
                    const keys = data.map(x => x.ct_name);
                    
                    // Calculate Total for percentages
                    const totalVotes = data.reduce((sum, item) => sum + parseInt(item.votes), 0);
                    if (totalVotes === 0) return;

                    // Helper to process a chart
                    const processChart = (targetObject) => {
                        data.forEach(item => {
                            const votes = parseInt(item.votes);
                            // Calculate raw percentage
                            const percent = (votes / totalVotes) * 100;
                            // Normalize key (lowercase, handle special cases)
                            let key = item.ct_name.toLowerCase();
                            if (key === 'fall') key = 'autumn'; // FragShelf preference
                            
                            targetObject[key] = percent;
                        });
                    };

                    // Identify Chart Type
                    if (keys.includes("Spring") || keys.includes("Winter")) {
                        processChart(collectedData.seasons);
                    }
                    else if (keys.includes("Leisure") || keys.includes("Daily") || keys.includes("Business")) {
                        processChart(collectedData.occasions);
                    }
                    else if (keys.some(k => ["Woody", "Sweet", "Fresh", "Spicy", "Floral", "Fruity", "Oriental", "Citrus", "Gourmand", "Leather", "Aquatic", "Powdery", "Creamy"].includes(k))) {
                        processChart(collectedData.types);
                    }

                } catch (e) {}
            });
        }
    });

    // --- 4. NORMALIZE DATA (Sum to 100%) ---
    const normalizePercentages = (obj) => {
        const total = Object.values(obj).reduce((sum, val) => sum + val, 0);
        if (total === 0) return {};
        
        const normalized = {};
        let runningTotal = 0;
        const keys = Object.keys(obj);
        
        // Sort keys by value (highest first) so rounding errors don't hit the main notes
        keys.sort((a, b) => obj[b] - obj[a]);

        keys.forEach((key, index) => {
            if (index === keys.length - 1) {
                // Force the last item to make the math equal exactly 100
                normalized[key] = Math.max(0, 100 - runningTotal);
            } else {
                const val = Math.round((obj[key] / total) * 100);
                normalized[key] = val;
                runningTotal += val;
            }
        });
        return normalized;
    };

    const finalData = {
        brand: brand,
        name: name,
        imageUrl: imgUrl,
        seasons: normalizePercentages(collectedData.seasons),
        occasions: normalizePercentages(collectedData.occasions),
        types: normalizePercentages(collectedData.types)
    };

    // --- 5. DISPLAY MODAL ---
    const jsonData = JSON.stringify(finalData, null, 2);

    const modal = document.createElement('div');
    modal.style.cssText = \`position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.85); z-index: 10000; display: flex; justify-content: center; align-items: center; font-family: sans-serif;\`;
    
    const content = document.createElement('div');
    content.style.cssText = \`background: #1a1a1a; color: #fff; padding: 25px; border-radius: 10px; width: 600px; max-width: 90%; max-height: 85vh; display: flex; flex-direction: column; box-shadow: 0 10px 40px rgba(0,0,0,0.5);\`;

    content.innerHTML = \`
        <h3 style="margin-top:0; color: #4a90e2;">✅ Data Extracted: \${name}</h3>
        <div style="display:flex; gap:15px; margin-bottom:15px; align-items:center;">
            <img src="\${imgUrl}" style="width: 60px; height: 60px; object-fit: cover; border-radius: 5px; border: 1px solid #444;">
            <div>
                <div style="font-weight:bold; font-size: 1.1em;">\${brand}</div>
                <div style="color: #888; font-size: 0.9em;">\${Object.keys(finalData.types).slice(0,3).join(', ')}...</div>
            </div>
        </div>
        <textarea id="fs-data" style="flex-grow: 1; background: #111; color: #0f0; border: 1px solid #333; padding: 10px; font-family: monospace; border-radius: 5px; margin-bottom: 15px; min-height: 250px;">\${jsonData}</textarea>
        <div style="display: flex; gap: 10px;">
            <button id="fs-copy" style="flex: 1; padding: 12px; background: #4a90e2; color: white; border: none; border-radius: 5px; cursor: pointer; font-weight: bold; font-size: 15px;">📋 Copy JSON</button>
            <button id="fs-close" style="padding: 12px 20px; background: #444; color: white; border: none; border-radius: 5px; cursor: pointer;">Close</button>
        </div>
    \`;

    modal.appendChild(content);
    document.body.appendChild(modal);

    document.getElementById('fs-copy').onclick = function() {
        const textarea = document.getElementById('fs-data');
        textarea.select();
        document.execCommand('copy');
        this.innerText = "✅ Copied!";
        this.style.background = "#27ae60";
        setTimeout(() => { this.innerText = "📋 Copy JSON"; this.style.background = "#4a90e2"; }, 2000);
    };

    document.getElementById('fs-close').onclick = () => document.body.removeChild(modal);

    console.log("Data Ready:", finalData);
})();`;

interface AnalyticsProps {
  fragrances: Fragrance[];
  onClose: () => void;
}

const Analytics = ({ fragrances, onClose }: AnalyticsProps) => {
  const [isMobile, setIsMobile] = useState(false);
  const [copyButtonText, setCopyButtonText] = useState('Copy Scraper Code');
  const [gatherButtonText, setGatherButtonText] = useState('Gather Frag Data');

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Prevent background scrolling when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const handleCopyScraperCode = () => {
    navigator.clipboard.writeText(SCRAPER_CODE).then(() => {
      setCopyButtonText('✅ Copied!');
      setTimeout(() => {
        setCopyButtonText('Copy Scraper Code');
      }, 2000);
    }).catch(() => {
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = SCRAPER_CODE;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopyButtonText('✅ Copied!');
      setTimeout(() => {
        setCopyButtonText('Copy Scraper Code');
      }, 2000);
    });
  };

  const handleGatherFragData = () => {
    const textToCopy = `# Role
You are a Senior Olfactory Data Analyst and Niche Fragrance Sommelier. Your specialization is in aggregating community voting data, normalizing statistical outliers, and providing high-precision usage guides. You value accuracy over generalization.

# Subject
Target Fragrance: [Insert Fragrance Name Here]

# Process Protocol
You must follow this strict linear process to ensure high accuracy. Do not skip the calculation phase.

## Step 1: Deep Web Research (Mandatory)
Use your browsing tool to execute targeted searches. You must find specific data points from:
1.  **Fragrantica:** Extract the specific bar graph distributions for "Seasons" (Spring, Summer, Fall, Winter) and "Time of Day" (Day, Night).
2.  **Parfumo:** Cross-reference their "Occasion" and "Season" charts for nuance (Parfumo users are often more critical/niche-focused).
3.  **YouTube Consensus:** Briefly scan 2-3 top reviewers (e.g., Joy Amin, Gents Scents, The Perfume Guy) to identify consensus on "Performance" and "Clone Status."
4.  **Social Sentiment (Compliment Factor):** Search forums (Reddit r/fragrance, Basenotes) and reviews for keywords like "compliment magnet," "safe blind buy," vs. "polarizing," "challenging," or "artistic."

## Step 2: Data Normalization & Logic (The "Scratchpad")
*Before generating the final output, perform these calculations. You must strictly adhere to the "Granularity Rule".*

* **The Granularity Rule:** Do NOT round numbers to the nearest 5 or 10. Use precise integers (e.g., 18%, 52%, 73%).
* **Seasonality Normalization:** Take raw vote counts/estimates. Convert to precise percentages. Ensure S+S+F+W = **100%**.
* **Occasion Logic:** If specific "Office" or "Date" numbers are vague, derive them from the **Scent Profile**:
    * *Clean/Citrus/Soapy* = High Business/High Sport.
    * *Spicy/Sweet/Oud/Leather* = High Night Out/High Date.
* **The "Dumb Reach" Calculation:** Assess the standard deviation of usage across seasons/occasions.
* **The "Compliment Algorithm":** Assign a score (1-100) based on the Mass Appeal vs. Artistic Complexity spectrum.
* **The "Maintenance Pro" Audit:** Evaluate the scent against these specific constraints:
    * *Role:* School District Facilities/Maintenance (Mid-30s Male).
    * *Routine:* Applies fragrance at 6:00 AM (1 hour before shift). Midday light workout.
    * *Activity:* Light labor (mostly supervision/contractors) + Indoor/Outdoor transitions.
    * *Environment:* Public school setting (must be safe for faculty/students but professional for contractors).

## Step 3: Abstract Visual Synthesis (The Image Prompt)
*Design the image prompt for the final section.*
* **Goal:** Create an abstract image that conveys the *essence* of the fragrance.
* **Constraint:** You must **NOT** use any literal imagery of the notes (e.g., if it's a Rose/Oud scent, do not show flowers or wood).
* **Method:** Use the data from Section 1 (Texture Analysis) and Section 7 (Sensory Translation) to define the color palette, lighting, shapes, and movement of the abstract composition.

## Step 4: Final Report Generation
Generate the response using the following Markdown structure. Do not include your "Scratchpad" math in the final output, only the polished tables.

### 1. Executive Summary & Profile
* **Scent Profile:** (2 sentences on notes and olfactory family).
* **Texture Analysis:** (Describe the tactile feel of the scent. e.g., "Airy and transparent," "Creamy and dense," "Sharp and metallic," "Powdery velvet.")
* **Performance Data:** (Longevity in hours / Projection in feet/meters).
* **Versatility Score (The "Dumb Reach" Index):** [X]/100. (Explain in 1 short sentence why.)
* **Compliment Factor:** [X]/100.
    * *Justification:* (Explain the score based on research. Mass-appealing or polarizing? Cite specific accords.)
* **Clone/Inspiration Status:** Explicitly state if this is a clone. If yes, compare it to the original. Is it redundant to own both? (Yes/No/Nuanced).

### 2. Quantitative Seasonality (Table 1)
*Columns: Spring, Summer, Fall, Winter.*
*Constraint: Row must sum to exactly 100%. Do not use multiples of 5 or 10; be precise.*

| Spring | Summer | Fall | Winter |
| :---: | :---: | :---: | :---: |
| % | % | % | % |

### 3. Global Situational Suitability (Table 2)
*Columns: Daily, Business (Office), Leisure (Casual), Sport (Active), Evening (Date), Night Out (Club/Party).*
*Constraint: Row must sum to exactly 100%. Use granular numbers (e.g., 17%, not 15% or 20%).*

| Daily | Business | Leisure | Sport | Evening | Night Out |
| :---: | :---: | :---: | :---: | :---: | :---: |
| % | % | % | % | % | % |

**Formality Spectrum:**
[Ultra Casual] <---> [Casual] <---> [Smart Casual] <---> [Formal] <---> [Black Tie]
*(Place an 'X' on the scale or bold the correct fit. e.g., **Smart Casual**)*

### 4. Usage Spectrums (Table 3)
* **Day vs. Night:** [X]% Day / [Y]% Night (Must sum to 100. Be precise.)
* **Casual vs. Special Occasion:** [A]% Casual / [B]% Special (Must sum to 100. Be precise.)

### 5. The Seasonal Occasion Matrix (Table 4)
*This matrix answers the question: "If I am wearing this in [Season], what is the probability I am wearing it for [Occasion]?"*
*Constraint: Each **ROW** must sum to 100% horizontally. Use precise, calculated integers.*

| Season | Daily | Business | Leisure | Sport | Evening | Night Out |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Spring** | % | % | % | % | % | % |
| **Summer** | % | % | % | % | % | % |
| **Fall** | % | % | % | % | % | % |
| **Winter** | % | % | % | % | % | % |

### 6. Detailed Occasion Calendar (Traffic Light Analysis)
*A month-by-month breakdown for key social scenarios based on Kansas City climate data.*

* **Leisure (Weekend/Daytime):**
    * 🟢 **Green Months:** [List ideal months]
    * 🟡 **Yellow Months:** [List caution months]
    * 🔴 **Red Months:** [List avoid months]
* **Date Night (Intimate/Evening):**
    * 🟢 **Green Months:** [List ideal months]
    * 🟡 **Yellow Months:** [List caution months]
    * 🔴 **Red Months:** [List avoid months]
* **Night Out (Club/Party/Loud):**
    * 🟢 **Green Months:** [List ideal months]
    * 🟡 **Yellow Months:** [List caution months]
    * 🔴 **Red Months:** [List avoid months]

### 7. Practical Strategy & Application
* **The "Goldilocks" Scenarios (Top 3 Uses):**
    1.  **[Occasion 1]** in **[Season]**: *[Application Advice: Number of sprays and location].*
    2.  **[Occasion 2]** in **[Season]**: *[Application Advice].*
    3.  **[Occasion 3]** in **[Season]**: *[Application Advice].*
* **The "Desk-to-Disco" Protocol (Work -> Club):**
    * *Viability:* Can this transition from office to nightlife? (Yes/No).
    * *Strategy:* Explain exactly how to execute this.

### 8. Final Verdict & The Sensory Translation
*Paint the picture of this fragrance by translating it into other domains.*

* **The Beverage:** (e.g., "A neat scotch in a library," "Ice-cold lemonade with too much sugar," "Earl Grey tea with a shot of gin.")
* **The Meal:** (e.g., "A medium-rare steak with peppercorn sauce," "Cotton candy at a state fair," "A crisp arugula salad with lemon vinaigrette.")
* **The Vehicle:** (e.g., "A 1967 Mustang Fastback," "A reliable Toyota Camry," "A matte black Lamborghini," "A lifted heavy-duty pickup.")
* **The Audio Track:** (e.g., "Smooth Jazz at low volume," "Heavy Metal bass lines," "Lo-Fi Hip Hop beats," "Classical violins.")

* **The Ideal Avatar:** Describe the specific person this fits best.
* **Sartorial Pairing:** Recommend specific clothing materials or colors.
* **The 'Anti-Scenario':** Explicitly define the one situation where wearing this is a mistake.
* **Purchase Decision:** Blind Buy Safe? / Sample First? / Niche Collectors Only?

### 9. Target Persona Audit: The School Facilities Protocol
*Specific analysis for a Male, Mid-30s, School District Maintenance worker (in classrooms/interactions with staff/occasional meetings/Contractor Management/Light Repairs).*

* **Standard Job Fit Score (Mixed Indoor/Outdoor):** [X]/100
    * *Reasoning:* (Does it convey competence for dealing with contractors? Is it safe for changing temperatures?)
* **Indoor-Only Job Fit Score:** [X]/100
    * *Reasoning:* (Score strictly for days spent entirely inside climate-controlled schools/offices. Is it too loud for close quarters? Does HVAC dryness affect it?)
    * **Indoor Pass System:** [Start Month] -> [End Month] (List the qualified range. e.g., "October -> March" or "Year Round").
* **The "Clock-In" Analysis (Applied at 6:00 AM):** (You apply 1 hour before the shift. Analyze the scent's state at 7:00 AM start time. e.g., "Ideal—screechy top notes are gone, leaving a professional heart," or "Warning—still projecting too loud for a faculty meeting.")
* **The "Lunch Workout" Test:** (Will this scent survive a light workout/heat spike at noon? Will it turn sour?)
* **Midday Touch-Up Verdict:**
    * **Bring Bottle?** (Yes / No).
    * **Advice:** (Consider the 1-hour head start + workout. Will it be dead by 1 PM? Or is it a beast that needs no help?)
* **Work Seasonality Guide (Kansas City Area - Mixed Indoor/Outdoor Focus):**
    * *Strictly evaluate based on the wearer moving between Climate Controlled Indoor air and the following Outdoor conditions. Be Conservative: If a month is borderline uncomfortable outdoors, mark it Yellow.*
    > Jan (38°/20°, 64% Hum), Feb (44°/24°, 64% Hum), Mar (55°/34°, 66% Hum), Apr (66°/44°, 64% Hum), May (75°/54°, 65% Hum), Jun (84°/64°, 65% Hum), Jul (88°/68°, 63% Hum), Aug (87°/66°, 62% Hum), Sep (79°/58°, 62% Hum), Oct (67°/46°, 63% Hum), Nov (54°/34°, 67% Hum), Dec (42°/24°, 67% Hum).

    * **🟢 Green Months (Ideal):** [List months] | **Max Sprays:** [Insert precise number, e.g., 3-5 sprays].
    * **🟡 Yellow Months (Caution):** [List months] | **Max Sprays:** [Insert reduced number, e.g., 2 sprays].
    * **🔴 Red Months (Avoid):** [List months] | **Max Sprays:** [Insert strict limit, e.g., "0-1 sprays (Under shirt only)"].

### 10. The "I'm Going to Wear It Anyway" Protocol (Work Edition)
*For when this fragrance is technically "Not Safe for Work" (NSFW), but you insist on wearing it to the school anyway.*

* **The Risk Factor:** (Why is this risky? e.g., "Too seductive for a school environment," "Projecting too loud for a small office with contractors," "Boozy notes unprofessional.")
* **The Stealth Strategy:** (How to pull it off. e.g., "Spray under shirt," "Apply post-workout only," "Limit to X spray behind the neck.")

### 11. Abstract Visual Essence
[Generate an abstract image based on the synthesis of the fragrance's profile, texture, and sensory metaphors defined in the previous steps. **Do not show literal ingredients** like flowers, fruits, or woods. Focus entirely on abstract color palettes, lighting styles, textures, and shapes that convey the mood.]`;
    navigator.clipboard.writeText(textToCopy).then(() => {
      setGatherButtonText('✅ Copied!');
      setTimeout(() => {
        setGatherButtonText('Gather Frag Data');
      }, 2000);
    }).catch(() => {
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = textToCopy;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setGatherButtonText('✅ Copied!');
      setTimeout(() => {
        setGatherButtonText('Gather Frag Data');
      }, 2000);
    });
  };

  // Aggregate data from all filtered fragrances
  const aggregatedData = useMemo(() => {
    const seasons: Record<string, number> = {};
    const occasions: Record<string, number> = {};
    const types: Record<string, number> = {};
    
    fragrances.forEach(fragrance => {
      // Aggregate seasons
      Object.entries(fragrance.seasons).forEach(([key, value]) => {
        seasons[key] = (seasons[key] || 0) + value;
      });
      
      // Aggregate occasions
      Object.entries(fragrance.occasions).forEach(([key, value]) => {
        occasions[key] = (occasions[key] || 0) + value;
      });
      
      // Aggregate types
      Object.entries(fragrance.types).forEach(([key, value]) => {
        types[key] = (types[key] || 0) + value;
      });
    });
    
    // Calculate averages (percentages)
    const count = fragrances.length || 1;
    
    const seasonsData = Object.entries(seasons)
      .map(([key, value]) => ({
        name: key.charAt(0).toUpperCase() + key.slice(1),
        value: Math.round(value / count)
      }))
      .filter(item => item.value > 0)
      .sort((a, b) => b.value - a.value);
    
    const occasionsData = Object.entries(occasions)
      .map(([key, value]) => ({
        name: key.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
        value: Math.round(value / count)
      }))
      .filter(item => item.value > 0)
      .sort((a, b) => b.value - a.value);
    
    const typesData = Object.entries(types)
      .map(([key, value]) => ({
        name: key,
        value: Math.round(value / count)
      }))
      .filter(item => item.value > 0)
      .sort((a, b) => b.value - a.value);
    
    return { seasonsData, occasionsData, typesData };
  }, [fragrances]);

  const renderLegendList = (data: any[], category: keyof typeof CHART_COLORS) => {
    return (
      <div className={styles.legendList}>
        {data.map((entry, index) => (
          <div key={`legend-${index}`} className={styles.legendItem}>
            <span 
              className={styles.legendColor} 
              style={{ backgroundColor: getChartColor(category, entry.name) }}
            />
            <span className={styles.legendText}>{entry.name}</span>
            <span className={styles.legendValue}>{entry.value}%</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeButton} onClick={onClose}>×</button>
        
        <div className={styles.header}>
          <div className={styles.headerContent}>
            <div>
              <h2>Collection Analytics</h2>
              <p className={styles.subtitle}>
                Showing aggregated data from {fragrances.length} {fragrances.length === 1 ? 'fragrance' : 'fragrances'}
              </p>
            </div>
            <div>
              <button className={styles.scraperButton} onClick={handleCopyScraperCode}>
                📋 {copyButtonText}
              </button>
              <button className={styles.gatherButton} onClick={handleGatherFragData}>
                🧪 {gatherButtonText}
              </button>
            </div>
          </div>
        </div>

        <div className={styles.charts}>
          {/* Seasons Chart */}
          <div className={styles.chartSection}>
            <h4>Seasons</h4>
            {aggregatedData.seasonsData.length > 0 ? (
              <div className={styles.chartContainer}>
                <div className={styles.chartWrapper}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={aggregatedData.seasonsData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={false}
                        outerRadius={isMobile ? 50 : 70}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {aggregatedData.seasonsData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={getChartColor('seasons', entry.name)} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => `${value}%`} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                {renderLegendList(aggregatedData.seasonsData, 'seasons')}
              </div>
            ) : (
              <p className={styles.noData}>No season data available</p>
            )}
          </div>

          {/* Occasions Chart */}
          <div className={styles.chartSection}>
            <h4>Occasions</h4>
            {aggregatedData.occasionsData.length > 0 ? (
              <div className={styles.chartContainer}>
                <div className={styles.chartWrapper}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={aggregatedData.occasionsData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={false}
                        outerRadius={isMobile ? 50 : 70}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {aggregatedData.occasionsData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={getChartColor('occasions', entry.name)} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => `${value}%`} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                {renderLegendList(aggregatedData.occasionsData, 'occasions')}
              </div>
            ) : (
              <p className={styles.noData}>No occasion data available</p>
            )}
          </div>

          {/* Types Chart */}
          <div className={styles.chartSection}>
            <h4>Fragrance Types</h4>
            {aggregatedData.typesData.length > 0 ? (
              <div className={styles.chartContainer}>
                <div className={styles.chartWrapper}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={aggregatedData.typesData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={false}
                        outerRadius={isMobile ? 50 : 70}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {aggregatedData.typesData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={getChartColor('types', entry.name)} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => `${value}%`} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                {renderLegendList(aggregatedData.typesData, 'types')}
              </div>
            ) : (
              <p className={styles.noData}>No type data available</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
