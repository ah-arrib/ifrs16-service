using Backend.Data;
using Backend.Models;
using Dapper;

namespace Backend.Repositories;

public interface ITenantRepository
{
    Task<IEnumerable<Tenant>> GetAllTenantsAsync();
    Task<Tenant?> GetTenantByIdAsync(string tenantId);
    Task<Tenant> CreateTenantAsync(Tenant tenant);
    Task<bool> UpdateTenantAsync(Tenant tenant);
    Task<bool> DeleteTenantAsync(string tenantId);
    Task<bool> UpdateLastAccessAsync(string tenantId);
}

public class TenantRepository : ITenantRepository
{
    private readonly IDbConnectionFactory _connectionFactory;

    public TenantRepository(IDbConnectionFactory connectionFactory)
    {
        _connectionFactory = connectionFactory;
    }

    public async Task<IEnumerable<Tenant>> GetAllTenantsAsync()
    {
        using var connection = _connectionFactory.CreateConnection();
        const string sql = @"
            SELECT Id, TenantId, TenantName, IsActive, CreatedDate, LastAccessDate, Settings
            FROM Tenants
            ORDER BY TenantName";
        
        return await connection.QueryAsync<Tenant>(sql);
    }

    public async Task<Tenant?> GetTenantByIdAsync(string tenantId)
    {
        using var connection = _connectionFactory.CreateConnection();
        const string sql = @"
            SELECT Id, TenantId, TenantName, IsActive, CreatedDate, LastAccessDate, Settings
            FROM Tenants
            WHERE TenantId = @TenantId";
        
        return await connection.QueryFirstOrDefaultAsync<Tenant>(sql, new { TenantId = tenantId });
    }

    public async Task<Tenant> CreateTenantAsync(Tenant tenant)
    {
        using var connection = _connectionFactory.CreateConnection();
        const string sql = @"
            INSERT INTO Tenants (TenantId, TenantName, IsActive, CreatedDate, Settings)
            OUTPUT INSERTED.*
            VALUES (@TenantId, @TenantName, @IsActive, @CreatedDate, @Settings)";
        
        return await connection.QuerySingleAsync<Tenant>(sql, tenant);
    }

    public async Task<bool> UpdateTenantAsync(Tenant tenant)
    {
        using var connection = _connectionFactory.CreateConnection();
        const string sql = @"
            UPDATE Tenants
            SET TenantName = @TenantName,
                IsActive = @IsActive,
                Settings = @Settings
            WHERE TenantId = @TenantId";
        
        var rowsAffected = await connection.ExecuteAsync(sql, tenant);
        return rowsAffected > 0;
    }

    public async Task<bool> DeleteTenantAsync(string tenantId)
    {
        using var connection = _connectionFactory.CreateConnection();
        const string sql = "DELETE FROM Tenants WHERE TenantId = @TenantId";
        
        var rowsAffected = await connection.ExecuteAsync(sql, new { TenantId = tenantId });
        return rowsAffected > 0;
    }

    public async Task<bool> UpdateLastAccessAsync(string tenantId)
    {
        using var connection = _connectionFactory.CreateConnection();
        const string sql = @"
            UPDATE Tenants
            SET LastAccessDate = GETUTCDATE()
            WHERE TenantId = @TenantId";
        
        var rowsAffected = await connection.ExecuteAsync(sql, new { TenantId = tenantId });
        return rowsAffected > 0;
    }
}
