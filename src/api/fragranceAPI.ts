import { Fragrance } from '../types/fragrance';

const API_URL = '/api';

// Get auth token from localStorage
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

export const fragranceAPI = {
  // Get all fragrances
  getAll: async (): Promise<Fragrance[]> => {
    const response = await fetch(`${API_URL}/fragrances`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch fragrances');
    return response.json();
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
    return response.json();
  },

  // Update fragrance
  update: async (id: string, fragrance: Fragrance): Promise<Fragrance> => {
    const response = await fetch(`${API_URL}/fragrances/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(fragrance),
    });
    if (!response.ok) throw new Error('Failed to update fragrance');
    return response.json();
  },

  // Delete fragrance
  delete: async (id: string): Promise<void> => {
    const response = await fetch(`${API_URL}/fragrances/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to delete fragrance');
  },
};
