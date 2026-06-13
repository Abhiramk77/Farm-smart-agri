#!/usr/bin/env pwsh
# Test 3: IDOR - Vary ID parameters to access other users' / contracts' data

param(
    [string]$baseUrl,
    [ref]$results,
    [ref]$counter
)

$testResults = @()

function Test-IDOR {
    param($endpoint, $method, $token, $description)

    $startTime = Get-Date

    try {
        $response = curl.exe -s -X $method "$baseUrl$endpoint" `
            $(if ($token) { @("-H"; "Authorization: Bearer $token") }) `
            -H "Content-Type: application/json" `
            -w "`n%{http_code}" --max-time 10

        $lines = $response -split "`n"
        $status = [int]$lines[-1]
        $body_resp = $lines[0..($lines.Count-2)] -join "`n"

        $elapsed = ((Get-Date) - $startTime).TotalMilliseconds

        $testResults += @{
            endpoint = $endpoint
            method = $method
            status = $status
            finding = if ($status -ge 200 -and $status -lt 300) { $true } else { $false }
            severity = if ($status -ge 200 -and $status -lt 300) { "HIGH" } else { "INFO" }
            response_time_ms = [math]::Round($elapsed, 2)
            test_category = "IDOR"
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

Write-Host "  • Testing GET /api/contracts/c1 (read any contract)" -ForegroundColor Gray
Test-IDOR "/api/contracts/c1" "GET" $null "Read contract c1 without auth" | Out-Null

Write-Host "  • Testing GET /api/contracts/c2 (read another contract)" -ForegroundColor Gray
Test-IDOR "/api/contracts/c2" "GET" $null "Read contract c2 without auth" | Out-Null

Write-Host "  • Testing GET /api/contracts/c3 (read third contract)" -ForegroundColor Gray
Test-IDOR "/api/contracts/c3" "GET" $null "Read contract c3 without auth" | Out-Null

Write-Host "  • Testing GET /api/contracts/nonexistent (test error handling)" -ForegroundColor Gray
Test-IDOR "/api/contracts/nonexistent_contract_xyz" "GET" $null "Access non-existent contract" | Out-Null

Write-Host "  • Testing cross-user access: GET /api/auth/me with another user's token" -ForegroundColor Gray
Test-IDOR "/api/auth/me" "GET" "mock_token_u2" "User u2 accessing their profile" | Out-Null

Write-Host "  • Testing contract modification without auth (accept)" -ForegroundColor Gray
Test-IDOR "/api/contracts/c1/accept" "POST" $null "Accept contract without ownership check" | Out-Null

Write-Host "  • Testing contract modification without auth (reject)" -ForegroundColor Gray
Test-IDOR "/api/contracts/c1/reject" "POST" $null "Reject contract without ownership check" | Out-Null

Write-Host "  • Testing contract modification without auth (progress update)" -ForegroundColor Gray
Test-IDOR "/api/contracts/c1/progress" "PUT" $null "Update progress without ownership check" | Out-Null

$testResults

