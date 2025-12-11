<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1sDBGj5dWh2GXiA7X8fL_asvyroC3M2Tp

## Run Locally

**Prerequisites:** Node.js (v18 or higher recommended)

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up environment variables:
   ```bash
   cp .env.example .env.local
   ```
   Then edit `.env.local` with your actual API keys (currently using Mock data)

3. Run development server:
   ```bash
   npm run dev
   ```
   App will be available at `http://localhost:3001`

## Build & Preview

**Build for production:**
```bash
npm run build
```

**Preview production build locally:**
```bash
npm run preview
```
App will be available at `http://localhost:4173`

**Type checking:**
```bash
npm run lint
```

## Environment Variables

Create a `.env.local` file in the root directory (see `.env.example` for template):

```env
# Application Configuration
VITE_APP_NAME=LookMate
VITE_APP_ENV=development

# API Configuration (Mock for now)
VITE_API_BASE_URL=https://api.example.com

# Future: Real API Keys (not yet required)
# GEMINI_API_KEY=your_gemini_api_key_here
# VITE_OPENAI_API_KEY=your_openai_key_here
# VITE_REMOVEBG_API_KEY=your_removebg_key_here
```

**For Vercel/Netlify deployment:**
Add the same environment variables in your hosting platform's environment settings:
- Vercel: Project Settings → Environment Variables
- Netlify: Site Settings → Build & Deploy → Environment

### API 전환 가이드

현재 모든 서비스는 Mock 데이터를 사용하고 있습니다. 실제 백엔드 API로 전환하려면:

1. `.env.local`에 `VITE_API_BASE_URL` 설정
2. `services/apiClient.ts`의 주석 참고하여 API 엔드포인트 연동
3. `services/productService.ts`와 `services/publicLookService.ts`의 TODO 주석 참고

**전환이 필요한 서비스:**
- `productService.ts`: 상품 검색 API
- `publicLookService.ts`: 공개 코디 피드 API
- `aiService.ts`: AI 배경 제거 API

## Backend Database (Prisma + SQLite)

LookMate는 Prisma ORM과 SQLite를 사용하여 사용자, 옷장, 룩 데이터를 관리합니다.

### 데이터베이스 구조

**도메인 모델:**
```
User
├─ id: string (cuid)
├─ email: string (unique)
├─ displayName: string
├─ avatarUrl: string?
├─ height: number?
├─ bodyType: string? ('slim' | 'normal' | 'athletic' | 'chubby')
├─ gender: string? ('male' | 'female' | 'unisex')
└─ createdAt: DateTime

ClothingItem
├─ id: string (cuid)
├─ userId: string → User.id
├─ category: string ('top' | 'bottom' | 'outer' | 'onepiece' | 'shoes' | 'accessory')
├─ imageUrl: string (배경 제거된 이미지)
├─ originalImageUrl: string
├─ color: string
├─ season: string? ('spring' | 'summer' | 'fall' | 'winter')
├─ brand: string?
├─ size: string?
├─ tags: string (JSON array)
├─ memo: string?
├─ isFavorite: boolean
├─ shoppingUrl: string?
├─ price: number? (원 단위)
├─ isPurchased: boolean
└─ createdAt: DateTime

Look
├─ id: string (cuid)
├─ userId: string → User.id
├─ name: string
├─ itemIds: string (JSON array of ClothingItem IDs)
├─ layers: string (JSON array of FittingLayer objects)
├─ snapshotUrl: string?
├─ isPublic: boolean
├─ tags: string (JSON array)
└─ createdAt: DateTime

PublicLook
├─ id: string (cuid)
├─ lookId: string → Look.id (unique)
├─ publicId: string (unique, URL-friendly sharing ID)
├─ ownerName: string
├─ ownerId: string
├─ snapshotUrl: string?
├─ itemsSnapshot: string (JSON array, snapshot at publication time)
├─ tags: string (JSON array)
├─ likesCount: number
├─ bookmarksCount: number
└─ createdAt: DateTime
```

**관계:**
- User → ClothingItem (1:N)
- User → Look (1:N)
- Look → PublicLook (1:1, optional)

### 데이터베이스 설정 및 마이그레이션

**1. 의존성 설치:**
```bash
cd backend
npm install
```

**2. Prisma 마이그레이션 실행:**
```bash
# 데이터베이스 스키마 생성
npx prisma migrate dev --name init

# Prisma Client 생성
npx prisma generate
```

**3. Seed 데이터 추가 (선택):**
```bash
# 데모 유저/옷/룩 데이터 생성
npx prisma db seed

# 또는
npm run prisma:seed
```

**Seed 데이터 내용:**
- 2명의 데모 유저 (demo-user-1, demo-user-2)
- 8개의 옷 아이템 (다양한 카테고리/브랜드/가격)
- 3개의 룩 (레이어 정보 포함)
- 2개의 공개 룩 (좋아요/북마크 수 포함)

**4. 데이터베이스 확인 (선택):**
```bash
# Prisma Studio 실행 (GUI 데이터 뷰어)
npx prisma studio
```
브라우저에서 http://localhost:5555 접속하여 데이터 확인/수정 가능

### 데이터 API 엔드포인트

| 엔드포인트 | 메서드 | 설명 | 상태 |
|-----------|--------|------|------|
| `/api/data/closet` | GET | 사용자의 옷장 아이템 조회 (`?userId=...`) | ✅ 동작 |
| `/api/data/looks` | GET | 사용자의 룩 목록 조회 (`?userId=...`) | ✅ 동작 |
| `/api/data/public-looks` | GET | 공개 룩 피드 조회 (`?limit=20&sort=latest`) | ✅ 동작 |

**사용 예시:**
```bash
# 백엔드 서버 실행
cd backend
npm run dev

# 다른 터미널에서 API 테스트
curl "http://localhost:4000/api/data/closet?userId=demo-user-1"
# → { "items": [...] } 8개 아이템 반환

curl "http://localhost:4000/api/data/looks?userId=demo-user-1"
# → { "looks": [...] } 2개 룩 반환

curl "http://localhost:4000/api/data/public-looks?limit=10&sort=likes"
# → { "publicLooks": [...] } 좋아요 순 정렬
```

**응답 형식:**
```json
// GET /api/data/closet
{
  "items": [
    {
      "id": "item-1",
      "userId": "demo-user-1",
      "category": "top",
      "imageUrl": "...",
      "color": "white",
      "brand": "Uniqlo",
      "price": 15000,
      "isPurchased": true,
      "tags": ["casual", "basic"],
      "createdAt": 1702345678000
    }
  ]
}

// GET /api/data/public-looks
{
  "publicLooks": [
    {
      "publicId": "summer-casual-2024",
      "ownerName": "Fashion Lover",
      "ownerId": "demo-user-1",
      "snapshotUrl": "...",
      "items": [...],
      "likesCount": 42,
      "bookmarksCount": 18,
      "tags": ["casual", "summer"],
      "createdAt": 1702345678000
    }
  ]
}
```

### 현재 상태 (Step 18)

**✅ 구현 완료:**
- Prisma 스키마 정의 (4개 모델)
- SQLite 데이터베이스 마이그레이션
- Seed 데이터 생성
- 읽기 전용 REST API 엔드포인트 (GET)
- Frontend dataService 스켈레톤 (`services/dataService.ts`)

**⏳ 향후 작업 (Step 19+):**
- 쓰기 API 엔드포인트 (POST/PUT/DELETE)
- Frontend Zustand 스토어를 localStorage → Backend API로 마이그레이션
- 인증 토큰 기반 API 인증
- 실시간 동기화 (WebSocket/Polling)

**⚠️ 중요:**
- 현재 Frontend는 여전히 **localStorage 기반**으로 동작합니다
- `services/dataService.ts`는 구현되어 있지만 UI에서 아직 사용하지 않습니다
- 기존 기능(Steps 1-17)은 모두 정상 작동합니다

## Backend (AI API Server)

LookMate는 AI 기능(아바타 생성, 배경 제거, 가상 피팅)을 위한 Node.js + Express 백엔드를 제공합니다.

### 백엔드 설치 및 실행

**1. 백엔드 의존성 설치:**
```bash
cd backend
npm install
```

**2. 백엔드 개발 서버 실행:**
```bash
npm run dev   # http://localhost:4000에서 실행
```

서버 실행 확인:
- 터미널에 "🚀 LookMate AI Backend running on http://localhost:4000" 메시지가 표시됨
- Health check: `http://localhost:4000/health` 브라우저로 접속 → `{"status":"ok","timestamp":"..."}` 응답 확인

### 프론트엔드와 연동

**1. 루트 디렉토리의 `.env.local` 파일 생성/수정:**
```env
VITE_API_BASE_URL=http://localhost:4000
```

**2. 프론트엔드 개발 서버 (재)실행:**
```bash
npm run dev   # 루트 디렉토리에서
```

**3. 연동 확인:**
- Avatar 페이지 상단에 "✅ AI 모드: 백엔드 연결" 녹색 배지 표시
- Upload 페이지에서 옷 이미지 업로드 시 `POST /api/ai/remove-background` 호출 (Network 탭 확인)
- Avatar 페이지에서 아바타 생성 시 `POST /api/ai/avatar` 호출 확인

### AI API 엔드포인트

| 엔드포인트 | 메서드 | 입력 | 출력 | 상태 |
|-----------|--------|------|------|------|
| `/health` | GET | - | `{"status":"ok","timestamp":"..."}` | ✅ 동작 |
| `/api/ai/avatar` | POST | multipart: `faceImage`, `height`, `bodyType`, `gender` | `{"avatarUrl": string, "meta": {...}}` | **Stub** |
| `/api/ai/remove-background` | POST | multipart: `clothImage` | `{"imageUrl": string, "meta": {...}}` | **Stub** |
| `/api/ai/try-on` | POST | JSON: `avatarImageUrl`, `clothingImageUrls[]` | `{"tryOnImageUrl": string, "meta": {...}}` | **Stub** |
| `/uploads/*` | GET | - | Static file serving | ✅ 동작 |

### Stub 동작 방식 (현재 구현)

**현재 백엔드는 실제 AI 처리 없이 다음과 같이 동작합니다:**

1. **파일 업로드 처리 (✅ 실제 동작)**
   - `backend/uploads/` 폴더에 이미지 저장
   - 파일명: `YYYYMMDDHHMMSS-random-originalname.ext`
   - 이미지 파일만 허용 (mime type 검증)
   - 최대 크기: 5MB

2. **배경 제거 (`/api/ai/remove-background`)**
   - **현재**: 업로드된 원본 이미지 URL 반환
   - **향후**: remove.bg API 또는 U-2-Net 모델 연동
   - 응답 예시: `{"imageUrl": "http://localhost:4000/uploads/20241212024556-abc123-tshirt.jpg"}`

3. **아바타 생성 (`/api/ai/avatar`)**
   - **현재**: 업로드된 얼굴 이미지 URL 반환
   - **향후**: DALL-E/Stable Diffusion으로 전신 아바타 생성
   - 응답 예시: `{"avatarUrl": "http://localhost:4000/uploads/20241212024601-def456-face.jpg", "meta": {"height": 170, "bodyType": "normal"}}`

4. **가상 피팅 (`/api/ai/try-on`)**
   - **현재**: 입력받은 아바타 URL 그대로 반환
   - **향후**: VITON-HD 등 GAN 기반 가상 피팅 모델 연동

### Mock 모드 (백엔드 없이 사용)

`.env.local`에서 `VITE_API_BASE_URL`을 주석 처리하거나 삭제하면:
- 프론트엔드가 자동으로 Mock 모드로 전환
- Avatar 페이지에 "💡 AI 모드: Mock" 회색 배지 표시
- 모든 기능이 브라우저 내에서 동작 (백엔드 불필요)
- 배경 제거: `URL.createObjectURL()` 사용
- 아바타 생성: placeholder 이미지 사용

### 에러 처리 및 Fallback

백엔드가 실행 중이지 않거나 에러 발생 시:
- 자동으로 Mock 모드로 fallback
- 화면 우측 상단에 Toast 알림: "AI 서버와 통신할 수 없어 Mock 모드로 동작합니다"
- 기존 기능 모두 정상 동작 (사용자 경험 중단 없음)

### 빌드 및 배포

**백엔드 빌드:**
```bash
cd backend
npm run build   # TypeScript → JavaScript 컴파일 (dist/ 폴더)
```

**프로덕션 실행:**
```bash
npm run start   # node dist/server.js
```

**환경 변수 (.env):**
```env
PORT=4000
NODE_ENV=production
```

### 루트 스크립트 (편의 명령어)

루트 디렉토리에서 백엔드 관련 명령어 실행:
```bash
npm run backend:dev     # 백엔드 개발 서버 실행
npm run backend:build   # 백엔드 TypeScript 빌드
npm run backend:start   # 빌드된 백엔드 실행 (프로덕션)
```

### 실제 AI 모델 통합 가이드

`backend/src/routes/ai.ts` 파일의 TODO 주석을 참고하여 다음 단계로 실제 AI 모델을 연동할 수 있습니다:

**1. 배경 제거 (remove.bg API 예시):**
```typescript
// backend/src/routes/ai.ts의 /api/ai/remove-background 엔드포인트
const FormData = require('form-data');
const axios = require('axios');

const formData = new FormData();
formData.append('image_file', fs.createReadStream(clothImage.path));
formData.append('size', 'auto');

const response = await axios.post('https://api.remove.bg/v1.0/removebg', formData, {
  headers: {
    'X-Api-Key': process.env.REMOVEBG_API_KEY,
  },
  responseType: 'arraybuffer'
});

// 처리된 이미지를 uploads/ 폴더에 저장
const outputPath = path.join(uploadsDir, `nobg-${clothImage.filename}`);
fs.writeFileSync(outputPath, response.data);

return { imageUrl: getImageUrl(req, `nobg-${clothImage.filename}`) };
```

**2. 아바타 생성 (OpenAI DALL-E 예시):**
```typescript
// TODO 위치: /api/ai/avatar 엔드포인트
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const prompt = `Full-body ${gender} avatar, ${bodyType} body type, ${height}cm tall, professional photo`;
const response = await openai.images.generate({
  model: "dall-e-3",
  prompt: prompt,
  n: 1,
  size: "1024x1024"
});

const avatarUrl = response.data[0].url;
```

**3. 가상 피팅 (GPU 서버 연동 예시):**
```typescript
// TODO 위치: /api/ai/try-on 엔드포인트
const response = await axios.post('http://your-gpu-server:5000/try-on', {
  avatar_url: avatarImageUrl,
  garment_urls: clothingImageUrls,
  model: 'viton-hd'
});

return { tryOnImageUrl: response.data.result_url };
```
