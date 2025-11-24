import { useState, useEffect } from 'react';
import { Fragrance, OccasionScores } from '../../types/fragrance';
import styles from './QuickPicker.module.scss';

interface QuickPickerProps {
  fragrances: Fragrance[];
  onClose: () => void;
  onFragranceClick?: (fragrance: Fragrance) => void;
}

type Season = 'spring' | 'summer' | 'autumn' | 'winter';
type OccasionKey = keyof OccasionScores;
type PickerMode = 'classic' | 'intelligent' | null;
type OccasionCategory = 'Professional' | 'Casual' | 'SpecialOccasion';

interface CategorizedFragrance extends Fragrance {
  professionalScore: number;
  casualScore: number;
  specialOccasionScore: number;
  selectedScore: number;
  matchScore?: number;
}

const QuickPicker = ({ fragrances, onClose, onFragranceClick }: QuickPickerProps) => {
  const [mode, setMode] = useState<PickerMode>(null);
  const [step, setStep] = useState<0 | 1 | 2 | 3>(0);
  const [selectedSeason, setSelectedSeason] = useState<Season | null>(null);
  const [selectedOccasion, setSelectedOccasion] = useState<OccasionCategory | OccasionKey | null>(null);
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

    const professional = (business * 1.5) + (daily / 2);
    const casual = (daily + leisure + (sport / 2)) / 2;
    const specialOccasion = (evening + nightOut) / 2;

    return {
      professional,
      casual,
      specialOccasion
    };
  };

  const handleSeasonSelect = (season: Season) => {
    setSelectedSeason(season);
    setTimeout(() => setStep(2), 300);
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
          professionalScore: 0,
          casualScore: 0,
          specialOccasionScore: 0,
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

  const generateReasonForPick = (frag: Fragrance, rank: number, season: Season, occasion: OccasionCategory): string => {
    const seasonScore = frag.seasons[season] || 0;
    const occasionScores = {
      daily: frag.occasions.daily || 0,
      business: frag.occasions.business || 0,
      leisure: frag.occasions.leisure || 0,
      sport: frag.occasions.sport || 0,
      evening: frag.occasions.evening || 0,
      nightOut: frag.occasions['night out'] || 0
    };

    // Calculate the relevant occasion score
    let relevantScore = 0;
    let scoreName = '';
    if (occasion === 'Professional') {
      relevantScore = Math.round(occasionScores.business + (occasionScores.daily / 2));
      scoreName = 'professional';
    } else if (occasion === 'Casual') {
      relevantScore = Math.round((occasionScores.daily + occasionScores.leisure + occasionScores.sport) / 2);
      scoreName = 'casual';
    } else {
      relevantScore = Math.round((occasionScores.evening + occasionScores.nightOut) / 2);
      scoreName = 'special occasion';
    }

    const topType = Object.entries(frag.types)
      .filter(([_, value]) => value > 0)
      .sort((a, b) => b[1] - a[1])[0];

    // Build concise, conversational reason
    const parts: string[] = [];

    // Lead with match quality
    if (rank === 0) {
      parts.push(`Perfect for ${season}`);
    } else if (rank === 1) {
      parts.push(`Great ${season} choice`);
    } else {
      parts.push(`Solid ${season} pick`);
    }

    parts.push(`with a ${seasonScore}% seasonal rating`);

    // Add occasion context
    if (relevantScore >= 70) {
      parts.push(`and a strong ${scoreName} score of ${relevantScore}`);
    } else if (relevantScore >= 50) {
      parts.push(`plus ${relevantScore} for ${scoreName} wear`);
    } else if (relevantScore >= 30) {
      parts.push(`with ${relevantScore} ${scoreName} points`);
    }

    // Add type insight if strong
    if (topType && topType[1] >= 80) {
      const typeComments: { [key: string]: string } = {
        'Eau de Parfum': 'long-lasting EDP',
        'Eau de Toilette': 'fresh EDT',
        'Cologne': 'light cologne',
        'Perfume': 'intense perfume'
      };
      const comment = typeComments[topType[0]];
      if (comment) {
        parts.push(`this ${comment} delivers`);
      }
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

  const handleOccasionSelect = (occasion: OccasionCategory | OccasionKey) => {
    setSelectedOccasion(occasion);
    
    if (!selectedSeason) return;

    let finalResults: CategorizedFragrance[] = [];

    if (mode === 'intelligent' && typeof occasion === 'string' && !['Professional', 'Casual', 'SpecialOccasion'].includes(occasion)) {
      // Intelligent mode with specific occasion
      finalResults = handleIntelligentPick(selectedSeason, occasion as OccasionKey);
    } else {
      // Classic mode
      const occasionCategory = occasion as OccasionCategory;
      const filtered = fragrances
        .filter(frag => {
          const seasonScore = frag.seasons[selectedSeason] || 0;
          return seasonScore >= 20;
        })
        .map(frag => {
          const scores = categorizeFragrance(frag);
          let selectedScore = 0;
          
          if (occasionCategory === 'Professional') selectedScore = scores.professional;
          else if (occasionCategory === 'Casual') selectedScore = scores.casual;
          else selectedScore = scores.specialOccasion;

          return {
            ...frag,
            professionalScore: scores.professional,
            casualScore: scores.casual,
            specialOccasionScore: scores.specialOccasion,
            selectedScore
          };
        })
        .filter(frag => frag.selectedScore >= 20)
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
    setSelectedOccasion(null);
    setResults([]);
    setPromptCopied(false);
  };

  const handleCopyPrompt = async () => {
    if (!selectedSeason || !selectedOccasion || results.length === 0) return;

    const seasonName = seasons.find(s => s.key === selectedSeason)?.label || selectedSeason;
    
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
      const occasion = occasions.find(o => o.key === selectedOccasion);
      occasionName = occasion?.label || selectedOccasion as string;
      occasionContext = occasion?.description || '';
      occasionDefinition = `This is a broad category covering: ${occasionContext}`;
    }

    const fragList = results.map((frag, index) => {
      return `${index + 1}. ${frag.name} ${frag.brand}`;
    }).join('\n');

    const prompt = `I need a fragrance recommendation from my collection for a specific scenario.

CONTEXT:
- Season: ${seasonName}
- Occasion: ${occasionName}
- Definition: ${occasionDefinition}

CANDIDATES (Top ${results.length} from my collection):
${fragList}

TASK:
Analyze these fragrances against the specific definition provided above. 
1. Evaluate suitability for ${seasonName} + ${occasionName}.
2. Compare them against each other.
3. Provide styling/usage advice (outfit, sprays, timing).
4. Pick the single best option.

CRITICAL INSTRUCTION:
Differentiate clearly between similar occasions. 
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

  const occasions = [
    { key: 'Professional' as OccasionCategory, label: 'Professional', emoji: '💼', description: 'Office & Business' },
    { key: 'Casual' as OccasionCategory, label: 'Casual', emoji: '👕', description: 'Everyday & Leisure' },
    { key: 'SpecialOccasion' as OccasionCategory, label: 'Special Occasion', emoji: '✨', description: 'Evening & Night Out' }
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
                    Simple season + 3 broad occasions
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

          {/* Step 1: Season Selection */}
          {step === 1 && (
            <div className={`${styles.step} ${styles.fadeIn}`}>
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
            </div>
          )}

          {/* Step 2: Occasion Selection */}
          {step === 2 && (
            <div className={`${styles.step} ${styles.fadeIn}`}>
              <div className={styles.stepHeader}>
                <span className={styles.stepNumber}>Step 2 of 2</span>
                <h2 className={styles.stepTitle}>Choose Your Occasion</h2>
                <p className={styles.stepSubtitle}>Where will you wear this fragrance?</p>
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
                  {occasions.map(occasion => (
                    <button
                      key={occasion.key}
                      className={styles.occasionCard}
                      onClick={() => handleOccasionSelect(occasion.key)}
                    >
                      <span className={styles.occasionEmoji}>{occasion.emoji}</span>
                      <div>
                        <span className={styles.occasionLabel}>{occasion.label}</span>
                        <span className={styles.occasionDescription}>{occasion.description}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              <button className={styles.backButton} onClick={() => setStep(1)}>
                ← Back to Seasons
              </button>
            </div>
          )}

          {/* Step 3: Results */}
          {step === 3 && (
            <div className={`${styles.step} ${styles.fadeIn}`}>
              <div className={styles.stepHeader}>
                <h2 className={styles.stepTitle}>Your Perfect Matches</h2>
                <p className={styles.stepSubtitle}>
                  {selectedSeason && seasons.find(s => s.key === selectedSeason)?.emoji} {selectedSeason} • {' '}
                  {selectedOccasion && occasions.find(o => o.key === selectedOccasion)?.emoji} {selectedOccasion}
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
                              : generateReasonForPick(frag, index, selectedSeason!, selectedOccasion! as OccasionCategory)}
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
