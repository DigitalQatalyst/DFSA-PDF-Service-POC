#!/bin/bash
set -e



# -------- CONFIG --------
RESOURCE_GROUP="DQ_PROJECTS"
APP_NAME="pdfexport"
ZIP_FILE="app.zip"



# Environment variables
STORAGE_ACCOUNT="kfdocumentwallet"




# -------- 1. Configure App Settings --------
az webapp config appsettings set \
  --name $APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --settings \
NODE_ENV=production \
PLAYWRIGHT_BROWSERS_PATH=0 \
AZURE_STORAGE_ACCOUNT=$STORAGE_ACCOUNT \




# -------- 2. ZIP Deployment --------
# Use PowerShell Compress-Archive (works on Windows without zip command)
powershell.exe -Command "Compress-Archive -Path * -DestinationPath $ZIP_FILE -Force -CompressionLevel Optimal"



az webapp deployment source config-zip \
  --resource-group $RESOURCE_GROUP \
  --name $APP_NAME \
  --src $ZIP_FILE



# -------- 3. Restart Web App --------
az webapp restart \
  --name $APP_NAME \
  --resource-group $RESOURCE_GROUP



echo "Deployment complete: https://$APP_NAME.azurewebsites.net"
