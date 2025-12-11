import { PublicLook, ClothingItem, Category } from '../types';
// import { get } from './apiClient';

/**
 * TODO: 실제 서비스 전환 시
 * 
 * 1. fetchPopularLooks
 *    - Endpoint: GET /api/public-looks?sort=popular&limit=10
 *    - Response: PublicLook[]
 *    - 구현: return get<PublicLook[]>('/api/public-looks?sort=popular&limit=10');
 * 
 * 2. fetchLookDetail
 *    - Endpoint: GET /api/public-looks/:id
 *    - Response: PublicLook
 *    - 구현: return get<PublicLook>(`/api/public-looks/${lookId}`);
 * 
 * 3. 환경 변수
 *    - .env.local에 VITE_API_BASE_URL 설정
 *    - apiClient에서 자동으로 base URL prefix 적용
 */

// Mock 데이터 생성
const generateMockPublicLooks = (): PublicLook[] => {
  const tags = [
    ['캐주얼', '데일리'],
    ['오피스', '포멀'],
    ['스트릿', '힙합'],
    ['미니멀', '모던'],
    ['빈티지', '레트로'],
    ['스포티', '액티브'],
    ['페미닌', '로맨틱'],
    ['댄디', '클래식'],
  ];

  const ownerNames = ['패션왕', '스타일리스트_김', '코디마스터', '옷잘알', '트렌디', '미니멀리스트', '빈티지러버', '스트릿보이'];

  return Array.from({ length: 10 }, (_, i) => {
    const tagSet = tags[i % tags.length];
    const categories: Category[] = ['top', 'bottom', 'outer'];
    
    const items: ClothingItem[] = categories.map((cat, idx) => ({
      id: `mock-item-${i}-${idx}`,
      userId: 'public-user',
      imageUrl: `https://via.placeholder.com/200x300/4F46E5/FFFFFF?text=${cat}`,
      originalImageUrl: `https://via.placeholder.com/200x300/4F46E5/FFFFFF?text=${cat}`,
      category: cat,
      color: ['Black', 'White', 'Navy', 'Beige', 'Gray'][Math.floor(Math.random() * 5)],
      brand: ['Uniqlo', 'Zara', 'COS'][Math.floor(Math.random() * 3)],
      isFavorite: false,
      createdAt: Date.now() - Math.floor(Math.random() * 10000000),
      price: Math.floor(Math.random() * 100000) + 30000,
      isPurchased: true,
    }));

    return {
      id: `public-look-${i + 1}`,
      ownerName: ownerNames[i % ownerNames.length],
      ownerAvatarUrl: `https://via.placeholder.com/80/6366F1/FFFFFF?text=${ownerNames[i % ownerNames.length][0]}`,
      snapshotUrl: `https://via.placeholder.com/400x600/4F46E5/FFFFFF?text=Look+${i + 1}`,
      items,
      likeCount: Math.floor(Math.random() * 500) + 50,
      bookmarkCount: Math.floor(Math.random() * 200) + 20,
      createdAt: Date.now() - Math.floor(Math.random() * 10000000),
      tags: tagSet,
    };
  });
};

const mockLooks = generateMockPublicLooks();

/**
 * 인기 코디 목록 가져오기
 */
export async function fetchPopularLooks(): Promise<PublicLook[]> {
  // Mock API 지연 시뮬레이션
  await new Promise(resolve => setTimeout(resolve, 600));
  
  return [...mockLooks].sort((a, b) => b.likeCount - a.likeCount);
}

/**
 * 특정 코디 상세 정보 가져오기
 */
export async function fetchLookDetail(id: string): Promise<PublicLook | null> {
  // Mock API 지연 시뮬레이션
  await new Promise(resolve => setTimeout(resolve, 300));
  
  return mockLooks.find(look => look.id === id) || null;
}
