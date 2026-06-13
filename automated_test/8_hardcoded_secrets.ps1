#!/usr/bin/env pwsh
# Test 8: Hardcoded Credentials & Secrets Scan

param(
    [string]$rootDir,
    [ref]$results,
    [ref]$counter
)

$testResults = @()

Write-Host "  • Scanning codebase for hardcoded credentials and secrets" -ForegroundColor Gray

# Patterns to detect hardcoded secrets
$secretPatterns = @(
    @{
        name = "Hardcoded passwords"
        pattern = "password\s*[=:]\s*['\"]([^'\"]+)['\"]"
        severity = "CRITICAL"
    },
    @{
        name = "API keys"
        pattern = "(apikey|api_key|api-key|key)\s*[=:]\s*['\"]([a-zA-Z0-9\-_]{20,})['\"]"
        severity = "CRITICAL"
    },
    @{
        name = "Database connection strings"
        pattern = "(mongodb|mysql|postgres|connectionstring)\s*[=:]\s*['\"]([^'\"]+)['\"]"
        severity = "CRITICAL"
    },
    @{
        name = "JWT secrets"
        pattern = "(secret|jwt_secret|private_key)\s*[=:]\s*['\"]([^'\"]+)['\"]"
        severity = "CRITICAL"
    },
    @{
        name = "AWS credentials"
        pattern = "(aws_access_key|aws_secret|AKIA[0-9A-Z])"
        severity = "CRITICAL"
    },
    @{
        name = "Firebase credentials"
        pattern = "\"type\":\s*\"service_account\""
        severity = "HIGH"
    },
    @{
        name = "OAuth tokens"
        pattern = "(oauth_token|access_token|refresh_token)\s*[=:]\s*['\"]([a-zA-Z0-9\-_]{30,})['\"]"
        severity = "HIGH"
    }
)

$credentials_found = @()

# Scan JavaScript files
Write-Host "    Scanning backend JavaScript files..." -ForegroundColor DarkGray
$jsFiles = @(
    "$rootDir\backend\data.js",
    "$rootDir\backend\index.js"
)

foreach ($file in $jsFiles) {
    if (Test-Path $file) {
        $content = Get-Content $file -Raw

        foreach ($pattern in $secretPatterns) {
            if ($content -match $pattern.pattern) {
                $credentials_found += @{
                    type = $pattern.name
                    file = $file
                    severity = $pattern.severity
                    finding = $true
                }

                Write-Host "      ⚠ Potential $($pattern.name) found in $file" -ForegroundColor Yellow
            }
        }
    }
}

# Check for .env files
Write-Host "    Checking for .env files..." -ForegroundColor DarkGray
$envFiles = Get-ChildItem -Path $rootDir -Filter ".env*" -Recurse -ErrorAction SilentlyContinue
foreach ($envFile in $envFiles) {
    $credentials_found += @{
        type = ".env file"
        file = $envFile.FullName
        severity = "HIGH"
        finding = $true
        note = "Environment file not in .gitignore"
    }
    Write-Host "      ⚠ .env file found: $($envFile.FullName)" -ForegroundColor Yellow
}

# Check for credentials in package.json scripts (common mistake)
Write-Host "    Checking package.json for embedded credentials..." -ForegroundColor DarkGray
$pkgFiles = Get-ChildItem -Path $rootDir -Filter "package.json" -Recurse
foreach ($pkgFile in $pkgFiles) {
    $content = Get-Content $pkgFile -Raw
    if ($content -match "(password|token|secret|key)\s*[=:]\s*['\"]") {
        $credentials_found += @{
            type = "Credentials in package.json"
            file = $pkgFile.FullName
            severity = "HIGH"
            finding = $true
        }
        Write-Host "      ⚠ Potential credential in $($pkgFile.FullName)" -ForegroundColor Yellow
    }
}

# Check for Firebase JSON files
Write-Host "    Checking for Firebase configuration files..." -ForegroundColor DarkGray
$firebaseFiles = Get-ChildItem -Path $rootDir -Filter "google-services.json" -Recurse -ErrorAction SilentlyContinue
foreach ($fbFile in $firebaseFiles) {
    $credentials_found += @{
        type = "Firebase google-services.json"
        file = $fbFile.FullName
        severity = "HIGH"
        finding = $true
        note = "Service account credentials potentially exposed"
    }
    Write-Host "      ⚠ Firebase config found: $($fbFile.FullName)" -ForegroundColor Yellow
}

# Add results
foreach ($cred in $credentials_found) {
    $testResults += @{
        type = $cred.type
        file = ($cred.file -replace [regex]::Escape($rootDir), "<ROOT>")
        finding = $true
        severity = $cred.severity
        test_category = "Hardcoded Secrets"
        note = $cred.note ?? "Potential hardcoded credential detected"
        timestamp = Get-Date -Format "o"
    }
    $counter.Value++
}

if ($credentials_found.Count -eq 0) {
    Write-Host "    ✓ No obvious hardcoded credentials detected in common patterns" -ForegroundColor Green
    $testResults += @{
        type = "Hardcoded Credentials Scan"
        file = $rootDir
        finding = $false
        severity = "INFO"
        test_category = "Hardcoded Secrets"
        note = "No obvious hardcoded credentials found"
        timestamp = Get-Date -Format "o"
    }
    $counter.Value++
}

$testResults

