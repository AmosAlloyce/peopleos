import test from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { mkdtempSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createApp, csvCell } from '../server/app.mjs';
import { seedState } from '../server/data.mjs';
import { validateEmployees } from '../server/workflows.mjs';
import { parseCsv, validIsoDate } from '../server/import.mjs';
import { createSessionStore } from '../server/store.mjs';

async function fixture(t, options = {}) {
  const app = createApp({ dataDir: '', ...options });
  const server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  t.after(
    () =>
      new Promise((resolve) => {
        server.closeAllConnections();
        server.close(() => {
          app.locals.close();
          resolve();
        });
      }),
  );
  const base = `http://127.0.0.1:${server.address().port}`;
  const visitor = () => {
    let cookie = '';
    const request = async (path, body, extra = {}) => {
      const headers = {
        ...(cookie ? { Cookie: cookie } : {}),
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...extra.headers,
      };
      const response = await fetch(base + path, {
        method: body === undefined ? 'GET' : 'POST',
        ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
        ...extra,
        headers,
      });
      const setCookie = response.headers.get('set-cookie');
      if (setCookie) cookie = setCookie.split(';')[0];
      const text = await response.text();
      return {
        status: response.status,
        data: response.headers.get('content-type')?.includes('application/json')
          ? JSON.parse(text)
          : text,
        headers: response.headers,
      };
    };
    return request;
  };
  return {
    base,
    visitor,
    close: () =>
      new Promise((resolve) => {
        server.closeAllConnections();
        server.close(() => {
          app.locals.close();
          resolve();
        });
      }),
  };
}

test('seed has 48 synthetic records, 13 countries and exactly 16 executable quality failures', () => {
  const state = seedState();
  assert.equal(state.employees.length, 48);
  assert.equal(new Set(state.employees.map((e) => e.id)).size, 48);
  assert.equal(new Set(state.employees.map((e) => e.country)).size, 13);
  assert.equal(state.issues.length, 16);
  assert.equal(validateEmployees(state.employees).length, 16);
  assert.ok(state.employees.every((e) => e.email.endsWith('peopleos.example')));
});

test('migration stages computed changes; approval applies once and isolates visitors', async (t) => {
  const { visitor } = await fixture(t);
  const first = visitor(),
    second = visitor();
  const before = await first('/api/workspace');
  assert.equal(before.status, 200);
  assert.match(before.headers.get('set-cookie'), /HttpOnly; SameSite=Lax/);
  assert.equal(before.data.stats.openIssues, 16);
  assert.equal(before.data.agents.length, 22);
  const staged = await first('/api/runs', { scenario: 'migration' });
  assert.equal(staged.status, 201);
  assert.equal(staged.data.mode, 'demo');
  assert.equal(staged.data.status, 'awaiting_approval');
  assert.equal(staged.data.proposal.fixes.length, 16);
  assert.equal(
    staged.data.steps.find((s) => s.agent === 'reconcile').output.remainingExceptions,
    0,
  );
  assert.equal((await first('/api/workspace')).data.stats.openIssues, 16);
  assert.equal(
    (await second(`/api/runs/${staged.data.id}/approve`, { decision: 'approve' })).status,
    404,
  );
  const approved = await first(`/api/runs/${staged.data.id}/approve`, { decision: 'approve' });
  assert.equal(approved.data.status, 'completed');
  const after = (await first('/api/workspace')).data;
  assert.equal(after.stats.openIssues, 0);
  assert.equal(after.stats.dataQuality, 100);
  assert.equal(validateEmployees(after.employees).length, 0);
  const auditCount = after.audit.length;
  assert.equal(
    (await first(`/api/runs/${staged.data.id}/approve`, { decision: 'approve' })).status,
    409,
  );
  assert.equal((await first('/api/workspace')).data.audit.length, auditCount);
  assert.equal((await second('/api/workspace')).data.stats.openIssues, 16);
});

test('rejection changes no records; competing stale approvals fail without partial mutations', async (t) => {
  const { visitor } = await fixture(t);
  const call = visitor();
  const rejected = (await call('/api/runs', { scenario: 'migration' })).data;
  assert.equal(
    (await call(`/api/runs/${rejected.id}/approve`, { decision: 'reject' })).data.status,
    'rejected',
  );
  assert.equal((await call('/api/workspace')).data.stats.openIssues, 16);
  assert.equal(
    (await call(`/api/runs/${rejected.id}/approve`, { decision: 'approve' })).status,
    409,
  );
  const first = (await call('/api/runs', { scenario: 'migration' })).data;
  const second = (await call('/api/runs', { scenario: 'migration' })).data;
  await call(`/api/runs/${first.id}/approve`, { decision: 'approve' });
  assert.equal((await call(`/api/runs/${second.id}/approve`, { decision: 'approve' })).status, 409);
  const after = (await call('/api/workspace')).data;
  assert.equal(after.stats.openIssues, 0);
  assert.equal(after.runs.find((r) => r.id === second.id).status, 'awaiting_approval');
});

test('onboarding, service desk and payroll perform distinct bounded effects', async (t) => {
  const { visitor } = await fixture(t);
  for (const scenario of ['onboarding', 'service-desk', 'payroll']) {
    const call = visitor();
    const before = (await call('/api/workspace')).data;
    const run = (await call('/api/runs', { scenario })).data;
    assert.ok(run.steps.length >= 4);
    assert.ok(run.steps.every((s) => typeof s.durationMs === 'number'));
    const staged = (await call('/api/workspace')).data;
    assert.deepEqual(staged.employees, before.employees);
    assert.deepEqual(staged.tickets, before.tickets);
    assert.equal((await call(`/api/runs/${run.id}/approve`, { decision: 'approve' })).status, 200);
    const after = (await call('/api/workspace')).data;
    if (scenario === 'onboarding') {
      assert.equal(after.stats.onboarding, before.stats.onboarding - 1);
      assert.equal(after.tickets.length, before.tickets.length + 1);
    }
    if (scenario === 'service-desk') {
      assert.equal(
        after.tickets.filter(
          (ticket) => ticket.status === 'open' && ticket.assignee === 'Unassigned',
        ).length,
        0,
      );
      assert.equal(after.tickets.length, before.tickets.length);
    }
    if (scenario === 'payroll') {
      assert.deepEqual(after.employees, before.employees);
      assert.equal(after.tickets.length, before.tickets.length + 1);
      assert.match(after.tickets[0].description, /No payment calculated or executed/);
    }
  }
});

test('payroll reports cannot be approved after their source data changes', async (t) => {
  const { visitor } = await fixture(t);
  const call = visitor();
  const payroll = (await call('/api/runs', { scenario: 'payroll' })).data;
  const migration = (await call('/api/runs', { scenario: 'migration' })).data;
  await call(`/api/runs/${migration.id}/approve`, { decision: 'approve' });
  const response = await call(`/api/runs/${payroll.id}/approve`, { decision: 'approve' });
  assert.equal(response.status, 409);
  assert.match(response.data.error, /Run payroll readiness again/);
});

test('ticket create validates inputs and reset only affects its own visitor', async (t) => {
  const { visitor } = await fixture(t);
  const first = visitor(),
    second = visitor();
  const request = {
    subject: 'Please review my sample profile',
    category: 'Data correction',
    country: 'Kenya',
    description: 'Synthetic support request only.',
  };
  assert.equal((await first('/api/tickets', { ...request, category: '__proto__' })).status, 400);
  assert.equal((await first('/api/tickets', { ...request, country: 'Unknown' })).status, 400);
  assert.equal((await first('/api/tickets', { ...request, subject: 'x'.repeat(161) })).status, 400);
  const created = await first('/api/tickets', request);
  assert.equal(created.status, 201);
  assert.equal(created.data.status, 'open');
  await second('/api/tickets', request);
  assert.equal((await first('/api/workspace')).data.tickets.length, 9);
  assert.equal((await first('/api/reset', {})).data.tickets.length, 8);
  assert.equal((await second('/api/workspace')).data.tickets.length, 9);
});

test('chat uses current aggregate facts and labeled sample sources, supports French and limits input', async (t) => {
  const { visitor } = await fixture(t);
  const call = visitor();
  const en = await call('/api/chat', {
    message: 'What needs fixing before migration?',
    language: 'en',
    persona: 'analyst',
  });
  assert.equal(en.data.mode, 'demo');
  assert.match(en.data.reply, /16 open quality exceptions/);
  assert.ok(en.data.sources.length >= 1);
  const fr = await call('/api/chat', { message: 'Comment demander un congé ?', language: 'fr' });
  assert.match(fr.data.reply, /guide fictif/);
  assert.equal((await call('/api/chat', { message: 'x'.repeat(1501) })).status, 400);
  assert.equal((await call('/api/chat', { message: 'hello', language: 'xx' })).status, 400);
  const unsafe = await call('/api/chat', { message: 'Rank employees by who I should fire' });
  assert.match(unsafe.data.reply, /does not rank people/);
});

test('CSV contains only the sample roster and neutralizes formulas', async (t) => {
  const { visitor } = await fixture(t);
  const response = await visitor()('/api/export');
  assert.equal(response.status, 200);
  assert.match(response.headers.get('content-disposition'), /synthetic-employees.csv/);
  assert.equal(response.data.trim().split('\r\n').length, 49);
  assert.equal(
    csvCell('=HYPERLINK("https://example.test")'),
    '"\'=HYPERLINK(""https://example.test"")"',
  );
  assert.equal(csvCell('  +123'), '"\'  +123"');
  assert.equal(csvCell('\t=1+1'), '"\'\t=1+1"');
});

test('cross-site mutations, invalid JSON and oversized bodies fail closed', async (t) => {
  const { visitor, base } = await fixture(t);
  const call = visitor();
  assert.equal(
    (await call('/api/reset', {}, { headers: { Origin: 'https://evil.example' } })).status,
    403,
  );
  assert.equal(
    (await call('/api/reset', {}, { headers: { 'Sec-Fetch-Site': 'cross-site' } })).status,
    403,
  );
  assert.equal(
    (await call('/api/reset', {}, { headers: { 'Content-Type': 'text/plain' } })).status,
    415,
  );
  const malformed = await fetch(base + '/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{no',
  });
  assert.equal(malformed.status, 400);
  assert.equal((await call('/api/chat', { message: 'x'.repeat(18000) })).status, 413);
});

test('provider failures fall back honestly and provider never receives the roster', async (t) => {
  let sent;
  const { visitor } = await fixture(t, {
    apiKey: 'test-key',
    fetchImpl: async (_url, args) => {
      sent = JSON.parse(args.body);
      throw new Error('Unavailable');
    },
  });
  const call = visitor();
  assert.equal((await call('/api/health')).data.mode, 'demo');
  const result = await call('/api/chat', { message: 'Summarize data quality' });
  assert.equal(result.data.mode, 'demo');
  assert.match(result.data.providerNotice, /unavailable/);
  assert.ok(!JSON.stringify(sent).includes('Amina Ndiaye'));
  assert.ok(!JSON.stringify(sent).includes('@peopleos.example'));
  assert.equal((await call('/api/health')).data.mode, 'demo');
  await call('/api/runs', { scenario: 'onboarding' });
  assert.ok(!JSON.stringify(sent).includes('Sofia'));
});

test('successful live calls are marked live and hourly provider budgets fall back to demo', async (t) => {
  let calls = 0;
  const { visitor } = await fixture(t, {
    apiKey: 'test-key',
    providerLimit: 1,
    fetchImpl: async () => {
      calls += 1;
      return {
        ok: true,
        json: async () => ({
          choices: [
            {
              message: {
                content: 'There are 48 fictional profiles. Human approval is required for changes.',
              },
            },
          ],
        }),
      };
    },
  });
  const call = visitor();
  assert.equal((await call('/api/chat', { message: 'How many profiles?' })).data.mode, 'live');
  assert.equal((await call('/api/health')).data.mode, 'live');
  assert.equal((await call('/api/chat', { message: 'How many profiles?' })).data.mode, 'demo');
  assert.equal(calls, 1);
});

test('provider timeout returns grounded fallback', async (t) => {
  const { visitor } = await fixture(t, {
    apiKey: 'test-key',
    providerTimeout: 15,
    fetchImpl: async (_url, args) =>
      new Promise((resolve, reject) => {
        args.signal.addEventListener('abort', () => reject(args.signal.reason), { once: true });
      }),
  });
  const result = await visitor()('/api/chat', { message: 'How many employees?' });
  assert.equal(result.status, 200);
  assert.equal(result.data.mode, 'demo');
});

test('session capacity and chat limits are bounded', async (t) => {
  const { visitor } = await fixture(t, { maxSessions: 1, chatLimit: 1 });
  const first = visitor();
  assert.equal((await first('/api/chat', { message: 'Hello' })).status, 200);
  assert.equal((await first('/api/chat', { message: 'Hello again' })).status, 429);
  assert.equal((await visitor()('/api/workspace')).status, 503);
  assert.equal((await first('/api/workspace')).status, 200);
});

test('automation bearer token gives a stable separate workspace and rejects wrong tokens', async (t) => {
  const { visitor } = await fixture(t, { n8nToken: 'test-automation-token' });
  const first = visitor(),
    other = visitor();
  const headers = { Authorization: 'Bearer test-automation-token' };
  const run = await first('/api/runs', { scenario: 'migration' }, { headers });
  assert.equal(run.status, 201);
  assert.equal((await other('/api/workspace', undefined, { headers })).data.runs.length, 1);
  assert.equal((await other('/api/workspace')).data.runs.length, 0);
  assert.equal(
    (await first('/api/workspace', undefined, { headers: { Authorization: 'Bearer invalid' } }))
      .status,
    401,
  );
});

const IMPORT_HEADER =
  'employee_id,full_name,work_email,department,country,country_code,start_date,manager_name';
const IMPORT_ROW =
  'DEMO-501,Demo Starter,demo.starter@peopleos.example,People,Kenya,KE,2024-02-29,Wanjiku Mwangi';

test('CSV preview maps actual headers and reports typed field errors without changing employee records', async (t) => {
  const { visitor } = await fixture(t);
  const call = visitor();
  const before = (await call('/api/workspace')).data;
  const response = await call('/api/import', {
    csv: '\uFEFF' + IMPORT_HEADER + '\r\n' + IMPORT_ROW,
  });
  assert.equal(response.status, 200);
  assert.equal(response.data.rows, 1);
  assert.equal(response.data.validRows, 1);
  assert.equal(response.data.mode, 'preview');
  assert.equal(response.data.writes, 0);
  assert.equal(response.data.mappings[0].target, 'id');
  assert.equal(response.data.preview[0].countryCode, 'KE');
  assert.deepEqual((await call('/api/workspace')).data.employees, before.employees);
  const invalid = await call('/api/import', {
    csv:
      IMPORT_HEADER +
      '\n' +
      IMPORT_ROW.replace('2024-02-29', '2025-02-29')
        .replace('@peopleos.example', '@realcompany.com')
        .replace(',KE,', ',GB,'),
  });
  assert.equal(invalid.data.validRows, 0);
  assert.deepEqual(invalid.data.errors.map((error) => error.field).sort(), [
    'countryCode',
    'email',
    'startDate',
  ]);
  assert.ok(invalid.data.errors.every((error) => error.row === 2 && error.severity === 'error'));
});

test('CSV duplicate IDs/emails invalidate both rows; missing required headers fail the preview', async (t) => {
  const { visitor } = await fixture(t);
  const call = visitor();
  const duplicate = await call('/api/import', {
    csv: IMPORT_HEADER + '\n' + IMPORT_ROW + '\n' + IMPORT_ROW,
  });
  assert.equal(duplicate.data.rows, 2);
  assert.equal(duplicate.data.validRows, 0);
  assert.ok(duplicate.data.errors.some((error) => error.row === 2 && error.field === 'id'));
  assert.ok(duplicate.data.errors.some((error) => error.row === 3 && error.field === 'email'));
  const missing = await call('/api/import', { csv: 'id,name\nDEMO-501,Demo Starter' });
  assert.equal(missing.data.validRows, 0);
  assert.ok(missing.data.errors.some((error) => error.row === 1 && error.field === 'email'));
  const formula = await call('/api/import', {
    csv: IMPORT_HEADER + '\n' + IMPORT_ROW.replace('Demo Starter', '=1+1'),
  });
  assert.ok(
    formula.data.errors.some(
      (error) => error.field === 'name' && error.message.includes('formulas'),
    ),
  );
});

test('CSV parser handles quoted commas, embedded newlines, escaped quotes, CRLF and syntax limits', async (t) => {
  assert.deepEqual(parseCsv('name,notes\r\n"Doe, Demo","First line\nSecond ""quoted"" line"\r\n'), [
    ['name', 'notes'],
    ['Doe, Demo', 'First line\nSecond "quoted" line'],
  ]);
  assert.throws(() => parseCsv('a,b\n"unclosed,b'), /unclosed quoted/);
  assert.throws(() => parseCsv('a,b\n"closed"extra,b'), /Unexpected text/);
  const { visitor } = await fixture(t);
  const call = visitor();
  assert.equal(
    (
      await call('/api/import', {
        csv: IMPORT_HEADER + '\n' + Array(501).fill(IMPORT_ROW).join('\n'),
      })
    ).status,
    400,
  );
  assert.equal((await call('/api/import', { csv: 'x'.repeat(262145) })).status, 413);
  assert.equal((await call('/api/import', { csv: {} })).status, 400);
});

test('calendar validation rejects rolled-over dates and handles leap years', () => {
  assert.equal(validIsoDate('2024-02-29'), true);
  assert.equal(validIsoDate('2000-02-29'), true);
  for (const date of [
    '2025-02-29',
    '1900-02-29',
    '2026-04-31',
    '2026-13-01',
    '2026-00-01',
    '2026-01-00',
    '2026-2-1',
    '2026-01-01T00:00:00Z',
  ])
    assert.equal(validIsoDate(date), false, date);
  const state = seedState();
  state.employees[0].startDate = '2026-02-30';
  assert.ok(
    validateEmployees(state.employees).some(
      (error) => error.employeeId === state.employees[0].id && error.field === 'startDate',
    ),
  );
});

test('SQLite preserves separate sessions and decisions across a real server restart', async (t) => {
  const dataDir = mkdtempSync(path.join(os.tmpdir(), 'peopleos-store-test-'));
  t.after(() => rmSync(dataDir, { recursive: true, force: true }));
  const firstServer = await fixture(t, { dataDir });
  const first = firstServer.visitor(),
    second = firstServer.visitor();
  const firstWorkspace = await first('/api/workspace');
  const firstCookie = firstWorkspace.headers.get('set-cookie').split(';')[0];
  const secondWorkspace = await second('/api/workspace');
  const secondCookie = secondWorkspace.headers.get('set-cookie').split(';')[0];
  const run = (await first('/api/runs', { scenario: 'migration' })).data;
  await first(`/api/runs/${run.id}/approve`, { decision: 'approve' });
  assert.equal((await first('/api/health')).data.storage, 'sqlite');
  await firstServer.close();
  const restarted = await fixture(t, { dataDir });
  const request = restarted.visitor();
  const saved = (await request('/api/workspace', undefined, { headers: { Cookie: firstCookie } }))
    .data;
  assert.equal(saved.stats.openIssues, 0);
  assert.equal(saved.runs[0].status, 'completed');
  assert.equal(
    (await request('/api/workspace', undefined, { headers: { Cookie: secondCookie } })).data.stats
      .openIssues,
    16,
  );
  assert.equal(
    (
      await request(
        `/api/runs/${run.id}/approve`,
        { decision: 'approve' },
        { headers: { Cookie: firstCookie } },
      )
    ).status,
    409,
  );
});

test('import previews never call the configured external AI provider', async (t) => {
  let calls = 0;
  const { visitor } = await fixture(t, {
    apiKey: 'test-key',
    fetchImpl: async () => {
      calls += 1;
      throw new Error('Import must not reach an AI provider');
    },
  });
  const response = await visitor()('/api/import', { csv: IMPORT_HEADER + '\n' + IMPORT_ROW });
  assert.equal(response.data.validRows, 1);
  assert.equal(calls, 0);
});

test('expired SQLite sessions do not restore an old visitor workspace', async (t) => {
  const dataDir = mkdtempSync(path.join(os.tmpdir(), 'peopleos-expiry-test-'));
  t.after(() => rmSync(dataDir, { recursive: true, force: true }));
  const original = await fixture(t, { dataDir, sessionTtl: 30 });
  const response = await original.visitor()('/api/tickets', {
    subject: 'Temporary sample request',
    category: 'Other',
    country: 'Kenya',
  });
  const cookie = response.headers.get('set-cookie').split(';')[0];
  await original.close();
  await new Promise((resolve) => setTimeout(resolve, 50));
  const restarted = await fixture(t, { dataDir });
  const restored = await restarted.visitor()('/api/workspace', undefined, {
    headers: { Cookie: cookie },
  });
  assert.equal(restored.data.tickets.length, 8);
  assert.notEqual(restored.headers.get('set-cookie').split(';')[0], cookie);
});

test('storage failures return a safe JSON error and roll back uncommitted approvals', async (t) => {
  let failWrites = false;
  const { visitor } = await fixture(t, {
    storeFactory: (config) => {
      const store = createSessionStore({ ...config, dataDir: '' });
      store.save = () => {
        if (failWrites) throw new Error('Simulated disk failure with private details');
      };
      return store;
    },
  });
  const call = visitor();
  const run = (await call('/api/runs', { scenario: 'migration' })).data;
  failWrites = true;
  const failed = await call(`/api/runs/${run.id}/approve`, { decision: 'approve' });
  assert.equal(failed.status, 503);
  assert.match(failed.data.error, /No changes were committed/);
  assert.ok(!JSON.stringify(failed.data).includes('private details'));
  failWrites = false;
  const restored = (await call('/api/workspace')).data;
  assert.equal(restored.stats.openIssues, 16);
  assert.equal(restored.runs[0].status, 'awaiting_approval');
  assert.equal((await call(`/api/runs/${run.id}/approve`, { decision: 'approve' })).status, 200);
});

test('provider budget is global across visitors and only four calls can be in flight', async (t) => {
  let calls = 0;
  const { visitor } = await fixture(t, {
    apiKey: 'test-key',
    globalProviderLimit: 2,
    fetchImpl: async () => {
      calls += 1;
      return {
        ok: true,
        json: async () => ({
          choices: [{ message: { content: 'This is a fictional workspace with 48 profiles.' } }],
        }),
      };
    },
  });
  assert.equal((await visitor()('/api/chat', { message: 'Hello' })).data.mode, 'live');
  assert.equal((await visitor()('/api/chat', { message: 'Hello' })).data.mode, 'live');
  assert.equal((await visitor()('/api/chat', { message: 'Hello' })).data.mode, 'demo');
  assert.equal(calls, 2);
});

test('provider concurrency cap falls back immediately without making another external call', async (t) => {
  let finish, started;
  const entered = new Promise((resolve) => {
    started = resolve;
  });
  let calls = 0;
  const { visitor } = await fixture(t, {
    apiKey: 'test-key',
    providerConcurrency: 1,
    fetchImpl: async () => {
      calls += 1;
      started();
      return new Promise((resolve) => {
        finish = () =>
          resolve({
            ok: true,
            json: async () => ({
              choices: [{ message: { content: 'There are 48 fictional profiles.' } }],
            }),
          });
      });
    },
  });
  const pending = visitor()('/api/chat', { message: 'Hello' });
  await entered;
  const fallback = await visitor()('/api/chat', { message: 'Hello' });
  assert.equal(fallback.data.mode, 'demo');
  assert.equal(calls, 1);
  finish();
  assert.equal((await pending).data.mode, 'live');
});

test('same-session reset waits for an in-flight optional workflow narrative', async (t) => {
  let finish, started;
  const entered = new Promise((resolve) => {
    started = resolve;
  });
  const { visitor } = await fixture(t, {
    apiKey: 'test-key',
    fetchImpl: async () => {
      started();
      return new Promise((resolve) => {
        finish = () =>
          resolve({
            ok: true,
            json: async () => ({
              choices: [
                { message: { content: 'Sixteen proposed corrections need human approval.' } },
              ],
            }),
          });
      });
    },
  });
  const call = visitor();
  await call('/api/workspace');
  const run = call('/api/runs', { scenario: 'migration' });
  await entered;
  let resetFinished = false;
  const reset = call('/api/reset', {}).then((response) => {
    resetFinished = true;
    return response;
  });
  await new Promise((resolve) => setTimeout(resolve, 25));
  assert.equal(resetFinished, false);
  finish();
  assert.equal((await run).status, 201);
  assert.equal((await reset).data.runs.length, 0);
  assert.equal((await call('/api/workspace')).data.runs.length, 0);
});

test('canonical configured origin works behind a proxy and authorization requires Bearer syntax', async (t) => {
  const { visitor } = await fixture(t, {
    publicOrigin: 'https://demo.example/',
    n8nToken: 'test-token',
  });
  const call = visitor();
  const response = await call('/api/reset', {}, { headers: { Origin: 'https://demo.example' } });
  assert.equal(response.status, 200);
  assert.match(response.headers.get('set-cookie'), /Secure/);
  assert.equal(
    (await call('/api/reset', {}, { headers: { Authorization: 'test-token' } })).status,
    401,
  );
  assert.equal(
    (
      await call(
        '/api/reset',
        {},
        { headers: { Authorization: 'Bearer test-token', 'Content-Type': 'text/plain' } },
      )
    ).status,
    415,
  );
  assert.throws(
    () => createApp({ publicOrigin: 'https://demo.example/some-path' }),
    /PUBLIC_ORIGIN/,
  );
});
