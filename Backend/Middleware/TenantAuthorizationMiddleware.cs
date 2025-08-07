using Backend.Services;

namespace Backend.Middleware;

public class TenantAuthorizationMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<TenantAuthorizationMiddleware> _logger;

    public TenantAuthorizationMiddleware(RequestDelegate next, ILogger<TenantAuthorizationMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context, ITenantContextService tenantContext)
    {
        // For demo purposes, we'll simulate authentication by reading headers
        // In production, you would integrate with your authentication system (JWT, OAuth, etc.)
        
        var userId = context.Request.Headers["X-User-Id"].FirstOrDefault();
        var tenantId = context.Request.Headers["X-Tenant-Id"].FirstOrDefault();
        var userRole = context.Request.Headers["X-User-Role"].FirstOrDefault();

        if (!string.IsNullOrEmpty(userId))
        {
            tenantContext.SetCurrentUser(userId, tenantId, userRole ?? "User");
            
            _logger.LogInformation("User {UserId} with role {Role} accessing tenant {TenantId}", 
                userId, userRole, tenantId ?? "ALL");
        }
        else
        {
            // For demo - allow anonymous access for testing
            // In production, you would redirect to login or return 401
            _logger.LogWarning("No authentication headers found - allowing anonymous access for demo");
        }

        await _next(context);
    }
}

public static class TenantAuthorizationMiddlewareExtensions
{
    public static IApplicationBuilder UseTenantAuthorization(this IApplicationBuilder builder)
    {
        return builder.UseMiddleware<TenantAuthorizationMiddleware>();
    }
}
