const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

interface ApiError {
  statusCode: number;
  message: string | string[];
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    path: string,
    options: RequestInit = {},
  ): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    let response: Response;

    try {
      response = await fetch(url, {
        ...options,
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'X-FinPilot-Client': 'web',
          ...options.headers,
        },
      });
    } catch {
      throw new Error(
        `Cannot reach the API at ${this.baseUrl}. Make sure Docker is running and the API started (look for "FinPilot API running on http://localhost:3001" in the terminal).`,
      );
    }

    if (response.status === 401 && !path.includes('/auth/')) {
      const refreshed = await this.refreshToken();
      if (refreshed) {
        return this.request<T>(path, options);
      }
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
      throw new Error('Unauthorized');
    }

    const body = await response.json();

    if (!response.ok) {
      const error = body as ApiError;
      const message = Array.isArray(error.message)
        ? error.message.join(', ')
        : error.message || 'Request failed';
      throw new Error(message);
    }

    if ('success' in body && 'data' in body) {
      return (body as ApiResponse<T>).data;
    }

    return body as T;
  }

  async refreshToken(): Promise<boolean> {
    try {
      await fetch(`${this.baseUrl}/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'X-FinPilot-Client': 'web',
        },
      });
      return true;
    } catch {
      return false;
    }
  }

  get<T>(path: string) {
    return this.request<T>(path);
  }

  post<T>(path: string, data?: unknown) {
    return this.request<T>(path, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  patch<T>(path: string, data?: unknown) {
    return this.request<T>(path, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  delete<T>(path: string) {
    return this.request<T>(path, { method: 'DELETE' });
  }

  async postForm<T>(path: string, formData: FormData): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const response = await fetch(url, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'X-FinPilot-Client': 'web',
      },
      body: formData,
    });

    if (response.status === 401) {
      const refreshed = await this.refreshToken();
      if (refreshed) return this.postForm<T>(path, formData);
      if (typeof window !== 'undefined') window.location.href = '/login';
      throw new Error('Unauthorized');
    }

    const body = await response.json();
    if (!response.ok) {
      const message = Array.isArray(body.message) ? body.message.join(', ') : body.message;
      throw new Error(message || 'Upload failed');
    }

    return ('success' in body && 'data' in body ? body.data : body) as T;
  }
}

export const api = new ApiClient(API_URL);
