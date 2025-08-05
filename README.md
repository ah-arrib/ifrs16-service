# IFRS16 Service

A comprehensive IFRS16 lease accounting calculation service with ASP.NET Core backend, React frontend, and ERP integration.

## Architecture

### Backend (ASP.NET Core)
- **Framework**: .NET 8 Web API
- **Database**: SQL Server with Dapper ORM
- **Logging**: Serilog
- **Validation**: FluentValidation
- **CORS**: Configured for frontend communication

### Frontend (React)
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **State Management**: TanStack Query (React Query)
- **HTTP Client**: Axios
- **Icons**: Lucide React

### Database
- **SQL Server** for storing lease data and calculations
- **Dapper** for efficient data access
- **Repository pattern** for data layer abstraction

## Features

### Core Functionality
- **Lease Management**: Create, edit, and manage lease contracts
- **IFRS16 Calculations**: Automated calculation of:
  - Right of Use Asset amortization
  - Lease liability and interest expense
  - Period-end calculations
- **ERP Integration**: REST API integration with Unit ERP system for:
  - Asset data retrieval
  - GL transaction posting
- **Monitoring Dashboard**: Real-time monitoring of calculations and posting status

### Key Components

#### Backend Services
- `Ifrs16CalculationService`: Core IFRS16 calculation engine
- `ERPIntegrationService`: ERP system communication
- `LeasePostingService`: Journal entry creation and posting
- Repository pattern with `LeaseRepository` and `LeaseCalculationRepository`

#### Frontend Components
- `LeaseList`: Lease management interface
- `LeaseForm`: Lease creation/editing form
- `CalculationDashboard`: Period-end processing and monitoring
- `ERPIntegration`: ERP connection status and asset management

## Getting Started

### Prerequisites
- .NET 8 SDK
- SQL Server (LocalDB or full instance)
- Node.js 18+ and npm

### Backend Setup

1. **Navigate to backend directory:**
   ```bash
   cd Backend
   ```

2. **Restore packages:**
   ```bash
   dotnet restore
   ```

3. **Configure database connection:**
   - Update `appsettings.json` with your SQL Server connection string
   - Run the database schema script: `database-schema.sql`

4. **Configure ERP settings:**
   - Update ERP configuration in `appsettings.json`:
   ```json
   {
     "ERP": {
       "BaseUrl": "https://your-erp-api.com",
       "ApiKey": "your-api-key",
       "TimeoutSeconds": 30
     }
   }
   ```

5. **Run the backend:**
   ```bash
   dotnet run
   ```

   The API will be available at `https://localhost:7297`

### Frontend Setup

1. **Navigate to frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure API URL:**
   - Create `.env` file in frontend directory:
   ```
   VITE_API_URL=https://localhost:7297/api
   ```

4. **Run the frontend:**
   ```bash
   npm run dev
   ```

   The application will be available at `http://localhost:5173`

### Database Setup

1. **Create the database:**
   ```sql
   CREATE DATABASE IFRS16Service;
   ```

2. **Run the schema script:**
   Execute the `Backend/database-schema.sql` script in SQL Server Management Studio or your preferred tool.

## API Endpoints

### Leases
- `GET /api/leases` - Get all leases
- `GET /api/leases/{id}` - Get lease by ID
- `POST /api/leases` - Create new lease
- `PUT /api/leases/{id}` - Update lease
- `DELETE /api/leases/{id}` - Delete lease
- `POST /api/leases/{id}/calculate` - Calculate lease schedule
- `GET /api/leases/{id}/calculations` - Get lease calculations

### Calculations
- `POST /api/calculations/period-end` - Run period-end calculations
- `POST /api/calculations/post-to-erp` - Post calculations to ERP
- `POST /api/calculations/post-period-to-erp` - Post period calculations to ERP

### ERP Integration
- `GET /api/erp/assets` - Get assets from ERP
- `GET /api/erp/assets/{id}` - Get specific asset from ERP
- `GET /api/erp/health` - Test ERP connection

## Configuration

### Accounting Configuration
Configure GL account codes in `appsettings.json`:
```json
{
  "Accounting": {
    "RightOfUseAssetAccount": "1600",
    "AccumulatedAmortizationAccount": "1650",
    "LeaseLiabilityAccount": "2400",
    "InterestExpenseAccount": "7200",
    "AmortizationExpenseAccount": "6200",
    "CashAccount": "1000"
  }
}
```

### Logging Configuration
Serilog is configured to log to both console and file. Logs are stored in the `logs/` directory.

## Development

### Backend Development
- Follow clean architecture principles
- Use async/await for all database and HTTP operations
- Implement proper error handling and logging
- Add unit tests for business logic

### Frontend Development
- Use TypeScript for type safety
- Follow React best practices
- Use TanStack Query for server state management
- Apply responsive design with Tailwind CSS

## Deployment

### Backend Deployment
1. Build the application:
   ```bash
   dotnet build --configuration Release
   ```

2. Publish the application:
   ```bash
   dotnet publish --configuration Release --output ./publish
   ```

3. Deploy to your preferred hosting environment (Azure, IIS, etc.)

### Frontend Deployment
1. Build the application:
   ```bash
   npm run build
   ```

2. Deploy the `dist` folder to your web server or CDN

## License

This project is licensed under the MIT License.

## Support

For support and questions, please contact the development team or create an issue in the project repository.
