// 인증 사용자 타입 정의
export type AuthUser = {
  id: string;
  email: string;
  displayName?: string | null;
};
