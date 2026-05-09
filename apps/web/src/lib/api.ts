import axios, { AxiosInstance } from 'axios';
import { ApiResponse } from '@neuronhire/shared';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: process.env.NEXT_PUBLIC_API_URL,
      headers: {
        'Content-Type': 'application/json'
      },
      withCredentials: true
    });

    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        // Add auth token if available
        const token = localStorage.getItem('accessToken');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        // Handle token refresh
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            const refreshToken = localStorage.getItem('refreshToken');
            const response = await this.client.post('/api/auth/refresh', {
              refreshToken
            });

            const { accessToken } = response.data.data;
            localStorage.setItem('accessToken', accessToken);

            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
            return this.client(originalRequest);
          } catch (refreshError) {
            // Redirect to login
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            window.location.href = '/sign-in';
            return Promise.reject(refreshError);
          }
        }

        return Promise.reject(error);
      }
    );
  }

  async get<T>(url: string): Promise<ApiResponse<T>> {
    const response = await this.client.get<ApiResponse<T>>(url);
    return response.data;
  }

  async post<T>(url: string, data?: any): Promise<ApiResponse<T>> {
    const response = await this.client.post<ApiResponse<T>>(url, data);
    return response.data;
  }

  async put<T>(url: string, data?: any): Promise<ApiResponse<T>> {
    const response = await this.client.put<ApiResponse<T>>(url, data);
    return response.data;
  }

  async delete<T>(url: string): Promise<ApiResponse<T>> {
    const response = await this.client.delete<ApiResponse<T>>(url);
    return response.data;
  }
}

export const apiClient = new ApiClient();

// ── Stats API ────────────────────────────────────────────────
export const statsApi = {
  getPlatformStats: () => apiClient.get('/api/stats/platform'),
  getAdminStats: () => apiClient.get('/api/stats/admin'),
  getAdminRevenue: (months = 6) => apiClient.get(`/api/stats/admin/revenue?months=${months}`),
  getAdminActivity: (limit = 20) => apiClient.get(`/api/stats/admin/activity?limit=${limit}`),
};

// ── Featured API ─────────────────────────────────────────────
export const featuredApi = {
  getEngineers: () => apiClient.get('/api/featured/engineers'),
  getProducts: () => apiClient.get('/api/featured/products'),
  getBounties: () => apiClient.get('/api/featured/bounties'),
};

// ── Dashboard API ────────────────────────────────────────────
export const dashboardApi = {
  getEngineerStats: () => apiClient.get('/api/dashboard/engineer'),
  getRecommendedBounties: (limit = 10) => apiClient.get(`/api/dashboard/engineer/recommended-bounties?limit=${limit}`),
  getEngineerActivity: (limit = 10) => apiClient.get(`/api/dashboard/engineer/activity?limit=${limit}`),
  getCompanyStats: () => apiClient.get('/api/dashboard/company'),
  getPendingSubmissions: (limit = 10) => apiClient.get(`/api/dashboard/company/pending-submissions?limit=${limit}`),
};
