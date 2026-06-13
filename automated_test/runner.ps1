#!/usr/bin/env pwsh
# DAST Test Runner - Main orchestrator

$workDir = "C:\Users\kodav\Downloads\Farming pdd\automated_test"
$rootDir = "C:\Users\kodav\Downloads\Farming pdd"
$inputFile = Join-Path $rootDir "input.json"

# Load configuration
$config = Get-Content $inputFile | ConvertFrom-Json
$baseUrl = $config.baseUrl
$adminToken = $config.admin
$farmerToken = $config.farmer
$buyerToken = $config.buyer

Write-Host "════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "DAST TEST RUNNER - FARMING APP API" -ForegroundColor Cyan
Write-Host "════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "Base URL: $baseUrl" -ForegroundColor Yellow
Write-Host "Running tests with 3 roles: admin, farmer, buyer" -ForegroundColor Yellow
Write-Host ""

# Initialize results array
$results = @()

# Test counter
$totalTests = 0
$findingsCount = 0

Write-Host "Starting DAST test categories..." -ForegroundColor Green
Write-Host ""

# Category 1: Authentication Bypass
Write-Host "[1/8] AUTHENTICATION BYPASS TESTS" -ForegroundColor Cyan
$auth_results = & "$workDir\1_auth_bypass.ps1" -baseUrl $baseUrl -results ([ref]$results) -counter ([ref]$totalTests)
$findingsCount += ($auth_results | Where-Object { $_.finding -eq $true } | Measure-Object).Count

# Category 2: Authorization / Privesc
Write-Host "[2/8] AUTHORIZATION & PRIVILEGE ESCALATION TESTS" -ForegroundColor Cyan
$authz_results = & "$workDir\2_authz_privesc.ps1" -baseUrl $baseUrl -adminToken $adminToken -farmerToken $farmerToken -buyerToken $buyerToken -results ([ref]$results) -counter ([ref]$totalTests)
$findingsCount += ($authz_results | Where-Object { $_.finding -eq $true } | Measure-Object).Count

# Category 3: IDOR
Write-Host "[3/8] INSECURE DIRECT OBJECT REFERENCE (IDOR) TESTS" -ForegroundColor Cyan
$idor_results = & "$workDir\3_idor.ps1" -baseUrl $baseUrl -results ([ref]$results) -counter ([ref]$totalTests)
$findingsCount += ($idor_results | Where-Object { $_.finding -eq $true } | Measure-Object).Count

# Category 4: RBAC Matrix
Write-Host "[4/8] RBAC MATRIX TESTS" -ForegroundColor Cyan
$rbac_results = & "$workDir\4_rbac_matrix.ps1" -baseUrl $baseUrl -adminToken $adminToken -farmerToken $farmerToken -buyerToken $buyerToken -results ([ref]$results) -counter ([ref]$totalTests)
$findingsCount += ($rbac_results | Where-Object { $_.finding -eq $true } | Measure-Object).Count

# Category 5: Token Tampering
Write-Host "[5/8] TOKEN TAMPERING TESTS" -ForegroundColor Cyan
$tamper_results = & "$workDir\5_token_tampering.ps1" -baseUrl $baseUrl -results ([ref]$results) -counter ([ref]$totalTests)
$findingsCount += ($tamper_results | Where-Object { $_.finding -eq $true } | Measure-Object).Count

# Category 6: Injection Detection
Write-Host "[6/8] INJECTION DETECTION TESTS (SQLi/NoSQLi)" -ForegroundColor Cyan
$injection_results = & "$workDir\6_injection_detection.ps1" -baseUrl $baseUrl -results ([ref]$results) -counter ([ref]$totalTests)
$findingsCount += ($injection_results | Where-Object { $_.finding -eq $true } | Measure-Object).Count

# Category 7: Rate Limiting
Write-Host "[7/8] RATE LIMITING TESTS" -ForegroundColor Cyan
$ratelimit_results = & "$workDir\7_rate_limiting.ps1" -baseUrl $baseUrl -results ([ref]$results) -counter ([ref]$totalTests)
$findingsCount += ($ratelimit_results | Where-Object { $_.finding -eq $true } | Measure-Object).Count

# Category 8: Hardcoded Credentials
Write-Host "[8/8] HARDCODED CREDENTIALS SCAN" -ForegroundColor Cyan
$secrets_results = & "$workDir\8_hardcoded_secrets.ps1" -rootDir $rootDir -results ([ref]$results) -counter ([ref]$totalTests)
$findingsCount += ($secrets_results | Where-Object { $_.finding -eq $true } | Measure-Object).Count

# Generate report
Write-Host ""
Write-Host "════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "GENERATING FINAL REPORT" -ForegroundColor Cyan
Write-Host "════════════════════════════════════════════" -ForegroundColor Cyan

$timestamp = Get-Date -Format "o"
$report = @{
    timestamp = $timestamp
    baseUrl = $baseUrl
    totalTests = $totalTests
    findingsCount = $findingsCount
    criticalFindings = ($results | Where-Object { $_.severity -eq "CRITICAL" } | Measure-Object).Count
    highFindings = ($results | Where-Object { $_.severity -eq "HIGH" } | Measure-Object).Count
    mediumFindings = ($results | Where-Object { $_.severity -eq "MEDIUM" } | Measure-Object).Count
    lowFindings = ($results | Where-Object { $_.severity -eq "LOW" } | Measure-Object).Count
    tests = $results
}

$report | ConvertTo-Json -Depth 10 | Out-File "$workDir\report.json" -Encoding UTF8
Write-Host "✓ Report saved to: $workDir\report.json" -ForegroundColor Green
Write-Host ""

# Print summary
Write-Host "TEST SUMMARY" -ForegroundColor Yellow
Write-Host "─────────────────────────────────────────" -ForegroundColor Yellow
Write-Host "Total Tests Run: $totalTests" -ForegroundColor White
Write-Host "Total Findings: $findingsCount" -ForegroundColor Red
Write-Host "├─ CRITICAL: $($report.criticalFindings)" -ForegroundColor Red
Write-Host "├─ HIGH: $($report.highFindings)" -ForegroundColor Yellow
Write-Host "├─ MEDIUM: $($report.mediumFindings)" -ForegroundColor Yellow
Write-Host "└─ LOW: $($report.lowFindings)" -ForegroundColor Cyan
Write-Host ""

# Top issues
$critical = $results | Where-Object { $_.severity -eq "CRITICAL" }
$high = $results | Where-Object { $_.severity -eq "HIGH" }

if ($critical.Count -gt 0) {
    Write-Host "🔴 CRITICAL ISSUES (Must Fix Immediately):" -ForegroundColor Red
    $critical | ForEach-Object {
        Write-Host "  └─ [$($_.test_category)] $($_.endpoint) - $($_.note)" -ForegroundColor Red
    }
    Write-Host ""
}

if ($high.Count -gt 0) {
    Write-Host "🟠 HIGH PRIORITY ISSUES:" -ForegroundColor Yellow
    $high | ForEach-Object {
        Write-Host "  └─ [$($_.test_category)] $($_.endpoint) - $($_.note)" -ForegroundColor Yellow
    }
    Write-Host ""
}

Write-Host "════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "END OF DAST REPORT" -ForegroundColor Cyan
Write-Host "════════════════════════════════════════════" -ForegroundColor Cyan

