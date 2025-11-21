import { useState, FormEvent } from 'react';
import { Fragrance, FragranceType, SeasonOccasionMatrix, OccasionScores } from '../../types/fragrance';
import styles from './AddFragranceForm.module.scss';

interface AddFragranceFormProps {
  onClose: () => void;
  onSubmit: (fragrance: Omit<Fragrance, 'id'>) => void;
  initialData?: Fragrance;
}

const allFragranceTypes: FragranceType[] = [
  'Animalic', 'Aquatic', 'Floral', 'Chypre', 'Creamy', 'Earthy',
  'Fougere', 'Fresh', 'Fruity', 'Gourmand', 'Green', 'Woody',
  'Leathery', 'Oriental', 'Powdery', 'Smoky', 'Resinous',
  'Sweet', 'Synthetic', 'Spicy', 'Citrus'
];

const AddFragranceForm = ({ onClose, onSubmit, initialData }: AddFragranceFormProps) => {
  const [brand, setBrand] = useState(initialData?.brand || '');
  const [name, setName] = useState(initialData?.name || '');
  const [imageUrl, setImageUrl] = useState(initialData?.imageUrl || 'https://images.unsplash.com/photo-1541643600914-78b084683601?w=400');
  const [review, setReview] = useState(initialData?.review || '');

  // Season state
  const [spring, setSpring] = useState(initialData?.seasons.spring ?? 0);
  const [summer, setSummer] = useState(initialData?.seasons.summer ?? 0);
  const [autumn, setAutumn] = useState(initialData?.seasons.autumn ?? 0);
  const [winter, setWinter] = useState(initialData?.seasons.winter ?? 0);

  // Occasion state
  const [daily, setDaily] = useState(initialData?.occasions.daily ?? 0);
  const [business, setBusiness] = useState(initialData?.occasions.business ?? 0);
  const [leisure, setLeisure] = useState(initialData?.occasions.leisure ?? 0);
  const [sport, setSport] = useState(initialData?.occasions.sport ?? 0);
  const [evening, setEvening] = useState(initialData?.occasions.evening ?? 0);
  const [nightOut, setNightOut] = useState(initialData?.occasions['night out'] ?? 0);

  // Wearability state
  const [specialOccasion, setSpecialOccasion] = useState(initialData?.wearability?.special_occasion ?? 50);
  const [dailyWear, setDailyWear] = useState(initialData?.wearability?.daily_wear ?? 50);

  // Season-Occasion Matrix state
  const getInitialSeasonOccasions = (): SeasonOccasionMatrix => {
    if (initialData?.seasonOccasions) {
      return initialData.seasonOccasions;
    }
    // Default: empty matrix (all zeros)
    const emptyOccasions: OccasionScores = {
      daily: 0, business: 0, leisure: 0, sport: 0, evening: 0, 'night out': 0
    };
    return {
      spring: { ...emptyOccasions },
      summer: { ...emptyOccasions },
      autumn: { ...emptyOccasions },
      winter: { ...emptyOccasions }
    };
  };

  const [seasonOccasions, setSeasonOccasions] = useState<SeasonOccasionMatrix>(getInitialSeasonOccasions());
  const [editingSeason, setEditingSeason] = useState<'spring' | 'summer' | 'autumn' | 'winter' | null>(null);

  const handleSeasonOccasionChange = (season: keyof SeasonOccasionMatrix, occasion: keyof OccasionScores, value: number) => {
    setSeasonOccasions(prev => ({
      ...prev,
      [season]: {
        ...prev[season],
        [occasion]: value
      }
    }));
  };

  const getSeasonOccasionTotal = (season: keyof SeasonOccasionMatrix) => {
    return Object.values(seasonOccasions[season]).reduce((sum, val) => sum + val, 0);
  };

  // Type state (using an object for all 20 types)
  const getInitialTypeScores = (): Record<FragranceType, number> => {
    if (initialData?.types) {
      const scores: any = {
        Animalic: 0, Aquatic: 0, Floral: 0, Chypre: 0, Creamy: 0, Earthy: 0,
        Fougere: 0, Fresh: 0, Fruity: 0, Gourmand: 0, Green: 0, Woody: 0,
        Leathery: 0, Oriental: 0, Powdery: 0, Smoky: 0, Resinous: 0,
        Sweet: 0, Synthetic: 0, Spicy: 0, Citrus: 0
      };
      // Map from lowercase API data to capitalized UI keys
      Object.entries(initialData.types).forEach(([key, value]) => {
        const capitalizedKey = key.charAt(0).toUpperCase() + key.slice(1);
        scores[capitalizedKey] = value;
      });
      return scores;
    }
    return {
      Animalic: 0, Aquatic: 0, Floral: 0, Chypre: 0, Creamy: 0, Earthy: 0,
      Fougere: 0, Fresh: 0, Fruity: 0, Gourmand: 0, Green: 0, Woody: 0,
      Leathery: 0, Oriental: 0, Powdery: 0, Smoky: 0, Resinous: 0,
      Sweet: 0, Synthetic: 0, Spicy: 0, Citrus: 0
    };
  };

  const [typeScores, setTypeScores] = useState<Record<FragranceType, number>>(getInitialTypeScores());

  const handlePasteData = async () => {
    try {
      const text = await navigator.clipboard.readText();
      const data = JSON.parse(text);
      
      // Validate and set the data
      if (data.brand) setBrand(data.brand);
      if (data.name) setName(data.name);
      if (data.imageUrl) setImageUrl(data.imageUrl);
      if (data.review) setReview(data.review);
      
      if (data.seasons) {
        if (data.seasons.spring !== undefined) setSpring(data.seasons.spring);
        if (data.seasons.summer !== undefined) setSummer(data.seasons.summer);
        if (data.seasons.autumn !== undefined) setAutumn(data.seasons.autumn);
        if (data.seasons.winter !== undefined) setWinter(data.seasons.winter);
      }
      
      if (data.occasions) {
        if (data.occasions.daily !== undefined) setDaily(data.occasions.daily);
        if (data.occasions.business !== undefined) setBusiness(data.occasions.business);
        if (data.occasions.leisure !== undefined) setLeisure(data.occasions.leisure);
        if (data.occasions.sport !== undefined) setSport(data.occasions.sport);
        if (data.occasions.evening !== undefined) setEvening(data.occasions.evening);
        if (data.occasions['night out'] !== undefined) setNightOut(data.occasions['night out']);
      }

      if (data.wearability) {
        if (data.wearability.special_occasion !== undefined) setSpecialOccasion(data.wearability.special_occasion);
        if (data.wearability.daily_wear !== undefined) setDailyWear(data.wearability.daily_wear);
      }
      
      if (data.types) {
        const newTypes: any = { ...typeScores };
        Object.entries(data.types).forEach(([key, value]) => {
          const capitalizedKey = key.charAt(0).toUpperCase() + key.slice(1);
          if (capitalizedKey in newTypes) {
            newTypes[capitalizedKey] = value;
          }
        });
        setTypeScores(newTypes);
      }
      
      alert('✅ Data imported successfully!');
    } catch (error) {
      alert('❌ Failed to paste data. Make sure you copied JSON from the Parfumo scraper.');
      console.error('Paste error:', error);
    }
  };

  const handleTypeChange = (type: FragranceType, value: number) => {
    setTypeScores(prev => ({ ...prev, [type]: value }));
  };

  const handleSpecialOccasionChange = (value: number) => {
    const rounded = Math.round(value / 5) * 5; // Round to nearest 5
    setSpecialOccasion(rounded);
    setDailyWear(100 - rounded);
  };

  const handleDailyWearChange = (value: number) => {
    const rounded = Math.round(value / 5) * 5; // Round to nearest 5
    setDailyWear(rounded);
    setSpecialOccasion(100 - rounded);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    
    const newFragrance = {
      brand,
      name,
      imageUrl: imageUrl || '/images/placeholder.jpg',
      seasons: { spring, summer, autumn, winter },
      occasions: { daily, business, leisure, sport, evening, 'night out': nightOut },
      seasonOccasions,
      types: typeScores,
      wearability: { special_occasion: specialOccasion, daily_wear: dailyWear },
      review
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
        <button className={styles.closeButton} onClick={onClose}>×</button>
        <h2 className={styles.title}>{initialData ? 'Edit Fragrance' : 'Add New Fragrance'}</h2>

        <button 
          type="button" 
          onClick={handlePasteData}
          className={styles.pasteButton}
          title="Paste data from Parfumo scraper"
        >
          📋 Paste from Parfumo
        </button>

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
            <div className={styles.formGroup}>
              <label>Review / Notes</label>
              <textarea
                value={review}
                onChange={(e) => setReview(e.target.value)}
                placeholder="Add your personal review or notes here..."
                rows={4}
                className={styles.textarea}
              />
            </div>
          </section>

          {/* Seasons */}
          <section className={styles.section}>
            <h3>Seasons <span className={seasonTotal !== 100 ? styles.warning : styles.valid}>({seasonTotal}%)</span></h3>
            <div className={styles.sliderGroup}>
              <label>Spring: {spring}%</label>
              <input type="range" min="0" max="50" value={spring} onChange={(e) => setSpring(Number(e.target.value))} />
            </div>
            <div className={styles.sliderGroup}>
              <label>Summer: {summer}%</label>
              <input type="range" min="0" max="50" value={summer} onChange={(e) => setSummer(Number(e.target.value))} />
            </div>
            <div className={styles.sliderGroup}>
              <label>Autumn: {autumn}%</label>
              <input type="range" min="0" max="50" value={autumn} onChange={(e) => setAutumn(Number(e.target.value))} />
            </div>
            <div className={styles.sliderGroup}>
              <label>Winter: {winter}%</label>
              <input type="range" min="0" max="50" value={winter} onChange={(e) => setWinter(Number(e.target.value))} />
            </div>
          </section>

          {/* Occasions */}
          <section className={styles.section}>
            <h3>Occasions <span className={occasionTotal !== 100 ? styles.warning : styles.valid}>({occasionTotal}%)</span></h3>
            <div className={styles.sliderGroup}>
              <label>Daily: {daily}%</label>
              <input type="range" min="0" max="50" value={daily} onChange={(e) => setDaily(Number(e.target.value))} />
            </div>
            <div className={styles.sliderGroup}>
              <label>Business: {business}%</label>
              <input type="range" min="0" max="50" value={business} onChange={(e) => setBusiness(Number(e.target.value))} />
            </div>
            <div className={styles.sliderGroup}>
              <label>Leisure: {leisure}%</label>
              <input type="range" min="0" max="50" value={leisure} onChange={(e) => setLeisure(Number(e.target.value))} />
            </div>
            <div className={styles.sliderGroup}>
              <label>Sport: {sport}%</label>
              <input type="range" min="0" max="50" value={sport} onChange={(e) => setSport(Number(e.target.value))} />
            </div>
            <div className={styles.sliderGroup}>
              <label>Evening: {evening}%</label>
              <input type="range" min="0" max="50" value={evening} onChange={(e) => setEvening(Number(e.target.value))} />
            </div>
            <div className={styles.sliderGroup}>
              <label>Night Out: {nightOut}%</label>
              <input type="range" min="0" max="50" value={nightOut} onChange={(e) => setNightOut(Number(e.target.value))} />
            </div>
          </section>

          {/* Season-Occasion Matrix */}
          <section className={styles.section}>
            <h3>Season × Occasion Matrix</h3>
            <p className={styles.helpText}>Define specific occasions for each season (each season should total 100%)</p>
            
            {(['spring', 'summer', 'autumn', 'winter'] as const).map(season => {
              const seasonTotal = getSeasonOccasionTotal(season);
              const isEditing = editingSeason === season;
              
              return (
                <div key={season} className={styles.matrixSeasonGroup}>
                  <button
                    type="button"
                    className={styles.matrixSeasonButton}
                    onClick={() => setEditingSeason(isEditing ? null : season)}
                  >
                    <span className={styles.matrixSeasonName}>
                      {season.charAt(0).toUpperCase() + season.slice(1)}
                    </span>
                    <span className={seasonTotal !== 100 ? styles.warning : styles.valid}>
                      ({seasonTotal}%)
                    </span>
                    <span className={styles.matrixToggle}>{isEditing ? '▼' : '▶'}</span>
                  </button>
                  
                  {isEditing && (
                    <div className={styles.matrixOccasions}>
                      <div className={styles.sliderGroup}>
                        <label>Daily: {seasonOccasions[season].daily}%</label>
                        <div className={styles.inputGroup}>
                          <input 
                            type="range" 
                            min="0" 
                            max="100" 
                            value={seasonOccasions[season].daily} 
                            onChange={(e) => handleSeasonOccasionChange(season, 'daily', Number(e.target.value))} 
                            className={styles.slider}
                          />
                          <input 
                            type="number" 
                            min="0" 
                            max="100" 
                            value={seasonOccasions[season].daily} 
                            onChange={(e) => handleSeasonOccasionChange(season, 'daily', Number(e.target.value))} 
                            className={styles.numberInput}
                          />
                        </div>
                      </div>
                      <div className={styles.sliderGroup}>
                        <label>Business: {seasonOccasions[season].business}%</label>
                        <div className={styles.inputGroup}>
                          <input 
                            type="range" 
                            min="0" 
                            max="100" 
                            value={seasonOccasions[season].business} 
                            onChange={(e) => handleSeasonOccasionChange(season, 'business', Number(e.target.value))} 
                            className={styles.slider}
                          />
                          <input 
                            type="number" 
                            min="0" 
                            max="100" 
                            value={seasonOccasions[season].business} 
                            onChange={(e) => handleSeasonOccasionChange(season, 'business', Number(e.target.value))} 
                            className={styles.numberInput}
                          />
                        </div>
                      </div>
                      <div className={styles.sliderGroup}>
                        <label>Leisure: {seasonOccasions[season].leisure}%</label>
                        <div className={styles.inputGroup}>
                          <input 
                            type="range" 
                            min="0" 
                            max="100" 
                            value={seasonOccasions[season].leisure} 
                            onChange={(e) => handleSeasonOccasionChange(season, 'leisure', Number(e.target.value))} 
                            className={styles.slider}
                          />
                          <input 
                            type="number" 
                            min="0" 
                            max="100" 
                            value={seasonOccasions[season].leisure} 
                            onChange={(e) => handleSeasonOccasionChange(season, 'leisure', Number(e.target.value))} 
                            className={styles.numberInput}
                          />
                        </div>
                      </div>
                      <div className={styles.sliderGroup}>
                        <label>Sport: {seasonOccasions[season].sport}%</label>
                        <div className={styles.inputGroup}>
                          <input 
                            type="range" 
                            min="0" 
                            max="100" 
                            value={seasonOccasions[season].sport} 
                            onChange={(e) => handleSeasonOccasionChange(season, 'sport', Number(e.target.value))} 
                            className={styles.slider}
                          />
                          <input 
                            type="number" 
                            min="0" 
                            max="100" 
                            value={seasonOccasions[season].sport} 
                            onChange={(e) => handleSeasonOccasionChange(season, 'sport', Number(e.target.value))} 
                            className={styles.numberInput}
                          />
                        </div>
                      </div>
                      <div className={styles.sliderGroup}>
                        <label>Evening: {seasonOccasions[season].evening}%</label>
                        <div className={styles.inputGroup}>
                          <input 
                            type="range" 
                            min="0" 
                            max="100" 
                            value={seasonOccasions[season].evening} 
                            onChange={(e) => handleSeasonOccasionChange(season, 'evening', Number(e.target.value))} 
                            className={styles.slider}
                          />
                          <input 
                            type="number" 
                            min="0" 
                            max="100" 
                            value={seasonOccasions[season].evening} 
                            onChange={(e) => handleSeasonOccasionChange(season, 'evening', Number(e.target.value))} 
                            className={styles.numberInput}
                          />
                        </div>
                      </div>
                      <div className={styles.sliderGroup}>
                        <label>Night Out: {seasonOccasions[season]['night out']}%</label>
                        <div className={styles.inputGroup}>
                          <input 
                            type="range" 
                            min="0" 
                            max="100" 
                            value={seasonOccasions[season]['night out']} 
                            onChange={(e) => handleSeasonOccasionChange(season, 'night out', Number(e.target.value))} 
                            className={styles.slider}
                          />
                          <input 
                            type="number" 
                            min="0" 
                            max="100" 
                            value={seasonOccasions[season]['night out']} 
                            onChange={(e) => handleSeasonOccasionChange(season, 'night out', Number(e.target.value))} 
                            className={styles.numberInput}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </section>

          {/* Wearability */}
          <section className={styles.section}>
            <h3>Wearability <span className={styles.valid}>(Always 100%)</span></h3>
            <div className={styles.sliderGroup}>
              <label>Special Occasion: {specialOccasion}%</label>
              <input 
                type="range" 
                min="0" 
                max="100" 
                step="5"
                value={specialOccasion} 
                onChange={(e) => handleSpecialOccasionChange(Number(e.target.value))} 
              />
            </div>
            <div className={styles.sliderGroup}>
              <label>Daily Wear: {dailyWear}%</label>
              <input 
                type="range" 
                min="0" 
                max="100" 
                step="5"
                value={dailyWear} 
                onChange={(e) => handleDailyWearChange(Number(e.target.value))} 
              />
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
                  max="50"
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
              {initialData ? 'Save Changes' : 'Add Fragrance'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddFragranceForm;
