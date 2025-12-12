import { apiClient } from './apiClient';
import { ClothingItem, Look, PublicLook } from '../types';

export interface UserProfile {
  email: string;
  displayName: string | null;
  avatarUrl?: string | null;
  height?: number | null;
  bodyType?: string | null;
  gender?: 'male' | 'female' | 'other' | string | null;
}

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

  fetchUserProfile: async (email: string): Promise<UserProfile> => {
    if (!USE_BACKEND_DATA) {
      throw new Error('백엔드가 설정되지 않았습니다');
    }
    try {
      const response = await apiClient.get<UserProfile>('/api/data/profile', {
        params: { email },
      });
      return response;
    } catch (error) {
      console.error('[dataService] 프로필 조회 오류:', error);
      throw error;
    }
  },

  updateUserProfile: async (input: {
    email: string;
    displayName?: string;
    avatarUrl?: string | null;
    height?: number | null;
    bodyType?: string | null;
    gender?: 'male' | 'female' | 'other' | string | null;
  }): Promise<UserProfile> => {
    if (!USE_BACKEND_DATA) {
      throw new Error('백엔드가 설정되지 않았습니다');
    }
    try {
      const response = await apiClient.put<UserProfile>('/api/data/profile', input);
      return response;
    } catch (error) {
      console.error('[dataService] 프로필 업데이트 오류:', error);
      throw error;
    }
  },

  // ============================================
  // 쓰기 API - 옷장 (ClothingItem)
  // ============================================

  /**
   * 옷장에 새 옷을 추가 (사용자 이메일 기준으로 백엔드에서 User 연결)
   * 
   * @param email - 현재 로그인한 사용자의 이메일
   * @param displayName - 사용자 표시 이름 (선택)
   * @param itemPayload - ClothingItem 필드들 (id, userId, createdAt 제외)
   * @returns Promise<ClothingItem>
   * 
   * Backend: POST /api/data/closet
   */
  createClothingItemForUser: async (
    email: string,
    displayName: string | undefined,
    itemPayload: Omit<ClothingItem, 'id' | 'userId' | 'createdAt'>
  ): Promise<ClothingItem> => {
    if (!USE_BACKEND_DATA) {
      throw new Error('백엔드가 설정되지 않았습니다');
    }

    try {
      const response = await apiClient.post<{ item: ClothingItem }>(
        '/api/data/closet',
        {
          email,
          displayName,
          item: itemPayload,
        }
      );

      console.log(`[dataService] 옷 추가 성공: ${response.item.id}`);
      return response.item;
    } catch (error) {
      console.error('[dataService] createClothingItemForUser error:', error);
      throw error;
    }
  },

  /**
   * 옷장 아이템 수정 (소유자만 가능)
   * 
   * @param email - 현재 로그인한 사용자의 이메일
   * @param id - ClothingItem ID
   * @param patch - 수정할 필드들
   * @returns Promise<ClothingItem>
   * 
   * Backend: PUT /api/data/closet/:id
   */
  updateClothingItem: async (
    email: string,
    id: string,
    patch: Partial<Omit<ClothingItem, 'id' | 'userId' | 'createdAt'>>
  ): Promise<ClothingItem> => {
    if (!USE_BACKEND_DATA) {
      throw new Error('백엔드가 설정되지 않았습니다');
    }

    try {
      const response = await apiClient.put<{ item: ClothingItem }>(
        `/api/data/closet/${id}`,
        {
          email,
          patch,
        }
      );

      console.log(`[dataService] 옷 수정 성공: ${id}`);
      return response.item;
    } catch (error) {
      console.error('[dataService] updateClothingItem error:', error);
      throw error;
    }
  },

  /**
   * 옷장 아이템 삭제 (소유자만 가능)
   * 
   * @param email - 현재 로그인한 사용자의 이메일
   * @param id - ClothingItem ID
   * @returns Promise<{ success: true }>
   * 
   * Backend: DELETE /api/data/closet/:id
   */
  deleteClothingItem: async (
    email: string,
    id: string
  ): Promise<{ success: boolean }> => {
    if (!USE_BACKEND_DATA) {
      throw new Error('백엔드가 설정되지 않았습니다');
    }

    try {
      const response = await apiClient.del<{ success: boolean }>(
        `/api/data/closet/${id}`,
        { email }
      );

      console.log(`[dataService] 옷 삭제 성공: ${id}`);
      return response;
    } catch (error) {
      console.error('[dataService] deleteClothingItem error:', error);
      throw error;
    }
  },

  // ============================================
  // 쓰기 API - 룩 (Look)
  // ============================================

  /**
   * 새 룩을 저장 (사용자 이메일 기준으로 백엔드에서 User 연결)
   * 
   * @param email - 현재 로그인한 사용자의 이메일
   * @param displayName - 사용자 표시 이름 (선택)
   * @param lookPayload - Look 필드들 (id, userId, createdAt 제외)
   * @returns Promise<Look>
   * 
   * Backend: POST /api/data/looks
   */
  createLookForUser: async (
    email: string,
    displayName: string | undefined,
    lookPayload: {
      name: string;
      itemIds: string[];
      layers: any[];
      snapshotUrl?: string;
      isPublic?: boolean;
      tags?: string[];
    }
  ): Promise<Look> => {
    if (!USE_BACKEND_DATA) {
      throw new Error('백엔드가 설정되지 않았습니다');
    }

    try {
      const response = await apiClient.post<{ look: Look }>(
        '/api/data/looks',
        {
          email,
          displayName,
          look: lookPayload,
        }
      );

      console.log(`[dataService] 룩 저장 성공: ${response.look.id}`);
      return response.look;
    } catch (error) {
      console.error('[dataService] createLookForUser error:', error);
      throw error;
    }
  },

  /**
   * 룩 삭제 (소유자만 가능)
   * 
   * @param email - 현재 로그인한 사용자의 이메일
   * @param id - Look ID
   * @returns Promise<{ success: true }>
   * 
   * Backend: DELETE /api/data/looks/:id
   */
  deleteLook: async (
    email: string,
    id: string
  ): Promise<{ success: boolean }> => {
    if (!USE_BACKEND_DATA) {
      throw new Error('백엔드가 설정되지 않았습니다');
    }

    try {
      const response = await apiClient.del<{ success: boolean }>(
        `/api/data/looks/${id}`,
        { email }
      );

      console.log(`[dataService] 룩 삭제 성공: ${id}`);
      return response;
    } catch (error) {
      console.error('[dataService] deleteLook error:', error);
      throw error;
    }
  },

  // ============================================
  // 공개 피드 연동
  // ============================================

  /**
   * 공개 피드에 룩을 올리는 함수
   * 요청에 사용자의 이메일을 함께 보내서 서버에서 User를 찾도록 함
   */
  publishLookToPublicFeed: async (
    email: string,
    displayName: string | undefined,
    lookId: string
  ): Promise<PublicLook> => {
    if (!USE_BACKEND_DATA) {
      throw new Error('백엔드가 설정되지 않았습니다');
    }

    try {
      const response = await apiClient.post<{ publicLook: PublicLook }>(
        '/api/data/public-looks',
        { email, displayName, lookId }
      );

      console.log(`[dataService] 공개 룩 생성 성공: ${response.publicLook.publicId}`);
      return response.publicLook;
    } catch (error) {
      console.error('[dataService] publishLookToPublicFeed error:', error);
      throw error;
    }
  },

  /**
   * 공개 피드에서 룩을 삭제(공개 해제)하는 함수
   * 서버에 요청자 이메일을 함께 보내어 권한을 확인함
   */
  deletePublicLook: async (
    publicId: string,
    email?: string
  ): Promise<{ success: boolean }> => {
    if (!USE_BACKEND_DATA) {
      throw new Error('백엔드가 설정되어 있지 않습니다.');
    }

    try {
      const response = await apiClient.del<{ success: boolean }>(
        `/api/data/public-looks/${publicId}`,
        email ? { email } : undefined
      );

      console.log(`[dataService] 공개 룩 삭제 성공: ${publicId}`);
      return response;
    } catch (error) {
      console.error('[dataService] deletePublicLook error:', error);
      throw error;
    }
  },

  togglePublicLookLike: async (
    publicId: string,
    action: 'like' | 'unlike'
  ): Promise<{ likesCount: number; bookmarksCount: number }> => {
    if (!USE_BACKEND_DATA) {
      throw new Error('백엔드가 설정되어 있지 않습니다.');
    }
    try {
      const response = await apiClient.post<{ likesCount: number; bookmarksCount: number }>(
        `/api/data/public-looks/${publicId}/like`,
        { action }
      );
      return response;
    } catch (error) {
      console.error('[dataService] togglePublicLookLike 실패:', error);
      throw error;
    }
  },

  togglePublicLookBookmark: async (
    publicId: string,
    action: 'bookmark' | 'unbookmark'
  ): Promise<{ likesCount: number; bookmarksCount: number }> => {
    if (!USE_BACKEND_DATA) {
      throw new Error('백엔드가 설정되어 있지 않습니다.');
    }
    try {
      const response = await apiClient.post<{ likesCount: number; bookmarksCount: number }>(
        `/api/data/public-looks/${publicId}/bookmark`,
        { action }
      );
      return response;
    } catch (error) {
      console.error('[dataService] togglePublicLookBookmark 실패:', error);
      throw error;
    }
  },
};

/**
 * Migration Plan (Step 22+):
 * 
 * Step 22 (현재):
 * - ✅ 백엔드 쓰기 API 구현 완료 (POST/PUT/DELETE for closet & looks)
 * - ✅ dataService에 쓰기 함수 추가 완료
 * - ⏳ Zustand 스토어에서 선택적으로 백엔드 호출 (TODO 주석으로 표시)
 * 
 * Step 23 (예정):
 * - localStorage → 백엔드 완전 마이그레이션
 * - 로그인 시 백엔드에서 데이터 로드 → Zustand
 * - 모든 쓰기 동작에서 백엔드 동기화
 * - 오프라인 지원: localStorage를 캐시로 활용
 */
