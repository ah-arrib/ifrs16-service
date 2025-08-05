import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { leaseApi } from '../services/api';
import type { Lease, PaymentFrequency } from '../types';

interface LeaseFormProps {
  lease?: Lease | null;
  onClose: () => void;
}

export function LeaseForm({ lease, onClose }: LeaseFormProps) {
  const [formData, setFormData] = useState({
    leaseNumber: '',
    assetDescription: '',
    commencementDate: '',
    endDate: '',
    leasePayment: 0,
    paymentFrequency: 1 as PaymentFrequency,
    discountRate: 0.06,
    currency: 'USD',
    erpAssetId: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (lease) {
      setFormData({
        leaseNumber: lease.leaseNumber,
        assetDescription: lease.assetDescription,
        commencementDate: lease.commencementDate.split('T')[0],
        endDate: lease.endDate.split('T')[0],
        leasePayment: lease.leasePayment,
        paymentFrequency: lease.paymentFrequency,
        discountRate: lease.discountRate,
        currency: lease.currency,
        erpAssetId: lease.erpAssetId,
      });
    }
  }, [lease]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      if (lease) {
        await leaseApi.update(lease.id, {
          ...lease,
          ...formData,
        });
      } else {
        await leaseApi.create({
          ...formData,
          initialRightOfUseAsset: 0,
          initialLeaseLiability: 0,
          status: 3, // Draft
        });
      }
      onClose();
    } catch (err) {
      setError('Failed to save lease. Please try again.');
      console.error('Error saving lease:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value,
    }));
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-2/3 lg:w-1/2 shadow-lg rounded-md bg-white">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">
            {lease ? 'Edit Lease' : 'Create New Lease'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Lease Number
              </label>
              <input
                type="text"
                name="leaseNumber"
                value={formData.leaseNumber}
                onChange={handleChange}
                required
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                ERP Asset ID
              </label>
              <input
                type="text"
                name="erpAssetId"
                value={formData.erpAssetId}
                onChange={handleChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Asset Description
            </label>
            <input
              type="text"
              name="assetDescription"
              value={formData.assetDescription}
              onChange={handleChange}
              required
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Commencement Date
              </label>
              <input
                type="date"
                name="commencementDate"
                value={formData.commencementDate}
                onChange={handleChange}
                required
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                End Date
              </label>
              <input
                type="date"
                name="endDate"
                value={formData.endDate}
                onChange={handleChange}
                required
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Lease Payment
              </label>
              <input
                type="number"
                name="leasePayment"
                value={formData.leasePayment}
                onChange={handleChange}
                step="0.01"
                min="0"
                required
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Payment Frequency
              </label>
              <select
                name="paymentFrequency"
                value={formData.paymentFrequency}
                onChange={handleChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              >
                <option value={1}>Monthly</option>
                <option value={3}>Quarterly</option>
                <option value={6}>Semi-Annually</option>
                <option value={12}>Annually</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Discount Rate (%)
              </label>
              <input
                type="number"
                name="discountRate"
                value={formData.discountRate * 100}
                onChange={(e) => handleChange({
                  ...e,
                  target: {
                    ...e.target,
                    value: (parseFloat(e.target.value) / 100).toString(),
                  }
                })}
                step="0.01"
                min="0"
                max="100"
                required
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Currency
            </label>
            <select
              name="currency"
              value={formData.currency}
              onChange={handleChange}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="GBP">GBP</option>
            </select>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : lease ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
