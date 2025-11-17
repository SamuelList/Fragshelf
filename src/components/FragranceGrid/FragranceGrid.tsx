import { Fragrance } from '../../types/fragrance';
import FragranceCard from '../FragranceCard/FragranceCard';
import styles from './FragranceGrid.module.scss';

interface FragranceGridProps {
  fragrances: Fragrance[];
  onFragranceClick: (fragrance: Fragrance) => void;
}

const FragranceGrid = ({ fragrances, onFragranceClick }: FragranceGridProps) => {
  return (
    <div className={styles.grid}>
      {fragrances.map((fragrance) => (
        <FragranceCard 
          key={fragrance.id} 
          fragrance={fragrance}
          onClick={onFragranceClick}
        />
      ))}
    </div>
  );
};

export default FragranceGrid;
