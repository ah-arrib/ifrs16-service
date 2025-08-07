using System.ComponentModel.DataAnnotations;

namespace Backend.Models;

public class Tenant
{
    public int Id { get; set; }
    
    [Required]
    [StringLength(50)]
    public string TenantId { get; set; } = string.Empty;
    
    [Required]
    [StringLength(255)]
    public string TenantName { get; set; } = string.Empty;
    
    public bool IsActive { get; set; } = true;
    
    public DateTime CreatedDate { get; set; } = DateTime.UtcNow;
    
    public DateTime? LastAccessDate { get; set; }
    
    public string? Settings { get; set; } // JSON settings
}

public class TenantSettings
{
    public string Currency { get; set; } = "USD";
    public string TimeZone { get; set; } = "UTC";
    public string FiscalYearEnd { get; set; } = "12-31";
    public bool EnableERPIntegration { get; set; } = true;
    public string? ERPBaseUrl { get; set; }
    public string? ERPApiKey { get; set; }
}
