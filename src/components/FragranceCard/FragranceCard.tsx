import { Fragrance } from '../../types/fragrance';
import styles from './FragranceCard.module.scss';

interface FragranceCardProps {
  fragrance: Fragrance;
  onClick: (fragrance: Fragrance) => void;
  onLikeChange?: (id: string, liked: boolean | null) => void;
}

const FragranceCard = ({ fragrance, onClick, onLikeChange }: FragranceCardProps) => {
  const handleThumbsClick = (e: React.MouseEvent, liked: boolean | null) => {
    e.stopPropagation();
    if (onLikeChange) {
      onLikeChange(fragrance.id, liked);
    }
  };

  return (
    <div className={styles.card} onClick={() => onClick(fragrance)}>
      <div className={styles.imageContainer}>
        <img 
          src={fragrance.imageUrl} 
          alt={`${fragrance.brand} ${fragrance.name}`}
          className={styles.image}
        />
      </div>
      <div className={styles.info}>
        <p className={styles.brand}>{fragrance.brand}</p>
        <p className={styles.name}>{fragrance.name}</p>
      </div>
      {onLikeChange && (
        <div className={styles.thumbsContainer}>
          <button
            className={`${styles.thumbButton} ${fragrance.liked === true ? styles.active : ''}`}
            onClick={(e) => handleThumbsClick(e, fragrance.liked === true ? null : true)}
            aria-label="Like"
            title="Like"
          >
            👍
          </button>
          <button
            className={`${styles.thumbButton} ${fragrance.liked === false ? styles.active : ''}`}
            onClick={(e) => handleThumbsClick(e, fragrance.liked === false ? null : false)}
            aria-label="Dislike"
            title="Dislike"
          >
            👎
          </button>
        </div>
      )}
    </div>
  );
};

export default FragranceCard;
