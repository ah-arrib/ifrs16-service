import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Building, Calculator, Upload, Activity, Users, Settings, LogOut } from 'lucide-react';
import { LeaseList } from './components/LeaseList';
import { CalculationDashboard } from './components/CalculationDashboard';
import { ERPIntegration } from './components/ERPIntegration';
import { UserLogin } from './components/UserLogin';
import { TenantManagement } from './components/TenantManagement';
import type { UserContext } from './types';
import { authApi } from './services/api';

const queryClient = new QueryClient();

type TabType = 'leases' | 'calculations' | 'erp' | 'dashboard' | 'tenants' | 'users';

function App() {
  const [currentUser, setCurrentUser] = useState<UserContext | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('leases');

  const handleLogin = (user: UserContext) => {
    authApi.setCurrentUser(user);
    setCurrentUser(user);
  };

  const handleLogout = () => {
    authApi.logout();
    setCurrentUser(null);
    setActiveTab('leases');
  };

  if (!currentUser) {
    return <UserLogin onLogin={handleLogin} />;
  }

  const tabs = [
    { id: 'leases' as const, label: 'Leases', icon: Building },
    { id: 'calculations' as const, label: 'Calculations', icon: Calculator },
    { id: 'erp' as const, label: 'ERP Integration', icon: Upload },
    { id: 'dashboard' as const, label: 'Dashboard', icon: Activity },
    ...(currentUser.isAdmin ? [
      { id: 'tenants' as const, label: 'Tenants', icon: Settings },
      { id: 'users' as const, label: 'Users', icon: Users },
    ] : []),
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'leases':
        return <LeaseList currentUser={currentUser} />;
      case 'calculations':
        return <CalculationDashboard currentUser={currentUser} />;
      case 'erp':
        return <ERPIntegration currentUser={currentUser} />;
      case 'dashboard':
        return <CalculationDashboard currentUser={currentUser} />;
      case 'tenants':
        return currentUser.isAdmin ? <TenantManagement currentUser={currentUser} /> : <LeaseList currentUser={currentUser} />;
      case 'users':
        return currentUser.isAdmin ? <div>User Management (Coming Soon)</div> : <LeaseList currentUser={currentUser} />;
      default:
        return <LeaseList currentUser={currentUser} />;
    }
  };

  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div className="flex items-center">
                <Building className="h-8 w-8 text-blue-600 mr-3" />
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">IFRS16 Service</h1>
                  <p className="text-sm text-gray-500">
                    {currentUser.isAdmin ? 'System Administrator' : 
                     currentUser.isTenantAdmin ? `Tenant Admin - ${currentUser.tenantId}` :
                     `User - ${currentUser.tenantId}`}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">{currentUser.fullName}</p>
                  <p className="text-sm text-gray-500">{currentUser.email}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </button>
              </div>
            </div>
          </div>
        </header>

        <nav className="bg-white border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex space-x-8">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center px-3 py-4 text-sm font-medium border-b-2 transition-colors ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="h-4 w-4 mr-2" />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>
        </nav>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {renderContent()}
        </main>
      </div>
    </QueryClientProvider>
  );
}

export default App;
