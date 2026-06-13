#!/usr/bin/env pwsh
# Test 2: Authorization & Privilege Escalation - Try accessing role-restricted endpoints with lower-privilege tokens

param(
    [string]$baseUrl,
    [string]$adminToken,
    [string]$farmerToken,
    [string]$buyerToken,
    [ref]$results,
    [ref]$counter
)

$testResults = @()

function Test-RoleEndpoint {
    param($endpoint, $method, $token, $role, $body, $description)

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

        # For now, all endpoints return 2xx (no real RBAC implemented)
        $finding = if ($status -ge 200 -and $status -lt 300) { $true } else { $false }

        $testResults += @{
            endpoint = $endpoint
            method = $method
            role = $role
            status = $status
            finding = $finding
            severity = if ($finding) { "MEDIUM" } else { "INFO" }
            response_time_ms = [math]::Round($elapsed, 2)
            test_category = "AuthZ/Privesc"
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

Write-Host "  • Testing GET /api/contracts with farmer token" -ForegroundColor Gray
Test-RoleEndpoint "/api/contracts" "GET" $farmerToken "farmer" $null "Farmer reading contracts" | Out-Null

Write-Host "  • Testing GET /api/contracts with buyer token" -ForegroundColor Gray
Test-RoleEndpoint "/api/contracts" "GET" $buyerToken "buyer" $null "Buyer reading contracts" | Out-Null

Write-Host "  • Testing GET /api/contracts with admin token" -ForegroundColor Gray
Test-RoleEndpoint "/api/contracts" "GET" $adminToken "admin" $null "Admin reading contracts" | Out-Null

Write-Host "  • Testing POST /api/contracts/c1/accept with farmer token (should check contract owner)" -ForegroundColor Gray
Test-RoleEndpoint "/api/contracts/c1/accept" "POST" $farmerToken "farmer" "{}" "Farmer accepting contract" | Out-Null

Write-Host "  • Testing POST /api/contracts/c1/accept with buyer token (should check contract owner)" -ForegroundColor Gray
Test-RoleEndpoint "/api/contracts/c1/accept" "POST" $buyerToken "buyer" "{}" "Buyer accepting contract" | Out-Null

Write-Host "  • Testing PUT /api/contracts/c1/progress with different roles" -ForegroundColor Gray
Test-RoleEndpoint "/api/contracts/c1/progress" "PUT" $farmerToken "farmer" '{"progress":"delivered"}' "Farmer updating progress" | Out-Null
Test-RoleEndpoint "/api/contracts/c1/progress" "PUT" $buyerToken "buyer" '{"progress":"delivered"}' "Buyer updating progress" | Out-Null

$testResults

