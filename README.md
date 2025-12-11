<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1sDBGj5dWh2GXiA7X8fL_asvyroC3M2Tp

## Run Locally

**Prerequisites:**  Node.js

1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Environment Variables

Create a `.env.local` file in the root directory:

```env
# Gemini API Key (현재 사용 중)
GEMINI_API_KEY=your_gemini_api_key_here

# Backend API Base URL (실제 서비스 전환 시 설정)
# VITE_API_BASE_URL=https://api.lookmate.com
```

### API 전환 가이드

현재 모든 서비스는 Mock 데이터를 사용하고 있습니다. 실제 백엔드 API로 전환하려면:

1. `.env.local`에 `VITE_API_BASE_URL` 설정
2. `services/apiClient.ts`의 주석 참고하여 API 엔드포인트 연동
3. `services/productService.ts`와 `services/publicLookService.ts`의 TODO 주석 참고

**전환이 필요한 서비스:**
- `productService.ts`: 상품 검색 API
- `publicLookService.ts`: 공개 코디 피드 API
- `aiService.ts`: AI 배경 제거 API
