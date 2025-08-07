import React, { useState, useEffect } from 'react';
import type { Tenant, UserContext } from '../types';
import { tenantApi } from '../services/api';

interface TenantManagementProps {
  currentUser: UserContext;
}

export const TenantManagement: React.FC<TenantManagementProps> = ({ currentUser }) => {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newTenant, setNewTenant] = useState({
    tenantId: '',
    tenantName: '',
    isActive: true,
    settings: JSON.stringify({
      currency: 'USD',
      timeZone: 'UTC',
      fiscalYearEnd: '12-31',
      enableERPIntegration: true
    })
  });

  useEffect(() => {
    loadTenants();
  }, []);

  const loadTenants = async () => {
    try {
      setLoading(true);
      const data = await tenantApi.getAll();
      setTenants(data);
    } catch (err) {
      setError('Failed to load tenants');
      console.error('Error loading tenants:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await tenantApi.create(newTenant);
      setNewTenant({
        tenantId: '',
        tenantName: '',
        isActive: true,
        settings: JSON.stringify({
          currency: 'USD',
          timeZone: 'UTC',
          fiscalYearEnd: '12-31',
          enableERPIntegration: true
        })
      });
      setShowCreateForm(false);
      loadTenants();
    } catch (err) {
      setError('Failed to create tenant');
      console.error('Error creating tenant:', err);
    }
  };

  const toggleTenantStatus = async (tenant: Tenant) => {
    try {
      await tenantApi.update(tenant.tenantId, {
        ...tenant,
        isActive: !tenant.isActive
      });
      loadTenants();
    } catch (err) {
      setError('Failed to update tenant');
      console.error('Error updating tenant:', err);
    }
  };

  if (!currentUser.isAdmin) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Current Tenant</h3>
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
          <h4 className="font-medium text-blue-900">{currentUser.tenantId}</h4>
          <p className="text-sm text-blue-700">You have access to this tenant only</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium text-gray-900">Tenant Management</h3>
          <button
            onClick={() => setShowCreateForm(true)}
            className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Add Tenant
          </button>
        </div>
      </div>

      {error && (
        <div className="px-6 py-4 bg-red-50 border-l-4 border-red-400">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {showCreateForm && (
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <form onSubmit={handleCreateTenant} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Tenant ID</label>
                <input
                  type="text"
                  value={newTenant.tenantId}
                  onChange={(e) => setNewTenant({ ...newTenant, tenantId: e.target.value })}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="e.g., tenant-004"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Tenant Name</label>
                <input
                  type="text"
                  value={newTenant.tenantName}
                  onChange={(e) => setNewTenant({ ...newTenant, tenantName: e.target.value })}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="e.g., Acme Corporation"
                  required
                />
              </div>
            </div>
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-indigo-600 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Create Tenant
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="px-6 py-4">
        <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
          <table className="min-w-full divide-y divide-gray-300">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tenant
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Access
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {tenants.map((tenant) => (
                <tr key={tenant.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{tenant.tenantName}</div>
                      <div className="text-sm text-gray-500">{tenant.tenantId}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      tenant.isActive 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {tenant.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(tenant.createdDate).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {tenant.lastAccessDate 
                      ? new Date(tenant.lastAccessDate).toLocaleDateString()
                      : 'Never'
                    }
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => toggleTenantStatus(tenant)}
                      className={`text-sm ${
                        tenant.isActive 
                          ? 'text-red-600 hover:text-red-900' 
                          : 'text-green-600 hover:text-green-900'
                      }`}
                    >
                      {tenant.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
