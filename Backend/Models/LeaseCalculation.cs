using System.ComponentModel.DataAnnotations;

namespace Backend.Models
{
    public class LeaseCalculation
    {
        public int Id { get; set; }
        
        public int LeaseId { get; set; }
        
        public Lease Lease { get; set; } = null!;
        
        public DateTime PeriodDate { get; set; }
        
        public decimal BeginningRightOfUseAsset { get; set; }
        
        public decimal BeginningLeaseLiability { get; set; }
        
        public decimal LeasePayment { get; set; }
        
        public decimal InterestExpense { get; set; }
        
        public decimal AmortizationExpense { get; set; }
        
        public decimal EndingRightOfUseAsset { get; set; }
        
        public decimal EndingLeaseLiability { get; set; }
        
        public DateTime CalculationDate { get; set; }
        
        public CalculationStatus Status { get; set; }
        
        public string? Notes { get; set; }
        
        public bool IsPostedToERP { get; set; }
        
        public DateTime? ERPPostingDate { get; set; }
        
        public string? ERPTransactionId { get; set; }
    }
    
    public enum CalculationStatus
    {
        Draft,
        Calculated,
        Posted,
        Failed
    }
}
