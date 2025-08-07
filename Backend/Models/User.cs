using System.ComponentModel.DataAnnotations;

namespace Backend.Models;

public class User
{
    public int Id { get; set; }
    
    [Required]
    [StringLength(50)]
    public string UserId { get; set; } = string.Empty;
    
    [Required]
    [EmailAddress]
    [StringLength(255)]
    public string Email { get; set; } = string.Empty;
    
    [Required]
    [StringLength(100)]
    public string FirstName { get; set; } = string.Empty;
    
    [Required]
    [StringLength(100)]
    public string LastName { get; set; } = string.Empty;
    
    [StringLength(50)]
    public string? TenantId { get; set; } // NULL for admin users
    
    [Required]
    [StringLength(50)]
    public string Role { get; set; } = string.Empty; // Admin, TenantAdmin, User
    
    public bool IsActive { get; set; } = true;
    
    public DateTime CreatedDate { get; set; } = DateTime.UtcNow;
    
    public DateTime? LastLoginDate { get; set; }
    
    // Navigation properties
    public string FullName => $"{FirstName} {LastName}";
    public bool IsAdminUser => TenantId == null && Role == "Admin";
    public bool IsTenantAdmin => Role == "TenantAdmin";
}

public enum UserRole
{
    Admin = 0,      // System admin - access to all tenants
    TenantAdmin = 1, // Tenant administrator
    User = 2        // Regular tenant user
}

public static class UserRoles
{
    public const string Admin = "Admin";
    public const string TenantAdmin = "TenantAdmin";
    public const string User = "User";
    
    public static readonly string[] All = { Admin, TenantAdmin, User };
}

public class UserContext
{
    public string UserId { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string? TenantId { get; set; }
    public string Role { get; set; } = string.Empty;
    public bool IsAdmin => TenantId == null && Role == UserRoles.Admin;
    public bool IsTenantAdmin => Role == UserRoles.TenantAdmin;
}
