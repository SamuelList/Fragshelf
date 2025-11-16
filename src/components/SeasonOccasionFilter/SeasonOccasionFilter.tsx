import { useState } from 'react';
import styles from './SeasonOccasionFilter.module.scss';

interface SeasonOccasionFilterProps {
  type: 'season' | 'occasion';
  isOpen: boolean;
  onClose: () => void;
  filters: Record<string, number>;
  onChange: (filters: Record<string, number>) => void;
  resultCount: number;
}

const SEASON_OPTIONS = ['spring', 'summer', 'autumn', 'winter'];
const OCCASION_OPTIONS = ['daily', 'business', 'leisure', 'sport', 'evening', 'night out'];

const SeasonOccasionFilter = ({ type, isOpen, onClose, filters, onChange, resultCount }: SeasonOccasionFilterProps) => {
  const options = type === 'season' ? SEASON_OPTIONS : OCCASION_OPTIONS;

  const handleSliderChange = (option: string, value: number) => {
    onChange({ ...filters, [option]: value });
  };

  const activeFilterCount = Object.values(filters).filter(v => v > 0).length;

  return (
    <>
      <div className={styles.overlay} onClick={onClose} />
      <div className={styles.dropdown}>
        <div className={styles.header}>
          <h3>{type === 'season' ? 'Filter by Season' : 'Filter by Occasion'}</h3>
          {activeFilterCount > 0 && (
            <span className={styles.badge}>{activeFilterCount}</span>
          )}
        </div>
        
        <div className={styles.sliders}>
          {options.map(option => (
            <div key={option} className={styles.sliderGroup}>
              <div className={styles.sliderHeader}>
                <label htmlFor={`${type}-${option}`}>
                  {option.charAt(0).toUpperCase() + option.slice(1)}
                </label>
                <span className={styles.value}>{filters[option]}%</span>
              </div>
              <input
                type="range"
                id={`${type}-${option}`}
                className={styles.slider}
                min="0"
                max="100"
                step="5"
                value={filters[option]}
                onChange={(e) => handleSliderChange(option, Number(e.target.value))}
              />
              <div className={styles.marks}>
                <span>0%</span>
                <span>25%</span>
                <span>50%</span>
                <span>75%</span>
                <span>100%</span>
              </div>
            </div>
          ))}
        </div>

        <div className={styles.results}>
          {resultCount} {resultCount === 1 ? 'fragrance' : 'fragrances'} match
        </div>
      </div>
    </>
  );
};

export default SeasonOccasionFilter;
