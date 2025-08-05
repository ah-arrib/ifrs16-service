using System.ComponentModel.DataAnnotations;

namespace Backend.Models
{
    public class Lease
    {
        public int Id { get; set; }
        
        [Required]
        public string LeaseNumber { get; set; } = string.Empty;
        
        [Required]
        public string AssetDescription { get; set; } = string.Empty;
        
        public DateTime CommencementDate { get; set; }
        
        public DateTime EndDate { get; set; }
        
        public decimal LeasePayment { get; set; }
        
        public PaymentFrequency PaymentFrequency { get; set; }
        
        public decimal DiscountRate { get; set; }
        
        public decimal InitialRightOfUseAsset { get; set; }
        
        public decimal InitialLeaseLiability { get; set; }
        
        public string Currency { get; set; } = "USD";
        
        public string ERPAssetId { get; set; } = string.Empty;
        
        public LeaseStatus Status { get; set; }
        
        public DateTime CreatedDate { get; set; }
        
        public DateTime? LastCalculationDate { get; set; }
        
        public List<LeaseCalculation> Calculations { get; set; } = new();
    }
    
    public enum PaymentFrequency
    {
        Monthly = 1,
        Quarterly = 3,
        SemiAnnually = 6,
        Annually = 12
    }
    
    public enum LeaseStatus
    {
        Active,
        Terminated,
        Modified,
        Draft
    }
}
