import { useState, useEffect, useMemo } from 'react';
import FilterBar from '../components/FilterBar/FilterBar';
import FragranceGrid from '../components/FragranceGrid/FragranceGrid';
import AddFragranceForm from '../components/AddFragranceForm/AddFragranceForm';
import FragranceDetail from '../components/FragranceDetail/FragranceDetail';
import TypeFilter from '../components/TypeFilter/TypeFilter';
import AuthModal from '../components/Auth/AuthModal';
import Analytics from '../components/Analytics/Analytics';
import QuickPicker from '../components/QuickPicker/QuickPicker';
import { Fragrance, FragranceType } from '../types/fragrance';
import { fragranceAPI } from '../api/fragranceAPI';
import { useAuth } from '../context/AuthContext';
import styles from './Home.module.scss';

const Home = () => {
  const { user, logout, isAuthenticated, isLoading: authLoading } = useAuth();
  const [fragrances, setFragrances] = useState<Fragrance[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingFragrance, setEditingFragrance] = useState<Fragrance | null>(null);
  const [selectedFragrance, setSelectedFragrance] = useState<Fragrance | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<FragranceType | null>(null);
  const [showSafest, setShowSafest] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showQuickPicker, setShowQuickPicker] = useState(false);
  const [seasonFilters, setSeasonFilters] = useState<Record<string, number>>({
    spring: 0,
    summer: 0,
    autumn: 0,
    winter: 0
  });
  const [occasionFilters, setOccasionFilters] = useState<Record<string, number>>({
    daily: 0,
    business: 0,
    leisure: 0,
    sport: 0,
    evening: 0,
    'night out': 0
  });

  // Load fragrances on mount and when auth state changes
  useEffect(() => {
    if (!authLoading) {
      loadFragrances();
    }
  }, [authLoading, isAuthenticated]);

  const loadFragrances = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await fragranceAPI.getAll();
      setFragrances(data);
    } catch (err) {
      setError('Failed to load fragrances. Make sure the server is running.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddFragrance = async (newFragrance: Omit<Fragrance, 'id'>) => {
    if (!isAuthenticated) {
      setError('Please login to add or edit fragrances');
      return;
    }
    
    try {
      if (editingFragrance) {
        // Update existing fragrance
        const updated = await fragranceAPI.update(editingFragrance.id, { ...newFragrance, id: editingFragrance.id });
        setFragrances(fragrances.map(f => f.id === editingFragrance.id ? updated : f));
        setEditingFragrance(null);
      } else {
        // Create new fragrance
        const created = await fragranceAPI.create(newFragrance);
        setFragrances([...fragrances, created]);
      }
      setIsFormOpen(false);
    } catch (err) {
      setError(editingFragrance ? 'Failed to update fragrance' : 'Failed to add fragrance');
      console.error(err);
    }
  };

  const handleEditFragrance = (fragrance: Fragrance) => {
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }
    setEditingFragrance(fragrance);
    setSelectedFragrance(null);
    setIsFormOpen(true);
  };

  const handleTypeSelect = (type: FragranceType | null) => {
    setSelectedType(type);
    setShowSafest(false);
  };

  const handleSafestToggle = () => {
    setShowSafest(!showSafest);
    setSelectedType(null);
  };

  const handleFragranceClick = (fragrance: Fragrance) => {
    setSelectedFragrance(fragrance);
  };

  const handleDeleteFragrance = async (id: string) => {
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }
    try {
      await fragranceAPI.delete(id);
      setFragrances(fragrances.filter(f => f.id !== id));
      setSelectedFragrance(null);
    } catch (err) {
      setError('Failed to delete fragrance');
      console.error(err);
    }
  };

  const handleSeasonFilterChange = (filters: Record<string, number>) => {
    setSeasonFilters(filters);
  };

  const handleOccasionFilterChange = (filters: Record<string, number>) => {
    setOccasionFilters(filters);
  };

  const handleLikeChange = async (id: string, liked: boolean | null) => {
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }
    try {
      const updated = await fragranceAPI.updateLiked(id, liked);
      setFragrances(fragrances.map(f => f.id === id ? updated : f));
      // Update selectedFragrance if it's the same fragrance
      if (selectedFragrance && selectedFragrance.id === id) {
        setSelectedFragrance(updated);
      }
    } catch (err) {
      setError('Failed to update fragrance rating');
      console.error(err);
    }
  };

  const activeSeasonCount = useMemo(() => {
    return Object.values(seasonFilters).filter(v => v > 0).length;
  }, [seasonFilters]);

  const activeOccasionCount = useMemo(() => {
    return Object.values(occasionFilters).filter(v => v > 0).length;
  }, [occasionFilters]);

  // Calculate available types and their popularity
  const availableTypes = useMemo(() => {
    const typeScores: Record<string, number> = {};
    
    fragrances.forEach(fragrance => {
      Object.entries(fragrance.types).forEach(([type, percentage]) => {
        if (percentage > 0) {
          typeScores[type] = (typeScores[type] || 0) + percentage;
        }
      });
    });
    
    // Sort by total score (most popular first)
    return Object.entries(typeScores)
      .sort((a, b) => b[1] - a[1])
      .map(([type]) => type as FragranceType);
  }, [fragrances]);

  // Filter and sort fragrances based on selected type, seasons, and occasions
  const filteredFragrances = useMemo(() => {
    let result = [...fragrances];
    
    // Apply type filter
    if (selectedType) {
      result = result.filter(fragrance => {
        const typeValue = fragrance.types[selectedType];
        return typeValue && typeValue > 0;
      });
    }
    
    // Apply season filters
    const activeSeasonFilters = Object.entries(seasonFilters).filter(([_, value]) => value > 0);
    if (activeSeasonFilters.length > 0) {
      result = result.filter(fragrance => {
        return activeSeasonFilters.every(([season, threshold]) => {
          const seasonValue = fragrance.seasons[season as keyof typeof fragrance.seasons] || 0;
          return seasonValue >= threshold;
        });
      });
    }
    
    // Apply occasion filters
    const activeOccasionFilters = Object.entries(occasionFilters).filter(([_, value]) => value > 0);
    if (activeOccasionFilters.length > 0) {
      result = result.filter(fragrance => {
        return activeOccasionFilters.every(([occasion, threshold]) => {
          const occasionValue = fragrance.occasions[occasion as keyof typeof fragrance.occasions] || 0;
          return occasionValue >= threshold;
        });
      });
    }
    
    // Sort by the selected type percentage if a type is selected
    if (selectedType) {
      result.sort((a, b) => {
        const aValue = a.types[selectedType] || 0;
        const bValue = b.types[selectedType] || 0;
        return bValue - aValue;
      });
    }
    
    // Sort by safest (daily + business) if safest filter is active
    if (showSafest) {
      result.sort((a, b) => {
        const aScore = (a.occasions.daily || 0) + (a.occasions.business || 0);
        const bScore = (b.occasions.daily || 0) + (b.occasions.business || 0);
        return bScore - aScore;
      });
    }
    
    return result;
  }, [fragrances, selectedType, seasonFilters, occasionFilters, showSafest]);

  if (authLoading || isLoading) {
    return (
      <div className={styles.home}>
        <FilterBar 
          seasonFilters={seasonFilters}
          occasionFilters={occasionFilters}
          onSeasonFilterChange={handleSeasonFilterChange}
          onOccasionFilterChange={handleOccasionFilterChange}
          activeSeasonCount={activeSeasonCount}
          activeOccasionCount={activeOccasionCount}
          resultCount={0}
          onQuickPickerClick={() => setShowQuickPicker(true)}
        />
        <div className={styles.loading}>Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.home}>
        <FilterBar 
          seasonFilters={seasonFilters}
          occasionFilters={occasionFilters}
          onSeasonFilterChange={handleSeasonFilterChange}
          onOccasionFilterChange={handleOccasionFilterChange}
          activeSeasonCount={activeSeasonCount}
          activeOccasionCount={activeOccasionCount}
          resultCount={0}
          onQuickPickerClick={() => setShowQuickPicker(true)}
        />
        <div className={styles.error}>
          {error}
          <button onClick={loadFragrances} className={styles.retryButton}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.home}>
      <FilterBar 
        seasonFilters={seasonFilters}
        occasionFilters={occasionFilters}
        onSeasonFilterChange={handleSeasonFilterChange}
        onOccasionFilterChange={handleOccasionFilterChange}
        activeSeasonCount={activeSeasonCount}
        activeOccasionCount={activeOccasionCount}
        resultCount={filteredFragrances.length}
        onQuickPickerClick={() => setShowQuickPicker(true)}
      />
      {fragrances.length > 0 && (
        <TypeFilter 
          selectedType={selectedType}
          onTypeSelect={handleTypeSelect}
          availableTypes={availableTypes}
          showSafest={showSafest}
          onSafestToggle={handleSafestToggle}
        />
      )}
      <div key={`results-${selectedType || 'all'}-${activeSeasonCount}-${activeOccasionCount}`}>
        {filteredFragrances.length === 0 && isAuthenticated ? (
          <div className={styles.emptyState}>
            <p>You don't have any fragrances yet.</p>
            <p>Click the + button to add your first fragrance!</p>
          </div>
        ) : (
          <>
            {availableTypes.length > 0 && (
              <div className={styles.resultsCount}>
                {filteredFragrances.length} {filteredFragrances.length === 1 ? 'fragrance' : 'fragrances'}
                {selectedType && ` with ${selectedType}`}
              </div>
            )}
            <FragranceGrid 
              fragrances={filteredFragrances}
              onFragranceClick={handleFragranceClick}
            />
          </>
        )}
      </div>
      
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

      {selectedFragrance && (
        <FragranceDetail
          fragrance={selectedFragrance}
          onClose={() => setSelectedFragrance(null)}
          onDelete={handleDeleteFragrance}
          onEdit={handleEditFragrance}
          onLikeChange={isAuthenticated ? handleLikeChange : undefined}
        />
      )}

      {filteredFragrances.length > 0 && (
        <div className={styles.analyticsSection}>
          {isAuthenticated && (
            <button 
              className={styles.addButton}
              onClick={() => setIsFormOpen(true)}
            >
              + Add Fragrance
            </button>
          )}
          <button 
            className={styles.analyticsButton}
            onClick={() => setShowAnalytics(true)}
          >
            View Analytics
          </button>
        </div>
      )}

      <div className={styles.authSection}>
        {isAuthenticated && user ? (
          <div className={styles.loggedIn}>
            <span className={styles.welcomeText}>Logged in as <strong>{user.username}</strong></span>
            <button onClick={logout} className={styles.authButton}>
              Logout
            </button>
          </div>
        ) : (
          <button onClick={() => setShowAuthModal(true)} className={styles.authButton}>
            Login to add/edit fragrances
          </button>
        )}
      </div>

      {showAuthModal && !isAuthenticated && (
        <AuthModal onClose={() => setShowAuthModal(false)} />
      )}

      {showAnalytics && (
        <Analytics 
          fragrances={filteredFragrances}
          onClose={() => setShowAnalytics(false)}
        />
      )}

      {showQuickPicker && (
        <QuickPicker
          fragrances={fragrances}
          onClose={() => setShowQuickPicker(false)}
          onFragranceClick={(frag) => setSelectedFragrance(frag)}
        />
      )}
    </div>
  );
};

export default Home;
