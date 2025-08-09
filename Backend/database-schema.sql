-- IFRS16 Service Database Schema
-- SQL Server Database Creation Script

-- Create database (run this first)
-- CREATE DATABASE IFRS16Service;
-- GO

-- USE IFRS16Service;
-- GO

-- Create Tenants table for multi-tenancy
CREATE TABLE Tenants (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    TenantId NVARCHAR(50) NOT NULL UNIQUE,
    TenantName NVARCHAR(255) NOT NULL,
    IsActive BIT NOT NULL DEFAULT 1,
    CreatedDate DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    LastAccessDate DATETIME2 NULL,
    Settings NVARCHAR(MAX) NULL, -- JSON for tenant-specific settings
    
    INDEX IX_Tenants_TenantId (TenantId),
    INDEX IX_Tenants_IsActive (IsActive)
);

-- Create Users table for authentication and authorization
CREATE TABLE Users (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    UserId NVARCHAR(50) NOT NULL UNIQUE,
    Email NVARCHAR(255) NOT NULL UNIQUE,
    FirstName NVARCHAR(100) NOT NULL,
    LastName NVARCHAR(100) NOT NULL,
    TenantId NVARCHAR(50) NULL, -- NULL for admin users
    Role NVARCHAR(50) NOT NULL, -- 'Admin', 'TenantAdmin', 'User'
    IsActive BIT NOT NULL DEFAULT 1,
    CreatedDate DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    LastLoginDate DATETIME2 NULL,
    
    FOREIGN KEY (TenantId) REFERENCES Tenants(TenantId) ON DELETE SET NULL,
    INDEX IX_Users_UserId (UserId),
    INDEX IX_Users_Email (Email),
    INDEX IX_Users_TenantId (TenantId),
    INDEX IX_Users_Role (Role)
);

-- Create Leases table
-- Create Leases table
CREATE TABLE Leases (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    TenantId NVARCHAR(50) NOT NULL, -- Multi-tenant isolation
    LeaseNumber NVARCHAR(50) NOT NULL,
    AssetDescription NVARCHAR(255) NOT NULL,
    CommencementDate DATE NOT NULL,
    EndDate DATE NOT NULL,
    LeasePayment DECIMAL(18,2) NOT NULL,
    PaymentFrequency INT NOT NULL, -- 1=Monthly, 3=Quarterly, 6=SemiAnnually, 12=Annually
    DiscountRate DECIMAL(5,4) NOT NULL,
    InitialRightOfUseAsset DECIMAL(18,2) NOT NULL,
    InitialLeaseLiability DECIMAL(18,2) NOT NULL,
    Currency NVARCHAR(3) NOT NULL DEFAULT 'USD',
    ERPAssetId NVARCHAR(50),
    Status INT NOT NULL DEFAULT 3, -- 0=Active, 1=Terminated, 2=Modified, 3=Draft
    CreatedDate DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    LastCalculationDate DATETIME2 NULL,
    
    FOREIGN KEY (TenantId) REFERENCES Tenants(TenantId) ON DELETE CASCADE,
    UNIQUE (TenantId, LeaseNumber), -- Unique lease number per tenant
    INDEX IX_Leases_TenantId (TenantId),
    INDEX IX_Leases_LeaseNumber (LeaseNumber),
    INDEX IX_Leases_ERPAssetId (ERPAssetId),
    INDEX IX_Leases_Status (Status),
    INDEX IX_Leases_TenantId_Status (TenantId, Status)
);

-- Create LeaseCalculations table
CREATE TABLE LeaseCalculations (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    LeaseId INT NOT NULL,
    PeriodDate DATE NOT NULL,
    BeginningRightOfUseAsset DECIMAL(18,2) NOT NULL,
    BeginningLeaseLiability DECIMAL(18,2) NOT NULL,
    LeasePayment DECIMAL(18,2) NOT NULL,
    InterestExpense DECIMAL(18,2) NOT NULL,
    AmortizationExpense DECIMAL(18,2) NOT NULL,
    EndingRightOfUseAsset DECIMAL(18,2) NOT NULL,
    EndingLeaseLiability DECIMAL(18,2) NOT NULL,
    CalculationDate DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    Status INT NOT NULL DEFAULT 0, -- 0=Draft, 1=Calculated, 2=Posted, 3=Failed
    Notes NVARCHAR(500) NULL,
    IsPostedToERP BIT NOT NULL DEFAULT 0,
    ERPPostingDate DATETIME2 NULL,
    ERPTransactionId NVARCHAR(50) NULL,
    
    FOREIGN KEY (LeaseId) REFERENCES Leases(Id) ON DELETE CASCADE,
    INDEX IX_LeaseCalculations_LeaseId (LeaseId),
    INDEX IX_LeaseCalculations_PeriodDate (PeriodDate),
    INDEX IX_LeaseCalculations_Status (Status),
    INDEX IX_LeaseCalculations_IsPostedToERP (IsPostedToERP)
);

-- Create indexes for better performance
CREATE INDEX IX_LeaseCalculations_LeaseId_PeriodDate ON LeaseCalculations(LeaseId, PeriodDate);
CREATE INDEX IX_LeaseCalculations_Status_IsPostedToERP ON LeaseCalculations(Status, IsPostedToERP);

-- Insert sample tenants
INSERT INTO Tenants (TenantId, TenantName, IsActive, Settings) VALUES 
('tenant-001', 'ABC Corporation', 1, '{"currency":"USD","timeZone":"UTC","fiscalYearEnd":"12-31"}'),
('tenant-002', 'XYZ Industries', 1, '{"currency":"EUR","timeZone":"CET","fiscalYearEnd":"03-31"}'),
('tenant-003', 'Global Enterprises', 1, '{"currency":"USD","timeZone":"PST","fiscalYearEnd":"12-31"}');

-- Insert sample users
INSERT INTO Users (UserId, Email, FirstName, LastName, TenantId, Role, IsActive) VALUES 
-- Admin users (no tenant restriction)
('admin-001', 'admin@ifrs16service.com', 'System', 'Administrator', NULL, 'Admin', 1),
('admin-002', 'support@ifrs16service.com', 'Support', 'Team', NULL, 'Admin', 1),
-- Tenant users
('user-001', 'john.doe@abc-corp.com', 'John', 'Doe', 'tenant-001', 'TenantAdmin', 1),
('user-002', 'jane.smith@abc-corp.com', 'Jane', 'Smith', 'tenant-001', 'User', 1),
('user-003', 'bob.wilson@xyz-industries.com', 'Bob', 'Wilson', 'tenant-002', 'TenantAdmin', 1),
('user-004', 'alice.brown@global-ent.com', 'Alice', 'Brown', 'tenant-003', 'User', 1);

-- Insert sample data for testing
INSERT INTO Leases (
    TenantId, LeaseNumber, AssetDescription, CommencementDate, EndDate, 
    LeasePayment, PaymentFrequency, DiscountRate, 
    InitialRightOfUseAsset, InitialLeaseLiability, 
    Currency, ERPAssetId, Status
) VALUES 
(
    'tenant-001', 'LSE-001', 'Office Building - Floor 5', '2024-01-01', '2026-12-31',
    5000.00, 1, 0.0600, -- Monthly payment, 6% annual rate
    150000.00, 147000.00,
    'USD', 'ASSET-001', 0 -- Active
),
(
    'tenant-001', 'LSE-002', 'Company Vehicle - Toyota Camry', '2024-06-01', '2027-05-31',
    800.00, 1, 0.0500, -- Monthly payment, 5% annual rate
    25000.00, 24500.00,
    'USD', 'ASSET-002', 0 -- Active
),
(
    'tenant-002', 'LSE-001', 'Warehouse Space', '2024-03-01', '2029-02-28',
    12000.00, 3, 0.0650, -- Quarterly payment, 6.5% annual rate
    200000.00, 195000.00,
    'EUR', 'ASSET-003', 3 -- Draft
),
(
    'tenant-003', 'LSE-001', 'Manufacturing Equipment', '2024-04-01', '2027-03-31',
    3500.00, 1, 0.0550, -- Monthly payment, 5.5% annual rate
    120000.00, 118000.00,
    'USD', 'ASSET-004', 0 -- Active
);

GO

-- Create a view for lease summary
CREATE VIEW vw_LeaseSummary AS
SELECT 
    l.Id,
    l.TenantId,
    t.TenantName,
    l.LeaseNumber,
    l.AssetDescription,
    l.CommencementDate,
    l.EndDate,
    l.LeasePayment,
    CASE l.PaymentFrequency
        WHEN 1 THEN 'Monthly'
        WHEN 3 THEN 'Quarterly'
        WHEN 6 THEN 'Semi-Annually'
        WHEN 12 THEN 'Annually'
        ELSE 'Unknown'
    END AS PaymentFrequencyName,
    l.DiscountRate,
    l.InitialRightOfUseAsset,
    l.InitialLeaseLiability,
    l.Currency,
    l.ERPAssetId,
    CASE l.Status
        WHEN 0 THEN 'Active'
        WHEN 1 THEN 'Terminated'
        WHEN 2 THEN 'Modified'
        WHEN 3 THEN 'Draft'
        ELSE 'Unknown'
    END AS StatusName,
    l.CreatedDate,
    l.LastCalculationDate,
    COALESCE(calc_summary.TotalCalculations, 0) AS TotalCalculations,
    COALESCE(calc_summary.PostedCalculations, 0) AS PostedCalculations
FROM Leases l
INNER JOIN Tenants t ON l.TenantId = t.TenantId
LEFT JOIN (
    SELECT 
        LeaseId,
        COUNT(*) AS TotalCalculations,
        SUM(CASE WHEN IsPostedToERP = 1 THEN 1 ELSE 0 END) AS PostedCalculations
    FROM LeaseCalculations
    GROUP BY LeaseId
) calc_summary ON l.Id = calc_summary.LeaseId;

GO

-- Create stored procedure for period-end processing
CREATE PROCEDURE sp_GetActiveLeasesByPeriod
    @PeriodDate DATE,
    @TenantId NVARCHAR(50) = NULL -- NULL for admin access to all tenants
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        l.*,
        t.TenantName
    FROM Leases l
    INNER JOIN Tenants t ON l.TenantId = t.TenantId
    WHERE l.Status = 0 -- Active
        AND l.CommencementDate <= @PeriodDate
        AND l.EndDate >= @PeriodDate
        AND (@TenantId IS NULL OR l.TenantId = @TenantId)
        AND t.IsActive = 1
    ORDER BY l.TenantId, l.LeaseNumber;
END;

GO

-- Create stored procedure for tenant management
CREATE PROCEDURE sp_GetTenantUsers
    @TenantId NVARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        u.*,
        t.TenantName
    FROM Users u
    LEFT JOIN Tenants t ON u.TenantId = t.TenantId
    WHERE u.TenantId = @TenantId OR u.TenantId IS NULL -- Include admin users
    ORDER BY u.Role, u.LastName, u.FirstName;
END;

GO

PRINT 'IFRS16 Service database schema created successfully!';
