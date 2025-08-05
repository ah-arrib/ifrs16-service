using Microsoft.AspNetCore.Mvc;
using Backend.Models;
using Backend.Services;

namespace Backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ERPController : ControllerBase
    {
        private readonly IERPIntegrationService _erpService;
        private readonly ILogger<ERPController> _logger;
        
        public ERPController(IERPIntegrationService erpService, ILogger<ERPController> logger)
        {
            _erpService = erpService;
            _logger = logger;
        }
        
        [HttpGet("assets")]
        public async Task<ActionResult<List<ERPAsset>>> GetAssets()
        {
            try
            {
                var assets = await _erpService.GetAssetsAsync();
                return Ok(assets);
            }
            catch (ERPIntegrationException ex)
            {
                _logger.LogError(ex, "ERP integration error getting assets");
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting assets from ERP");
                return StatusCode(500, "Internal server error");
            }
        }
        
        [HttpGet("assets/{assetId}")]
        public async Task<ActionResult<ERPAsset>> GetAsset(string assetId)
        {
            try
            {
                var asset = await _erpService.GetAssetByIdAsync(assetId);
                if (asset == null)
                {
                    return NotFound();
                }
                
                return Ok(asset);
            }
            catch (ERPIntegrationException ex)
            {
                _logger.LogError(ex, "ERP integration error getting asset {AssetId}", assetId);
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting asset {AssetId} from ERP", assetId);
                return StatusCode(500, "Internal server error");
            }
        }
        
        [HttpGet("health")]
        public async Task<ActionResult> TestConnection()
        {
            try
            {
                var isHealthy = await _erpService.TestConnectionAsync();
                if (isHealthy)
                {
                    return Ok(new { status = "healthy", message = "ERP system is accessible" });
                }
                else
                {
                    return ServiceUnavailable(new { status = "unhealthy", message = "ERP system is not accessible" });
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error testing ERP connection");
                return ServiceUnavailable(new { status = "error", message = "Unable to test ERP connection" });
            }
        }
        
        private ActionResult ServiceUnavailable(object value)
        {
            return StatusCode(503, value);
        }
    }
}
