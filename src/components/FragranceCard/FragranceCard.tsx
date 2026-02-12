import { Fragrance } from '../../types/fragrance';
import styles from './FragranceCard.module.scss';

interface FragranceCardProps {
  fragrance: Fragrance;
  onClick: (fragrance: Fragrance) => void;
}

const FragranceCard = ({ fragrance, onClick }: FragranceCardProps) => {
  return (
    <div className={`${styles.card} ${fragrance.hidden ? styles.hiddenCard : ''}`} onClick={() => onClick(fragrance)}>
      {fragrance.hidden && (
        <div className={styles.hiddenBadge}>
          🙈
        </div>
      )}
      {fragrance.rating != null && fragrance.rating > 0 && !fragrance.hidden && (
        <div className={styles.ratingBadge}>
          <span className={styles.ratingStars}>{'★'.repeat(fragrance.rating)}</span>
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
