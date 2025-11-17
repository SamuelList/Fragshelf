export const CHART_COLORS = {
  seasons: {
    spring: '#badc82',  // Light green
    summer: '#fed766',  // Gold/Yellow
    autumn: '#d9b1be',  // Dark orange
    winter: '#a2cbff'   // Steel blue
  },
  occasions: {
    daily: '#a7dbf3',       // Sky blue
    business: '#c1c1c1',    // Slate gray
    leisure: '#f6ea86',     // Mint green
    sport: '#98e5d1',       // Tomato red
    evening: '#f480ac',     // Medium purple (lighter)
    'night out': '#a096e8'  // Deep pink (brighter)
  },
  types: {
    woody: '#d89785',       // Saddle brown
    fresh: '#8fb5ff',       // Dark turquoise
    citrus: '#ebe25b',      // Orange
    spicy: '#9abcb7',       // Crimson
    oriental: '#c16693',    // Goldenrod
    floral: '#dddddd',      // Hot pink
    fruity: '#ff95dd',      // Deep pink
    aquatic: '#8edaf2',     // Dodger blue
    gourmand: '#ffa0ab',    // Chocolate
    green: '#32CD32',       // Lime green (brighter)
    powdery: '#e6c7e1',     // Lavender
    leathery: '#8B4513',    // Saddle brown
    smoky: '#a6a6a6',       // Gray (lighter)
    resinous: '#eab99e',    // Peru
    sweet: '#d1a2ff',       // Light pink
    earthy: '#A0522D',      // Sienna
    creamy: '#d7d7c6',      // Wheat (darker)
    fougere: '#6B8E23',     // Olive drab
    chypre: '#556B2F',      // Dark olive green
    animalic: '#c5b5b7',    // Sienna
    synthetic: '#a7bcec'    // Silver
  }
};

// Helper function to get color with case-insensitive key lookup
export function getChartColor(category: keyof typeof CHART_COLORS, key: string): string {
  const colorMap = CHART_COLORS[category] as Record<string, string>;
  const lowerKey = key.toLowerCase();
  return colorMap[lowerKey] || colorMap[key] || '#8884d8';
}
