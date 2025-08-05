using Backend.Models;
using System.Text.Json;
using System.Text;

namespace Backend.Services
{
    public interface IERPIntegrationService
    {
        Task<List<ERPAsset>> GetAssetsAsync();
        Task<ERPAsset?> GetAssetByIdAsync(string assetId);
        Task<ERPPostingResponse> PostTransactionsAsync(ERPPostingRequest request);
        Task<bool> TestConnectionAsync();
    }
    
    public class ERPIntegrationService : IERPIntegrationService
    {
        private readonly HttpClient _httpClient;
        private readonly ILogger<ERPIntegrationService> _logger;
        private readonly ERPConfiguration _config;
        
        public ERPIntegrationService(
            HttpClient httpClient, 
            ILogger<ERPIntegrationService> logger,
            ERPConfiguration config)
        {
            _httpClient = httpClient;
            _logger = logger;
            _config = config;
            
            // Configure HTTP client
            _httpClient.BaseAddress = new Uri(_config.BaseUrl);
            _httpClient.DefaultRequestHeaders.Add("Authorization", $"Bearer {_config.ApiKey}");
            _httpClient.DefaultRequestHeaders.Add("Accept", "application/json");
        }
        
        public async Task<List<ERPAsset>> GetAssetsAsync()
        {
            try
            {
                _logger.LogInformation("Fetching assets from ERP system");
                
                var response = await _httpClient.GetAsync("/api/assets");
                response.EnsureSuccessStatusCode();
                
                var json = await response.Content.ReadAsStringAsync();
                var assets = JsonSerializer.Deserialize<List<ERPAsset>>(json, new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                });
                
                _logger.LogInformation("Retrieved {Count} assets from ERP system", assets?.Count ?? 0);
                return assets ?? new List<ERPAsset>();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching assets from ERP system");
                throw new ERPIntegrationException("Failed to fetch assets from ERP system", ex);
            }
        }
        
        public async Task<ERPAsset?> GetAssetByIdAsync(string assetId)
        {
            try
            {
                _logger.LogInformation("Fetching asset {AssetId} from ERP system", assetId);
                
                var response = await _httpClient.GetAsync($"/api/assets/{assetId}");
                
                if (response.StatusCode == System.Net.HttpStatusCode.NotFound)
                {
                    return null;
                }
                
                response.EnsureSuccessStatusCode();
                
                var json = await response.Content.ReadAsStringAsync();
                var asset = JsonSerializer.Deserialize<ERPAsset>(json, new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                });
                
                _logger.LogInformation("Retrieved asset {AssetId} from ERP system", assetId);
                return asset;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching asset {AssetId} from ERP system", assetId);
                throw new ERPIntegrationException($"Failed to fetch asset {assetId} from ERP system", ex);
            }
        }
        
        public async Task<ERPPostingResponse> PostTransactionsAsync(ERPPostingRequest request)
        {
            try
            {
                _logger.LogInformation("Posting {Count} transactions to ERP system", request.Transactions.Count);
                
                var json = JsonSerializer.Serialize(request, new JsonSerializerOptions
                {
                    PropertyNamingPolicy = JsonNamingPolicy.CamelCase
                });
                
                var content = new StringContent(json, Encoding.UTF8, "application/json");
                var response = await _httpClient.PostAsync("/api/transactions/batch", content);
                
                var responseJson = await response.Content.ReadAsStringAsync();
                var postingResponse = JsonSerializer.Deserialize<ERPPostingResponse>(responseJson, new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                });
                
                if (postingResponse?.Success == true)
                {
                    _logger.LogInformation("Successfully posted transactions to ERP system. Batch ID: {BatchId}", postingResponse.BatchId);
                }
                else
                {
                    _logger.LogWarning("Failed to post transactions to ERP system. Errors: {Errors}", 
                        string.Join(", ", postingResponse?.Errors ?? new List<string>()));
                }
                
                return postingResponse ?? new ERPPostingResponse 
                { 
                    Success = false, 
                    Message = "Invalid response from ERP system" 
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error posting transactions to ERP system");
                throw new ERPIntegrationException("Failed to post transactions to ERP system", ex);
            }
        }
        
        public async Task<bool> TestConnectionAsync()
        {
            try
            {
                _logger.LogInformation("Testing connection to ERP system");
                
                var response = await _httpClient.GetAsync("/api/health");
                var isHealthy = response.IsSuccessStatusCode;
                
                _logger.LogInformation("ERP system connection test result: {IsHealthy}", isHealthy);
                return isHealthy;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error testing connection to ERP system");
                return false;
            }
        }
    }
    
    public class ERPConfiguration
    {
        public string BaseUrl { get; set; } = string.Empty;
        public string ApiKey { get; set; } = string.Empty;
        public int TimeoutSeconds { get; set; } = 30;
    }
    
    public class ERPIntegrationException : Exception
    {
        public ERPIntegrationException(string message) : base(message) { }
        public ERPIntegrationException(string message, Exception innerException) : base(message, innerException) { }
    }
}
