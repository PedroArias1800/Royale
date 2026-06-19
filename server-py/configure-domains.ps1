# configure-domains.ps1 - Run AFTER ACM certificate is ISSUED
# Sets custom domains on CloudFront distributions and API Gateway
# Usage: .\configure-domains.ps1

$certArn    = "arn:aws:acm:us-east-1:011939520585:certificate/4869aef4-46a4-41d6-8018-f290b707f653"
$cfClientId = "EZHK0H0CPXIO4"
$cfAdminId  = "E3CG251GUTREIP"
$apiGwId    = "7p5bj63pzf"
$profile    = "RoyalePanama"

Write-Output "Checking certificate status..."
$certStatus = aws acm describe-certificate `
    --certificate-arn $certArn `
    --region us-east-1 `
    --profile $profile `
    --query "Certificate.Status" `
    --output text

if ($certStatus -ne "ISSUED") {
    Write-Error "Certificate not ISSUED yet (status: $certStatus). Run again after DNS validation."
    exit 1
}

Write-Output "Certificate is ISSUED. Configuring domains..."

# Update CloudFront client distribution with custom domains
Write-Output "Updating CloudFront client ($cfClientId)..."
$cfClientEtag   = aws cloudfront get-distribution-config --id $cfClientId --profile $profile --query ETag --output text
$cfClientConfig = aws cloudfront get-distribution-config --id $cfClientId --profile $profile --query DistributionConfig | ConvertFrom-Json

$cfClientConfig.Aliases = [PSCustomObject]@{
    Quantity = 2
    Items    = @("royalepanama.com", "www.royalepanama.com")
}
$cfClientConfig.ViewerCertificate = [PSCustomObject]@{
    ACMCertificateArn             = $certArn
    SSLSupportMethod              = "sni-only"
    MinimumProtocolVersion        = "TLSv1.2_2019"
    CloudFrontDefaultCertificate  = $false
}

$utf8NoBom  = New-Object System.Text.UTF8Encoding($false)
$clientJson = $cfClientConfig | ConvertTo-Json -Depth 20
[System.IO.File]::WriteAllText("$env:TEMP\cf-client-update.json", $clientJson, $utf8NoBom)

aws cloudfront update-distribution `
    --id $cfClientId `
    --distribution-config "file://$env:TEMP/cf-client-update.json" `
    --if-match $cfClientEtag `
    --profile $profile `
    --query "Distribution.Status" --output text

# Update CloudFront admin distribution with custom domains
Write-Output "Updating CloudFront admin ($cfAdminId)..."
$cfAdminEtag   = aws cloudfront get-distribution-config --id $cfAdminId --profile $profile --query ETag --output text
$cfAdminConfig = aws cloudfront get-distribution-config --id $cfAdminId --profile $profile --query DistributionConfig | ConvertFrom-Json

$cfAdminConfig.Aliases = [PSCustomObject]@{
    Quantity = 1
    Items    = @("admin.royalepanama.com")
}
$cfAdminConfig.ViewerCertificate = [PSCustomObject]@{
    ACMCertificateArn             = $certArn
    SSLSupportMethod              = "sni-only"
    MinimumProtocolVersion        = "TLSv1.2_2019"
    CloudFrontDefaultCertificate  = $false
}

$adminJson = $cfAdminConfig | ConvertTo-Json -Depth 20
[System.IO.File]::WriteAllText("$env:TEMP\cf-admin-update.json", $adminJson, $utf8NoBom)

aws cloudfront update-distribution `
    --id $cfAdminId `
    --distribution-config "file://$env:TEMP/cf-admin-update.json" `
    --if-match $cfAdminEtag `
    --profile $profile `
    --query "Distribution.Status" --output text

# API Gateway custom domain for api.royalepanama.com
Write-Output "Creating API Gateway custom domain api.royalepanama.com..."
$domainResult = aws apigatewayv2 create-domain-name `
    --domain-name "api.royalepanama.com" `
    --domain-name-configurations "CertificateArn=$certArn,EndpointType=REGIONAL" `
    --profile $profile `
    --region us-east-1 `
    --output json | ConvertFrom-Json

$apiGwCname = $domainResult.DomainNameConfigurations[0].ApiGatewayDomainName
Write-Output "API Gateway CNAME: $apiGwCname"

# Map domain to the default stage
aws apigatewayv2 create-api-mapping `
    --domain-name "api.royalepanama.com" `
    --api-id $apiGwId `
    --stage '$default' `
    --profile $profile `
    --region us-east-1 `
    --output json | Out-Null

Write-Output ""
Write-Output "=== DONE: Add these 4 DNS records in Hostinger ==="
Write-Output ""
Write-Output "royalepanama.com        CNAME  d3vkyhy9lbjy1u.cloudfront.net"
Write-Output "www.royalepanama.com    CNAME  d3vkyhy9lbjy1u.cloudfront.net"
Write-Output "admin.royalepanama.com  CNAME  dheud93k4a750.cloudfront.net"
Write-Output "api.royalepanama.com    CNAME  $apiGwCname"