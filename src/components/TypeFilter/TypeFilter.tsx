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
          <span className={styles.typeIcon}>🌟</span>
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
              <span className={styles.typeIcon}>{getTypeEmoji(type)}</span>
              <span className={styles.typeName}>{type}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

// Fun emoji mapping for each type
function getTypeEmoji(type: FragranceType): string {
  const emojiMap: Record<FragranceType, string> = {
    'Woody': '🌲',
    'Fresh': '💨',
    'Citrus': '🍋',
    'Spicy': '🌶️',
    'Oriental': '🏮',
    'Floral': '🌸',
    'Fruity': '🍓',
    'Aquatic': '🌊',
    'Gourmand': '🍰',
    'Green': '🍃',
    'Powdery': '✨',
    'Leathery': '🧥',
    'Smoky': '💨',
    'Resinous': '🍯',
    'Sweet': '🍬',
    'Earthy': '🌍',
    'Creamy': '🥛',
    'Fougere': '🌿',
    'Chypre': '🍂',
    'Animalic': '🦌',
    'Synthetic': '⚗️'
  };
  return emojiMap[type] || '🔮';
}

export default TypeFilter;
