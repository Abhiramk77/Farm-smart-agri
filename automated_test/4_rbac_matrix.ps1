#!/usr/bin/env pwsh
# Test 4: RBAC Matrix - Test each role against each role-restricted endpoint

param(
    [string]$baseUrl,
    [string]$adminToken,
    [string]$farmerToken,
    [string]$buyerToken,
    [ref]$results,
    [ref]$counter
)

$testResults = @()
$roles = @(
    @{name="Admin"; token=$adminToken; id="u1"},
    @{name="Farmer"; token=$farmerToken; id="u2"},
    @{name="Buyer"; token=$buyerToken; id="u3"}
)

function Test-RBAC {
    param($endpoint, $method, $roleName, $token, $body, $description)

    $startTime = Get-Date

    try {
        $response = curl.exe -s -X $method "$baseUrl$endpoint" `
            -H "Authorization: Bearer $token" `
            -H "Content-Type: application/json" `
            $(if ($body) { @("-d"; $body) }) `
            -w "`n%{http_code}" --max-time 10

        $lines = $response -split "`n"
        $status = [int]$lines[-1]
        $body_resp = $lines[0..($lines.Count-2)] -join "`n"

        $elapsed = ((Get-Date) - $startTime).TotalMilliseconds

        # Check if response is success (200-299)
        $isAllowed = ($status -ge 200 -and $status -lt 300)

        $testResults += @{
            endpoint = $endpoint
            method = $method
            role = $roleName
            status = $status
            allowed = $isAllowed
            finding = $false  # Will be flagged if actual vs expected doesn't match (unknown expected for now)
            severity = "INFO"
            response_time_ms = [math]::Round($elapsed, 2)
            test_category = "RBAC Matrix"
            note = $description
            timestamp = Get-Date -Format "o"
        }

        $counter.Value++
        return $testResults[-1]
    }
    catch {
        Write-Host "  ✗ Error: $_" -ForegroundColor Red
        return $null
    }
}

Write-Host "  • Testing authenticated endpoints across all roles" -ForegroundColor Gray

foreach ($role in $roles) {
    Write-Host "    - Testing $($role.name) access:" -ForegroundColor DarkGray

    # Test authenticated endpoint /api/auth/me
    Test-RBAC "/api/auth/me" "GET" $role.name $role.token $null "GET /api/auth/me as $($role.name)" | Out-Null

    # Test contract manipulation endpoints (these should have RBAC but currently don't)
    Test-RBAC "/api/contracts" "POST" $role.name $role.token '{"product":"test","quantity":"100"}' "POST /api/contracts as $($role.name)" | Out-Null
    Test-RBAC "/api/contracts/c1/accept" "POST" $role.name $role.token "{}" "POST /api/contracts/:id/accept as $($role.name)" | Out-Null
    Test-RBAC "/api/contracts/c1/reject" "POST" $role.name $role.token "{}" "POST /api/contracts/:id/reject as $($role.name)" | Out-Null
    Test-RBAC "/api/contracts/c1/progress" "PUT" $role.name $role.token '{"progress":"delivered"}' "PUT /api/contracts/:id/progress as $($role.name)" | Out-Null
}

$testResults

