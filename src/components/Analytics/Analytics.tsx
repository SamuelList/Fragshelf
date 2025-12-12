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
- **Confidence thresholds:** votes_threshold = 50 (use to flag low confidence), citation_count = 3, minimum_reviews = 15
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
6. **REVIEW-DRIVEN SCORING:** All scoring must be influenced by synthesized review data. You must gather a MINIMUM of 15 unique reviews across all sources before calculating any scores.

---

# PROCESS (The "Deep Dive" Workflow)
Follow linearly and do not skip steps. Keep an internal scratchpad with intermediate numbers.

## STEP 1 — FORENSIC WEB RESEARCH (The Audit)
**YOU MUST ACTUALLY SEARCH AND READ THESE SOURCES. Do not guess.**

### 1.1 Quantitative Distribution Mining (MANDATORY SEARCHES)
Execute these EXACT searches and report what you find:
1. Search: "[Fragrance Name] Fragrantica" → Go to the page → Extract Season/Occasion bar graph data
2. Search: "[Fragrance Name] Parfumo" → Go to the page → Extract their chart data
3. Search: "[Fragrance Name] Basenotes reviews" → Read 5-8 reviews for sentiment

For each source, report:
- **URL visited:** [exact URL]
- **Data found:** [specific numbers or "No numeric data available"]
- **Confidence:** [High/Medium/Low based on vote count]

If Fragrantica and Parfumo disagree by >10 percentage points on any metric, FLAG THIS and explain which source you're weighting more heavily and why.

### 1.2 Extended Review Mining (MANDATORY - Minimum 15 Reviews Total)
**You MUST gather reviews from ALL of these sources:**

**A. Forum Reviews (5-8 reviews minimum):**
- Search: "[Fragrance Name] Basenotes review"
- Search: "[Fragrance Name] Fragrantica review" (user comments section)
- Search: "[Fragrance Name] Reddit fragrance"
- Search: "[Fragrance Name] r/fragrancejerks" OR "[Fragrance Name] r/Colognes"

**B. Video Review Synthesis (3-5 reviews minimum):**
- Search: "[Fragrance Name] review YouTube"
- Watch/skim 3-5 video reviews and extract:
  - Reviewer's verdict (positive/neutral/negative)
  - Key descriptors used
  - Mentioned occasions/seasons
  - Performance claims (longevity, projection, sillage)
  - Any warnings or caveats mentioned

**C. Social Media Sentiment (3-5 mentions minimum):**
- Search: "[Fragrance Name] TikTok fragrance"
- Search: "[Fragrance Name] Twitter/X fragrance"
- Search: "[Fragrance Name] Instagram review"
- Extract: Quick takes, trending opinions, viral moments, controversy

**D. Professional/Niche Reviews (2-3 reviews):**
- Search: "[Fragrance Name] Cafleurebon"
- Search: "[Fragrance Name] Persolaise"
- Search: "[Fragrance Name] The Fragrance Apprentice"
- Search: "[Fragrance Name] Brooklyn Fragrance Lover"

### 1.3 Review Synthesis Matrix (MANDATORY)
After gathering all reviews, complete this matrix:

| Source | Reviewer | Sentiment (1-10) | Key Descriptors | Best Season | Best Occasion | Performance Rating | Notable Quote |
|--------|----------|------------------|-----------------|-------------|---------------|-------------------|---------------|
| [Source] | [Name/Username] | [1-10] | [3-5 words] | [Season] | [Occasion] | [Weak/Moderate/Strong/Beast] | "[≤20 words]" |
| ... | ... | ... | ... | ... | ... | ... | ... |

**Minimum 15 rows required. If you cannot find 15 reviews, mark as "⚠️ INSUFFICIENT DATA" and explain.**

### 1.4 Sentiment Aggregation (Calculate from Review Matrix)
From your Review Synthesis Matrix, calculate:

| Metric | Count | Percentage | Confidence |
|--------|-------|------------|------------|
| **Positive Reviews (7-10)** | [X]/[Total] | [X]% | [High/Med/Low] |
| **Neutral Reviews (4-6)** | [X]/[Total] | [X]% | [High/Med/Low] |
| **Negative Reviews (1-3)** | [X]/[Total] | [X]% | [High/Med/Low] |
| **Avg Sentiment Score** | — | [X.X]/10 | [High/Med/Low] |

**Season Consensus (from reviews):**
| Season | Times Mentioned as "Best" | Times Mentioned as "Avoid" | Net Score |
|--------|---------------------------|---------------------------|-----------|
| Spring | [X] | [X] | [+/-X] |
| Summer | [X] | [X] | [+/-X] |
| Fall | [X] | [X] | [+/-X] |
| Winter | [X] | [X] | [+/-X] |

**Occasion Consensus (from reviews):**
| Occasion | Times Mentioned | Positive Context | Negative Context |
|----------|-----------------|------------------|------------------|
| Daily/Casual | [X] | [X] | [X] |
| Office/Work | [X] | [X] | [X] |
| Date Night | [X] | [X] | [X] |
| Night Out/Club | [X] | [X] | [X] |
| Formal Event | [X] | [X] | [X] |
| Sport/Gym | [X] | [X] | [X] |

### 1.5 Reformulation Check
Search: "[Fragrance Name] reformulation" and "[Fragrance Name] batch code"
- Report specific batch codes mentioned as problematic
- Quote exact user complaints (≤25 words) with links

### 1.6 Negative Sentiment Deep Dive
Search: "[Fragrance Name] reddit" and "[Fragrance Name] complaints" and "[Fragrance Name] overrated"
- Look for: "synthetic," "cheap," "headache," "weak performance," "sour," "turns bad," "overpriced," "overhyped"
- Quote exact phrases with citations
- Count frequency of each complaint type

**Complaint Frequency Table:**
| Complaint Type | Mentions | Example Quote | Source |
|----------------|----------|---------------|--------|
| Synthetic/Cheap | [X] | "[quote]" | [URL] |
| Weak Performance | [X] | "[quote]" | [URL] |
| Headache/Nausea | [X] | "[quote]" | [URL] |
| Turns Bad/Sour | [X] | "[quote]" | [URL] |
| Overpriced | [X] | "[quote]" | [URL] |
| Overhyped | [X] | "[quote]" | [URL] |
| Other: [Specify] | [X] | "[quote]" | [URL] |

### 1.7 Formality Deep-Dive (MANDATORY)
Search: "[Fragrance Name] office" and "[Fragrance Name] formal" and "[Fragrance Name] casual"
- What contexts do reviewers mention wearing this?
- Any mentions of it being "too strong" or "too weak" for certain settings?
- Compile at least 5 user quotes about appropriate settings (increased from 3)

## STEP 2 — REVIEW-DRIVEN SCORE SYNTHESIS (The Brain)
**All scores in this section MUST incorporate data from the Review Synthesis Matrix (Step 1.3-1.4)**

### 2.1 Review Influence Modifiers
Calculate these modifiers BEFORE applying to scoring systems:

**A. Sentiment Modifier (SM):**
\`\`\`
SM = (Avg Sentiment Score - 5) × 3
Range: -15 to +15
Example: Avg 7.2 → (7.2 - 5) × 3 = +6.6 → Round to +7
\`\`\`

**B. Controversy Modifier (CM):**
\`\`\`
IF (Negative Reviews > 30%) → CM = -10
ELSE IF (Negative Reviews > 20%) → CM = -5
ELSE IF (Positive Reviews > 80%) → CM = +5
ELSE → CM = 0
\`\`\`

**C. Performance Consensus Modifier (PCM):**
\`\`\`
Count "Beast Mode" ratings from Review Matrix → Beast Count
Count "Weak" ratings from Review Matrix → Weak Count
PCM = (Beast Count - Weak Count) × 2
Range: -10 to +10
\`\`\`

**D. Complaint Penalty (CP):**
\`\`\`
IF Headache/Nausea mentions > 3 → CP = -15 (Health Risk)
IF Synthetic/Cheap mentions > 5 → CP = -10
IF any complaint type > 7 mentions → CP = -5 per type (max -15)
\`\`\`

**MODIFIER SUMMARY TABLE:**
| Modifier | Value | Reasoning |
|----------|-------|-----------|
| Sentiment Modifier (SM) | [+/-X] | [Based on avg score X.X] |
| Controversy Modifier (CM) | [+/-X] | [Based on X% negative reviews] |
| Performance Consensus (PCM) | [+/-X] | [X beast vs Y weak ratings] |
| Complaint Penalty (CP) | [-X] | [X mentions of Y complaint] |
| **TOTAL REVIEW MODIFIER** | **[+/-X]** | **Applied to all scoring** |

### 2.2 Versatility Score (Review-Influenced)
\`\`\`
Base Versatility = (Season Spread × 10) + (Occasion Spread × 10)
Where:
- Season Spread = # of seasons with >20% in Review Consensus
- Occasion Spread = # of occasions mentioned positively by >3 reviewers

Review-Adjusted Versatility = Base Versatility + SM + (CM / 2)
Final Versatility = CLAMP(Review-Adjusted, 0, 100)
\`\`\`

**Show your math:**
- Season Spread: [X] seasons → [X × 10] = [Y]
- Occasion Spread: [X] occasions → [X × 10] = [Y]
- Base: [Y]
- + SM ([X]): [Y]
- + CM/2 ([X]): [Y]
- **Final Versatility Score: [X]/100**

### 2.3 Compliment Factor (Review-Driven)
\`\`\`
Search reviews for: "compliment," "noticed," "asked what I was wearing," "got stopped"
Compliment Mentions = [count]

Base Compliment Score = Compliment Mentions × 5 (max 50)
Sillage Bonus = IF >50% of reviewers say "projects well" → +20
Uniqueness Bonus = IF >30% mention "unique" or "stand out" → +15
Mass Appeal Penalty = IF >50% say "generic" or "common" → -15

Review-Adjusted Compliment = Base + Sillage + Uniqueness + Mass Appeal + SM
Final Compliment Factor = CLAMP(Review-Adjusted, 0, 100)
\`\`\`

**Show your math:**
- Compliment Mentions: [X] → [X × 5] = [Y]
- Sillage Bonus: [+X or N/A]
- Uniqueness Bonus: [+X or N/A]
- Mass Appeal Penalty: [-X or N/A]
- + SM ([X]): [Y]
- **Final Compliment Factor: [X]/100**

## STEP 3 — ADVANCED DATA NORMALIZATION (The Scratchpad)

### Job Fit Logic Gate (STRICT ENFORCEMENT - NOW REVIEW-INFLUENCED)
Calculate the "Standard Job Fit Score" using the **School Facilities Protocol** (Base 60):
* **Base Score:** 60
* **ADD:** Soap/Fresh/Barbershop (+5 to +15), Skin Scent/Low Projection (+10), Mass Appeal (+5)
* **SUBTRACT:** Clashing Notes/Animalics (-5 to -15), Physical Labor Heat Risk (Sweet/Cloying if sweating) (-10 to -20), Club/Nightlife Vibe (-15)
* **NEW - REVIEW MODIFIERS:** Apply TOTAL REVIEW MODIFIER from Step 2.1

**Job Fit Calculation (SHOW YOUR MATH):**
\`\`\`
Base Score: 60
+ Soap/Fresh Bonus: [+X]
+ Skin Scent Bonus: [+X]
+ Mass Appeal Bonus: [+X]
- Clashing Notes: [-X]
- Physical Labor Risk: [-X]
- Club Penalty: [-X]
+ REVIEW MODIFIER: [+/-X] (from Step 2.1)
= FINAL JOB FIT SCORE: [X]/100
\`\`\`

**GREEN CIRCLE ALLOWANCE (STRICTLY ENFORCED):**
| Job Fit Score | Max Green Months | Max Yellow Months | Red Months |
| :--- | :--- | :--- | :--- |
| **0-54** | **NONE (0 months)** | Max 3 months | All others |
| **55-69** | **1-3 Months** | Max 4 months | All others |
| **70-79** | **4-6 Months** | Max 4 months | All others |
| **80-89** | **6-9 Months** | Max 4 months | Remainder |
| **90-100** | **10-12 Months** | Remainder | Rare/None |

**CRITICAL RULE:** If Job Fit Score < 55, there are **NO GREEN MONTHS** for work. Period. The fragrance is fundamentally unsuitable for a maintenance environment.

### Formality Validator (Traffic Light Analysis - Review-Informed)
Assess each level using: 🟢 (Ideal), 🟡 (Passable/Risky), 🔴 (Clash/Avoid).
**Incorporate reviewer quotes from Step 1.7 to justify each rating.**

1.  **Ultra Casual** (Gym, Beach, Loungewear): [Emoji] — [Reasoning + reviewer quote if available]
2.  **Casual** (Jeans/T-shirt, Weekend Errands): [Emoji] — [Reasoning + reviewer quote if available]
3.  **Smart Casual** (Date Night, Office, Chinos): [Emoji] — [Reasoning + reviewer quote if available]
4.  **Formal** (Suit & Tie, Boardroom): [Emoji] — [Reasoning + reviewer quote if available]
5.  **Black Tie** (Tuxedo, Gala): [Emoji] — [Reasoning + reviewer quote if available]

**⛔ CONSTRAINT:** You are **FORBIDDEN** from choosing "Smart Casual" as the Final Verdict. It is a lazy answer. You must commit: does the scent profile lean decisively **Casual** or decisively **Formal**?

**Final Formality Verdict:** [MUST BE "Casual", "Formal", etc. - NOT "Smart Casual"] because [Specific reasoning backed by X/15 reviewers mentioning this context]

## STEP 4 — ABSTRACT VISUAL SYNTHESIS (The Image Prompt)
- Produce a single short text prompt for an abstract image (no literal bottles or ingredients).
- Include: palette, lighting, texture metaphors, dominant shapes, mood tags.

---

# FINAL REPORT STRUCTURE

### 1. Executive Summary & Profile
* **Scent Profile:** (2 sentences on notes and olfactory family). **[CITE SOURCE]**
* **Texture Analysis:** (e.g., "Airy and transparent," "Creamy and dense," "Sharp and metallic")
* **Performance Data:** Longevity: [X] hours on skin / [Y] hours on clothes. Projection: [Z] feet first hour. **[CITE SOURCE + corroborate with X/15 reviews]**
* **Versatility Score:** [X]/100 — [Calculated in Step 2.2 with review data]
* **Compliment Factor:** [X]/100 — [Calculated in Step 2.3 with review data]
* **Review Consensus:** [X.X]/10 from [Y] reviews — [1-sentence summary of overall sentiment]
* **Clone/Inspiration Status:** [State clearly with citation]
* **Reformulation Status:** [Findings from Step 1.5]

### 2. Review Synthesis Summary (NEW - FROM STEP 1.3-1.4)
*This section provides transparency on the review data that influenced all scoring.*

**Review Sources Used:**
| Source Type | Count | Avg Sentiment | Key Themes |
|-------------|-------|---------------|------------|
| Forum Reviews | [X] | [X.X]/10 | [2-3 themes] |
| Video Reviews | [X] | [X.X]/10 | [2-3 themes] |
| Social Media | [X] | [X.X]/10 | [2-3 themes] |
| Professional | [X] | [X.X]/10 | [2-3 themes] |
| **TOTAL** | **[X]** | **[X.X]/10** | — |

**Top 3 Positive Themes (from reviews):**
1. [Theme] — mentioned by [X] reviewers — "[Quote]"
2. [Theme] — mentioned by [X] reviewers — "[Quote]"
3. [Theme] — mentioned by [X] reviewers — "[Quote]"

**Top 3 Negative Themes (from reviews):**
1. [Theme] — mentioned by [X] reviewers — "[Quote]"
2. [Theme] — mentioned by [X] reviewers — "[Quote]"
3. [Theme] — mentioned by [X] reviewers — "[Quote]"

**Score Modifiers Applied (from Step 2.1):**
- Sentiment Modifier: [+/-X]
- Controversy Modifier: [+/-X]
- Performance Consensus: [+/-X]
- Complaint Penalty: [-X]
- **Total Impact on Scores: [+/-X]**

### 3. Quantitative Seasonality (Table 1)
*Row must sum to exactly 100%.*

| Spring | Summer | Fall | Winter | **Source** |
| :---: | :---: | :---: | :---: | :--- |
| X% | X% | X% | X% | [Fragrantica/Parfumo/Averaged] |

### 4. Global Situational Suitability (Table 2)
*Row must sum to exactly 100%.*

| Daily | Business | Leisure | Sport | Evening | Night Out | **Source** |
| :---: | :---: | :---: | :---: | :---: | :---: | :--- |
| X% | X% | X% | X% | X% | X% | [Source] |

### 5. Formality Analysis (FULL BREAKDOWN - Review-Backed)
**Spectrum Analysis:**
- [🟢/🟡/🔴] **Ultra Casual** (Gym, Beach, Lounge): [Reasoning]
- [🟢/🟡/🔴] **Casual** (Jeans/T-shirt, Errands): [Reasoning]
- [🟢/🟡/🔴] **Smart Casual** (Office, Date Night): [Reasoning]
- [🟢/🟡/🔴] **Formal** (Suit & Tie, Business): [Reasoning]
- [🟢/🟡/🔴] **Black Tie** (Tuxedo, Gala): [Reasoning]

**FINAL VERDICT: [Selected Level]** *(Constraint: Do NOT select "Smart Casual" — you must decide if it leans Casual or Formal)*
*Justification: [Why this fits the specific selected level better than the others]*

**FINAL VERDICT: [Selected Level]**
*Justification: [Why this and not the adjacent levels]*

### 6. Usage Spectrums (Table 3)
* **Day vs. Night:** [X]% Day / [Y]% Night (Must sum to 100)
* **Casual vs. Special Occasion:** [A]% Casual / [B]% Special (Must sum to 100)

### 7. The Seasonal Occasion Matrix (Table 4)
*Each ROW must sum to 100%.*

| Season | Daily | Business | Leisure | Sport | Evening | Night Out |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Spring** | X% | X% | X% | X% | X% | X% |
| **Summer** | X% | X% | X% | X% | X% | X% |
| **Fall** | X% | X% | X% | X% | X% | X% |
| **Winter** | X% | X% | X% | X% | X% | X% |

### 8. Detailed Occasion Calendar (Traffic Light Analysis - Review-Informed)
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

### 9. Practical Strategy & Application
* **Top 3 Uses:**
    1.  **[Occasion]** in **[Season]**: [Spray count and placement]
    2.  **[Occasion]** in **[Season]**: [Spray count and placement]
    3.  **[Occasion]** in **[Season]**: [Spray count and placement]

### 10. Sensory Translation
* **The Beverage:** [Specific example]
* **The Meal:** [Specific example]
* **The Vehicle:** [Specific example]
* **The Audio Track:** [Specific example]
* **The Ideal Avatar:** [Specific person description]
* **The 'Anti-Scenario':** [When NOT to wear this]
* **Purchase Decision:** Blind Buy Safe? / Sample First? / Niche Collectors Only?

### 11. Target Persona Audit: The School Facilities Protocol (Review-Adjusted)
*Specific analysis for a Male, Mid-30s, School District Maintenance worker (Active role: classrooms/hallways/contractor meetings/light repairs).*

**A. Job Fit Score Calculation (SHOW YOUR MATH):**
*The goal is to determine if the scent is safe for a semi-public, active work environment.*
* **Base Score:** 60

* **The "Soap & Water" Bonus:** (+0 to +20) [Is it clean/fresh/barbershop?]
* **The "Skin Scent" Bonus:** (+0 to +10) [Does it sit close to skin/low projection?]
* **The "Mass Appeal" Bonus:** (+0 to +10) [Is it generally liked by non-enthusiasts?]
* **The "Clashing Note" Penalty:** (-0 to -15) [Heavy Oud, Animalics, Cumin, heavy Booze?]
* **The "Physical Labor/Heat" Penalty:** (-0 to -10) [Will this scent become cloying/choking if the wearer's body temperature rises due to manual labor?]
* **The "Club" Penalty:** (-0 to -15) [Is it clearly designed for night/partying?]


**FINAL JOB FIT SCORE: [X]/100**

**B. Green Month Logic Gate (The Allowance System):**
*Apply the Final Score to this matrix to determine the MAXIMUM number of Green circles allowed.*

| Job Fit Score | Green Circle Allowance | Selection Criteria for Green Months |
| :--- | :--- | :--- |
| **90 - 100** | **10-12 Months** | Almost year-round, excluding only extreme weather mismatches. |
| **80 - 89** | **6-9 Months** | The fragrance's optimal seasons + shoulder seasons. |
| **70 - 79** | **4-6 Months** | STRICTLY the fragrance's peak season (e.g., only Winter, or only Summer). |
| **55 - 69** | **1-3 Months** | Only the absolute perfect weather match. (e.g., "Only Jan/Feb"). |
| **< 55** | **0 Months** | **UNSAFE FOR WORK.** All months must be Red or Yellow. |

**C. The Work Calendar (Kansas City Context):**
*Assign a status to each month based on the Logic Gate allowance and KC Climate.*
> **Climate Data:** Jan(38°), Feb(44°), Mar(55°), Apr(66°), May(75°), Jun(84°), Jul(88°), Aug(87°), Sep(79°), Oct(67°), Nov(54°), Dec(42°)

**Status Key:**
🟢 = **Safe:** Fits logic allowance + optimal weather + safe for physical labor.
🟡 = **Caution:** Borderline weather OR requires reduced sprays (1-2 max).
🔴 = **Stop:** Wrong season OR Job Fit Score too low (risk of cloying/offending).

| Jan | Feb | Mar | Apr | May | Jun | Jul | Aug | Sep | Oct | Nov | Dec |
|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| [🟢/🟡/🔴] | [🟢/🟡/🔴] | [🟢/🟡/🔴] | [🟢/🟡/🔴] | [🟢/🟡/🔴] | [🟢/🟡/🔴] | [🟢/🟡/🔴] | [🟢/🟡/🔴] | [🟢/🟡/🔴] | [🟢/🟡/🔴] | [🟢/🟡/🔴] | [🟢/🟡/🔴] |

**D. 11-Hour Shift Logistics (6:00 AM - 5:00 PM)**
* **Longevity Audit:** Can this specific fragrance survive 11 hours on skin? [Yes/No]
* **Projected "Skin Death" Time:** [Time of day the scent becomes undetectable if applied at 6 AM]
* **The "Lunch Workout" Variable:**
    * *Heat Check:* Will the 6 AM application reactivate/project loudly during the workout? [Yes/No/Risk]
    * *Scent Stability:* Will the dry-down turn sour when mixed with workout sweat? [Yes/No]
* **Reapplication Verdict:**
    * **Strategy:** [Select: **"One & Done"** (Lasts all day) / **"The Post-Gym Reset"** (Reapply after gym) / **"Fade Out"** (Let it die)]
    * **The Protocol:** [e.g., "Do NOT spray before gym. Apply 1 spray to chest at 1:00 PM strictly AFTER cooling down."]
### 12. The "I'm Going to Wear It Anyway" Protocol
*Only include if Job Fit Score < 70*

* **Risk Factor:** [Why this is risky for work]
* **Stealth Strategy:** [How to minimize risk]

### 13. Abstract Visual Essence
[Image prompt from Step 3]

---

# SANITY VALIDATION CHECKLIST
- [ ] **Minimum 15 reviews gathered:** [Show count from each source]
- [ ] **Review Synthesis Matrix complete:** [Confirm 15+ rows]
- [ ] **Score Modifiers calculated:** [SM: X, CM: X, PCM: X, CP: X]
- [ ] Table 1 (Seasons) sums to 100%: [Show math]
- [ ] Table 2 (Occasions) sums to 100%: [Show math]
- [ ] Table 4 (Matrix) each row sums to 100%: [Confirm]
- [ ] Green Month Logic Gate correctly applied: [State score → bracket → result]
- [ ] Formality determined via elimination, not default: [Confirm]
- [ ] All percentages are precise integers (not multiples of 5): [Confirm]
- [ ] Versatility Score influenced by review data: [Confirm calculation from Step 2.2]
- [ ] Compliment Factor influenced by review data: [Confirm calculation from Step 2.3]

# TOP 5 CITATIONS
1. [Source Name](URL) — [What it was used for]
2. [Source Name](URL) — [What it was used for]
3. [Source Name](URL) — [What it was used for]
4. [Source Name](URL) — [What it was used for]
5. [Source Name](URL) — [What it was used for]

# REVIEW DATA QUALITY REPORT
| Quality Metric | Status | Notes |
|----------------|--------|-------|
| Total Reviews Gathered | [X]/15 minimum | [Pass/Fail] |
| Source Diversity | [X]/4 source types | [Pass/Fail] |
| Avg Confidence Level | [High/Med/Low] | [Reasoning] |
| Conflicting Data Points | [X] found | [List if any] |
| Video Reviews Included | [X]/3 minimum | [Pass/Fail] |

# LOW CONFIDENCE DATA FLAGS
[List any fields marked as Low Confidence and what additional research would improve them]

# REVIEW GAPS IDENTIFIED
[List any data points that would benefit from more review coverage]

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
