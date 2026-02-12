import { useState } from 'react';
import { Fragrance } from '../../types/fragrance';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { getChartColor } from '../../constants/colors';
import WearabilitySpectrum from '../WearabilitySpectrum/WearabilitySpectrum';
import styles from './FragranceDetail.module.scss';

type TemperatureZone = 'highHeat' | 'transitionalMild' | 'deepCold';
type ShoeCategory = 'Athletic' | 'WorkBoots' | 'CasualSneakers' | 'DressShoes';

const clothingLabels: Record<TemperatureZone, { label: string; emoji: string }> = {
  highHeat: { label: 'T-Shirt', emoji: '👕' },
  transitionalMild: { label: 'Light Jacket', emoji: '🧥' },
  deepCold: { label: 'Coat', emoji: '🧣' }
};

const shoeLabels: Record<ShoeCategory, { label: string; emoji: string }> = {
  Athletic: { label: 'Athletic', emoji: '🏃' },
  WorkBoots: { label: 'Work Boots', emoji: '🥾' },
  CasualSneakers: { label: 'Casual Sneakers', emoji: '👟' },
  DressShoes: { label: 'Dress Shoes', emoji: '👞' }
};

const getTopCombo = (frag: Fragrance): { shoe: ShoeCategory; temp: TemperatureZone } => {
  const daily = frag.occasions.daily || 0;
  const business = frag.occasions.business || 0;
  const leisure = frag.occasions.leisure || 0;
  const sport = frag.occasions.sport || 0;
  const evening = frag.occasions.evening || 0;
  const nightOut = frag.occasions['night out'] || 0;

  const shoeScores: { key: ShoeCategory; score: number }[] = [
    { key: 'Athletic', score: sport },
    { key: 'WorkBoots', score: daily + (business * 0.5) },
    { key: 'CasualSneakers', score: leisure + (daily * 0.5) + (business * 0.5) },
    { key: 'DressShoes', score: evening + nightOut + (business * 0.5) }
  ];
  const bestShoe = shoeScores.sort((a, b) => b.score - a.score)[0].key;

  const t = frag.types;
  const rawHighHeat = (t.Fresh || 0) + (t.Citrus || 0) + (t.Aquatic || 0) + (t.Fruity || 0) + (t.Green || 0);
  const rawTransitional = (t.Woody || 0) + (t.Floral || 0) + (t.Synthetic || 0) + (t.Powdery || 0) + (t.Earthy || 0) + (t.Fougere || 0) + (t.Chypre || 0);
  const rawDeepCold = (t.Spicy || 0) + (t.Sweet || 0) + (t.Resinous || 0) + (t.Gourmand || 0) + (t.Leathery || 0) + (t.Oriental || 0) + (t.Smoky || 0) + (t.Creamy || 0) + (t.Animalic || 0);

  const typeTotal = rawHighHeat + rawTransitional + rawDeepCold;
  const typeHighHeat = typeTotal > 0 ? (rawHighHeat / typeTotal) * 100 : 0;
  const typeTransitional = typeTotal > 0 ? (rawTransitional / typeTotal) * 100 : 0;
  const typeDeepCold = typeTotal > 0 ? (rawDeepCold / typeTotal) * 100 : 0;

  const tempScores: { key: TemperatureZone; score: number }[] = [
    { key: 'highHeat', score: (frag.seasons.summer + typeHighHeat) / 2 },
    { key: 'transitionalMild', score: ((frag.seasons.spring + frag.seasons.autumn) / 2 + typeTransitional) / 2 },
    { key: 'deepCold', score: (frag.seasons.winter + typeDeepCold) / 2 }
  ];
  const bestTemp = tempScores.sort((a, b) => b.score - a.score)[0].key;

  return { shoe: bestShoe, temp: bestTemp };
};

interface FragranceDetailProps {
  fragrance: Fragrance;
  onClose: () => void;
  onDelete: (id: string) => void;
  onEdit: (fragrance: Fragrance) => void;
  onRatingChange?: (id: string, rating: number | null) => void;
  onHiddenChange?: (id: string, hidden: boolean) => void;
}

const FragranceDetail = ({ fragrance, onClose, onDelete, onEdit, onRatingChange, onHiddenChange }: FragranceDetailProps) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedSeason, setSelectedSeason] = useState<string | null>(null);
  const [hoverStar, setHoverStar] = useState<number | null>(null);

  const handleStarClick = (star: number) => {
    if (onRatingChange) {
      // If clicking the same star that's already selected, remove rating
      onRatingChange(fragrance.id, fragrance.rating === star ? null : star);
    }
  };

  const handleHideClick = () => {
    if (onHiddenChange) {
      onHiddenChange(fragrance.id, !fragrance.hidden);
    }
  };

  const handleEditClick = () => {
    onEdit(fragrance);
  };

  const handleDeleteClick = () => {
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = () => {
    onDelete(fragrance.id);
    onClose();
  };

  const handleCancelDelete = () => {
    setShowDeleteConfirm(false);
  };

  // Prepare data for pie charts
  const seasonsData = Object.entries(fragrance.seasons)
    .filter(([_, value]) => value > 0)
    .map(([key, value]) => ({
      name: key.charAt(0).toUpperCase() + key.slice(1),
      value
    }))
    .sort((a, b) => b.value - a.value);

  const occasionsData = Object.entries(fragrance.occasions)
    .filter(([_, value]) => value > 0)
    .map(([key, value]) => ({
      name: key.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
      value
    }))
    .sort((a, b) => b.value - a.value);

  const typesData = Object.entries(fragrance.types)
    .filter(([_, value]) => value > 0)
    .map(([key, value]) => ({
      name: key,
      value
    }))
    .sort((a, b) => b.value - a.value);

  // Prepare season buttons data (sorted by percentage)
  const seasonButtons = Object.entries(fragrance.seasons)
    .filter(([_, value]) => value > 0)
    .map(([key, value]) => ({
      key,
      name: key.charAt(0).toUpperCase() + key.slice(1),
      value
    }))
    .sort((a, b) => b.value - a.value);

  // Get occasions data for selected season (normalized to 100%)
  const getOccasionsForSeason = (seasonKey: string) => {
    // Use seasonOccasions matrix if available, otherwise fall back to overall occasions
    if (fragrance.seasonOccasions && fragrance.seasonOccasions[seasonKey as keyof typeof fragrance.seasonOccasions]) {
      const seasonOccasions = fragrance.seasonOccasions[seasonKey as keyof typeof fragrance.seasonOccasions];
      return Object.entries(seasonOccasions)
        .filter(([_, value]) => value > 0)
        .map(([key, value]) => ({
          name: key.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
          value
        }))
        .sort((a, b) => b.value - a.value);
    }
    return occasionsData;
  };

  const matrixOccasionsData = selectedSeason 
    ? getOccasionsForSeason(selectedSeason)
    : occasionsData;

  const renderLegendList = (data: any[], category: 'seasons' | 'occasions' | 'types') => {
    return (
      <div className={styles.legendList}>
        {data.map((entry, index) => (
          <div key={index} className={styles.legendItem}>
            <div 
              className={styles.legendColor}
              style={{ backgroundColor: getChartColor(category, entry.name) }}
            />
            <span className={styles.legendLabel}>{entry.name}</span>
            <span className={styles.legendValue}>{entry.value}%</span>
          </div>
        ))}
      </div>
    );
  };

  // Generate gradient based on season percentages
  const generateSeasonGradient = () => {
    const seasonColors = {
      winter: '#a2cbff',
      spring: '#badc82',
      summer: '#fed766',
      autumn: '#d9b1be'
    };
    
    const orderedSeasons = ['winter', 'autumn', 'spring', 'summer'] as const;
    const stops: Array<{ color: string; position: number; percentage: number }> = [];
    let totalPercentage = 0;
    
    // Collect all seasons with their percentages
    orderedSeasons.forEach(season => {
      const percentage = fragrance.seasons[season] || 0;
      if (percentage > 0) {
        stops.push({ color: seasonColors[season], position: totalPercentage, percentage });
        totalPercentage += percentage;
      }
    });
    
    if (stops.length === 0) {
      return 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
    }
    
    // Create smooth gradient with fixed blend zones (5% blend area)
    const blendSize = 20; // Fixed 5% blend zone between colors
    const gradientStops: string[] = [];
    
    stops.forEach((stop, index) => {
      if (index === 0) {
        // First color starts at 0%
        gradientStops.push(`${stop.color} 0%`);
      }
      
      if (index === stops.length - 1) {
        // Last color extends to 100%
        const blendStart = Math.max(0, stop.position - blendSize / 2);
        if (blendStart > stop.position - 1) {
          gradientStops.push(`${stop.color} ${blendStart}%`);
        }
        gradientStops.push(`${stop.color} ${stop.position}%`);
        gradientStops.push(`${stop.color} 100%`);
      } else {
        // Middle colors: blend zone around transition point
        const nextStop = stops[index + 1];
        const transitionPoint = stop.position + stop.percentage;
        const blendStart = transitionPoint - blendSize / 2;
        const blendEnd = transitionPoint + blendSize / 2;
        
        // Current color holds until blend starts
        gradientStops.push(`${stop.color} ${blendStart}%`);
        // Blend to next color
        gradientStops.push(`${nextStop.color} ${blendEnd}%`);
      }
    });
    
    return `linear-gradient(0deg, ${gradientStops.join(', ')})`;
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeButton} onClick={onClose}>×</button>
        
        <div className={styles.header} style={{ background: generateSeasonGradient() }}>
          <div className={styles.imageContainer}>
            <img 
              src={fragrance.imageUrl} 
              alt={`${fragrance.brand} ${fragrance.name}`}
              className={styles.image}
            />
          </div>
          <div className={styles.info}>
            {(() => {
              const combo = getTopCombo(fragrance);
              const shoe = shoeLabels[combo.shoe];
              const clothing = clothingLabels[combo.temp];
              return (
                <div className={styles.formalityBadge}>
                  <span className={styles.formalityIcon}>{shoe.emoji}</span>
                  <span className={styles.formalityText}>{shoe.label} with {clothing.emoji} {clothing.label}</span>
                </div>
              );
            })()}
            <h2 className={styles.brand}>{fragrance.brand}</h2>
            <h3 className={styles.name}>{fragrance.name}</h3>
            {fragrance.middayTouchUp !== undefined && (
              <div className={`${styles.touchUpBadge} ${fragrance.middayTouchUp ? styles.needsTouchUp : styles.noTouchUp}`}>
                <span className={styles.touchUpIcon}>{fragrance.middayTouchUp ? '💧' : '✅'}</span>
                <span className={styles.touchUpText}>
                  {fragrance.middayTouchUp ? 'Bring for touch-up' : 'Lasts all day'}
                </span>
              </div>
            )}
            {(onRatingChange || onHiddenChange) && (
              <div className={styles.ratingContainer}>
                {onRatingChange && (
                  <div className={styles.starRating}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        className={`${styles.starButton} ${
                          (hoverStar !== null ? star <= hoverStar : (fragrance.rating ?? 0) >= star) ? styles.filled : ''
                        }`}
                        onClick={() => handleStarClick(star)}
                        onMouseEnter={() => setHoverStar(star)}
                        onMouseLeave={() => setHoverStar(null)}
                        aria-label={`${star} star${star > 1 ? 's' : ''}`}
                        title={`${star} star${star > 1 ? 's' : ''}`}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                )}
                {onHiddenChange && (
                  <button
                    className={`${styles.hideButton} ${fragrance.hidden ? styles.active : ''}`}
                    onClick={handleHideClick}
                    aria-label={fragrance.hidden ? 'Unhide' : 'Hide'}
                    title={fragrance.hidden ? 'Unhide fragrance' : 'Hide fragrance'}
                  >
                    {fragrance.hidden ? '👁️' : '🙈'}
                    <span className={styles.hideLabel}>{fragrance.hidden ? 'Unhide' : 'Hide'}</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Wearability Spectrum */}
        <WearabilitySpectrum wearability={fragrance.wearability} />

        {/* Season-Occasion Matrix */}
        <div className={styles.matrixSection}>
          <h4 className={styles.matrixTitle}>Season × Occasion</h4>
          <div className={styles.matrixContainer}>
            <div className={styles.seasonButtons}>
              {seasonButtons.map((season) => (
                <button
                  key={season.key}
                  className={`${styles.seasonButton} ${selectedSeason === season.key ? styles.active : ''}`}
                  onClick={() => setSelectedSeason(selectedSeason === season.key ? null : season.key)}
                  style={{
                    borderLeftColor: getChartColor('seasons', season.name)
                  }}
                >
                  <span className={styles.seasonName}>{season.name}</span>
                  <span className={styles.seasonValue}>{season.value}%</span>
                </button>
              ))}
            </div>
            <div className={styles.matrixChart}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={matrixOccasionsData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {matrixOccasionsData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={getChartColor('occasions', entry.name)} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `${value}%`} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className={styles.charts}>
          {/* Occasions Chart */}
          <div className={styles.chartSection}>
            <h4>Occasions</h4>
            <div className={styles.chartContainer}>
              <div className={styles.chartWrapper}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={occasionsData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={false}
                      outerRadius={70}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {occasionsData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={getChartColor('occasions', entry.name)} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `${value}%`} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              {renderLegendList(occasionsData, 'occasions')}
            </div>
          </div>

          {/* Seasons Chart */}
          <div className={styles.chartSection}>
            <h4>Seasons</h4>
            <div className={styles.chartContainer}>
              <div className={styles.chartWrapper}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={seasonsData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={false}
                      outerRadius={70}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {seasonsData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={getChartColor('seasons', entry.name)} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `${value}%`} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              {renderLegendList(seasonsData, 'seasons')}
            </div>
          </div>

          {/* Types Chart */}
          <div className={styles.chartSection}>
            <h4>Fragrance Types</h4>
            <div className={styles.chartContainer}>
              <div className={styles.chartWrapper}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={typesData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={false}
                      outerRadius={70}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {typesData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={getChartColor('types', entry.name)} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `${value}%`} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              {renderLegendList(typesData, 'types')}
            </div>
          </div>
        </div>

        {/* Review Section */}
        {fragrance.review && (
          <div className={styles.reviewSection}>
            <h4 className={styles.reviewTitle}>Review & Notes</h4>
            <div className={styles.reviewText}>
              {fragrance.review}
            </div>
          </div>
        )}

        <div className={styles.actions}>
          {!showDeleteConfirm ? (
            <>
              <button className={styles.editButton} onClick={handleEditClick}>
                Edit Fragrance
              </button>
              <button className={styles.deleteButton} onClick={handleDeleteClick}>
                Delete Fragrance
              </button>
            </>
          ) : (
            <div className={styles.confirmDelete}>
              <p className={styles.confirmText}>Are you sure you want to delete this fragrance?</p>
              <div className={styles.confirmButtons}>
                <button className={styles.cancelButton} onClick={handleCancelDelete}>
                  Cancel
                </button>
                <button className={styles.confirmButton} onClick={handleConfirmDelete}>
                  Yes, Delete
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FragranceDetail;
