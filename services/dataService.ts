import { apiClient } from './apiClient';
import { ClothingItem, Look, PublicLook } from '../types';

/**
 * Data Service - Backend data API integration layer
 * 
 * Step 18: Read-only endpoints skeleton
 * Step 19+: Will integrate with Zustand store to replace localStorage
 * 
 * Current status: NOT YET USED IN UI
 * - UI still uses localStorage via useStore
 * - These functions are prepared for future migration
 */

const API_BASE = import.meta.env.VITE_API_BASE_URL;
const USE_BACKEND_DATA = !!API_BASE;

export const dataService = {
  /**
   * Fetch all clothing items for a user
   * 
   * @param userId - User ID
   * @returns Promise<ClothingItem[]>
   * 
   * Backend: GET /api/data/closet?userId={userId}
   * Future: Replace useStore.closet with this API
   */
  fetchClosetItems: async (userId: string): Promise<ClothingItem[]> => {
    if (!USE_BACKEND_DATA) {
      console.warn('[dataService] Backend not configured, use localStorage instead');
      return [];
    }

    try {
      const response = await apiClient.get<{ items: ClothingItem[] }>(
        '/api/data/closet',
        { params: { userId } }
      );
      
      console.log(`[dataService] Fetched ${response.items.length} closet items for user ${userId}`);
      return response.items;
    } catch (error) {
      console.error('[dataService] fetchClosetItems error:', error);
      throw error;
    }
  },

  /**
   * Fetch all looks for a user
   * 
   * @param userId - User ID
   * @returns Promise<Look[]>
   * 
   * Backend: GET /api/data/looks?userId={userId}
   * Future: Replace useStore.looks with this API
   */
  fetchLooks: async (userId: string): Promise<Look[]> => {
    if (!USE_BACKEND_DATA) {
      console.warn('[dataService] Backend not configured, use localStorage instead');
      return [];
    }

    try {
      const response = await apiClient.get<{ looks: Look[] }>(
        '/api/data/looks',
        { params: { userId } }
      );
      
      console.log(`[dataService] Fetched ${response.looks.length} looks for user ${userId}`);
      return response.looks;
    } catch (error) {
      console.error('[dataService] fetchLooks error:', error);
      throw error;
    }
  },

  /**
   * Fetch public looks feed
   * 
   * @param options - Query options (limit, sort)
   * @returns Promise<PublicLook[]>
   * 
   * Backend: GET /api/data/public-looks?limit={limit}&sort={sort}
   * Future: Replace publicLookService Mock with this API
   */
  fetchPublicLooks: async (options?: {
    limit?: number;
    sort?: 'likes' | 'latest';
  }): Promise<PublicLook[]> => {
    if (!USE_BACKEND_DATA) {
      console.warn('[dataService] Backend not configured, use localStorage instead');
      return [];
    }

    try {
      const { limit = 20, sort = 'latest' } = options || {};
      
      const response = await apiClient.get<{ publicLooks: PublicLook[] }>(
        '/api/data/public-looks',
        { params: { limit, sort } }
      );
      
      console.log(`[dataService] Fetched ${response.publicLooks.length} public looks (sort: ${sort})`);
      return response.publicLooks;
    } catch (error) {
      console.error('[dataService] fetchPublicLooks error:', error);
      throw error;
    }
  },
};

/**
 * Migration Plan (Step 19+):
 * 
 * 1. Update useStore to optionally load from backend:
 *    - Add `loadClosetFromBackend()` action
 *    - Add `loadLooksFromBackend()` action
 *    - Replace localStorage.getItem() with dataService calls
 * 
 * 2. Add write endpoints:
 *    - POST /api/data/closet - Add clothing item
 *    - PUT /api/data/closet/:id - Update clothing item
 *    - DELETE /api/data/closet/:id - Delete clothing item
 *    - POST /api/data/looks - Create look
 *    - PUT /api/data/looks/:id - Update look
 *    - DELETE /api/data/looks/:id - Delete look
 *    - POST /api/data/public-looks - Publish look
 * 
 * 3. Sync strategy:
 *    - On login: Load all data from backend → Zustand
 *    - On mutations: Update backend → Update Zustand → No localStorage
 *    - Offline support: Keep localStorage as fallback cache
 */
