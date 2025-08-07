using Backend.Models;
using Backend.Data;
using Backend.Services;
using Dapper;
using System.Data;

namespace Backend.Repositories
{
    public interface ILeaseRepository
    {
        Task<IEnumerable<Lease>> GetAllAsync(string? tenantId = null);
        Task<Lease?> GetByIdAsync(int id, string? tenantId = null);
        Task<Lease?> GetByLeaseNumberAsync(string leaseNumber, string? tenantId = null);
        Task<int> CreateAsync(Lease lease);
        Task<bool> UpdateAsync(Lease lease);
        Task<bool> DeleteAsync(int id, string? tenantId = null);
        Task<IEnumerable<Lease>> GetActiveLeasesByERPAssetIdAsync(string erpAssetId, string? tenantId = null);
        Task<IEnumerable<Lease>> GetLeasesByTenantAsync(string tenantId);
    }
    
    public class LeaseRepository : ILeaseRepository
    {
        private readonly IDbConnectionFactory _connectionFactory;
        private readonly ITenantContextService _tenantContext;
        
        public LeaseRepository(IDbConnectionFactory connectionFactory, ITenantContextService tenantContext)
        {
            _connectionFactory = connectionFactory;
            _tenantContext = tenantContext;
        }
        
        private string? GetEffectiveTenantId(string? tenantId)
        {
            // Admin users can access all tenants
            if (_tenantContext.IsAdminUser())
                return tenantId;
            
            // Non-admin users can only access their own tenant
            return _tenantContext.GetCurrentTenantId();
        }
        
        public async Task<IEnumerable<Lease>> GetAllAsync(string? tenantId = null)
        {
            using var connection = _connectionFactory.CreateConnection();
            var effectiveTenantId = GetEffectiveTenantId(tenantId);
            
            var sql = @"
                SELECT Id, TenantId, LeaseNumber, AssetDescription, CommencementDate, EndDate, 
                       LeasePayment, PaymentFrequency, DiscountRate, InitialRightOfUseAsset, 
                       InitialLeaseLiability, Currency, ERPAssetId, Status, CreatedDate, LastCalculationDate
                FROM Leases";
            
            if (effectiveTenantId != null)
            {
                sql += " WHERE TenantId = @TenantId";
            }
            
            sql += " ORDER BY CreatedDate DESC";
            
            return await connection.QueryAsync<Lease>(sql, new { TenantId = effectiveTenantId });
        }
        
        public async Task<Lease?> GetByIdAsync(int id, string? tenantId = null)
        {
            using var connection = _connectionFactory.CreateConnection();
            var effectiveTenantId = GetEffectiveTenantId(tenantId);
            
            var sql = @"
                SELECT Id, TenantId, LeaseNumber, AssetDescription, CommencementDate, EndDate, 
                       LeasePayment, PaymentFrequency, DiscountRate, InitialRightOfUseAsset, 
                       InitialLeaseLiability, Currency, ERPAssetId, Status, CreatedDate, LastCalculationDate
                FROM Leases 
                WHERE Id = @Id";
            
            if (effectiveTenantId != null)
            {
                sql += " AND TenantId = @TenantId";
            }
            
            return await connection.QueryFirstOrDefaultAsync<Lease>(sql, new { Id = id, TenantId = effectiveTenantId });
        }
        
        public async Task<Lease?> GetByLeaseNumberAsync(string leaseNumber, string? tenantId = null)
        {
            using var connection = _connectionFactory.CreateConnection();
            var effectiveTenantId = GetEffectiveTenantId(tenantId);
            
            var sql = @"
                SELECT Id, TenantId, LeaseNumber, AssetDescription, CommencementDate, EndDate, 
                       LeasePayment, PaymentFrequency, DiscountRate, InitialRightOfUseAsset, 
                       InitialLeaseLiability, Currency, ERPAssetId, Status, CreatedDate, LastCalculationDate
                FROM Leases 
                WHERE LeaseNumber = @LeaseNumber";
            
            if (effectiveTenantId != null)
            {
                sql += " AND TenantId = @TenantId";
            }
            
            return await connection.QueryFirstOrDefaultAsync<Lease>(sql, new { LeaseNumber = leaseNumber, TenantId = effectiveTenantId });
        }
        
        public async Task<int> CreateAsync(Lease lease)
        {
            using var connection = _connectionFactory.CreateConnection();
            
            // Ensure tenant is set for non-admin users
            if (!_tenantContext.IsAdminUser() && string.IsNullOrEmpty(lease.TenantId))
            {
                lease.TenantId = _tenantContext.GetCurrentTenantId() ?? throw new UnauthorizedAccessException("Tenant ID required");
            }
            
            var sql = @"
                INSERT INTO Leases (TenantId, LeaseNumber, AssetDescription, CommencementDate, EndDate, 
                                  LeasePayment, PaymentFrequency, DiscountRate, InitialRightOfUseAsset, 
                                  InitialLeaseLiability, Currency, ERPAssetId, Status, CreatedDate)
                VALUES (@TenantId, @LeaseNumber, @AssetDescription, @CommencementDate, @EndDate, 
                        @LeasePayment, @PaymentFrequency, @DiscountRate, @InitialRightOfUseAsset, 
                        @InitialLeaseLiability, @Currency, @ERPAssetId, @Status, @CreatedDate);
                SELECT CAST(SCOPE_IDENTITY() as int);";
            
            return await connection.QuerySingleAsync<int>(sql, lease);
        }
        
        public async Task<bool> UpdateAsync(Lease lease)
        {
            using var connection = _connectionFactory.CreateConnection();
            var effectiveTenantId = GetEffectiveTenantId(lease.TenantId);
            
            var sql = @"
                UPDATE Leases 
                SET LeaseNumber = @LeaseNumber, AssetDescription = @AssetDescription, 
                    CommencementDate = @CommencementDate, EndDate = @EndDate, 
                    LeasePayment = @LeasePayment, PaymentFrequency = @PaymentFrequency, 
                    DiscountRate = @DiscountRate, InitialRightOfUseAsset = @InitialRightOfUseAsset, 
                    InitialLeaseLiability = @InitialLeaseLiability, Currency = @Currency, 
                    ERPAssetId = @ERPAssetId, Status = @Status, LastCalculationDate = @LastCalculationDate
                WHERE Id = @Id";
            
            if (effectiveTenantId != null)
            {
                sql += " AND TenantId = @TenantId";
            }
            
            var parameters = new
            {
                lease.Id,
                lease.TenantId,
                lease.LeaseNumber,
                lease.AssetDescription,
                lease.CommencementDate,
                lease.EndDate,
                lease.LeasePayment,
                lease.PaymentFrequency,
                lease.DiscountRate,
                lease.InitialRightOfUseAsset,
                lease.InitialLeaseLiability,
                lease.Currency,
                lease.ERPAssetId,
                lease.Status,
                lease.LastCalculationDate
            };
            
            var rowsAffected = await connection.ExecuteAsync(sql, parameters);
            return rowsAffected > 0;
        }
        
        public async Task<bool> DeleteAsync(int id, string? tenantId = null)
        {
            using var connection = _connectionFactory.CreateConnection();
            var effectiveTenantId = GetEffectiveTenantId(tenantId);
            
            var sql = "DELETE FROM Leases WHERE Id = @Id";
            
            if (effectiveTenantId != null)
            {
                sql += " AND TenantId = @TenantId";
            }
            
            var rowsAffected = await connection.ExecuteAsync(sql, new { Id = id, TenantId = effectiveTenantId });
            return rowsAffected > 0;
        }
        
        public async Task<IEnumerable<Lease>> GetActiveLeasesByERPAssetIdAsync(string erpAssetId, string? tenantId = null)
        {
            using var connection = _connectionFactory.CreateConnection();
            var effectiveTenantId = GetEffectiveTenantId(tenantId);
            
            var sql = @"
                SELECT Id, TenantId, LeaseNumber, AssetDescription, CommencementDate, EndDate, 
                       LeasePayment, PaymentFrequency, DiscountRate, InitialRightOfUseAsset, 
                       InitialLeaseLiability, Currency, ERPAssetId, Status, CreatedDate, LastCalculationDate
                FROM Leases 
                WHERE ERPAssetId = @ERPAssetId AND Status = 0";
            
            if (effectiveTenantId != null)
            {
                sql += " AND TenantId = @TenantId";
            }
            
            return await connection.QueryAsync<Lease>(sql, new { ERPAssetId = erpAssetId, TenantId = effectiveTenantId });
        }
        
        public async Task<IEnumerable<Lease>> GetLeasesByTenantAsync(string tenantId)
        {
            using var connection = _connectionFactory.CreateConnection();
            
            // Only allow access if user is admin or accessing their own tenant
            if (!_tenantContext.IsAdminUser() && !_tenantContext.CanAccessTenant(tenantId))
            {
                throw new UnauthorizedAccessException("Access denied to tenant data");
            }
            
            var sql = @"
                SELECT Id, TenantId, LeaseNumber, AssetDescription, CommencementDate, EndDate, 
                       LeasePayment, PaymentFrequency, DiscountRate, InitialRightOfUseAsset, 
                       InitialLeaseLiability, Currency, ERPAssetId, Status, CreatedDate, LastCalculationDate
                FROM Leases 
                WHERE TenantId = @TenantId
                ORDER BY CreatedDate DESC";
            
            return await connection.QueryAsync<Lease>(sql, new { TenantId = tenantId });
        }
    }
}
