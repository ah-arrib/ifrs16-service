using Backend.Models;
using Backend.Repositories;

namespace Backend.Services
{
    public interface IIfrs16CalculationService
    {
        Task<List<LeaseCalculation>> CalculateLeaseScheduleAsync(Lease lease);
        Task<LeaseCalculation> CalculatePeriodAsync(Lease lease, DateTime periodDate, decimal beginningROU, decimal beginningLiability);
        Task<bool> RunPeriodEndCalculationsAsync(DateTime periodEndDate);
        Task<decimal> CalculateInitialRightOfUseAssetAsync(Lease lease);
        Task<decimal> CalculateInitialLeaseLiabilityAsync(Lease lease);
        Task<decimal> CalculateNetPresentValueAsync(decimal payment, int periods, decimal discountRate, PaymentFrequency frequency);
    }
    
    public class Ifrs16CalculationService : IIfrs16CalculationService
    {
        private readonly ILeaseRepository _leaseRepository;
        private readonly ILeaseCalculationRepository _calculationRepository;
        private readonly ILogger<Ifrs16CalculationService> _logger;
        
        public Ifrs16CalculationService(
            ILeaseRepository leaseRepository,
            ILeaseCalculationRepository calculationRepository,
            ILogger<Ifrs16CalculationService> logger)
        {
            _leaseRepository = leaseRepository;
            _calculationRepository = calculationRepository;
            _logger = logger;
        }
        
        public async Task<List<LeaseCalculation>> CalculateLeaseScheduleAsync(Lease lease)
        {
            try
            {
                _logger.LogInformation("Starting calculation for lease {LeaseNumber}", lease.LeaseNumber);
                
                var calculations = new List<LeaseCalculation>();
                var currentDate = lease.CommencementDate;
                var beginningROU = lease.InitialRightOfUseAsset;
                var beginningLiability = lease.InitialLeaseLiability;
                
                // Calculate monthly periods based on payment frequency
                var monthsIncrement = 12 / (int)lease.PaymentFrequency;
                
                while (currentDate <= lease.EndDate)
                {
                    var calculation = await CalculatePeriodAsync(lease, currentDate, beginningROU, beginningLiability);
                    calculations.Add(calculation);
                    
                    // Set next period's beginning balances
                    beginningROU = calculation.EndingRightOfUseAsset;
                    beginningLiability = calculation.EndingLeaseLiability;
                    
                    // Move to next period
                    currentDate = currentDate.AddMonths(monthsIncrement);
                }
                
                _logger.LogInformation("Completed calculation for lease {LeaseNumber}. Generated {Count} periods", 
                    lease.LeaseNumber, calculations.Count);
                
                return calculations;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error calculating lease schedule for {LeaseNumber}", lease.LeaseNumber);
                throw;
            }
        }
        
        public async Task<LeaseCalculation> CalculatePeriodAsync(Lease lease, DateTime periodDate, decimal beginningROU, decimal beginningLiability)
        {
            // Calculate interest expense on lease liability
            var periodicRate = lease.DiscountRate / (int)lease.PaymentFrequency;
            var interestExpense = beginningLiability * periodicRate;
            
            // Calculate total lease payment
            var leasePayment = lease.LeasePayment;
            
            // Calculate amortization expense (straight-line)
            var totalPeriods = CalculateTotalPeriods(lease);
            var amortizationExpense = lease.InitialRightOfUseAsset / totalPeriods;
            
            // Calculate ending balances
            var endingLiability = beginningLiability + interestExpense - leasePayment;
            var endingROU = beginningROU - amortizationExpense;
            
            // Ensure ending balances don't go negative
            endingLiability = Math.Max(0, endingLiability);
            endingROU = Math.Max(0, endingROU);
            
            var calculation = new LeaseCalculation
            {
                LeaseId = lease.Id,
                PeriodDate = periodDate,
                BeginningRightOfUseAsset = beginningROU,
                BeginningLeaseLiability = beginningLiability,
                LeasePayment = leasePayment,
                InterestExpense = interestExpense,
                AmortizationExpense = amortizationExpense,
                EndingRightOfUseAsset = endingROU,
                EndingLeaseLiability = endingLiability,
                CalculationDate = DateTime.UtcNow,
                Status = CalculationStatus.Calculated,
                IsPostedToERP = false
            };
            
            return calculation;
        }
        
        public async Task<bool> RunPeriodEndCalculationsAsync(DateTime periodEndDate)
        {
            try
            {
                _logger.LogInformation("Starting period-end calculations for {PeriodEndDate}", periodEndDate);
                
                var activeLeases = await _leaseRepository.GetAllAsync();
                var activeLeasesForPeriod = activeLeases.Where(l => 
                    l.Status == LeaseStatus.Active && 
                    l.CommencementDate <= periodEndDate && 
                    l.EndDate >= periodEndDate).ToList();
                
                var successfulCalculations = 0;
                
                foreach (var lease in activeLeasesForPeriod)
                {
                    try
                    {
                        // Get the latest calculation for this lease to get beginning balances
                        var existingCalculations = await _calculationRepository.GetByLeaseIdAsync(lease.Id);
                        var latestCalculation = existingCalculations
                            .Where(c => c.PeriodDate < periodEndDate)
                            .OrderByDescending(c => c.PeriodDate)
                            .FirstOrDefault();
                        
                        var beginningROU = latestCalculation?.EndingRightOfUseAsset ?? lease.InitialRightOfUseAsset;
                        var beginningLiability = latestCalculation?.EndingLeaseLiability ?? lease.InitialLeaseLiability;
                        
                        var calculation = await CalculatePeriodAsync(lease, periodEndDate, beginningROU, beginningLiability);
                        await _calculationRepository.CreateAsync(calculation);
                        
                        // Update lease's last calculation date
                        lease.LastCalculationDate = DateTime.UtcNow;
                        await _leaseRepository.UpdateAsync(lease);
                        
                        successfulCalculations++;
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "Error calculating period for lease {LeaseNumber}", lease.LeaseNumber);
                    }
                }
                
                _logger.LogInformation("Completed period-end calculations. Processed {Successful} out of {Total} leases", 
                    successfulCalculations, activeLeasesForPeriod.Count);
                
                return successfulCalculations == activeLeasesForPeriod.Count;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error running period-end calculations for {PeriodEndDate}", periodEndDate);
                return false;
            }
        }
        
        public async Task<decimal> CalculateInitialRightOfUseAssetAsync(Lease lease)
        {
            // Initial ROU Asset = Initial Lease Liability + Prepaid Lease Payments + Initial Direct Costs
            // For simplicity, we're using the lease liability as the base
            var initialLiability = await CalculateInitialLeaseLiabilityAsync(lease);
            return initialLiability;
        }
        
        public async Task<decimal> CalculateInitialLeaseLiabilityAsync(Lease lease)
        {
            var totalPeriods = CalculateTotalPeriods(lease);
            return await CalculateNetPresentValueAsync(lease.LeasePayment, totalPeriods, lease.DiscountRate, lease.PaymentFrequency);
        }
        
        public async Task<decimal> CalculateNetPresentValueAsync(decimal payment, int periods, decimal annualRate, PaymentFrequency frequency)
        {
            var periodicRate = annualRate / (int)frequency;
            var npv = 0m;
            
            for (int period = 1; period <= periods; period++)
            {
                npv += payment / (decimal)Math.Pow((double)(1 + periodicRate), period);
            }
            
            return npv;
        }
        
        private int CalculateTotalPeriods(Lease lease)
        {
            var months = (lease.EndDate.Year - lease.CommencementDate.Year) * 12 + 
                        lease.EndDate.Month - lease.CommencementDate.Month;
            return months / (12 / (int)lease.PaymentFrequency);
        }
    }
}
