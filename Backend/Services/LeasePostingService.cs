using Backend.Models;
using Backend.Repositories;

namespace Backend.Services
{
    public interface ILeasePostingService
    {
        Task<bool> PostCalculationsToERPAsync(List<int> calculationIds);
        Task<bool> PostPeriodCalculationsAsync(DateTime periodDate);
        Task<ERPPostingRequest> CreatePostingRequestAsync(List<LeaseCalculation> calculations);
        Task<List<ERPTransaction>> CreateTransactionsFromCalculationAsync(LeaseCalculation calculation, Lease lease);
    }
    
    public class LeasePostingService : ILeasePostingService
    {
        private readonly ILeaseCalculationRepository _calculationRepository;
        private readonly ILeaseRepository _leaseRepository;
        private readonly IERPIntegrationService _erpService;
        private readonly ILogger<LeasePostingService> _logger;
        private readonly AccountingConfiguration _accountingConfig;
        
        public LeasePostingService(
            ILeaseCalculationRepository calculationRepository,
            ILeaseRepository leaseRepository,
            IERPIntegrationService erpService,
            ILogger<LeasePostingService> logger,
            AccountingConfiguration accountingConfig)
        {
            _calculationRepository = calculationRepository;
            _leaseRepository = leaseRepository;
            _erpService = erpService;
            _logger = logger;
            _accountingConfig = accountingConfig;
        }
        
        public async Task<bool> PostCalculationsToERPAsync(List<int> calculationIds)
        {
            try
            {
                _logger.LogInformation("Posting {Count} calculations to ERP", calculationIds.Count);
                
                var calculations = new List<LeaseCalculation>();
                foreach (var id in calculationIds)
                {
                    var calculation = await _calculationRepository.GetByIdAsync(id);
                    if (calculation != null)
                    {
                        calculations.Add(calculation);
                    }
                }
                
                if (!calculations.Any())
                {
                    _logger.LogWarning("No valid calculations found for posting");
                    return false;
                }
                
                var postingRequest = await CreatePostingRequestAsync(calculations);
                var response = await _erpService.PostTransactionsAsync(postingRequest);
                
                if (response.Success)
                {
                    // Mark calculations as posted
                    foreach (var calculation in calculations)
                    {
                        await _calculationRepository.MarkAsPostedAsync(calculation.Id, response.BatchId);
                    }
                    
                    _logger.LogInformation("Successfully posted {Count} calculations to ERP", calculations.Count);
                    return true;
                }
                else
                {
                    _logger.LogError("Failed to post calculations to ERP: {Message}", response.Message);
                    return false;
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error posting calculations to ERP");
                return false;
            }
        }
        
        public async Task<bool> PostPeriodCalculationsAsync(DateTime periodDate)
        {
            try
            {
                _logger.LogInformation("Posting period calculations for {PeriodDate} to ERP", periodDate);
                
                var calculations = await _calculationRepository.GetCalculationsForPeriodAsync(periodDate);
                var unpostedCalculations = calculations.Where(c => !c.IsPostedToERP && c.Status == CalculationStatus.Calculated).ToList();
                
                if (!unpostedCalculations.Any())
                {
                    _logger.LogInformation("No unposted calculations found for period {PeriodDate}", periodDate);
                    return true;
                }
                
                var calculationIds = unpostedCalculations.Select(c => c.Id).ToList();
                return await PostCalculationsToERPAsync(calculationIds);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error posting period calculations for {PeriodDate}", periodDate);
                return false;
            }
        }
        
        public async Task<ERPPostingRequest> CreatePostingRequestAsync(List<LeaseCalculation> calculations)
        {
            var allTransactions = new List<ERPTransaction>();
            
            foreach (var calculation in calculations)
            {
                var lease = await _leaseRepository.GetByIdAsync(calculation.LeaseId);
                if (lease != null)
                {
                    var transactions = await CreateTransactionsFromCalculationAsync(calculation, lease);
                    allTransactions.AddRange(transactions);
                }
            }
            
            return new ERPPostingRequest
            {
                Transactions = allTransactions,
                BatchReference = $"IFRS16-{DateTime.UtcNow:yyyyMMdd-HHmmss}",
                PostingDate = calculations.FirstOrDefault()?.PeriodDate ?? DateTime.UtcNow,
                Description = $"IFRS16 Lease Calculations - {calculations.Count} leases"
            };
        }
        
        public async Task<List<ERPTransaction>> CreateTransactionsFromCalculationAsync(LeaseCalculation calculation, Lease lease)
        {
            var transactions = new List<ERPTransaction>();
            var reference = $"{lease.LeaseNumber}-{calculation.PeriodDate:yyyy-MM}";
            
            // Interest Expense Entry
            if (calculation.InterestExpense > 0)
            {
                // Debit: Interest Expense
                transactions.Add(new ERPTransaction
                {
                    TransactionDate = calculation.PeriodDate,
                    AccountCode = _accountingConfig.InterestExpenseAccount,
                    AccountName = "Interest Expense - Leases",
                    DebitAmount = calculation.InterestExpense,
                    CreditAmount = 0,
                    Description = $"Interest expense for lease {lease.LeaseNumber}",
                    Reference = reference,
                    Currency = lease.Currency
                });
                
                // Credit: Lease Liability
                transactions.Add(new ERPTransaction
                {
                    TransactionDate = calculation.PeriodDate,
                    AccountCode = _accountingConfig.LeaseLiabilityAccount,
                    AccountName = "Lease Liability",
                    DebitAmount = 0,
                    CreditAmount = calculation.InterestExpense,
                    Description = $"Increase in lease liability for {lease.LeaseNumber}",
                    Reference = reference,
                    Currency = lease.Currency
                });
            }
            
            // Amortization Expense Entry
            if (calculation.AmortizationExpense > 0)
            {
                // Debit: Amortization Expense
                transactions.Add(new ERPTransaction
                {
                    TransactionDate = calculation.PeriodDate,
                    AccountCode = _accountingConfig.AmortizationExpenseAccount,
                    AccountName = "Amortization Expense - Right of Use Assets",
                    DebitAmount = calculation.AmortizationExpense,
                    CreditAmount = 0,
                    Description = $"Amortization expense for lease {lease.LeaseNumber}",
                    Reference = reference,
                    Currency = lease.Currency
                });
                
                // Credit: Accumulated Amortization
                transactions.Add(new ERPTransaction
                {
                    TransactionDate = calculation.PeriodDate,
                    AccountCode = _accountingConfig.AccumulatedAmortizationAccount,
                    AccountName = "Accumulated Amortization - Right of Use Assets",
                    DebitAmount = 0,
                    CreditAmount = calculation.AmortizationExpense,
                    Description = $"Accumulated amortization for {lease.LeaseNumber}",
                    Reference = reference,
                    Currency = lease.Currency
                });
            }
            
            // Lease Payment Entry
            if (calculation.LeasePayment > 0)
            {
                // Debit: Lease Liability
                transactions.Add(new ERPTransaction
                {
                    TransactionDate = calculation.PeriodDate,
                    AccountCode = _accountingConfig.LeaseLiabilityAccount,
                    AccountName = "Lease Liability",
                    DebitAmount = calculation.LeasePayment,
                    CreditAmount = 0,
                    Description = $"Lease payment for {lease.LeaseNumber}",
                    Reference = reference,
                    Currency = lease.Currency
                });
                
                // Credit: Cash (assuming cash payment)
                transactions.Add(new ERPTransaction
                {
                    TransactionDate = calculation.PeriodDate,
                    AccountCode = _accountingConfig.CashAccount,
                    AccountName = "Cash",
                    DebitAmount = 0,
                    CreditAmount = calculation.LeasePayment,
                    Description = $"Cash payment for lease {lease.LeaseNumber}",
                    Reference = reference,
                    Currency = lease.Currency
                });
            }
            
            return transactions;
        }
    }
    
    public class AccountingConfiguration
    {
        public string RightOfUseAssetAccount { get; set; } = "1600";
        public string AccumulatedAmortizationAccount { get; set; } = "1650";
        public string LeaseLiabilityAccount { get; set; } = "2400";
        public string InterestExpenseAccount { get; set; } = "7200";
        public string AmortizationExpenseAccount { get; set; } = "6200";
        public string CashAccount { get; set; } = "1000";
    }
}
