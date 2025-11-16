import { useState } from 'react';
import styles from './FilterBar.module.scss';
import SeasonOccasionFilter from '../SeasonOccasionFilter/SeasonOccasionFilter';

interface FilterBarProps {
  seasonFilters: Record<string, number>;
  occasionFilters: Record<string, number>;
  onSeasonFilterChange: (filters: Record<string, number>) => void;
  onOccasionFilterChange: (filters: Record<string, number>) => void;
  activeSeasonCount: number;
  activeOccasionCount: number;
  resultCount: number;
}

const FilterBar = ({
  seasonFilters,
  occasionFilters,
  onSeasonFilterChange,
  onOccasionFilterChange,
  activeSeasonCount,
  activeOccasionCount,
  resultCount
}: FilterBarProps) => {
  const [openDropdown, setOpenDropdown] = useState<'season' | 'occasion' | null>(null);

  const handleSeasonClick = () => {
    setOpenDropdown(openDropdown === 'season' ? null : 'season');
  };

  const handleOccasionClick = () => {
    setOpenDropdown(openDropdown === 'occasion' ? null : 'occasion');
  };

  const handleClose = () => {
    setOpenDropdown(null);
  };

  return (
    <>
      <div className={styles.filterBar}>
        <button 
          className={`${styles.filterButton} ${openDropdown === 'season' ? styles.active : ''}`}
          onClick={handleSeasonClick}
        >
          Season {activeSeasonCount > 0 && <span className={styles.badge}>{activeSeasonCount}</span>}
        </button>
        <button 
          className={`${styles.filterButton} ${openDropdown === 'occasion' ? styles.active : ''}`}
          onClick={handleOccasionClick}
        >
          Occasion {activeOccasionCount > 0 && <span className={styles.badge}>{activeOccasionCount}</span>}
        </button>
      </div>

      {openDropdown === 'season' && (
        <SeasonOccasionFilter
          type="season"
          isOpen={true}
          onClose={handleClose}
          filters={seasonFilters}
          onChange={onSeasonFilterChange}
          resultCount={resultCount}
        />
      )}

      {openDropdown === 'occasion' && (
        <SeasonOccasionFilter
          type="occasion"
          isOpen={true}
          onClose={handleClose}
          filters={occasionFilters}
          onChange={onOccasionFilterChange}
          resultCount={resultCount}
        />
      )}
    </>
  );
};

export default FilterBar;
