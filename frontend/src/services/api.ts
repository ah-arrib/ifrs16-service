import axios from 'axios';
import type { 
  Lease, 
  LeaseCalculation, 
  ERPAsset, 
  PeriodEndRequest, 
  PostingRequest,
  Tenant,
  User,
  UserContext,
  CalculationPreview
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://localhost:7297/api';

// Demo authentication headers - in production, this would come from your auth system
let currentUser: UserContext | null = null;

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add interceptor to include authentication headers
api.interceptors.request.use((config) => {
  if (currentUser) {
    config.headers['X-User-Id'] = currentUser.userId;
    config.headers['X-User-Role'] = currentUser.role;
    if (currentUser.tenantId) {
      config.headers['X-Tenant-Id'] = currentUser.tenantId;
    }
  }
  return config;
});

// Authentication API (demo implementation)
export const authApi = {
  setCurrentUser: (user: UserContext) => {
    currentUser = user;
  },

  getCurrentUser: (): UserContext | null => {
    return currentUser;
  },

  logout: () => {
    currentUser = null;
  },

  // Demo login - in production, this would authenticate with your auth system
  demoLogin: (userId: string, tenantId?: string, role = 'User'): UserContext => {
    const user: UserContext = {
      userId,
      email: `${userId}@example.com`,
      fullName: `Demo User ${userId}`,
      tenantId,
      role,
      isAdmin: role === 'Admin' && !tenantId,
      isTenantAdmin: role === 'TenantAdmin'
    };
    currentUser = user;
    return user;
  }
};

// Tenant API
export const tenantApi = {
  getAll: async (): Promise<Tenant[]> => {
    const response = await api.get('/tenants');
    return response.data;
  },

  getById: async (tenantId: string): Promise<Tenant> => {
    const response = await api.get(`/tenants/${tenantId}`);
    return response.data;
  },

  create: async (tenant: Omit<Tenant, 'id' | 'createdDate'>): Promise<Tenant> => {
    const response = await api.post('/tenants', tenant);
    return response.data;
  },

  update: async (tenantId: string, tenant: Tenant): Promise<void> => {
    await api.put(`/tenants/${tenantId}`, tenant);
  },

  delete: async (tenantId: string): Promise<void> => {
    await api.delete(`/tenants/${tenantId}`);
  },

  updateAccess: async (tenantId: string): Promise<void> => {
    await api.post(`/tenants/${tenantId}/access`);
  }
};

// User API
export const userApi = {
  getAll: async (tenantId?: string): Promise<User[]> => {
    const params = tenantId ? { tenantId } : {};
    const response = await api.get('/users', { params });
    return response.data;
  },

  getById: async (userId: string): Promise<User> => {
    const response = await api.get(`/users/${userId}`);
    return response.data;
  },

  getCurrentUser: async (): Promise<UserContext> => {
    const response = await api.get('/users/me');
    return response.data;
  },

  create: async (user: Omit<User, 'id' | 'createdDate'>): Promise<User> => {
    const response = await api.post('/users', user);
    return response.data;
  },

  update: async (userId: string, user: User): Promise<void> => {
    await api.put(`/users/${userId}`, user);
  },

  delete: async (userId: string): Promise<void> => {
    await api.delete(`/users/${userId}`);
  },

  updateLastLogin: async (userId: string): Promise<void> => {
    await api.post(`/users/${userId}/login`);
  }
};

// Lease API (updated for multi-tenancy)
export const leaseApi = {
  getAll: async (tenantId?: string): Promise<Lease[]> => {
    const params = tenantId ? { tenantId } : {};
    const response = await api.get('/leases', { params });
    return response.data;
  },

  getByTenant: async (tenantId: string): Promise<Lease[]> => {
    const response = await api.get(`/leases?tenantId=${tenantId}`);
    return response.data;
  },

  getById: async (id: number): Promise<Lease> => {
    const response = await api.get(`/leases/${id}`);
    return response.data;
  },

  create: async (lease: Omit<Lease, 'id' | 'createdDate' | 'lastCalculationDate'>): Promise<Lease> => {
    const response = await api.post('/leases', lease);
    return response.data;
  },

  update: async (id: number, lease: Lease): Promise<void> => {
    await api.put(`/leases/${id}`, lease);
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/leases/${id}`);
  },

  calculate: async (id: number): Promise<LeaseCalculation[]> => {
    const response = await api.post(`/leases/${id}/calculate`);
    return response.data;
  },

  getCalculations: async (id: number): Promise<LeaseCalculation[]> => {
    const response = await api.get(`/leases/${id}/calculations`);
    return response.data;
  },

  getCalculationDetail: async (leaseId: number, calculationId: number): Promise<LeaseCalculation> => {
    const response = await api.get(`/leases/${leaseId}/calculations/${calculationId}`);
    return response.data;
  },
};

// Calculations API
export const calculationsApi = {
  runPeriodEnd: async (request: PeriodEndRequest): Promise<{ success: boolean; message: string }> => {
    const response = await api.post('/calculations/period-end', request);
    return response.data;
  },

  previewPeriod: async (request: PeriodEndRequest): Promise<CalculationPreview> => {
    const response = await api.post('/calculations/preview-period', request);
    return response.data;
  },

  postToERP: async (request: PostingRequest): Promise<{ success: boolean; message: string }> => {
    const response = await api.post('/calculations/post-to-erp', request);
    return response.data;
  },

  postPeriodToERP: async (request: PeriodEndRequest): Promise<{ success: boolean; message: string }> => {
    const response = await api.post('/calculations/post-period-to-erp', request);
    return response.data;
  },
};

// ERP API
export const erpApi = {
  getAssets: async (): Promise<ERPAsset[]> => {
    const response = await api.get('/erp/assets');
    return response.data;
  },

  getAsset: async (assetId: string): Promise<ERPAsset> => {
    const response = await api.get(`/erp/assets/${assetId}`);
    return response.data;
  },

  testConnection: async (): Promise<{ status: string; message: string }> => {
    const response = await api.get('/erp/health');
    return response.data;
  },
};

// Error handling interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error);
    
    if (error.response?.status === 401) {
      // Handle unauthorized access
      console.error('Unauthorized access');
    } else if (error.response?.status >= 500) {
      // Handle server errors
      console.error('Server error occurred');
    }
    
    return Promise.reject(error);
  }
);

export default api;
