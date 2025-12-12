
export type Category = 'top' | 'bottom' | 'outer' | 'onepiece' | 'shoes' | 'accessory';
export type BodyType = 'slim' | 'normal' | 'athletic' | 'chubby';
export type Gender = 'male' | 'female' | 'unisex';
export type Season = 'spring' | 'summer' | 'fall' | 'winter';

/**
 * User - 기본 사용자 정보 (Avatar 및 신체 정보 포함)
 * 
 * 실제 서비스 전환 시:
 * - passwordHash 필드 추가 (백엔드에서만 관리)
 * - 프론트엔드에는 절대 비밀번호 저장하지 말 것
 */
export interface User {
  id: string;
  name: string; // 사용자 이름 (displayName과 동일하게 사용)
  email: string;
  displayName: string; // 사이트에 보여줄 이름
  avatarUrl: string | null;
  height?: number;
  bodyType?: BodyType;
  gender?: Gender;
  createdAt: number;
}

/**
 * AuthUser - 인증된 사용자 기본 정보
 * authService에서 반환하는 최소 정보
 */
export interface AuthUser {
  id: string;
  email: string;
  displayName: string;
  createdAt: number;
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
  snapshotUrl?: string | null; // 코디 완성 스냅샷 이미지 URL
  createdAt: number;
  // Public sharing metadata
  isPublic?: boolean;          // 공개 피드에 발행 여부
  publicId?: string | null;    // 공개용 고유 ID (URL: /look/:publicId)
  tags?: string[];             // 사용자 태그 (캐주얼, 데일리, 출근룩 등)
}

/**
 * Look → PublicLook 매핑 규칙:
 * - publicId → PublicLook.id
 * - currentUser.displayName → PublicLook.ownerName
 * - snapshotUrl, items → 그대로 복사
 * - tags → PublicLook.tags
 * - likeCount, bookmarkCount → PublicLook에서 관리 (초기 0)
 * - createdAt → 그대로 복사
 */

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
  publicId: string;
  name: string;
  ownerName: string;
  ownerId: string;
  ownerEmail?: string;
  snapshotUrl: string | null;
  items: ClothingItem[];
  likesCount: number;
  bookmarksCount: number;
  createdAt: number;
  tags: string[];
}

export interface ImageSearchResult {
  queryImageUrl: string;
  detectedCategory?: Category | null;
  products: Product[];
}

// ============================================
// AI Backend API Types (Step 16)
// ============================================

/**
 * AvatarGenerationRequest - 아바타 생성 요청
 * 
 * multipart/form-data로 전송:
 * - faceImage: File (실제 파일)
 * - height: number
 * - bodyType: BodyType
 * - gender?: Gender
 */
export interface AvatarGenerationRequest {
  height: number;
  bodyType: BodyType;
  gender?: Gender;
  // faceImage는 FormData로 전송되므로 타입 정의에서 제외
}

/**
 * AvatarGenerationResponse - 아바타 생성 응답
 */
export interface AvatarGenerationResponse {
  avatarUrl: string;
  meta?: {
    modelVersion?: string;
    note?: string;
  };
}

/**
 * BackgroundRemovalResponse - 배경 제거 응답
 */
export interface BackgroundRemovalResponse {
  imageUrl: string;
  meta?: {
    note?: string;
  };
}

/**
 * TryOnRequest - 가상 피팅 요청 (미래용)
 */
export interface TryOnRequest {
  avatarImageUrl: string;
  clothingImageUrls: string[];
  pose?: string;
}

/**
 * TryOnResponse - 가상 피팅 응답 (미래용)
 */
export interface TryOnResponse {
  tryOnImageUrl: string;
  meta?: {
    modelVersion?: string;
    note?: string;
  };
}
