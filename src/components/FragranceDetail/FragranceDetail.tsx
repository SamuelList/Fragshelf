import { useState } from 'react';
import { Fragrance } from '../../types/fragrance';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import styles from './FragranceDetail.module.scss';

interface FragranceDetailProps {
  fragrance: Fragrance;
  onClose: () => void;
  onDelete: (id: string) => void;
  onEdit: (fragrance: Fragrance) => void;
}

const COLORS = {
  seasons: {
    spring: '#90EE90',  // Light green
    summer: '#FFD700',  // Gold/Yellow
    autumn: '#FF8C00',  // Dark orange
    winter: '#4682B4'   // Steel blue
  },
  occasions: {
    daily: '#87CEEB',       // Sky blue
    business: '#708090',    // Slate gray
    leisure: '#98D8C8',     // Mint green
    sport: '#FF6347',       // Tomato red
    evening: '#9370DB',     // Medium purple (lighter)
    'night out': '#FF1493'  // Deep pink (brighter)
  },
  types: {
    woody: '#8B4513',       // Saddle brown
    fresh: '#00CED1',       // Dark turquoise
    citrus: '#FFA500',      // Orange
    spicy: '#DC143C',       // Crimson
    oriental: '#DAA520',    // Goldenrod
    floral: '#FF69B4',      // Hot pink
    fruity: '#FF1493',      // Deep pink
    aquatic: '#1E90FF',     // Dodger blue
    gourmand: '#D2691E',    // Chocolate
    green: '#32CD32',       // Lime green (brighter)
    powdery: '#E6E6FA',     // Lavender
    leathery: '#8B4513',    // Saddle brown
    smoky: '#808080',       // Gray (lighter)
    resinous: '#CD853F',    // Peru
    sweet: '#FFB6C1',       // Light pink
    earthy: '#A0522D',      // Sienna
    creamy: '#F5DEB3',      // Wheat (darker)
    fougere: '#6B8E23',     // Olive drab
    chypre: '#556B2F',      // Dark olive green
    animalic: '#A0522D',    // Sienna
    synthetic: '#C0C0C0'    // Silver
  }
};

// Helper function to get color with case-insensitive key lookup
function getColor(category: keyof typeof COLORS, key: string): string {
  const colorMap = COLORS[category] as Record<string, string>;
  const lowerKey = key.toLowerCase();
  return colorMap[lowerKey] || colorMap[key] || '#8884d8';
}

const FragranceDetail = ({ fragrance, onClose, onDelete, onEdit }: FragranceDetailProps) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

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
    }));

  const occasionsData = Object.entries(fragrance.occasions)
    .filter(([_, value]) => value > 0)
    .map(([key, value]) => ({
      name: key.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
      value
    }));

  const typesData = Object.entries(fragrance.types)
    .filter(([_, value]) => value > 0)
    .map(([key, value]) => ({
      name: key,
      value
    }))
    .sort((a, b) => b.value - a.value);

  const renderCustomLabel = (entry: any) => {
    return `${entry.value}%`;
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
          </div>
        </div>

        <div className={styles.charts}>
          {/* Seasons Chart */}
          <div className={styles.chartSection}>
            <h4>Seasons</h4>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={seasonsData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={renderCustomLabel}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {seasonsData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getColor('seasons', entry.name)} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `${value}%`} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Occasions Chart */}
          <div className={styles.chartSection}>
            <h4>Occasions</h4>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={occasionsData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={renderCustomLabel}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {occasionsData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getColor('occasions', entry.name)} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `${value}%`} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Types Chart */}
          <div className={styles.chartSection}>
            <h4>Fragrance Types</h4>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={typesData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={renderCustomLabel}
                  outerRadius={90}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {typesData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getColor('types', entry.name)} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `${value}%`} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
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
