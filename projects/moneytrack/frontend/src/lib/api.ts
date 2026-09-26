const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4200/api';

export class ApiError extends Error {
  constructor(public readonly status: number, message: string) { super(message); }
}

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body && !(init.body instanceof FormData)) headers.set('Content-Type', 'application/json');
  const response = await fetch(`${API_URL}${path}`, { ...init, headers, credentials: 'include' });
  if (!response.ok) {
    const payload = await response.json().catch(() => null) as { error?: { message?: string } | string; message?: string } | null;
    const message = typeof payload?.error === 'string' ? payload.error : payload?.error?.message ?? payload?.message ?? response.statusText;
    throw new ApiError(response.status, message);
  }
  return response.json() as Promise<T>;
}
