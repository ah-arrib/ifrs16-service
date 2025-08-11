namespace Backend.Models
{
    public class CalculationPreview
    {
        public DateTime PeriodDate { get; set; }
        public List<CalculationPreviewItem> Calculations { get; set; } = new();
        public CalculationSummary Summary { get; set; } = new();
        public List<ERPTransaction> ProposedTransactions { get; set; } = new();
    }

    public class CalculationPreviewItem
    {
        public int CalculationId { get; set; }
        public int LeaseId { get; set; }
        public string LeaseNumber { get; set; } = string.Empty;
        public string LeaseName { get; set; } = string.Empty;
        public decimal LeasePayment { get; set; }
        public decimal InterestExpense { get; set; }
        public decimal AmortizationExpense { get; set; }
        public decimal BeginningRightOfUseAsset { get; set; }
        public decimal EndingRightOfUseAsset { get; set; }
        public decimal BeginningLeaseLiability { get; set; }
        public decimal EndingLeaseLiability { get; set; }
        public bool IsPostedToERP { get; set; }
        public CalculationStatus Status { get; set; }
    }

    public class CalculationSummary
    {
        public int TotalCalculations { get; set; }
        public int UnpostedCalculations { get; set; }
        public decimal TotalLeasePayments { get; set; }
        public decimal TotalInterestExpense { get; set; }
        public decimal TotalAmortizationExpense { get; set; }
        public decimal TotalRightOfUseAssets { get; set; }
        public decimal TotalLeaseLiabilities { get; set; }
    }
}
