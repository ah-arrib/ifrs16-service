#!/bin/bash
# Set environment variable to disable globalization invariant mode
export DOTNET_SYSTEM_GLOBALIZATION_INVARIANT=false
cd /Users/aha00953/ifrs16-service/Backend
dotnet run
