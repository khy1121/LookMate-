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
  syncUserProfileFromBackend: (email: string) => Promise<void>;

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
  myPublicLooks: PublicLook[];
  isMyPublicLooksLoading: boolean;
  publishLook: (lookId: string, tags?: string[]) => Promise<void>;
  unpublishPublicLook: (publicId: string) => void;
  toggleLikePublicLook: (publicId: string) => Promise<void>;
  toggleBookmarkPublicLook: (publicId: string) => Promise<void>;
  getPublicLookById: (publicId: string) => PublicLook | null;
  updatePublicLookReactions: (publicId: string, patch: { likesCount?: number; bookmarksCount?: number }) => void;
  optimisticTogglePublicLookReaction: (publicId: string, type: 'like' | 'bookmark') => void;
  loadMyPublicLooks: () => Promise<void>;
}

export const useStore = create<AppState>((set, get) => ({
  // Authentication
  currentUser: null,
  isClothesLoading: false,

  // 백엔드에서 프로필 정보를 불러와 상태를 갱신합니다.
  syncUserProfileFromBackend: async (email: string) => {
    try {
      const profile = await dataService.fetchUserProfile(email);
      set((state) => {
        if (!state.currentUser) return {};
        const mergedCurrentUser = {
          ...state.currentUser,
          displayName: profile.displayName ?? state.currentUser.displayName,
          avatarUrl: profile.avatarUrl ?? (state.currentUser as any).avatarUrl ?? null,
          height: profile.height ?? (state.currentUser as any).height,
          bodyType: profile.bodyType ?? (state.currentUser as any).bodyType,
          gender: profile.gender ?? (state.currentUser as any).gender,
        };
        const mergedUser = state.user
          ? {
              ...state.user,
              displayName: profile.displayName ?? state.user.displayName,
              name: profile.displayName ?? state.user.name,
              avatarUrl: profile.avatarUrl ?? state.user.avatarUrl,
              height: profile.height ?? (state.user as any).height,
              bodyType: profile.bodyType ?? (state.user as any).bodyType,
              gender: profile.gender ?? (state.user as any).gender,
            }
          : state.user;
        return { currentUser: mergedCurrentUser, user: mergedUser };
      });
    } catch (err) {
      console.error('[Store] 프로필 동기화 실패:', err);
      useUiStore.getState().showToast('프로필 정보를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.', 'error');
    }
  },
  
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

      if (USE_BACKEND_DATA && user.email) {
        get().syncUserProfileFromBackend(user.email);
        get().loadMyPublicLooks();
      } else {
        set({ myPublicLooks: [] });
      }
    } else {
      // Clear data on logout
      set({ clothes: [], looks: [], user: null, activeLook: null, recommendedItems: null, isClothesLoading: false, myPublicLooks: [], isMyPublicLooksLoading: false });
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
    {
      set((state) => {
        if (!state.user) return {};
        const updatedUser = { ...state.user, ...patch };
        const updatedCurrentUser = state.currentUser ? { ...state.currentUser, ...patch } : state.currentUser;
        return { user: updatedUser, currentUser: updatedCurrentUser };
      });

      if (USE_BACKEND_DATA) {
        const email = get().currentUser?.email;
        if (email) {
          const current = get().currentUser;
          dataService
            .updateUserProfile({
              email,
              displayName: patch.displayName ?? current?.displayName,
              avatarUrl: patch.avatarUrl ?? (current as any)?.avatarUrl ?? null,
              height: patch.height ?? (current as any)?.height ?? null,
              bodyType: (patch as any).bodyType ?? (current as any)?.bodyType ?? null,
              gender: (patch as any).gender ?? (current as any)?.gender ?? null,
            })
            .catch((err) => {
              console.error('[Store] 프로필 업데이트 실패:', err);
              useUiStore.getState().showToast('프로필 동기화에 실패했습니다. 잠시 후 다시 시도해주세요.', 'error');
            });
        }
      }
    },

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
        isPublic: false,
        publicId: null,
        tags: [],
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
  myPublicLooks: [],
  isMyPublicLooksLoading: false,

  loadMyPublicLooks: async () => {
    const state = get();
    if (!state.currentUser || !state.currentUser.email) return;

    if (!USE_BACKEND_DATA) {
      console.log('[Store] 백엔드 비활성화: 내 공개 코디는 로드하지 않습니다.');
      set({ myPublicLooks: [] });
      return;
    }

    set({ isMyPublicLooksLoading: true });
    try {
      const publicLooks = await dataService.fetchMyPublicLooks(state.currentUser.email);
      set({ myPublicLooks: publicLooks });
    } catch (err) {
      console.error('[Store] 내 공개 코디 로드 실패:', err);
      useUiStore.getState().showToast('내 공개 코디 목록을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.', 'error');
    } finally {
      set({ isMyPublicLooksLoading: false });
    }
  },

  publishLook: async (lookId, tags = []) => {
    const state = get();
    if (!state.currentUser) {
      throw new Error('로그인이 필요합니다.');
    }

    const targetLook = state.looks.find((l) => l.id === lookId);
    if (!targetLook) {
      throw new Error('코디를 찾을 수 없습니다.');
    }
    if (targetLook.isPublic) {
      useUiStore.getState().showToast('이미 공개된 코디입니다.', 'info');
      return;
    }

    const tagsToUse = tags.length ? tags : targetLook.tags || [];

    if (!USE_BACKEND_DATA) {
      const publicId = crypto.randomUUID();
      const now = Date.now();
      set((s) => {
        const updatedLooks = s.looks.map((l) =>
          l.id === lookId ? { ...l, isPublic: true, publicId, tags: tagsToUse } : l
        );
        const publicLook: PublicLook = {
          publicId,
          name: targetLook.name,
          snapshotUrl: targetLook.snapshotUrl || null,
          items: targetLook.items,
          tags: tagsToUse,
          ownerName: s.currentUser!.displayName,
          ownerId: s.currentUser!.id,
          ownerEmail: s.currentUser!.email,
          createdAt: now,
          likesCount: 0,
          bookmarksCount: 0,
        };
        const newPublicLooks = [...s.publicLooks, publicLook];
        const nextMyPublicLooks = [publicLook, ...s.myPublicLooks.filter((pl) => pl.publicId !== publicId)];
        setLocalStorage('lm_publicLooks', newPublicLooks);
        setLocalStorage(getUserKey(s.currentUser!.id, 'looks'), updatedLooks);
        return { looks: updatedLooks, publicLooks: newPublicLooks, myPublicLooks: nextMyPublicLooks };
      });
      useUiStore.getState().showToast('공개 피드에 게시되었습니다.', 'success');
      return;
    }

    try {
      const publicLook = await dataService.publishLookToPublicFeed(
        state.currentUser.email,
        state.currentUser.displayName,
        lookId
      );

      // TODO: Explore 피드를 최신화하도록 간단한 refetch 플래그를 연결하면 좋음
      set((s) => {
        const updatedLooks = s.looks.map((l) =>
          l.id === lookId ? { ...l, isPublic: true, publicId: publicLook.publicId, tags: publicLook.tags || tagsToUse } : l
        );
        const newPublicLooks = [...s.publicLooks, publicLook];
        const nextMyPublicLooks = [publicLook, ...s.myPublicLooks.filter((pl) => pl.publicId !== publicLook.publicId)];
        setLocalStorage('lm_publicLooks', newPublicLooks);
        setLocalStorage(getUserKey(s.currentUser!.id, 'looks'), updatedLooks);
        return { looks: updatedLooks, publicLooks: newPublicLooks, myPublicLooks: nextMyPublicLooks };
      });
      useUiStore.getState().showToast('공개 피드에 게시되었습니다.', 'success');
    } catch (err) {
      console.error('공개 피드 업로드 실패:', err);
      useUiStore.getState().showToast('공개 피드 업로드에 실패했습니다. 잠시 후 다시 시도해주세요.', 'error');
    }
  },

  unpublishPublicLook: (publicId) =>
    set((state) => {
      const updatedPublicLooks = state.publicLooks.filter((pl) => pl.publicId !== publicId);
      const updatedMyPublicLooks = state.myPublicLooks.filter((pl) => pl.publicId !== publicId);
      const updatedLooks = state.looks.map((look) =>
        look.publicId === publicId
          ? { ...look, isPublic: false, publicId: null }
          : look
      );
      if (state.currentUser) {
        setLocalStorage('lm_publicLooks', updatedPublicLooks);
        setLocalStorage(getUserKey(state.currentUser.id, 'looks'), updatedLooks);
      }
      return { publicLooks: updatedPublicLooks, looks: updatedLooks, myPublicLooks: updatedMyPublicLooks };
    }),

  updatePublicLookReactions: (publicId, patch) =>
    set((state) => {
      const updatedPublicLooks = state.publicLooks.map((pl) =>
        pl.publicId === publicId ? { ...pl, ...patch } : pl
      );
      if (state.currentUser) {
        setLocalStorage('lm_publicLooks', updatedPublicLooks);
      }
      return { publicLooks: updatedPublicLooks };
    }),

  optimisticTogglePublicLookReaction: (publicId, type) =>
    set((state) => {
      const isLike = type === 'like';
      const ids = isLike ? state.likedPublicLookIds : state.bookmarkedPublicLookIds;
      const already = ids.includes(publicId);
      const delta = already ? -1 : 1;

      const updatedPublicLooks = state.publicLooks.map((pl) => {
        if (pl.publicId !== publicId) return pl;
        if (isLike) {
          return { ...pl, likesCount: Math.max(0, pl.likesCount + delta) };
        }
        return { ...pl, bookmarksCount: Math.max(0, pl.bookmarksCount + delta) };
      });

      const nextIds = already ? ids.filter((id) => id !== publicId) : [...ids, publicId];
      if (state.currentUser) {
        const key = isLike ? 'liked' : 'bookmarked';
        setLocalStorage(getUserKey(state.currentUser.id, key), nextIds);
        setLocalStorage('lm_publicLooks', updatedPublicLooks);
      }

      return isLike
        ? { publicLooks: updatedPublicLooks, likedPublicLookIds: nextIds }
        : { publicLooks: updatedPublicLooks, bookmarkedPublicLookIds: nextIds };
    }),

  toggleLikePublicLook: async (publicId) => {
    const state = get();
    if (!state.currentUser) {
      throw new Error('로그인이 필요합니다.');
    }
    const demoToastKey = 'lm_like_demo_notice';

    const wasLiked = state.likedPublicLookIds.includes(publicId);
    state.optimisticTogglePublicLookReaction(publicId, 'like');

    if (!USE_BACKEND_DATA) {
      if (!sessionStorage.getItem(demoToastKey)) {
        useUiStore.getState().showToast('데모 모드에서는 좋아요가 새로고침 후 유지되지 않습니다.', 'info');
        sessionStorage.setItem(demoToastKey, 'shown');
      }
      return;
    }

    try {
      const result = await dataService.togglePublicLookLike(publicId, wasLiked ? 'unlike' : 'like');
      get().updatePublicLookReactions(publicId, result);
    } catch (err) {
      get().optimisticTogglePublicLookReaction(publicId, 'like');
      console.error('공개 룩 좋아요 실패:', err);
      useUiStore.getState().showToast('좋아요 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.', 'error');
    }
  },

  toggleBookmarkPublicLook: async (publicId) => {
    const state = get();
    if (!state.currentUser) {
      throw new Error('로그인이 필요합니다.');
    }
    const demoToastKey = 'lm_bookmark_demo_notice';

    const wasBookmarked = state.bookmarkedPublicLookIds.includes(publicId);
    state.optimisticTogglePublicLookReaction(publicId, 'bookmark');

    if (!USE_BACKEND_DATA) {
      if (!sessionStorage.getItem(demoToastKey)) {
        useUiStore.getState().showToast('데모 모드에서는 북마크가 새로고침 후 유지되지 않습니다.', 'info');
        sessionStorage.setItem(demoToastKey, 'shown');
      }
      return;
    }

    try {
      const result = await dataService.togglePublicLookBookmark(publicId, wasBookmarked ? 'unbookmark' : 'bookmark');
      get().updatePublicLookReactions(publicId, result);
    } catch (err) {
      get().optimisticTogglePublicLookReaction(publicId, 'bookmark');
      console.error('공개 룩 북마크 실패:', err);
      useUiStore.getState().showToast('북마크 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.', 'error');
    }
  },

  getPublicLookById: (publicId) => {
    const state = get();
    return state.publicLooks.find((pl) => pl.publicId === publicId) || null;
  },
}));