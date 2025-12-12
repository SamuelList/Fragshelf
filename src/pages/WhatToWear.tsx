import { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Fragrance, OccasionCategory, Month } from '../types/fragrance';
import { fragranceAPI } from '../api/fragranceAPI';
import { useAuth } from '../context/AuthContext';
import FragranceDetail from '../components/FragranceDetail/FragranceDetail';
import AddFragranceForm from '../components/AddFragranceForm/AddFragranceForm';
import styles from './WhatToWear.module.scss';

const MONTHS: Month[] = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTH_NAMES: Record<Month, string> = {
  Jan: 'January', Feb: 'February', Mar: 'March', Apr: 'April',
  May: 'May', Jun: 'June', Jul: 'July', Aug: 'August',
  Sep: 'September', Oct: 'October', Nov: 'November', Dec: 'December'
};

const CATEGORIES: { key: OccasionCategory; label: string; emoji: string; gradient: string }[] = [
  { key: 'dateNight', label: 'Date Night', emoji: '💕', gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' },
  { key: 'nightOut', label: 'Night Out', emoji: '🎉', gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
  { key: 'leisure', label: 'Leisure', emoji: '☀️', gradient: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)' },
  { key: 'work', label: 'Work', emoji: '💼', gradient: 'linear-gradient(135deg, #3a7bd5 0%, #00d2ff 100%)' },
];

const WhatToWear = () => {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [fragrances, setFragrances] = useState<Fragrance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<OccasionCategory>('dateNight');
  const [selectedFragrance, setSelectedFragrance] = useState<Fragrance | null>(null);
  const [editingFragrance, setEditingFragrance] = useState<Fragrance | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  // Month navigation state - start with current month
  const [selectedMonthIndex, setSelectedMonthIndex] = useState(() => new Date().getMonth());
  const selectedMonth = MONTHS[selectedMonthIndex];

  // Navigate months with arrows
  const goToPrevMonth = () => {
    setSelectedMonthIndex(prev => (prev === 0 ? 11 : prev - 1));
  };

  const goToNextMonth = () => {
    setSelectedMonthIndex(prev => (prev === 11 ? 0 : prev + 1));
  };

  // Jump to current month
  const goToCurrentMonth = () => {
    setSelectedMonthIndex(new Date().getMonth());
  };

  const isCurrentMonth = selectedMonthIndex === new Date().getMonth();

  useEffect(() => {
    if (!authLoading) {
      loadFragrances();
    }
  }, [authLoading, isAuthenticated]);

  const loadFragrances = async () => {
    try {
      setIsLoading(true);
      const data = await fragranceAPI.getAll();
      setFragrances(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter fragrances for the selected category and selected month
  const filteredFragrances = useMemo(() => {
    return fragrances.filter(frag => {
      if (!frag.occasionMonths) return false;
      const months = frag.occasionMonths[selectedCategory];
      return months && months.includes(selectedMonth);
    });
  }, [fragrances, selectedCategory, selectedMonth]);

  const handleFragranceClick = (fragrance: Fragrance) => {
    setSelectedFragrance(fragrance);
  };

  const handleDeleteFragrance = async (id: string) => {
    try {
      await fragranceAPI.delete(id);
      setFragrances(fragrances.filter(f => f.id !== id));
      setSelectedFragrance(null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleEditFragrance = (fragrance: Fragrance) => {
    setEditingFragrance(fragrance);
    setSelectedFragrance(null);
    setIsFormOpen(true);
  };

  const handleAddFragrance = async (newFragrance: Omit<Fragrance, 'id'>) => {
    try {
      if (editingFragrance) {
        const updated = await fragranceAPI.update(editingFragrance.id, { ...newFragrance, id: editingFragrance.id });
        setFragrances(fragrances.map(f => f.id === editingFragrance.id ? updated : f));
        setEditingFragrance(null);
        if (selectedFragrance && selectedFragrance.id === editingFragrance.id) {
          setSelectedFragrance(updated);
        }
      } else {
        const created = await fragranceAPI.create(newFragrance);
        setFragrances([...fragrances, created]);
      }
      setIsFormOpen(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleLikeChange = async (id: string, liked: boolean | null) => {
    try {
      const updated = await fragranceAPI.updateLiked(id, liked);
      setFragrances(fragrances.map(f => f.id === id ? updated : f));
      if (selectedFragrance && selectedFragrance.id === id) {
        setSelectedFragrance(updated);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const selectedCategoryInfo = CATEGORIES.find(c => c.key === selectedCategory)!;

  if (authLoading || isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading...</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <Link to="/" className={styles.backButton}>← Back</Link>
        <h1 className={styles.title}>What to Wear</h1>
        
        {/* Month Navigation */}
        <div className={styles.monthNav}>
          <button 
            className={styles.monthArrow} 
            onClick={goToPrevMonth}
            title="Previous month"
          >
            ←
          </button>
          <div className={styles.monthDisplay}>
            <span className={styles.monthValue}>{MONTH_NAMES[selectedMonth]}</span>
            {!isCurrentMonth && (
              <button 
                className={styles.todayButton} 
                onClick={goToCurrentMonth}
                title="Go to current month"
              >
                Today
              </button>
            )}
          </div>
          <button 
            className={styles.monthArrow} 
            onClick={goToNextMonth}
            title="Next month"
          >
            →
          </button>
        </div>
      </div>

      {/* Category Selector */}
      <div className={styles.categories}>
        {CATEGORIES.map(cat => (
          <button
            key={cat.key}
            className={`${styles.categoryButton} ${selectedCategory === cat.key ? styles.active : ''}`}
            onClick={() => setSelectedCategory(cat.key)}
            style={{ 
              background: selectedCategory === cat.key ? cat.gradient : undefined 
            }}
          >
            <span className={styles.categoryEmoji}>{cat.emoji}</span>
            <span className={styles.categoryLabel}>{cat.label}</span>
          </button>
        ))}
      </div>

      {/* Results */}
      <div className={styles.results}>
        <div 
          className={styles.resultsHeader}
          style={{ background: selectedCategoryInfo.gradient }}
        >
          <span className={styles.resultsEmoji}>{selectedCategoryInfo.emoji}</span>
          <h2 className={styles.resultsTitle}>
            {selectedCategoryInfo.label} in {MONTH_NAMES[selectedMonth]}
          </h2>
          <span className={styles.resultsCount}>
            {filteredFragrances.length} {filteredFragrances.length === 1 ? 'fragrance' : 'fragrances'}
          </span>
        </div>

        {filteredFragrances.length === 0 ? (
          <div className={styles.emptyState}>
            <span className={styles.emptyEmoji}>🔍</span>
            <p className={styles.emptyText}>No fragrances found for {selectedCategoryInfo.label} in {MONTH_NAMES[selectedMonth]}</p>
            <p className={styles.emptyHint}>Edit your fragrances to add occasion months!</p>
          </div>
        ) : (
          <div className={styles.fragranceGrid}>
            {filteredFragrances.map(frag => (
              <div 
                key={frag.id} 
                className={styles.fragranceCard}
                onClick={() => handleFragranceClick(frag)}
              >
                <div className={styles.cardImage}>
                  <img src={frag.imageUrl} alt={`${frag.brand} ${frag.name}`} />
                  {frag.formality && (
                    <span className={styles.formalityBadge}>{frag.formality}</span>
                  )}
                  {frag.middayTouchUp === true && (
                    <span className={styles.touchUpBadge} title="Bring for touch-up">💧</span>
                  )}
                </div>
                <div className={styles.cardInfo}>
                  <span className={styles.cardBrand}>{frag.brand}</span>
                  <span className={styles.cardName}>{frag.name}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Legend */}
      <div className={styles.legend}>
        <h3 className={styles.legendTitle}>Legend</h3>
        <div className={styles.legendItems}>
          <div className={styles.legendItem}>
            <span className={styles.legendIcon}>💧</span>
            <span className={styles.legendText}>Midday Touch-Up Needed</span>
          </div>
        </div>
      </div>

      {selectedFragrance && (
        <FragranceDetail
          fragrance={selectedFragrance}
          onClose={() => setSelectedFragrance(null)}
          onDelete={handleDeleteFragrance}
          onEdit={handleEditFragrance}
          onLikeChange={isAuthenticated ? handleLikeChange : undefined}
        />
      )}

      {isFormOpen && (
        <AddFragranceForm
          onClose={() => {
            setIsFormOpen(false);
            setEditingFragrance(null);
          }}
          onSubmit={handleAddFragrance}
          initialData={editingFragrance || undefined}
        />
      )}
    </div>
  );
};

export default WhatToWear;
