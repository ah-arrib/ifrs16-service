namespace Backend.Services;

public interface ITenantContextService
{
    string? GetCurrentTenantId();
    string? GetCurrentUserId();
    string? GetCurrentUserRole();
    bool IsAdminUser();
    bool CanAccessTenant(string tenantId);
    void SetCurrentUser(string userId, string? tenantId, string role);
}

public class TenantContextService : ITenantContextService
{
    private readonly IHttpContextAccessor _httpContextAccessor;

    public TenantContextService(IHttpContextAccessor httpContextAccessor)
    {
        _httpContextAccessor = httpContextAccessor;
    }

    public string? GetCurrentTenantId()
    {
        return _httpContextAccessor.HttpContext?.Items["TenantId"] as string;
    }

    public string? GetCurrentUserId()
    {
        return _httpContextAccessor.HttpContext?.Items["UserId"] as string;
    }

    public string? GetCurrentUserRole()
    {
        return _httpContextAccessor.HttpContext?.Items["UserRole"] as string;
    }

    public bool IsAdminUser()
    {
        var tenantId = GetCurrentTenantId();
        var role = GetCurrentUserRole();
        return tenantId == null && role == "Admin";
    }

    public bool CanAccessTenant(string tenantId)
    {
        // Admin users can access any tenant
        if (IsAdminUser())
            return true;

        // Regular users can only access their own tenant
        var currentTenantId = GetCurrentTenantId();
        return currentTenantId != null && currentTenantId == tenantId;
    }

    public void SetCurrentUser(string userId, string? tenantId, string role)
    {
        var context = _httpContextAccessor.HttpContext;
        if (context != null)
        {
            context.Items["UserId"] = userId;
            context.Items["TenantId"] = tenantId;
            context.Items["UserRole"] = role;
        }
    }
}
