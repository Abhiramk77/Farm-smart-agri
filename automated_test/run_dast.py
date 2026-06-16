import json, time, sys, os, datetime
from urllib.request import urlopen, Request
from urllib.error import URLError, HTTPError

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
CONFIG_PATH = os.path.join(SCRIPT_DIR, '..', 'input.json')

with open(CONFIG_PATH) as f:
    config = json.load(f)

BASE          = config['baseUrl'].rstrip('/')
TOKEN_ADMIN   = config.get('admin', '')
TOKEN_FARMER  = config.get('farmer', '')
TOKEN_BUYER   = config.get('buyer', '')

TOKENS = {'admin': TOKEN_ADMIN, 'farmer': TOKEN_FARMER, 'buyer': TOKEN_BUYER, 'none': '', 'tampered': ''}

results = []

def probe(ep, method='GET', role='none', token='', body=None,
          cat='', note='', exp=200, sev='INFO'):
    url = BASE + ep
    headers = {'Content-Type': 'application/json'}
    if token:
        headers['Authorization'] = f'Bearer {token}'

    data = json.dumps(body).encode() if body else None
    req  = Request(url, data=data, headers=headers, method=method)
    t0   = time.time()
    status = 0
    resp_body = ''
    try:
        with urlopen(req, timeout=10) as r:
            status = r.status
            resp_body = r.read().decode(errors='replace')
    except HTTPError as e:
        status = e.code
        try: resp_body = e.read().decode(errors='replace')
        except: pass
    except URLError:
        status = 0
    except Exception:
        status = -1

    ms      = round((time.time() - t0) * 1000)
    finding = (200 <= status < 300 and exp >= 400)
    sev_out = sev if finding else 'INFO'

    icon  = 'FIND' if finding else ('ERR ' if status <= 0 else 'ok  ')
    color = '\033[91m' if finding else ('\033[93m' if status <= 0 else '\033[92m')
    reset = '\033[0m'
    print(f'  [{icon}] {method:<5} {ep:<45} role={role:<8} got={status} exp={exp} ({ms}ms){color}{reset}')

    rec = {
        'endpoint':        ep,
        'method':          method,
        'role':            role,
        'status':          status,
        'expected_status': exp,
        'finding':         finding,
        'severity':        sev_out,
        'response_time_ms': ms,
        'test_category':   cat,
        'note':            note,
        'timestamp':       datetime.datetime.now().isoformat(),
        'body_snippet':    resp_body[:200],
    }
    results.append(rec)
    return rec

print('=' * 60)
print(f' Smart Agri DAST Suite  ---  {BASE}')
print('=' * 60)

# ---------------------------------------------------------------
# CAT 1  AuthN Bypass
# ---------------------------------------------------------------
print('\n[CAT 1] Authentication Bypass')

probe('/api/auth/me', role='none', token='',
      cat='AuthN Bypass', note='No token on protected endpoint', exp=401, sev='CRITICAL')

probe('/api/auth/me', role='none', token='BADTOKEN',
      cat='AuthN Bypass', note='Malformed token', exp=401, sev='CRITICAL')

no_auth_eps = [
    ('/api/contracts',            'GET',  'GET contracts unauthenticated'),
    ('/api/contracts/marketplace','GET',  'GET marketplace unauthenticated'),
    ('/api/contracts/c1',         'GET',  'GET contract by ID unauthenticated'),
    ('/api/chats',                'GET',  'GET chats unauthenticated'),
    ('/api/contracts/c1/accept',  'POST', 'Accept contract unauthenticated'),
    ('/api/contracts/c1/reject',  'POST', 'Reject contract unauthenticated'),
]
for ep, m, note in no_auth_eps:
    probe(ep, method=m, role='none', token='',
          cat='AuthN Bypass', note=note, exp=401, sev='CRITICAL')

# POST contract with no auth
probe('/api/contracts', method='POST', role='none', token='',
      body={'product':'TestCrop','quantity':'10kg','price':'5','buyerName':'TestBuyer','category':'agriculture'},
      cat='AuthN Bypass', note='POST contract unauthenticated', exp=401, sev='CRITICAL')

# ---------------------------------------------------------------
# CAT 2  AuthZ / Privilege Escalation
# ---------------------------------------------------------------
print('\n[CAT 2] Authorization / Privilege Escalation')

probe('/api/contracts/c1/accept', method='POST', role='buyer', token=TOKEN_BUYER,
      cat='AuthZ/PrivEsc', note='Buyer calls farmer-only accept', exp=403, sev='HIGH')
probe('/api/contracts/c1/reject', method='POST', role='buyer', token=TOKEN_BUYER,
      cat='AuthZ/PrivEsc', note='Buyer calls farmer-only reject', exp=403, sev='HIGH')
probe('/api/contracts/c1/accept', method='POST', role='admin', token=TOKEN_ADMIN,
      cat='AuthZ/PrivEsc', note='Admin calls farmer-only accept', exp=403, sev='HIGH')
probe('/api/contracts/c1/reject', method='POST', role='admin', token=TOKEN_ADMIN,
      cat='AuthZ/PrivEsc', note='Admin calls farmer-only reject', exp=403, sev='HIGH')
probe('/api/contracts/c2/progress', method='PUT', role='buyer', token=TOKEN_BUYER,
      body={'progress':'growing'},
      cat='AuthZ/PrivEsc', note='Buyer calls farmer-only PUT progress', exp=403, sev='HIGH')
probe('/api/contracts/c2/progress', method='PUT', role='admin', token=TOKEN_ADMIN,
      body={'progress':'growing'},
      cat='AuthZ/PrivEsc', note='Admin calls farmer-only PUT progress', exp=403, sev='HIGH')

# ---------------------------------------------------------------
# CAT 3  IDOR
# ---------------------------------------------------------------
print('\n[CAT 3] IDOR - Object Reference')

for cid in ['c1','c2','c3','c999','u1','0']:
    exp = 200 if cid in ('c1','c2','c3') else 404
    probe(f'/api/contracts/{cid}', role='buyer', token=TOKEN_BUYER,
          cat='IDOR', note=f'Contract traversal id={cid}', exp=exp, sev='HIGH')

# Farmer using admin's literal token directly (IDOR on /auth/me)
probe('/api/auth/me', role='farmer_using_admin_token', token='mock_token_u1',
      cat='IDOR', note='Farmer using admin user token (mock_token_u1) directly to impersonate', exp=403, sev='HIGH')

# Unauthorized cross-user token use
probe('/api/auth/me', role='buyer_using_farmer_token', token='mock_token_u2',
      cat='IDOR', note='Buyer using farmer token (mock_token_u2) to access farmer profile', exp=403, sev='HIGH')

# ---------------------------------------------------------------
# CAT 4  RBAC Matrix
# ---------------------------------------------------------------
print('\n[CAT 4] RBAC Matrix')

rbac_rows = [
    ('/api/contracts',            'GET',  {'admin':200,'farmer':200,'buyer':200}),
    ('/api/contracts/marketplace','GET',  {'admin':200,'farmer':200,'buyer':200}),
    ('/api/contracts/c1',         'GET',  {'admin':200,'farmer':200,'buyer':200}),
    ('/api/chats',                'GET',  {'admin':200,'farmer':200,'buyer':200}),
    ('/api/auth/me',              'GET',  {'admin':200,'farmer':200,'buyer':200}),
    ('/api/contracts/c1/accept',  'POST', {'admin':403,'farmer':200,'buyer':403}),
    ('/api/contracts/c1/reject',  'POST', {'admin':403,'farmer':200,'buyer':403}),
]

for ep, m, expected in rbac_rows:
    for role in ('admin','farmer','buyer'):
        tok = TOKENS[role]
        exp = expected[role]
        probe(ep, method=m, role=role, token=tok,
              cat='RBAC Matrix',
              note=f'RBAC: {role} on {m} {ep}',
              exp=exp,
              sev='HIGH' if exp >= 400 else 'INFO')

# ---------------------------------------------------------------
# CAT 5  Token Tampering
# ---------------------------------------------------------------
print('\n[CAT 5] Token Tampering')

tampered = [
    ('mock_token_u999',  'Guessed non-existent userId'),
    ('mock_token_admin', 'Role string as user ID'),
    ('mock_token_',      'Empty user ID suffix'),
    ('null',             'Literal string null'),
    ('undefined',        'Literal string undefined'),
    # alg=none JWT: {"alg":"none","typ":"JWT"}.{"sub":"u1","role":"admin"}.
    ('eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0.eyJzdWIiOiJ1MSIsInJvbGUiOiJhZG1pbiJ9.',
     'alg=none JWT with admin claim (unsigned)'),
]
for tok, note in tampered:
    probe('/api/auth/me', role='tampered', token=tok,
          cat='Token Tampering', note=note, exp=401, sev='CRITICAL')

# ---------------------------------------------------------------
# CAT 6  Injection Detection
# ---------------------------------------------------------------
print('\n[CAT 6] Injection Detection')

from urllib.parse import quote

sqli_payloads = [
    "' OR '1'='1",
    "' OR 1=1--",
    '{"$gt":""}',
    '{"$where":"1==1"}',
    "<script>alert(1)</script>",
]
for p in sqli_payloads:
    probe(f'/api/contracts?status={quote(p)}', role='farmer', token=TOKEN_FARMER,
          cat='Injection', note=f'Injection probe in ?status param: {p[:40]}',
          exp=200, sev='MEDIUM')

# POST body injections
probe('/api/contracts', method='POST', role='buyer', token=TOKEN_BUYER,
      body={'product':"' OR 1=1--",'quantity':'1kg','price':'1',
            'buyerName':'Tester','category':'agri'},
      cat='Injection', note='SQLi chars in POST body product field', exp=201, sev='MEDIUM')

probe('/api/contracts', method='POST', role='buyer', token=TOKEN_BUYER,
      body={'product':'<script>alert(1)</script>','quantity':'1kg','price':'1',
            'buyerName':'XSSBuyer','category':'agri'},
      cat='Injection', note='Stored XSS probe via product field', exp=201, sev='MEDIUM')

probe('/api/auth/login', method='POST', role='none',
      body={'email':"admin@farming.com' OR '1'='1",'role':'admin'},
      cat='Injection', note='SQLi in login email field', exp=401, sev='HIGH')

# ---------------------------------------------------------------
# CAT 7  Rate Limiting (30-req burst)
# ---------------------------------------------------------------
print('\n[CAT 7] Rate Limiting (30-req burst)')

hit_at  = 0
got_429 = False
burst_ep = BASE + '/api/contracts'

for i in range(1, 31):
    try:
        with urlopen(Request(burst_ep, method='GET'), timeout=5) as r:
            if r.status == 429:
                hit_at = i; got_429 = True; break
    except HTTPError as e:
        if e.code == 429:
            hit_at = i; got_429 = True; break
    except: break
    time.sleep(0.1)

rl_finding = not got_429
rl_note    = f'No 429 after 30 requests - no rate limit detected' if rl_finding else f'Rate limited at request #{hit_at}'
icon       = 'FIND' if rl_finding else 'ok  '
print(f'  [{icon}] Rate limit: {rl_note}')

results.append({
    'endpoint': '/api/contracts', 'method': 'GET', 'role': 'none',
    'status':   200 if rl_finding else 429,
    'expected_status': 429,
    'finding':  rl_finding,
    'severity': 'HIGH' if rl_finding else 'INFO',
    'response_time_ms': 0,
    'test_category': 'Rate Limiting',
    'note': rl_note,
    'timestamp': datetime.datetime.now().isoformat(),
    'body_snippet': '',
})

# ---------------------------------------------------------------
# CAT 8  Hardcoded Secrets (static scan)
# ---------------------------------------------------------------
print('\n[CAT 8] Hardcoded Secrets (static scan)')

static_findings = [
    {
        'file': 'smart_agri_app/lib/firebase_options.dart',
        'note': 'Firebase API keys (AIzaSy...) hardcoded for web/Android/iOS/macOS/Windows. File is NOT in .gitignore - credentials in git history.',
        'sev':  'CRITICAL',
    },
    {
        'file': 'smart_agri_app/firebase.json',
        'note': 'Firebase projectId "smart-agri-1112a" and all platform appIds committed in source.',
        'sev':  'HIGH',
    },
    {
        'file': 'backend/index.js + backend/data.js',
        'note': 'Token scheme is mock_token_<userId> - trivially guessable, zero cryptographic strength. Anyone knowing u1/u2/u3 can impersonate any account.',
        'sev':  'CRITICAL',
    },
    {
        'file': '.gitignore',
        'note': '.env is ignored but firebase_options.dart and google-services.json are not - live Firebase credentials are tracked by git.',
        'sev':  'HIGH',
    },
]

for s in static_findings:
    print(f'  [FIND] SCAN   {s["file"]:<55} {s["sev"]}')
    results.append({
        'endpoint': 'N/A (static)', 'method': 'SCAN', 'role': 'static',
        'status': 'N/A', 'expected_status': 'N/A',
        'finding': True, 'severity': s['sev'],
        'response_time_ms': 0,
        'test_category': 'Hardcoded Secrets',
        'note': f'{s["file"]}: {s["note"]}',
        'timestamp': datetime.datetime.now().isoformat(),
        'body_snippet': '',
    })

# ---------------------------------------------------------------
# Write report.json
# ---------------------------------------------------------------
findings = [r for r in results if r.get('finding')]
crit   = sum(1 for r in findings if r['severity'] == 'CRITICAL')
high   = sum(1 for r in findings if r['severity'] == 'HIGH')
medium = sum(1 for r in findings if r['severity'] == 'MEDIUM')
low    = sum(1 for r in findings if r['severity'] == 'LOW')

report = {
    'meta': {
        'baseUrl':        BASE,
        'timestamp':      datetime.datetime.now().isoformat(),
        'tool':           'Smart Agri DAST Suite v2',
        'endpointsFound': 11,
        'totalTests':     len(results),
        'findingsCount':  len(findings),
    },
    'summary': {'critical': crit, 'high': high, 'medium': medium, 'low': low},
    'tests':   results,
}

report_path = os.path.join(SCRIPT_DIR, 'report.json')
with open(report_path, 'w') as f:
    json.dump(report, f, indent=2)
print(f'\nSaved: {report_path}')

# ---------------------------------------------------------------
# Summary
# ---------------------------------------------------------------
SEV_ORDER = {'CRITICAL': 0, 'HIGH': 1, 'MEDIUM': 2, 'LOW': 3, 'INFO': 4}
print()
print('=' * 60)
print(' DAST SUMMARY')
print('=' * 60)
print(f'  Endpoints discovered : 11')
print(f'  Total tests run      : {len(results)}')
print(f'  Findings             : {len(findings)}')
print(f'  [X] CRITICAL : {crit}')
print(f'  [X] HIGH     : {high}')
print(f'  [!] MEDIUM   : {medium}')
print(f'  [!] LOW      : {low}')
print()
print('  Top issues (priority order):')
sorted_findings = sorted(findings, key=lambda r: SEV_ORDER.get(r['severity'], 9))
for i, f in enumerate(sorted_findings[:12], 1):
    print(f'  {i:2}. [{f["severity"]}] {f["method"]} {f["endpoint"]}')
    print(f'       {f["note"]}')
print()
print(f'  Full report: {report_path}')
