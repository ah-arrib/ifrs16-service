-- IFRS16 Service Database Schema
-- SQL Server Database Creation Script

-- Create database (run this first)
-- CREATE DATABASE IFRS16Service;
-- GO

-- USE IFRS16Service;
-- GO

-- Create Leases table
CREATE TABLE Leases (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    LeaseNumber NVARCHAR(50) NOT NULL UNIQUE,
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
    
    INDEX IX_Leases_LeaseNumber (LeaseNumber),
    INDEX IX_Leases_ERPAssetId (ERPAssetId),
    INDEX IX_Leases_Status (Status)
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

-- Insert sample data for testing
INSERT INTO Leases (
    LeaseNumber, AssetDescription, CommencementDate, EndDate, 
    LeasePayment, PaymentFrequency, DiscountRate, 
    InitialRightOfUseAsset, InitialLeaseLiability, 
    Currency, ERPAssetId, Status
) VALUES 
(
    'LSE-001', 'Office Building - Floor 5', '2024-01-01', '2026-12-31',
    5000.00, 1, 0.0600, -- Monthly payment, 6% annual rate
    150000.00, 147000.00,
    'USD', 'ASSET-001', 0 -- Active
),
(
    'LSE-002', 'Company Vehicle - Toyota Camry', '2024-06-01', '2027-05-31',
    800.00, 1, 0.0500, -- Monthly payment, 5% annual rate
    25000.00, 24500.00,
    'USD', 'ASSET-002', 0 -- Active
),
(
    'LSE-003', 'Warehouse Space', '2024-03-01', '2029-02-28',
    12000.00, 3, 0.0650, -- Quarterly payment, 6.5% annual rate
    200000.00, 195000.00,
    'USD', 'ASSET-003', 3 -- Draft
);

-- Create a view for lease summary
CREATE VIEW vw_LeaseSummary AS
SELECT 
    l.Id,
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
LEFT JOIN (
    SELECT 
        LeaseId,
        COUNT(*) AS TotalCalculations,
        SUM(CASE WHEN IsPostedToERP = 1 THEN 1 ELSE 0 END) AS PostedCalculations
    FROM LeaseCalculations
    GROUP BY LeaseId
) calc_summary ON l.Id = calc_summary.LeaseId;

-- Create stored procedure for period-end processing
CREATE PROCEDURE sp_GetActiveLeasesByPeriod
    @PeriodDate DATE
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        l.*
    FROM Leases l
    WHERE l.Status = 0 -- Active
        AND l.CommencementDate <= @PeriodDate
        AND l.EndDate >= @PeriodDate
    ORDER BY l.LeaseNumber;
END;

PRINT 'IFRS16 Service database schema created successfully!';
