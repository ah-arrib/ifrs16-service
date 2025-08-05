import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus, Edit, Trash2, Calculator } from 'lucide-react';
import { leaseApi } from '../services/api';
import type { Lease } from '../types';
import { LeaseStatusLabels, PaymentFrequencyLabels } from '../types';
import { LeaseForm } from './LeaseForm';

export function LeaseList() {
  const [showForm, setShowForm] = useState(false);
  const [editingLease, setEditingLease] = useState<Lease | null>(null);

  const { data: leases, isLoading, error, refetch } = useQuery({
    queryKey: ['leases'],
    queryFn: leaseApi.getAll,
  });

  const handleEdit = (lease: Lease) => {
    setEditingLease(lease);
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this lease?')) {
      try {
        await leaseApi.delete(id);
        refetch();
      } catch (error) {
        console.error('Error deleting lease:', error);
      }
    }
  };

  const handleCalculate = async (id: number) => {
    try {
      await leaseApi.calculate(id);
      refetch();
    } catch (error) {
      console.error('Error calculating lease:', error);
    }
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingLease(null);
    refetch();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <p className="text-red-600">Error loading leases. Please try again.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Lease Management</h2>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Lease
        </button>
      </div>

      {showForm && (
        <LeaseForm
          lease={editingLease}
          onClose={handleFormClose}
        />
      )}

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {leases?.map((lease) => (
            <li key={lease.id} className="px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-lg font-medium text-gray-900">
                        {lease.leaseNumber}
                      </p>
                      <p className="text-sm text-gray-600">{lease.assetDescription}</p>
                    </div>
                    <div className="flex items-center space-x-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          lease.status === 0
                            ? 'bg-green-100 text-green-800'
                            : lease.status === 3
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {LeaseStatusLabels[lease.status]}
                      </span>
                    </div>
                  </div>
                  
                  <div className="mt-2 grid grid-cols-1 sm:grid-cols-4 gap-4 text-sm text-gray-600">
                    <div>
                      <span className="font-medium">Payment:</span> {formatCurrency(lease.leasePayment)} 
                      <span className="ml-1">({PaymentFrequencyLabels[lease.paymentFrequency]})</span>
                    </div>
                    <div>
                      <span className="font-medium">Term:</span> {formatDate(lease.commencementDate)} - {formatDate(lease.endDate)}
                    </div>
                    <div>
                      <span className="font-medium">ROU Asset:</span> {formatCurrency(lease.initialRightOfUseAsset)}
                    </div>
                    <div>
                      <span className="font-medium">Liability:</span> {formatCurrency(lease.initialLeaseLiability)}
                    </div>
                  </div>
                </div>

                <div className="ml-4 flex items-center space-x-2">
                  <button
                    onClick={() => handleCalculate(lease.id)}
                    className="text-blue-600 hover:text-blue-900 p-2"
                    title="Calculate"
                  >
                    <Calculator className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleEdit(lease)}
                    className="text-gray-600 hover:text-gray-900 p-2"
                    title="Edit"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(lease.id)}
                    className="text-red-600 hover:text-red-900 p-2"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>

        {!leases?.length && (
          <div className="text-center py-12">
            <p className="text-gray-500">No leases found. Create your first lease to get started.</p>
          </div>
        )}
      </div>
    </div>
  );
}
