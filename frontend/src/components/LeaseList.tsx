import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Fab,
  Tooltip,
  FormControlLabel,
  Switch,
} from '@mui/material';
import {
  Add as PlusIcon,
  Edit as EditIcon,
  Delete as TrashIcon,
  Calculate as CalculatorIcon,
  History as HistoryIcon,
  Business as BusinessIcon
} from '@mui/icons-material';
import { leaseApi } from '../services/api';
import type { Lease, UserContext } from '../types';
import { LeaseStatusLabels, PaymentFrequencyLabels } from '../types';
import { LeaseForm } from './LeaseForm';
import { CalculationHistory } from './CalculationHistory';

interface LeaseListProps {
  currentUser: UserContext;
}

export function LeaseList({ currentUser }: LeaseListProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingLease, setEditingLease] = useState<Lease | null>(null);
  const [viewingCalculations, setViewingCalculations] = useState<Lease | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [leaseToDelete, setLeaseToDelete] = useState<Lease | null>(null);
  const [showAllTenants, setShowAllTenants] = useState(currentUser.isAdmin);

  const { data: leases, isLoading, error, refetch } = useQuery({
    queryKey: ['leases', currentUser.tenantId, showAllTenants],
    queryFn: () => {
      if (currentUser.isAdmin && showAllTenants) {
        return leaseApi.getAll(undefined, true);
      }
      return leaseApi.getAll(currentUser.tenantId);
    },
  });

  const handleEdit = (lease: Lease) => {
    setEditingLease(lease);
    setShowForm(true);
  };

  const handleDeleteClick = (lease: Lease) => {
    setLeaseToDelete(lease);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (leaseToDelete) {
      try {
        await leaseApi.delete(leaseToDelete.id);
        refetch();
        setDeleteDialogOpen(false);
        setLeaseToDelete(null);
      } catch (error) {
        console.error('Error deleting lease:', error);
      }
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setLeaseToDelete(null);
  };

  const handleCalculate = async (id: number) => {
    try {
      await leaseApi.calculate(id);
      refetch();
    } catch (error) {
      console.error('Error calculating lease:', error);
    }
  };

  const handleViewCalculations = (lease: Lease) => {
    setViewingCalculations(lease);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingLease(null);
    refetch();
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

  // Show calculation history if a lease is selected
  if (viewingCalculations) {
    return (
      <CalculationHistory
        lease={viewingCalculations}
        onBack={() => setViewingCalculations(null)}
      />
    );
  }

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        Error loading leases. Please try again.
      </Alert>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box display="flex" alignItems="center" gap={2}>
          <Typography variant="h4" component="h1">
            Lease Management
          </Typography>
          {currentUser.isAdmin && (
            <FormControlLabel
              control={
                <Switch
                  checked={showAllTenants}
                  onChange={(e) => setShowAllTenants(e.target.checked)}
                  size="small"
                />
              }
              label="Show All Tenants"
            />
          )}
        </Box>
        <Button
          variant="contained"
          startIcon={<PlusIcon />}
          onClick={() => setShowForm(true)}
        >
          New Lease
        </Button>
      </Box>

      {showForm && (
        <LeaseForm
          lease={editingLease}
          currentUser={currentUser}
          onClose={handleFormClose}
        />
      )}

      <TableContainer component={Paper} elevation={2}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Lease Number</TableCell>
              <TableCell>Asset Description</TableCell>
              {currentUser.isAdmin && <TableCell>Tenant</TableCell>}
              <TableCell>Status</TableCell>
              <TableCell align="right">Payment</TableCell>
              <TableCell>Term</TableCell>
              <TableCell align="right">ROU Asset</TableCell>
              <TableCell align="right">Lease Liability</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {leases?.map((lease) => (
              <TableRow key={lease.id} hover>
                <TableCell>
                  <Typography variant="body1" fontWeight="medium">
                    {lease.leaseNumber}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" color="textSecondary">
                    {lease.assetDescription}
                  </Typography>
                </TableCell>
                {currentUser.isAdmin && (
                  <TableCell>
                    <Box display="flex" alignItems="center">
                      <BusinessIcon sx={{ mr: 1, fontSize: 'small', color: 'primary.main' }} />
                      <Box>
                        <Typography variant="body2" fontWeight="medium">
                          {lease.tenantName || lease.tenantId}
                        </Typography>
                        {lease.tenantName && (
                          <Typography variant="caption" color="textSecondary">
                            {lease.tenantId}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  </TableCell>
                )}
                <TableCell>
                  <Chip
                    label={LeaseStatusLabels[lease.status]}
                    color={
                      lease.status === 0 ? 'success' :
                      lease.status === 3 ? 'warning' : 'default'
                    }
                    size="small"
                  />
                </TableCell>
                <TableCell align="right">
                  <Typography variant="body2">
                    {formatCurrency(lease.leasePayment)}
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    ({PaymentFrequencyLabels[lease.paymentFrequency]})
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {formatDate(lease.commencementDate)} - {formatDate(lease.endDate)}
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  <Typography variant="body2">
                    {formatCurrency(lease.initialRightOfUseAsset)}
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  <Typography variant="body2">
                    {formatCurrency(lease.initialLeaseLiability)}
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  <Box display="flex" gap={1}>
                    <Tooltip title="Calculate">
                      <IconButton
                        size="small"
                        onClick={() => handleCalculate(lease.id)}
                        color="primary"
                      >
                        <CalculatorIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="View History">
                      <IconButton
                        size="small"
                        onClick={() => handleViewCalculations(lease)}
                        color="secondary"
                      >
                        <HistoryIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Edit">
                      <IconButton
                        size="small"
                        onClick={() => handleEdit(lease)}
                        color="default"
                      >
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteClick(lease)}
                        color="error"
                      >
                        <TrashIcon />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {!leases?.length && (
          <Box textAlign="center" py={6}>
            <Typography color="textSecondary">
              No leases found. Create your first lease to get started.
            </Typography>
          </Box>
        )}
      </TableContainer>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={handleDeleteCancel}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete lease "{leaseToDelete?.leaseNumber}"? 
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
