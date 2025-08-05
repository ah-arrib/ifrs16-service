namespace Backend.Models
{
    public class ERPAsset
    {
        public string AssetId { get; set; } = string.Empty;
        
        public string AssetNumber { get; set; } = string.Empty;
        
        public string Description { get; set; } = string.Empty;
        
        public string AssetClass { get; set; } = string.Empty;
        
        public decimal Cost { get; set; }
        
        public DateTime AcquisitionDate { get; set; }
        
        public string Location { get; set; } = string.Empty;
        
        public string Department { get; set; } = string.Empty;
        
        public string CostCenter { get; set; } = string.Empty;
        
        public string Status { get; set; } = string.Empty;
        
        public DateTime LastUpdated { get; set; }
    }
    
    public class ERPTransaction
    {
        public string TransactionId { get; set; } = string.Empty;
        
        public DateTime TransactionDate { get; set; }
        
        public string AccountCode { get; set; } = string.Empty;
        
        public string AccountName { get; set; } = string.Empty;
        
        public decimal DebitAmount { get; set; }
        
        public decimal CreditAmount { get; set; }
        
        public string Description { get; set; } = string.Empty;
        
        public string Reference { get; set; } = string.Empty;
        
        public string Department { get; set; } = string.Empty;
        
        public string CostCenter { get; set; } = string.Empty;
        
        public string Currency { get; set; } = "USD";
    }
    
    public class ERPPostingRequest
    {
        public List<ERPTransaction> Transactions { get; set; } = new();
        
        public string BatchReference { get; set; } = string.Empty;
        
        public DateTime PostingDate { get; set; }
        
        public string Description { get; set; } = string.Empty;
    }
    
    public class ERPPostingResponse
    {
        public bool Success { get; set; }
        
        public string BatchId { get; set; } = string.Empty;
        
        public string Message { get; set; } = string.Empty;
        
        public List<string> Errors { get; set; } = new();
    }
}
