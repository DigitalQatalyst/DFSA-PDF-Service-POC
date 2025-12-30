#!/bin/bash

###############################################################################
# Azure App Service Startup Script
# Runs every time the container starts (not just on deployment)
#
# This script:
# 1. Sets environment variables
# 2. Verifies Playwright is ready
# 3. Starts the Node.js application
###############################################################################

set -e

echo "=========================================="
echo "DFSA PDF Service - Starting Application"
echo "=========================================="
echo "Node version: $(node --version)"
echo "Environment: ${NODE_ENV:-production}"
echo "Port: ${PORT:-8080}"
echo "=========================================="

# Verify Playwright is available
if command -v playwright &> /dev/null; then
    echo "✅ Playwright CLI found"
    playwright --version
else
    echo "⚠️  Playwright CLI not found in PATH"
fi

# Check if Chromium browser is installed
if [ -d "$HOME/.cache/ms-playwright/chromium-"* ] 2>/dev/null; then
    echo "✅ Chromium browser found in Playwright cache"
else
    echo "⚠️  Chromium browser not found. This may cause PDF generation to fail."
    echo "   If this is the first startup, Playwright may still be installing."
fi

# Set Playwright environment variables
export PLAYWRIGHT_BROWSERS_PATH=0  # Use default cache location
export PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=0  # Allow browser download if needed

# Health check: Verify critical environment variables
echo "🔍 Verifying environment configuration..."
if [ -z "$AZURE_TENANT_ID" ]; then
    echo "⚠️  AZURE_TENANT_ID not set"
fi
if [ -z "$AZURE_CLIENT_ID" ]; then
    echo "⚠️  AZURE_CLIENT_ID not set"
fi
if [ -z "$DATAVERSE_URL" ]; then
    echo "⚠️  DATAVERSE_URL not set"
fi

echo "=========================================="
echo "🚀 Starting Node.js application..."
echo "=========================================="

# Start the application
# Using 'node' directly instead of 'npm start' for better Azure App Service compatibility
exec node src/index.ts
