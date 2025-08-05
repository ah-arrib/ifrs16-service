import axios from 'axios';
import type { Lease, LeaseCalculation, ERPAsset, PeriodEndRequest, PostingRequest } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://localhost:7297/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Lease API
export const leaseApi = {
  getAll: async (): Promise<Lease[]> => {
    const response = await api.get('/leases');
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
};

// Calculations API
export const calculationsApi = {
  runPeriodEnd: async (request: PeriodEndRequest): Promise<{ success: boolean; message: string }> => {
    const response = await api.post('/calculations/period-end', request);
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
