using Backend.Models;
using Backend.Data;
using Dapper;
using System.Data;

namespace Backend.Repositories
{
    public interface ILeaseRepository
    {
        Task<IEnumerable<Lease>> GetAllAsync();
        Task<Lease?> GetByIdAsync(int id);
        Task<Lease?> GetByLeaseNumberAsync(string leaseNumber);
        Task<int> CreateAsync(Lease lease);
        Task<bool> UpdateAsync(Lease lease);
        Task<bool> DeleteAsync(int id);
        Task<IEnumerable<Lease>> GetActiveLeasesByERPAssetIdAsync(string erpAssetId);
    }
    
    public class LeaseRepository : ILeaseRepository
    {
        private readonly IDbConnectionFactory _connectionFactory;
        
        public LeaseRepository(IDbConnectionFactory connectionFactory)
        {
            _connectionFactory = connectionFactory;
        }
        
        public async Task<IEnumerable<Lease>> GetAllAsync()
        {
            using var connection = _connectionFactory.CreateConnection();
            var sql = @"
                SELECT Id, LeaseNumber, AssetDescription, CommencementDate, EndDate, 
                       LeasePayment, PaymentFrequency, DiscountRate, InitialRightOfUseAsset, 
                       InitialLeaseLiability, Currency, ERPAssetId, Status, CreatedDate, LastCalculationDate
                FROM Leases
                ORDER BY CreatedDate DESC";
            
            return await connection.QueryAsync<Lease>(sql);
        }
        
        public async Task<Lease?> GetByIdAsync(int id)
        {
            using var connection = _connectionFactory.CreateConnection();
            var sql = @"
                SELECT Id, LeaseNumber, AssetDescription, CommencementDate, EndDate, 
                       LeasePayment, PaymentFrequency, DiscountRate, InitialRightOfUseAsset, 
                       InitialLeaseLiability, Currency, ERPAssetId, Status, CreatedDate, LastCalculationDate
                FROM Leases 
                WHERE Id = @Id";
            
            return await connection.QueryFirstOrDefaultAsync<Lease>(sql, new { Id = id });
        }
        
        public async Task<Lease?> GetByLeaseNumberAsync(string leaseNumber)
        {
            using var connection = _connectionFactory.CreateConnection();
            var sql = @"
                SELECT Id, LeaseNumber, AssetDescription, CommencementDate, EndDate, 
                       LeasePayment, PaymentFrequency, DiscountRate, InitialRightOfUseAsset, 
                       InitialLeaseLiability, Currency, ERPAssetId, Status, CreatedDate, LastCalculationDate
                FROM Leases 
                WHERE LeaseNumber = @LeaseNumber";
            
            return await connection.QueryFirstOrDefaultAsync<Lease>(sql, new { LeaseNumber = leaseNumber });
        }
        
        public async Task<int> CreateAsync(Lease lease)
        {
            using var connection = _connectionFactory.CreateConnection();
            var sql = @"
                INSERT INTO Leases (LeaseNumber, AssetDescription, CommencementDate, EndDate, 
                                  LeasePayment, PaymentFrequency, DiscountRate, InitialRightOfUseAsset, 
                                  InitialLeaseLiability, Currency, ERPAssetId, Status, CreatedDate)
                VALUES (@LeaseNumber, @AssetDescription, @CommencementDate, @EndDate, 
                        @LeasePayment, @PaymentFrequency, @DiscountRate, @InitialRightOfUseAsset, 
                        @InitialLeaseLiability, @Currency, @ERPAssetId, @Status, @CreatedDate);
                SELECT CAST(SCOPE_IDENTITY() as int);";
            
            return await connection.QuerySingleAsync<int>(sql, lease);
        }
        
        public async Task<bool> UpdateAsync(Lease lease)
        {
            using var connection = _connectionFactory.CreateConnection();
            var sql = @"
                UPDATE Leases 
                SET LeaseNumber = @LeaseNumber, AssetDescription = @AssetDescription, 
                    CommencementDate = @CommencementDate, EndDate = @EndDate, 
                    LeasePayment = @LeasePayment, PaymentFrequency = @PaymentFrequency, 
                    DiscountRate = @DiscountRate, InitialRightOfUseAsset = @InitialRightOfUseAsset, 
                    InitialLeaseLiability = @InitialLeaseLiability, Currency = @Currency, 
                    ERPAssetId = @ERPAssetId, Status = @Status, LastCalculationDate = @LastCalculationDate
                WHERE Id = @Id";
            
            var rowsAffected = await connection.ExecuteAsync(sql, lease);
            return rowsAffected > 0;
        }
        
        public async Task<bool> DeleteAsync(int id)
        {
            using var connection = _connectionFactory.CreateConnection();
            var sql = "DELETE FROM Leases WHERE Id = @Id";
            
            var rowsAffected = await connection.ExecuteAsync(sql, new { Id = id });
            return rowsAffected > 0;
        }
        
        public async Task<IEnumerable<Lease>> GetActiveLeasesByERPAssetIdAsync(string erpAssetId)
        {
            using var connection = _connectionFactory.CreateConnection();
            var sql = @"
                SELECT Id, LeaseNumber, AssetDescription, CommencementDate, EndDate, 
                       LeasePayment, PaymentFrequency, DiscountRate, InitialRightOfUseAsset, 
                       InitialLeaseLiability, Currency, ERPAssetId, Status, CreatedDate, LastCalculationDate
                FROM Leases 
                WHERE ERPAssetId = @ERPAssetId AND Status = @Status";
            
            return await connection.QueryAsync<Lease>(sql, new { ERPAssetId = erpAssetId, Status = LeaseStatus.Active });
        }
    }
}
