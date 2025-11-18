import { useState } from 'react';
import { Fragrance } from '../../types/fragrance';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { getChartColor } from '../../constants/colors';
import styles from './FragranceDetail.module.scss';

interface FragranceDetailProps {
  fragrance: Fragrance;
  onClose: () => void;
  onDelete: (id: string) => void;
  onEdit: (fragrance: Fragrance) => void;
  onLikeChange?: (id: string, liked: boolean | null) => void;
}

const FragranceDetail = ({ fragrance, onClose, onDelete, onEdit, onLikeChange }: FragranceDetailProps) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleLikeClick = (liked: boolean | null) => {
    if (onLikeChange) {
      onLikeChange(fragrance.id, liked);
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
    
    const orderedSeasons = ['winter', 'spring', 'summer', 'autumn'] as const;
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
    
    return `linear-gradient(135deg, ${gradientStops.join(', ')})`;
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
            <h2 className={styles.brand}>{fragrance.brand}</h2>
            <h3 className={styles.name}>{fragrance.name}</h3>
            {onLikeChange && (
              <div className={styles.thumbsContainer}>
                <button
                  className={`${styles.thumbButton} ${fragrance.liked === true ? styles.active : ''}`}
                  onClick={() => handleLikeClick(fragrance.liked === true ? null : true)}
                  aria-label="Like"
                  title="Like"
                >
                  👍
                </button>
                <button
                  className={`${styles.thumbButton} ${fragrance.liked === false ? styles.active : ''}`}
                  onClick={() => handleLikeClick(fragrance.liked === false ? null : false)}
                  aria-label="Dislike"
                  title="Dislike"
                >
                  👎
                </button>
              </div>
            )}
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
