# Calculation Preview Feature

## Overview
The calculation preview feature allows users to see lease calculations before they are posted to the ERP system, providing transparency and allowing for review and validation.

## Features

### Backend API
- **New Endpoint**: `POST /api/calculations/preview-period`
- **Request**: `{ "periodDate": "2024-01-01" }`
- **Response**: Detailed calculation preview with summary, individual calculations, and proposed ERP transactions

### Frontend Components
- **Preview Button**: Added to the Calculation Dashboard in the ERP Integration section
- **Preview Modal**: Comprehensive modal showing:
  - Summary statistics (total calculations, unposted count, amounts)
  - Individual calculation details per lease
  - Proposed ERP transactions with account codes and amounts

### Models Added
- `CalculationPreview`: Main preview container
- `CalculationPreviewItem`: Individual calculation details
- `CalculationSummary`: Aggregated statistics

## Usage

1. **Select Period Date**: Choose the period you want to preview calculations for
2. **Click Preview**: Click "Preview Calculations" button to load preview data
3. **Review Data**: Use the tabbed interface to review:
   - **Summary Tab**: High-level statistics and totals
   - **Calculations Tab**: Individual lease calculations with posting status
   - **Transactions Tab**: Detailed ERP transactions that will be posted
4. **Confirm or Cancel**: Either proceed with posting or cancel to make adjustments

## Benefits

- **Transparency**: See exactly what will be posted before it happens
- **Validation**: Review calculations for accuracy before ERP posting
- **Control**: Ability to cancel if adjustments are needed
- **Audit Trail**: Clear view of what transactions will be created

## Technical Implementation

### Backend
- Added `PreviewPeriodCalculationsAsync` method to `LeasePostingService`
- New endpoint in `CalculationsController`
- Reuses existing calculation and transaction generation logic

### Frontend
- New `CalculationPreviewModal` component with tabbed interface
- Updated `CalculationDashboard` with preview functionality
- Enhanced API service with preview method
- TypeScript types for type safety

## Environment Variable Fix
The `.env` file was moved from `frontend/src/` to `frontend/` root directory as required by Vite for environment variables to be properly loaded.
