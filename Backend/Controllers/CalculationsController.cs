using Microsoft.AspNetCore.Mvc;
using Backend.Models;
using Backend.Services;

namespace Backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CalculationsController : ControllerBase
    {
        private readonly IIfrs16CalculationService _calculationService;
        private readonly ILeasePostingService _postingService;
        private readonly ILogger<CalculationsController> _logger;
        
        public CalculationsController(
            IIfrs16CalculationService calculationService,
            ILeasePostingService postingService,
            ILogger<CalculationsController> logger)
        {
            _calculationService = calculationService;
            _postingService = postingService;
            _logger = logger;
        }
        
        [HttpPost("period-end")]
        public async Task<IActionResult> RunPeriodEndCalculations([FromBody] PeriodEndRequest request)
        {
            try
            {
                _logger.LogInformation("Starting period-end calculations for {PeriodDate}", request.PeriodDate);
                
                var success = await _calculationService.RunPeriodEndCalculationsAsync(request.PeriodDate);
                
                if (success)
                {
                    _logger.LogInformation("Period-end calculations completed successfully for {PeriodDate}", request.PeriodDate);
                    return Ok(new { success = true, message = "Period-end calculations completed successfully" });
                }
                else
                {
                    _logger.LogWarning("Period-end calculations completed with some errors for {PeriodDate}", request.PeriodDate);
                    return Ok(new { success = false, message = "Period-end calculations completed with some errors" });
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error running period-end calculations for {PeriodDate}", request.PeriodDate);
                return StatusCode(500, "Internal server error");
            }
        }
        
        [HttpPost("post-to-erp")]
        public async Task<IActionResult> PostCalculationsToERP([FromBody] PostingRequest request)
        {
            try
            {
                _logger.LogInformation("Posting {Count} calculations to ERP", request.CalculationIds.Count);
                
                var success = await _postingService.PostCalculationsToERPAsync(request.CalculationIds);
                
                if (success)
                {
                    return Ok(new { success = true, message = "Calculations posted to ERP successfully" });
                }
                else
                {
                    return BadRequest(new { success = false, message = "Failed to post calculations to ERP" });
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error posting calculations to ERP");
                return StatusCode(500, "Internal server error");
            }
        }
        
        [HttpPost("post-period-to-erp")]
        public async Task<IActionResult> PostPeriodToERP([FromBody] PeriodEndRequest request)
        {
            try
            {
                _logger.LogInformation("Posting period calculations to ERP for {PeriodDate}", request.PeriodDate);
                
                var success = await _postingService.PostPeriodCalculationsAsync(request.PeriodDate);
                
                if (success)
                {
                    return Ok(new { success = true, message = "Period calculations posted to ERP successfully" });
                }
                else
                {
                    return BadRequest(new { success = false, message = "Failed to post period calculations to ERP" });
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error posting period calculations to ERP for {PeriodDate}", request.PeriodDate);
                return StatusCode(500, "Internal server error");
            }
        }
    }
    
    public class PeriodEndRequest
    {
        public DateTime PeriodDate { get; set; }
    }
    
    public class PostingRequest
    {
        public List<int> CalculationIds { get; set; } = new();
    }
}
