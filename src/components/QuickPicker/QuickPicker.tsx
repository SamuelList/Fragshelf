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
                        <div className={styles.resultScore}>
                          <div className={styles.scoreBar}>
                            <div 
                              className={styles.scoreBarFill}
                              style={{ width: `${Math.min(frag.selectedScore, 100)}%` }}
                            />
                          </div>
                          <span className={styles.scoreValue}>{Math.round(frag.selectedScore)} match</span>
                        </div>
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
