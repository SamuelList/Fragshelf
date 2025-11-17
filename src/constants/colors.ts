export const CHART_COLORS = {
  seasons: {
    spring: '#90EE90',  // Light green
    summer: '#FFD700',  // Gold/Yellow
    autumn: '#FF8C00',  // Dark orange
    winter: '#4682B4'   // Steel blue
  },
  occasions: {
    daily: '#87CEEB',       // Sky blue
    business: '#708090',    // Slate gray
    leisure: '#98D8C8',     // Mint green
    sport: '#FF6347',       // Tomato red
    evening: '#9370DB',     // Medium purple (lighter)
    'night out': '#FF1493'  // Deep pink (brighter)
  },
  types: {
    woody: '#8B4513',       // Saddle brown
    fresh: '#00CED1',       // Dark turquoise
    citrus: '#FFA500',      // Orange
    spicy: '#DC143C',       // Crimson
    oriental: '#DAA520',    // Goldenrod
    floral: '#FF69B4',      // Hot pink
    fruity: '#FF1493',      // Deep pink
    aquatic: '#1E90FF',     // Dodger blue
    gourmand: '#D2691E',    // Chocolate
    green: '#32CD32',       // Lime green (brighter)
    powdery: '#E6E6FA',     // Lavender
    leathery: '#8B4513',    // Saddle brown
    smoky: '#808080',       // Gray (lighter)
    resinous: '#CD853F',    // Peru
    sweet: '#FFB6C1',       // Light pink
    earthy: '#A0522D',      // Sienna
    creamy: '#F5DEB3',      // Wheat (darker)
    fougere: '#6B8E23',     // Olive drab
    chypre: '#556B2F',      // Dark olive green
    animalic: '#A0522D',    // Sienna
    synthetic: '#C0C0C0'    // Silver
  }
};

// Helper function to get color with case-insensitive key lookup
export function getChartColor(category: keyof typeof CHART_COLORS, key: string): string {
  const colorMap = CHART_COLORS[category] as Record<string, string>;
  const lowerKey = key.toLowerCase();
  return colorMap[lowerKey] || colorMap[key] || '#8884d8';
}
