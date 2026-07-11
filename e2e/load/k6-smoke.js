// e2e/load/k6-smoke.js
// My Identity — Smoke + load + spike test
// Usage:  k6 run e2e/load/k6-smoke.js
//         BASE_URL=https://api.myidentity.app k6 run e2e/load/k6-smoke.js
//
// Endpoints hit:
//   - GET  /health                              (always, public, warm target)
//   - GET  /v1/sites                            (always, real-world 401 anon profile)
//   - POST /v1/sites/:id/forms/:fid/submissions (only if MI_TEST_SITE_ID + MI_TEST_FORM_ID + MI_SESSION_COOKIE set)
//
// NOTE on the original brief:
//   The brief mentioned POST /v1/contact, but that route does not exist in the
//   codebase. The only public POST is /v1/sites/:id/forms/:fid/submissions
//   (matches submitFormSchema body shape). We target the real one.
//
// NOTE on auth:
//   GET /v1/sites is authenticated in the real codebase. We send the session
//   cookie (MI_SESSION_COOKIE) if set; otherwise we MEASURE the auth-rejection
//   roundtrip (which is the real-world anon load profile, not a 401 we hide).

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend, Rate, Counter } from 'k6/metrics';
import { textSummary } from 'https://jslib.k6.io/k6-summary/0.0.2/index.js';

// --- Custom metrics ---
const apiLatency = new Trend('api_latency', true);
const errorRate  = new Rate('errors');
const formSubmits = new Counter('form_submits_total');

// --- Read env ---
const BASE_URL          = __ENV.BASE_URL          || 'http://localhost:8787';
const SESSION_COOKIE    = __ENV.MI_SESSION_COOKIE || '';
const TEST_SITE_ID      = __ENV.MI_TEST_SITE_ID   || '';
const TEST_FORM_ID      = __ENV.MI_TEST_FORM_ID   || '';
const ENABLE_FORM_POST  = !!(SESSION_COOKIE && TEST_SITE_ID && TEST_FORM_ID);

// --- Thresholds: any miss fails the run with non-zero exit (blocks deploy) ---
export const options = {
  scenarios: {
    warmup: {
      executor: 'constant-vus',
      vus: 10,
      duration: '30s',
      gracefulStop: '5s',
      tags: { scenario: 'warmup' },
    },
    load: {
      executor: 'constant-vus',
      vus: 50,
      duration: '1m',
      startTime: '35s',
      gracefulStop: '10s',
      tags: { scenario: 'load' },
    },
    spike: {
      executor: 'constant-vus',
      vus: 200,
      duration: '30s',
      startTime: '1m 50s',
      gracefulStop: '15s',
      tags: { scenario: 'spike' },
    },
  },
  thresholds: {
    'http_req_duration{endpoint:health}':   ['p(99)<200'],
    'http_req_duration':                   ['p(95)<500', 'p(99)<1500'],
    'errors':                              ['rate<0.01'],
    'http_req_failed':                     ['rate<0.01'],
  },
  summaryTrendStats: ['avg', 'med', 'p(90)', 'p(95)', 'p(99)', 'max'],
};

// --- Default headers ---
const baseHeaders = {
  'Accept': 'application/json',
  'User-Agent': 'my-identity-k6-smoke/1.0',
};
const authHeaders = SESSION_COOKIE
  ? { ...baseHeaders, 'Cookie': `mi_session=${SESSION_COOKIE}` }
  : baseHeaders;

// --- The test loop ---
export default function () {
  // 1) Health check (always public, always 200)
  const healthRes = http.get(`${BASE_URL}/health`, { headers: baseHeaders, tags: { endpoint: 'health' } });
  apiLatency.add(healthRes.timings.duration, { endpoint: 'health' });
  const healthOk = check(healthRes, {
    'health: status 200': (r) => r.status === 200,
    'health: body ok':    (r) => {
      try { return JSON.parse(r.body).ok === true; } catch { return false; }
    },
  });
  if (!healthOk) errorRate.add(1);

  // 2) GET /v1/sites — public list
  //    - With cookie: expect 200
  //    - Without: expect 401 (anon rejection, still a healthy roundtrip)
  const sitesRes = http.get(`${BASE_URL}/v1/sites`, { headers: authHeaders, tags: { endpoint: 'sites_list' } });
  apiLatency.add(sitesRes.timings.duration, { endpoint: 'sites_list' });
  const expectedStatus = SESSION_COOKIE ? 200 : 401;
  const sitesOk = check(sitesRes, {
    'sites: status expected': (r) => r.status === expectedStatus,
  });
  if (!sitesOk) errorRate.add(1);

  // 3) POST form submission — only if env vars set
  if (ENABLE_FORM_POST) {
    const payload = JSON.stringify({
      data: {
        name: `k6-${__VU}-${__ITER}`,
        email: `k6-${__VU}-${__ITER}@myidentity.test`,
        message: 'Smoke test submission from k6',
      },
      turnstileToken: __ENV.MI_TURNSTILE_TOKEN || 'XXXX.DUMMY.TOKEN.XXXX',
    });
    const formRes = http.post(
      `${BASE_URL}/v1/sites/${TEST_SITE_ID}/forms/${TEST_FORM_ID}/submissions`,
      payload,
      { headers: { ...authHeaders, 'Content-Type': 'application/json' }, tags: { endpoint: 'form_submit' } }
    );
    apiLatency.add(formRes.timings.duration, { endpoint: 'form_submit' });
    const formOk = check(formRes, {
      'form: status 2xx': (r) => r.status >= 200 && r.status < 300,
    });
    if (formOk) formSubmits.add(1);
    else errorRate.add(1);
  }

  // Light pacing between iterations
  sleep(0.5);
}

// --- Custom summary banner (CI-friendly) ---
export function handleSummary(data) {
  const lines = [];
  lines.push('');
  lines.push('═══════════════════════════════════════════════════════════════');
  lines.push('  My Identity — k6 smoke summary');
  lines.push('═══════════════════════════════════════════════════════════════');
  lines.push(`  Base URL:   ${BASE_URL}`);
  lines.push(`  Auth:       ${SESSION_COOKIE ? 'cookie set' : 'anonymous (measuring 401 roundtrip)'}`);
  lines.push(`  Form POST:  ${ENABLE_FORM_POST ? 'enabled' : 'skipped (set MI_TEST_SITE_ID + MI_TEST_FORM_ID + MI_SESSION_COOKIE to enable)'}`);
  lines.push('');

  const m = data.metrics;
  if (m['http_req_duration']) {
    const d = m['http_req_duration'].values;
    lines.push(`  Total reqs:    ${m['http_reqs'].values.count}`);
    lines.push(`  p95 latency:   ${d['p(95)'].toFixed(1)} ms  (threshold: < 500 ms)`);
    lines.push(`  p99 latency:   ${d['p(99)'].toFixed(1)} ms  (threshold: < 1500 ms)`);
  }
  if (m['errors']) {
    lines.push(`  Error rate:    ${(m['errors'].values.rate * 100).toFixed(2)}%  (threshold: < 1%)`);
  }
  if (m['form_submits_total']) {
    lines.push(`  Form submits:  ${m['form_submits_total'].values.count}`);
  }
  lines.push('═══════════════════════════════════════════════════════════════');
  lines.push('');

  return {
    'stdout': lines.join('\n') + '\n' + textSummary(data, { indent: '  ', enableColors: false }),
  };
}
