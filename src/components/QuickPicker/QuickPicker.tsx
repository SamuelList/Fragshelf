import { useState, useEffect } from 'react';
import { Fragrance } from '../../types/fragrance';
import styles from './QuickPicker.module.scss';

interface QuickPickerProps {
  fragrances: Fragrance[];
  onClose: () => void;
  onFragranceClick?: (fragrance: Fragrance) => void;
}

type Season = 'spring' | 'summer' | 'autumn' | 'winter';
type OccasionCategory = 'Professional' | 'Casual' | 'SpecialOccasion';

interface CategorizedFragrance extends Fragrance {
  professionalScore: number;
  casualScore: number;
  specialOccasionScore: number;
  selectedScore: number;
}

const QuickPicker = ({ fragrances, onClose, onFragranceClick }: QuickPickerProps) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedSeason, setSelectedSeason] = useState<Season | null>(null);
  const [selectedOccasion, setSelectedOccasion] = useState<OccasionCategory | null>(null);
  const [results, setResults] = useState<CategorizedFragrance[]>([]);

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

    const professional = business + (daily / 2);
    const casual = (daily + leisure + sport) / 2;
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

  const generateReasonForPick = (frag: Fragrance, rank: number, season: Season, occasion: OccasionCategory): string => {
    const seasonScore = frag.seasons[season] || 0;
    const allSeasons = Object.entries(frag.seasons)
      .filter(([_, value]) => value > 0)
      .sort((a, b) => b[1] - a[1]);
    
    const occasionScores = {
      daily: frag.occasions.daily || 0,
      business: frag.occasions.business || 0,
      leisure: frag.occasions.leisure || 0,
      sport: frag.occasions.sport || 0,
      evening: frag.occasions.evening || 0,
      nightOut: frag.occasions['night out'] || 0
    };

    const topType = Object.entries(frag.types)
      .filter(([_, value]) => value > 0)
      .sort((a, b) => b[1] - a[1])[0];

    const segments: string[] = [];

    // Opening statement based on rank and data strength
    if (rank === 0) {
      if (seasonScore >= 90) {
        segments.push("Absolutely built for this");
      } else if (seasonScore >= 70) {
        segments.push("Your top match here");
      } else {
        segments.push("Best available option");
      }
    } else if (rank === 1) {
      segments.push("Strong alternative");
    } else {
      segments.push("Worth considering");
    }

    // Season analysis with nuance
    if (allSeasons.length === 1) {
      segments.push(`exclusively a ${allSeasons[0][0]} fragrance (${allSeasons[0][1]}% peak performance)`);
    } else if (seasonScore >= 80) {
      segments.push(`thrives in ${season} (${seasonScore}%)`);
    } else if (seasonScore >= 60) {
      const topSeason = allSeasons[0];
      if (topSeason[0] !== season) {
        segments.push(`designed for ${topSeason[0]} (${topSeason[1]}%) but adapts well to ${season}`);
      } else {
        segments.push(`solid ${season} performer at ${seasonScore}%`);
      }
    } else if (seasonScore >= 40) {
      segments.push(`works in ${season} though not its strongest season`);
    } else {
      segments.push(`versatile enough for ${season}`);
    }

    // Occasion intelligence
    if (occasion === 'Professional') {
      if (occasionScores.business >= 80) {
        segments.push("explicitly crafted for boardroom presence");
      } else if (occasionScores.business >= 60) {
        segments.push("business-appropriate with confidence");
      } else if (occasionScores.daily >= 70) {
        segments.push("daily-wear that translates perfectly to professional settings");
      } else {
        segments.push("maintains workplace decorum");
      }
      
      if (topType && topType[0] === 'Eau de Toilette') {
        segments.push("lighter concentration prevents overwhelming colleagues");
      } else if (topType && topType[0] === 'Eau de Parfum' && occasionScores.business < 60) {
        segments.push("apply sparingly for office environments");
      }
    } else if (occasion === 'Casual') {
      if (occasionScores.leisure >= 70 && occasionScores.sport >= 50) {
        segments.push("effortlessly transitions from weekend activities to relaxed social settings");
      } else if (occasionScores.daily >= 80) {
        segments.push("dependable daily driver with universal appeal");
      } else if (occasionScores.leisure >= 60) {
        segments.push("perfect for laid-back moments");
      } else {
        segments.push("versatile enough for casual wear");
      }

      if (topType && topType[0] === 'Cologne') {
        segments.push("refreshing cologne keeps things easygoing");
      }
    } else {
      if (occasionScores.evening >= 80 || occasionScores.nightOut >= 80) {
        segments.push("specifically engineered for evening sophistication");
      } else if (occasionScores.evening >= 60) {
        segments.push("elevates special moments with refined presence");
      } else {
        segments.push("rises to special occasions");
      }

      if (topType && topType[0] === 'Perfume') {
        segments.push("pure perfume intensity commands attention");
      } else if (topType && topType[0] === 'Eau de Parfum') {
        segments.push("rich concentration ensures lasting impression");
      }
    }

    // Type and longevity insight
    if (topType) {
      const [typeName, typePercentage] = topType;
      if (typePercentage >= 80) {
        if (typeName === 'Eau de Parfum') {
          segments.push("6-8 hour longevity expected");
        } else if (typeName === 'Eau de Toilette') {
          segments.push("4-6 hour wear time");
        } else if (typeName === 'Cologne') {
          segments.push("2-4 hour freshness, ideal for reapplication");
        } else if (typeName === 'Perfume') {
          segments.push("8-12+ hour staying power");
        }
      }
    }

    // Versatility score
    const versatilityScore = allSeasons.filter(([_, v]) => v >= 40).length;
    const occasionCount = Object.values(occasionScores).filter(v => v >= 40).length;
    
    if (versatilityScore >= 3 && occasionCount >= 4) {
      segments.push("remarkably versatile across contexts");
    } else if (versatilityScore === 1 || occasionCount <= 2) {
      segments.push("specialized rather than jack-of-all-trades");
    }

    // Personal preference bonus
    if (frag.liked === true) {
      segments.push("✨ already a personal favorite");
    } else if (frag.liked === false && rank > 0) {
      segments.push("might surprise you despite previous thoughts");
    }

    return segments.join(', ') + '.';
  };

  const handleOccasionSelect = (occasion: OccasionCategory) => {
    setSelectedOccasion(occasion);
    
    // Filter and calculate results
    if (!selectedSeason) return;

    const filtered = fragrances
      .filter(frag => {
        // Must have at least 20% of selected season
        const seasonScore = frag.seasons[selectedSeason] || 0;
        return seasonScore >= 20;
      })
      .map(frag => {
        const scores = categorizeFragrance(frag);
        let selectedScore = 0;
        
        if (occasion === 'Professional') selectedScore = scores.professional;
        else if (occasion === 'Casual') selectedScore = scores.casual;
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
      .sort((a, b) => b.selectedScore - a.selectedScore);

    // Apply like/dislike adjustments to rankings
    const likedFrags: CategorizedFragrance[] = [];
    const neutralFrags: CategorizedFragrance[] = [];
    const dislikedFrags: CategorizedFragrance[] = [];

    // Separate fragrances by like status
    filtered.forEach(frag => {
      if (frag.liked === true) likedFrags.push(frag);
      else if (frag.liked === false) dislikedFrags.push(frag);
      else neutralFrags.push(frag);
    });

    // Merge them with adjustments: process in order and apply bumps/knocks
    let currentList = [...likedFrags, ...neutralFrags, ...dislikedFrags];
    
    // For each liked fragrance, try to bump it up one position if possible
    likedFrags.forEach(likedFrag => {
      const currentIndex = currentList.indexOf(likedFrag);
      if (currentIndex > 0) {
        // Swap with the item above it
        [currentList[currentIndex - 1], currentList[currentIndex]] = 
        [currentList[currentIndex], currentList[currentIndex - 1]];
      }
    });

    // For each disliked fragrance, try to knock it down one position if possible
    dislikedFrags.forEach(dislikedFrag => {
      const currentIndex = currentList.indexOf(dislikedFrag);
      if (currentIndex < currentList.length - 1) {
        // Swap with the item below it
        [currentList[currentIndex], currentList[currentIndex + 1]] = 
        [currentList[currentIndex + 1], currentList[currentIndex]];
      }
    });

    setResults(currentList.slice(0, 3));
    setTimeout(() => setStep(3), 300);
  };

  const handleReset = () => {
    setStep(1);
    setSelectedSeason(null);
    setSelectedOccasion(null);
    setResults([]);
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

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeButton} onClick={onClose}>×</button>

        <div className={styles.content}>
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

              <div className={styles.occasionGrid}>
                {occasions.map(occasion => (
                  <button
                    key={occasion.key}
                    className={styles.occasionCard}
                    onClick={() => handleOccasionSelect(occasion.key)}
                  >
                    <span className={styles.occasionEmoji}>{occasion.emoji}</span>
                    <span className={styles.occasionLabel}>{occasion.label}</span>
                    <span className={styles.occasionDescription}>{occasion.description}</span>
                  </button>
                ))}
              </div>

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
                <div className={styles.resultsGrid}>
                  {results.map((frag, index) => (
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
                        <p className={styles.resultReason}>
                          {generateReasonForPick(frag, index, selectedSeason!, selectedOccasion!)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
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
