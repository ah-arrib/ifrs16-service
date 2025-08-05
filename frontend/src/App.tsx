import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Building, Calculator, Upload, Activity } from 'lucide-react';
import { LeaseList } from './components/LeaseList';
import { CalculationDashboard } from './components/CalculationDashboard';
import { ERPIntegration } from './components/ERPIntegration';

const queryClient = new QueryClient();

type TabType = 'leases' | 'calculations' | 'erp' | 'dashboard';

function App() {
  const [activeTab, setActiveTab] = useState<TabType>('leases');

  const tabs = [
    { id: 'leases' as const, label: 'Leases', icon: Building },
    { id: 'calculations' as const, label: 'Calculations', icon: Calculator },
    { id: 'erp' as const, label: 'ERP Integration', icon: Upload },
    { id: 'dashboard' as const, label: 'Dashboard', icon: Activity },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'leases':
        return <LeaseList />;
      case 'calculations':
        return <CalculationDashboard />;
      case 'erp':
        return <ERPIntegration />;
      case 'dashboard':
        return <CalculationDashboard />;
      default:
        return <LeaseList />;
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
                <h1 className="text-2xl font-bold text-gray-900">IFRS16 Service</h1>
              </div>
              <p className="text-sm text-gray-500">Lease Accounting & ERP Integration</p>
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
