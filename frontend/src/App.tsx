import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@mui/material/styles';
import { 
  CssBaseline, 
  AppBar, 
  Toolbar, 
  Typography, 
  Container, 
  Box, 
  Tabs, 
  Tab, 
  Button, 
  Avatar,
  Menu,
  MenuItem,
  Chip
} from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { 
  Business as BuildingIcon, 
  Calculate as CalculatorIcon, 
  Upload as UploadIcon, 
  Dashboard as ActivityIcon, 
  People as UsersIcon, 
  Settings as SettingsIcon, 
  Logout as LogOutIcon 
} from '@mui/icons-material';
import { theme } from './theme';
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
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleLogin = (user: UserContext) => {
    authApi.setCurrentUser(user);
    setCurrentUser(user);
  };

  const handleLogout = () => {
    authApi.logout();
    setCurrentUser(null);
    setActiveTab('leases');
    setAnchorEl(null);
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: TabType) => {
    setActiveTab(newValue);
  };

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  if (!currentUser) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <UserLogin onLogin={handleLogin} />
        </LocalizationProvider>
      </ThemeProvider>
    );
  }

  const tabs = [
    { id: 'leases' as const, label: 'Leases', icon: <BuildingIcon /> },
    { id: 'calculations' as const, label: 'Calculations', icon: <CalculatorIcon /> },
    { id: 'erp' as const, label: 'ERP Integration', icon: <UploadIcon /> },
    { id: 'dashboard' as const, label: 'Dashboard', icon: <ActivityIcon /> },
    ...(currentUser.isAdmin ? [
      { id: 'tenants' as const, label: 'Tenants', icon: <SettingsIcon /> },
      { id: 'users' as const, label: 'Users', icon: <UsersIcon /> },
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
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
            <AppBar position="sticky" color="default" elevation={1}>
              <Toolbar>
                <BuildingIcon sx={{ mr: 2, color: 'primary.main' }} />
                <Typography variant="h6" component="div" sx={{ flexGrow: 1, color: 'text.primary' }}>
                  IFRS16 Service
                </Typography>
                
                <Chip 
                  label={currentUser.isAdmin ? 'System Admin' : 
                        currentUser.isTenantAdmin ? `Tenant Admin - ${currentUser.tenantId}` :
                        `User - ${currentUser.tenantId}`}
                  size="small"
                  color="primary"
                  variant="outlined"
                  sx={{ mr: 2 }}
                />
                
                <Button
                  onClick={handleMenuClick}
                  sx={{ textTransform: 'none' }}
                >
                  <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main', mr: 1 }}>
                    {currentUser.fullName.charAt(0)}
                  </Avatar>
                  <Box sx={{ textAlign: 'left', display: { xs: 'none', sm: 'block' } }}>
                    <Typography variant="body2" sx={{ color: 'text.primary' }}>
                      {currentUser.fullName}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      {currentUser.email}
                    </Typography>
                  </Box>
                </Button>
                
                <Menu
                  anchorEl={anchorEl}
                  open={Boolean(anchorEl)}
                  onClose={handleMenuClose}
                  anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                  transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                >
                  <MenuItem onClick={handleLogout}>
                    <LogOutIcon sx={{ mr: 1 }} />
                    Logout
                  </MenuItem>
                </Menu>
              </Toolbar>
            </AppBar>

            <Box sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: 'background.paper' }}>
              <Container maxWidth="xl">
                <Tabs 
                  value={activeTab} 
                  onChange={handleTabChange}
                  variant="scrollable"
                  scrollButtons="auto"
                >
                  {tabs.map((tab) => (
                    <Tab 
                      key={tab.id} 
                      value={tab.id}
                      label={tab.label}
                      icon={tab.icon}
                      iconPosition="start"
                      sx={{ textTransform: 'none', minHeight: 64 }}
                    />
                  ))}
                </Tabs>
              </Container>
            </Box>

            <Container maxWidth="xl" sx={{ flex: 1, py: 3 }}>
              {renderContent()}
            </Container>
          </Box>
        </LocalizationProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
