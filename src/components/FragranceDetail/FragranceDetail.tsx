import { useState } from 'react';
import { Fragrance } from '../../types/fragrance';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { getChartColor } from '../../constants/colors';
import WearabilitySpectrum from '../WearabilitySpectrum/WearabilitySpectrum';
import styles from './FragranceDetail.module.scss';

type TemperatureZone = 'highHeat' | 'transitionalMild' | 'deepCold';
type ShoeCategory = 'Athletic' | 'WorkBoots' | 'CasualSneakers' | 'DressShoes';

const shoeReadable: Record<ShoeCategory, string> = {
  Athletic: 'Athletic Shoes',
  WorkBoots: 'Work Boots',
  CasualSneakers: 'Casual Sneakers',
  DressShoes: 'Dress Shoes'
};

const tempReadable: Record<TemperatureZone, string> = {
  highHeat: 'T-Shirt Weather',
  transitionalMild: 'Light Jacket Weather',
  deepCold: 'Coat Weather'
};

const getTop3Combos = (frag: Fragrance): Array<{ shoe: ShoeCategory; temp: TemperatureZone; score: number }> => {
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

  // Generate all combos, score them, return top 3
  const combos: Array<{ shoe: ShoeCategory; temp: TemperatureZone; score: number }> = [];
  for (const shoe of shoeScores) {
    for (const temp of tempScores) {
      combos.push({ shoe: shoe.key, temp: temp.key, score: shoe.score * temp.score });
    }
  }
  combos.sort((a, b) => b.score - a.score);
  return combos.slice(0, 3);
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

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeButton} onClick={onClose}>×</button>
        
        <div className={styles.header}>
          <div className={styles.imageContainer}>
            <img 
              src={fragrance.imageUrl} 
              alt={`${fragrance.brand} ${fragrance.name}`}
              className={styles.image}
            />
          </div>
          <div className={styles.info}>
            <h2 className={styles.brand}>{fragrance.brand}</h2>
            <h3 className={styles.name}>{fragrance.name}</h3>
            
            {fragrance.middayTouchUp !== undefined && (
              <div className={`${styles.badge} ${styles.touchUpBadge} ${fragrance.middayTouchUp ? styles.needsTouchUp : styles.noTouchUp}`}>
                <span className={styles.touchUpText}>
                  {fragrance.middayTouchUp ? 'Needs midday touch-up' : 'Lasts all day'}
                </span>
              </div>
            )}

            <div className={styles.comboList}>
              {getTop3Combos(fragrance).map((combo, i) => (
                <div key={i} className={`${styles.comboItem} ${i === 0 ? styles.comboPrimary : ''}`}>
                  <span className={styles.comboRank}>{i + 1}.</span>
                  <span className={styles.comboText}>{shoeReadable[combo.shoe]} &middot; {tempReadable[combo.temp]}</span>
                </div>
              ))}
            </div>

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
                        onPointerEnter={(e) => { if (e.pointerType === 'mouse') setHoverStar(star); }}
                        onPointerLeave={(e) => { if (e.pointerType === 'mouse') setHoverStar(null); }}
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
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        <div className={styles.content}>
          {/* Wearability Spectrum */}
          <WearabilitySpectrum wearability={fragrance.wearability} />

          {/* Season-Occasion Matrix */}
          <div>
            <h4 className={styles.sectionTitle}>When to wear</h4>
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
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {matrixOccasionsData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={getChartColor('occasions', entry.name)} stroke="none" />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value) => `${value}%`}
                      contentStyle={{ borderRadius: '12px', background: 'var(--bg-secondary)', border: 'none', color: 'var(--text-primary)' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className={styles.chartsGrid}>
            {/* Occasions Chart */}
            <div className={styles.chartCard}>
              <h4 className={styles.chartTitle}>Occasions</h4>
              <div style={{ width: '100%', height: 160 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={occasionsData}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={60}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {occasionsData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={getChartColor('occasions', entry.name)} stroke="none" />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `${value}%`} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              {renderLegendList(occasionsData, 'occasions')}
            </div>

            {/* Seasons Chart */}
            <div className={styles.chartCard}>
              <h4 className={styles.chartTitle}>Seasons</h4>
              <div style={{ width: '100%', height: 160 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={seasonsData}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={60}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {seasonsData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={getChartColor('seasons', entry.name)} stroke="none" />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `${value}%`} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              {renderLegendList(seasonsData, 'seasons')}
            </div>

            {/* Types Chart */}
            <div className={styles.chartCard}>
              <h4 className={styles.chartTitle}>Fragrance Types</h4>
              <div style={{ width: '100%', height: 160 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={typesData}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={60}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {typesData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={getChartColor('types', entry.name)} stroke="none" />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `${value}%`} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              {renderLegendList(typesData, 'types')}
            </div>
          </div>

          {/* Review Section */}
          {fragrance.review && (
            <div className={styles.reviewSection}>
              <h4 className={styles.sectionTitle}>Notes & Review</h4>
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
                  Delete
                </button>
              </>
            ) : (
              <div className={styles.confirmDelete}>
                <p className={styles.confirmText}>Are you sure?</p>
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
    </div>
  );
};

export default FragranceDetail;
