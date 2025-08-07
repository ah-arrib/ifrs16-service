using Microsoft.AspNetCore.Mvc;
using Backend.Models;
using Backend.Services;
using Backend.Repositories;

namespace Backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class LeasesController : ControllerBase
    {
        private readonly ILeaseRepository _leaseRepository;
        private readonly IIfrs16CalculationService _calculationService;
        private readonly ILeaseCalculationRepository _calculationRepository;
        private readonly ITenantContextService _tenantContext;
        private readonly ILogger<LeasesController> _logger;
        
        public LeasesController(
            ILeaseRepository leaseRepository,
            IIfrs16CalculationService calculationService,
            ILeaseCalculationRepository calculationRepository,
            ITenantContextService tenantContext,
            ILogger<LeasesController> logger)
        {
            _leaseRepository = leaseRepository;
            _calculationService = calculationService;
            _calculationRepository = calculationRepository;
            _tenantContext = tenantContext;
            _logger = logger;
        }
        
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Lease>>> GetLeases([FromQuery] string? tenantId = null)
        {
            try
            {
                // Check tenant access for non-admin users
                if (!_tenantContext.IsAdminUser() && tenantId != null && !_tenantContext.CanAccessTenant(tenantId))
                {
                    return Forbid("Access denied to tenant data");
                }

                var leases = await _leaseRepository.GetAllAsync(tenantId);
                return Ok(leases);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving leases");
                return StatusCode(500, "Internal server error");
            }
        }
        
        [HttpGet("{id}")]
        public async Task<ActionResult<Lease>> GetLease(int id)
        {
            try
            {
                var lease = await _leaseRepository.GetByIdAsync(id);
                if (lease == null)
                {
                    return NotFound();
                }
                
                return Ok(lease);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving lease {LeaseId}", id);
                return StatusCode(500, "Internal server error");
            }
        }
        
        [HttpPost]
        public async Task<ActionResult<Lease>> CreateLease(Lease lease)
        {
            try
            {
                // Validate lease number uniqueness
                var existing = await _leaseRepository.GetByLeaseNumberAsync(lease.LeaseNumber);
                if (existing != null)
                {
                    return BadRequest("Lease number already exists");
                }
                
                // Calculate initial values
                lease.InitialLeaseLiability = await _calculationService.CalculateInitialLeaseLiabilityAsync(lease);
                lease.InitialRightOfUseAsset = await _calculationService.CalculateInitialRightOfUseAssetAsync(lease);
                lease.CreatedDate = DateTime.UtcNow;
                lease.Status = LeaseStatus.Draft;
                
                var id = await _leaseRepository.CreateAsync(lease);
                lease.Id = id;
                
                _logger.LogInformation("Created lease {LeaseNumber} with ID {LeaseId}", lease.LeaseNumber, id);
                
                return CreatedAtAction(nameof(GetLease), new { id }, lease);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating lease");
                return StatusCode(500, "Internal server error");
            }
        }
        
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateLease(int id, Lease lease)
        {
            try
            {
                if (id != lease.Id)
                {
                    return BadRequest();
                }
                
                var existing = await _leaseRepository.GetByIdAsync(id);
                if (existing == null)
                {
                    return NotFound();
                }
                
                var success = await _leaseRepository.UpdateAsync(lease);
                if (!success)
                {
                    return StatusCode(500, "Failed to update lease");
                }
                
                _logger.LogInformation("Updated lease {LeaseNumber}", lease.LeaseNumber);
                
                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating lease {LeaseId}", id);
                return StatusCode(500, "Internal server error");
            }
        }
        
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteLease(int id)
        {
            try
            {
                var lease = await _leaseRepository.GetByIdAsync(id);
                if (lease == null)
                {
                    return NotFound();
                }
                
                var success = await _leaseRepository.DeleteAsync(id);
                if (!success)
                {
                    return StatusCode(500, "Failed to delete lease");
                }
                
                _logger.LogInformation("Deleted lease {LeaseId}", id);
                
                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting lease {LeaseId}", id);
                return StatusCode(500, "Internal server error");
            }
        }
        
        [HttpPost("{id}/calculate")]
        public async Task<ActionResult<List<LeaseCalculation>>> CalculateLease(int id)
        {
            try
            {
                var lease = await _leaseRepository.GetByIdAsync(id);
                if (lease == null)
                {
                    return NotFound();
                }
                
                var calculations = await _calculationService.CalculateLeaseScheduleAsync(lease);
                
                // Save calculations to database
                foreach (var calculation in calculations)
                {
                    await _calculationRepository.CreateAsync(calculation);
                }
                
                // Update lease status and last calculation date
                lease.Status = LeaseStatus.Active;
                lease.LastCalculationDate = DateTime.UtcNow;
                await _leaseRepository.UpdateAsync(lease);
                
                _logger.LogInformation("Calculated schedule for lease {LeaseNumber}, generated {Count} periods", 
                    lease.LeaseNumber, calculations.Count);
                
                return Ok(calculations);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error calculating lease {LeaseId}", id);
                return StatusCode(500, "Internal server error");
            }
        }
        
        [HttpGet("{id}/calculations")]
        public async Task<ActionResult<IEnumerable<LeaseCalculation>>> GetLeaseCalculations(int id)
        {
            try
            {
                var lease = await _leaseRepository.GetByIdAsync(id);
                if (lease == null)
                {
                    return NotFound();
                }
                
                var calculations = await _calculationRepository.GetByLeaseIdAsync(id);
                return Ok(calculations);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving calculations for lease {LeaseId}", id);
                return StatusCode(500, "Internal server error");
            }
        }
    }
}
