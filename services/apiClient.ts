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

/**
 * Generic GET request
 */
export async function get<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    method: 'GET',
  });
  
  if (!res.ok) {
    throw new Error(`API GET ${path} failed: ${res.status} ${res.statusText}`);
  }
  
  return res.json() as Promise<T>;
}

/**
 * Generic POST request
 */
export async function post<T>(path: string, body: unknown, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
    body: JSON.stringify(body),
  });
  
  if (!res.ok) {
    throw new Error(`API POST ${path} failed: ${res.status} ${res.statusText}`);
  }
  
  return res.json() as Promise<T>;
}

/**
 * Upload file (multipart/form-data)
 */
export async function upload<T>(path: string, formData: FormData, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    method: 'POST',
    body: formData,
  });
  
  if (!res.ok) {
    throw new Error(`API UPLOAD ${path} failed: ${res.status} ${res.statusText}`);
  }
  
  return res.json() as Promise<T>;
}

/**
 * Generic PUT request
 */
export async function put<T>(path: string, body: unknown, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
    body: JSON.stringify(body),
  });
  
  if (!res.ok) {
    throw new Error(`API PUT ${path} failed: ${res.status} ${res.statusText}`);
  }
  
  return res.json() as Promise<T>;
}

/**
 * Generic DELETE request
 */
export async function del<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    method: 'DELETE',
  });
  
  if (!res.ok) {
    throw new Error(`API DELETE ${path} failed: ${res.status} ${res.statusText}`);
  }
  
  return res.json() as Promise<T>;
}
