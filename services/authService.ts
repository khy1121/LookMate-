/**
 * Authentication Service - Mock Implementation
 * 
 * ⚠️ 보안 경고:
 * - 현재 구현은 데모/개인용으로, localStorage에 비밀번호를 저장합니다.
 * - 실제 서비스에서는 절대 프론트엔드에 비밀번호를 저장하지 마세요.
 * - 백엔드 API + 데이터베이스 + 해시/솔트 기반 인증 필수
 * 
 * 실제 서비스 전환 시 API 설계:
 * 
 * 1. POST /api/auth/register
 *    - Request: { email, displayName, password }
 *    - Response: { user: AuthUser, token: string }
 * 
 * 2. POST /api/auth/login
 *    - Request: { email, password }
 *    - Response: { user: AuthUser, token: string }
 * 
 * 3. POST /api/auth/logout
 *    - Request: { token }
 *    - Response: { success: boolean }
 * 
 * 4. GET /api/auth/me
 *    - Headers: { Authorization: Bearer <token> }
 *    - Response: { user: AuthUser }
 */

import { AuthUser } from '../types';
import { apiClient } from './apiClient';

const API_BASE = (import.meta as any).env?.VITE_API_BASE_URL || '';
const USE_BACKEND = !!API_BASE;

const USERS_KEY = 'lm_users';
const SESSION_KEY = 'lm_session';

export interface RegisterPayload {
  email: string;
  displayName: string;
  password: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

interface StoredUser {
  id: string;
  email: string;
  displayName: string;
  password: string; // ⚠️ 실제 서비스에서는 절대 금지
  createdAt: number;
}

interface Session {
  userId: string;
  email: string;
  displayName: string;
  createdAt: number;
}

// Helper: Get all users from localStorage
const getUsers = (): StoredUser[] => {
  try {
    const data = localStorage.getItem(USERS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error('Failed to load users', e);
    return [];
  }
};

// Helper: Save users to localStorage
const saveUsers = (users: StoredUser[]): void => {
  try {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  } catch (e) {
    console.error('Failed to save users', e);
  }
};

// Helper: Get current session
const getSession = (): Session | null => {
  try {
    const data = localStorage.getItem(SESSION_KEY);
    return data ? JSON.parse(data) : null;
  } catch (e) {
    console.error('Failed to load session', e);
    return null;
  }
};

// Helper: Save session
const saveSession = (session: Session | null): void => {
  try {
    if (session) {
      localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    } else {
      localStorage.removeItem(SESSION_KEY);
    }
  } catch (e) {
    console.error('Failed to save session', e);
  }
};

/**
 * 회원가입
 */
export async function register(payload: RegisterPayload): Promise<AuthUser> {
  if (USE_BACKEND) {
    // Backend registration: call register then login to obtain token
    await apiClient.post('/api/auth/register', { email: payload.email, password: payload.password, displayName: payload.displayName });
    // After register, call login to obtain token and user
    return await login({ email: payload.email, password: payload.password });
  }

  // Simulate network delay for mock
  await new Promise((resolve) => setTimeout(resolve, 500));

  const users = getUsers();
  
  // Check email duplication
  if (users.some((u) => u.email === payload.email)) {
    throw new Error('이미 사용 중인 이메일입니다.');
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(payload.email)) {
    throw new Error('올바른 이메일 형식이 아닙니다.');
  }

  // Validate password
  if (payload.password.length < 6) {
    throw new Error('비밀번호는 최소 6자 이상이어야 합니다.');
  }

  // Create new user
  const newUser: StoredUser = {
    id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    email: payload.email,
    displayName: payload.displayName,
    password: payload.password, // ⚠️ 실제 서비스에서는 절대 금지
    createdAt: Date.now(),
  };

  users.push(newUser);
  saveUsers(users);

  // Auto login after registration
  const session: Session = {
    userId: newUser.id,
    email: newUser.email,
    displayName: newUser.displayName,
    createdAt: newUser.createdAt,
  };
  saveSession(session);

  return {
    id: newUser.id,
    email: newUser.email,
    displayName: newUser.displayName,
    createdAt: newUser.createdAt,
  };
}

/**
 * 로그인
 */
export async function login(payload: LoginPayload): Promise<AuthUser> {
  if (USE_BACKEND) {
    // Backend login: obtain token then fetch /me
    const resp = await apiClient.post<{ token: string }>('/api/auth/login', { email: payload.email, password: payload.password });
    const token = (resp as any).token;
    if (!token) throw new Error('토큰을 받지 못했습니다');
    try { localStorage.setItem('lm_token', token); } catch (e) {}
    // fetch user info
    const user = await apiClient.get<AuthUser>('/api/auth/me');
    // 백엔드가 createdAt을 제공하지 않는 경우 대비
    if (!(user as any).createdAt) (user as any).createdAt = Date.now();
    return user;
  }

  // Simulate network delay for mock
  await new Promise((resolve) => setTimeout(resolve, 500));

  const users = getUsers();
  
  const user = users.find((u) => u.email === payload.email);
  
  if (!user) {
    throw new Error('존재하지 않는 이메일입니다.');
  }

  if (user.password !== payload.password) {
    throw new Error('비밀번호가 일치하지 않습니다.');
  }

  // Create session
  const session: Session = {
    userId: user.id,
    email: user.email,
    displayName: user.displayName,
    createdAt: user.createdAt,
  };
  saveSession(session);

  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    createdAt: user.createdAt,
  };
}

/**
 * 로그아웃
 */
export async function logout(): Promise<void> {
  if (USE_BACKEND) {
    try {
      await apiClient.post('/api/auth/logout', {});
    } catch (e) {
      // ignore
    }
  }

  // local cleanup
  try { localStorage.removeItem('lm_token'); } catch (e) {}
  try { if (typeof sessionStorage !== 'undefined') sessionStorage.removeItem('lm_401_shown'); } catch (e) {}
  saveSession(null);

  // emit logout event for store cleanup
  try { window.dispatchEvent(new Event('lm:logout')); } catch (e) {}
}

/**
 * 현재 로그인된 사용자 가져오기
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  if (USE_BACKEND) {
    try {
      const user = await apiClient.get<AuthUser>('/api/auth/me');
      if (!(user as any).createdAt) (user as any).createdAt = Date.now();
      return user;
    } catch (e) {
      return null;
    }
  }

  // Simulate network delay for mock
  await new Promise((resolve) => setTimeout(resolve, 100));

  const session = getSession();
  
  if (!session) {
    return null;
  }

  // Verify user still exists
  const users = getUsers();
  const user = users.find((u) => u.id === session.userId);
  
  if (!user) {
    // Session is stale, clear it
    saveSession(null);
    return null;
  }

  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    createdAt: user.createdAt,
  };
}
