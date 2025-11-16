import { useState, FormEvent } from 'react';
import { Fragrance, FragranceType } from '../../types/fragrance';
import styles from './AddFragranceForm.module.scss';

interface AddFragranceFormProps {
  onClose: () => void;
  onSubmit: (fragrance: Omit<Fragrance, 'id'>) => void;
}

const allFragranceTypes: FragranceType[] = [
  'Animalic', 'Aquatic', 'Floral', 'Chypre', 'Creamy', 'Earthy',
  'Fougere', 'Fresh', 'Fruity', 'Gourmand', 'Green', 'Woody',
  'Leathery', 'Oriental', 'Powdery', 'Smoky', 'Resinous',
  'Sweet', 'Synthetic', 'Spicy', 'Citrus'
];

const AddFragranceForm = ({ onClose, onSubmit }: AddFragranceFormProps) => {
  const [brand, setBrand] = useState('');
  const [name, setName] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  // Season state
  const [spring, setSpring] = useState(25);
  const [summer, setSummer] = useState(25);
  const [autumn, setAutumn] = useState(25);
  const [winter, setWinter] = useState(25);

  // Occasion state
  const [daily, setDaily] = useState(20);
  const [business, setBusiness] = useState(20);
  const [leisure, setLeisure] = useState(20);
  const [sport, setSport] = useState(10);
  const [evening, setEvening] = useState(20);
  const [nightOut, setNightOut] = useState(10);

  // Type state (using an object for all 20 types)
  const [typeScores, setTypeScores] = useState<Record<FragranceType, number>>({
    Animalic: 0, Aquatic: 0, Floral: 0, Chypre: 0, Creamy: 0, Earthy: 0,
    Fougere: 0, Fresh: 25, Fruity: 0, Gourmand: 0, Green: 0, Woody: 50,
    Leathery: 0, Oriental: 0, Powdery: 0, Smoky: 0, Resinous: 25,
    Sweet: 0, Synthetic: 0, Spicy: 0, Citrus: 0
  });

  const handleTypeChange = (type: FragranceType, value: number) => {
    setTypeScores(prev => ({ ...prev, [type]: value }));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    
    const newFragrance = {
      brand,
      name,
      imageUrl: imageUrl || '/images/placeholder.jpg',
      seasons: { spring, summer, autumn, winter },
      occasions: { daily, business, leisure, sport, evening, 'night out': nightOut },
      types: typeScores
    };

    onSubmit(newFragrance);
    onClose();
  };

  const seasonTotal = spring + summer + autumn + winter;
  const occasionTotal = daily + business + leisure + sport + evening + nightOut;
  const typeTotal = Object.values(typeScores).reduce((sum, val) => sum + val, 0);

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2>Add New Fragrance</h2>
          <button className={styles.closeButton} onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          {/* Basic Info */}
          <section className={styles.section}>
            <h3>Basic Information</h3>
            <div className={styles.formGroup}>
              <label>Brand *</label>
              <input
                type="text"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                required
              />
            </div>
            <div className={styles.formGroup}>
              <label>Name *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className={styles.formGroup}>
              <label>Image URL</label>
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://example.com/image.jpg"
              />
            </div>
          </section>

          {/* Seasons */}
          <section className={styles.section}>
            <h3>Seasons <span className={seasonTotal !== 100 ? styles.warning : styles.valid}>({seasonTotal}%)</span></h3>
            <div className={styles.sliderGroup}>
              <label>Spring: {spring}%</label>
              <input type="range" min="0" max="100" value={spring} onChange={(e) => setSpring(Number(e.target.value))} />
            </div>
            <div className={styles.sliderGroup}>
              <label>Summer: {summer}%</label>
              <input type="range" min="0" max="100" value={summer} onChange={(e) => setSummer(Number(e.target.value))} />
            </div>
            <div className={styles.sliderGroup}>
              <label>Autumn: {autumn}%</label>
              <input type="range" min="0" max="100" value={autumn} onChange={(e) => setAutumn(Number(e.target.value))} />
            </div>
            <div className={styles.sliderGroup}>
              <label>Winter: {winter}%</label>
              <input type="range" min="0" max="100" value={winter} onChange={(e) => setWinter(Number(e.target.value))} />
            </div>
          </section>

          {/* Occasions */}
          <section className={styles.section}>
            <h3>Occasions <span className={occasionTotal !== 100 ? styles.warning : styles.valid}>({occasionTotal}%)</span></h3>
            <div className={styles.sliderGroup}>
              <label>Daily: {daily}%</label>
              <input type="range" min="0" max="100" value={daily} onChange={(e) => setDaily(Number(e.target.value))} />
            </div>
            <div className={styles.sliderGroup}>
              <label>Business: {business}%</label>
              <input type="range" min="0" max="100" value={business} onChange={(e) => setBusiness(Number(e.target.value))} />
            </div>
            <div className={styles.sliderGroup}>
              <label>Leisure: {leisure}%</label>
              <input type="range" min="0" max="100" value={leisure} onChange={(e) => setLeisure(Number(e.target.value))} />
            </div>
            <div className={styles.sliderGroup}>
              <label>Sport: {sport}%</label>
              <input type="range" min="0" max="100" value={sport} onChange={(e) => setSport(Number(e.target.value))} />
            </div>
            <div className={styles.sliderGroup}>
              <label>Evening: {evening}%</label>
              <input type="range" min="0" max="100" value={evening} onChange={(e) => setEvening(Number(e.target.value))} />
            </div>
            <div className={styles.sliderGroup}>
              <label>Night Out: {nightOut}%</label>
              <input type="range" min="0" max="100" value={nightOut} onChange={(e) => setNightOut(Number(e.target.value))} />
            </div>
          </section>

          {/* Types */}
          <section className={styles.section}>
            <h3>Fragrance Types <span className={typeTotal !== 100 ? styles.warning : styles.valid}>({typeTotal}%)</span></h3>
            {allFragranceTypes.map(type => (
              <div key={type} className={styles.sliderGroup}>
                <label>{type}: {typeScores[type]}%</label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={typeScores[type]}
                  onChange={(e) => handleTypeChange(type, Number(e.target.value))}
                />
              </div>
            ))}
          </section>

          <div className={styles.actions}>
            <button type="button" onClick={onClose} className={styles.cancelButton}>
              Cancel
            </button>
            <button type="submit" className={styles.submitButton}>
              Add Fragrance
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddFragranceForm;
