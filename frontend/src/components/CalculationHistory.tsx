import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Visibility as VisibilityIcon,
  CalendarToday as CalendarIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  AccountBalance as AccountBalanceIcon,
  Description as DescriptionIcon
} from '@mui/icons-material';
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
        <Chip
          label="Posted to ERP"
          size="small"
          color="success"
          variant="filled"
        />
      );
    }

    const statusMap = {
      0: { label: 'Draft', color: 'default' as const },
      1: { label: 'Calculated', color: 'primary' as const },
      2: { label: 'Posted', color: 'success' as const },
      3: { label: 'Failed', color: 'error' as const },
    };

    const statusInfo = statusMap[status] || statusMap[0];

    return (
      <Chip
        label={statusInfo.label}
        size="small"
        color={statusInfo.color}
        variant="filled"
      />
    );
  };

  if (isLoading) {
    return (
      <Box display="flex" alignItems="center" justifyContent="center" height="16rem">
        <CircularProgress />
      </Box>
    );
  }

  if (selectedCalculation) {
    return (
      <Box sx={{ spacing: 3 }}>
        {/* Header */}
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
          <Button
            variant="text"
            startIcon={<ArrowBackIcon />}
            onClick={() => setSelectedCalculation(null)}
            sx={{ color: 'primary.main' }}
          >
            Back to Calculation List
          </Button>
        </Box>

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
      </Box>
    );
  }

  return (
    <Box sx={{ spacing: 3 }}>
      {/* Header */}
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
        <Box display="flex" alignItems="center">
          <Button
            variant="text"
            startIcon={<ArrowBackIcon />}
            onClick={onBack}
            sx={{ color: 'primary.main', mr: 2 }}
          >
            Back to Leases
          </Button>
          <Typography variant="h4" component="h2">
            Calculation History - {lease.leaseNumber}
          </Typography>
        </Box>
      </Box>

      {/* Lease Summary */}
      <Card>
        <CardContent>
          <Typography variant="h6" component="h3" gutterBottom>
            Lease Summary
          </Typography>
          <Box display="flex" flexDirection={{ xs: 'column', md: 'row' }} gap={3}>
            <Box flex={1}>
              <Typography variant="body2" color="text.secondary">
                Asset Description
              </Typography>
              <Typography variant="body1" fontWeight="medium">
                {lease.assetDescription}
              </Typography>
            </Box>
            <Box flex={1}>
              <Typography variant="body2" color="text.secondary">
                Lease Term
              </Typography>
              <Typography variant="body1" fontWeight="medium">
                {formatDate(lease.commencementDate)} - {formatDate(lease.endDate)}
              </Typography>
            </Box>
            <Box flex={1}>
              <Typography variant="body2" color="text.secondary">
                Monthly Payment
              </Typography>
              <Typography variant="body1" fontWeight="medium" textAlign="right">
                {formatCurrency(lease.leasePayment)}
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Error Message */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Calculations List */}
      <Card>
        <CardContent>
          <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
            <Typography variant="h6" component="h3">
              Calculation History
            </Typography>
            <Box display="flex" alignItems="center">
              <CalendarIcon sx={{ mr: 1, fontSize: 'small' }} />
              <Typography variant="body2" color="text.secondary">
                {calculations.length} calculations
              </Typography>
            </Box>
          </Box>

        {calculations.length === 0 ? (
          <Box textAlign="center" py={6}>
            <DescriptionIcon sx={{ fontSize: 48, color: 'grey.400', mb: 2 }} />
            <Typography variant="body1" color="text.secondary" gutterBottom>
              No calculations found for this lease.
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Run calculations to see the lease schedule here.
            </Typography>
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Period Date</TableCell>
                  <TableCell align="right">Lease Payment</TableCell>
                  <TableCell align="right">Interest Expense</TableCell>
                  <TableCell align="right">Amortization</TableCell>
                  <TableCell align="right">ROU Asset Balance</TableCell>
                  <TableCell align="right">Liability Balance</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {calculations.map((calculation) => (
                  <TableRow key={calculation.id} hover>
                    <TableCell>
                      {formatDate(calculation.periodDate)}
                    </TableCell>
                    <TableCell align="right">
                      <Box display="flex" alignItems="center" justifyContent="flex-end">
                        <AccountBalanceIcon sx={{ fontSize: 'small', color: 'primary.main', mr: 0.5 }} />
                        {formatCurrency(calculation.leasePayment)}
                      </Box>
                    </TableCell>
                    <TableCell align="right">
                      <Box display="flex" alignItems="center" justifyContent="flex-end">
                        <TrendingUpIcon sx={{ fontSize: 'small', color: 'error.main', mr: 0.5 }} />
                        {formatCurrency(calculation.interestExpense)}
                      </Box>
                    </TableCell>
                    <TableCell align="right">
                      <Box display="flex" alignItems="center" justifyContent="flex-end">
                        <TrendingDownIcon sx={{ fontSize: 'small', color: 'warning.main', mr: 0.5 }} />
                        {formatCurrency(calculation.amortizationExpense)}
                      </Box>
                    </TableCell>
                    <TableCell align="right">
                      {formatCurrency(calculation.endingRightOfUseAsset)}
                    </TableCell>
                    <TableCell align="right">
                      {formatCurrency(calculation.endingLeaseLiability)}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(calculation.status, calculation.isPostedToERP)}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="text"
                        size="small"
                        onClick={() => handleViewCalculation(calculation.id)}
                        startIcon={<VisibilityIcon />}
                      >
                        View Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
        </CardContent>
      </Card>
    </Box>
  );
}
