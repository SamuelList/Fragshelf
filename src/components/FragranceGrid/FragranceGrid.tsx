import { Fragrance } from '../../types/fragrance';
import FragranceCard from '../FragranceCard/FragranceCard';
import styles from './FragranceGrid.module.scss';

interface FragranceGridProps {
  fragrances: Fragrance[];
  onFragranceClick: (fragrance: Fragrance) => void;
  onLikeChange?: (id: string, liked: boolean | null) => void;
}

const FragranceGrid = ({ fragrances, onFragranceClick, onLikeChange }: FragranceGridProps) => {
  return (
    <div className={styles.grid}>
      {fragrances.map((fragrance) => (
        <FragranceCard 
          key={fragrance.id} 
          fragrance={fragrance}
          onClick={onFragranceClick}
          onLikeChange={onLikeChange}
        />
      ))}
    </div>
  );
};

export default FragranceGrid;
