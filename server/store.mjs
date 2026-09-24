import { mkdirSync, chmodSync } from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

export function createSessionStore({ dataDir, maxSessions = 250 } = {}) {
  const sessions = new Map();
  let db;
  let closed = false;
  let upsert, remove;
  if (dataDir) {
    mkdirSync(dataDir, { recursive: true, mode: 0o700 });
    const { DatabaseSync } = require('node:sqlite');
    const filename = path.join(dataDir, 'peopleos.sqlite');
    db = new DatabaseSync(filename);
    chmodSync(filename, 0o600);
    db.exec(
      'PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000; CREATE TABLE IF NOT EXISTS sessions (id TEXT PRIMARY KEY, expires INTEGER NOT NULL, payload TEXT NOT NULL); CREATE INDEX IF NOT EXISTS sessions_expiry ON sessions(expires);',
    );
    db.prepare('DELETE FROM sessions WHERE expires <= ?').run(Date.now());
    const rows = db
      .prepare('SELECT id, expires, payload FROM sessions ORDER BY expires DESC LIMIT ?')
      .all(maxSessions);
    for (const row of rows) {
      try {
        const session = JSON.parse(row.payload);
        if (
          !['employees', 'tickets', 'issues', 'runs', 'audit'].every((key) =>
            Array.isArray(session?.state?.[key]),
          ) ||
          !Number.isFinite(session.expires) ||
          !['mutation', 'provider', 'chat'].every(
            (key) =>
              Number.isFinite(session?.[key]?.since) &&
              Number.isFinite(session?.[key]?.count) &&
              session[key].count >= 0,
          )
        )
          throw new Error('Invalid session');
        sessions.set(row.id, session);
      } catch {
        db.prepare('DELETE FROM sessions WHERE id = ?').run(row.id);
      }
    }
    // Keep the on-disk capacity aligned with the configured in-memory capacity.
    if (rows.length === maxSessions)
      db.prepare(
        'DELETE FROM sessions WHERE id NOT IN (SELECT id FROM sessions ORDER BY expires DESC LIMIT ?)',
      ).run(maxSessions);
    upsert = db.prepare(
      'INSERT INTO sessions (id, expires, payload) VALUES (?, ?, ?) ON CONFLICT(id) DO UPDATE SET expires = excluded.expires, payload = excluded.payload',
    );
    remove = db.prepare('DELETE FROM sessions WHERE id = ?');
  }
  return {
    sessions,
    mode: db ? 'sqlite' : 'memory',
    save(id, session) {
      if (db && !closed) upsert.run(id, session.expires, JSON.stringify(session));
    },
    delete(id) {
      sessions.delete(id);
      if (db && !closed) remove.run(id);
    },
    close() {
      if (db && !closed) {
        for (const [id, session] of sessions)
          upsert.run(id, session.expires, JSON.stringify(session));
        db.close();
        closed = true;
      }
    },
  };
}
