
import { BodyType, Gender, Category } from '../types';

/**
 * Mock AI Service
 * 실제 AI 모델 대신 `setTimeout`을 사용하여 비동기 처리를 흉내냅니다.
 */

// 더미 딜레이 유틸
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const aiService = {
  /**
   * 이미지 배경 제거 Mock
   */
  removeBackground: async (file: File): Promise<string> => {
    console.log(`[AI] Removing background for ${file.name}...`);
    await delay(1500); 
    return URL.createObjectURL(file);
  },

  /**
   * 아바타 생성 Mock
   * 얼굴 사진이나 전신 사진을 받아서 아바타 이미지를 반환합니다.
   */
  generateAvatar: async (options: { 
    faceImage?: File | null; 
    fullBodyImage?: File | null; 
    height?: number; 
    bodyType?: BodyType; 
    gender?: Gender; 
  }): Promise<string> => {
    console.log('[AI] Generating avatar with options:', options);
    await delay(2000);

    // 1. 전신 사진이 있으면 그대로 사용 (배경 제거된 것으로 가정하거나 처리)
    if (options.fullBodyImage) {
      return URL.createObjectURL(options.fullBodyImage);
    }
    
    // 2. 얼굴 사진만 있거나 아무것도 없으면, 
    // 실제로는 AI가 얼굴을 합성한 아바타를 생성해야 하지만 
    // 여기서는 성별/체형에 따른 더미 이미지 URL을 반환한다고 가정
    const genderPath = options.gender === 'female' ? 'woman' : 'man';
    // Mock Placeholder Image
    return `https://via.placeholder.com/400x800?text=${genderPath}+${options.bodyType || 'normal'}+Avatar`;
  },

  /**
   * 옷 자동 태깅/분석 Mock
   */
  detectAttributes: async (file: File) => {
    console.log(`[AI] Analyzing clothing attributes for ${file.name}...`);
    await delay(800);
    return {
      category: 'top' as Category,
      color: 'black',
      tags: ['casual', 'summer'],
    };
  },
};
