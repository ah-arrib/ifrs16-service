using Backend.Data;
using Backend.Repositories;
using Backend.Services;
using Backend.Middleware;
using Serilog;

var builder = WebApplication.CreateBuilder(args);

// Configure Serilog
Log.Logger = new LoggerConfiguration()
    .ReadFrom.Configuration(builder.Configuration)
    .CreateLogger();

builder.Host.UseSerilog();

// Add services to the container.
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new() { 
        Title = "IFRS16 Service API", 
        Version = "v1",
        Description = "Multi-tenant API for IFRS16 lease accounting calculations and ERP integration"
    });
});

// Add HTTP context accessor for tenant context
builder.Services.AddHttpContextAccessor();

// Configure CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins("http://localhost:5173", "http://localhost:3000")
              .AllowAnyMethod()
              .AllowAnyHeader()
              .AllowCredentials();
    });
});

// Database configuration
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection") 
    ?? "Server=localhost;Database=IFRS16Service;Trusted_Connection=true;TrustServerCertificate=true;";

builder.Services.AddSingleton<IDbConnectionFactory>(provider => 
    new SqlConnectionFactory(connectionString));

// Repository registration
builder.Services.AddScoped<ITenantRepository, TenantRepository>();
builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped<ILeaseRepository, LeaseRepository>();
builder.Services.AddScoped<ILeaseCalculationRepository, LeaseCalculationRepository>();

// Service registration
builder.Services.AddScoped<ITenantContextService, TenantContextService>();
builder.Services.AddScoped<IIfrs16CalculationService, Ifrs16CalculationService>();
builder.Services.AddScoped<ILeasePostingService, LeasePostingService>();

// ERP Integration
builder.Services.AddHttpClient<IERPIntegrationService, ERPIntegrationService>();
builder.Services.AddSingleton(provider =>
{
    var config = new ERPConfiguration();
    builder.Configuration.GetSection("ERP").Bind(config);
    return config;
});

// Accounting Configuration
builder.Services.AddSingleton(provider =>
{
    var config = new AccountingConfiguration();
    builder.Configuration.GetSection("Accounting").Bind(config);
    return config;
});

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "IFRS16 Service API V1");
        c.RoutePrefix = string.Empty; // Set Swagger UI at the app root
    });
}

app.UseHttpsRedirection();
app.UseCors("AllowFrontend");

// Add tenant authorization middleware
app.UseTenantAuthorization();

app.UseAuthorization();
app.MapControllers();

try
{
    Log.Information("Starting IFRS16 Service API");
    app.Run();
}
catch (Exception ex)
{
    Log.Fatal(ex, "Application terminated unexpectedly");
}
finally
{
    Log.CloseAndFlush();
}
