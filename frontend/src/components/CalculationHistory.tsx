import { useState, useEffect, useCallback } from 'react';
import { Calendar, Eye, TrendingUp, TrendingDown, DollarSign, ArrowLeft, FileText } from 'lucide-react';
import { leaseApi } from '../services/api';
import type { Lease, LeaseCalculation, CalculationStatus } from '../types';

interface CalculationHistoryProps {
  lease: Lease;
  onBack: () => void;
}

export function CalculationHistory({ lease, onBack }: CalculationHistoryProps) {
  const [calculations, setCalculations] = useState<LeaseCalculation[]>([]);
  const [selectedCalculation, setSelectedCalculation] = useState<LeaseCalculation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadCalculations = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await leaseApi.getCalculations(lease.id);
      setCalculations(data);
    } catch (err) {
      setError('Failed to load calculations');
      console.error('Error loading calculations:', err);
    } finally {
      setIsLoading(false);
    }
  }, [lease.id]);

  useEffect(() => {
    loadCalculations();
  }, [loadCalculations]);

  const handleViewCalculation = async (calculationId: number) => {
    try {
      const calculation = await leaseApi.getCalculationDetail(lease.id, calculationId);
      setSelectedCalculation(calculation);
    } catch (err) {
      console.warn('Calculation detail endpoint failed, using list data as fallback');
      // Fallback to using the calculation data we already have from the list
      const calculation = calculations.find(c => c.id === calculationId);
      if (calculation) {
        setSelectedCalculation(calculation);
      } else {
        setError('Failed to load calculation details');
        console.error('Error loading calculation details:', err);
      }
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('nb-NO', {
      style: 'decimal',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusBadge = (status: CalculationStatus, isPosted: boolean) => {
    if (isPosted) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          Posted to ERP
        </span>
      );
    }

    const statusMap = {
      0: { label: 'Draft', color: 'bg-gray-100 text-gray-800' },
      1: { label: 'Calculated', color: 'bg-blue-100 text-blue-800' },
      2: { label: 'Posted', color: 'bg-green-100 text-green-800' },
      3: { label: 'Failed', color: 'bg-red-100 text-red-800' },
    };

    const statusInfo = statusMap[status] || statusMap[0];

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusInfo.color}`}>
        {statusInfo.label}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (selectedCalculation) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => setSelectedCalculation(null)}
            className="flex items-center text-blue-600 hover:text-blue-800"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Calculation List
          </button>
        </div>

        {/* Calculation Detail */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-medium text-gray-900">
              Calculation Detail - {formatDate(selectedCalculation.periodDate)}
            </h3>
            {getStatusBadge(selectedCalculation.status, selectedCalculation.isPostedToERP)}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Beginning Balances */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-gray-700 border-b pb-2">Beginning Balances</h4>
              <div>
                <p className="text-sm text-gray-600">ROU Asset</p>
                <p className="text-lg font-semibold text-gray-900 text-right">
                  {formatCurrency(selectedCalculation.beginningRightOfUseAsset)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Lease Liability</p>
                <p className="text-lg font-semibold text-gray-900 text-right">
                  {formatCurrency(selectedCalculation.beginningLeaseLiability)}
                </p>
              </div>
            </div>

            {/* Period Activity */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-gray-700 border-b pb-2">Period Activity</h4>
              <div>
                <p className="text-sm text-gray-600">Lease Payment</p>
                <p className="text-lg font-semibold text-blue-600 text-right">
                  {formatCurrency(selectedCalculation.leasePayment)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Interest Expense</p>
                <p className="text-lg font-semibold text-red-600 text-right">
                  {formatCurrency(selectedCalculation.interestExpense)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Amortization Expense</p>
                <p className="text-lg font-semibold text-orange-600 text-right">
                  {formatCurrency(selectedCalculation.amortizationExpense)}
                </p>
              </div>
            </div>

            {/* Ending Balances */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-gray-700 border-b pb-2">Ending Balances</h4>
              <div>
                <p className="text-sm text-gray-600">ROU Asset</p>
                <p className="text-lg font-semibold text-gray-900 text-right">
                  {formatCurrency(selectedCalculation.endingRightOfUseAsset)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Lease Liability</p>
                <p className="text-lg font-semibold text-gray-900 text-right">
                  {formatCurrency(selectedCalculation.endingLeaseLiability)}
                </p>
              </div>
            </div>

            {/* Metadata */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-gray-700 border-b pb-2">Details</h4>
              <div>
                <p className="text-sm text-gray-600">Calculation Date</p>
                <p className="text-sm text-gray-900">{formatDate(selectedCalculation.calculationDate)}</p>
              </div>
              {selectedCalculation.erpPostingDate && (
                <div>
                  <p className="text-sm text-gray-600">ERP Posting Date</p>
                  <p className="text-sm text-gray-900">{formatDate(selectedCalculation.erpPostingDate)}</p>
                </div>
              )}
              {selectedCalculation.erpTransactionId && (
                <div>
                  <p className="text-sm text-gray-600">ERP Transaction ID</p>
                  <p className="text-sm text-gray-900">{selectedCalculation.erpTransactionId}</p>
                </div>
              )}
              {selectedCalculation.notes && (
                <div>
                  <p className="text-sm text-gray-600">Notes</p>
                  <p className="text-sm text-gray-900">{selectedCalculation.notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <button
            onClick={onBack}
            className="flex items-center text-blue-600 hover:text-blue-800 mr-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Leases
          </button>
          <h2 className="text-2xl font-bold text-gray-900">
            Calculation History - {lease.leaseNumber}
          </h2>
        </div>
      </div>

      {/* Lease Summary */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Lease Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <p className="text-sm text-gray-600">Asset Description</p>
            <p className="font-medium text-gray-900">{lease.assetDescription}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Lease Term</p>
            <p className="font-medium text-gray-900">
              {formatDate(lease.commencementDate)} - {formatDate(lease.endDate)}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Monthly Payment</p>
            <p className="font-medium text-gray-900 text-right">{formatCurrency(lease.leasePayment)}</p>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Calculations List */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">Calculation History</h3>
            <div className="flex items-center text-sm text-gray-600">
              <Calendar className="h-4 w-4 mr-1" />
              {calculations.length} calculations
            </div>
          </div>
        </div>

        {calculations.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No calculations found for this lease.</p>
            <p className="text-sm text-gray-500 mt-2">
              Run calculations to see the lease schedule here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Period Date
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Lease Payment
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Interest Expense
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amortization
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ROU Asset Balance
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Liability Balance
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {calculations.map((calculation) => (
                  <tr key={calculation.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {formatDate(calculation.periodDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                      <div className="flex items-center justify-end">
                        <DollarSign className="h-4 w-4 text-blue-500 mr-1" />
                        {formatCurrency(calculation.leasePayment)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                      <div className="flex items-center justify-end">
                        <TrendingUp className="h-4 w-4 text-red-500 mr-1" />
                        {formatCurrency(calculation.interestExpense)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                      <div className="flex items-center justify-end">
                        <TrendingDown className="h-4 w-4 text-orange-500 mr-1" />
                        {formatCurrency(calculation.amortizationExpense)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                      {formatCurrency(calculation.endingRightOfUseAsset)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                      {formatCurrency(calculation.endingLeaseLiability)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(calculation.status, calculation.isPostedToERP)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleViewCalculation(calculation.id)}
                        className="text-blue-600 hover:text-blue-900 flex items-center"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
