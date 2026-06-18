/**
 * ============================================================
 *  Smart Agri — Baseline / Load Test
 *  100 virtual users · 60 seconds · Excel report output
 * ============================================================
 */

const https = require('https');
const http  = require('http');
const path  = require('path');
const fs    = require('fs');

// ── Config ────────────────────────────────────────────────────
const BASE_URL      = 'https://backend-rosy-three-35.vercel.app/api';
const VIRTUAL_USERS = 100;
const DURATION_MS   = 60_000;          // 1 minute
const MOCK_TOKEN    = 'mock_token_u1'; // read-only test token

const ENDPOINTS = [
  { method: 'GET', path: '/contracts/marketplace', label: 'GET /marketplace',   auth: false },
  { method: 'GET', path: '/contracts?status=pending', label: 'GET /contracts (pending)', auth: true },
  { method: 'GET', path: '/chats',                label: 'GET /chats',          auth: false },
  { method: 'GET', path: '/contracts/c1',         label: 'GET /contract/:id',   auth: false },
  { method: 'POST', path: '/auth/login',          label: 'POST /auth/login',    auth: false,
    body: JSON.stringify({ email: 'farmer@farming.com' }),
    contentType: 'application/json' },
];

// ── Per-endpoint result accumulators ─────────────────────────
const results = {};
ENDPOINTS.forEach(ep => {
  results[ep.label] = { times: [], errors: 0, statusCodes: {} };
});

let totalRequests  = 0;
let startTime      = null;

// ── HTTP helper ───────────────────────────────────────────────
function makeRequest(ep) {
  return new Promise(resolve => {
    const url    = new URL(BASE_URL + ep.path);
    const isHTTPS = url.protocol === 'https:';
    const lib    = isHTTPS ? https : http;

    const options = {
      hostname: url.hostname,
      port:     url.port || (isHTTPS ? 443 : 80),
      path:     url.pathname + url.search,
      method:   ep.method || 'GET',
      headers: {
        'Content-Type':           ep.contentType || 'application/json',
        'Bypass-Tunnel-Reminder': 'true',
        ...(ep.auth ? { Authorization: `Bearer ${MOCK_TOKEN}` } : {}),
        ...(ep.body ? { 'Content-Length': Buffer.byteLength(ep.body) } : {}),
      },
      timeout: 10_000,
    };

    const t0  = Date.now();
    const req = lib.request(options, res => {
      res.resume(); // drain
      const elapsed = Date.now() - t0;
      const bucket  = results[ep.label];
      bucket.times.push(elapsed);
      bucket.statusCodes[res.statusCode] = (bucket.statusCodes[res.statusCode] || 0) + 1;
      totalRequests++;
      resolve();
    });

    req.on('error', () => {
      results[ep.label].errors++;
      totalRequests++;
      resolve();
    });

    req.on('timeout', () => {
      req.destroy();
      results[ep.label].errors++;
      totalRequests++;
      resolve();
    });

    if (ep.body) req.write(ep.body);
    req.end();
  });
}

// ── Virtual user loop ─────────────────────────────────────────
async function virtualUser() {
  while (Date.now() - startTime < DURATION_MS) {
    const ep = ENDPOINTS[Math.floor(Math.random() * ENDPOINTS.length)];
    await makeRequest(ep);
  }
}

// ── Stats helper ──────────────────────────────────────────────
function percentile(sorted, p) {
  if (!sorted.length) return 0;
  const idx = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, idx)];
}

function calcStats(times) {
  if (!times.length) return { avg: 0, min: 0, max: 0, p95: 0, p99: 0, count: 0 };
  const sorted = [...times].sort((a, b) => a - b);
  const sum    = sorted.reduce((a, b) => a + b, 0);
  return {
    count: sorted.length,
    avg:   Math.round(sum / sorted.length),
    min:   sorted[0],
    max:   sorted[sorted.length - 1],
    p95:   percentile(sorted, 95),
    p99:   percentile(sorted, 99),
  };
}

// ── Excel generator (pure JS, no deps) ───────────────────────
function generateExcel(summary, rps, durationSec) {
  // We'll write a proper .xlsx using the xlsx library
  // First check if xlsx is available, otherwise write CSV
  try {
    const XLSX = require('xlsx');
    writeXLSX(XLSX, summary, rps, durationSec);
  } catch {
    writeCSV(summary, rps, durationSec);
  }
}

function writeXLSX(XLSX, summary, rps, durationSec) {
  const wb = XLSX.utils.book_new();

  // ── Sheet 1: Overview ──
  const overviewData = [
    ['Smart Agri — Baseline Load Test Report'],
    [],
    ['Test Configuration', ''],
    ['Virtual Users',      VIRTUAL_USERS],
    ['Duration',           `${durationSec}s`],
    ['Total Requests',     totalRequests],
    ['Requests/sec (RPS)', rps.toFixed(1)],
    ['Base URL',           BASE_URL],
    ['Test Date',          new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })],
  ];
  const ws1 = XLSX.utils.aoa_to_sheet(overviewData);
  ws1['!cols'] = [{ wch: 28 }, { wch: 45 }];
  ws1['A1'].s = { font: { bold: true, sz: 14 } };
  XLSX.utils.book_append_sheet(wb, ws1, 'Overview');

  // ── Sheet 2: Per-Endpoint Results ──
  const headers = [
    'Endpoint', 'Requests', 'Errors', 'Error %',
    'Avg (ms)', 'Min (ms)', 'Max (ms)', 'P95 (ms)', 'P99 (ms)',
    'RPS (this endpoint)', 'Status Codes'
  ];
  const rows = [headers];

  summary.forEach(s => {
    const epRps   = (s.count / durationSec).toFixed(1);
    const errPct  = s.count > 0 ? ((s.errors / (s.count + s.errors)) * 100).toFixed(1) : '0.0';
    const statuses = Object.entries(s.statusCodes)
      .map(([code, cnt]) => `${code}×${cnt}`).join(', ');
    rows.push([
      s.endpoint, s.count + s.errors, s.errors,
      `${errPct}%`,
      s.avg, s.min, s.max, s.p95, s.p99,
      epRps, statuses || '(timeout/error)'
    ]);
  });

  const ws2 = XLSX.utils.aoa_to_sheet(rows);
  ws2['!cols'] = [
    { wch: 32 }, { wch: 12 }, { wch: 10 }, { wch: 10 },
    { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 },
    { wch: 22 }, { wch: 30 },
  ];
  XLSX.utils.book_append_sheet(wb, ws2, 'Endpoint Results');

  // ── Sheet 3: Raw Timing Data ──
  const rawHeaders = ['Endpoint', 'Response Time (ms)'];
  const rawRows = [rawHeaders];
  summary.forEach(s => {
    results[s.endpoint].times.forEach(t => rawRows.push([s.endpoint, t]));
  });
  const ws3 = XLSX.utils.aoa_to_sheet(rawRows);
  ws3['!cols'] = [{ wch: 32 }, { wch: 22 }];
  XLSX.utils.book_append_sheet(wb, ws3, 'Raw Timings');

  // ── Sheet 4: Pass / Fail Assessment ──
  const assessData = [
    ['Performance Assessment'],
    [],
    ['Metric', 'Actual', 'Threshold', 'Result'],
    ['RPS (Requests/sec)', rps.toFixed(1), '≥ 5', rps >= 5 ? '✅ PASS' : '❌ FAIL'],
  ];
  summary.forEach(s => {
    assessData.push([
      `Avg Response — ${s.endpoint}`,
      `${s.avg}ms`,
      '≤ 2000ms',
      s.avg <= 2000 ? '✅ PASS' : '❌ FAIL'
    ]);
    assessData.push([
      `P95 Response — ${s.endpoint}`,
      `${s.p95}ms`,
      '≤ 3000ms',
      s.p95 <= 3000 ? '✅ PASS' : '❌ FAIL'
    ]);
    const errPct = s.count > 0 ? (s.errors / (s.count + s.errors)) * 100 : 0;
    assessData.push([
      `Error Rate — ${s.endpoint}`,
      `${errPct.toFixed(1)}%`,
      '< 5%',
      errPct < 5 ? '✅ PASS' : '❌ FAIL'
    ]);
  });
  const ws4 = XLSX.utils.aoa_to_sheet(assessData);
  ws4['!cols'] = [{ wch: 40 }, { wch: 16 }, { wch: 16 }, { wch: 14 }];
  XLSX.utils.book_append_sheet(wb, ws4, 'Pass-Fail Assessment');

  const outPath = path.join(__dirname, 'Load_Test_Report.xlsx');
  XLSX.writeFile(wb, outPath);
  console.log(`\n📊 Excel report saved → ${outPath}`);
}

function writeCSV(summary, rps, durationSec) {
  let csv = 'Smart Agri Load Test Report\n\n';
  csv += `Test Date,${new Date().toLocaleString()}\n`;
  csv += `Virtual Users,${VIRTUAL_USERS}\n`;
  csv += `Duration,${durationSec}s\n`;
  csv += `Total Requests,${totalRequests}\n`;
  csv += `Overall RPS,${rps.toFixed(1)}\n\n`;
  csv += 'Endpoint,Requests,Errors,Error %,Avg (ms),Min (ms),Max (ms),P95 (ms),P99 (ms)\n';
  summary.forEach(s => {
    const errPct = s.count > 0 ? ((s.errors / (s.count + s.errors)) * 100).toFixed(1) : '0.0';
    csv += `"${s.endpoint}",${s.count + s.errors},${s.errors},${errPct}%,${s.avg},${s.min},${s.max},${s.p95},${s.p99}\n`;
  });
  const outPath = path.join(__dirname, 'Load_Test_Report.csv');
  fs.writeFileSync(outPath, csv);
  console.log(`\n📊 CSV report saved → ${outPath}`);
}

// ── Progress bar ──────────────────────────────────────────────
function showProgress() {
  const interval = setInterval(() => {
    const elapsed  = Math.min(Date.now() - startTime, DURATION_MS);
    const pct      = Math.floor((elapsed / DURATION_MS) * 100);
    const filled   = Math.floor(pct / 5);
    const bar      = '█'.repeat(filled) + '░'.repeat(20 - filled);
    const rps      = totalRequests / (elapsed / 1000);
    process.stdout.write(`\r  [${bar}] ${pct}%  |  Requests: ${totalRequests}  |  ~${rps.toFixed(0)} req/s`);
    if (elapsed >= DURATION_MS) clearInterval(interval);
  }, 500);
  return interval;
}

// ── Main ──────────────────────────────────────────────────────
async function main() {
  console.log('\n' + '═'.repeat(60));
  console.log('  🌾  Smart Agri — Baseline Load Test');
  console.log('═'.repeat(60));
  console.log(`  Virtual Users : ${VIRTUAL_USERS}`);
  console.log(`  Duration      : ${DURATION_MS / 1000}s`);
  console.log(`  Target API    : ${BASE_URL}`);
  console.log(`  Endpoints     : ${ENDPOINTS.length}`);
  console.log('═'.repeat(60));
  console.log('\n  Installing xlsx package...');

  // Install xlsx silently if not present
  try {
    require('xlsx');
    console.log('  ✅ xlsx already available');
  } catch {
    const { execSync } = require('child_process');
    try {
      execSync('npm install xlsx --no-save', { cwd: __dirname, stdio: 'inherit' });
      console.log('  ✅ xlsx installed');
    } catch {
      console.log('  ⚠️  xlsx not available — will write CSV instead');
    }
  }

  console.log(`\n  🚀 Starting test with ${VIRTUAL_USERS} virtual users...\n`);
  startTime = Date.now();

  const progressInterval = showProgress();

  // Launch all virtual users in parallel
  const users = Array.from({ length: VIRTUAL_USERS }, () => virtualUser());
  await Promise.all(users);

  clearInterval(progressInterval);

  const durationSec = (Date.now() - startTime) / 1000;
  const rps         = totalRequests / durationSec;

  console.log('\n\n' + '═'.repeat(60));
  console.log('  📈  TEST COMPLETE — RESULTS');
  console.log('═'.repeat(60));
  console.log(`  Duration     : ${durationSec.toFixed(1)}s`);
  console.log(`  Total Reqs   : ${totalRequests}`);
  console.log(`  Overall RPS  : ${rps.toFixed(1)} req/sec`);
  console.log('─'.repeat(60));

  const summary = [];
  ENDPOINTS.forEach(ep => {
    const r    = results[ep.label];
    const stat = calcStats(r.times);
    summary.push({ endpoint: ep.label, ...stat, errors: r.errors, statusCodes: r.statusCodes });

    console.log(`\n  🔹 ${ep.label}`);
    console.log(`     Requests   : ${stat.count + r.errors} (${r.errors} errors)`);
    console.log(`     Avg        : ${stat.avg}ms`);
    console.log(`     Min        : ${stat.min}ms`);
    console.log(`     Max        : ${stat.max}ms`);
    console.log(`     P95        : ${stat.p95}ms`);
    console.log(`     P99        : ${stat.p99}ms`);
    console.log(`     Status     : ${JSON.stringify(r.statusCodes)}`);
  });

  console.log('\n' + '═'.repeat(60));

  // Generate Excel / CSV
  generateExcel(summary, rps, durationSec);
  console.log('═'.repeat(60) + '\n');
}

main().catch(console.error);
