using Backend.Data;
using Backend.Models;
using Dapper;

namespace Backend.Repositories;

public interface IUserRepository
{
    Task<IEnumerable<User>> GetAllUsersAsync();
    Task<IEnumerable<User>> GetUsersByTenantAsync(string tenantId);
    Task<User?> GetUserByIdAsync(string userId);
    Task<User?> GetUserByEmailAsync(string email);
    Task<User> CreateUserAsync(User user);
    Task<bool> UpdateUserAsync(User user);
    Task<bool> DeleteUserAsync(string userId);
    Task<bool> UpdateLastLoginAsync(string userId);
}

public class UserRepository : IUserRepository
{
    private readonly IDbConnectionFactory _connectionFactory;

    public UserRepository(IDbConnectionFactory connectionFactory)
    {
        _connectionFactory = connectionFactory;
    }

    public async Task<IEnumerable<User>> GetAllUsersAsync()
    {
        using var connection = _connectionFactory.CreateConnection();
        const string sql = @"
            SELECT Id, UserId, Email, FirstName, LastName, TenantId, Role, 
                   IsActive, CreatedDate, LastLoginDate
            FROM Users
            ORDER BY TenantId, LastName, FirstName";
        
        return await connection.QueryAsync<User>(sql);
    }

    public async Task<IEnumerable<User>> GetUsersByTenantAsync(string tenantId)
    {
        using var connection = _connectionFactory.CreateConnection();
        const string sql = @"
            SELECT Id, UserId, Email, FirstName, LastName, TenantId, Role, 
                   IsActive, CreatedDate, LastLoginDate
            FROM Users
            WHERE TenantId = @TenantId OR TenantId IS NULL
            ORDER BY Role, LastName, FirstName";
        
        return await connection.QueryAsync<User>(sql, new { TenantId = tenantId });
    }

    public async Task<User?> GetUserByIdAsync(string userId)
    {
        using var connection = _connectionFactory.CreateConnection();
        const string sql = @"
            SELECT Id, UserId, Email, FirstName, LastName, TenantId, Role, 
                   IsActive, CreatedDate, LastLoginDate
            FROM Users
            WHERE UserId = @UserId";
        
        return await connection.QueryFirstOrDefaultAsync<User>(sql, new { UserId = userId });
    }

    public async Task<User?> GetUserByEmailAsync(string email)
    {
        using var connection = _connectionFactory.CreateConnection();
        const string sql = @"
            SELECT Id, UserId, Email, FirstName, LastName, TenantId, Role, 
                   IsActive, CreatedDate, LastLoginDate
            FROM Users
            WHERE Email = @Email";
        
        return await connection.QueryFirstOrDefaultAsync<User>(sql, new { Email = email });
    }

    public async Task<User> CreateUserAsync(User user)
    {
        using var connection = _connectionFactory.CreateConnection();
        const string sql = @"
            INSERT INTO Users (UserId, Email, FirstName, LastName, TenantId, Role, IsActive, CreatedDate)
            OUTPUT INSERTED.*
            VALUES (@UserId, @Email, @FirstName, @LastName, @TenantId, @Role, @IsActive, @CreatedDate)";
        
        return await connection.QuerySingleAsync<User>(sql, user);
    }

    public async Task<bool> UpdateUserAsync(User user)
    {
        using var connection = _connectionFactory.CreateConnection();
        const string sql = @"
            UPDATE Users
            SET Email = @Email,
                FirstName = @FirstName,
                LastName = @LastName,
                TenantId = @TenantId,
                Role = @Role,
                IsActive = @IsActive
            WHERE UserId = @UserId";
        
        var rowsAffected = await connection.ExecuteAsync(sql, user);
        return rowsAffected > 0;
    }

    public async Task<bool> DeleteUserAsync(string userId)
    {
        using var connection = _connectionFactory.CreateConnection();
        const string sql = "DELETE FROM Users WHERE UserId = @UserId";
        
        var rowsAffected = await connection.ExecuteAsync(sql, new { UserId = userId });
        return rowsAffected > 0;
    }

    public async Task<bool> UpdateLastLoginAsync(string userId)
    {
        using var connection = _connectionFactory.CreateConnection();
        const string sql = @"
            UPDATE Users
            SET LastLoginDate = GETUTCDATE()
            WHERE UserId = @UserId";
        
        var rowsAffected = await connection.ExecuteAsync(sql, new { UserId = userId });
        return rowsAffected > 0;
    }
}
