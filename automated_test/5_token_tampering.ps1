#!/usr/bin/env pwsh
# Test 5: Token Tampering - Modify JWT claims without valid signature

param(
    [string]$baseUrl,
    [ref]$results,
    [ref]$counter
)

$testResults = @()

function Test-TokenTamper {
    param($endpoint, $method, $tamperedToken, $description)

    $startTime = Get-Date

    try {
        $response = curl.exe -s -X $method "$baseUrl$endpoint" `
            -H "Authorization: Bearer $tamperedToken" `
            -H "Content-Type: application/json" `
            -w "`n%{http_code}" --max-time 10

        $lines = $response -split "`n"
        $status = [int]$lines[-1]
        $body_resp = $lines[0..($lines.Count-2)] -join "`n"

        $elapsed = ((Get-Date) - $startTime).TotalMilliseconds

        $finding = if ($status -ge 200 -and $status -lt 300) { $true } else { $false }

        $testResults += @{
            endpoint = $endpoint
            method = $method
            status = $status
            response_preview = $body_resp.Substring(0, [Math]::Min(100, $body_resp.Length))
            finding = $finding
            severity = if ($finding) { "CRITICAL" } else { "INFO" }
            response_time_ms = [math]::Round($elapsed, 2)
            test_category = "Token Tampering"
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

Write-Host "  • Testing token with modified userId in token" -ForegroundColor Gray
Test-TokenTamper "/api/auth/me" "GET" "mock_token_u999_tampered" "Tampered token with modified user ID" | Out-Null

Write-Host "  • Testing token with gibberish characters" -ForegroundColor Gray
Test-TokenTamper "/api/auth/me" "GET" "definitely_not_a_valid_token_1234567890" "Completely invalid token format" | Out-Null

Write-Host "  • Testing token with extra characters appended" -ForegroundColor Gray
Test-TokenTamper "/api/auth/me" "GET" "mock_token_u1_TAMPERED_DATA_HERE" "Valid token prefix with tampered suffix" | Out-Null

Write-Host "  • Testing empty token" -ForegroundColor Gray
Test-TokenTamper "/api/auth/me" "GET" "" "Empty token string" | Out-Null

Write-Host "  • Testing null-like token strings" -ForegroundColor Gray
Test-TokenTamper "/api/auth/me" "GET" "null" "Token value 'null'" | Out-Null

$testResults

