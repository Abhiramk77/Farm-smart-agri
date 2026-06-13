#!/usr/bin/env pwsh
# Test 6: Injection Detection - SQLi/NoSQLi detection payloads (detection only, non-destructive)

param(
    [string]$baseUrl,
    [ref]$results,
    [ref]$counter
)

$testResults = @()

# Common SQLi detection payloads (detection only - no actual data exfiltration)
$sqlPayloads = @(
    "' OR '1'='1",
    "' OR 1=1--",
    "' UNION SELECT NULL--",
    "'; DROP TABLE--",
    "1' AND SLEEP(5)--",
    "1' OR BENCHMARK(5000000,MD5('A'))--"
)

# NoSQL injection payloads
$noSqlPayloads = @(
    '{"$ne":null}',
    '{"$gt":""}',
    '{"$regex":".*"}',
    '{},{"$where":"1==1"}'
)

function Test-Injection {
    param($endpoint, $method, $payload, $paramName, $description)

    $startTime = Get-Date

    try {
        # Build query string or body with payload
        $injectionEndpoint = "$endpoint`?$paramName=$([uri]::EscapeDataString($payload))"

        $response = curl.exe -s -X $method "$baseUrl$injectionEndpoint" `
            -H "Content-Type: application/json" `
            --max-time 10 `
            -w "`n%{http_code}`n%{time_total}"

        $lines = $response -split "`n"
        $status = [int]$lines[-2]
        $timeTotal = [double]$lines[-1]
        $body_resp = $lines[0..($lines.Count-3)] -join "`n"

        $elapsed = [math]::Round($timeTotal * 1000, 2)

        # Detection: Look for error strings that suggest vulnerable behavior
        $hasInjectionIndicator = $body_resp -match "(syntax|error|unexpected|warning|quoted string|malformed|invalid query|mongodb|exception)" -or $timeTotal -gt 5

        $testResults += @{
            endpoint = $injectionEndpoint.Substring(0, [Math]::Min(100, $injectionEndpoint.Length))
            method = $method
            status = $status
            payload_excerpt = if ($payload.Length -gt 50) { $payload.Substring(0, 50) + "..." } else { $payload }
            suspicious_response = $hasInjectionIndicator
            response_time_ms = $elapsed
            finding = if ($hasInjectionIndicator) { $true } else { $false }
            severity = if ($hasInjectionIndicator) { "HIGH" } else { "INFO" }
            test_category = "Injection Detection"
            note = $description
            timestamp = Get-Date -Format "o"
        }

        $counter.Value++
        return $testResults[-1]
    }
    catch {
        Write-Host "  ✗ Error testing $description : $_" -ForegroundColor DarkRed
        return $null
    }
}

Write-Host "  • Testing SQLi in query parameters" -ForegroundColor Gray
foreach ($payload in $sqlPayloads[0..2]) {
    Test-Injection "/api/contracts" "GET" $payload "status" "SQLi detection: $($payload.Substring(0, [Math]::Min(30, $payload.Length)))" | Out-Null
}

Write-Host "  • Testing NoSQL injection patterns" -ForegroundColor Gray
foreach ($payload in $noSqlPayloads[0..2]) {
    Test-Injection "/api/contracts" "GET" $payload "query" "NoSQL detection: $($payload.Substring(0, [Math]::Min(30, $payload.Length)))" | Out-Null
}

Write-Host "  • Testing time-based injection detection" -ForegroundColor Gray
Test-Injection "/api/contracts" "GET" "c1' AND SLEEP(3)--" "id" "Time-based blind SQLi" | Out-Null

$testResults

