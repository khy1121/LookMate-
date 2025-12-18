/**
 * API Client for LookMate Backend Integration
 * 
 * 현재는 Mock 서비스를 사용하고 있지만, 실제 배포 시 이 클라이언트를 통해
 * 백엔드 API로 요청을 전환할 수 있습니다.
 * 
 * 환경 변수 설정:
 * - .env.local 파일에 VITE_API_BASE_URL 설정
 * - 예: VITE_API_BASE_URL=https://api.lookmate.com
 */

const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || '';

// Minimal 401 handling UX: show a single toast, clear token, emit logout event and redirect
const ALREADY_401_KEY = 'lm_401_shown';
let alreadyShown401 = (typeof sessionStorage !== 'undefined' && sessionStorage.getItem(ALREADY_401_KEY) === 'true') || false;
function handleUnauthorized() {
  if (alreadyShown401) return;
  alreadyShown401 = true;
  try { if (typeof sessionStorage !== 'undefined') sessionStorage.setItem(ALREADY_401_KEY, 'true'); } catch (e) {}
  try {
    if (typeof localStorage !== 'undefined') localStorage.removeItem('lm_token');
    // 한글 토스트로 알림
    try {
      // useUiStore를 통해 토스트를 띄웁니다 (동적 import로 순환 의존성 회피)
      import('../store/useUiStore')
        .then(({ useUiStore }) => useUiStore.getState().showToast('로그인이 만료되었습니다. 다시 로그인해주세요.', 'error'))
        .catch((err) => console.warn('토스트 표시 실패', err));
    } catch (e) {
      // Fallback: console
      console.warn('토스트 표시 실패', e);
    }

    // 중앙화된 로그아웃 트리거: 스토어나 루트에서 이 이벤트를 수신하여 상태 정리를 수행
    try {
      window.dispatchEvent(new Event('lm:unauthorized'));
    } catch (e) {
      // ignore
    }

    // redirect after a short delay to allow logout handlers to run
    setTimeout(() => {
      try {
        // avoid reload loop if already at root
        if (window.location.pathname !== '/') window.location.href = '/';
      } catch (e) {}
    }, 250);
  } catch (e) {
    // ignore
  }
}

/**
 * JWT 헤더 자동 주입
 * - localStorage의 `lm_token`을 읽어 `Authorization: Bearer <token>`를 추가합니다.
 * - 호출자가 `init.headers`로 이미 `Authorization`을 제공하면 덮어쓰지 않습니다.
 */
function getAuthHeader(init?: RequestInit): Record<string, string> {
  try {
    const token = typeof localStorage !== 'undefined' ? localStorage.getItem('lm_token') : null;
    if (!token) return {};
    const provided = init?.headers && (init.headers as any)['Authorization'];
    return provided ? {} : { Authorization: `Bearer ${token}` };
  } catch (e) {
    return {};
  }
}

/**
 * URL에 쿼리 파라미터를 추가하는 헬퍼 함수
 */
function buildUrlWithParams(
  baseUrl: string,
  params?: Record<string, string | number | boolean>
): string {
  if (!params || Object.keys(params).length === 0) return baseUrl;
  
  const usp = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    usp.append(key, String(value));
  });
  
  const separator = baseUrl.includes('?') ? '&' : '?';
  return `${baseUrl}${separator}${usp.toString()}`;
}

/**
 * Generic GET request with optional query parameters
 */
export async function get<T>(
  path: string,
  options?: {
    params?: Record<string, string | number | boolean>;
    init?: RequestInit;
  }
): Promise<T> {
  const url = buildUrlWithParams(`${API_BASE_URL}${path}`, options?.params);
  
  const headers = {
    ...getAuthHeader(options?.init),
    ...(options?.init?.headers ?? {}),
  };

  const res = await fetch(url, {
    ...options?.init,
    method: 'GET',
    headers,
  });

  if (res.status === 401) {
    handleUnauthorized();
    throw new Error(`API GET ${path} failed: 401`);
  }

  if (!res.ok) {
    throw new Error(`API GET ${path} failed: ${res.status} ${res.statusText}`);
  }

  return res.json() as Promise<T>;
}

/**
 * Generic POST request
 */
export async function post<T>(path: string, body: unknown, init?: RequestInit): Promise<T> {
  const headers = {
    'Content-Type': 'application/json',
    ...getAuthHeader(init),
    ...(init?.headers ?? {}),
  };

  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });

  if (res.status === 401) {
    handleUnauthorized();
    throw new Error(`API POST ${path} failed: 401`);
  }

  if (!res.ok) {
    throw new Error(`API POST ${path} failed: ${res.status} ${res.statusText}`);
  }

  return res.json() as Promise<T>;
}

/**
 * Upload file (multipart/form-data)
 */
export async function upload<T>(path: string, formData: FormData, init?: RequestInit): Promise<T> {
  const headers = {
    ...getAuthHeader(init),
    ...(init?.headers ?? {}),
  };

  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    method: 'POST',
    headers,
    body: formData,
  });

  if (res.status === 401) {
    handleUnauthorized();
    throw new Error(`API UPLOAD ${path} failed: 401`);
  }

  if (!res.ok) {
    throw new Error(`API UPLOAD ${path} failed: ${res.status} ${res.statusText}`);
  }

  return res.json() as Promise<T>;
}

/**
 * Generic PUT request
 */
export async function put<T>(path: string, body: unknown, init?: RequestInit): Promise<T> {
  const headers = {
    'Content-Type': 'application/json',
    ...getAuthHeader(init),
    ...(init?.headers ?? {}),
  };

  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    method: 'PUT',
    headers,
    body: JSON.stringify(body),
  });

  if (res.status === 401) {
    handleUnauthorized();
    throw new Error(`API PUT ${path} failed: 401`);
  }

  if (!res.ok) {
    throw new Error(`API PUT ${path} failed: ${res.status} ${res.statusText}`);
  }

  return res.json() as Promise<T>;
}

/**
 * Generic DELETE request
 */
export async function del<T>(path: string, body?: unknown, init?: RequestInit): Promise<T> {
  const baseHeaders = body ? { 'Content-Type': 'application/json' } : {};
  const headers = {
    ...baseHeaders,
    ...getAuthHeader(init),
    ...(init?.headers ?? {}),
  };

  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    method: 'DELETE',
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (res.status === 401) {
    handleUnauthorized();
    throw new Error(`API DELETE ${path} failed: 401`);
  }

  if (!res.ok) {
    throw new Error(`API DELETE ${path} failed: ${res.status} ${res.statusText}`);
  }

  return res.json() as Promise<T>;
}

/**
 * Exported API Client object (Step 16)
 */
export const apiClient = {
  get,
  post,
  put,
  del,
  upload,
};
