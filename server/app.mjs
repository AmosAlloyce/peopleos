import express from 'express';
import { randomBytes, timingSafeEqual, createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync } from 'node:fs';
import { COUNTRIES, seedState, workspaceFor, addAudit, statsFor } from './data.mjs';
import { SCENARIOS, executeWorkflow, decideRun } from './workflows.mjs';
import { groundedReply, groqNarrative } from './assistant.mjs';
import { previewImport } from './import.mjs';
import { createSessionStore } from './store.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const COOKIE = 'peopleos_session';
const SESSION_TTL = 2 * 60 * 60 * 1000;
const CATEGORIES = new Set([
  'Onboarding',
  'Data correction',
  'Access',
  'Payroll',
  'Leave',
  'Other',
]);
const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);
const cleanText = (value) =>
  typeof value === 'string'
    ? value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').trim()
    : '';
const errorResponse = (res, status, message) => res.status(status).json({ error: message });
const secureEqual = (a, b) => {
  const left = Buffer.from(a || '');
  const right = Buffer.from(b || '');
  return left.length === right.length && timingSafeEqual(left, right);
};

export function csvCell(value) {
  let text = String(value ?? '');
  // Prevent spreadsheet formulas even when prefixed with whitespace or a control character.
  if (/^[\s\u0000-\u001F]*[=+@-]/.test(text) || /^[\t\r\n]/.test(text)) text = `'${text}`;
  return `"${text.replaceAll('"', '""')}"`;
}

export function createApp(options = {}) {
  const config = {
    maxSessions: 250,
    sessionTtl: SESSION_TTL,
    mutationLimit: 60,
    chatLimit: 20,
    providerLimit: 12,
    globalProviderLimit: 100,
    providerConcurrency: 4,
    providerTimeout: 8000,
    apiKey: process.env.GROQ_API_KEY || '',
    model: process.env.GROQ_MODEL || 'openai/gpt-oss-20b',
    n8nToken: process.env.N8N_API_TOKEN || '',
    publicOrigin: process.env.PUBLIC_ORIGIN || '',
    dataDir: process.env.DATA_DIR || '',
    fetchImpl: fetch,
    ...options,
  };
  if (config.publicOrigin) {
    const publicUrl = new URL(config.publicOrigin);
    if (
      !['https:', 'http:'].includes(publicUrl.protocol) ||
      publicUrl.username ||
      publicUrl.password ||
      publicUrl.pathname !== '/' ||
      publicUrl.search ||
      publicUrl.hash
    )
      throw new Error(
        'PUBLIC_ORIGIN must be an HTTP(S) origin without a path, query or credentials.',
      );
    config.publicOrigin = publicUrl.origin;
  }
  const app = express();
  const store = (options.storeFactory || createSessionStore)(config);
  const sessions = store.sessions;
  app.locals.close = () => store.close();
  const ips = new Map();
  const sessionLocks = new WeakMap();
  let activeProviders = 0;
  let lastProviderSuccess = 0;
  // Conservatively retain consumed provider budget when persisted visitor sessions are restored.
  let providerWindow = {
    since: Date.now(),
    count: [...sessions.values()].reduce(
      (sum, session) =>
        sum + (session.provider.since > Date.now() - 3600000 ? session.provider.count : 0),
      0,
    ),
  };
  app.disable('x-powered-by');
  const trustProxy = process.env.TRUST_PROXY;
  app.set(
    'trust proxy',
    trustProxy && /^\d+$/.test(trustProxy) ? Number(trustProxy) : trustProxy || 'loopback',
  );
  app.use((req, res, next) => {
    res.set({
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'X-Frame-Options': 'DENY',
      'Permissions-Policy': 'camera=(), geolocation=(), microphone=(self)',
    });
    next();
  });
  app.use('/api', (req, res, next) => {
    res.set('Cache-Control', 'no-store');
    next();
  });
  app.get('/api/health', (req, res) =>
    res.json({
      status: 'ok',
      mode: lastProviderSuccess > Date.now() - 15 * 60000 ? 'live' : 'demo',
      provider: lastProviderSuccess > Date.now() - 15 * 60000 ? 'groq' : 'deterministic',
      providerConfigured: Boolean(config.apiKey),
      storage: store.mode,
      version: '1.0.0',
    }),
  );
  app.use('/api/import', express.json({ limit: '512kb', strict: true }));
  app.use(express.json({ limit: '16kb', strict: true }));
  app.use('/api', (req, res, next) => {
    if (req.get('Authorization')) {
      const presented = /^Bearer ([^\s]+)$/i.exec(req.get('Authorization'))?.[1];
      if (!config.n8nToken || !secureEqual(presented, config.n8nToken))
        return errorResponse(res, 401, 'Invalid automation token.');
      req.automation = true;
    }
    if (!SAFE_METHODS.has(req.method) && !req.automation) {
      const origin = req.get('Origin');
      const expected = `${req.protocol}://${req.get('host')}`;
      if (
        (origin && origin !== expected && origin !== config.publicOrigin) ||
        req.get('Sec-Fetch-Site') === 'cross-site'
      )
        return errorResponse(res, 403, 'Cross-site changes are not allowed.');
    }
    if (!SAFE_METHODS.has(req.method) && !req.is('application/json'))
      return errorResponse(res, 415, 'Send application/json for demo changes.');
    const now = Date.now();
    for (const [id, session] of sessions) if (session.expires <= now) store.delete(id);
    const cookieValue = req
      .get('cookie')
      ?.split(';')
      .map((v) => v.trim())
      .find((v) => v.startsWith(`${COOKIE}=`))
      ?.slice(COOKIE.length + 1);
    let id = req.automation
      ? `automation-${createHash('sha256').update(config.n8nToken).digest('hex')}`
      : /^[a-f0-9]{48}$/.test(cookieValue || '')
        ? cookieValue
        : null;
    let session = id ? sessions.get(id) : null;
    if (!session) {
      // Bound creation even if a visitor drops cookies between every request.
      const ip = req.ip || 'unknown';
      for (const [key, entry] of ips) if (entry.since < now - 60000) ips.delete(key);
      const ipState = ips.get(ip) || { since: now, count: 0 };
      if (ipState.count >= 30 || (!ips.has(ip) && ips.size >= 1000))
        return errorResponse(res, 429, 'Too many new demo sessions. Try again shortly.');
      ipState.count += 1;
      ips.set(ip, ipState);
      if (sessions.size >= config.maxSessions)
        return errorResponse(res, 503, 'The demo is busy. Please try again later.');
      id = req.automation ? id : randomBytes(24).toString('hex');
      session = {
        state: seedState(),
        expires: now + config.sessionTtl,
        mutation: { since: now, count: 0 },
        chat: { since: now, count: 0 },
        provider: { since: now, count: 0 },
      };
      sessions.set(id, session);
    }
    session.expires = now + config.sessionTtl;
    if (!req.automation)
      res.cookie(COOKIE, id, {
        httpOnly: true,
        sameSite: 'lax',
        secure: req.secure || config.publicOrigin.startsWith('https:'),
        maxAge: config.sessionTtl,
        path: '/',
      });
    // Serialize a visitor's requests so slow optional AI responses cannot race a reset or approval.
    // The bounded queue is outside the serialized session and is never written to SQLite.
    const lock = sessionLocks.get(session) || { active: false, queue: [] };
    sessionLocks.set(session, lock);
    const begin = () => {
      lock.active = true;
      let released = false;
      const release = () => {
        if (released) return;
        released = true;
        const pending = lock.queue.shift();
        if (pending) queueMicrotask(pending);
        else lock.active = false;
      };
      if (res.destroyed) {
        release();
        return;
      }
      const before = structuredClone(session);
      req.demoSession = session;
      req.demoSessionId = id;
      req.demoState = session.state;
      const sendJson = res.json.bind(res);
      const persist = () => {
        try {
          store.save(id, session);
          return true;
        } catch {
          Object.assign(session, before);
          return false;
        }
      };
      // Bypass this wrapper when formatting a persistence error: retrying the failed write would recurse.
      res.json = (body) => {
        try {
          if (!persist())
            return sendJson.call(res.status(503), {
              error:
                'Demo storage is temporarily unavailable. No changes were committed; please retry.',
            });
          return sendJson(body);
        } finally {
          release();
        }
      };
      req.persistDemo = () => {
        if (persist()) return true;
        res.status(503);
        sendJson({
          error:
            'Demo storage is temporarily unavailable. No changes were committed; please retry.',
        });
        release();
        return false;
      };
      res.once('finish', release);
      if (!SAFE_METHODS.has(req.method)) {
        if (Date.now() - session.mutation.since >= 60000)
          session.mutation = { since: Date.now(), count: 0 };
        if (session.mutation.count >= config.mutationLimit)
          return errorResponse(
            res,
            429,
            'Too many changes. Please wait a minute before trying again.',
          );
        session.mutation.count += 1;
      }
      next();
    };
    if (lock.active) {
      if (lock.queue.length >= 8)
        return errorResponse(
          res,
          429,
          'This demo session has too many pending requests. Please wait for them to finish.',
        );
      lock.queue.push(begin);
    } else begin();
  });
  const providerAllowed = (session) => {
    const now = Date.now();
    if (!config.apiKey || activeProviders >= config.providerConcurrency) return false;
    if (now - session.provider.since >= 3600000) session.provider = { since: now, count: 0 };
    if (now - providerWindow.since >= 3600000) providerWindow = { since: now, count: 0 };
    if (
      session.provider.count >= config.providerLimit ||
      providerWindow.count >= config.globalProviderLimit
    )
      return false;
    session.provider.count += 1;
    providerWindow.count += 1;
    return true;
  };
  const askProvider = async (args) => {
    activeProviders += 1;
    try {
      const reply = await groqNarrative({
        apiKey: config.apiKey,
        model: config.model,
        timeoutMs: config.providerTimeout,
        fetchImpl: config.fetchImpl,
        ...args,
      });
      if (reply) lastProviderSuccess = Date.now();
      return reply;
    } catch {
      return null;
    } finally {
      activeProviders -= 1;
    }
  };
  app.get('/api/workspace', (req, res) => res.json(workspaceFor(req.demoState)));
  app.post('/api/runs', async (req, res) => {
    const scenario = req.body?.scenario;
    if (!SCENARIOS.includes(scenario))
      return errorResponse(res, 400, `Choose a scenario: ${SCENARIOS.join(', ')}.`);
    if (req.demoState.runs.length >= 30)
      return errorResponse(
        res,
        429,
        'This demo workspace has reached its 30-run limit. Reset the demo to continue.',
      );
    const run = executeWorkflow(req.demoState, scenario);
    if (providerAllowed(req.demoSession)) {
      const narrative = await askProvider({
        prompt:
          'Summarize these verified results in 2 concise sentences. Explicitly say that human approval is still required. No changes have happened yet.',
        context: {
          scenario,
          proposalType: run.proposal.type,
          proposedCount: run.proposal.count,
          totalRecords: req.demoState.employees.length,
          engine: 'deterministic',
          approvalRequired: true,
          productionConnections: false,
          externalAccountsOrPayments: false,
        },
      });
      if (narrative) {
        run.summary = narrative;
        run.mode = 'live';
        run.provider = 'groq';
      } else run.providerNotice = 'Live summary unavailable. Showing the deterministic result.';
    }
    res.status(201).json(run);
  });
  app.post('/api/runs/:id/approve', (req, res) => {
    if (!['approve', 'reject'].includes(req.body?.decision))
      return errorResponse(res, 400, 'Decision must be approve or reject.');
    const run = req.demoState.runs.find((r) => r.id === req.params.id);
    if (!run) return errorResponse(res, 404, 'Workflow not found in this demo session.');
    res.json(decideRun(req.demoState, run, req.body.decision));
  });
  app.post('/api/chat', async (req, res) => {
    const message = cleanText(req.body?.message);
    if (!message || message.length > 1500)
      return errorResponse(res, 400, 'Enter a message between 1 and 1,500 characters.');
    const language = req.body?.language ?? 'en';
    const persona = req.body?.persona ?? 'concierge';
    if (
      !['en', 'fr'].includes(language) ||
      !['concierge', 'analyst', 'onboarding'].includes(persona)
    )
      return errorResponse(res, 400, 'Choose a supported language and assistant persona.');
    const session = req.demoSession;
    if (Date.now() - session.chat.since >= 60000) session.chat = { since: Date.now(), count: 0 };
    if (session.chat.count >= config.chatLimit)
      return errorResponse(
        res,
        429,
        'The assistant is receiving too many messages. Please wait a minute.',
      );
    session.chat.count += 1;
    const result = groundedReply(req.demoState, message, language, persona);
    if (providerAllowed(session)) {
      const reply = await askProvider({
        prompt: `Answer in ${language === 'fr' ? 'French' : 'English'}. User question: ${message}`,
        context: {
          verifiedAnswer: result.reply,
          sources: result.sources,
          totals: statsFor(req.demoState),
        },
      });
      if (reply) {
        result.reply = reply;
        result.mode = 'live';
        result.provider = 'groq';
      } else
        result.providerNotice = 'Live assistant unavailable. Showing a grounded demo response.';
    }
    res.json(result);
  });
  app.post('/api/tickets', (req, res) => {
    const subject = cleanText(req.body?.subject);
    const description = cleanText(req.body?.description);
    const category = cleanText(req.body?.category);
    const country = cleanText(req.body?.country);
    if (subject.length < 3 || subject.length > 160 || description.length > 2000)
      return errorResponse(
        res,
        400,
        'Use a subject of 3–160 characters and a description of at most 2,000 characters.',
      );
    if (!CATEGORIES.has(category))
      return errorResponse(res, 400, 'Choose a supported request category.');
    if (!COUNTRIES.some(([name]) => name === country) && country !== 'All countries')
      return errorResponse(res, 400, 'Choose a country from the demo catalogue.');
    if (req.demoState.tickets.length >= 50)
      return errorResponse(
        res,
        429,
        'This demo workspace has reached its 50-ticket limit. Reset the demo to continue.',
      );
    const ticket = {
      id: `HR-${req.demoState.ticketCounter++}`,
      subject,
      category,
      country,
      description,
      status: 'open',
      priority: category === 'Payroll' || category === 'Access' ? 'high' : 'medium',
      assignee: 'Unassigned',
      createdAt: new Date().toISOString(),
    };
    req.demoState.tickets.unshift(ticket);
    req.demoState.revision += 1;
    addAudit(
      req.demoState,
      'Service request created',
      'Demo visitor',
      `${ticket.id}: ${ticket.category} request for ${ticket.country}.`,
    );
    res.status(201).json(ticket);
  });
  app.post('/api/reset', (req, res) => {
    req.demoSession.state = seedState();
    res.json(workspaceFor(req.demoSession.state));
  });
  app.post('/api/import', (req, res) => {
    const preview = previewImport(req.body?.csv, req.demoState.employees);
    addAudit(
      req.demoState,
      'CSV import preview validated',
      'Schema mapper + Quality sentinel',
      `${preview.rows} rows checked; ${preview.validRows} valid. No employee records imported.`,
    );
    res.json(preview);
  });
  app.get('/api/export', (req, res) => {
    const fields = [
      'id',
      'name',
      'role',
      'department',
      'country',
      'countryCode',
      'location',
      'email',
      'status',
      'manager',
      'startDate',
    ];
    const csv =
      '\uFEFF' +
      [
        fields.map(csvCell).join(','),
        ...req.demoState.employees.map((employee) =>
          fields.map((field) => csvCell(employee[field])).join(','),
        ),
      ].join('\r\n') +
      '\r\n';
    addAudit(
      req.demoState,
      'Synthetic CSV exported',
      'Demo visitor',
      `Exported ${req.demoState.employees.length} fictional profiles. Spreadsheet formulas neutralized.`,
    );
    if (!req.persistDemo()) return;
    res
      .set({
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="peopleos-synthetic-employees.csv"',
      })
      .send(csv);
  });
  app.use('/api', (req, res) => errorResponse(res, 404, 'API endpoint not found.'));
  app.use(express.static(path.join(ROOT, 'dist'), { index: false, maxAge: '1h' }));
  app.use(express.static(path.join(ROOT, 'public'), { index: false, maxAge: '1h' }));
  app.get(['/', '/app', '/app/{*section}'], (req, res) => {
    const index = path.join(ROOT, 'dist/index.html');
    if (!existsSync(index))
      return res
        .status(503)
        .send(
          'Frontend build is unavailable. Run npm run build, or use the Vite development server.',
        );
    res.set('Cache-Control', 'no-cache').sendFile(index);
  });
  app.use((err, req, res, next) => {
    if (res.headersSent) return next(err);
    if (err.type === 'entity.too.large') return errorResponse(res, 413, 'Request is too large.');
    if (err instanceof SyntaxError && 'body' in err)
      return errorResponse(res, 400, 'Request body must be valid JSON.');
    if (err.status && err.status < 500) return errorResponse(res, err.status, err.message);
    console.error('PeopleOS request failed:', err.name);
    return errorResponse(res, 500, 'The demo could not complete this request. Please try again.');
  });
  return app;
}
