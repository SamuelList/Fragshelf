import { WearabilityScores } from '../../types/fragrance';
import styles from './WearabilitySpectrum.module.scss';

interface WearabilitySpectrumProps {
  wearability?: WearabilityScores;
}

const WearabilitySpectrum = ({ wearability }: WearabilitySpectrumProps) => {
  // Provide default values if wearability is undefined
  const { special_occasion = 50, daily_wear = 50 } = wearability || {};
  
  // Calculate position: 0% (far left) = 100% special occasion, 100% (far right) = 100% daily wear
  const markerPosition = daily_wear;

  return (
    <div className={styles.container}>
      <h3 className={styles.title}>Wearability</h3>
      <div className={styles.spectrum}>
        <div className={styles.labels}>
          <span className={styles.leftLabel}>Special Occasion</span>
          <span className={styles.rightLabel}>Daily Wear</span>
        </div>
        <div className={styles.bar}>
          <div className={styles.gradient} />
          <div 
            className={styles.marker} 
            style={{ left: `${markerPosition}%` }}
            title={`${special_occasion}% Special Occasion / ${daily_wear}% Daily Wear`}
          >
            <div className={styles.markerLine} />
          </div>
        </div>
        <div className={styles.percentages}>
          <span>{special_occasion}%</span>
          <span>{daily_wear}%</span>
        </div>
      </div>
    </div>
  );
};

export default WearabilitySpectrum;
