import { Fragrance } from '../types/fragrance';

const API_URL = '/api';

export const fragranceAPI = {
  // Get all fragrances
  getAll: async (): Promise<Fragrance[]> => {
    const response = await fetch(`${API_URL}/fragrances`);
    if (!response.ok) throw new Error('Failed to fetch fragrances');
    return response.json();
  },

  // Get single fragrance
  getById: async (id: string): Promise<Fragrance> => {
    const response = await fetch(`${API_URL}/fragrances/${id}`);
    if (!response.ok) throw new Error('Failed to fetch fragrance');
    return response.json();
  },

  // Create new fragrance
  create: async (fragrance: Omit<Fragrance, 'id'>): Promise<Fragrance> => {
    const response = await fetch(`${API_URL}/fragrances`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(fragrance),
    });
    if (!response.ok) throw new Error('Failed to create fragrance');
    return response.json();
  },

  // Update fragrance
  update: async (id: string, fragrance: Fragrance): Promise<Fragrance> => {
    const response = await fetch(`${API_URL}/fragrances/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(fragrance),
    });
    if (!response.ok) throw new Error('Failed to update fragrance');
    return response.json();
  },

  // Delete fragrance
  delete: async (id: string): Promise<void> => {
    const response = await fetch(`${API_URL}/fragrances/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete fragrance');
  },
};
