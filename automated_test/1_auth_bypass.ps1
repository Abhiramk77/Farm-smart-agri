#!/usr/bin/env pwsh
# Test 1: Authentication Bypass - Try accessing protected endpoints without/with invalid tokens

param(
    [string]$baseUrl,
    [ref]$results,
    [ref]$counter
)

$testResults = @()

function Test-Endpoint {
    param($endpoint, $method, $expectedStatus, $token, $body, $description)

    $startTime = Get-Date
    $headers = @{"Content-Type" = "application/json"}
    if ($token) { $headers["Authorization"] = "Bearer $token" }

    try {
        $response = curl.exe -s -X $method "$baseUrl$endpoint" `
            $(if ($token) { @("-H"; "Authorization: Bearer $token") }) `
            -H "Content-Type: application/json" `
            $(if ($body) { @("-d"; $body) }) `
            -w "`n%{http_code}" --max-time 10

        $lines = $response -split "`n"
        $status = [int]$lines[-1]
        $body = $lines[0..($lines.Count-2)] -join "`n"

        $elapsed = ((Get-Date) - $startTime).TotalMilliseconds

        $finding = $false
        if ($status -ne $expectedStatus) {
            $finding = $true
        }

        $testResults += @{
            endpoint = $endpoint
            method = $method
            status = $status
            expected_status = $expectedStatus
            finding = $finding
            severity = if ($finding) { "HIGH" } else { "INFO" }
            response_time_ms = [math]::Round($elapsed, 2)
            test_category = "AuthN Bypass"
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

Write-Host "  • Testing /api/auth/me without token (should 401)" -ForegroundColor Gray
Test-Endpoint "/api/auth/me" "GET" 401 $null $null "No token provided" | Out-Null

Write-Host "  • Testing /api/auth/me with invalid token format (should 401)" -ForegroundColor Gray
Test-Endpoint "/api/auth/me" "GET" 401 "invalid_token_xyz" $null "Invalid token format" | Out-Null

Write-Host "  • Testing /api/auth/me with expired/tampered token (should 401)" -ForegroundColor Gray
Test-Endpoint "/api/auth/me" "GET" 401 "mock_token_nonexistent" $null "Token for non-existent user" | Out-Null

Write-Host "  • Testing /api/contracts without auth (creates contract - should require auth!)" -ForegroundColor Gray
$createBody = @{product="test"; quantity="100"} | ConvertTo-Json
Test-Endpoint "/api/contracts" "POST" 401 $null $createBody "Creating contract without auth - SHOULD BE PROTECTED" | Out-Null

Write-Host "  • Testing /api/contracts/:id/accept without auth (should require auth!)" -ForegroundColor Gray
Test-Endpoint "/api/contracts/c1/accept" "POST" 401 $null "{}" "Accepting contract without auth - SHOULD BE PROTECTED" | Out-Null

$testResults

