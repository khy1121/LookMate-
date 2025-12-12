# Project Snapshot

## 0. How to use this doc
- In new chats, paste ONLY this file + the specific files you want to edit.
- Keep this doc short (< ~200 lines) and update *between* steps, not during.

---

## 1. Project Overview
- Name: …
- Goal: …
- Stack:
  - Frontend: …
  - Backend: …
  - DB: …
- Main features (1–2 lines): …

---

## 2. Frontend Structure (high-level only)
- Tooling: Vite + React 18 + TypeScript + Tailwind CSS
- State: …
- Routing:
  - `/` → …
  - `/app/*` → …
- Key dirs:
  - `src/pages/…`
  - `src/components/…`
  - `src/services/…`
  - `src/store/useStore.ts` (Zustand)

---

## 3. Backend Structure (high-level only)
- Runtime: Node + Express + TypeScript
- AI server: `/api/ai/*` (avatar, remove-background, try-on) – currently stub / mock
- Data API: `/api/data/*`
- Prisma + SQLite:
  - Models: User, ClothingItem, Look, PublicLook, …
- Dev commands:
  - `cd backend && npm run dev`
  - `npm run dev` (frontend)

---

## 4. Current Functional Status (Step XX)
Write in bullet form. Keep it tight.

### 4-1. Auth / Users
- LocalStorage-based mock auth (`authService.ts`) – email/password, multi-user separated data.
- Protected routes: `/app/*` behind `ProtectedRoute`.
- Current user info: stored in Zustand (`currentUser`).

### 4-2. Closet / Upload / Fitting / Looks
- Upload: 이미지 + 메타데이터(카테고리, 시즌, 쇼핑 URL, 가격, 구매 여부) 저장.
- Closet: 필터(카테고리, 시즌, 구매 상태), 즐겨찾기, 삭제.
- Fitting: 아바타 위에 아이템 레이어(위치/크기 슬라이더) + html2canvas 스냅샷 저장.
- Looks: 저장/삭제, Dashboard 카드 표시, 사용 통계(TOP3, 사용 횟수/마지막 사용일).

### 4-3. Recommendations / Shopping
- 추천 코디: 시즌 기반 룰 엔진 → `activeLook`에 적용 가능.
- 외부 상품: `productService` mock + Explore/Discover 페이지.
- “옷장에 추가”: Product → ClothingItem 매핑.

### 4-4. Public Feed / Explore
- PublicLook 목록: …
- 공개/비공개 토글: …
- 삭제: …

### 4-5. AI / Backend Integration
- `aiService.ts`: `VITE_API_BASE_URL` 유무로 Mock ↔ Backend 토글.
- Backend AI: 파일 업로드 + `/uploads/*` 정적 서빙, 현재는 placeholder URL 반환.
- Prisma DB: 읽기/쓰기 API 범위 요약.

---

## 5. What Step XX Just Implemented
- One short paragraph describing what THIS step added/changed.
- Example:
  - “Step 23: Closet read/write is now backed by Express + Prisma when backend is enabled, with graceful Korean toasts and localStorage fallback.”

---

## 6. Known limitations / TODO (for next steps)
- Example:
  - Still using Tailwind CDN in `index.html` (needs build-time Tailwind).
  - AI endpoints are stub only (no real model).
  - Zustand store partly localStorage-based (not fully synced with DB).
