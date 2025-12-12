<div align="center">
<img width="1200" height="475" alt="LookMate Banner" src="C:\LookMate\public\branding\lookmate-logo-neon.png"/>
</div>

# LookMate - AI 가상 피팅 & 쇼핑 어시스턴트

AI 기술을 활용한 개인 맞춤형 패션 코디 및 가상 피팅 서비스입니다.

## ✨ 최근 업데이트

- ✅ **Step 21** – PublicLook 백엔드 연동 & 로고 브랜딩 시스템 구축 완료
  - Explore 페이지에서 Prisma + SQLite 백엔드 데이터 연동
  - 브랜딩 설정 시스템 (`config/branding.ts`) 구축
  - 로고 variant 전환 지원 (soft/neon 테마)
  - AppLayout 및 Login 페이지에 로고 적용

## 주요 기능

- **옷장 관리**: 보유한 옷을 촬영하여 디지털 옷장에 저장 및 관리
- **AI 배경 제거**: 업로드한 옷 이미지의 배경을 자동으로 제거
- **아바타 생성**: 얼굴 사진과 신체 정보로 3D 아바타 생성
- **가상 피팅**: 아바타에 옷을 입혀보고 레이어 조정으로 스타일링
- **코디 저장 & 공유**: 완성된 룩을 저장하고 다른 사용자와 공유
- **인기 코디 탐색**: 다른 사용자들의 공개 코디 피드 탐색
- **이미지 검색**: 옷 사진으로 유사한 상품 찾기
- **외부 상품 연동**: 쇼핑몰 상품을 원클릭으로 내 옷장에 추가

## 기술 스택

### Frontend
- **Framework**: React 18 + TypeScript + Vite
- **상태 관리**: Zustand (localStorage 기반)
- **스타일링**: Tailwind CSS
- **라우팅**: React Router v6
- **빌드**: Vite 6.x

### Backend

- 프리즈마 마이그레이션 관련 작업은 추후(별도 Step) 후보입니다.
## 로컬 개발 환경 설정

### 필수 요구사항

- **Node.js**: v18 이상 권장
- **npm**: v9 이상

### Frontend 설정

**1. 의존성 설치:**
```bash
npm install
```

**2. 환경 변수 설정:**
```bash
# 루트 디렉토리에 .env.local 파일 생성
cp .env.example .env.local
```

`.env.local` 파일 예시:
```env
# AI 백엔드 API (선택 사항, 없으면 Mock 모드)
VITE_API_BASE_URL=http://localhost:4000

# 애플리케이션 설정
VITE_APP_NAME=LookMate
VITE_APP_ENV=development
```

**3. 개발 서버 실행:**
```bash
npm run dev
```
→ http://localhost:3001 에서 실행됩니다.

**4. 프로덕션 빌드:**
```bash
npm run build    # dist/ 폴더에 빌드 결과 생성
npm run preview  # http://localhost:4173 에서 미리보기
```

### Backend 설정

**1. 백엔드 디렉토리 이동:**
```bash
cd backend
```

**2. 의존성 설치:**
```bash
npm install
```

**3. 환경 변수 설정:**
```bash
# backend/.env 파일이 자동 생성됨
# 필요시 backend/.env.example 참고
```

`backend/.env` 예시:
```env
DATABASE_URL="file:./dev.db"
PORT=4000
NODE_ENV=development
```

**4. 데이터베이스 초기화:**
```bash
# Prisma 마이그레이션 실행
npx prisma migrate dev --name init

# Prisma Client 생성
npx prisma generate

# (선택) 데모 데이터 추가
npx prisma db seed
```

**5. 개발 서버 실행:**
```bash
npm run dev
```
→ http://localhost:4000 에서 실행됩니다.

**6. 데이터베이스 확인 (선택):**
```bash
npx prisma studio
```
→ http://localhost:5555 에서 GUI로 데이터 확인 가능

## 데이터베이스 구조

**주요 모델:**

- **User**: 사용자 계정 (이메일, 닉네임, 아바타, 신체 정보)
- **ClothingItem**: 옷 아이템 (카테고리, 색상, 브랜드, 가격, 구매 여부 등)
- **Look**: 코디 (아이템 조합, 레이어 정보, 스냅샷)
- **PublicLook**: 공개 코디 (좋아요, 북마크 수, 공유 ID)

**관계:**
- User → ClothingItem (1:N)
- User → Look (1:N)
- Look → PublicLook (1:1, 선택적)

자세한 스키마는 `backend/prisma/schema.prisma`를 참고하세요.

## AI 백엔드 (Stub 구현)

현재 AI 기능은 **Stub 구현** 상태입니다. 실제 AI 모델은 연동되어 있지 않지만, API 계약(Contract)은 정의되어 있어 언제든 실제 모델로 교체 가능합니다.

### AI API 엔드포인트

| 엔드포인트 | 기능 | 상태 |
|-----------|------|------|
| `POST /api/ai/remove-background` | 옷 이미지 배경 제거 | Stub (파일 저장 후 URL 반환) |
| `POST /api/ai/avatar` | 얼굴 사진으로 아바타 생성 | Stub (업로드 파일 URL 반환) |
| `POST /api/ai/try-on` | 가상 피팅 이미지 생성 | Stub (향후 확장용) |
| `GET /uploads/*` | 업로드 파일 정적 제공 | ✅ 동작 |

### Mock 모드 vs Backend 모드

**Mock 모드 (기본):**
- `.env.local`에 `VITE_API_BASE_URL` 미설정 시 자동 활성화
- 모든 기능이 브라우저에서만 동작 (백엔드 불필요)
- 배경 제거: `URL.createObjectURL()` 사용
- 아바타: placeholder 이미지 사용

**Backend 모드:**
- `.env.local`에 `VITE_API_BASE_URL=http://localhost:4000` 설정
- Avatar/Upload 페이지에서 백엔드 API 호출
- 파일이 `backend/uploads/` 폴더에 실제 저장됨
- 에러 시 자동으로 Mock 모드로 Fallback

### 실제 AI 모델 통합 방법

`backend/src/routes/ai.ts` 파일의 TODO 주석을 참고하여 다음 API로 교체 가능합니다:

- **배경 제거**: [remove.bg API](https://www.remove.bg/api) 또는 U-2-Net 모델
- **아바타 생성**: OpenAI DALL-E, Stable Diffusion
- **가상 피팅**: VITON-HD, HR-VITON (GPU 서버 필요)

## Backend API 엔드포인트

| Method | Endpoint                   | 설명                       |
|--------|----------------------------|----------------------------|
| GET    | /api/data/closet          | 옷장 목록 조회             |
| POST   | /api/data/closet          | 옷장 아이템 추가           |
| PUT    | /api/data/closet/:id      | 옷장 아이템 수정           |
| DELETE | /api/data/closet/:id      | 옷장 아이템 삭제           |
| GET    | /api/data/looks           | 룩 목록 조회               |
| POST   | /api/data/looks           | 룩 추가                    |
| DELETE | /api/data/looks/:id       | 룩 삭제                    |
| GET    | /api/data/public-looks    | 공개 코디 피드 조회        |

> 현재 프론트엔드는 localStorage를 주 저장소로 사용하며, 백엔드 API와의 동기화는 점진적으로 마이그레이션될 예정입니다.

## 배포

### Vercel / Netlify 배포

**1. SPA Routing 설정:**
- Vercel: `vercel.json` 파일 포함됨 (자동 적용)
- Netlify: `public/_redirects` 파일 포함됨 (자동 적용)

**2. 환경 변수 설정:**
호스팅 플랫폼의 환경 변수 설정에서 다음 추가:
```
VITE_API_BASE_URL=https://your-backend-api.com
VITE_APP_NAME=LookMate
VITE_APP_ENV=production
```

**3. 빌드 명령어:**
```bash
npm run build
```

### 백엔드 배포

**1. 프로덕션 빌드:**
```bash
cd backend
npm run build  # dist/ 폴더 생성
```

**2. 실행:**
```bash
NODE_ENV=production PORT=4000 npm run start
```

**3. 환경 변수:**
프로덕션 환경에서 `backend/.env` 설정:
```env
DATABASE_URL="file:./prod.db"
PORT=4000
NODE_ENV=production
```

## 프로젝트 구조

```
LookMate/
├── src/                    # Frontend 소스
│   ├── components/         # React 컴포넌트
│   │   ├── common/        # 공통 컴포넌트 (Button, Modal 등)
│   │   └── layout/        # 레이아웃 컴포넌트
│   ├── pages/             # 페이지 컴포넌트
│   ├── services/          # API 서비스 레이어
│   ├── store/             # Zustand 상태 관리
│   └── types/             # TypeScript 타입 정의
├── backend/               # Backend 소스
│   ├── src/
│   │   ├── routes/       # Express 라우터 (ai.ts, data.ts)
│   │   ├── db.ts         # Prisma Client 싱글톤
│   │   ├── seed.ts       # 데이터베이스 Seed 스크립트
│   │   └── server.ts     # Express 서버 진입점
│   ├── prisma/           # Prisma 스키마 및 마이그레이션
│   └── uploads/          # 업로드된 파일 저장소
├── public/               # 정적 파일 (favicon, manifest 등)
├── .github/              # GitHub Actions CI/CD
└── README.md            # 프로젝트 문서 (현재 파일)
```

## 현재 구현 상태

### ✅ 완료된 기능
- 옷장 관리 (추가/수정/삭제/필터링/검색)
- 가상 피팅 (레이어링, 위치/크기/회전 조정)
- 코디 저장 및 스냅샷
- AI 백엔드 Stub (파일 업로드/정적 서빙)
- 데이터베이스 스키마 및 읽기 API
- 인증 시스템 (Mock, localStorage 기반)
- 공개 코디 피드
- 외부 상품 검색 및 임포트
- SEO 최적화, PWA 설정
- 404 페이지, 공통 UI 컴포넌트
- **GitHub Actions CI/CD 파이프라인 (타입체크 + 빌드 자동화)**

### ⏳ 향후 개선 사항
- 실제 AI 모델 통합 (배경 제거, 아바타 생성, 가상 피팅)
- 데이터베이스 쓰기 API (POST/PUT/DELETE)
- localStorage → Backend API 마이그레이션
- 실제 인증 시스템 (JWT, OAuth)
- 실시간 동기화 (WebSocket)

## 라이선스

MIT License

## 개발자

LookMate Team
