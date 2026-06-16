$ErrorActionPreference = "Continue"
$scriptDir  = Split-Path -Parent $MyInvocation.MyCommand.Path
$configPath = Join-Path (Split-Path $scriptDir -Parent) "input.json"
$config     = Get-Content $configPath -Raw | ConvertFrom-Json
$BASE       = $config.baseUrl.TrimEnd("/")

$TOKEN_ADMIN  = $config.admin
$TOKEN_FARMER = $config.farmer
$TOKEN_BUYER  = $config.buyer

Write-Host "=== Smart Agri DAST Suite ===" -ForegroundColor Cyan
Write-Host "Target: $BASE" -ForegroundColor Cyan

$results = [System.Collections.Generic.List[object]]::new()

function Probe {
    param(
        [string]$Ep,
        [string]$Meth   = "GET",
        [string]$Role   = "none",
        [string]$Tok    = "",
        [string]$BodyJ  = "",
        [string]$Cat,
        [string]$Note   = "",
        [int]$Exp       = 200,
        [string]$Sev    = "INFO"
    )
    $url  = "$BASE$Ep"
    $hdrs = @{ "Content-Type" = "application/json" }
    if ($Tok -ne "") { $hdrs["Authorization"] = "Bearer $Tok" }

    $t0  = Get-Date
    $sc  = 0
    $bdy = ""
    try {
        $p = @{ Uri=$url; Method=$Meth; Headers=$hdrs; UseBasicParsing=$true; TimeoutSec=10 }
        if ($BodyJ -ne "") { $p["Body"] = $BodyJ }
        $r   = Invoke-WebRequest @p
        $sc  = [int]$r.StatusCode
        $bdy = $r.Content
    } catch [System.Net.WebException] {
        if ($_.Exception.Response) {
            $sc = [int]$_.Exception.Response.StatusCode
            try {
                $sr  = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
                $bdy = $sr.ReadToEnd()
            } catch {}
        }
    } catch { $sc = -1 }

    $ms      = [math]::Round(((Get-Date)-$t0).TotalMilliseconds)
    $finding = ($sc -ge 200 -and $sc -lt 300 -and $Exp -ge 400)
    $sev2    = if ($finding) { $Sev } else { "INFO" }
    $obj = [ordered]@{
        endpoint         = $Ep
        method           = $Meth
        role             = $Role
        status           = $sc
        expected_status  = $Exp
        finding          = $finding
        severity         = $sev2
        response_time_ms = $ms
        test_category    = $Cat
        note             = $Note
        timestamp        = (Get-Date -Format "yyyy-MM-ddTHH:mm:sszzz")
        body_snippet     = ($bdy -replace "`r|`n"," ").Substring(0, [Math]::Min(150,$bdy.Length))
    }
    $icon  = if ($finding) { "FIND" } elseif ($sc -le 0) { "ERR " } else { "ok  " }
    $color = if ($finding) { "Red" } elseif ($sc -le 0) { "Yellow" } else { "Green" }
    Write-Host ("  [{0}] {1,-5} {2,-45} role={3,-8} got={4} exp={5} ({6}ms)" -f $icon,$Meth,$Ep,$Role,$sc,$Exp,$ms) -ForegroundColor $color
    $script:results.Add($obj)
}

# ---------------------------------------------------------------
# CAT 1  AuthN Bypass
# ---------------------------------------------------------------
Write-Host "`n[CAT 1] AuthN Bypass" -ForegroundColor Magenta

# /api/auth/me must reject no token
Probe -Ep "/api/auth/me" -Meth "GET" -Role "none" -Tok "" `
      -Cat "AuthN Bypass" -Note "No token on protected endpoint" -Exp 401 -Sev "CRITICAL"

# malformed token
Probe -Ep "/api/auth/me" -Meth "GET" -Role "none" -Tok "BADTOKEN" `
      -Cat "AuthN Bypass" -Note "Malformed token" -Exp 401 -Sev "CRITICAL"

# endpoints that have no auth enforced at all — unauthenticated access
$noAuthEps = @(
    @{ ep="/api/contracts";              m="GET";  note="GET contracts unauth" }
    @{ ep="/api/contracts/marketplace";  m="GET";  note="GET marketplace unauth" }
    @{ ep="/api/contracts/c1";           m="GET";  note="GET contract by ID unauth" }
    @{ ep="/api/chats";                  m="GET";  note="GET chats unauth" }
    @{ ep="/api/contracts/c1/accept";    m="POST"; note="Accept contract unauth" }
    @{ ep="/api/contracts/c1/reject";    m="POST"; note="Reject contract unauth" }
)
foreach ($x in $noAuthEps) {
    Probe -Ep $x.ep -Meth $x.m -Role "none" -Tok "" `
          -Cat "AuthN Bypass" -Note $x.note -Exp 401 -Sev "CRITICAL"
}

# POST contract with no auth
$newContract = '{"product":"TestCrop","quantity":"10kg","price":"5","buyerName":"TestBuyer","category":"agriculture"}'
Probe -Ep "/api/contracts" -Meth "POST" -Role "none" -Tok "" -BodyJ $newContract `
      -Cat "AuthN Bypass" -Note "POST contract unauth" -Exp 401 -Sev "CRITICAL"

# ---------------------------------------------------------------
# CAT 2  AuthZ / Privilege Escalation
# ---------------------------------------------------------------
Write-Host "`n[CAT 2] AuthZ / Privilege Escalation" -ForegroundColor Magenta

# Buyer calling farmer-only actions
Probe -Ep "/api/contracts/c1/accept" -Meth "POST" -Role "buyer" -Tok $TOKEN_BUYER `
      -Cat "AuthZ/PrivEsc" -Note "Buyer calls farmer-only accept" -Exp 403 -Sev "HIGH"
Probe -Ep "/api/contracts/c1/reject" -Meth "POST" -Role "buyer" -Tok $TOKEN_BUYER `
      -Cat "AuthZ/PrivEsc" -Note "Buyer calls farmer-only reject" -Exp 403 -Sev "HIGH"

# Admin calling farmer-only actions (no admin-bypass guard expected)
Probe -Ep "/api/contracts/c1/accept" -Meth "POST" -Role "admin" -Tok $TOKEN_ADMIN `
      -Cat "AuthZ/PrivEsc" -Note "Admin calls farmer-only accept (should be 403)" -Exp 403 -Sev "HIGH"
Probe -Ep "/api/contracts/c1/reject" -Meth "POST" -Role "admin" -Tok $TOKEN_ADMIN `
      -Cat "AuthZ/PrivEsc" -Note "Admin calls farmer-only reject (should be 403)" -Exp 403 -Sev "HIGH"

# PUT progress — should be farmer only
$progBody = '{"progress":"growing"}'
Probe -Ep "/api/contracts/c2/progress" -Meth "PUT" -Role "buyer" -Tok $TOKEN_BUYER -BodyJ $progBody `
      -Cat "AuthZ/PrivEsc" -Note "Buyer calls PUT progress (farmer-only)" -Exp 403 -Sev "HIGH"
Probe -Ep "/api/contracts/c2/progress" -Meth "PUT" -Role "admin" -Tok $TOKEN_ADMIN -BodyJ $progBody `
      -Cat "AuthZ/PrivEsc" -Note "Admin calls PUT progress (farmer-only)" -Exp 403 -Sev "HIGH"

# ---------------------------------------------------------------
# CAT 3  IDOR
# ---------------------------------------------------------------
Write-Host "`n[CAT 3] IDOR" -ForegroundColor Magenta

# Contract ID traversal
foreach ($id in @("c1","c2","c3","c999","u1","0")) {
    $expCode = if ($id -in @("c1","c2","c3")) { 200 } else { 404 }
    Probe -Ep "/api/contracts/$id" -Meth "GET" -Role "buyer" -Tok $TOKEN_BUYER `
          -Cat "IDOR" -Note "Contract traversal id=$id" -Exp $expCode -Sev "HIGH"
}

# /api/auth/me with another user's token (farmer using admin token)
Probe -Ep "/api/auth/me" -Meth "GET" -Role "farmer" -Tok "mock_token_u1" `
      -Cat "IDOR" -Note "Farmer using admin user token (u1) directly" -Exp 200 -Sev "HIGH"

# Path traversal attempt
Probe -Ep "/api/contracts/../chats" -Meth "GET" -Role "buyer" -Tok $TOKEN_BUYER `
      -Cat "IDOR" -Note "Path traversal via contract id" -Exp 404 -Sev "MEDIUM"

# ---------------------------------------------------------------
# CAT 4  RBAC Matrix
# ---------------------------------------------------------------
Write-Host "`n[CAT 4] RBAC Matrix" -ForegroundColor Magenta

$rbacRows = @(
    @{ ep="/api/contracts";              m="GET";  admin=200; farmer=200; buyer=200 }
    @{ ep="/api/contracts/marketplace";  m="GET";  admin=200; farmer=200; buyer=200 }
    @{ ep="/api/contracts/c1";           m="GET";  admin=200; farmer=200; buyer=200 }
    @{ ep="/api/chats";                  m="GET";  admin=200; farmer=200; buyer=200 }
    @{ ep="/api/auth/me";                m="GET";  admin=200; farmer=200; buyer=200 }
    @{ ep="/api/contracts/c1/accept";    m="POST"; admin=403; farmer=200; buyer=403 }
    @{ ep="/api/contracts/c1/reject";    m="POST"; admin=403; farmer=200; buyer=403 }
)
foreach ($row in $rbacRows) {
    foreach ($role in @("admin","farmer","buyer")) {
        $tok = if($role -eq "admin"){$TOKEN_ADMIN} elseif($role -eq "farmer"){$TOKEN_FARMER} else {$TOKEN_BUYER}
        $exp = $row[$role]
        $sev = if($exp -ge 400){"HIGH"} else {"INFO"}
        Probe -Ep $row.ep -Meth $row.m -Role $role -Tok $tok `
              -Cat "RBAC Matrix" -Note "RBAC $role on $($row.m) $($row.ep)" -Exp $exp -Sev $sev
    }
}

# ---------------------------------------------------------------
# CAT 5  Token Tampering
# ---------------------------------------------------------------
Write-Host "`n[CAT 5] Token Tampering" -ForegroundColor Magenta

$tampered = @(
    @{ tok="mock_token_u999";  note="Guessed non-existent userId" }
    @{ tok="mock_token_admin"; note="Role string as user ID" }
    @{ tok="mock_token_";      note="Empty user ID" }
    @{ tok="null";             note="Literal string null" }
    @{ tok="undefined";        note="Literal string undefined" }
)
foreach ($t in $tampered) {
    Probe -Ep "/api/auth/me" -Meth "GET" -Role "tampered" -Tok $t.tok `
          -Cat "Token Tampering" -Note $t.note -Exp 401 -Sev "CRITICAL"
}

# alg=none attack (base64url-encoded, no signature)
$algNoneJwt = "eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0.eyJzdWIiOiJ1MSIsInJvbGUiOiJhZG1pbiJ9."
Probe -Ep "/api/auth/me" -Meth "GET" -Role "tampered" -Tok $algNoneJwt `
      -Cat "Token Tampering" -Note "alg=none JWT with admin claim (unsigned)" -Exp 401 -Sev "CRITICAL"

# ---------------------------------------------------------------
# CAT 6  Injection Detection
# ---------------------------------------------------------------
Write-Host "`n[CAT 6] Injection Detection" -ForegroundColor Magenta

# status query param probes
$sqliPayloads = @(
    "pending%27%20OR%20%271%27%3D%271",
    "pending%27%20OR%201%3D1--",
    "%7B%22%24gt%22%3A%22%22%7D",
    "%7B%22%24where%22%3A%221%3D%3D1%22%7D"
)
foreach ($p in $sqliPayloads) {
    Probe -Ep "/api/contracts?status=$p" -Meth "GET" -Role "farmer" -Tok $TOKEN_FARMER `
          -Cat "Injection" -Note "Injection probe in ?status: $p" -Exp 200 -Sev "MEDIUM"
}

# POST body with injected fields
$injBody1 = '{"product":"OR 1=1","quantity":"1kg","price":"1","buyerName":"Tester","category":"agri"}'
Probe -Ep "/api/contracts" -Meth "POST" -Role "buyer" -Tok $TOKEN_BUYER -BodyJ $injBody1 `
      -Cat "Injection" -Note "SQLi chars in product field" -Exp 201 -Sev "MEDIUM"

# Login with injection in email
$injEmail = '{"email":"admin@farming.com OR 1=1--","role":"admin"}'
Probe -Ep "/api/auth/login" -Meth "POST" -Role "none" -BodyJ $injEmail `
      -Cat "Injection" -Note "SQLi in login email" -Exp 401 -Sev "HIGH"

# XSS stored via POST
$xssBody = '{"product":"<script>alert(1)</script>","quantity":"1kg","price":"1","buyerName":"XSSBuyer","category":"agri"}'
Probe -Ep "/api/contracts" -Meth "POST" -Role "buyer" -Tok $TOKEN_BUYER -BodyJ $xssBody `
      -Cat "Injection" -Note "Stored XSS probe via product field" -Exp 201 -Sev "MEDIUM"

# ---------------------------------------------------------------
# CAT 7  Rate Limiting (30-req burst)
# ---------------------------------------------------------------
Write-Host "`n[CAT 7] Rate Limiting (30-req burst)" -ForegroundColor Magenta

$burstEp   = "$BASE/api/contracts"
$hitAt     = 0
$got429    = $false
for ($i = 1; $i -le 30; $i++) {
    try {
        $r = Invoke-WebRequest -Uri $burstEp -Method GET -UseBasicParsing -TimeoutSec 5
        if ([int]$r.StatusCode -eq 429) { $hitAt = $i; $got429 = $true; break }
    } catch [System.Net.WebException] {
        if ($_.Exception.Response -and [int]$_.Exception.Response.StatusCode -eq 429) {
            $hitAt = $i; $got429 = $true; break
        }
    }
    Start-Sleep -Milliseconds 100
}
$rlFinding = -not $got429
$rlNote    = if ($rlFinding) { "No 429 after 30 requests — no rate limit detected" } else { "Rate limited at request #$hitAt" }
Write-Host ("  [{0}] Rate limit: {1}" -f (if($rlFinding){"FIND"}else{"ok  "}), $rlNote) -ForegroundColor $(if($rlFinding){"Red"}else{"Green"})
$results.Add([ordered]@{
    endpoint         = "/api/contracts"
    method           = "GET"
    role             = "none"
    status           = if ($got429) { 429 } else { 200 }
    expected_status  = 429
    finding          = $rlFinding
    severity         = if ($rlFinding) { "HIGH" } else { "INFO" }
    response_time_ms = 0
    test_category    = "Rate Limiting"
    note             = $rlNote
    timestamp        = (Get-Date -Format "yyyy-MM-ddTHH:mm:sszzz")
    body_snippet     = ""
})

# ---------------------------------------------------------------
# CAT 8  Hardcoded Secrets (static scan results embedded)
# ---------------------------------------------------------------
Write-Host "`n[CAT 8] Hardcoded Secrets (static scan)" -ForegroundColor Magenta

$staticFindings = @(
    @{
        file="smart_agri_app/lib/firebase_options.dart"
        note="Firebase API keys (AIzaSy...) hardcoded for web/Android/iOS/macOS/Windows — committed to source, not in .gitignore"
        sev="CRITICAL"
    }
    @{
        file="smart_agri_app/firebase.json"
        note="Firebase projectId and platform appIds committed in source"
        sev="HIGH"
    }
    @{
        file="backend/index.js + backend/data.js"
        note="Token scheme is mock_token_<userId> — trivially guessable, not cryptographically signed. Any user knowing IDs (u1,u2,u3) can impersonate any account"
        sev="CRITICAL"
    }
    @{
        file=".gitignore"
        note=".env ignored but firebase_options.dart and google-services.json output path are NOT ignored — live credentials in git history"
        sev="HIGH"
    }
)

foreach ($s in $staticFindings) {
    $icon = "FIND"
    Write-Host ("  [{0}] SCAN   {1,-55} {2}" -f $icon, $s.file, $s.sev) -ForegroundColor Red
    $results.Add([ordered]@{
        endpoint         = "N/A (static)"
        method           = "SCAN"
        role             = "static"
        status           = "N/A"
        expected_status  = "N/A"
        finding          = $true
        severity         = $s.sev
        response_time_ms = 0
        test_category    = "Hardcoded Secrets"
        note             = "$($s.file): $($s.note)"
        timestamp        = (Get-Date -Format "yyyy-MM-ddTHH:mm:sszzz")
        body_snippet     = ""
    })
}

# ---------------------------------------------------------------
# Write report.json
# ---------------------------------------------------------------
Write-Host "`nWriting report.json ..." -ForegroundColor Magenta

$findings  = $results | Where-Object { $_.finding -eq $true }
$crit      = ($findings | Where-Object { $_.severity -eq "CRITICAL" }).Count
$high      = ($findings | Where-Object { $_.severity -eq "HIGH"     }).Count
$medium    = ($findings | Where-Object { $_.severity -eq "MEDIUM"   }).Count
$low       = ($findings | Where-Object { $_.severity -eq "LOW"      }).Count

$report = [ordered]@{
    meta = [ordered]@{
        baseUrl        = $BASE
        timestamp      = (Get-Date -Format "yyyy-MM-ddTHH:mm:sszzz")
        tool           = "Smart Agri DAST Suite v2"
        endpointsFound = 11
        totalTests     = $results.Count
        findingsCount  = $findings.Count
    }
    summary = [ordered]@{
        critical = $crit
        high     = $high
        medium   = $medium
        low      = $low
    }
    tests = $results
}

$reportPath = Join-Path $scriptDir "report.json"
$report | ConvertTo-Json -Depth 10 | Set-Content $reportPath -Encoding UTF8
Write-Host "Saved: $reportPath" -ForegroundColor Green

# ---------------------------------------------------------------
# Summary
# ---------------------------------------------------------------
Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host " DAST SUMMARY" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  Endpoints discovered : 11"
Write-Host "  Total tests run      : $($results.Count)"
Write-Host "  Findings             : $($findings.Count)"
Write-Host "  [X] CRITICAL : $crit" -ForegroundColor Red
Write-Host "  [X] HIGH     : $high" -ForegroundColor DarkRed
Write-Host "  [!] MEDIUM   : $medium" -ForegroundColor Yellow
Write-Host "  [!] LOW      : $low"   -ForegroundColor DarkYellow
Write-Host ""
Write-Host "  Top issues (priority order):" -ForegroundColor White
$rank = 1
foreach ($f in ($findings | Sort-Object { switch($_.severity){"CRITICAL"{0}"HIGH"{1}"MEDIUM"{2}"LOW"{3}"INFO"{4}} })) {
    $c = if($f.severity -eq "CRITICAL"){"Red"} elseif($f.severity -eq "HIGH"){"DarkRed"} else {"Yellow"}
    Write-Host ("  {0,2}. [{1}] {2} {3}  — {4}" -f $rank,$f.severity,$f.method,$f.endpoint,$f.note) -ForegroundColor $c
    $rank++
    if ($rank -gt 12) { Write-Host "      ... see report.json for full list"; break }
}
Write-Host ""
