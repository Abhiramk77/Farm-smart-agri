#!/usr/bin/env pwsh
# DAST Test Runner - Simplified version

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
Write-Host "Running comprehensive DAST tests..." -ForegroundColor Yellow
Write-Host ""

# Initialize results array
$allResults = @()

# Test counter
$totalTests = 0

Write-Host "[1/8] AUTHENTICATION BYPASS TESTS" -ForegroundColor Cyan
Write-Host "  • Testing protected endpoints without/with invalid tokens"
$testCounter = 0
$testResults1 = & "$workDir\1_auth_bypass.ps1" -baseUrl $baseUrl -results ([ref]$allResults) -counter ([ref]$testCounter)
$allResults += $testResults1
$totalTests += $testCounter

Write-Host "[2/8] AUTHORIZATION & PRIVILEGE ESCALATION" -ForegroundColor Cyan
Write-Host "  • Testing role-restricted endpoints across roles"
$testCounter = 0
$testResults2 = & "$workDir\2_authz_privesc.ps1" -baseUrl $baseUrl -adminToken $adminToken -farmerToken $farmerToken -buyerToken $buyerToken -results ([ref]$allResults) -counter ([ref]$testCounter)
$allResults += $testResults2
$totalTests += $testCounter

Write-Host "[3/8] INSECURE DIRECT OBJECT REFERENCE (IDOR)" -ForegroundColor Cyan
Write-Host "  • Testing cross-resource access vulnerabilities"
$testCounter = 0
$testResults3 = & "$workDir\3_idor.ps1" -baseUrl $baseUrl -results ([ref]$allResults) -counter ([ref]$testCounter)
$allResults += $testResults3
$totalTests += $testCounter

Write-Host "[4/8] RBAC MATRIX TESTS" -ForegroundColor Cyan
Write-Host "  • Testing each role against role-restricted endpoints"
$testCounter = 0
$testResults4 = & "$workDir\4_rbac_matrix.ps1" -baseUrl $baseUrl -adminToken $adminToken -farmerToken $farmerToken -buyerToken $buyerToken -results ([ref]$allResults) -counter ([ref]$testCounter)
$allResults += $testResults4
$totalTests += $testCounter

Write-Host "[5/8] TOKEN TAMPERING TESTS" -ForegroundColor Cyan
Write-Host "  • Testing tampered JWT tokens"
$testCounter = 0
$testResults5 = & "$workDir\5_token_tampering.ps1" -baseUrl $baseUrl -results ([ref]$allResults) -counter ([ref]$testCounter)
$allResults += $testResults5
$totalTests += $testCounter

Write-Host "[6/8] INJECTION DETECTION TESTS" -ForegroundColor Cyan
Write-Host "  • Testing SQLi/NoSQLi detection payloads"
$testCounter = 0
$testResults6 = & "$workDir\6_injection_detection.ps1" -baseUrl $baseUrl -results ([ref]$allResults) -counter ([ref]$testCounter)
$allResults += $testResults6
$totalTests += $testCounter

Write-Host "[7/8] RATE LIMITING TESTS" -ForegroundColor Cyan
Write-Host "  • Running burst stress test"
$testCounter = 0
$testResults7 = & "$workDir\7_rate_limiting.ps1" -baseUrl $baseUrl -results ([ref]$allResults) -counter ([ref]$testCounter)
$allResults += $testResults7
$totalTests += $testCounter

Write-Host "[8/8] HARDCODED SECRETS SCAN" -ForegroundColor Cyan
Write-Host "  • Scanning codebase for exposed credentials"
$testCounter = 0
$testResults8 = & "$workDir\8_hardcoded_secrets.ps1" -rootDir $rootDir -results ([ref]$allResults) -counter ([ref]$testCounter)
$allResults += $testResults8
$totalTests += $testCounter

Write-Host ""
Write-Host "════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "GENERATING FINAL REPORT" -ForegroundColor Cyan
Write-Host "════════════════════════════════════════════" -ForegroundColor Cyan

# Filter out null/empty results
$allResults = $allResults | Where-Object { $_ -ne $null }

# Generate comprehensive report
$timestamp = Get-Date -Format "o"
$criticalCount = ($allResults | Where-Object { $_.severity -eq "CRITICAL" } | Measure-Object).Count
$highCount = ($allResults | Where-Object { $_.severity -eq "HIGH" } | Measure-Object).Count
$mediumCount = ($allResults | Where-Object { $_.severity -eq "MEDIUM" } | Measure-Object).Count
$lowCount = ($allResults | Where-Object { $_.severity -eq "LOW" } | Measure-Object).Count
$findingsCount = ($allResults | Where-Object { $_.finding -eq $true } | Measure-Object).Count

$report = @{
    metadata = @{
        timestamp = $timestamp
        baseUrl = $baseUrl
        testerAgent = "GitHub Copilot DAST"
        reportVersion = "1.0"
    }
    summary = @{
        totalTests = $totalTests
        totalFindings = $findingsCount
        criticalFindings = $criticalCount
        highFindings = $highCount
        mediumFindings = $mediumCount
        lowFindings = $lowCount
        endpoints = @(
            "/api/auth/signup"
            "/api/auth/login"
            "/api/auth/me"
            "/api/contracts"
            "/api/contracts/marketplace"
            "/api/contracts/:id"
            "/api/contracts/:id/accept"
            "/api/contracts/:id/reject"
            "/api/contracts/:id/progress"
            "/api/chats"
        )
        endpointsCount = 10
    }
    tests = $allResults
}

$reportJson = $report | ConvertTo-Json -Depth 10
$reportJson | Out-File "$workDir\report.json" -Encoding UTF8

Write-Host "✓ Report saved to: $workDir\report.json" -ForegroundColor Green
Write-Host ""

# Print summary
Write-Host "TEST SUMMARY" -ForegroundColor Yellow
Write-Host "─────────────────────────────────────────" -ForegroundColor Yellow
Write-Host "Total Tests Run: $totalTests" -ForegroundColor White
Write-Host "Total Findings: $findingsCount" -ForegroundColor Red
Write-Host "├─ 🔴 CRITICAL: $criticalCount" -ForegroundColor Red
Write-Host "├─ 🟠 HIGH: $highCount" -ForegroundColor Yellow
Write-Host "├─ 🟡 MEDIUM: $mediumCount" -ForegroundColor Yellow
Write-Host "└─ 🔵 LOW/INFO: $lowCount" -ForegroundColor Cyan
Write-Host ""

# Top critical issues
$criticalIssues = $allResults | Where-Object { $_.severity -eq "CRITICAL" }
if ($criticalIssues.Count -gt 0) {
    Write-Host "🔴 CRITICAL ISSUES (Fix Immediately):" -ForegroundColor Red
    $criticalIssues | ForEach-Object {
        $ep = $_.endpoint
        $cat = $_.test_category
        Write-Host "  ✗ [$cat] $ep - $($_.note)" -ForegroundColor Red
    }
    Write-Host ""
}

# Top high issues
$highIssues = $allResults | Where-Object { $_.severity -eq "HIGH" }
if ($highIssues.Count -gt 0) {
    Write-Host "🟠 HIGH PRIORITY ISSUES:" -ForegroundColor Yellow
    $highIssues | Select-Object -First 10 | ForEach-Object {
        $ep = $_.endpoint
        $cat = $_.test_category
        Write-Host "  ⚠ [$cat] $ep" -ForegroundColor Yellow
    }
    if ($highIssues.Count -gt 10) {
        Write-Host "  ... and $($highIssues.Count - 10) more" -ForegroundColor Yellow
    }
    Write-Host ""
}

Write-Host "════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "Full report available in: report.json" -ForegroundColor Green
Write-Host "════════════════════════════════════════════" -ForegroundColor Cyan

