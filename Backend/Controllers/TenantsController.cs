using Microsoft.AspNetCore.Mvc;
using Backend.Models;
using Backend.Repositories;
using Backend.Services;

namespace Backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class TenantsController : ControllerBase
{
    private readonly ITenantRepository _tenantRepository;
    private readonly ITenantContextService _tenantContext;
    private readonly ILogger<TenantsController> _logger;

    public TenantsController(
        ITenantRepository tenantRepository,
        ITenantContextService tenantContext,
        ILogger<TenantsController> logger)
    {
        _tenantRepository = tenantRepository;
        _tenantContext = tenantContext;
        _logger = logger;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<Tenant>>> GetTenants()
    {
        try
        {
            // Only admin users can view all tenants
            if (!_tenantContext.IsAdminUser())
            {
                var currentTenantId = _tenantContext.GetCurrentTenantId();
                if (currentTenantId == null)
                {
                    return Forbid("Access denied");
                }

                var currentTenant = await _tenantRepository.GetTenantByIdAsync(currentTenantId);
                return Ok(currentTenant != null ? new[] { currentTenant } : Array.Empty<Tenant>());
            }

            var tenants = await _tenantRepository.GetAllTenantsAsync();
            return Ok(tenants);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving tenants");
            return StatusCode(500, "Internal server error");
        }
    }

    [HttpGet("{tenantId}")]
    public async Task<ActionResult<Tenant>> GetTenant(string tenantId)
    {
        try
        {
            // Check access permissions
            if (!_tenantContext.CanAccessTenant(tenantId))
            {
                return Forbid("Access denied to tenant data");
            }

            var tenant = await _tenantRepository.GetTenantByIdAsync(tenantId);
            if (tenant == null)
            {
                return NotFound();
            }

            return Ok(tenant);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving tenant {TenantId}", tenantId);
            return StatusCode(500, "Internal server error");
        }
    }

    [HttpPost]
    public async Task<ActionResult<Tenant>> CreateTenant(Tenant tenant)
    {
        try
        {
            // Only admin users can create tenants
            if (!_tenantContext.IsAdminUser())
            {
                return Forbid("Only administrators can create tenants");
            }

            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var createdTenant = await _tenantRepository.CreateTenantAsync(tenant);
            return CreatedAtAction(nameof(GetTenant), new { tenantId = createdTenant.TenantId }, createdTenant);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating tenant");
            return StatusCode(500, "Internal server error");
        }
    }

    [HttpPut("{tenantId}")]
    public async Task<IActionResult> UpdateTenant(string tenantId, Tenant tenant)
    {
        try
        {
            // Only admin users and tenant admins can update tenant info
            if (!_tenantContext.IsAdminUser() && !(_tenantContext.IsTenantAdmin() && _tenantContext.CanAccessTenant(tenantId)))
            {
                return Forbid("Access denied");
            }

            if (tenantId != tenant.TenantId)
            {
                return BadRequest("Tenant ID mismatch");
            }

            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var success = await _tenantRepository.UpdateTenantAsync(tenant);
            if (!success)
            {
                return NotFound();
            }

            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating tenant {TenantId}", tenantId);
            return StatusCode(500, "Internal server error");
        }
    }

    [HttpDelete("{tenantId}")]
    public async Task<IActionResult> DeleteTenant(string tenantId)
    {
        try
        {
            // Only admin users can delete tenants
            if (!_tenantContext.IsAdminUser())
            {
                return Forbid("Only administrators can delete tenants");
            }

            var success = await _tenantRepository.DeleteTenantAsync(tenantId);
            if (!success)
            {
                return NotFound();
            }

            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting tenant {TenantId}", tenantId);
            return StatusCode(500, "Internal server error");
        }
    }

    [HttpPost("{tenantId}/access")]
    public async Task<IActionResult> UpdateTenantAccess(string tenantId)
    {
        try
        {
            if (!_tenantContext.CanAccessTenant(tenantId))
            {
                return Forbid("Access denied to tenant data");
            }

            await _tenantRepository.UpdateLastAccessAsync(tenantId);
            return Ok();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating tenant access for {TenantId}", tenantId);
            return StatusCode(500, "Internal server error");
        }
    }
}
