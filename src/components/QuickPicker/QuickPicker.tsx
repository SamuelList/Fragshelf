import { useState, useEffect } from 'react';
import { Fragrance, OccasionScores } from '../../types/fragrance';
import styles from './QuickPicker.module.scss';

interface QuickPickerProps {
  fragrances: Fragrance[];
  onClose: () => void;
  onFragranceClick?: (fragrance: Fragrance) => void;
}

type Season = 'spring' | 'summer' | 'autumn' | 'winter';
type TemperatureZone = 'highHeat' | 'transitionalMild' | 'deepCold';
type OccasionKey = keyof OccasionScores;
type PickerMode = 'classic' | 'intelligent' | null;
type ShoeCategory = 'Athletic' | 'WorkBoots' | 'CasualSneakers' | 'DressShoes';

interface CategorizedFragrance extends Fragrance {
  athleticScore: number;
  workBootsScore: number;
  casualSneakersScore: number;
  dressShoesScore: number;
  selectedScore: number;
  matchScore?: number;
}

const QuickPicker = ({ fragrances, onClose, onFragranceClick }: QuickPickerProps) => {
  const [mode, setMode] = useState<PickerMode>(null);
  const [step, setStep] = useState<0 | 1 | 2 | 3>(0);
  const [selectedSeason, setSelectedSeason] = useState<Season | null>(null);
  const [selectedTemperature, setSelectedTemperature] = useState<TemperatureZone | null>(null);
  const [selectedOccasion, setSelectedOccasion] = useState<ShoeCategory | OccasionKey | null>(null);
  const [results, setResults] = useState<CategorizedFragrance[]>([]);
  const [promptCopied, setPromptCopied] = useState(false);

  // Prevent background scrolling
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const categorizeFragrance = (frag: Fragrance) => {
    const daily = frag.occasions.daily || 0;
    const business = frag.occasions.business || 0;
    const leisure = frag.occasions.leisure || 0;
    const sport = frag.occasions.sport || 0;
    const evening = frag.occasions.evening || 0;
    const nightOut = frag.occasions['night out'] || 0;

    // Raw shoe scores
    const rawAthletic = sport;
    const rawWorkBoots = daily + (business * 0.5);
    const rawCasualSneakers = leisure + (daily * 0.5) + (business * 0.5);
    const rawDressShoes = evening + nightOut + (business * 0.5);

    // Normalize to 100%
    const total = rawAthletic + rawWorkBoots + rawCasualSneakers + rawDressShoes;
    if (total === 0) return { athletic: 0, workBoots: 0, casualSneakers: 0, dressShoes: 0 };

    return {
      athletic: (rawAthletic / total) * 100,
      workBoots: (rawWorkBoots / total) * 100,
      casualSneakers: (rawCasualSneakers / total) * 100,
      dressShoes: (rawDressShoes / total) * 100
    };
  };

  const handleSeasonSelect = (season: Season) => {
    setSelectedSeason(season);
    setTimeout(() => setStep(2), 300);
  };

  const handleTemperatureSelect = (zone: TemperatureZone) => {
    setSelectedTemperature(zone);
    setTimeout(() => setStep(2), 300);
  };

  // Type-based climate score from fragrance accord/type data
  const getTypeClimateScore = (frag: Fragrance, zone: TemperatureZone): number => {
    const t = frag.types;
    const rawHighHeat = (t.Fresh || 0) + (t.Citrus || 0) + (t.Aquatic || 0) + (t.Fruity || 0) + (t.Green || 0);
    const rawTransitional = (t.Woody || 0) + (t.Floral || 0) + (t.Synthetic || 0) + (t.Powdery || 0) + (t.Earthy || 0) + (t.Fougere || 0);
    const rawDeepCold = (t.Spicy || 0) + (t.Sweet || 0) + (t.Resinous || 0) + (t.Gourmand || 0) + (t.Leathery || 0) + (t.Smoky || 0) + (t.Oriental || 0) + (t.Creamy || 0);

    const total = rawHighHeat + rawTransitional + rawDeepCold;
    if (total === 0) return 0;

    switch (zone) {
      case 'highHeat': return (rawHighHeat / total) * 100;
      case 'transitionalMild': return (rawTransitional / total) * 100;
      case 'deepCold': return (rawDeepCold / total) * 100;
    }
  };

  // Get the effective temperature score: average of season data + type climate data
  const getTemperatureScore = (frag: Fragrance, zone: TemperatureZone): number => {
    let seasonScore: number;
    switch (zone) {
      case 'highHeat': seasonScore = frag.seasons.summer; break;
      case 'transitionalMild': seasonScore = (frag.seasons.spring + frag.seasons.autumn) / 2; break;
      case 'deepCold': seasonScore = frag.seasons.winter; break;
    }
    const typeScore = getTypeClimateScore(frag, zone);
    return (seasonScore + typeScore) / 2;
  };

  const getTemperatureLabel = (zone: TemperatureZone): string => {
    return temperatureZones.find(t => t.key === zone)?.label || zone;
  };

  const handleModeSelect = (selectedMode: PickerMode) => {
    setMode(selectedMode);
    setTimeout(() => setStep(1), 300);
  };

  const handleIntelligentPick = (season: Season, occasion: OccasionKey) => {
    // Use the season-occasion matrix for intelligent picking
    const scored = fragrances
      .map(frag => {
        const seasonScore = frag.seasons[season] || 0;
        
        // Get occasion score from matrix if available, otherwise fall back to overall
        let occasionScore = 0;
        if (frag.seasonOccasions && frag.seasonOccasions[season]) {
          occasionScore = frag.seasonOccasions[season][occasion] || 0;
        } else {
          occasionScore = frag.occasions[occasion] || 0;
        }
        
        // Combined match score: weighted average
        const matchScore = (seasonScore * 0.4) + (occasionScore * 0.6);
        
        return {
          ...frag,
          matchScore,
          athleticScore: 0,
          workBootsScore: 0,
          casualSneakersScore: 0,
          dressShoesScore: 0,
          selectedScore: matchScore
        };
      })
      .filter(frag => frag.matchScore! >= 15) // Must have at least 15% combined score
      .sort((a, b) => b.matchScore! - a.matchScore!)
      .slice(0, 10); // Get top 10 first

    // Apply like/dislike adjustments: +1 for liked, -1 for disliked
    // Track which fragrances have been moved to ensure each moves only once
    const movedIds = new Set<string>();
    
    for (let i = 0; i < scored.length; i++) {
      const currentFrag = scored[i];
      if (movedIds.has(currentFrag.id)) continue;
      
      if (currentFrag.liked === true && i > 0) {
        // Swap with the item above (move up 1 position)
        [scored[i - 1], scored[i]] = [scored[i], scored[i - 1]];
        movedIds.add(currentFrag.id);
      } else if (currentFrag.liked === false && i < scored.length - 1) {
        // Swap with the item below (move down 1 position)
        [scored[i], scored[i + 1]] = [scored[i + 1], scored[i]];
        movedIds.add(currentFrag.id);
      }
    }

    return scored;
  };

  const generateIntelligentReason = (frag: Fragrance, rank: number, season: Season, occasion: OccasionKey): string => {
    const seasonScore = frag.seasons[season] || 0;
    let occasionScore = 0;
    
    if (frag.seasonOccasions && frag.seasonOccasions[season]) {
      occasionScore = frag.seasonOccasions[season][occasion] || 0;
    } else {
      occasionScore = frag.occasions[occasion] || 0;
    }

    const occasionLabel = occasion.replace('_', ' ').split(' ').map(w => 
      w.charAt(0).toUpperCase() + w.slice(1)
    ).join(' ');

    const parts: string[] = [];

    // Lead with match quality
    if (rank === 0) {
      parts.push(`Perfect ${season} match`);
    } else if (rank === 1) {
      parts.push(`Excellent ${season} pick`);
    } else {
      parts.push(`Great ${season} option`);
    }

    // Add specific scores
    if (seasonScore >= 60 && occasionScore >= 60) {
      parts.push(`with ${seasonScore}% seasonal and ${occasionScore}% ${occasionLabel.toLowerCase()} ratings`);
    } else if (seasonScore >= 50 || occasionScore >= 50) {
      parts.push(`scoring ${seasonScore}% for ${season} and ${occasionScore}% for ${occasionLabel.toLowerCase()}`);
    } else {
      parts.push(`balancing ${seasonScore}% ${season} with ${occasionScore}% ${occasionLabel.toLowerCase()}`);
    }

    // Add wearability context if available
    if (frag.wearability) {
      if (frag.wearability.special_occasion >= 70) {
        parts.push(`best saved for special moments`);
      } else if (frag.wearability.daily_wear >= 70) {
        parts.push(`perfect for everyday wear`);
      }
    }

    // Personal touch ending
    if (frag.liked === true) {
      const endings = [
        "and you already love it!",
        "one of your favorites!",
        "you know it's good!",
        "already a winner!"
      ];
      parts.push(endings[Math.floor(Math.random() * endings.length)]);
    } else if (frag.liked === false) {
      parts.push("maybe give it another chance?");
    } else {
      const neutralEndings = [
        "worth trying out!",
        "give it a shot!",
        "could be perfect!",
        "ready to wear!"
      ];
      parts.push(neutralEndings[Math.floor(Math.random() * neutralEndings.length)]);
    }

    // Join with proper grammar
    return parts.length === 3 
      ? `${parts[0]} ${parts[1]}, ${parts[2]}`
      : parts.join(', ');
  };

  const generateReasonForPick = (frag: Fragrance, rank: number, tempZone: TemperatureZone, shoe: ShoeCategory): string => {
    const tempScore = Math.round(getTemperatureScore(frag, tempZone));
    const tempLabel = getTemperatureLabel(tempZone).toLowerCase();
    const scores = categorizeFragrance(frag);

    let relevantScore = 0;
    let scoreName = '';
    if (shoe === 'Athletic') { relevantScore = Math.round(scores.athletic); scoreName = 'athletic'; }
    else if (shoe === 'WorkBoots') { relevantScore = Math.round(scores.workBoots); scoreName = 'work boots'; }
    else if (shoe === 'CasualSneakers') { relevantScore = Math.round(scores.casualSneakers); scoreName = 'casual sneakers'; }
    else { relevantScore = Math.round(scores.dressShoes); scoreName = 'dress shoes'; }

    // Build concise, conversational reason
    const parts: string[] = [];

    // Lead with match quality
    if (rank === 0) {
      parts.push(`Perfect for ${tempLabel} weather`);
    } else if (rank === 1) {
      parts.push(`Great ${tempLabel} choice`);
    } else {
      parts.push(`Solid ${tempLabel} pick`);
    }

    parts.push(`with a ${tempScore}% weather fit`);

    // Add shoe context
    if (relevantScore >= 40) {
      parts.push(`and a strong ${relevantScore}% ${scoreName} fit`);
    } else if (relevantScore >= 25) {
      parts.push(`plus ${relevantScore}% ${scoreName} match`);
    } else if (relevantScore >= 15) {
      parts.push(`with ${relevantScore}% ${scoreName} affinity`);
    }

    // Personal touch ending
    if (frag.liked === true) {
      const endings = [
        "no wonder you gave it thumbs up!",
        "already one of your favorites!",
        "and you already love it!",
        "you know it's good!"
      ];
      parts.push(endings[Math.floor(Math.random() * endings.length)]);
    } else if (frag.liked === false) {
      parts.push("maybe give it another chance?");
    } else {
      const neutralEndings = [
        "worth trying out!",
        "give it a shot!",
        "could be your next favorite!",
        "ready when you are!"
      ];
      parts.push(neutralEndings[Math.floor(Math.random() * neutralEndings.length)]);
    }

    // Join with proper grammar
    const mainParts = parts.slice(0, -1);
    const ending = parts[parts.length - 1];
    
    if (mainParts.length === 2) {
      return `${mainParts[0]} ${mainParts[1]}, ${ending}`;
    } else if (mainParts.length === 3) {
      return `${mainParts[0]} ${mainParts[1]}, ${mainParts[2]}, ${ending}`;
    } else {
      return `${mainParts.join(', ')}, ${ending}`;
    }
  };

  const handleOccasionSelect = (occasion: ShoeCategory | OccasionKey) => {
    setSelectedOccasion(occasion);
    
    // Intelligent mode needs a season, classic mode needs a temperature zone
    if (mode === 'intelligent' && !selectedSeason) return;
    if (mode === 'classic' && !selectedTemperature) return;

    let finalResults: CategorizedFragrance[] = [];

    if (mode === 'intelligent' && typeof occasion === 'string' && !['Athletic', 'WorkBoots', 'CasualSneakers', 'DressShoes'].includes(occasion)) {
      // Intelligent mode with specific occasion
      finalResults = handleIntelligentPick(selectedSeason!, occasion as OccasionKey);
    } else {
      // Classic mode - uses temperature zones + shoe categories
      const shoeCategory = occasion as ShoeCategory;
      const filtered = fragrances
        .filter(frag => {
          const tempScore = selectedTemperature ? getTemperatureScore(frag, selectedTemperature) : 0;
          return tempScore >= 20;
        })
        .map(frag => {
          const scores = categorizeFragrance(frag);
          let selectedScore = 0;
          
          if (shoeCategory === 'Athletic') selectedScore = scores.athletic;
          else if (shoeCategory === 'WorkBoots') selectedScore = scores.workBoots;
          else if (shoeCategory === 'CasualSneakers') selectedScore = scores.casualSneakers;
          else selectedScore = scores.dressShoes;

          return {
            ...frag,
            athleticScore: scores.athletic,
            workBootsScore: scores.workBoots,
            casualSneakersScore: scores.casualSneakers,
            dressShoesScore: scores.dressShoes,
            selectedScore
          };
        })
        .filter(frag => frag.selectedScore >= 15)
        .sort((a, b) => b.selectedScore - a.selectedScore)
        .slice(0, 10); // Get top 10 first

      // Apply like/dislike adjustments: +1 for liked, -1 for disliked
      // Track which fragrances have been moved to ensure each moves only once
      const movedIds = new Set<string>();
      
      for (let i = 0; i < filtered.length; i++) {
        const currentFrag = filtered[i];
        if (movedIds.has(currentFrag.id)) continue;
        
        if (currentFrag.liked === true && i > 0) {
          // Swap with the item above (move up 1 position)
          [filtered[i - 1], filtered[i]] = [filtered[i], filtered[i - 1]];
          movedIds.add(currentFrag.id);
        } else if (currentFrag.liked === false && i < filtered.length - 1) {
          // Swap with the item below (move down 1 position)
          [filtered[i], filtered[i + 1]] = [filtered[i + 1], filtered[i]];
          movedIds.add(currentFrag.id);
        }
      }

      finalResults = filtered;
    }

    setResults(finalResults);
    setTimeout(() => setStep(3), 300);
  };

  const handleReset = () => {
    setStep(0);
    setMode(null);
    setSelectedSeason(null);
    setSelectedTemperature(null);
    setSelectedOccasion(null);
    setResults([]);
    setPromptCopied(false);
  };

  const handleCopyPrompt = async () => {
    if (!selectedOccasion || results.length === 0) return;
    if (mode === 'intelligent' && !selectedSeason) return;
    if (mode === 'classic' && !selectedTemperature) return;

    const seasonName = mode === 'classic'
      ? (temperatureZones.find(t => t.key === selectedTemperature)?.label || selectedTemperature)
      : (seasons.find(s => s.key === selectedSeason)?.label || selectedSeason);
    
    let occasionName = '';
    let occasionContext = '';
    let occasionDefinition = '';
    
    if (mode === 'intelligent' && typeof selectedOccasion === 'string' && !['Professional', 'Casual', 'SpecialOccasion'].includes(selectedOccasion)) {
      const occasion = intelligentOccasions.find(o => o.key === selectedOccasion);
      occasionName = occasion?.label || selectedOccasion;
      occasionContext = occasion?.description || '';

      // Add specific clarifications based on user feedback
      if (selectedOccasion === 'night out') {
        occasionDefinition = "This occasion refers specifically to high-energy social environments like bars, clubs, and parties. It is distinct from 'Evening' which implies more formal, elegant, or intimate settings (dinner, theater).";
      } else if (selectedOccasion === 'evening') {
        occasionDefinition = "This occasion refers to formal, elegant, or intimate settings like dinner dates, theater, or cultural events. It is distinct from 'Night Out' which implies high-energy partying/clubbing.";
      } else if (selectedOccasion === 'daily') {
        occasionDefinition = "This occasion refers to casual, versatile everyday wear for routine activities (errands, work-from-home). It is distinct from 'Business' (professional) and 'Leisure' (social downtime).";
      } else if (selectedOccasion === 'business') {
        occasionDefinition = "This occasion refers to professional, corporate, or formal work environments. It is distinct from 'Daily' which implies casual, unstructured routine wear.";
      } else if (selectedOccasion === 'leisure') {
        occasionDefinition = "This occasion refers to relaxed social outings like coffee dates, shopping, or hanging out with friends. It is distinct from 'Daily' (routine chores) and 'Sport' (physical exertion).";
      } else if (selectedOccasion === 'sport') {
        occasionDefinition = "This occasion refers to active lifestyle moments, gym sessions, or outdoor physical activities. It requires fresh, non-cloying scents.";
      } else {
         occasionDefinition = `This occasion is defined as: ${occasionContext}`;
      }
    } else {
      const shoe = shoeCategories.find(s => s.key === selectedOccasion);
      occasionName = shoe?.label || selectedOccasion as string;
      occasionContext = shoe?.description || '';
      if (selectedOccasion === 'Athletic') {
        occasionDefinition = 'Active/sporty occasions requiring fresh, energetic, non-cloying scents. Think gym, outdoor activities, and athletic wear.';
      } else if (selectedOccasion === 'WorkBoots') {
        occasionDefinition = 'Daily grind, commuting, errands, and routine work. Reliable, versatile, get-things-done energy.';
      } else if (selectedOccasion === 'CasualSneakers') {
        occasionDefinition = 'Relaxed social outings, brunches, coffee dates, shopping. Easy-going and approachable vibes.';
      } else {
        occasionDefinition = 'Evening events, dates, parties, upscale nights. Making a statement and turning heads.';
      }
    }

    const fragList = results.map((frag, index) => {
      return `${index + 1}. ${frag.name} ${frag.brand}`;
    }).join('\n');

    const contextLabel = mode === 'classic' ? 'Weather' : 'Season';

    const prompt = `I need a fragrance recommendation from my collection for a specific scenario.

CONTEXT:
- ${contextLabel}: ${seasonName}
- Occasion: ${occasionName}
- Definition: ${occasionDefinition}

CANDIDATES (Top ${results.length} from my collection):
${fragList}

TASK:
You must first establish a complete understanding of each fragrance before recommending one.
1. RESEARCH: For each candidate, recall its olfactory pyramid (notes), main accords, and performance reputation.
2. ANALYZE: Evaluate how well each specific profile fits the "${seasonName} + ${occasionName}" definition provided above.
3. COMPARE: Rank them for this specific scenario.
4. ADVISE: Provide styling/usage advice (outfit, sprays, timing) for the winner.
5. DECIDE: Pick the single best option.

CRITICAL INSTRUCTION:
Differentiate clearly between similar occasions.
- If "Athletic": Focus on fresh, energetic, sporty scents for physical activity.
- If "Work Boots": Focus on versatile, reliable everyday scents for the daily grind.
- If "Casual Sneakers": Focus on relaxed, approachable scents for social hangouts.
- If "Dress Shoes": Focus on elegant, impactful scents for evenings and events.
- If "Business": Focus on professional, non-offensive, office-safe scents.
- If "Daily": Focus on versatile, casual, easy-reach scents for routine tasks.
- If "Leisure": Focus on relaxed, pleasant scents for social downtime (coffee, shopping).
- If "Sport": Focus on fresh, invigorating, non-cloying scents for physical activity.
- If "Evening": Focus on elegant, romantic, or formal dinner scents.
- If "Night Out": Focus on loud, playful, club/bar scents.
`;

    try {
      await navigator.clipboard.writeText(prompt);
      setPromptCopied(true);
      setTimeout(() => setPromptCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy prompt:', err);
    }
  };

  const seasons = [
    { key: 'spring' as Season, label: 'Spring', emoji: '🌸', color: '#90EE90' },
    { key: 'summer' as Season, label: 'Summer', emoji: '☀️', color: '#FFD700' },
    { key: 'autumn' as Season, label: 'Autumn', emoji: '🍂', color: '#FF8C00' },
    { key: 'winter' as Season, label: 'Winter', emoji: '❄️', color: '#4682B4' }
  ];

  const temperatureZones = [
    { key: 'highHeat' as TemperatureZone, label: 'High Heat', emoji: '🔥', color: '#FF4500', description: 'Peak summer warmth' },
    { key: 'transitionalMild' as TemperatureZone, label: 'Transitional Mild', emoji: '🌤️', color: '#F0A030', description: 'Spring & fall weather' },
    { key: 'deepCold' as TemperatureZone, label: 'Deep Cold', emoji: '❄️', color: '#4682B4', description: 'Winter chill' }
  ];

  const shoeCategories = [
    { key: 'Athletic' as ShoeCategory, label: 'Athletic', emoji: '🏃', description: 'Gym, sports & active lifestyle' },
    { key: 'WorkBoots' as ShoeCategory, label: 'Work Boots', emoji: '🥾', description: 'Daily grind & getting things done' },
    { key: 'CasualSneakers' as ShoeCategory, label: 'Casual Sneakers', emoji: '👟', description: 'Hanging out, errands & social outings' },
    { key: 'DressShoes' as ShoeCategory, label: 'Dress Shoes', emoji: '👞', description: 'Evenings out, events & making an impression' }
  ];

  const intelligentOccasions = [
    { key: 'daily' as OccasionKey, label: 'Daily', description: 'Casual everyday wear for work, errands, and routine activities' },
    { key: 'business' as OccasionKey, label: 'Business', description: 'Professional office environments, meetings, and formal work settings' },
    { key: 'leisure' as OccasionKey, label: 'Leisure', description: 'Relaxed social outings, shopping, coffee dates, and downtime' },
    { key: 'sport' as OccasionKey, label: 'Sport', description: 'Active lifestyle, gym sessions, outdoor activities, and athletic wear' },
    { key: 'evening' as OccasionKey, label: 'Evening', description: 'Dinner dates, cultural events, theater, and elegant gatherings' },
    { key: 'night out' as OccasionKey, label: 'Night Out', description: 'Bars, clubs, parties, and late-night social entertainment' }
  ];

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeButton} onClick={onClose}>×</button>

        <div className={styles.content}>
          {/* Step 0: Mode Selection */}
          {step === 0 && (
            <div className={`${styles.step} ${styles.fadeIn}`}>
              <div className={styles.stepHeader}>
                <h2 className={styles.stepTitle}>Choose Your Picker Mode</h2>
                <p className={styles.stepSubtitle}>How would you like to find your fragrance?</p>
              </div>

              <div className={styles.modeGrid}>
                <button
                  className={styles.modeCard}
                  onClick={() => handleModeSelect('classic')}
                >
                  <span className={styles.modeEmoji}>🎯</span>
                  <span className={styles.modeLabel}>Classic Picker</span>
                  <span className={styles.modeDescription}>
                    Temperature vibe + shoe-based occasions
                  </span>
                </button>
                <button
                  className={styles.modeCard}
                  onClick={() => handleModeSelect('intelligent')}
                >
                  <span className={styles.modeEmoji}>🧠</span>
                  <span className={styles.modeLabel}>Intelligent Picker</span>
                  <span className={styles.modeDescription}>
                    Matrix-based with all 6 specific occasions
                  </span>
                </button>
              </div>
            </div>
          )}

          {/* Step 1: Season/Temperature Selection */}
          {step === 1 && (
            <div className={`${styles.step} ${styles.fadeIn}`}>
              {mode === 'classic' ? (
                <>
                  <div className={styles.stepHeader}>
                    <span className={styles.stepNumber}>Step 1 of 2</span>
                    <h2 className={styles.stepTitle}>How's the Weather?</h2>
                    <p className={styles.stepSubtitle}>Pick the temperature vibe</p>
                  </div>

                  <div className={styles.temperatureGrid}>
                    {temperatureZones.map(zone => (
                      <button
                        key={zone.key}
                        className={styles.temperatureCard}
                        onClick={() => handleTemperatureSelect(zone.key)}
                        style={{ '--season-color': zone.color } as React.CSSProperties}
                      >
                        <span className={styles.seasonEmoji}>{zone.emoji}</span>
                        <div>
                          <span className={styles.seasonLabel}>{zone.label}</span>
                          <span className={styles.temperatureDescription}>{zone.description}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </>
              ) : (
                <>
                  <div className={styles.stepHeader}>
                    <span className={styles.stepNumber}>Step 1 of 2</span>
                    <h2 className={styles.stepTitle}>Choose Your Season</h2>
                    <p className={styles.stepSubtitle}>What season are you shopping for?</p>
                  </div>

                  <div className={styles.seasonGrid}>
                    {seasons.map(season => (
                      <button
                        key={season.key}
                        className={styles.seasonCard}
                        onClick={() => handleSeasonSelect(season.key)}
                        style={{ '--season-color': season.color } as React.CSSProperties}
                      >
                        <span className={styles.seasonEmoji}>{season.emoji}</span>
                        <span className={styles.seasonLabel}>{season.label}</span>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Step 2: Occasion Selection */}
          {step === 2 && (
            <div className={`${styles.step} ${styles.fadeIn}`}>
              <div className={styles.stepHeader}>
                <span className={styles.stepNumber}>Step 2 of 2</span>
                <h2 className={styles.stepTitle}>{mode === 'classic' ? "What Shoes Are You Wearing?" : "Choose Your Occasion"}</h2>
                <p className={styles.stepSubtitle}>{mode === 'classic' ? "Pick the vibe that matches your fit" : "Where will you wear this fragrance?"}</p>
              </div>

              {mode === 'intelligent' ? (
                <div className={styles.occasionGrid}>
                  {intelligentOccasions.map(occasion => (
                    <button
                      key={occasion.key}
                      className={styles.occasionCard}
                      onClick={() => handleOccasionSelect(occasion.key)}
                    >
                      <div>
                        <span className={styles.occasionLabel}>{occasion.label}</span>
                        <span className={styles.occasionDescription}>{occasion.description}</span>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className={styles.occasionGrid}>
                  {shoeCategories.map(shoe => (
                    <button
                      key={shoe.key}
                      className={styles.occasionCard}
                      onClick={() => handleOccasionSelect(shoe.key)}
                    >
                      <span className={styles.occasionEmoji}>{shoe.emoji}</span>
                      <div>
                        <span className={styles.occasionLabel}>{shoe.label}</span>
                        <span className={styles.occasionDescription}>{shoe.description}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              <button className={styles.backButton} onClick={() => setStep(1)}>
                ← Back to {mode === 'classic' ? 'Weather' : 'Seasons'}
              </button>
            </div>
          )}

          {/* Step 3: Results */}
          {step === 3 && (
            <div className={`${styles.step} ${styles.fadeIn}`}>
              <div className={styles.stepHeader}>
                <h2 className={styles.stepTitle}>Your Perfect Matches</h2>
                <p className={styles.stepSubtitle}>
                  {mode === 'classic' && selectedTemperature
                    ? <>{temperatureZones.find(t => t.key === selectedTemperature)?.emoji} {getTemperatureLabel(selectedTemperature)}</>
                    : <>{selectedSeason && seasons.find(s => s.key === selectedSeason)?.emoji} {selectedSeason}</>}
                  {' • '}
                  {mode === 'classic'
                    ? <>{shoeCategories.find(s => s.key === selectedOccasion)?.emoji} {shoeCategories.find(s => s.key === selectedOccasion)?.label}</>
                    : <>{intelligentOccasions.find(o => o.key === selectedOccasion)?.label || selectedOccasion}</>}
                </p>
              </div>

              {results.length > 0 ? (
                <>
                  <div className={styles.resultsGrid}>
                    {results.slice(0, 3).map((frag, index) => (
                      <div 
                        key={frag.id} 
                        className={styles.resultCard}
                        onClick={() => {
                          if (onFragranceClick) {
                            onFragranceClick(frag);
                            onClose();
                          }
                        }}
                      >
                        <div className={styles.resultRank}>
                          {index === 0 && '🥇'}
                          {index === 1 && '🥈'}
                          {index === 2 && '🥉'}
                        </div>
                        <div className={styles.resultImage}>
                          <img src={frag.imageUrl} alt={`${frag.brand} ${frag.name}`} />
                        </div>
                        <div className={styles.resultInfo}>
                          <h3 className={styles.resultBrand}>{frag.brand}</h3>
                          <p className={styles.resultName}>{frag.name}</p>
                          {mode === 'intelligent' && frag.matchScore !== undefined && (
                            <p className={styles.resultScore}>Match Score: {Math.round(frag.matchScore * 2)}%</p>
                          )}
                          <p className={styles.resultReason}>
                            {mode === 'intelligent' && typeof selectedOccasion === 'string' && !['Professional', 'Casual', 'SpecialOccasion'].includes(selectedOccasion)
                              ? generateIntelligentReason(frag, index, selectedSeason!, selectedOccasion as OccasionKey)
                              : generateReasonForPick(frag, index, selectedTemperature!, selectedOccasion! as ShoeCategory)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <button 
                    className={styles.copyPromptButton}
                    onClick={handleCopyPrompt}
                  >
                    {promptCopied ? '✓ Copied!' : '🤖 Copy AI Prompt'}
                  </button>
                </>
              ) : (
                <div className={styles.noResults}>
                  <span className={styles.noResultsEmoji}>😔</span>
                  <h3>No matches found</h3>
                  <p>Try a different combination of season and occasion</p>
                </div>
              )}

              <div className={styles.resultActions}>
                <button className={styles.resetButton} onClick={handleReset}>
                  🔄 Try Again
                </button>
                <button className={styles.doneButton} onClick={onClose}>
                  Done
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuickPicker;
