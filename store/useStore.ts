import { create } from 'zustand';
import { User, ClothingItem, Look, ActiveLook, FittingLayer, Season, Product, Category } from '../types';

// LocalStorage Helper
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
  // User State
  user: User | null;
  isAuthenticated: boolean;
  login: (user: User) => void;
  logout: () => void;
  updateUser: (patch: Partial<User>) => void;

  // Closet State
  clothes: ClothingItem[];
  addClothing: (item: Omit<ClothingItem, 'id' | 'createdAt' | 'isFavorite'>) => void;
  removeClothing: (id: string) => void;
  toggleFavorite: (id: string) => void;
  updateClothing: (id: string, patch: Partial<ClothingItem>) => void;
  addClothingFromProduct: (product: Product, override?: Partial<ClothingItem>) => void;

  // Look State (New)
  looks: Look[];
  createLookFromActive: (name: string, snapshotUrl?: string | null) => void;
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
}

export const useStore = create<AppState>((set, get) => ({
  // User
  user: getLocalStorage('user', null),
  isAuthenticated: !!getLocalStorage('user', null),
  login: (user) => {
    set({ user, isAuthenticated: true });
    setLocalStorage('user', user);
  },
  logout: () => {
    set({ user: null, isAuthenticated: false });
    localStorage.removeItem('user');
  },
  updateUser: (patch) =>
    set((state) => {
      if (!state.user) return {};
      const updatedUser = { ...state.user, ...patch };
      setLocalStorage('user', updatedUser);
      return { user: updatedUser };
    }),

  // Closet
  clothes: getLocalStorage<ClothingItem[]>('clothes', []),
  addClothing: (itemData) =>
    set((state) => {
      const newItem: ClothingItem = {
        ...itemData,
        id: crypto.randomUUID(),
        createdAt: Date.now(),
        isFavorite: false,
        shoppingUrl: itemData.shoppingUrl ?? null,
        price: itemData.price ?? null,
        isPurchased: itemData.isPurchased ?? false,
      };
      const newClothes = [newItem, ...state.clothes];
      setLocalStorage('clothes', newClothes);
      return { clothes: newClothes };
    }),
  removeClothing: (id) =>
    set((state) => {
      const newClothes = state.clothes.filter((c) => c.id !== id);
      setLocalStorage('clothes', newClothes);
      return { clothes: newClothes };
    }),
  toggleFavorite: (id) =>
    set((state) => {
      const newClothes = state.clothes.map((c) =>
        c.id === id ? { ...c, isFavorite: !c.isFavorite } : c
      );
      setLocalStorage('clothes', newClothes);
      return { clothes: newClothes };
    }),
  updateClothing: (id, patch) =>
    set((state) => {
      const newClothes = state.clothes.map((c) =>
        c.id === id ? { ...c, ...patch } : c
      );
      setLocalStorage('clothes', newClothes);
      return { clothes: newClothes };
    }),

  addClothingFromProduct: (product, override) =>
    set((state) => {
      if (!state.user) return {};

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
        userId: state.user.id,
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

      const newClothes = [newItem, ...state.clothes];
      setLocalStorage('clothes', newClothes);
      return { clothes: newClothes };
    }),

  // Looks
  looks: getLocalStorage<Look[]>('looks', []),
  createLookFromActive: (name, snapshotUrl) =>
    set((state) => {
      if (!state.user || !state.activeLook) return {};

      // 현재 활성화된 레이어에 해당하는 옷 정보만 필터링 (Snapshot)
      const usedItemIds = state.activeLook.layers.map(l => l.clothingId);
      const itemsSnapshot = state.clothes.filter(c => usedItemIds.includes(c.id));

      const newLook: Look = {
        id: crypto.randomUUID(),
        userId: state.user.id,
        name,
        items: itemsSnapshot,
        // Deep copy layers to prevent reference issues
        layers: state.activeLook.layers.map(l => ({ ...l })),
        createdAt: Date.now(),
        snapshotUrl: snapshotUrl || null,
      };

      const newLooks = [newLook, ...state.looks];
      setLocalStorage('looks', newLooks);
      return { looks: newLooks, activeLook: { ...state.activeLook, name } };
    }),
  deleteLook: (id) =>
    set((state) => {
      const newLooks = state.looks.filter(l => l.id !== id);
      setLocalStorage('looks', newLooks);
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
}));