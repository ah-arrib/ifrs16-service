import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  FormControl,
  FormControlLabel,
  Switch,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  CircularProgress,
  Alert,
  Stack,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Add as AddIcon,
  ExpandMore as ExpandMoreIcon,
  Settings as SettingsIcon,
  Business as BusinessIcon,
  Api as ApiIcon,
  VpnKey as VpnKeyIcon,
  Fingerprint as FingerprintIcon
} from '@mui/icons-material';
import type { Tenant, UserContext, TenantSettings } from '../types';
import { tenantApi } from '../services/api';

interface TenantManagementProps {
  currentUser: UserContext;
}

export const TenantManagement: React.FC<TenantManagementProps> = ({ currentUser }) => {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  
  const [newTenant, setNewTenant] = useState({
    tenantId: '',
    tenantName: '',
    isActive: true,
    settings: JSON.stringify({
      currency: 'USD',
      timeZone: 'UTC',
      fiscalYearEnd: '12-31',
      enableERPIntegration: true,
      erpBaseUrl: '',
      erpApiKey: '',
      erpSystemId: ''
    })
  });

  const [tenantSettings, setTenantSettings] = useState<TenantSettings>({
    currency: 'USD',
    timeZone: 'UTC',
    fiscalYearEnd: '12-31',
    enableERPIntegration: true,
    erpBaseUrl: '',
    erpApiKey: '',
    erpSystemId: ''
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
          enableERPIntegration: true,
          erpBaseUrl: '',
          erpApiKey: '',
          erpSystemId: ''
        })
      });
      setShowCreateDialog(false);
      loadTenants();
    } catch (err) {
      setError('Failed to create tenant');
      console.error('Error creating tenant:', err);
    }
  };

  const generateNewSystemId = () => {
    const newGuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
    
    setTenantSettings(prev => ({
      ...prev,
      erpSystemId: newGuid
    }));
  };

  const parseSettings = (settingsJson?: string): TenantSettings => {
    if (!settingsJson) {
      return {
        currency: 'USD',
        timeZone: 'UTC',
        fiscalYearEnd: '12-31',
        enableERPIntegration: true,
        erpBaseUrl: '',
        erpApiKey: '',
        erpSystemId: ''
      };
    }
    
    try {
      return JSON.parse(settingsJson);
    } catch {
      return {
        currency: 'USD',
        timeZone: 'UTC',
        fiscalYearEnd: '12-31',
        enableERPIntegration: true,
        erpBaseUrl: '',
        erpApiKey: '',
        erpSystemId: ''
      };
    }
  };

  const handleEditSettings = (tenant: Tenant) => {
    setSelectedTenant(tenant);
    setTenantSettings(parseSettings(tenant.settings));
    setShowSettingsDialog(true);
  };

  const handleSaveSettings = async () => {
    if (!selectedTenant) return;
    
    try {
      const updatedTenant = {
        ...selectedTenant,
        settings: JSON.stringify(tenantSettings)
      };
      
      await tenantApi.update(selectedTenant.tenantId, updatedTenant);
      setShowSettingsDialog(false);
      setSelectedTenant(null);
      loadTenants();
    } catch (err) {
      setError('Failed to update tenant settings');
      console.error('Error updating tenant settings:', err);
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
      <Card>
        <CardContent>
          <Typography variant="h6" component="h3" gutterBottom>
            Current Tenant
          </Typography>
          <Box sx={{ p: 2, bgcolor: 'primary.light', borderRadius: 1 }}>
            <Box display="flex" alignItems="center" mb={1}>
              <BusinessIcon sx={{ mr: 1, color: 'primary.main' }} />
              <Typography variant="h6" fontWeight="bold" color="primary.main">
                {currentUser.tenantId}
              </Typography>
            </Box>
            <Typography variant="body2" color="text.secondary">
              You have access to this tenant only
            </Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card>
        <CardContent>
          <Box display="flex" alignItems="center" justifyContent="center" py={4}>
            <CircularProgress />
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <Box>
      <Card>
        {/* Header */}
        <Box sx={{ p: 3, borderBottom: 1, borderColor: 'divider' }}>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h5" component="h3">
              Tenant Management
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setShowCreateDialog(true)}
            >
              Add Tenant
            </Button>
          </Box>
        </Box>

        {/* Error Message */}
        {error && (
          <Box sx={{ p: 2 }}>
            <Alert severity="error" onClose={() => setError(null)}>
              {error}
            </Alert>
          </Box>
        )}

        {/* Tenants Table */}
        <TableContainer component={Paper} elevation={0}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Tenant</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>ERP Integration</TableCell>
                <TableCell>Created</TableCell>
                <TableCell>Last Access</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {tenants.map((tenant) => {
                const settings = parseSettings(tenant.settings);
                return (
                  <TableRow key={tenant.id} hover>
                    <TableCell>
                      <Box>
                        <Typography variant="body1" fontWeight="medium">
                          {tenant.tenantName}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {tenant.tenantId}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={tenant.isActive ? 'Active' : 'Inactive'}
                        color={tenant.isActive ? 'success' : 'error'}
                        size="small"
                        variant="filled"
                      />
                    </TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center">
                        <ApiIcon sx={{ mr: 1, fontSize: 'small', 
                          color: settings.enableERPIntegration ? 'success.main' : 'grey.400' 
                        }} />
                        <Typography variant="body2" color={settings.enableERPIntegration ? 'success.main' : 'text.secondary'}>
                          {settings.enableERPIntegration ? 'Enabled' : 'Disabled'}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {new Date(tenant.createdDate).toLocaleDateString()}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {tenant.lastAccessDate 
                          ? new Date(tenant.lastAccessDate).toLocaleDateString()
                          : 'Never'
                        }
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Box display="flex" justifyContent="flex-end" gap={1}>
                        <Tooltip title="Edit Settings">
                          <IconButton 
                            size="small" 
                            onClick={() => handleEditSettings(tenant)}
                          >
                            <SettingsIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Button
                          size="small"
                          variant="text"
                          color={tenant.isActive ? 'error' : 'success'}
                          onClick={() => toggleTenantStatus(tenant)}
                        >
                          {tenant.isActive ? 'Deactivate' : 'Activate'}
                        </Button>
                      </Box>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* Create Tenant Dialog */}
      <Dialog open={showCreateDialog} onClose={() => setShowCreateDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Create New Tenant</DialogTitle>
        <form onSubmit={handleCreateTenant}>
          <DialogContent>
            <Box display="flex" gap={3}>
              <TextField
                fullWidth
                label="Tenant ID"
                value={newTenant.tenantId}
                onChange={(e) => setNewTenant({ ...newTenant, tenantId: e.target.value })}
                placeholder="e.g., tenant-004"
                required
              />
              <TextField
                fullWidth
                label="Tenant Name"
                value={newTenant.tenantName}
                onChange={(e) => setNewTenant({ ...newTenant, tenantName: e.target.value })}
                placeholder="e.g., Acme Corporation"
                required
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowCreateDialog(false)}>Cancel</Button>
            <Button type="submit" variant="contained">Create Tenant</Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Settings Dialog */}
      <Dialog open={showSettingsDialog} onClose={() => setShowSettingsDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center">
            <SettingsIcon sx={{ mr: 1 }} />
            Tenant Settings - {selectedTenant?.tenantName}
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Accordion defaultExpanded>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="h6">General Settings</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Box display="flex" gap={3}>
                  <FormControl fullWidth>
                    <InputLabel>Currency</InputLabel>
                    <Select
                      value={tenantSettings.currency}
                      onChange={(e) => setTenantSettings(prev => ({ ...prev, currency: e.target.value }))}
                      label="Currency"
                    >
                      <MenuItem value="USD">USD - US Dollar</MenuItem>
                      <MenuItem value="EUR">EUR - Euro</MenuItem>
                      <MenuItem value="NOK">NOK - Norwegian Krone</MenuItem>
                      <MenuItem value="GBP">GBP - British Pound</MenuItem>
                    </Select>
                  </FormControl>
                  <FormControl fullWidth>
                    <InputLabel>Time Zone</InputLabel>
                    <Select
                      value={tenantSettings.timeZone}
                      onChange={(e) => setTenantSettings(prev => ({ ...prev, timeZone: e.target.value }))}
                      label="Time Zone"
                    >
                      <MenuItem value="UTC">UTC</MenuItem>
                      <MenuItem value="Europe/Oslo">Europe/Oslo</MenuItem>
                      <MenuItem value="America/New_York">America/New_York</MenuItem>
                      <MenuItem value="Europe/London">Europe/London</MenuItem>
                    </Select>
                  </FormControl>
                  <TextField
                    fullWidth
                    label="Fiscal Year End"
                    value={tenantSettings.fiscalYearEnd}
                    onChange={(e) => setTenantSettings(prev => ({ ...prev, fiscalYearEnd: e.target.value }))}
                    placeholder="MM-DD"
                  />
                </Box>
              </AccordionDetails>
            </Accordion>

            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Box display="flex" alignItems="center">
                  <ApiIcon sx={{ mr: 1 }} />
                  <Typography variant="h6">ERP Integration</Typography>
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <Stack spacing={3}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={tenantSettings.enableERPIntegration}
                        onChange={(e) => setTenantSettings(prev => ({ ...prev, enableERPIntegration: e.target.checked }))}
                      />
                    }
                    label="Enable ERP Integration"
                  />
                  
                  {tenantSettings.enableERPIntegration && (
                    <Stack spacing={3}>
                      <TextField
                        fullWidth
                        label="ERP Base URL"
                        value={tenantSettings.erpBaseUrl || ''}
                        onChange={(e) => setTenantSettings(prev => ({ ...prev, erpBaseUrl: e.target.value }))}
                        placeholder="https://api.yourerpystem.com"
                        InputProps={{
                          startAdornment: <ApiIcon sx={{ mr: 1, color: 'action.active' }} />
                        }}
                      />
                      <TextField
                        fullWidth
                        label="ERP API Key"
                        type="password"
                        value={tenantSettings.erpApiKey || ''}
                        onChange={(e) => setTenantSettings(prev => ({ ...prev, erpApiKey: e.target.value }))}
                        placeholder="Enter API key"
                        InputProps={{
                          startAdornment: <VpnKeyIcon sx={{ mr: 1, color: 'action.active' }} />
                        }}
                      />
                      <Box display="flex" gap={2}>
                        <TextField
                          fullWidth
                          label="ERP System ID (GUID)"
                          value={tenantSettings.erpSystemId || ''}
                          onChange={(e) => setTenantSettings(prev => ({ ...prev, erpSystemId: e.target.value }))}
                          placeholder="xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx"
                          InputProps={{
                            startAdornment: <FingerprintIcon sx={{ mr: 1, color: 'action.active' }} />
                          }}
                        />
                        <Button
                          variant="outlined"
                          onClick={generateNewSystemId}
                          sx={{ minWidth: 'auto', px: 2 }}
                        >
                          Generate
                        </Button>
                      </Box>
                    </Stack>
                  )}
                </Stack>
              </AccordionDetails>
            </Accordion>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowSettingsDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveSettings}>Save Settings</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
