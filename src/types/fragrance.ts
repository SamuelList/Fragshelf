// --- Season Types ---
export interface SeasonScores {
  spring: number; // Percentage
  summer: number;
  autumn: number;
  winter: number;
}

// --- Occasion Types ---
export interface OccasionScores {
  daily: number;    // Percentage
  business: number;
  leisure: number;
  sport: number;
  evening: number;
  'night out': number;
}

// --- Fragrance Types ---
export type FragranceType =
  | 'Animalic' | 'Aquatic' | 'Floral' | 'Chypre' | 'Creamy' | 'Earthy'
  | 'Fougere' | 'Fresh' | 'Fruity' | 'Gourmand' | 'Green' | 'Woody'
  | 'Leathery' | 'Oriental' | 'Powdery' | 'Smoky' | 'Resinous'
  | 'Sweet' | 'Synthetic' | 'Spicy' | 'Citrus';

// Defines the percentage-based scores for all fragrance types.
// We'll assume all keys are present and sum to 100.
export type TypeScores = Record<FragranceType, number>;

// --- Main Interface ---
export interface Fragrance {
  id: string;
  brand: string;
  name: string;
  imageUrl: string; // URL to the bottle image
  seasons: SeasonScores;   // Must sum to 100
  occasions: OccasionScores; // Must sum to 100
  types: TypeScores;       // Must sum to 100
}
