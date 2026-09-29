const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4100/api';

export class ApiError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

export async function apiRequest<T>(path: string, options: RequestInit & { token?: string } = {}): Promise<T> {
  const { token, ...requestOptions } = options;
  const response = await fetch(`${API_URL}${path}`, {
    ...requestOptions,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...requestOptions.headers },
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({ message: response.statusText })) as { message?: string | string[] };
    const message = Array.isArray(body.message) ? body.message.join(', ') : body.message ?? response.statusText;
    throw new ApiError(response.status, message);
  }
  return response.json() as Promise<T>;
}

export async function refreshAccessToken() {
  return apiRequest<{ accessToken: string }>('/auth/refresh', { method: 'POST' });
}
