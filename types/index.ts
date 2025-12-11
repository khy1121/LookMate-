
export type Category = 'top' | 'bottom' | 'outer' | 'onepiece' | 'shoes' | 'accessory';
export type BodyType = 'slim' | 'normal' | 'athletic' | 'chubby';
export type Gender = 'male' | 'female' | 'unisex';
export type Season = 'spring' | 'summer' | 'fall' | 'winter';

export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  height?: number;
  bodyType?: BodyType;
  gender?: Gender;
}

export interface ClothingItem {
  id: string;
  userId: string;
  imageUrl: string; // 배경 제거된 이미지
  originalImageUrl: string;
  category: Category;
  color: string;
  brand?: string;
  size?: string;
  season?: Season;
  memo?: string;
  isFavorite: boolean;
  createdAt: number;
}

// --- Fitting Room Types ---

export interface FittingLayer {
  clothingId: string;
  x: number; // offset X from center
  y: number; // offset Y from center
  scale: number;
  rotation: number;
  visible: boolean;
}

export interface ActiveLook {
  layers: FittingLayer[];
  name?: string;
}

export interface Look {
  id: string;
  userId: string;
  name: string;
  items: ClothingItem[]; // 코디 시점의 옷 정보 스냅샷
  layers: FittingLayer[]; // 위치/회전 정보
  snapshotUrl?: string | null; // 코디 완성 스냅샷 이미지 URL (Future Use)
  createdAt: number;
}
