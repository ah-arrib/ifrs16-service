import React, { useState } from 'react';
import type { UserContext } from '../types';
import { UserRole } from '../types';

interface UserLoginProps {
  onLogin: (user: UserContext) => void;
}

export const UserLogin: React.FC<UserLoginProps> = ({ onLogin }) => {
  const [selectedRole, setSelectedRole] = useState<string>(UserRole.User);
  const [selectedTenant, setSelectedTenant] = useState<string>('tenant-001');
  const [userId, setUserId] = useState<string>('user-demo');

  const demoUsers = [
    { id: 'admin-001', role: UserRole.Admin, tenantId: undefined, label: 'System Admin' },
    { id: 'user-001', role: UserRole.TenantAdmin, tenantId: 'tenant-001', label: 'ABC Corp Admin' },
    { id: 'user-002', role: UserRole.User, tenantId: 'tenant-001', label: 'ABC Corp User' },
    { id: 'user-003', role: UserRole.TenantAdmin, tenantId: 'tenant-002', label: 'XYZ Industries Admin' },
    { id: 'user-004', role: UserRole.User, tenantId: 'tenant-003', label: 'Global Enterprises User' },
  ];

  const tenants = [
    { id: 'tenant-001', name: 'ABC Corporation' },
    { id: 'tenant-002', name: 'XYZ Industries' },
    { id: 'tenant-003', name: 'Global Enterprises' },
  ];

  const handleQuickLogin = (user: typeof demoUsers[0]) => {
    const userContext: UserContext = {
      userId: user.id,
      email: `${user.id}@example.com`,
      fullName: user.label,
      tenantId: user.tenantId,
      role: user.role,
      isAdmin: user.role === UserRole.Admin && !user.tenantId,
      isTenantAdmin: user.role === UserRole.TenantAdmin
    };
    onLogin(userContext);
  };

  const handleCustomLogin = () => {
    const tenantId = selectedRole === UserRole.Admin ? undefined : selectedTenant;
    const userContext: UserContext = {
      userId,
      email: `${userId}@example.com`,
      fullName: `Demo User (${userId})`,
      tenantId,
      role: selectedRole,
      isAdmin: selectedRole === UserRole.Admin && !tenantId,
      isTenantAdmin: selectedRole === UserRole.TenantAdmin
    };
    onLogin(userContext);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          IFRS16 Service Demo Login
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Multi-tenant lease accounting system
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="space-y-6">
            {/* Quick Login Options */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Login</h3>
              <div className="space-y-2">
                {demoUsers.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => handleQuickLogin(user)}
                    className="w-full flex justify-between items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    <span>{user.label}</span>
                    <span className="text-xs text-gray-500">
                      {user.role} {user.tenantId && `(${user.tenantId})`}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Or customize</span>
              </div>
            </div>

            {/* Custom Login */}
            <div className="space-y-4">
              <div>
                <label htmlFor="userId" className="block text-sm font-medium text-gray-700">
                  User ID
                </label>
                <input
                  id="userId"
                  type="text"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="Enter user ID"
                />
              </div>

              <div>
                <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                  Role
                </label>
                <select
                  id="role"
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                >
                  <option value={UserRole.Admin}>System Admin (All Tenants)</option>
                  <option value={UserRole.TenantAdmin}>Tenant Admin</option>
                  <option value={UserRole.User}>Regular User</option>
                </select>
              </div>

              {selectedRole !== UserRole.Admin && (
                <div>
                  <label htmlFor="tenant" className="block text-sm font-medium text-gray-700">
                    Tenant
                  </label>
                  <select
                    id="tenant"
                    value={selectedTenant}
                    onChange={(e) => setSelectedTenant(e.target.value)}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  >
                    {tenants.map((tenant) => (
                      <option key={tenant.id} value={tenant.id}>
                        {tenant.name} ({tenant.id})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <button
                onClick={handleCustomLogin}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Login as Custom User
              </button>
            </div>
          </div>
        </div>

        <div className="mt-6 text-center text-xs text-gray-500">
          <p>This is a demo environment.</p>
          <p>In production, users would authenticate through your identity provider.</p>
        </div>
      </div>
    </div>
  );
};
