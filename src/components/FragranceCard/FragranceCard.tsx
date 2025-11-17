import { Fragrance } from '../../types/fragrance';
import styles from './FragranceCard.module.scss';

interface FragranceCardProps {
  fragrance: Fragrance;
  onClick: (fragrance: Fragrance) => void;
}

const FragranceCard = ({ fragrance, onClick }: FragranceCardProps) => {
  return (
    <div className={styles.card} onClick={() => onClick(fragrance)}>
      {fragrance.liked !== undefined && fragrance.liked !== null && (
        <div className={styles.likeBadge}>
          {fragrance.liked ? '👍' : '👎'}
        </div>
      )}
      <div className={styles.imageContainer}>
        <img 
          src={fragrance.imageUrl} 
          alt={`${fragrance.brand} ${fragrance.name}`}
          className={styles.image}
        />
      </div>
      <div className={styles.info}>
        <p className={styles.name}>{fragrance.name}</p>
        <p className={styles.brand}>{fragrance.brand}</p>
      </div>
    </div>
  );
};

export default FragranceCard;
