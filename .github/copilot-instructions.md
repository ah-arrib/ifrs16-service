# Copilot Instructions for IFRS16 Service

<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

## Project Overview
This is an IFRS16 lease accounting calculation service consisting of:
- **Backend**: ASP.NET Core Web API (.NET 8) with Dapper for SQL Server data access
- **Frontend**: React application with Vite and TypeScript
- **Database**: SQL Server for storing calculations and asset data
- **Integration**: REST API connections to Unit ERP system

## Architecture Guidelines
- Use Repository pattern with Dapper for data access
- Implement proper validation using FluentValidation
- Follow clean architecture principles with separation of concerns
- Use dependency injection for service registration
- Implement proper logging with Serilog
- Apply CORS configuration for frontend-backend communication

## Key Components
- **IFRS16 Calculation Engine**: Core business logic for lease calculations
- **ERP Integration Service**: Handle API calls to Unit ERP for asset data and GL posting
- **Database Repository Layer**: Dapper-based data access
- **Period-end Processing**: Automated calculation workflows
- **Monitoring UI**: React-based dashboard for calculation management

## Coding Standards
- Use async/await patterns for database and API operations
- Implement proper error handling and logging
- Follow RESTful API design principles
- Use TypeScript interfaces for strong typing in frontend
- Apply responsive design patterns in React components
- Implement proper validation on both client and server sides
