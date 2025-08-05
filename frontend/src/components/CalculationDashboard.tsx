import { useState } from 'react';
import { Calendar, Play, Upload, CheckCircle } from 'lucide-react';
import { calculationsApi } from '../services/api';

export function CalculationDashboard() {
  const [periodDate, setPeriodDate] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
  });
  const [isRunning, setIsRunning] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleRunCalculations = async () => {
    setIsRunning(true);
    setMessage(null);

    try {
      const result = await calculationsApi.runPeriodEnd({ periodDate });
      setMessage({
        type: result.success ? 'success' : 'error',
        text: result.message,
      });
    } catch (error) {
      setMessage({
        type: 'error',
        text: 'Failed to run period-end calculations',
      });
    } finally {
      setIsRunning(false);
    }
  };

  const handlePostToERP = async () => {
    setIsPosting(true);
    setMessage(null);

    try {
      const result = await calculationsApi.postPeriodToERP({ periodDate });
      setMessage({
        type: result.success ? 'success' : 'error',
        text: result.message,
      });
    } catch (error) {
      setMessage({
        type: 'error',
        text: 'Failed to post calculations to ERP',
      });
    } finally {
      setIsPosting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Calculation Dashboard</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Period-end Calculations */}
          <div className="border border-gray-200 rounded-lg p-6">
            <div className="flex items-center mb-4">
              <Calendar className="h-6 w-6 text-blue-600 mr-2" />
              <h3 className="text-lg font-medium text-gray-900">Period-end Calculations</h3>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Period Date
                </label>
                <input
                  type="date"
                  value={periodDate}
                  onChange={(e) => setPeriodDate(e.target.value)}
                  className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <button
                onClick={handleRunCalculations}
                disabled={isRunning}
                className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                <Play className="h-4 w-4 mr-2" />
                {isRunning ? 'Running...' : 'Run Calculations'}
              </button>
            </div>
          </div>

          {/* ERP Integration */}
          <div className="border border-gray-200 rounded-lg p-6">
            <div className="flex items-center mb-4">
              <Upload className="h-6 w-6 text-green-600 mr-2" />
              <h3 className="text-lg font-medium text-gray-900">ERP Integration</h3>
            </div>
            
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Post calculated entries to the ERP system for the selected period.
              </p>
              
              <button
                onClick={handlePostToERP}
                disabled={isPosting}
                className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
              >
                <Upload className="h-4 w-4 mr-2" />
                {isPosting ? 'Posting...' : 'Post to ERP'}
              </button>
            </div>
          </div>
        </div>

        {/* Status Message */}
        {message && (
          <div className={`mt-6 p-4 rounded-md ${
            message.type === 'success' 
              ? 'bg-green-50 border border-green-200' 
              : 'bg-red-50 border border-red-200'
          }`}>
            <div className="flex items-center">
              <CheckCircle className={`h-5 w-5 mr-2 ${
                message.type === 'success' ? 'text-green-600' : 'text-red-600'
              }`} />
              <p className={`text-sm font-medium ${
                message.type === 'success' ? 'text-green-800' : 'text-red-800'
              }`}>
                {message.text}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Process Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <Calendar className="h-5 w-5 text-blue-600" />
              </div>
            </div>
            <div className="ml-4">
              <h4 className="text-lg font-medium text-gray-900">Active Leases</h4>
              <p className="text-2xl font-bold text-blue-600">12</p>
            </div>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
            </div>
            <div className="ml-4">
              <h4 className="text-lg font-medium text-gray-900">Calculated</h4>
              <p className="text-2xl font-bold text-green-600">8</p>
            </div>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                <Upload className="h-5 w-5 text-purple-600" />
              </div>
            </div>
            <div className="ml-4">
              <h4 className="text-lg font-medium text-gray-900">Posted to ERP</h4>
              <p className="text-2xl font-bold text-purple-600">5</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
