import { FragranceType } from '../../types/fragrance';
import styles from './TypeFilter.module.scss';

interface TypeFilterProps {
  selectedType: FragranceType | null;
  onTypeSelect: (type: FragranceType | null) => void;
  availableTypes: FragranceType[];
}

const TypeFilter = ({ selectedType, onTypeSelect, availableTypes }: TypeFilterProps) => {
  // Only show filter if there are fragrances
  if (availableTypes.length === 0) {
    return null;
  }

  return (
    <div className={styles.container}>
      <div className={styles.scrollContainer}>
        <button
          className={`${styles.typeChip} ${!selectedType ? styles.selected : ''}`}
          onClick={() => onTypeSelect(null)}
        >
          <span className={styles.typeName}>All</span>
        </button>
        {availableTypes.map((type) => {
          const isSelected = selectedType === type;
          return (
            <button
              key={type}
              className={`${styles.typeChip} ${isSelected ? styles.selected : ''}`}
              onClick={() => onTypeSelect(type)}
            >
              <span className={styles.typeName}>{type}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default TypeFilter;
