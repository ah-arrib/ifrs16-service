using Backend.Models;
using Backend.Data;
using Dapper;
using System.Data;

namespace Backend.Repositories
{
    public interface ILeaseCalculationRepository
    {
        Task<IEnumerable<LeaseCalculation>> GetByLeaseIdAsync(int leaseId);
        Task<LeaseCalculation?> GetByIdAsync(int id);
        Task<int> CreateAsync(LeaseCalculation calculation);
        Task<bool> UpdateAsync(LeaseCalculation calculation);
        Task<bool> DeleteAsync(int id);
        Task<IEnumerable<LeaseCalculation>> GetCalculationsForPeriodAsync(DateTime periodDate);
        Task<IEnumerable<LeaseCalculation>> GetUnpostedCalculationsAsync();
        Task<bool> MarkAsPostedAsync(int calculationId, string erpTransactionId);
    }
    
    public class LeaseCalculationRepository : ILeaseCalculationRepository
    {
        private readonly IDbConnectionFactory _connectionFactory;
        
        public LeaseCalculationRepository(IDbConnectionFactory connectionFactory)
        {
            _connectionFactory = connectionFactory;
        }
        
        public async Task<IEnumerable<LeaseCalculation>> GetByLeaseIdAsync(int leaseId)
        {
            using var connection = _connectionFactory.CreateConnection();
            var sql = @"
                SELECT Id, LeaseId, PeriodDate, BeginningRightOfUseAsset, BeginningLeaseLiability,
                       LeasePayment, InterestExpense, AmortizationExpense, EndingRightOfUseAsset,
                       EndingLeaseLiability, CalculationDate, Status, Notes, IsPostedToERP,
                       ERPPostingDate, ERPTransactionId
                FROM LeaseCalculations 
                WHERE LeaseId = @LeaseId
                ORDER BY PeriodDate";
            
            return await connection.QueryAsync<LeaseCalculation>(sql, new { LeaseId = leaseId });
        }
        
        public async Task<LeaseCalculation?> GetByIdAsync(int id)
        {
            using var connection = _connectionFactory.CreateConnection();
            var sql = @"
                SELECT Id, LeaseId, PeriodDate, BeginningRightOfUseAsset, BeginningLeaseLiability,
                       LeasePayment, InterestExpense, AmortizationExpense, EndingRightOfUseAsset,
                       EndingLeaseLiability, CalculationDate, Status, Notes, IsPostedToERP,
                       ERPPostingDate, ERPTransactionId
                FROM LeaseCalculations 
                WHERE Id = @Id";
            
            return await connection.QueryFirstOrDefaultAsync<LeaseCalculation>(sql, new { Id = id });
        }
        
        public async Task<int> CreateAsync(LeaseCalculation calculation)
        {
            using var connection = _connectionFactory.CreateConnection();
            var sql = @"
                INSERT INTO LeaseCalculations (LeaseId, PeriodDate, BeginningRightOfUseAsset, 
                                             BeginningLeaseLiability, LeasePayment, InterestExpense, 
                                             AmortizationExpense, EndingRightOfUseAsset, EndingLeaseLiability, 
                                             CalculationDate, Status, Notes, IsPostedToERP)
                VALUES (@LeaseId, @PeriodDate, @BeginningRightOfUseAsset, @BeginningLeaseLiability, 
                        @LeasePayment, @InterestExpense, @AmortizationExpense, @EndingRightOfUseAsset, 
                        @EndingLeaseLiability, @CalculationDate, @Status, @Notes, @IsPostedToERP);
                SELECT CAST(SCOPE_IDENTITY() as int);";
            
            return await connection.QuerySingleAsync<int>(sql, calculation);
        }
        
        public async Task<bool> UpdateAsync(LeaseCalculation calculation)
        {
            using var connection = _connectionFactory.CreateConnection();
            var sql = @"
                UPDATE LeaseCalculations 
                SET LeaseId = @LeaseId, PeriodDate = @PeriodDate, 
                    BeginningRightOfUseAsset = @BeginningRightOfUseAsset, 
                    BeginningLeaseLiability = @BeginningLeaseLiability, 
                    LeasePayment = @LeasePayment, InterestExpense = @InterestExpense, 
                    AmortizationExpense = @AmortizationExpense, 
                    EndingRightOfUseAsset = @EndingRightOfUseAsset, 
                    EndingLeaseLiability = @EndingLeaseLiability, 
                    CalculationDate = @CalculationDate, Status = @Status, Notes = @Notes, 
                    IsPostedToERP = @IsPostedToERP, ERPPostingDate = @ERPPostingDate, 
                    ERPTransactionId = @ERPTransactionId
                WHERE Id = @Id";
            
            var rowsAffected = await connection.ExecuteAsync(sql, calculation);
            return rowsAffected > 0;
        }
        
        public async Task<bool> DeleteAsync(int id)
        {
            using var connection = _connectionFactory.CreateConnection();
            var sql = "DELETE FROM LeaseCalculations WHERE Id = @Id";
            
            var rowsAffected = await connection.ExecuteAsync(sql, new { Id = id });
            return rowsAffected > 0;
        }
        
        public async Task<IEnumerable<LeaseCalculation>> GetCalculationsForPeriodAsync(DateTime periodDate)
        {
            using var connection = _connectionFactory.CreateConnection();
            var sql = @"
                SELECT lc.Id, lc.LeaseId, lc.PeriodDate, lc.BeginningRightOfUseAsset, 
                       lc.BeginningLeaseLiability, lc.LeasePayment, lc.InterestExpense, 
                       lc.AmortizationExpense, lc.EndingRightOfUseAsset, lc.EndingLeaseLiability, 
                       lc.CalculationDate, lc.Status, lc.Notes, lc.IsPostedToERP, 
                       lc.ERPPostingDate, lc.ERPTransactionId,
                       l.LeaseNumber, l.AssetDescription
                FROM LeaseCalculations lc
                INNER JOIN Leases l ON lc.LeaseId = l.Id
                WHERE lc.PeriodDate = @PeriodDate
                ORDER BY l.LeaseNumber";
            
            return await connection.QueryAsync<LeaseCalculation>(sql, new { PeriodDate = periodDate });
        }
        
        public async Task<IEnumerable<LeaseCalculation>> GetUnpostedCalculationsAsync()
        {
            using var connection = _connectionFactory.CreateConnection();
            var sql = @"
                SELECT lc.Id, lc.LeaseId, lc.PeriodDate, lc.BeginningRightOfUseAsset, 
                       lc.BeginningLeaseLiability, lc.LeasePayment, lc.InterestExpense, 
                       lc.AmortizationExpense, lc.EndingRightOfUseAsset, lc.EndingLeaseLiability, 
                       lc.CalculationDate, lc.Status, lc.Notes, lc.IsPostedToERP, 
                       lc.ERPPostingDate, lc.ERPTransactionId,
                       l.LeaseNumber, l.AssetDescription
                FROM LeaseCalculations lc
                INNER JOIN Leases l ON lc.LeaseId = l.Id
                WHERE lc.Status = @Status AND lc.IsPostedToERP = 0
                ORDER BY lc.PeriodDate, l.LeaseNumber";
            
            return await connection.QueryAsync<LeaseCalculation>(sql, new { Status = CalculationStatus.Calculated });
        }
        
        public async Task<bool> MarkAsPostedAsync(int calculationId, string erpTransactionId)
        {
            using var connection = _connectionFactory.CreateConnection();
            var sql = @"
                UPDATE LeaseCalculations 
                SET IsPostedToERP = 1, ERPPostingDate = @PostingDate, ERPTransactionId = @ERPTransactionId, Status = @Status
                WHERE Id = @Id";
            
            var rowsAffected = await connection.ExecuteAsync(sql, new 
            { 
                Id = calculationId, 
                PostingDate = DateTime.UtcNow, 
                ERPTransactionId = erpTransactionId,
                Status = CalculationStatus.Posted
            });
            
            return rowsAffected > 0;
        }
    }
}
