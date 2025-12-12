import { create } from 'zustand';
import { User, ClothingItem, Look, ActiveLook, FittingLayer, Season, Product, Category, AuthUser, PublicLook } from '../types';
import { getCurrentUser } from '../services/authService';
import { dataService } from '../services/dataService';
import { useUiStore } from './useUiStore';

const USE_BACKEND_DATA = !!import.meta.env.VITE_API_BASE_URL;

// LocalStorage Helper - User-specific keys
const getUserKey = (userId: string, resource: string): string => {
  return `lm_${resource}_${userId}`;
};

const getLocalStorage = <T>(key: string, initial: T): T => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : initial;
  } catch (e) {
    console.error('LocalStorage parsing error:', e);
    return initial;
  }
};

const setLocalStorage = <T>(key: string, value: T) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error('LocalStorage saving error:', e);
  }
};

interface AppState {
  // Authentication State
  currentUser: AuthUser | null;
  setCurrentUser: (user: AuthUser | null) => void;
  loadInitialUserAndData: () => Promise<void>;

  // User State (Legacy - kept for avatar/profile info)
  user: User | null;
  isAuthenticated: boolean;
  login: (user: User) => void;
  logout: () => void;
  updateUser: (patch: Partial<User>) => void;

  // Closet State
  clothes: ClothingItem[];
  isClothesLoading: boolean;
  addClothing: (item: Omit<ClothingItem, 'id' | 'createdAt' | 'isFavorite'>) => void;
  removeClothing: (id: string) => void;
  toggleFavorite: (id: string) => void;
  updateClothing: (id: string, patch: Partial<ClothingItem>) => void;
  addClothingFromProduct: (product: Product, override?: Partial<ClothingItem>) => void;

  // Look State
  looks: Look[];
  createLookFromActive: (name: string, snapshotUrl?: string | null) => string | null;
  deleteLook: (id: string) => void;
  setActiveLookFromLook: (id: string) => void;

  // Fitting Room State
  activeLook: ActiveLook | null;
  startLookWithItem: (itemId: string) => void;
  addItemToActiveLook: (itemId: string) => void;
  updateLayer: (clothingId: string, patch: Partial<FittingLayer>) => void;
  removeItemFromActiveLook: (clothingId: string) => void;
  clearActiveLook: () => void;

  // Recommendation State
  recommendedItems: ClothingItem[] | null;
  generateRecommendedItems: (options?: { season?: Season }) => void;
  clearRecommendedItems: () => void;
  applyRecommendedToActive: () => void;

  // Public Look State (Social Feed)
  publicLooks: PublicLook[];
  likedPublicLookIds: string[];
  bookmarkedPublicLookIds: string[];
  publishLook: (lookId: string, tags?: string[]) => void;
  toggleLikePublicLook: (publicId: string) => void;
  toggleBookmarkPublicLook: (publicId: string) => void;
  getPublicLookById: (publicId: string) => PublicLook | null;
}

export const useStore = create<AppState>((set, get) => ({
  // Authentication
  currentUser: null,
  isClothesLoading: false,
  
  setCurrentUser: (user) => {
    set({ currentUser: user, isAuthenticated: !!user });
    if (user) {
      // Load user-specific data
      const clothesKey = getUserKey(user.id, 'clothes');
      const looksKey = getUserKey(user.id, 'looks');
      const clothes = getLocalStorage<ClothingItem[]>(clothesKey, []);
      const looks = getLocalStorage<Look[]>(looksKey, []);
      set({ clothes, looks });

      // 백엔드가 켜져 있을 때는 서버 데이터를 우선으로 동기화
      if (USE_BACKEND_DATA) {
        set({ isClothesLoading: true });
        dataService
          .fetchClosetItems(user.id)
          .then((items) => {
            set({ clothes: items });
            setLocalStorage(clothesKey, items);
          })
          .catch((err) => {
            console.error('[Closet] 백엔드 옷장 로드 실패:', err);
            useUiStore.getState().showToast('옷장 데이터를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.', 'error');
            // 로컬 캐시로 fallback (이미 set되어 있음)
          })
          .finally(() => set({ isClothesLoading: false }));
      }

      // Sync legacy user object
      const legacyUser: User = {
        id: user.id,
        name: user.displayName,
        email: user.email,
        displayName: user.displayName,
        avatarUrl: null,
        createdAt: user.createdAt,
      };
      set({ user: legacyUser });
    } else {
      // Clear data on logout
      set({ clothes: [], looks: [], user: null, activeLook: null, recommendedItems: null, isClothesLoading: false });
    }
  },

  loadInitialUserAndData: async () => {
    try {
      const authUser = await getCurrentUser();
      get().setCurrentUser(authUser);
    } catch (e) {
      console.error('Failed to load initial user', e);
      get().setCurrentUser(null);
    }
  },

  // User (Legacy)
  user: null,
  isAuthenticated: false,
  
  login: (user) => {
    set({ user, isAuthenticated: true });
    // Note: This is legacy, actual auth uses setCurrentUser
  },
  
  logout: () => {
    set({ user: null, isAuthenticated: false, currentUser: null });
  },
  
  updateUser: (patch) =>
    set((state) => {
      if (!state.user) return {};
      const updatedUser = { ...state.user, ...patch };
      return { user: updatedUser };
    }),

  // Closet
  clothes: [],
  
  addClothing: (itemData) =>
    set((state) => {
      if (!state.currentUser) {
        throw new Error('로그인이 필요합니다.');
      }

      if (!USE_BACKEND_DATA) {
        const newItem: ClothingItem = {
          ...itemData,
          id: crypto.randomUUID(),
          userId: state.currentUser.id,
          createdAt: Date.now(),
          isFavorite: false,
          shoppingUrl: itemData.shoppingUrl ?? null,
          price: itemData.price ?? null,
          isPurchased: itemData.isPurchased ?? false,
        };
        const newClothes = [newItem, ...state.clothes];
        const clothesKey = getUserKey(state.currentUser.id, 'clothes');
        setLocalStorage(clothesKey, newClothes);
        return { clothes: newClothes };
      }

      // 백엔드 모드: 서버 저장 후 반영
      dataService
        .createClothingItemForUser(
          state.currentUser.email,
          state.currentUser.displayName,
          {
            ...itemData,
            isFavorite: false,
            shoppingUrl: itemData.shoppingUrl ?? null,
            price: itemData.price ?? null,
            isPurchased: itemData.isPurchased ?? false,
          }
        )
        .then((created) => {
          set((innerState) => {
            const newClothes = [created, ...innerState.clothes];
            const clothesKey = getUserKey(innerState.currentUser!.id, 'clothes');
            setLocalStorage(clothesKey, newClothes);
            return { clothes: newClothes };
          });
        })
        .catch((err) => {
          console.error('[Closet] 옷 추가 실패:', err);
          useUiStore.getState().showToast('저장 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.', 'error');
        });

      return {};
    }),
    
  removeClothing: (id) =>
    set((state) => {
      if (!state.currentUser) return {};

      if (!USE_BACKEND_DATA) {
        const newClothes = state.clothes.filter((c) => c.id !== id);
        const clothesKey = getUserKey(state.currentUser.id, 'clothes');
        setLocalStorage(clothesKey, newClothes);
        return { clothes: newClothes };
      }

      dataService
        .deleteClothingItem(state.currentUser.email, id)
        .then(() => {
          set((innerState) => {
            const newClothes = innerState.clothes.filter((c) => c.id !== id);
            const clothesKey = getUserKey(innerState.currentUser!.id, 'clothes');
            setLocalStorage(clothesKey, newClothes);
            return { clothes: newClothes };
          });
        })
        .catch((err) => {
          console.error('[Closet] 옷 삭제 실패:', err);
          useUiStore.getState().showToast('저장 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.', 'error');
        });

      return {};
    }),
  toggleFavorite: (id) =>
    set((state) => {
      if (!state.currentUser) return {};
      const target = state.clothes.find((c) => c.id === id);
      if (!target) return {};
      const nextFavorite = !target.isFavorite;

      if (!USE_BACKEND_DATA) {
        const newClothes = state.clothes.map((c) =>
          c.id === id ? { ...c, isFavorite: nextFavorite } : c
        );
        const clothesKey = getUserKey(state.currentUser.id, 'clothes');
        setLocalStorage(clothesKey, newClothes);
        return { clothes: newClothes };
      }

      dataService
        .updateClothingItem(state.currentUser.email, id, { isFavorite: nextFavorite })
        .then((updated) => {
          set((innerState) => {
            const newClothes = innerState.clothes.map((c) =>
              c.id === id ? { ...updated } : c
            );
            const clothesKey = getUserKey(innerState.currentUser!.id, 'clothes');
            setLocalStorage(clothesKey, newClothes);
            return { clothes: newClothes };
          });
        })
        .catch((err) => {
          console.error('[Closet] 즐겨찾기 변경 실패:', err);
          useUiStore.getState().showToast('저장 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.', 'error');
        });

      return {};
    }),
  updateClothing: (id, patch) =>
    set((state) => {
      if (!state.currentUser) return {};

      if (!USE_BACKEND_DATA) {
        const newClothes = state.clothes.map((c) =>
          c.id === id ? { ...c, ...patch } : c
        );
        const clothesKey = getUserKey(state.currentUser.id, 'clothes');
        setLocalStorage(clothesKey, newClothes);
        return { clothes: newClothes };
      }

      const safePatch = { ...patch } as Partial<Omit<ClothingItem, 'id' | 'userId' | 'createdAt'>>;
      delete (safePatch as any).id;
      delete (safePatch as any).userId;
      delete (safePatch as any).createdAt;

      dataService
        .updateClothingItem(state.currentUser.email, id, safePatch)
        .then((updated) => {
          set((innerState) => {
            const newClothes = innerState.clothes.map((c) =>
              c.id === id ? { ...updated } : c
            );
            const clothesKey = getUserKey(innerState.currentUser!.id, 'clothes');
            setLocalStorage(clothesKey, newClothes);
            return { clothes: newClothes };
          });
        })
        .catch((err) => {
          console.error('[Closet] 옷 수정 실패:', err);
          useUiStore.getState().showToast('저장 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.', 'error');
        });

      return {};
    }),

  addClothingFromProduct: (product, override) =>
    set((state) => {
      if (!state.currentUser) {
        throw new Error('로그인이 필요합니다.');
      }

      // Extract color from tags (simple heuristic)
      const colorKeywords = ['black', 'white', 'red', 'blue', 'green', 'yellow', 'pink', 'purple', 'gray', 'brown', 'navy', 'beige'];
      let color = 'unknown';
      if (product.tags) {
        const foundColor = product.tags.find((tag) =>
          colorKeywords.some((keyword) => tag.toLowerCase().includes(keyword))
        );
        if (foundColor) color = foundColor;
      }

      // Map Product → ClothingItem
      const newItem: ClothingItem = {
        id: crypto.randomUUID(),
        userId: state.currentUser.id,
        imageUrl: product.thumbnailUrl,
        originalImageUrl: product.thumbnailUrl,
        category: (product.category as Category) ?? 'top',
        color,
        brand: product.brand ?? undefined,
        size: undefined,
        season: undefined,
        memo: `${product.name}`,
        isFavorite: false,
        createdAt: Date.now(),
        shoppingUrl: product.productUrl,
        price: product.price,
        isPurchased: false, // 기본값: 관심상품
        // Apply overrides
        ...override,
      };

      if (!USE_BACKEND_DATA) {
        const newClothes = [newItem, ...state.clothes];
        const clothesKey = getUserKey(state.currentUser.id, 'clothes');
        setLocalStorage(clothesKey, newClothes);
        return { clothes: newClothes };
      }

      // 백엔드 모드: 생성 후 상태 반영
      const { email, displayName } = state.currentUser;
      const payload = { ...newItem };
      // id/userId/createdAt은 서버에서 관리
      delete (payload as any).id;
      delete (payload as any).userId;
      delete (payload as any).createdAt;

      dataService
        .createClothingItemForUser(email, displayName, payload as Omit<ClothingItem, 'id' | 'userId' | 'createdAt'>)
        .then((created) => {
          set((innerState) => {
            const newClothes = [created, ...innerState.clothes];
            const clothesKey = getUserKey(innerState.currentUser!.id, 'clothes');
            setLocalStorage(clothesKey, newClothes);
            return { clothes: newClothes };
          });
        })
        .catch((err) => {
          console.error('[Closet] 상품 기반 추가 실패:', err);
          useUiStore.getState().showToast('저장 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.', 'error');
        });

      return {};
    }),

  // Looks
  looks: [],
  
  createLookFromActive: (name, snapshotUrl) => {
    let savedLookId: string | null = null;
    set((state) => {
      if (!state.currentUser || !state.activeLook) return {};

      // 현재 활성화된 레이어에 해당하는 옷 정보만 필터링 (Snapshot)
      const usedItemIds = state.activeLook.layers.map(l => l.clothingId);
      const itemsSnapshot = state.clothes.filter(c => usedItemIds.includes(c.id));

      const newLook: Look = {
        id: crypto.randomUUID(),
        userId: state.currentUser.id,
        name,
        items: itemsSnapshot,
        // Deep copy layers to prevent reference issues
        layers: state.activeLook.layers.map(l => ({ ...l })),
        createdAt: Date.now(),
        snapshotUrl: snapshotUrl || null,
      };

      savedLookId = newLook.id;

      const newLooks = [newLook, ...state.looks];
      const looksKey = getUserKey(state.currentUser.id, 'looks');
      setLocalStorage(looksKey, newLooks);

      // TODO: Step 23 - 백엔드 동기화
      // if (import.meta.env.VITE_API_BASE_URL) {
      //   const lookPayload = {
      //     name: newLook.name,
      //     itemIds: usedItemIds,
      //     layers: newLook.layers,
      //     snapshotUrl: newLook.snapshotUrl || undefined,
      //     isPublic: false,
      //     tags: [],
      //   };
      //   dataService.createLookForUser(
      //     state.currentUser.email,
      //     state.currentUser.displayName,
      //     lookPayload
      //   ).catch(err => console.error('백엔드 동기화 실패:', err));
      // }

      return { looks: newLooks, activeLook: { ...state.activeLook, name } };
    });
    return savedLookId;
  },
  deleteLook: (id) =>
    set((state) => {
      if (!state.currentUser) return {};
      const newLooks = state.looks.filter(l => l.id !== id);
      const looksKey = getUserKey(state.currentUser.id, 'looks');
      setLocalStorage(looksKey, newLooks);
      return { looks: newLooks };
    }),
  setActiveLookFromLook: (id) =>
    set((state) => {
      const look = state.looks.find(l => l.id === id);
      if (!look) return {};
      
      // 불러올 때 layers 복원 (Deep copy)
      return {
        activeLook: {
          layers: look.layers.map(l => ({ ...l })),
          name: look.name
        }
      };
    }),

  // Fitting Room
  activeLook: null,

  startLookWithItem: (itemId) =>
    set((state) => {
      const currentLayers = state.activeLook?.layers || [];
      if (currentLayers.some((l) => l.clothingId === itemId)) {
        return { activeLook: state.activeLook };
      }

      const newLayer: FittingLayer = {
        clothingId: itemId,
        x: 0,
        y: 0,
        scale: 1,
        rotation: 0,
        visible: true,
      };

      return {
        activeLook: {
          ...state.activeLook,
          layers: [...currentLayers, newLayer],
        },
      };
    }),

  addItemToActiveLook: (itemId) =>
    set((state) => {
      const currentLayers = state.activeLook?.layers || [];
      if (currentLayers.some((l) => l.clothingId === itemId)) {
        return { activeLook: state.activeLook };
      }
      
      const newLayer: FittingLayer = {
        clothingId: itemId,
        x: 0, y: 0, scale: 1, rotation: 0, visible: true
      };

      return {
        activeLook: {
          layers: [...currentLayers, newLayer],
          name: state.activeLook?.name
        }
      };
    }),

  updateLayer: (clothingId, patch) =>
    set((state) => {
      if (!state.activeLook) return {};
      return {
        activeLook: {
          ...state.activeLook,
          layers: state.activeLook.layers.map((l) =>
            l.clothingId === clothingId ? { ...l, ...patch } : l
          ),
        },
      };
    }),

  removeItemFromActiveLook: (clothingId) =>
    set((state) => {
      if (!state.activeLook) return {};
      return {
        activeLook: {
          ...state.activeLook,
          layers: state.activeLook.layers.filter((l) => l.clothingId !== clothingId),
        },
      };
    }),

  clearActiveLook: () => set({ activeLook: null }),

  // Recommendation
  recommendedItems: null,

  generateRecommendedItems: (options) =>
    set((state) => {
      const { season } = options || {};
      
      // 시즌 필터링
      let availableItems = state.clothes;
      if (season) {
        availableItems = state.clothes.filter(
          (item) => !item.season || item.season === season
        );
      }

      // 카테고리별로 그룹화
      const byCategory: Record<string, ClothingItem[]> = {};
      availableItems.forEach((item) => {
        if (!byCategory[item.category]) {
          byCategory[item.category] = [];
        }
        byCategory[item.category].push(item);
      });

      const recommended: ClothingItem[] = [];

      // 룰 기반 추천 로직
      // 1순위: onepiece 기반 코디
      if (byCategory['onepiece']?.length > 0) {
        const onepiece = byCategory['onepiece'][Math.floor(Math.random() * byCategory['onepiece'].length)];
        recommended.push(onepiece);
        
        // outer 추가 (선택적)
        if (byCategory['outer']?.length > 0 && Math.random() > 0.5) {
          const outer = byCategory['outer'][Math.floor(Math.random() * byCategory['outer'].length)];
          recommended.push(outer);
        }
        
        // shoes 추가 (선택적)
        if (byCategory['shoes']?.length > 0) {
          const shoes = byCategory['shoes'][Math.floor(Math.random() * byCategory['shoes'].length)];
          recommended.push(shoes);
        }
      } 
      // 2순위: top + bottom 조합
      else if (byCategory['top']?.length > 0 && byCategory['bottom']?.length > 0) {
        const top = byCategory['top'][Math.floor(Math.random() * byCategory['top'].length)];
        const bottom = byCategory['bottom'][Math.floor(Math.random() * byCategory['bottom'].length)];
        recommended.push(top, bottom);
        
        // outer 추가 (선택적)
        if (byCategory['outer']?.length > 0 && Math.random() > 0.5) {
          const outer = byCategory['outer'][Math.floor(Math.random() * byCategory['outer'].length)];
          recommended.push(outer);
        }
        
        // shoes 추가 (선택적)
        if (byCategory['shoes']?.length > 0) {
          const shoes = byCategory['shoes'][Math.floor(Math.random() * byCategory['shoes'].length)];
          recommended.push(shoes);
        }
      }
      
      // accessory 추가 (선택적, 33% 확률)
      if (byCategory['accessory']?.length > 0 && Math.random() > 0.66) {
        const accessory = byCategory['accessory'][Math.floor(Math.random() * byCategory['accessory'].length)];
        recommended.push(accessory);
      }

      return { recommendedItems: recommended.length > 0 ? recommended : null };
    }),

  clearRecommendedItems: () => set({ recommendedItems: null }),

  applyRecommendedToActive: () =>
    set((state) => {
      if (!state.recommendedItems || state.recommendedItems.length === 0) {
        return {};
      }

      // 새로운 레이어 생성
      const newLayers: FittingLayer[] = state.recommendedItems.map((item) => ({
        clothingId: item.id,
        x: 0,
        y: 0,
        scale: 1,
        rotation: 0,
        visible: true,
      }));

      return {
        activeLook: {
          layers: newLayers,
          name: undefined,
        },
      };
    }),

  // Public Look State (Social Feed)
  publicLooks: getLocalStorage<PublicLook[]>('lm_publicLooks', []),
  likedPublicLookIds: [],
  bookmarkedPublicLookIds: [],

  publishLook: (lookId, tags = []) =>
    set((state) => {
      if (!state.currentUser) {
        throw new Error('로그인이 필요합니다.');
      }

      const look = state.looks.find((l) => l.id === lookId);
      if (!look) {
        throw new Error('코디를 찾을 수 없습니다.');
      }

      const publicId = crypto.randomUUID();
      const now = Date.now();

      // Update Look with public metadata
      const updatedLooks = state.looks.map((l) =>
        l.id === lookId
          ? { ...l, isPublic: true, publicId, tags }
          : l
      );

      // Create PublicLook
      const publicLook: PublicLook = {
        publicId,
        name: look.name,
        snapshotUrl: look.snapshotUrl || null,
        items: look.items,
        tags,
        ownerName: state.currentUser.displayName,
        ownerId: state.currentUser.id,
        createdAt: now,
        likesCount: 0,
        bookmarksCount: 0,
      };

      const newPublicLooks = [...state.publicLooks, publicLook];

      // Persist
      setLocalStorage('lm_publicLooks', newPublicLooks);
      setLocalStorage(getUserKey(state.currentUser.id, 'looks'), updatedLooks);

      return { looks: updatedLooks, publicLooks: newPublicLooks };
    }),

  toggleLikePublicLook: (publicId) =>
    set((state) => {
      if (!state.currentUser) {
        throw new Error('로그인이 필요합니다.');
      }

      const isLiked = state.likedPublicLookIds.includes(publicId);
      const newLikedIds = isLiked
        ? state.likedPublicLookIds.filter((id) => id !== publicId)
        : [...state.likedPublicLookIds, publicId];

      // Update like count on PublicLook
      const updatedPublicLooks = state.publicLooks.map((pl) =>
        pl.publicId === publicId
          ? { ...pl, likesCount: pl.likesCount + (isLiked ? -1 : 1) }
          : pl
      );

      // Persist
      setLocalStorage(getUserKey(state.currentUser.id, 'liked'), newLikedIds);
      setLocalStorage('lm_publicLooks', updatedPublicLooks);

      return { likedPublicLookIds: newLikedIds, publicLooks: updatedPublicLooks };
    }),

  toggleBookmarkPublicLook: (publicId) =>
    set((state) => {
      if (!state.currentUser) {
        throw new Error('로그인이 필요합니다.');
      }

      const isBookmarked = state.bookmarkedPublicLookIds.includes(publicId);
      const newBookmarkedIds = isBookmarked
        ? state.bookmarkedPublicLookIds.filter((id) => id !== publicId)
        : [...state.bookmarkedPublicLookIds, publicId];

      // Update bookmark count on PublicLook
      const updatedPublicLooks = state.publicLooks.map((pl) =>
        pl.publicId === publicId
          ? { ...pl, bookmarksCount: pl.bookmarksCount + (isBookmarked ? -1 : 1) }
          : pl
      );

      // Persist
      setLocalStorage(getUserKey(state.currentUser.id, 'bookmarked'), newBookmarkedIds);
      setLocalStorage('lm_publicLooks', updatedPublicLooks);

      return { bookmarkedPublicLookIds: newBookmarkedIds, publicLooks: updatedPublicLooks };
    }),

  getPublicLookById: (publicId) => {
    const state = get();
    return state.publicLooks.find((pl) => pl.publicId === publicId) || null;
  },
}));