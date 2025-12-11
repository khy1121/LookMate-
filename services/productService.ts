import { Product, ClothingItem, Category, ImageSearchResult } from '../types';
// import { post, upload } from './apiClient';

/**
 * TODO: 실제 서비스 전환 시
 * 
 * 1. searchSimilarProductsByItem
 *    - Endpoint: POST /api/products/similar-by-item
 *    - Request Body: { itemId, category, options }
 *    - Response: Product[]
 *    - 구현: return post<Product[]>('/api/products/similar-by-item', { itemId, category, options });
 * 
 * 2. searchSimilarProductsByImage
 *    - Endpoint: POST /api/products/similar-by-image (multipart or base64)
 *    - Request: FormData with image file
 *    - Response: ImageSearchResult
 *    - 구현: 
 *      const formData = new FormData();
 *      formData.append('image', imageFile);
 *      formData.append('options', JSON.stringify(options));
 *      return upload<ImageSearchResult>('/api/products/similar-by-image', formData);
 * 
 * 3. 환경 변수
 *    - .env.local에 VITE_API_BASE_URL 설정
 *    - apiClient에서 자동으로 base URL prefix 적용
 */

export interface ProductSearchOptions {
  category?: Category;
  maxPrice?: number;
  minPrice?: number;
  sortBy?: 'priceAsc' | 'priceDesc' | 'recommend' | 'sales';
  limit?: number;
}

// Mock 데이터 생성 헬퍼
const generateMockProducts = (count: number, baseCategory?: Category | null): Product[] => {
  const brands = ['Uniqlo', 'Zara', 'H&M', 'Musinsa', 'Nike', 'Adidas', 'COS', 'Everlane'];
  const categories: Category[] = ['top', 'bottom', 'outer', 'onepiece', 'shoes', 'accessory'];
  
  return Array.from({ length: count }, (_, i) => {
    const category = baseCategory || categories[Math.floor(Math.random() * categories.length)];
    const brand = brands[Math.floor(Math.random() * brands.length)];
    const price = Math.floor(Math.random() * 150000) + 20000;
    
    return {
      id: `product-${Date.now()}-${i}`,
      name: `${brand} ${category} ${i + 1}`,
      brand,
      thumbnailUrl: `https://via.placeholder.com/300x400/4F46E5/FFFFFF?text=${category}+${i + 1}`,
      productUrl: `https://example.com/product/${i + 1}`,
      price,
      currency: 'KRW' as const,
      category,
      similarityScore: Math.random() * 0.5 + 0.5, // 0.5~1.0
      rating: Math.random() * 2 + 3, // 3.0~5.0
      reviewCount: Math.floor(Math.random() * 1000),
      salesVolumeScore: Math.random() * 100,
      tags: ['인기', '베스트', '신상'].slice(0, Math.floor(Math.random() * 3) + 1),
    };
  });
};

// 정렬 함수
const sortProducts = (products: Product[], sortBy: ProductSearchOptions['sortBy']): Product[] => {
  const sorted = [...products];
  
  switch (sortBy) {
    case 'priceAsc':
      return sorted.sort((a, b) => a.price - b.price);
    case 'priceDesc':
      return sorted.sort((a, b) => b.price - a.price);
    case 'sales':
      return sorted.sort((a, b) => (b.salesVolumeScore || 0) - (a.salesVolumeScore || 0));
    case 'recommend':
    default:
      return sorted.sort((a, b) => (b.similarityScore || 0) - (a.similarityScore || 0));
  }
};

/**
 * ClothingItem 기반 유사 상품 검색
 */
export async function searchSimilarProductsByItem(
  item: ClothingItem,
  options?: ProductSearchOptions
): Promise<Product[]> {
  // Mock API 지연 시뮬레이션
  await new Promise(resolve => setTimeout(resolve, 500));

  const limit = options?.limit || 12;
  let products = generateMockProducts(limit, item.category);

  // 필터링
  if (options?.category) {
    products = products.filter(p => p.category === options.category);
  }
  if (options?.minPrice !== undefined) {
    products = products.filter(p => p.price >= options.minPrice!);
  }
  if (options?.maxPrice !== undefined) {
    products = products.filter(p => p.price <= options.maxPrice!);
  }

  // 정렬
  products = sortProducts(products, options?.sortBy);

  return products;
}

/**
 * 이미지 파일 기반 유사 상품 검색
 */
export async function searchSimilarProductsByImage(
  imageFile: File,
  options?: ProductSearchOptions
): Promise<ImageSearchResult> {
  // Mock API 지연 시뮬레이션
  await new Promise(resolve => setTimeout(resolve, 800));

  const queryImageUrl = URL.createObjectURL(imageFile);
  
  // Mock: 랜덤 카테고리 감지
  const categories: Category[] = ['top', 'bottom', 'outer', 'onepiece', 'shoes', 'accessory'];
  const detectedCategory = categories[Math.floor(Math.random() * categories.length)];

  const limit = options?.limit || 20;
  let products = generateMockProducts(limit, detectedCategory);

  // 필터링 & 정렬
  if (options?.category) {
    products = products.filter(p => p.category === options.category);
  }
  if (options?.minPrice !== undefined) {
    products = products.filter(p => p.price >= options.minPrice!);
  }
  if (options?.maxPrice !== undefined) {
    products = products.filter(p => p.price <= options.maxPrice!);
  }

  products = sortProducts(products, options?.sortBy);

  return {
    queryImageUrl,
    detectedCategory,
    products,
  };
}
