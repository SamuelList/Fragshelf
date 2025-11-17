import { Fragrance } from '../types/fragrance';

const API_URL = '/api';
const STORAGE_KEY = 'user_fragrances';

// Get auth token from localStorage
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

// Save fragrances to localStorage as backup
const saveToLocalStorage = (fragrances: Fragrance[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(fragrances));
  } catch (error) {
    console.error('Failed to save to localStorage:', error);
  }
};

// Load fragrances from localStorage
const loadFromLocalStorage = (): Fragrance[] | null => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    console.error('Failed to load from localStorage:', error);
    return null;
  }
};

export const fragranceAPI = {
  // Get all fragrances
  getAll: async (): Promise<Fragrance[]> => {
    try {
      const response = await fetch(`${API_URL}/fragrances`, {
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error('Failed to fetch fragrances');
      const fragrances = await response.json();
      
      // Check if server has reset (only has default mock data)
      const hasToken = !!localStorage.getItem('token');
      const backup = loadFromLocalStorage();
      
      if (hasToken && backup && backup.length > fragrances.length && fragrances.length === 4) {
        // Server likely reset, restore from backup
        console.log('Detected server reset, restoring from backup...');
        // Re-upload all fragrances from backup
        for (const frag of backup) {
          if (!fragrances.find((f: Fragrance) => f.id === frag.id)) {
            try {
              await fetch(`${API_URL}/fragrances`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({ ...frag, id: undefined }),
              });
            } catch (err) {
              console.error('Failed to restore fragrance:', err);
            }
          }
        }
        // Fetch again to get restored data
        const restored = await fetch(`${API_URL}/fragrances`, {
          headers: getAuthHeaders(),
        });
        const restoredFragrances = await restored.json();
        saveToLocalStorage(restoredFragrances);
        return restoredFragrances;
      }
      
      // Save to localStorage as backup
      if (hasToken) {
        saveToLocalStorage(fragrances);
      }
      
      return fragrances;
    } catch (error) {
      // If server fails, try to use localStorage backup
      console.warn('Server fetch failed, using localStorage backup');
      const backup = loadFromLocalStorage();
      if (backup) return backup;
      throw error;
    }
  },

  // Get single fragrance
  getById: async (id: string): Promise<Fragrance> => {
    const response = await fetch(`${API_URL}/fragrances/${id}`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch fragrance');
    return response.json();
  },

  // Create new fragrance
  create: async (fragrance: Omit<Fragrance, 'id'>): Promise<Fragrance> => {
    const response = await fetch(`${API_URL}/fragrances`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(fragrance),
    });
    if (!response.ok) throw new Error('Failed to create fragrance');
    const newFragrance = await response.json();
    
    // Update localStorage backup
    const stored = loadFromLocalStorage() || [];
    stored.push(newFragrance);
    saveToLocalStorage(stored);
    
    return newFragrance;
  },

  // Update fragrance
  update: async (id: string, fragrance: Fragrance): Promise<Fragrance> => {
    const response = await fetch(`${API_URL}/fragrances/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(fragrance),
    });
    if (!response.ok) throw new Error('Failed to update fragrance');
    const updated = await response.json();
    
    // Update localStorage backup
    const stored = loadFromLocalStorage() || [];
    const index = stored.findIndex(f => f.id === id);
    if (index !== -1) {
      stored[index] = updated;
      saveToLocalStorage(stored);
    }
    
    return updated;
  },

  // Delete fragrance
  delete: async (id: string): Promise<void> => {
    const response = await fetch(`${API_URL}/fragrances/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
      const error = await response.text();
      console.error('Delete failed:', error);
      throw new Error('Failed to delete fragrance');
    }
    // 204 No Content - don't try to parse JSON
    
    // Update localStorage backup
    const stored = loadFromLocalStorage() || [];
    const filtered = stored.filter(f => f.id !== id);
    saveToLocalStorage(filtered);
  },

  // Update liked status
  updateLiked: async (id: string, liked: boolean | null): Promise<Fragrance> => {
    try {
      const response = await fetch(`${API_URL}/fragrances/${id}`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ liked }),
      });
      if (!response.ok) throw new Error('Failed to update liked status');
      const updated = await response.json();
      
      // Update localStorage backup
      const stored = loadFromLocalStorage() || [];
      const index = stored.findIndex(f => f.id === id);
      if (index !== -1) {
        stored[index] = updated;
        saveToLocalStorage(stored);
      }
      
      return updated;
    } catch (error) {
      // Fallback to localStorage update if server fails (e.g., before migration runs)
      const stored = loadFromLocalStorage() || [];
      const index = stored.findIndex(f => f.id === id);
      if (index !== -1) {
        stored[index] = { ...stored[index], liked };
        saveToLocalStorage(stored);
        return stored[index];
      }
      throw error;
    }
  },
};
