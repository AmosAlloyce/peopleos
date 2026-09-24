import assert from 'node:assert/strict';

const base = new URL(process.env.BASE_URL || 'https://alloyce-amos.duckdns.org');
assert.equal(base.protocol, 'https:', 'Live verification requires HTTPS.');
assert.ok(!base.username && !base.password, 'Do not put credentials in BASE_URL.');
assert.equal(base.pathname, '/', 'BASE_URL must be the site origin.');
assert.ok(!base.search && !base.hash, 'BASE_URL must not contain query parameters or a fragment.');

function visitor() {
  let cookie = '';
  return async function request(route, body) {
    const response = await fetch(new URL(route, base), {
      method: body === undefined ? 'GET' : 'POST',
      headers: {
        ...(cookie ? { Cookie: cookie } : {}),
        ...(body === undefined ? {} : { 'Content-Type': 'application/json', Origin: base.origin }),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      signal: AbortSignal.timeout(25000),
      redirect: 'error',
    });
    const setCookie = response.headers.get('set-cookie');
    if (setCookie) {
      assert.match(setCookie, /(?:^|;\s*)peopleos_session=/, 'Expected a demo session cookie.');
      assert.match(setCookie, /;\s*Secure(?:;|$)/i, 'The HTTPS session cookie must be Secure.');
      assert.match(setCookie, /;\s*HttpOnly(?:;|$)/i, 'The session cookie must be HttpOnly.');
      assert.match(setCookie, /;\s*SameSite=Lax(?:;|$)/i, 'The session cookie must use SameSite=Lax.');
      cookie = setCookie.split(';')[0];
    }
    assert.match(response.headers.get('content-type') || '', /application\/json/, 'API must return JSON.');
    const data = await response.json();
    return { status: response.status, data, hasSessionCookie: Boolean(setCookie) };
  };
}

async function verify() {
  const first = visitor();
  const second = visitor();
  const health = await first('/api/health');
  assert.equal(health.status, 200, 'HTTPS health endpoint failed.');
  assert.equal(health.data.status, 'ok');
  console.log(`PASS HTTPS health (${health.data.storage || 'unspecified'} storage).`);

  const before = await first('/api/workspace');
  const untouched = await second('/api/workspace');
  assert.equal(before.status, 200);
  assert.equal(untouched.status, 200);
  assert.ok(before.hasSessionCookie && untouched.hasSessionCookie, 'Each fresh visitor needs a server-issued cookie.');
  assert.ok(before.data.stats.openIssues > 0, 'The fresh synthetic workspace should contain reviewable exceptions.');
  assert.ok(before.data.employees.every(employee => employee.email.endsWith('peopleos.example')), 'Expected only fictional demo addresses.');
  console.log('PASS Secure, HttpOnly, SameSite session cookies; two fictional visitor workspaces created.');

  const proposal = await first('/api/runs', { scenario: 'migration' });
  assert.equal(proposal.status, 201);
  assert.equal(proposal.data.status, 'awaiting_approval');
  assert.ok(proposal.data.proposal.fixes.length > 0, 'Migration must produce concrete proposed corrections.');
  const staged = await first('/api/workspace');
  assert.equal(staged.data.stats.openIssues, before.data.stats.openIssues, 'Staging must not apply changes.');
  const inaccessible = await second(`/api/runs/${proposal.data.id}/approve`, { decision: 'approve' });
  assert.equal(inaccessible.status, 404, 'Another visitor must not be able to approve this run.');

  const approved = await first(`/api/runs/${proposal.data.id}/approve`, { decision: 'approve' });
  assert.equal(approved.status, 200);
  assert.equal(approved.data.status, 'completed');
  const after = await first('/api/workspace');
  assert.ok(after.data.stats.openIssues < before.data.stats.openIssues, 'Approved corrections should resolve actual exceptions.');
  assert.ok(after.data.audit.some(event => event.action === 'Workflow approved' && event.detail.includes(proposal.data.id)), 'Approval must produce an audit event.');
  const isolated = await second('/api/workspace');
  assert.equal(isolated.data.stats.openIssues, untouched.data.stats.openIssues, 'The other visitor must remain unchanged.');
  const repeated = await first(`/api/runs/${proposal.data.id}/approve`, { decision: 'approve' });
  assert.equal(repeated.status, 409, 'Repeated approval must return a conflict.');
  console.log(`PASS Migration staged ${proposal.data.proposal.fixes.length} fixes, required approval, updated audit, preserved visitor isolation, and rejected repeat approval.`);

  const chat = await first('/api/chat', {
    message: 'Briefly summarize data quality in this fictional workspace after migration. Do not claim any real HR system was changed.',
    language: 'en',
    persona: 'analyst',
  });
  assert.equal(chat.status, 200, 'The live chat request failed.');
  assert.ok(typeof chat.data.reply === 'string' && chat.data.reply.trim().length > 3, 'Chat must return a response.');
  if (chat.data.mode !== 'live' || chat.data.provider !== 'groq') {
    console.error(`LIVE AI NOT VERIFIED: mode=${String(chat.data.mode)}, provider=${String(chat.data.provider || 'none')}. Core API checks passed, but the response was a fallback.`);
    process.exitCode = 2;
    return;
  }
  assert.ok(Array.isArray(chat.data.sources) && chat.data.sources.length > 0, 'Live chat should retain grounding sources.');
  console.log('PASS Actual Groq chat response: mode=live, provider=groq, grounding sources retained.');
  console.log('Live verification passed. Only isolated fictional visitor sessions were changed; no credentials or cookie values were printed.');
}

verify().catch(error => {
  // Never dump HTTP payloads, headers, environment variables, or credentials.
  console.error(`Live verification failed: ${error.message}`);
  process.exitCode = 1;
});
