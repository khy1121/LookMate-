/**
 * 브랜드 로고 및 비주얼 설정
 * 
 * BRAND_VARIANT 값을 변경하면 전체 앱의 로고와 태그라인이 일괄 변경됩니다.
 */

export type BrandVariant = 'soft' | 'neon';

// 현재 사용 중인 브랜드 스타일 ('soft' 또는 'neon')
export const BRAND_VARIANT: BrandVariant = 'soft';

// 브랜드별 로고 이미지 경로
export const BRAND_LOGO_SRC: Record<BrandVariant, string> = {
  soft: '/branding/lookmate-logo-soft.png',
  neon: '/branding/lookmate-logo-neon.png',
};

// 브랜드별 태그라인
export const BRAND_TAGLINE: Record<BrandVariant, string> = {
  soft: 'Your Style Best Friend',
  neon: 'Your Style Mate',
};

// 브랜드별 컬러 테마 (선택적, 향후 확장용)
export const BRAND_COLORS: Record<BrandVariant, { primary: string; secondary: string }> = {
  soft: {
    primary: '#6366f1', // Indigo
    secondary: '#ec4899', // Pink
  },
  neon: {
    primary: '#8b5cf6', // Purple
    secondary: '#06b6d4', // Cyan
  },
};

/**
 * 현재 활성화된 브랜드 정보를 반환하는 헬퍼 함수
 */
export const getCurrentBrand = () => ({
  variant: BRAND_VARIANT,
  logoSrc: BRAND_LOGO_SRC[BRAND_VARIANT],
  tagline: BRAND_TAGLINE[BRAND_VARIANT],
  colors: BRAND_COLORS[BRAND_VARIANT],
});
