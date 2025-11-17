import { useState } from 'react';
import { Fragrance } from '../../types/fragrance';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
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
                    <Cell key={`cell-${index}`} fill={getChartColor('seasons', entry.name)} />
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
                    <Cell key={`cell-${index}`} fill={getChartColor('occasions', entry.name)} />
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
                    <Cell key={`cell-${index}`} fill={getChartColor('types', entry.name)} />
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
