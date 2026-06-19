# deploy.ps1 — Run from server-py/
# Reads .env for sensitive values and deploys to AWS Lambda via SAM.
# Usage: .\deploy.ps1            (production stack: royale-api)
#        .\deploy.ps1 -Staging   (staging stack: royale-api-staging)

param([switch]$Staging)

$envFile = Join-Path $PSScriptRoot ".env"
if (-not (Test-Path $envFile)) {
    Write-Error ".env not found at $envFile"; exit 1
}

# Parse .env
$env = @{}
Get-Content $envFile | ForEach-Object {
    if ($_ -match '^\s*([^#=]+?)\s*=\s*(.*?)\s*$') {
        $env[$Matches[1]] = $Matches[2]
    }
}

$mongoUri  = $env["MONGODB_URI"]
$jwtSecret = $env["JWT_SECRET"]
$bucket    = if ($Staging) { "royale-media-staging" } else { "royale-media" }
$frontUrl  = if ($Staging) { "http://localhost:5173"         } else { "https://royalepanama.com" }
$adminUrl  = if ($Staging) { "http://localhost:5174"         } else { "https://admin.royalepanama.com" }
$stack     = if ($Staging) { "royale-api-staging"            } else { "royale-api" }

if (-not $mongoUri -or -not $jwtSecret) {
    Write-Error "MONGODB_URI or JWT_SECRET missing in .env"; exit 1
}

$overrides = "MongodbUri=$mongoUri JwtSecret=$jwtSecret MediaBucket=$bucket FrontendUrl=$frontUrl AdminUrl=$adminUrl"

Write-Output "Deploying stack: $stack"
sam build
sam deploy --stack-name $stack --parameter-overrides $overrides --profile RoyalePanama --region us-east-1 --capabilities CAPABILITY_IAM --resolve-s3 --no-confirm-changeset
