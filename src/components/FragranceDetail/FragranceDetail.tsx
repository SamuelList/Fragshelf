import { useState } from 'react';
import { Fragrance } from '../../types/fragrance';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import styles from './FragranceDetail.module.scss';

interface FragranceDetailProps {
  fragrance: Fragrance;
  onClose: () => void;
  onDelete: (id: string) => void;
}

const COLORS = {
  seasons: {
    Spring: '#90EE90', // Light green
    Summer: '#FFD700', // Gold/Yellow
    Autumn: '#FF8C00', // Dark orange
    Winter: '#4682B4'  // Steel blue
  },
  occasions: {
    Daily: '#87CEEB',      // Sky blue
    Business: '#708090',   // Slate gray
    Leisure: '#98D8C8',    // Mint green
    Sport: '#FF6347',      // Tomato red
    Evening: '#4B0082',    // Indigo
    'Night Out': '#8B008B' // Dark magenta
  },
  types: {
    Woody: '#8B4513',      // Saddle brown
    Fresh: '#00CED1',      // Dark turquoise
    Citrus: '#FFA500',     // Orange
    Spicy: '#DC143C',      // Crimson
    Oriental: '#DAA520',   // Goldenrod
    Floral: '#FF69B4',     // Hot pink
    Fruity: '#FF1493',     // Deep pink
    Aquatic: '#1E90FF',    // Dodger blue
    Gourmand: '#D2691E',   // Chocolate
    Green: '#228B22',      // Forest green
    Powdery: '#E6E6FA',    // Lavender
    Leathery: '#654321',   // Dark brown
    Smoky: '#696969',      // Dim gray
    Resinous: '#CD853F',   // Peru
    Sweet: '#FFB6C1',      // Light pink
    Earthy: '#A0522D',     // Sienna
    Creamy: '#FFFACD',     // Lemon chiffon
    Fougere: '#6B8E23',    // Olive drab
    Chypre: '#556B2F',     // Dark olive green
    Animalic: '#8B4726',   // Saddle brown (darker)
    Synthetic: '#C0C0C0'   // Silver
  }
};

const FragranceDetail = ({ fragrance, onClose, onDelete }: FragranceDetailProps) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

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
                    <Cell key={`cell-${index}`} fill={COLORS.seasons[entry.name as keyof typeof COLORS.seasons]} />
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
                    <Cell key={`cell-${index}`} fill={COLORS.occasions[entry.name as keyof typeof COLORS.occasions]} />
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
                    <Cell key={`cell-${index}`} fill={COLORS.types[entry.name as keyof typeof COLORS.types]} />
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
            <button className={styles.deleteButton} onClick={handleDeleteClick}>
              Delete Fragrance
            </button>
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
