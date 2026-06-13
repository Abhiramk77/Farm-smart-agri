#!/usr/bin/env pwsh
# Test 7: Rate Limiting - Send bounded burst of requests to check for rate limits

param(
    [string]$baseUrl,
    [ref]$results,
    [ref]$counter
)

$testResults = @()

Write-Host "  • Sending 30 rapid requests to /api/chats (checking for rate limiting)" -ForegroundColor Gray

$endpoint = "/api/chats"
$burst_count = 30
$hitting_rate_limit = $false
$rate_limit_hit_at = -1

for ($i = 1; $i -le $burst_count; $i++) {
    $startTime = Get-Date

    try {
        $response = curl.exe -s -X GET "$baseUrl$endpoint" `
            -H "Content-Type: application/json" `
            --max-time 5 `
            -w "`n%{http_code}"

        $lines = $response -split "`n"
        $status = [int]$lines[-1]

        $elapsed = ((Get-Date) - $startTime).TotalMilliseconds

        # Check for rate limit responses (429 Too Many Requests)
        if ($status -eq 429) {
            $hitting_rate_limit = $true
            $rate_limit_hit_at = $i
        }

        if ($i % 10 -eq 0 -or $hitting_rate_limit) {
            Write-Host "      Request $i/$burst_count - Status: $status" -ForegroundColor DarkGray
        }

        $testResults += @{
            endpoint = $endpoint
            method = "GET"
            request_number = $i
            status = $status
            response_time_ms = [math]::Round($elapsed, 2)
            test_category = "Rate Limiting"
            note = "Burst stress test request $i"
            timestamp = Get-Date -Format "o"
        }

        $counter.Value++

        # Small delay between requests (10ms)
        Start-Sleep -Milliseconds 10
    }
    catch {
        Write-Host "  ✗ Error on request $i : $_" -ForegroundColor Red
    }
}

# Summary of rate limiting test
$rate_limit_finding = $testResults | Where-Object { $_.status -eq 429 }
$summary_result = @{
    endpoint = "/api/chats"
    method = "GET"
    test_type = "Rate Limiting Burst"
    burst_count = $burst_count
    rate_limit_detected = $hitting_rate_limit
    hit_at_request = $rate_limit_hit_at
    status_429_count = ($rate_limit_finding | Measure-Object).Count
    finding = -not $hitting_rate_limit  # Finding = no rate limiting detected
    severity = if (-not $hitting_rate_limit) { "MEDIUM" } else { "INFO" }
    test_category = "Rate Limiting"
    note = if ($hitting_rate_limit) { "Rate limiting detected at request $rate_limit_hit_at" } else { "NO RATE LIMITING DETECTED - API is vulnerable to brute force" }
    timestamp = Get-Date -Format "o"
}

$testResults += $summary_result
$counter.Value++

$testResults

