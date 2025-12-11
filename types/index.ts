
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
  // Shopping metadata
  shoppingUrl?: string | null;   // 원본 쇼핑몰/상품 링크
  price?: number | null;         // 가격 (원 단위)
  isPurchased?: boolean;         // 구매 여부
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

// --- Product & Public Look Types ---

/**
 * Product → ClothingItem 매핑 규칙:
 * - category: product.category ?? 'top' (기본값)
 * - shoppingUrl: product.productUrl
 * - price: product.price
 * - brand: product.brand ?? undefined
 * - tags: product.tags ?? []
 * - color: product.tags 중 색상 추출, 없으면 'unknown'
 * - isPurchased: false (기본값, 관심상품으로 저장)
 * - imageUrl/originalImageUrl: product.thumbnailUrl
 */
export interface Product {
  id: string;
  name: string;
  brand?: string | null;
  thumbnailUrl: string;
  productUrl: string;        // 외부 쇼핑몰 링크
  price: number;             // 원 단위
  currency: 'KRW';
  category?: Category | null;
  similarityScore?: number;  // 0~1 사이 유사도
  rating?: number | null;    // 평점 (0~5)
  reviewCount?: number | null;
  salesVolumeScore?: number | null; // 판매량 기반 점수
  tags?: string[];
}

export interface PublicLook {
  id: string;
  ownerName: string;
  ownerAvatarUrl?: string | null;
  snapshotUrl: string;
  items: ClothingItem[];
  likeCount: number;
  bookmarkCount: number;
  createdAt: number;
  tags: string[];
}

export interface ImageSearchResult {
  queryImageUrl: string;
  detectedCategory?: Category | null;
  products: Product[];
}
