import express from 'express';
import {
  createIceTrayDatabase,
  ALLOY_OPTIONS,
  DIAMOND_TIERS,
  DESTINATION_HUBS,
} from './icetray-db.mjs';

export function createIceTrayRouter(options = {}) {
  const store = options.store || createIceTrayDatabase(options);
  const router = express.Router();

  router.use(express.json({ limit: '64kb' }));
  router.use((req, res, next) => {
    res.set('Cache-Control', 'no-store');
    next();
  });

  function getClientSessionToken(req) {
    const headerToken = req.get('x-atelier-session') || req.body?.sessionToken || '';
    if (headerToken && typeof headerToken === 'string') {
      return headerToken.slice(0, 64);
    }
    return `ip-${req.ip || 'anon'}`;
  }

  router.get('/health', (req, res) => {
    const editions = store.listEditions();
    res.json({
      status: 'ok',
      service: 'ice-tray-diamonds-atelier-api',
      storage: 'sqlite-wal',
      totalCarats: 24.8,
      totalComponents: 384,
      availableEditions: editions.filter((e) => e.status === 'AVAILABLE').length,
      version: '2.0.0',
    });
  });

  router.get('/suite', (req, res) => {
    const pieces = store.listPieces();
    const editions = store.listEditions();
    const certificates = store.listCertificates();
    const admin = store.getAdminOverview();

    res.json({
      collection: {
        code: 'ARCHIVE EDITION N° 01',
        name: 'Ice Tray Diamonds — The Complete Parure',
        totalCaratWeight: 24.8,
        totalDiamonds: 162,
        totalComponents: 384,
        baseSuiteValuationUsd: 48500,
        primaryColorClarity: 'D / VVS1–FL (Type IIa)',
        primaryMetallurgy: 'Cryo-Forged 950 Platinum',
      },
      options: {
        alloys: Object.values(ALLOY_OPTIONS),
        diamondTiers: Object.values(DIAMOND_TIERS),
        destinationHubs: Object.values(DESTINATION_HUBS),
      },
      pieces,
      editions,
      certificates,
      recentAudit: admin.auditLog.slice(0, 6),
    });
  });

  router.get('/pieces', (req, res) => {
    res.json({ pieces: store.listPieces() });
  });

  router.get('/pieces/:slug', (req, res) => {
    const piece = store.getPieceBySlug(req.params.slug);
    if (!piece) {
      return res.status(404).json({ error: 'Jewelry piece dossier not found.' });
    }
    res.json({ piece });
  });

  router.get('/certificates', (req, res) => {
    const query = req.query.q || '';
    res.json({ certificates: store.listCertificates(query) });
  });

  router.get('/certificates/:query', (req, res) => {
    const results = store.listCertificates(req.params.query);
    if (results.length === 0) {
      return res.status(404).json({ error: 'No matching GIA diamond certificate found in registry.' });
    }
    res.json({ certificate: results[0], matches: results });
  });

  router.post('/configure/quote', (req, res) => {
    const quote = store.calculateBespokeQuote(req.body || {});
    res.json({ quote });
  });

  router.get('/editions', (req, res) => {
    res.json({ editions: store.listEditions() });
  });

  router.post('/editions/:editionNumber/hold', (req, res) => {
    const sessionToken = getClientSessionToken(req);
    const result = store.holdEdition(req.params.editionNumber, sessionToken);
    if (result.error) {
      return res.status(result.status || 400).json({ error: result.error });
    }
    res.json(result);
  });

  router.post('/editions/:editionNumber/release', (req, res) => {
    const sessionToken = getClientSessionToken(req);
    const isAdmin = Boolean(req.body?.adminReset);
    const result = store.releaseEdition(req.params.editionNumber, sessionToken, isAdmin);
    if (result.error) {
      return res.status(result.status || 400).json({ error: result.error });
    }
    res.json(result);
  });

  router.post('/reservations', (req, res) => {
    const sessionToken = getClientSessionToken(req);
    const result = store.createReservation(req.body || {}, sessionToken);
    if (result.error) {
      return res.status(result.status || 400).json({ error: result.error });
    }
    res.status(201).json(result);
  });

  router.get('/reservations/:referenceCode', (req, res) => {
    const reservation = store.getReservationByRef(req.params.referenceCode);
    if (!reservation) {
      return res.status(404).json({
        error: 'Vault Dossier reference not found. Try ITD-2026-0101 or create a new reservation.',
      });
    }
    res.json({ reservation });
  });

  router.post('/appointments', (req, res) => {
    const result = store.createAppointment(req.body || {});
    if (result.error) {
      return res.status(result.status || 400).json({ error: result.error });
    }
    res.status(201).json(result);
  });

  router.get('/admin/overview', (req, res) => {
    res.json(store.getAdminOverview());
  });

  router.locals = { store };
  return router;
}
