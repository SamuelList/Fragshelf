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

  const handleDeleteClick = () => {
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = () => {
    onDelete(fragrance.id);
    onClose();
  };

  // Generate gradient for the ambient background glow
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
    
    // Simpler gradient logic for the background blur
    const gradientStops = stops.map(stop => 
      `${stop.color} ${stop.position}%`
    );
    
    // Add final stop if needed
    if (stops[stops.length - 1].position + stops[stops.length - 1].percentage < 100) {
        gradientStops.push(`${stops[stops.length - 1].color} 100%`);
    }

    return `linear-gradient(180deg, ${gradientStops.join(', ')})`;
  };

  // Data preparation
  const seasonsData = Object.entries(fragrance.seasons)
    .filter(([_, value]) => value > 0)
    .map(([key, value]) => ({
      name: key.charAt(0).toUpperCase() + key.slice(1),
      value
    })).sort((a, b) => b.value - a.value);

  const occasionsData = Object.entries(fragrance.occasions)
    .filter(([_, value]) => value > 0)
    .map(([key, value]) => ({
      name: key.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
      value
    })).sort((a, b) => b.value - a.value);

  const typesData = Object.entries(fragrance.types)
    .filter(([_, value]) => value > 0)
    .map(([key, value]) => ({
      name: key,
      value
    })).sort((a, b) => b.value - a.value);

  const renderLegendList = (data: any[], category: 'seasons' | 'occasions' | 'types') => (
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

  const renderPieChart = (data: any[], category: 'seasons' | 'occasions' | 'types') => (
    <div className={styles.chartWrapper}>
        <ResponsiveContainer width="100%" height="100%">
            <PieChart>
            <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={50} // Donut chart looks more modern
                outerRadius={75}
                paddingAngle={4} // Gaps between sections for "sleek" look
                dataKey="value"
                stroke="none" // Remove default stroke
            >
                {data.map((entry, index) => (
                <Cell 
                    key={`cell-${index}`} 
                    fill={getChartColor(category, entry.name)} 
                    style={{ outline: 'none' }}
                />
                ))}
            </Pie>
            <Tooltip 
                formatter={(value) => `${value}%`} 
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
            />
            </PieChart>
        </ResponsiveContainer>
    </div>
  );

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Ambient Glow Background */}
        <div 
            className={styles.ambientGlow} 
            style={{ background: generateSeasonGradient() }} 
        />
        
        {/* Mobile Drag Handle */}
        <div className={styles.dragHandle} />
        
        <button className={styles.closeButton} onClick={onClose}>×</button>

        <div className={styles.contentScroll}>
            <div className={styles.header}>
                <div className={styles.imageContainer}>
                    <img 
                    src={fragrance.imageUrl} 
                    alt={`${fragrance.brand} ${fragrance.name}`}
                    className={styles.image}
                    />
                </div>
                <h2 className={styles.brand}>{fragrance.brand}</h2>
                <h3 className={styles.name}>{fragrance.name}</h3>
                
                {onLikeChange && (
                    <div className={styles.thumbsContainer}>
                    <button
                        className={`${styles.thumbButton} ${fragrance.liked === true ? styles.active : ''}`}
                        onClick={() => handleLikeClick(fragrance.liked === true ? null : true)}
                        aria-label="Like"
                    >
                        👍
                    </button>
                    <button
                        className={`${styles.thumbButton} ${fragrance.liked === false ? styles.active : ''}`}
                        onClick={() => handleLikeClick(fragrance.liked === false ? null : false)}
                        aria-label="Dislike"
                    >
                        👎
                    </button>
                    </div>
                )}
            </div>

            <div className={styles.chartsScroller}>
                {/* Occasions Card */}
                <div className={styles.chartCard}>
                    <h4>Occasions</h4>
                    {renderPieChart(occasionsData, 'occasions')}
                    {renderLegendList(occasionsData, 'occasions')}
                </div>

                {/* Seasons Card */}
                <div className={styles.chartCard}>
                    <h4>Seasons</h4>
                    {renderPieChart(seasonsData, 'seasons')}
                    {renderLegendList(seasonsData, 'seasons')}
                </div>

                {/* Types Card */}
                <div className={styles.chartCard}>
                    <h4>Types</h4>
                    {renderPieChart(typesData, 'types')}
                    {renderLegendList(typesData, 'types')}
                </div>
            </div>
        </div>

        {/* Sticky Bottom Actions */}
        <div className={styles.actions}>
          {!showDeleteConfirm ? (
            <>
              <button className={styles.editButton} onClick={() => onEdit(fragrance)}>
                Edit
              </button>
              <button className={styles.deleteButton} onClick={handleDeleteClick}>
                Delete
              </button>
            </>
          ) : (
            <div className={styles.confirmDelete}>
              <p className={styles.confirmText}>Delete this fragrance?</p>
              <div className={styles.confirmButtons}>
                <button className={styles.cancelButton} onClick={() => setShowDeleteConfirm(false)}>
                  Cancel
                </button>
                <button className={styles.confirmButton} onClick={handleConfirmDelete}>
                  Delete
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