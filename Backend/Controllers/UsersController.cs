using Microsoft.AspNetCore.Mvc;
using Backend.Models;
using Backend.Repositories;
using Backend.Services;

namespace Backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class UsersController : ControllerBase
{
    private readonly IUserRepository _userRepository;
    private readonly ITenantContextService _tenantContext;
    private readonly ILogger<UsersController> _logger;

    public UsersController(
        IUserRepository userRepository,
        ITenantContextService tenantContext,
        ILogger<UsersController> logger)
    {
        _userRepository = userRepository;
        _tenantContext = tenantContext;
        _logger = logger;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<User>>> GetUsers([FromQuery] string? tenantId = null)
    {
        try
        {
            if (_tenantContext.IsAdminUser())
            {
                // Admin users can see all users or filter by tenant
                var users = tenantId != null 
                    ? await _userRepository.GetUsersByTenantAsync(tenantId)
                    : await _userRepository.GetAllUsersAsync();
                return Ok(users);
            }
            else
            {
                // Non-admin users can only see users in their tenant
                var currentTenantId = _tenantContext.GetCurrentTenantId();
                if (currentTenantId == null)
                {
                    return Forbid("Access denied");
                }

                var users = await _userRepository.GetUsersByTenantAsync(currentTenantId);
                return Ok(users);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving users");
            return StatusCode(500, "Internal server error");
        }
    }

    [HttpGet("{userId}")]
    public async Task<ActionResult<User>> GetUser(string userId)
    {
        try
        {
            var user = await _userRepository.GetUserByIdAsync(userId);
            if (user == null)
            {
                return NotFound();
            }

            // Check access permissions
            if (!_tenantContext.IsAdminUser() && user.TenantId != _tenantContext.GetCurrentTenantId())
            {
                return Forbid("Access denied to user data");
            }

            return Ok(user);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving user {UserId}", userId);
            return StatusCode(500, "Internal server error");
        }
    }

    [HttpPost]
    public async Task<ActionResult<User>> CreateUser(User user)
    {
        try
        {
            // Only admin users and tenant admins can create users
            if (!_tenantContext.IsAdminUser() && !_tenantContext.IsTenantAdmin())
            {
                return Forbid("Insufficient permissions to create users");
            }

            // Non-admin users can only create users in their own tenant
            if (!_tenantContext.IsAdminUser())
            {
                var currentTenantId = _tenantContext.GetCurrentTenantId();
                if (user.TenantId != currentTenantId)
                {
                    return Forbid("Cannot create users for other tenants");
                }
            }

            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var createdUser = await _userRepository.CreateUserAsync(user);
            return CreatedAtAction(nameof(GetUser), new { userId = createdUser.UserId }, createdUser);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating user");
            return StatusCode(500, "Internal server error");
        }
    }

    [HttpPut("{userId}")]
    public async Task<IActionResult> UpdateUser(string userId, User user)
    {
        try
        {
            if (userId != user.UserId)
            {
                return BadRequest("User ID mismatch");
            }

            var existingUser = await _userRepository.GetUserByIdAsync(userId);
            if (existingUser == null)
            {
                return NotFound();
            }

            // Check access permissions
            if (!_tenantContext.IsAdminUser())
            {
                // Users can only be updated by admin or tenant admin of their tenant
                if (!_tenantContext.IsTenantAdmin() || existingUser.TenantId != _tenantContext.GetCurrentTenantId())
                {
                    return Forbid("Access denied");
                }
            }

            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var success = await _userRepository.UpdateUserAsync(user);
            if (!success)
            {
                return NotFound();
            }

            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating user {UserId}", userId);
            return StatusCode(500, "Internal server error");
        }
    }

    [HttpDelete("{userId}")]
    public async Task<IActionResult> DeleteUser(string userId)
    {
        try
        {
            var existingUser = await _userRepository.GetUserByIdAsync(userId);
            if (existingUser == null)
            {
                return NotFound();
            }

            // Check access permissions
            if (!_tenantContext.IsAdminUser())
            {
                // Users can only be deleted by admin or tenant admin of their tenant
                if (!_tenantContext.IsTenantAdmin() || existingUser.TenantId != _tenantContext.GetCurrentTenantId())
                {
                    return Forbid("Access denied");
                }
            }

            var success = await _userRepository.DeleteUserAsync(userId);
            if (!success)
            {
                return NotFound();
            }

            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting user {UserId}", userId);
            return StatusCode(500, "Internal server error");
        }
    }

    [HttpGet("me")]
    public async Task<ActionResult<UserContext>> GetCurrentUser()
    {
        try
        {
            var userId = _tenantContext.GetCurrentUserId();
            if (userId == null)
            {
                return Unauthorized("User not authenticated");
            }

            var user = await _userRepository.GetUserByIdAsync(userId);
            if (user == null)
            {
                return NotFound("User not found");
            }

            var userContext = new UserContext
            {
                UserId = user.UserId,
                Email = user.Email,
                FullName = user.FullName,
                TenantId = user.TenantId,
                Role = user.Role
            };

            return Ok(userContext);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving current user context");
            return StatusCode(500, "Internal server error");
        }
    }

    [HttpPost("{userId}/login")]
    public async Task<IActionResult> UpdateLastLogin(string userId)
    {
        try
        {
            var currentUserId = _tenantContext.GetCurrentUserId();
            if (currentUserId != userId && !_tenantContext.IsAdminUser())
            {
                return Forbid("Access denied");
            }

            await _userRepository.UpdateLastLoginAsync(userId);
            return Ok();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating last login for user {UserId}", userId);
            return StatusCode(500, "Internal server error");
        }
    }
}
