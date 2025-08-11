// Multi-tenant types
export interface Tenant {
  id: number;
  tenantId: string;
  tenantName: string;
  isActive: boolean;
  createdDate: string;
  lastAccessDate?: string;
  settings?: string;
}

export interface TenantSettings {
  currency: string;
  timeZone: string;
  fiscalYearEnd: string;
  enableERPIntegration: boolean;
  erpBaseUrl?: string;
  erpApiKey?: string;
}

export interface User {
  id: number;
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  tenantId?: string;
  role: string;
  isActive: boolean;
  createdDate: string;
  lastLoginDate?: string;
  fullName?: string;
  isAdminUser?: boolean;
  isTenantAdmin?: boolean;
}

export interface UserContext {
  userId: string;
  email: string;
  fullName: string;
  tenantId?: string;
  role: string;
  isAdmin: boolean;
  isTenantAdmin: boolean;
}

export const UserRole = {
  Admin: 'Admin',
  TenantAdmin: 'TenantAdmin',
  User: 'User'
} as const;

export type UserRole = typeof UserRole[keyof typeof UserRole];

// Lease types with multi-tenancy
export interface Lease {
  id: number;
  tenantId: string; // Multi-tenant field
  leaseNumber: string;
  assetDescription: string;
  commencementDate: string;
  endDate: string;
  leasePayment: number;
  paymentFrequency: PaymentFrequency;
  discountRate: number;
  initialRightOfUseAsset: number;
  initialLeaseLiability: number;
  currency: string;
  erpAssetId: string;
  status: LeaseStatus;
  createdDate: string;
  lastCalculationDate?: string;
  calculations?: LeaseCalculation[];
}

export type PaymentFrequency = 1 | 3 | 6 | 12;

export const PaymentFrequencyLabels: Record<PaymentFrequency, string> = {
  1: 'Monthly',
  3: 'Quarterly',
  6: 'Semi-Annually',
  12: 'Annually'
};

export type LeaseStatus = 0 | 1 | 2 | 3;

export const LeaseStatusLabels: Record<LeaseStatus, string> = {
  0: 'Active',
  1: 'Terminated',
  2: 'Modified',
  3: 'Draft'
};

export interface LeaseCalculation {
  id: number;
  leaseId: number;
  periodDate: string;
  beginningRightOfUseAsset: number;
  beginningLeaseLiability: number;
  leasePayment: number;
  interestExpense: number;
  amortizationExpense: number;
  endingRightOfUseAsset: number;
  endingLeaseLiability: number;
  calculationDate: string;
  status: CalculationStatus;
  notes?: string;
  isPostedToERP: boolean;
  erpPostingDate?: string;
  erpTransactionId?: string;
}

export type CalculationStatus = 0 | 1 | 2 | 3;

export const CalculationStatusLabels: Record<CalculationStatus, string> = {
  0: 'Draft',
  1: 'Calculated',
  2: 'Posted',
  3: 'Failed'
};

export interface ERPAsset {
  assetId: string;
  assetNumber: string;
  description: string;
  assetClass: string;
  cost: number;
  acquisitionDate: string;
  location: string;
  department: string;
  costCenter: string;
  status: string;
  lastUpdated: string;
}

export interface ERPTransaction {
  transactionId: string;
  transactionDate: string;
  accountCode: string;
  accountName: string;
  debitAmount: number;
  creditAmount: number;
  description: string;
  reference: string;
  department: string;
  costCenter: string;
  currency: string;
}

export interface CalculationPreview {
  periodDate: string;
  calculations: CalculationPreviewItem[];
  summary: CalculationSummary;
  proposedTransactions: ERPTransaction[];
}

export interface CalculationPreviewItem {
  calculationId: number;
  leaseId: number;
  leaseNumber: string;
  leaseName: string;
  leasePayment: number;
  interestExpense: number;
  amortizationExpense: number;
  beginningRightOfUseAsset: number;
  endingRightOfUseAsset: number;
  beginningLeaseLiability: number;
  endingLeaseLiability: number;
  isPostedToERP: boolean;
  status: CalculationStatus;
}

export interface CalculationSummary {
  totalCalculations: number;
  unpostedCalculations: number;
  totalLeasePayments: number;
  totalInterestExpense: number;
  totalAmortizationExpense: number;
  totalRightOfUseAssets: number;
  totalLeaseLiabilities: number;
}

export interface PeriodEndRequest {
  periodDate: string;
}

export interface PostingRequest {
  calculationIds: number[];
}
