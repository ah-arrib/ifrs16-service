import { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Paper,
} from '@mui/material';
import {
  CalendarToday as CalendarIcon,
  PlayArrow as PlayIcon,
  Upload as UploadIcon,
  CheckCircle as CheckCircleIcon,
  Visibility as EyeIcon
} from '@mui/icons-material';
import { calculationsApi } from '../services/api';
import type { UserContext, CalculationPreview } from '../types';
import { CalculationPreviewModal } from './CalculationPreviewModal';

interface CalculationDashboardProps {
  currentUser: UserContext;
}

export function CalculationDashboard({ currentUser: _currentUser }: CalculationDashboardProps) {
  // Note: currentUser will be used for tenant-specific calculations in future iterations
  const [periodDate, setPeriodDate] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
  });
  const [isRunning, setIsRunning] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [preview, setPreview] = useState<CalculationPreview | null>(null);
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
    } catch (_error) {
      setMessage({
        type: 'error',
        text: 'Failed to run period-end calculations',
      });
    } finally {
      setIsRunning(false);
    }
  };

  const handlePreviewCalculations = async () => {
    setIsPreviewing(true);
    setMessage(null);

    try {
      const previewData = await calculationsApi.previewPeriod({ periodDate });
      setPreview(previewData);
      
      if (previewData.summary.totalCalculations === 0) {
        setMessage({
          type: 'error',
          text: `No calculations found for ${new Date(periodDate).toLocaleDateString()}. Please run calculations for this period first.`,
        });
      } else {
        setShowPreview(true);
      }
    } catch (_error) {
      setMessage({
        type: 'error',
        text: 'Failed to load calculation preview',
      });
    } finally {
      setIsPreviewing(false);
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
    } catch (_error) {
      setMessage({
        type: 'error',
        text: 'Failed to post calculations to ERP',
      });
    } finally {
      setIsPosting(false);
    }
  };

  const handleConfirmPost = async () => {
    await handlePostToERP();
    setShowPreview(false);
    // Refresh preview data after posting
    if (preview) {
      await handlePreviewCalculations();
    }
  };

  return (
    <Box>
      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Calculation Dashboard
        </Typography>
        
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3 }}>
          {/* Period-end Calculations */}
          <Box sx={{ flex: 1 }}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" mb={2}>
                  <CalendarIcon color="primary" sx={{ mr: 1 }} />
                  <Typography variant="h6">Period-end Calculations</Typography>
                </Box>
                
                <Box display="flex" flexDirection="column" gap={2}>
                  <TextField
                    label="Period Date"
                    type="date"
                    value={periodDate}
                    onChange={(e) => setPeriodDate(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    fullWidth
                    size="small"
                  />
                  
                  <Button
                    variant="contained"
                    startIcon={isRunning ? <CircularProgress size={16} /> : <PlayIcon />}
                    onClick={handleRunCalculations}
                    disabled={isRunning}
                    fullWidth
                  >
                    {isRunning ? 'Running...' : 'Run Calculations'}
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Box>

          {/* ERP Integration */}
          <Box sx={{ flex: 1 }}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" mb={2}>
                  <UploadIcon color="success" sx={{ mr: 1 }} />
                  <Typography variant="h6">ERP Integration</Typography>
                </Box>
                
                <Box display="flex" flexDirection="column" gap={2}>
                  <Typography variant="body2" color="textSecondary">
                    Preview and post calculated entries to the ERP system for the selected period.
                  </Typography>
                  
                  <Alert severity="info" variant="outlined">
                    <Typography variant="body2">
                      💡 <strong>Tip:</strong> Run calculations first, then preview to see what will be posted to ERP.
                    </Typography>
                  </Alert>
                  
                  <Button
                    variant="outlined"
                    startIcon={isPreviewing ? <CircularProgress size={16} /> : <EyeIcon />}
                    onClick={handlePreviewCalculations}
                    disabled={isPreviewing}
                    fullWidth
                  >
                    {isPreviewing ? 'Loading Preview...' : 'Preview Calculations'}
                  </Button>
                  
                  <Button
                    variant="contained"
                    color="success"
                    startIcon={isPosting ? <CircularProgress size={16} /> : <UploadIcon />}
                    onClick={handlePostToERP}
                    disabled={isPosting}
                    fullWidth
                  >
                    {isPosting ? 'Posting...' : 'Post to ERP'}
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Box>
        </Box>

        {/* Status Message */}
        {message && (
          <Alert 
            severity={message.type === 'success' ? 'success' : 'error'} 
            sx={{ mt: 3 }}
            icon={<CheckCircleIcon />}
          >
            {message.text}
          </Alert>
        )}
      </Paper>

      {/* Process Status Cards */}
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3 }}>
        <Box sx={{ flex: 1 }}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <Box 
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: '50%',
                    bgcolor: 'primary.light',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mr: 2
                  }}
                >
                  <CalendarIcon color="primary" />
                </Box>
                <Box>
                  <Typography variant="h6" color="textSecondary">Active Leases</Typography>
                  <Typography variant="h3" color="primary">12</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Box>

        <Box sx={{ flex: 1 }}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <Box 
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: '50%',
                    bgcolor: 'success.light',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mr: 2
                  }}
                >
                  <CheckCircleIcon color="success" />
                </Box>
                <Box>
                  <Typography variant="h6" color="textSecondary">Calculated</Typography>
                  <Typography variant="h3" color="success.main">8</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Box>

        <Box sx={{ flex: 1 }}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <Box 
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: '50%',
                    bgcolor: 'secondary.light',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mr: 2
                  }}
                >
                  <UploadIcon color="secondary" />
                </Box>
                <Box>
                  <Typography variant="h6" color="textSecondary">Posted to ERP</Typography>
                  <Typography variant="h3" color="secondary.main">5</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Box>
      </Box>

      {/* Calculation Preview Modal */}
      {preview && (
        <CalculationPreviewModal
          preview={preview}
          isOpen={showPreview}
          onClose={() => setShowPreview(false)}
          onConfirmPost={handleConfirmPost}
          isPosting={isPosting}
        />
      )}
    </Box>
  );
}
