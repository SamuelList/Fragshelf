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

// --- Season-Occasion Matrix ---
export interface SeasonOccasionMatrix {
  spring: OccasionScores;
  summer: OccasionScores;
  autumn: OccasionScores;
  winter: OccasionScores;
}

// --- Wearability Types ---
export interface WearabilityScores {
  special_occasion: number; // Percentage (0-100)
  daily_wear: number;       // Percentage (0-100, must sum to 100 with special_occasion)
}

// --- Occasion Months Types ---
export type Month = 'Jan' | 'Feb' | 'Mar' | 'Apr' | 'May' | 'Jun' | 'Jul' | 'Aug' | 'Sep' | 'Oct' | 'Nov' | 'Dec';

export type OccasionCategory = 'dateNight' | 'nightOut' | 'leisure' | 'work';

export interface OccasionMonths {
  dateNight: Month[];
  nightOut: Month[];
  leisure: Month[];
  work: Month[];
}

// --- Formality Types ---
export type Formality = 'Ultra Casual' | 'Casual' | 'Smart Casual' | 'Formal' | 'Black Tie';

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
  occasions: OccasionScores; // Must sum to 100 (deprecated, kept for backwards compatibility)
  seasonOccasions?: SeasonOccasionMatrix; // NEW: Matrix of occasions per season
  types: TypeScores;       // Must sum to 100
  wearability?: WearabilityScores; // Must sum to 100, optional for backwards compatibility
  rating?: number | null;  // 1-5 star rating, null/undefined = no rating (3 = neutral)
  hidden?: boolean;        // true = hidden (pushed to bottom of lists)
  review?: string;         // User's personal review or notes
  occasionMonths?: OccasionMonths; // Months for each occasion category
  formality?: Formality;   // Formality level of the fragrance
  middayTouchUp?: boolean; // Whether to bring the bottle for long days
}
