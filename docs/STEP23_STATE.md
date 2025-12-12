# STEP28_STATE (super short)

- Auth: localStorage mock, ProtectedRoute, Korean error toasts.
- Profile: backend ON → /api/data/profile GET/PUT으로 currentUser 프로필(닉네임/아바타/체형) 동기화, OFF → 기존 localStorage만 사용.
- Closet: backend ON → /api/data/closet CRUD, OFF → localStorage only.
- Looks: backend ON → /api/data/looks CRUD (load/create/update/delete via dataService + isLooksLoading & Dashboard hint), OFF → localStorage fallback.
- Explore: public looks read + delete + like/bookmark via backend (naive counters, 0 이하 방지), OFF → 데모 모드에서 로컬 카운트/토스트만 사용.
- MyPublicLooks: backend GET /api/data/my-public-looks + store 로딩 + Dashboard "내 공개 코디" 섹션.
