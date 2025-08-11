import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  Container,
  Stack,
  Chip
} from '@mui/material';
import {
  Login as LoginIcon,
  Business as BusinessIcon,
  Person as PersonIcon,
  AdminPanelSettings as AdminIcon
} from '@mui/icons-material';
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
    <Box 
      sx={{ 
        minHeight: '100vh',
        bgcolor: 'grey.50',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        py: 6
      }}
    >
      <Container maxWidth="sm">
        {/* Header */}
        <Box textAlign="center" mb={4}>
          <Typography variant="h3" component="h1" fontWeight="bold" gutterBottom>
            IFRS16 Service Demo Login
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Multi-tenant lease accounting system
          </Typography>
        </Box>

        <Card elevation={3}>
          <CardContent sx={{ p: 4 }}>
            <Stack spacing={4}>
              {/* Quick Login Options */}
              <Box>
                <Typography variant="h6" component="h3" gutterBottom>
                  Quick Login
                </Typography>
                <Stack spacing={1}>
                  {demoUsers.map((user) => (
                    <Button
                      key={user.id}
                      variant="outlined"
                      fullWidth
                      onClick={() => handleQuickLogin(user)}
                      sx={{
                        justifyContent: 'space-between',
                        textTransform: 'none',
                        py: 1.5
                      }}
                    >
                      <Box display="flex" alignItems="center">
                        {user.role === UserRole.Admin ? (
                          <AdminIcon sx={{ mr: 1, fontSize: 'small' }} />
                        ) : user.role === UserRole.TenantAdmin ? (
                          <BusinessIcon sx={{ mr: 1, fontSize: 'small' }} />
                        ) : (
                          <PersonIcon sx={{ mr: 1, fontSize: 'small' }} />
                        )}
                        <Typography variant="body2" fontWeight="medium">
                          {user.label}
                        </Typography>
                      </Box>
                      <Chip 
                        label={`${user.role}${user.tenantId ? ` (${user.tenantId})` : ''}`}
                        size="small"
                        variant="outlined"
                      />
                    </Button>
                  ))}
                </Stack>
              </Box>

              <Divider sx={{ my: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Or customize
                </Typography>
              </Divider>

              {/* Custom Login */}
              <Stack spacing={3}>
                <TextField
                  fullWidth
                  label="User ID"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  placeholder="Enter user ID"
                  variant="outlined"
                />

                <FormControl fullWidth>
                  <InputLabel>Role</InputLabel>
                  <Select
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value)}
                    label="Role"
                  >
                    <MenuItem value={UserRole.Admin}>System Admin (All Tenants)</MenuItem>
                    <MenuItem value={UserRole.TenantAdmin}>Tenant Admin</MenuItem>
                    <MenuItem value={UserRole.User}>Regular User</MenuItem>
                  </Select>
                </FormControl>

                {selectedRole !== UserRole.Admin && (
                  <FormControl fullWidth>
                    <InputLabel>Tenant</InputLabel>
                    <Select
                      value={selectedTenant}
                      onChange={(e) => setSelectedTenant(e.target.value)}
                      label="Tenant"
                    >
                      {tenants.map((tenant) => (
                        <MenuItem key={tenant.id} value={tenant.id}>
                          {tenant.name} ({tenant.id})
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}

                <Button
                  fullWidth
                  variant="contained"
                  size="large"
                  onClick={handleCustomLogin}
                  startIcon={<LoginIcon />}
                  sx={{ py: 1.5 }}
                >
                  Login as Custom User
                </Button>
              </Stack>
            </Stack>
          </CardContent>
        </Card>

        <Box textAlign="center" mt={3}>
          <Typography variant="caption" color="text.secondary" display="block">
            This is a demo environment.
          </Typography>
          <Typography variant="caption" color="text.secondary">
            In production, users would authenticate through your identity provider.
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};
