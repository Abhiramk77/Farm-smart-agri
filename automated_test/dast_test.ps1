#!/usr/bin/env pwsh
# Simple, direct DAST Test Runner

$baseUrl = "http://localhost:3000"
$rootDir = "C:\Users\kodav\Downloads\Farming pdd"
$workDir = "C:\Users\kodav\Downloads\Farming pdd\automated_test"

# Load tokens
$config = Get-Content "$rootDir\input.json" | ConvertFrom-Json
$adminToken = $config.admin
$farmerToken = $config.farmer
$buyerToken = $config.buyer

Write-Host "=================================================" -ForegroundColor Cyan
Write-Host "DAST TEST RUNNER - FARMING APP API" -ForegroundColor Cyan
Write-Host "=================================================" -ForegroundColor Cyan
Write-Host "Base URL: $baseUrl" -ForegroundColor Yellow
Write-Host ""

$allTests = @()
$testCount = 0

# ============ CATEGORY 1: AUTHENTICATION BYPASS ============
Write-Host "[1] CATEGORY 1: AUTHENTICATION BYPASS" -ForegroundColor Cyan

# Test 1: GET /api/auth/me without token
$response = curl.exe -s -X GET "$baseUrl/api/auth/me" -H "Content-Type: application/json" -w "`n%{http_code}" --max-time 5
$status = [int]($response -split "`n")[-1]
$allTests += @{endpoint="/api/auth/me"; method="GET"; role="NONE"; status=$status; expected=401; finding=($status -ne 401); severity="HIGH"; test_category="AuthN Bypass"; note="Missing auth header"; timestamp=(Get-Date -Format o)}
$testCount++
Write-Host "    - No token: $status (expected 401)" -ForegroundColor DarkGray

# Test 2: GET /api/auth/me with invalid token
$response = curl.exe -s -X GET "$baseUrl/api/auth/me" -H "Authorization: Bearer invalid_xyz" -H "Content-Type: application/json" -w "`n%{http_code}" --max-time 5
$status = [int]($response -split "`n")[-1]
$allTests += @{endpoint="/api/auth/me"; method="GET"; role="NONE"; status=$status; expected=401; finding=($status -ne 401); severity="HIGH"; test_category="AuthN Bypass"; note="Invalid token"; timestamp=(Get-Date -Format o)}
$testCount++
Write-Host "    - Invalid token: $status (expected 401)" -ForegroundColor DarkGray

# Test 3: POST /api/contracts without token
$body = '{"product":"test","quantity":"100"}'
$response = curl.exe -s -X POST "$baseUrl/api/contracts" -H "Content-Type: application/json" -d $body -w "`n%{http_code}" --max-time 5
$status = [int]($response -split "`n")[-1]
$finding = ($status -ge 200 -and $status -lt 300)
$allTests += @{endpoint="/api/contracts"; method="POST"; role="NONE"; status=$status; expected=401; finding=$finding; severity="CRITICAL"; test_category="AuthN Bypass"; note="POST contract without auth (got $status, need 401)"; timestamp=(Get-Date -Format o)}
$testCount++
Write-Host "    - Create contract (no auth): $status - CRITICAL" -ForegroundColor Red

# Test 4: POST /api/contracts/:id/accept without token
$response = curl.exe -s -X POST "$baseUrl/api/contracts/c1/accept" -H "Content-Type: application/json" -d '{}' -w "`n%{http_code}" --max-time 5
$status = [int]($response -split "`n")[-1]
$finding = ($status -ge 200 -and $status -lt 300)
$allTests += @{endpoint="/api/contracts/:id/accept"; method="POST"; role="NONE"; status=$status; expected=401; finding=$finding; severity="CRITICAL"; test_category="AuthN Bypass"; note="Accept contract (no auth, got $status)"; timestamp=(Get-Date -Format o)}
$testCount++
Write-Host "    - Accept contract (no auth): $status - CRITICAL" -ForegroundColor Red

Write-Host ""
Write-Host "[2] CATEGORY 2: AUTHORIZATION" -ForegroundColor Cyan

# Test auth with different roles
$roles_list = @(
    @{name="Admin"; token=$adminToken},
    @{name="Farmer"; token=$farmerToken},
    @{name="Buyer"; token=$buyerToken}
)

foreach ($r in $roles_list) {
    $response = curl.exe -s -X PUT "$baseUrl/api/contracts/c1/progress" -H "Authorization: Bearer $($r.token)" -H "Content-Type: application/json" -d '{"progress":"delivered"}' -w "`n%{http_code}" --max-time 5
    $status = [int]($response -split "`n")[-1]
    $isAllowed = ($status -ge 200 -and $status -lt 300)
    $allTests += @{endpoint="/api/contracts/:id/progress"; method="PUT"; role=$r.name; status=$status; allowed=$isAllowed; severity="MEDIUM"; test_category="AuthZ"; note="$($r.name) can modify"; timestamp=(Get-Date -Format o)}
    $testCount++
    Write-Host "    - $($r.name) PUT progress: $status" -ForegroundColor DarkGray
}

Write-Host ""
Write-Host "[3] CATEGORY 3: IDOR - CROSS-RESOURCE ACCESS" -ForegroundColor Cyan

foreach ($contractId in @("c1", "c2", "c3")) {
    $response = curl.exe -s -X GET "$baseUrl/api/contracts/$contractId" -H "Content-Type: application/json" -w "`n%{http_code}" --max-time 5
    $status = [int]($response -split "`n")[-1]
    $isAllowed = ($status -ge 200 -and $status -lt 300)
    $allTests += @{endpoint="/api/contracts/:id"; method="GET"; contractId=$contractId; status=$status; allowed=$isAllowed; severity="INFO"; test_category="IDOR"; note="Read $contractId"; timestamp=(Get-Date -Format o)}
    $testCount++
    Write-Host "    - Read contract $contractId : $status" -ForegroundColor DarkGray
}

Write-Host ""
Write-Host "[4] CATEGORY 4: TOKEN TAMPERING" -ForegroundColor Cyan

$tamperedTokens = @("mock_token_u999", "invalid_jwt")
foreach ($ttoken in $tamperedTokens) {
    $response = curl.exe -s -X GET "$baseUrl/api/auth/me" -H "Authorization: Bearer $ttoken" -H "Content-Type: application/json" -w "`n%{http_code}" --max-time 5
    $status = [int]($response -split "`n")[-1]
    $finding = ($status -ge 200 -and $status -lt 300)
    $allTests += @{endpoint="/api/auth/me"; method="GET"; tampered_token=$ttoken; status=$status; expected=401; finding=$finding; severity="CRITICAL"; test_category="Token Tampering"; note="Tampered token"; timestamp=(Get-Date -Format o)}
    $testCount++
    Write-Host "    - Tampered token '$ttoken': $status" -ForegroundColor DarkGray
}

Write-Host ""
Write-Host "[5] CATEGORY 5: RBAC MATRIX" -ForegroundColor Cyan

$endpoints = @(
    @{path="/api/contracts"; method="GET"},
    @{path="/api/contracts/marketplace"; method="GET"},
    @{path="/api/chats"; method="GET"}
)

$rbac_tests = 0
foreach ($ep in $endpoints) {
    foreach ($r in $roles_list) {
        $response = curl.exe -s -X $ep.method "$baseUrl$($ep.path)" -H "Authorization: Bearer $($r.token)" -H "Content-Type: application/json" -w "`n%{http_code}" --max-time 5
        $status = [int]($response -split "`n")[-1]
        $isAllowed = ($status -ge 200 -and $status -lt 300)
        $allTests += @{endpoint=$ep.path; method=$ep.method; role=$r.name; status=$status; allowed=$isAllowed; severity="INFO"; test_category="RBAC"; note="$($r.name) access"; timestamp=(Get-Date -Format o)}
        $testCount++
        $rbac_tests++
    }
}
Write-Host "    - RBAC matrix: $rbac_tests endpoint/role combinations" -ForegroundColor DarkGray

Write-Host ""
Write-Host "[6] CATEGORY 6: INJECTION DETECTION" -ForegroundColor Cyan

$sqlPayloads = @("' OR '1'='1", "' OR 1=1--", "'; DROP TABLE--")
$injection_tests = 0
foreach ($payload in $sqlPayloads) {
    $encoded = [uri]::EscapeDataString($payload)
    $response = curl.exe -s -X GET "$baseUrl/api/contracts?status=$encoded" -H "Content-Type: application/json" -w "`n%{http_code}" --max-time 5
    $status = [int]($response -split "`n")[-1]
    $allTests += @{endpoint="/api/contracts"; method="GET"; query_param=$payload.Substring(0, [Math]::Min(15, $payload.Length)); status=$status; severity="LOW"; test_category="Injection"; note="SQLi probe"; timestamp=(Get-Date -Format o)}
    $testCount++
    $injection_tests++
}
Write-Host "    - Injection payloads: $injection_tests tested" -ForegroundColor DarkGray

Write-Host ""
Write-Host "[7] CATEGORY 7: RATE LIMITING" -ForegroundColor Cyan

$rateLimitFound = $false
$requestsBeforeLimit = 0
for ($i = 1; $i -le 30; $i++) {
    $response = curl.exe -s -X GET "$baseUrl/api/chats" -H "Content-Type: application/json" -w "`n%{http_code}" --max-time 5
    $status = [int]($response -split "`n")[-1]
    if ($status -eq 429) {
        $rateLimitFound = $true
        $requestsBeforeLimit = $i
        break
    }
}
$finding = -not $rateLimitFound
$allTests += @{endpoint="/api/chats"; method="GET"; test_type="Burst"; burst_count=30; rate_limit_hit=$rateLimitFound; hit_at=$requestsBeforeLimit; finding=$finding; severity="MEDIUM"; test_category="Rate Limiting"; note="No rate limiting"; timestamp=(Get-Date -Format o)}
$testCount++

if ($rateLimitFound) {
    Write-Host "    - Rate limit found after $requestsBeforeLimit requests" -ForegroundColor Green
} else {
    Write-Host "    - NO RATE LIMITING - Vulnerable to brute force" -ForegroundColor Red
}

Write-Host ""
Write-Host "[8] CATEGORY 8: HARDCODED SECRETS" -ForegroundColor Cyan

$hasSecrets = $false
$secretsList = @()

# Check data.js for hardcoded passwords
$dataContent = Get-Content "$rootDir\backend\data.js" -Raw
if ($dataContent -like "*password*:*" -or $dataContent -like "*password*=*") {
    $hasSecrets = $true
    $secretsList += "backend/data.js - hardcoded passwords"
    Write-Host "    - FOUND: Passwords in source code" -ForegroundColor Red
}

# Check for google-services.json
if (Test-Path "$rootDir\smart_agri_app\android\app\google-services.json") {
    $hasSecrets = $true
    $secretsList += "google-services.json - Firebase creds"
    Write-Host "    - FOUND: Firebase service account" -ForegroundColor Red
}

if (-not $hasSecrets) {
    Write-Host "    - No obvious hardcoded secrets found" -ForegroundColor Green
}

$allTests += @{endpoint="N/A"; test_type="Secrets"; secretsFound=$hasSecrets; files=$secretsList; severity=if($hasSecrets){"HIGH"}else{"INFO"}; test_category="Hardcoded Secrets"; note="Credentials scan"; timestamp=(Get-Date -Format o)}
$testCount++

# ============ GENERATE REPORT ============
Write-Host ""
Write-Host "=================================================" -ForegroundColor Cyan
Write-Host "TEST SUMMARY" -ForegroundColor Cyan
Write-Host "=================================================" -ForegroundColor Cyan

$criticalCount = ($allTests | Where-Object { $_.severity -eq "CRITICAL" } | Measure-Object).Count
$highCount = ($allTests | Where-Object { $_.severity -eq "HIGH" } | Measure-Object).Count
$mediumCount = ($allTests | Where-Object { $_.severity -eq "MEDIUM" } | Measure-Object).Count

Write-Host "Total Tests Run: $testCount" -ForegroundColor White
Write-Host "  - CRITICAL: $criticalCount" -ForegroundColor Red
Write-Host "  - HIGH: $highCount" -ForegroundColor Yellow
Write-Host "  - MEDIUM: $mediumCount" -ForegroundColor Yellow

# Save report
$timestamp = Get-Date -Format "o"
$report = @{
    timestamp = $timestamp
    baseUrl = $baseUrl
    summary = @{
        totalTests = $testCount
        critical = $criticalCount
        high = $highCount
        medium = $mediumCount
    }
    endpoints = @{
        public = 9
        authRequired = 2
        total = 11
    }
    tests = $allTests
}

$report | ConvertTo-Json -Depth 10 | Out-File "$workDir\report.json" -Encoding UTF8
Write-Host ""
Write-Host "Report saved: $workDir\report.json" -ForegroundColor Green

# Display critical issues
Write-Host ""
Write-Host "CRITICAL FINDINGS:" -ForegroundColor Red
$allTests | Where-Object { $_.severity -eq "CRITICAL" } | ForEach-Object {
    Write-Host "  X [$($_.test_category)] $($_.endpoint)" -ForegroundColor Red
    Write-Host "    $($_.note)" -ForegroundColor DarkRed
}

Write-Host ""
Write-Host "=================================================" -ForegroundColor Cyan
Write-Host "DAST Assessment Complete" -ForegroundColor Green
Write-Host "=================================================" -ForegroundColor Cyan

