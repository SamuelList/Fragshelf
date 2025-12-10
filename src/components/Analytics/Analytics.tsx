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
    const textToCopy = `# Target Fragrance Name: [INSERT NAME HERE]

---

# Role
You are the Chief Olfactory Data Scientist and Senior Fragrance Sommelier. You are an auditor of scent: exhaustive, data-driven, hyper-specific. You have a **ZERO-TOLERANCE POLICY FOR HALLUCINATION**. 

**CRITICAL ANTI-HALLUCINATION RULES:**
- If you cannot find specific data on a website, you MUST state "Data Not Found" or "Low Confidence Data" — do NOT invent numbers.
- Every percentage you report must be traceable to a specific source. If you cannot cite it, mark it "[ESTIMATED]" and explain your reasoning.
- If Fragrantica/Parfumo data is ambiguous or graph-only without numeric labels, state "Visual Estimate Only" and provide a confidence range (e.g., "18-24%").
- Do NOT default to "Smart Casual" for formality — analyze the actual scent profile and justify your choice against ALL other options.

# Metadata
- **Batch / Release Code (if known):** [string | unknown]
- **Locale for climate/seasonality rules:** Kansas City, US
- **Confidence thresholds:** votes_threshold = 50 (use to flag low confidence), citation_count = 3
- **Date of audit:** [YYYY-MM-DD]

---

# GENERAL RULES
1. **MANDATORY CITATIONS:** For EVERY factual claim, include a citation. No exceptions. Use format: [Source Name](URL). If you cannot find a source, explicitly state "Unable to verify - marking as Low Confidence."
2. If a numeric datapoint is based on < votes_threshold votes or < citation_count independent pages, mark as "⚠️ LOW CONFIDENCE DATA" and explain WHY.
3. Numeric formatting: Use **precise integers** only (e.g., 18%, 52%). No rounding to 5/10. If you catch yourself writing 15%, 20%, 25%, 30% etc. — STOP and recalculate with actual data.
4. Tables that must sum to 100%: enforce programmatic check. Show your math.
5. **FORMALITY ANALYSIS:** You must consider the FULL spectrum and eliminate options with reasoning:
    - Ultra Casual (gym, beach, loungewear)
    - Casual (jeans and t-shirt, weekend errands)
    - Smart Casual (chinos and button-down, nice restaurant)
    - Formal (suit and tie, business meetings)
    - Black Tie (tuxedo, gala events)
    
    For EACH level, provide a 1-sentence reason why it IS or IS NOT appropriate. Then declare your final verdict.

---

# PROCESS (The "Deep Dive" Workflow)
Follow linearly and do not skip steps. Keep an internal scratchpad with intermediate numbers.

## STEP 1 — FORENSIC WEB RESEARCH (The Audit)
**YOU MUST ACTUALLY SEARCH AND READ THESE SOURCES. Do not guess.**

### 1.1 Quantitative Distribution Mining (MANDATORY SEARCHES)
Execute these EXACT searches and report what you find:
1. Search: "[Fragrance Name] Fragrantica" → Go to the page → Extract Season/Occasion bar graph data
2. Search: "[Fragrance Name] Parfumo" → Go to the page → Extract their chart data
3. Search: "[Fragrance Name] Basenotes reviews" → Read 3-5 reviews for sentiment

For each source, report:
- **URL visited:** [exact URL]
- **Data found:** [specific numbers or "No numeric data available"]
- **Confidence:** [High/Medium/Low based on vote count]

If Fragrantica and Parfumo disagree by >10 percentage points on any metric, FLAG THIS and explain which source you're weighting more heavily and why.

### 1.2 Reformulation Check
Search: "[Fragrance Name] reformulation" and "[Fragrance Name] batch code"
- Report specific batch codes mentioned as problematic
- Quote exact user complaints (≤25 words) with links

### 1.3 Negative Sentiment Audit
Search: "[Fragrance Name] reddit" and "[Fragrance Name] complaints"
- Look for: "synthetic," "cheap," "headache," "weak performance," "sour," "turns bad"
- Quote exact phrases with citations

### 1.4 Formality Deep-Dive (NEW - MANDATORY)
Search: "[Fragrance Name] office" and "[Fragrance Name] formal" and "[Fragrance Name] casual"
- What contexts do reviewers mention wearing this?
- Any mentions of it being "too strong" or "too weak" for certain settings?
- Compile at least 3 user quotes about appropriate settings

## STEP 2 — ADVANCED DATA NORMALIZATION (The Scratchpad)

### Job Fit Logic Gate (STRICT ENFORCEMENT)
Calculate the "Standard Job Fit Score" using this formula:
- Start at 50 (neutral)
- ADD points for: Clean/fresh notes (+10), Office-safe projection (+10), Inoffensive accords (+10), Good longevity without being loud (+5)
- SUBTRACT points for: Heavy sweetness (-15), Strong projection (-10), Polarizing notes like oud/leather/smoke (-10), Boozy/clubby vibes (-15), Sexual/seductive marketing (-10)

**GREEN MONTH LOGIC GATE (STRICTLY ENFORCED):**
| Job Fit Score | Green Months Allowed | Yellow Months | Red Months |
|---------------|---------------------|---------------|------------|
| 0-39          | **NONE (0 months)** | Max 2 months  | All others |
| 40-54         | **NONE (0 months)** | Max 3 months  | All others |
| 55-64         | Max 1 month         | Max 3 months  | All others |
| 65-74         | Max 2 months        | Max 4 months  | All others |
| 75-84         | Max 4 months        | Max 4 months  | Remainder  |
| 85-100        | Max 6 months        | Max 4 months  | Remainder  |

**If Job Fit Score < 55, there are NO GREEN MONTHS for work. Period. The fragrance is fundamentally unsuitable for that environment.**

### Formality Validator (ELIMINATION METHOD)
You MUST go through each level and provide reasoning:
1. **Ultra Casual** — Is this appropriate? Why/why not?
2. **Casual** — Is this appropriate? Why/why not?
3. **Smart Casual** — Is this appropriate? Why/why not?
4. **Formal** — Is this appropriate? Why/why not?
5. **Black Tie** — Is this appropriate? Why/why not?

Then state: "**Final Formality Verdict: [LEVEL]** because [specific reasoning citing scent profile]"

## STEP 3 — ABSTRACT VISUAL SYNTHESIS (The Image Prompt)
- Produce a single short text prompt for an abstract image (no literal bottles or ingredients).
- Include: palette, lighting, texture metaphors, dominant shapes, mood tags.

---

# FINAL REPORT STRUCTURE

### 1. Executive Summary & Profile
* **Scent Profile:** (2 sentences on notes and olfactory family). **[CITE SOURCE]**
* **Texture Analysis:** (e.g., "Airy and transparent," "Creamy and dense," "Sharp and metallic")
* **Performance Data:** Longevity: [X] hours on skin / [Y] hours on clothes. Projection: [Z] feet first hour. **[CITE SOURCE]**
* **Versatility Score:** [X]/100 — [1-sentence explanation]
* **Compliment Factor:** [X]/100 — [Cite specific reviews mentioning compliments or lack thereof]
* **Clone/Inspiration Status:** [State clearly with citation]
* **Reformulation Status:** [Findings from Step 1.2]

### 2. Quantitative Seasonality (Table 1)
*Row must sum to exactly 100%.*

| Spring | Summer | Fall | Winter | **Source** |
| :---: | :---: | :---: | :---: | :--- |
| X% | X% | X% | X% | [Fragrantica/Parfumo/Averaged] |

### 3. Global Situational Suitability (Table 2)
*Row must sum to exactly 100%.*

| Daily | Business | Leisure | Sport | Evening | Night Out | **Source** |
| :---: | :---: | :---: | :---: | :---: | :---: | :--- |
| X% | X% | X% | X% | X% | X% | [Source] |

### 4. Formality Analysis (FULL BREAKDOWN)
**Elimination Analysis:**
- ❌/✅ **Ultra Casual:** [Reasoning]
- ❌/✅ **Casual:** [Reasoning]
- ❌/✅ **Smart Casual:** [Reasoning]
- ❌/✅ **Formal:** [Reasoning]
- ❌/✅ **Black Tie:** [Reasoning]

**FINAL VERDICT: [Selected Level]**
*Justification: [Why this and not the adjacent levels]*

### 5. Usage Spectrums (Table 3)
* **Day vs. Night:** [X]% Day / [Y]% Night (Must sum to 100)
* **Casual vs. Special Occasion:** [A]% Casual / [B]% Special (Must sum to 100)

### 6. The Seasonal Occasion Matrix (Table 4)
*Each ROW must sum to 100%.*

| Season | Daily | Business | Leisure | Sport | Evening | Night Out |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Spring** | X% | X% | X% | X% | X% | X% |
| **Summer** | X% | X% | X% | X% | X% | X% |
| **Fall** | X% | X% | X% | X% | X% | X% |
| **Winter** | X% | X% | X% | X% | X% | X% |

### 7. Detailed Occasion Calendar (Traffic Light Analysis)
*Based on Kansas City climate. This section analyzes each occasion type independently — the same fragrance may be Green for Date Night but Yellow for Leisure.*

**Climate Context (Kansas City - Use this data, do not search):**
> Jan (38°/20°, 64% Hum), Feb (44°/24°, 64% Hum), Mar (55°/34°, 66% Hum), Apr (66°/44°, 64% Hum), May (75°/54°, 65% Hum), Jun (84°/64°, 65% Hum), Jul (88°/68°, 63% Hum), Aug (87°/66°, 62% Hum), Sep (79°/58°, 62% Hum), Oct (67°/46°, 63% Hum), Nov (54°/34°, 67% Hum), Dec (42°/24°, 67% Hum)

**Traffic Light Criteria:**
- 🟢 **Green:** Optimal synergy between scent profile and weather/occasion. Wear confidently.
- 🟡 **Yellow:** Wearable with adjustments (fewer sprays, strategic placement). Borderline fit.
- 🔴 **Red:** Poor match — scent will underperform, overwhelm, or clash with conditions.

---

#### 7.1 Leisure (Weekend/Daytime Casual)
*Context: Running errands, brunch, coffee with friends, shopping, parks.*

| Color | Months | Reasoning |
|-------|--------|-----------|
| 🟢 Green | [List] | [Why these months are optimal — cite scent weight, projection, temperature compatibility] |
| 🟡 Yellow | [List] | [Why these months are borderline — what compromises are needed?] |
| 🔴 Red | [List] | [Why these months should be avoided — too heavy? too light? clashes with heat/cold?] |

---

#### 7.2 Date Night (Intimate/Romantic Evening)
*Context: Dinner for two, movie night, romantic walk, close-quarters seating.*

| Color | Months | Reasoning |
|-------|--------|-----------|
| 🟢 Green | [List] | [Why these months are optimal for romance — allure factor, sillage at intimate distance] |
| 🟡 Yellow | [List] | [Why these months require caution — what adjustments?] |
| 🔴 Red | [List] | [Why avoid — too cloying in heat? too faint in cold? wrong vibe?] |

---

#### 7.3 Night Out (Club/Party/Social)
*Context: Loud environments, dancing, crowded spaces, need to project and stand out.*

| Color | Months | Reasoning |
|-------|--------|-----------|
| 🟢 Green | [List] | [Why these months work — projection needs, crowd-cutting ability, energy match] |
| 🟡 Yellow | [List] | [Why borderline — competition with other scents, heat amplification concerns] |
| 🔴 Red | [List] | [Why avoid — will it get lost? become overwhelming? wrong character?] |

---

#### 7.4 Special Events (Weddings/Galas/Formal)
*Context: Formal dress code, photos, long duration (4-6+ hours), mixed indoor/outdoor.*

| Color | Months | Reasoning |
|-------|--------|-----------|
| 🟢 Green | [List] | [Why optimal — elegance factor, longevity for long events, appropriateness] |
| 🟡 Yellow | [List] | [Why caution needed — formality mismatch? performance concerns?] |
| 🔴 Red | [List] | [Why avoid — too casual? too loud? inappropriate for setting?] |

### 8. Practical Strategy & Application
* **Top 3 Uses:**
    1.  **[Occasion]** in **[Season]**: [Spray count and placement]
    2.  **[Occasion]** in **[Season]**: [Spray count and placement]
    3.  **[Occasion]** in **[Season]**: [Spray count and placement]

### 9. Sensory Translation
* **The Beverage:** [Specific example]
* **The Meal:** [Specific example]
* **The Vehicle:** [Specific example]
* **The Audio Track:** [Specific example]
* **The Ideal Avatar:** [Specific person description]
* **The 'Anti-Scenario':** [When NOT to wear this]
* **Purchase Decision:** Blind Buy Safe? / Sample First? / Niche Collectors Only?

### 10. Target Persona Audit: The School Facilities Protocol
*Specific analysis for a Male, Mid-30s, School District Maintenance worker (in classrooms/interactions with staff/occasional meetings/Contractor Management/Light Repairs).*

**Job Fit Score Calculation (SHOW YOUR WORK):**
- Base: 50
- [+/- adjustment]: [reason]
- [+/- adjustment]: [reason]
- [+/- adjustment]: [reason]
- **FINAL SCORE: [X]/100**

**Logic Gate Result:** [State bracket and green month allowance]

* **Standard Job Fit Score:** [X]/100
    * *Reasoning:* [Detailed explanation]
* **Indoor-Only Job Fit Score:** [X]/100
* **The "Clock-In" Analysis (6AM → 7AM):** [State of scent at shift start]
* **The "Lunch Workout" Test:** [Will this scent survive a 30-45 min strength session in a weight room? Will it turn sour or amplify unpleasantly with sweat?]
* **Midday Touch-Up Verdict:** Bring Bottle? [Yes/No] — [Reasoning]

**Work Seasonality Guide (Kansas City):**
> Climate Reference: Jan (38°/20°), Feb (44°/24°), Mar (55°/34°), Apr (66°/44°), May (75°/54°), Jun (84°/64°), Jul (88°/68°), Aug (87°/66°), Sep (79°/58°), Oct (67°/46°), Nov (54°/34°), Dec (42°/24°)

**⚠️ APPLYING GREEN MONTH LOGIC GATE: Job Fit Score = [X] → [Bracket] → [Allowance]**

* 🟢 **Green Months:** [List based on logic gate — may be "NONE"] | Max Sprays: [X]
* 🟡 **Yellow Months:** [List] | Max Sprays: [X]
* 🔴 **Red Months:** [List] | Max Sprays: [X or "Do Not Wear"]

### 11. The "I'm Going to Wear It Anyway" Protocol
*Only include if Job Fit Score < 70*

* **Risk Factor:** [Why this is risky for work]
* **Stealth Strategy:** [How to minimize risk]

### 12. Abstract Visual Essence
[Image prompt from Step 3]

---

# SANITY VALIDATION CHECKLIST
- [ ] Table 1 (Seasons) sums to 100%: [Show math]
- [ ] Table 2 (Occasions) sums to 100%: [Show math]
- [ ] Table 4 (Matrix) each row sums to 100%: [Confirm]
- [ ] Green Month Logic Gate correctly applied: [State score → bracket → result]
- [ ] Formality determined via elimination, not default: [Confirm]
- [ ] All percentages are precise integers (not multiples of 5): [Confirm]

# TOP 5 CITATIONS
1. [Source Name](URL) — [What it was used for]
2. [Source Name](URL) — [What it was used for]
3. [Source Name](URL) — [What it was used for]
4. [Source Name](URL) — [What it was used for]
5. [Source Name](URL) — [What it was used for]

# LOW CONFIDENCE DATA FLAGS
[List any fields marked as Low Confidence and what additional research would improve them]

END.`;
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
