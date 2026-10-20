import { DatabaseSync } from 'node:sqlite';
import { createHash, randomBytes } from 'node:crypto';
import path from 'node:path';
import { mkdirSync } from 'node:fs';

const sha256 = (input) => createHash('sha256').update(String(input)).digest('hex');

export const INITIAL_PIECES = [
  {
    id: 'piece-01',
    slug: 'glacial-tennis-bracelet',
    code: '01',
    name: 'Glacial Tennis Bracelet',
    frenchTitle: 'Rivière Glaciale Articulée',
    subtitle: '44 matched round brilliants suspended in a cryo-forged platinum articulating chassis',
    baseCaratWeight: 11.2,
    diamondCount: 44,
    componentCount: 142,
    basePriceUsd: 19800,
    gramWeightPt950: 38.4,
    toleranceMicrons: 5,
    claspMechanism: 'Concealed Twin-Tongue Box Lock with Micro-Spring Safety Latch',
    surfaceFinish: 'Mirror-Lapped Rhodium Exterior · Satin-Brushed Skin Gallery',
    // Spatial hotspot coordinates in normalized [0..1] frame space for Act I and Act II
    hotspotAct1X: 0.32,
    hotspotAct1Y: 0.25,
    hotspotAct2X: 0.77,
    hotspotAct2Y: 0.48,
    optimalScrollPct: 0.22,
    summary:
      'Engineered with 142 interlocking links that flex along two independent axes while maintaining zero visible gap between diamond girdles.',
  },
  {
    id: 'piece-02',
    slug: 'cathedral-solitaire-ring',
    code: '02',
    name: 'Cathedral Solitaire Ring',
    frenchTitle: 'Bague Cathédrale Tension',
    subtitle: '3.50 ct Type IIa center solitaire elevated above a micro-pavé structural bridge',
    baseCaratWeight: 4.65,
    diamondCount: 39,
    componentCount: 64,
    basePriceUsd: 14200,
    gramWeightPt950: 11.8,
    toleranceMicrons: 4,
    claspMechanism: 'knife-Edge Structural Gallery · 4-Prong Eagle Claw Setting',
    surfaceFinish: 'Optical Specular Polish · Hand-Engraved Inner Shank',
    hotspotAct1X: 0.19,
    hotspotAct1Y: 0.56,
    hotspotAct2X: 0.49,
    hotspotAct2Y: 0.45,
    optimalScrollPct: 0.38,
    summary:
      'The center 3.50 ct D-Flawless brilliant is suspended by four tension-calibrated platinum claws that maximize 360-degree light entry into the pavilion.',
  },
  {
    id: 'piece-03',
    slug: 'full-circle-eternity-band',
    code: '03',
    name: 'Full-Circle Eternity Band',
    frenchTitle: 'Alliance Éternité Taille Française',
    subtitle: '28 French-set diamonds forming an unbroken orbital ring of spectral fire',
    baseCaratWeight: 2.4,
    diamondCount: 28,
    componentCount: 56,
    basePriceUsd: 5400,
    gramWeightPt950: 8.2,
    toleranceMicrons: 5,
    claspMechanism: '360° Continuous U-Cut French Pavé',
    surfaceFinish: 'Micro-Faceted Platinum Scallops · Comfort-Radius Interior',
    hotspotAct1X: 0.37,
    hotspotAct1Y: 0.58,
    hotspotAct2X: 0.69,
    hotspotAct2Y: 0.49,
    optimalScrollPct: 0.52,
    summary:
      'V-shaped French cut channels expose the lower girdle facets of all 28 diamonds so light passes continuously from stone to stone.',
  },
  {
    id: 'piece-04',
    slug: 'cascade-pear-drop-earrings',
    code: '04',
    name: 'Cascade Pear Drop Earrings',
    frenchTitle: 'Pendants Cascade Goutte d’Eau',
    subtitle: 'Matched pear-cut drops suspended below graduated round brilliant articulated columns',
    baseCaratWeight: 3.85,
    diamondCount: 18,
    componentCount: 74,
    basePriceUsd: 6200,
    gramWeightPt950: 14.6,
    toleranceMicrons: 5,
    claspMechanism: 'Alpa-System Security Backings with Calibrated Tension Discs',
    surfaceFinish: 'High-Luster Platinum Basket · Open-Back Acoustic Gallery',
    hotspotAct1X: 0.56,
    hotspotAct1Y: 0.56,
    hotspotAct2X: 0.15,
    hotspotAct2Y: 0.50,
    optimalScrollPct: 0.68,
    summary:
      'Acoustic-balanced drop articulation ensures each pear-cut terminal oscillates smoothly to catch ambient illumination with every movement.',
  },
  {
    id: 'piece-05',
    slug: 'articulated-halo-medallion',
    code: '05',
    name: 'Articulated Halo Medallion',
    frenchTitle: 'Médaillon Halo Orbital',
    subtitle: 'Floating cluster core enclosed within a concentric diamond halo and diamond-cut chain',
    baseCaratWeight: 2.7,
    diamondCount: 33,
    componentCount: 48,
    basePriceUsd: 4900,
    gramWeightPt950: 16.5,
    toleranceMicrons: 5,
    claspMechanism: 'Integrated Bail with Diamond-Set Lobster Trigger Clasp',
    surfaceFinish: 'Cryo-Hardened Cable Links · Concentric Mirror Bezel',
    hotspotAct1X: 0.81,
    hotspotAct1Y: 0.58,
    hotspotAct2X: 0.32,
    hotspotAct2Y: 0.48,
    optimalScrollPct: 0.82,
    summary:
      'An orbital halo surrounds a tightly nested central cluster, creating the optical illusion of a single 4-carat icy aperture.',
  },
];

export const INITIAL_DIAMOND_LOTS = [
  {
    id: 'lot-01',
    pieceId: 'piece-02',
    giaReportNumber: 'GIA-2267849102',
    girdleInscription: 'GIA 2267849102 · ITD-01-SOL',
    lotTitle: 'Primary Cathedral Center Solitaire',
    cutShape: 'Round Brilliant',
    stoneCount: 1,
    caratWeight: 3.5,
    colorGrade: 'D',
    clarityGrade: 'FL',
    diamondType: 'Type IIa (Nitrogen-Free)',
    cutGrade: 'Excellent',
    polish: 'Excellent',
    symmetry: 'Excellent',
    fluorescence: 'None',
    tablePct: 56.0,
    depthPct: 61.4,
    crownAngle: 34.5,
    pavilionAngle: 40.8,
    measurementsMm: '9.82 x 9.85 x 6.04 mm',
    originMine: 'Jwaneng Mine, Botswana (Kimberley Process Certified)',
  },
  {
    id: 'lot-02',
    pieceId: 'piece-02',
    giaReportNumber: 'GIA-2267849118',
    girdleInscription: 'GIA 2267849118 · ITD-02-PAV',
    lotTitle: 'Cathedral Bridge & Gallery Micro-Pavé Parcel',
    cutShape: 'Round Brilliant Melee',
    stoneCount: 38,
    caratWeight: 1.15,
    colorGrade: 'D',
    clarityGrade: 'VVS1',
    diamondType: 'Type IIa',
    cutGrade: 'Ideal',
    polish: 'Excellent',
    symmetry: 'Excellent',
    fluorescence: 'None',
    tablePct: 55.5,
    depthPct: 61.0,
    crownAngle: 34.3,
    pavilionAngle: 40.7,
    measurementsMm: '1.90 – 2.15 mm calibrated',
    originMine: 'Orapa Mine, Botswana',
  },
  {
    id: 'lot-03',
    pieceId: 'piece-01',
    giaReportNumber: 'GIA-5198430218',
    girdleInscription: 'GIA 5198430218 · ITD-01-RIV',
    lotTitle: 'Glacial Bracelet Matched Suite (Stones 01–22)',
    cutShape: 'Round Brilliant',
    stoneCount: 22,
    caratWeight: 5.6,
    colorGrade: 'D',
    clarityGrade: 'VVS1',
    diamondType: 'Type IIa',
    cutGrade: 'Excellent',
    polish: 'Excellent',
    symmetry: 'Excellent',
    fluorescence: 'None',
    tablePct: 56.5,
    depthPct: 61.6,
    crownAngle: 34.5,
    pavilionAngle: 40.8,
    measurementsMm: '4.10 x 4.12 x 2.53 mm',
    originMine: 'Karowe Mine, Botswana',
  },
  {
    id: 'lot-04',
    pieceId: 'piece-01',
    giaReportNumber: 'GIA-5198430244',
    girdleInscription: 'GIA 5198430244 · ITD-02-RIV',
    lotTitle: 'Glacial Bracelet Matched Suite (Stones 23–44)',
    cutShape: 'Round Brilliant',
    stoneCount: 22,
    caratWeight: 5.6,
    colorGrade: 'D',
    clarityGrade: 'VVS1',
    diamondType: 'Type IIa',
    cutGrade: 'Excellent',
    polish: 'Excellent',
    symmetry: 'Excellent',
    fluorescence: 'None',
    tablePct: 56.4,
    depthPct: 61.5,
    crownAngle: 34.4,
    pavilionAngle: 40.7,
    measurementsMm: '4.09 x 4.11 x 2.52 mm',
    originMine: 'Karowe Mine, Botswana',
  },
  {
    id: 'lot-05',
    pieceId: 'piece-03',
    giaReportNumber: 'GIA-6401928374',
    girdleInscription: 'GIA 6401928374 · ITD-03-ETN',
    lotTitle: 'Orbital Eternity French-Set Suite',
    cutShape: 'Round Brilliant',
    stoneCount: 28,
    caratWeight: 2.4,
    colorGrade: 'D',
    clarityGrade: 'IF',
    diamondType: 'Type IIa',
    cutGrade: 'Excellent',
    polish: 'Excellent',
    symmetry: 'Excellent',
    fluorescence: 'None',
    tablePct: 55.8,
    depthPct: 61.2,
    crownAngle: 34.6,
    pavilionAngle: 40.8,
    measurementsMm: '2.85 x 2.86 x 1.75 mm',
    originMine: 'Letseng Mine, Lesotho',
  },
  {
    id: 'lot-06',
    pieceId: 'piece-04',
    giaReportNumber: 'GIA-7739201845',
    girdleInscription: 'GIA 7739201845 · ITD-04-PRL',
    lotTitle: 'Matched Pair Pear-Cut Terminal Drops',
    cutShape: 'Pear Modified Brilliant',
    stoneCount: 2,
    caratWeight: 2.25,
    colorGrade: 'D',
    clarityGrade: 'IF',
    diamondType: 'Type IIa',
    cutGrade: 'Excellent',
    polish: 'Excellent',
    symmetry: 'Excellent',
    fluorescence: 'None',
    tablePct: 58.0,
    depthPct: 62.1,
    crownAngle: 34.8,
    pavilionAngle: 40.9,
    measurementsMm: '8.95 x 5.65 x 3.51 mm',
    originMine: 'Letseng Mine, Lesotho',
  },
  {
    id: 'lot-07',
    pieceId: 'piece-04',
    giaReportNumber: 'GIA-7739201899',
    girdleInscription: 'GIA 7739201899 · ITD-04-CAS',
    lotTitle: 'Cascade Articulated Suspension Rounds',
    cutShape: 'Round Brilliant',
    stoneCount: 16,
    caratWeight: 1.6,
    colorGrade: 'D',
    clarityGrade: 'VVS1',
    diamondType: 'Type IIa',
    cutGrade: 'Excellent',
    polish: 'Excellent',
    symmetry: 'Excellent',
    fluorescence: 'None',
    tablePct: 56.2,
    depthPct: 61.5,
    crownAngle: 34.5,
    pavilionAngle: 40.7,
    measurementsMm: '3.00 x 3.01 x 1.85 mm',
    originMine: 'Jwaneng Mine, Botswana',
  },
  {
    id: 'lot-08',
    pieceId: 'piece-05',
    giaReportNumber: 'GIA-8841029384',
    girdleInscription: 'GIA 8841029384 · ITD-05-MED',
    lotTitle: 'Medallion Central Cluster & Orbital Halo',
    cutShape: 'Round Brilliant',
    stoneCount: 33,
    caratWeight: 2.7,
    colorGrade: 'D',
    clarityGrade: 'VVS1',
    diamondType: 'Type IIa',
    cutGrade: 'Excellent',
    polish: 'Excellent',
    symmetry: 'Excellent',
    fluorescence: 'None',
    tablePct: 56.0,
    depthPct: 61.3,
    crownAngle: 34.5,
    pavilionAngle: 40.8,
    measurementsMm: '5.80 mm center + 1.85 mm halo',
    originMine: 'Karowe Mine, Botswana',
  },
];

export const INITIAL_EDITIONS = [
  {
    editionNumber: 1,
    editionCode: 'N° 01 / 10',
    status: 'ACQUIRED',
    vaultCity: 'Geneva — Rue du Rhône Vault',
    collectorMonogram: 'M. V. de R.',
    acquiredAt: '2026-09-14T16:20:00Z',
  },
  {
    editionNumber: 2,
    editionCode: 'N° 02 / 10',
    status: 'ACQUIRED',
    vaultCity: 'Tokyo — Ginza Private Salon',
    collectorMonogram: 'K. T.',
    acquiredAt: '2026-09-28T11:05:00Z',
  },
  {
    editionNumber: 3,
    editionCode: 'N° 03 / 10',
    status: 'ACQUIRED',
    vaultCity: 'Zurich — Bahnhofstrasse',
    collectorMonogram: 'H. L. S.',
    acquiredAt: '2026-10-04T14:45:00Z',
  },
  {
    editionNumber: 4,
    editionCode: 'N° 04 / 10',
    status: 'AVAILABLE',
    vaultCity: 'Geneva — Atelier Master Vault',
    collectorMonogram: null,
    acquiredAt: null,
  },
  {
    editionNumber: 5,
    editionCode: 'N° 05 / 10',
    status: 'AVAILABLE',
    vaultCity: 'New York — Fifth Avenue Vault',
    collectorMonogram: null,
    acquiredAt: null,
  },
  {
    editionNumber: 6,
    editionCode: 'N° 06 / 10',
    status: 'ACQUIRED',
    vaultCity: 'London — New Bond Street',
    collectorMonogram: 'A. C.-W.',
    acquiredAt: '2026-10-11T18:10:00Z',
  },
  {
    editionNumber: 7,
    editionCode: 'N° 07 / 10',
    status: 'AVAILABLE',
    vaultCity: 'Geneva — Atelier Master Vault',
    collectorMonogram: null,
    acquiredAt: null,
  },
  {
    editionNumber: 8,
    editionCode: 'N° 08 / 10',
    status: 'AVAILABLE',
    vaultCity: 'Dubai — DIFC Private Vault',
    collectorMonogram: null,
    acquiredAt: null,
  },
  {
    editionNumber: 9,
    editionCode: 'N° 09 / 10',
    status: 'AVAILABLE',
    vaultCity: 'Tokyo — Ginza Private Salon',
    collectorMonogram: null,
    acquiredAt: null,
  },
  {
    editionNumber: 10,
    editionCode: 'N° 10 / 10',
    status: 'AVAILABLE',
    vaultCity: 'Geneva — Atelier Master Vault',
    collectorMonogram: null,
    acquiredAt: null,
  },
];

export const ALLOY_OPTIONS = {
  PT950: {
    code: 'PT950',
    name: 'Cryo-Forged 950 Platinum',
    badge: 'Atelier Signature',
    densityGcm3: 21.45,
    priceMultiplier: 1.0,
    flatDeltaUsd: 0,
    leadDaysDelta: 0,
    description: 'Sub-zero tempered 950 platinum-ruthenium alloy with 195 HV micro-hardness.',
  },
  AU750_PD: {
    code: 'AU750_PD',
    name: '18k Glacial Palladium White Gold',
    badge: 'High-Thermal Warmth',
    densityGcm3: 15.8,
    priceMultiplier: 0.96,
    flatDeltaUsd: -1400,
    leadDaysDelta: 2,
    description: 'Nickel-free 18k white gold alloyed with 14% palladium for lightweight articulation.',
  },
  AU750_OBS: {
    code: 'AU750_OBS',
    name: '18k Obsidian Black-Rhodium Gold',
    badge: 'Bespoke Contrast',
    densityGcm3: 15.9,
    priceMultiplier: 1.05,
    flatDeltaUsd: 2200,
    leadDaysDelta: 5,
    description: 'PVD-bonded obsidian ruthenium-rhodium finish creating extreme contrast against D-color diamonds.',
  },
};

export const DIAMOND_TIERS = {
  D_VVS1: {
    code: 'D_VVS1',
    name: 'D / VVS1 — Archive Standard (Type IIa)',
    priceMultiplier: 1.0,
    flatDeltaUsd: 0,
    leadDaysDelta: 0,
    description: 'Colorless D-grade stones with VVS1 clarity and zero fluorescence.',
  },
  D_FL: {
    code: 'D_FL',
    name: 'D / Flawless — Museum Grade (100% Type IIa)',
    priceMultiplier: 1.24,
    flatDeltaUsd: 9800,
    leadDaysDelta: 7,
    description: 'Internally and externally flawless Type IIa diamonds across every primary and melee position.',
  },
  E_VVS1: {
    code: 'E_VVS1',
    name: 'E / VVS1 — Atelier Collector Grade',
    priceMultiplier: 0.91,
    flatDeltaUsd: -3800,
    leadDaysDelta: 0,
    description: 'High-dispersion E-color VVS1 diamonds matched for identical table reflection.',
  },
};

export const DESTINATION_HUBS = {
  GENEVA: {
    code: 'GENEVA',
    name: 'Geneva — Rue du Rhône Flagship Salon',
    courierFeeUsd: 0,
    insuranceRate: 0.0,
    transitDays: 1,
  },
  NEW_YORK: {
    code: 'NEW_YORK',
    name: 'New York — Fifth Avenue Private Vault',
    courierFeeUsd: 450,
    insuranceRate: 0.008,
    transitDays: 2,
  },
  TOKYO: {
    code: 'TOKYO',
    name: 'Tokyo — Ginza Chuo-ku Salon',
    courierFeeUsd: 550,
    insuranceRate: 0.009,
    transitDays: 3,
  },
  LONDON: {
    code: 'LONDON',
    name: 'London — Mayfair Bond Street Vault',
    courierFeeUsd: 380,
    insuranceRate: 0.007,
    transitDays: 2,
  },
  DUBAI: {
    code: 'DUBAI',
    name: 'Dubai — DIFC Gate Village Salon',
    courierFeeUsd: 490,
    insuranceRate: 0.008,
    transitDays: 2,
  },
  ARMOURED_DIRECT: {
    code: 'ARMOURED_DIRECT',
    name: 'Direct Armoured Courier (Brink’s / Malca-Amit Global)',
    courierFeeUsd: 850,
    insuranceRate: 0.012,
    transitDays: 4,
  },
};

export function calculateBespokeQuote(input = {}, pieces = INITIAL_PIECES) {
  const scope = input.scope === 'SINGLE_PIECE' ? 'SINGLE_PIECE' : 'FULL_SUITE';
  const pieceSlug = input.pieceSlug || 'glacial-tennis-bracelet';
  const selectedPiece = pieces.find((p) => p.slug === pieceSlug) || pieces[0];

  const alloy = ALLOY_OPTIONS[input.metalAlloy] || ALLOY_OPTIONS.PT950;
  const tier = DIAMOND_TIERS[input.diamondTier] || DIAMOND_TIERS.D_VVS1;
  const hub = DESTINATION_HUBS[input.destination] || DESTINATION_HUBS.GENEVA;

  const ringSize = String(input.ringSize || 'EU 52 (US 6)').slice(0, 32);
  const wristSizeMm = Number(input.wristSizeMm) || 165;
  const engravingText = String(input.engravingText || '').trim().slice(0, 36);

  // Full suite has a bundled valuation of $48,500 (vs $50,500 sum of individual pieces)
  const basePriceUsd = scope === 'FULL_SUITE' ? 48500 : selectedPiece.baseCaratWeight ? selectedPiece.basePriceUsd : 14200;
  const totalCarats =
    scope === 'FULL_SUITE'
      ? 24.8
      : Number(selectedPiece.baseCaratWeight);
  const totalDiamonds =
    scope === 'FULL_SUITE'
      ? 162
      : Number(selectedPiece.diamondCount);
  const totalComponents =
    scope === 'FULL_SUITE'
      ? 384
      : Number(selectedPiece.componentCount);

  const baseGramWeight =
    scope === 'FULL_SUITE'
      ? 89.5
      : Number(selectedPiece.gramWeightPt950);
  const adjustedGramWeight = Number(
    (baseGramWeight * (alloy.densityGcm3 / ALLOY_OPTIONS.PT950.densityGcm3)).toFixed(1),
  );

  const scaleFactor = scope === 'FULL_SUITE' ? 1 : basePriceUsd / 48500;
  const alloyDeltaUsd = Math.round(alloy.flatDeltaUsd * scaleFactor);
  const diamondDeltaUsd = Math.round(tier.flatDeltaUsd * scaleFactor);

  // Wrist length adjustment beyond standard 165mm (+/- $140 per 5mm for extra diamond link)
  const wristDiffMm = Math.max(-25, Math.min(35, wristSizeMm - 165));
  const sizingDeltaUsd =
    scope === 'FULL_SUITE' || selectedPiece.slug === 'glacial-tennis-bracelet'
      ? Math.round((wristDiffMm / 5) * 180)
      : 0;

  const engravingFeeUsd = engravingText.length > 0 ? 350 : 0;
  const subtotalUsd = basePriceUsd + alloyDeltaUsd + diamondDeltaUsd + sizingDeltaUsd + engravingFeeUsd;
  const insuranceUsd = Math.round(subtotalUsd * hub.insuranceRate);
  const logisticsUsd = hub.courierFeeUsd + insuranceUsd;
  const totalValuationUsd = subtotalUsd + logisticsUsd;

  const baseLeadDays = scope === 'FULL_SUITE' ? 14 : 9;
  const estimatedLeadDays =
    baseLeadDays +
    alloy.leadDaysDelta +
    tier.leadDaysDelta +
    (engravingText.length > 0 ? 2 : 0) +
    hub.transitDays;

  return {
    scope,
    pieceSlug: scope === 'SINGLE_PIECE' ? selectedPiece.slug : 'complete-ice-tray-suite',
    title:
      scope === 'FULL_SUITE'
        ? 'The Complete Ice Tray Parure (5-Piece Suite)'
        : `${selectedPiece.code}. ${selectedPiece.name}`,
    metalAlloy: alloy,
    diamondTier: tier,
    destinationHub: hub,
    ringSize,
    wristSizeMm,
    engravingText,
    metrics: {
      totalCarats: Number(totalCarats.toFixed(2)),
      totalDiamonds,
      totalComponents,
      estimatedGramWeight: adjustedGramWeight,
      estimatedLeadDays,
    },
    breakdown: {
      basePriceUsd,
      alloyDeltaUsd,
      diamondDeltaUsd,
      sizingDeltaUsd,
      engravingFeeUsd,
      logisticsUsd,
      totalValuationUsd,
    },
  };
}

export function createIceTrayDatabase(options = {}) {
  const dbPath =
    options.dbPath ||
    (options.dataDir
      ? path.join(options.dataDir, 'icetray-atelier.sqlite')
      : ':memory:');

  if (dbPath !== ':memory:') {
    mkdirSync(path.dirname(dbPath), { recursive: true });
  }

  const db = new DatabaseSync(dbPath);
  db.exec('PRAGMA journal_mode = WAL;');
  db.exec('PRAGMA synchronous = NORMAL;');
  db.exec('PRAGMA foreign_keys = ON;');

  db.exec(`
    CREATE TABLE IF NOT EXISTS jewelry_pieces (
      id TEXT PRIMARY KEY,
      slug TEXT UNIQUE NOT NULL,
      code TEXT NOT NULL,
      name TEXT NOT NULL,
      french_title TEXT NOT NULL,
      subtitle TEXT NOT NULL,
      base_carat_weight REAL NOT NULL,
      diamond_count INTEGER NOT NULL,
      component_count INTEGER NOT NULL,
      base_price_usd INTEGER NOT NULL,
      gram_weight_pt950 REAL NOT NULL,
      tolerance_microns INTEGER NOT NULL,
      clasp_mechanism TEXT NOT NULL,
      surface_finish TEXT NOT NULL,
      hotspot_act1_x REAL NOT NULL,
      hotspot_act1_y REAL NOT NULL,
      hotspot_act2_x REAL NOT NULL,
      hotspot_act2_y REAL NOT NULL,
      optimal_scroll_pct REAL NOT NULL,
      summary TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS diamond_lots (
      id TEXT PRIMARY KEY,
      piece_id TEXT NOT NULL REFERENCES jewelry_pieces(id),
      gia_report_number TEXT UNIQUE NOT NULL,
      girdle_inscription TEXT NOT NULL,
      lot_title TEXT NOT NULL,
      cut_shape TEXT NOT NULL,
      stone_count INTEGER NOT NULL,
      carat_weight REAL NOT NULL,
      color_grade TEXT NOT NULL,
      clarity_grade TEXT NOT NULL,
      diamond_type TEXT NOT NULL,
      cut_grade TEXT NOT NULL,
      polish TEXT NOT NULL,
      symmetry TEXT NOT NULL,
      fluorescence TEXT NOT NULL,
      table_pct REAL NOT NULL,
      depth_pct REAL NOT NULL,
      crown_angle REAL NOT NULL,
      pavilion_angle REAL NOT NULL,
      measurements_mm TEXT NOT NULL,
      origin_mine TEXT NOT NULL,
      provenance_hash TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS edition_slots (
      edition_number INTEGER PRIMARY KEY,
      edition_code TEXT NOT NULL,
      status TEXT NOT NULL,
      vault_city TEXT NOT NULL,
      collector_monogram TEXT,
      acquired_at TEXT,
      hold_expires_at INTEGER,
      held_by_session TEXT,
      reservation_ref TEXT
    );

    CREATE TABLE IF NOT EXISTS reservations (
      id TEXT PRIMARY KEY,
      reference_code TEXT UNIQUE NOT NULL,
      edition_number INTEGER NOT NULL REFERENCES edition_slots(edition_number),
      client_name TEXT NOT NULL,
      client_email TEXT NOT NULL,
      client_phone TEXT,
      monogram TEXT NOT NULL,
      scope TEXT NOT NULL,
      piece_slug TEXT NOT NULL,
      item_title TEXT NOT NULL,
      metal_alloy TEXT NOT NULL,
      diamond_tier TEXT NOT NULL,
      ring_size TEXT NOT NULL,
      wrist_size_mm INTEGER NOT NULL,
      engraving_text TEXT,
      destination_hub TEXT NOT NULL,
      dispatch_method TEXT NOT NULL,
      total_valuation_usd INTEGER NOT NULL,
      estimated_lead_days INTEGER NOT NULL,
      provenance_signature TEXT NOT NULL,
      status TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS salon_appointments (
      id TEXT PRIMARY KEY,
      booking_code TEXT UNIQUE NOT NULL,
      client_name TEXT NOT NULL,
      client_email TEXT NOT NULL,
      salon_city TEXT NOT NULL,
      preferred_date TEXT NOT NULL,
      focus_piece TEXT NOT NULL,
      notes TEXT,
      status TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS atelier_audit_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event_type TEXT NOT NULL,
      actor TEXT NOT NULL,
      detail TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
  `);

  const pieceCount = db.prepare('SELECT COUNT(*) AS count FROM jewelry_pieces').get().count;
  if (pieceCount === 0) {
    const insertPiece = db.prepare(`
      INSERT INTO jewelry_pieces (
        id, slug, code, name, french_title, subtitle,
        base_carat_weight, diamond_count, component_count, base_price_usd,
        gram_weight_pt950, tolerance_microns, clasp_mechanism, surface_finish,
        hotspot_act1_x, hotspot_act1_y, hotspot_act2_x, hotspot_act2_y,
        optimal_scroll_pct, summary
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const p of INITIAL_PIECES) {
      insertPiece.run(
        p.id,
        p.slug,
        p.code,
        p.name,
        p.frenchTitle,
        p.subtitle,
        p.baseCaratWeight,
        p.diamondCount,
        p.componentCount,
        p.basePriceUsd,
        p.gramWeightPt950,
        p.toleranceMicrons,
        p.claspMechanism,
        p.surfaceFinish,
        p.hotspotAct1X,
        p.hotspotAct1Y,
        p.hotspotAct2X,
        p.hotspotAct2Y,
        p.optimalScrollPct,
        p.summary,
      );
    }

    const insertLot = db.prepare(`
      INSERT INTO diamond_lots (
        id, piece_id, gia_report_number, girdle_inscription, lot_title,
        cut_shape, stone_count, carat_weight, color_grade, clarity_grade,
        diamond_type, cut_grade, polish, symmetry, fluorescence,
        table_pct, depth_pct, crown_angle, pavilion_angle, measurements_mm,
        origin_mine, provenance_hash
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const lot of INITIAL_DIAMOND_LOTS) {
      const hash = sha256(
        `${lot.giaReportNumber}|${lot.girdleInscription}|${lot.caratWeight}|${lot.originMine}|ICETRAY-GENEVA-2026`,
      );
      insertLot.run(
        lot.id,
        lot.pieceId,
        lot.giaReportNumber,
        lot.girdleInscription,
        lot.lotTitle,
        lot.cutShape,
        lot.stoneCount,
        lot.caratWeight,
        lot.colorGrade,
        lot.clarityGrade,
        lot.diamondType,
        lot.cutGrade,
        lot.polish,
        lot.symmetry,
        lot.fluorescence,
        lot.tablePct,
        lot.depthPct,
        lot.crownAngle,
        lot.pavilionAngle,
        lot.measurementsMm,
        lot.originMine,
        hash,
      );
    }

    const insertEdition = db.prepare(`
      INSERT INTO edition_slots (
        edition_number, edition_code, status, vault_city,
        collector_monogram, acquired_at, hold_expires_at, held_by_session, reservation_ref
      ) VALUES (?, ?, ?, ?, ?, ?, NULL, NULL, ?)
    `);

    for (const ed of INITIAL_EDITIONS) {
      const ref = ed.editionNumber === 1 ? 'ITD-2026-0101' : null;
      insertEdition.run(
        ed.editionNumber,
        ed.editionCode,
        ed.status,
        ed.vaultCity,
        ed.collectorMonogram,
        ed.acquiredAt,
        ref,
      );
    }

    // Seed a showcase reservation so visitors can immediately test Vault Dossier Lookup with ITD-2026-0101
    const sampleSig = sha256('ITD-2026-0101|1|M. V. de R.|PT950|D_FL|GENEVA');
    db.prepare(`
      INSERT INTO reservations (
        id, reference_code, edition_number, client_name, client_email, client_phone,
        monogram, scope, piece_slug, item_title, metal_alloy, diamond_tier,
        ring_size, wrist_size_mm, engraving_text, destination_hub, dispatch_method,
        total_valuation_usd, estimated_lead_days, provenance_signature, status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      'res-seed-01',
      'ITD-2026-0101',
      1,
      'Marc-Valentin de Rochefort',
      'm.rochefort@private-wealth.ch',
      '+41 22 819 00 01',
      'M. V. de R.',
      'FULL_SUITE',
      'complete-ice-tray-suite',
      'The Complete Ice Tray Parure (5-Piece Suite)',
      'PT950',
      'D_FL',
      'EU 52 (US 6)',
      165,
      'LUMIERE ETERNELLE · N° 01',
      'GENEVA',
      'SALON_HANDOVER',
      58650,
      23,
      sampleSig,
      'CONFIRMED_VAULT',
      '2026-09-14T16:20:00Z',
    );

    const logStmt = db.prepare(`
      INSERT INTO atelier_audit_log (event_type, actor, detail, created_at)
      VALUES (?, ?, ?, ?)
    `);
    logStmt.run(
      'LEDGER_GENESIS',
      'Geneva Chief Gemologist',
      'Registered 8 GIA Type IIa diamond parcels (24.80 ct total) into optical provenance ledger.',
      '2026-09-01T09:00:00Z',
    );
    logStmt.run(
      'EDITION_ALLOCATED',
      'Geneva Concierge',
      'Edition N° 01/10 allocated to collector M. V. de R. (Dossier ITD-2026-0101).',
      '2026-09-14T16:20:00Z',
    );
    logStmt.run(
      'EDITION_ALLOCATED',
      'Tokyo Ginza Salon',
      'Edition N° 02/10 allocated to collector K. T. via private viewing.',
      '2026-09-28T11:05:00Z',
    );
  }

  function recordAudit(eventType, actor, detail) {
    db.prepare(`
      INSERT INTO atelier_audit_log (event_type, actor, detail, created_at)
      VALUES (?, ?, ?, ?)
    `).run(eventType, actor, detail, new Date().toISOString());
  }

  function sweepExpiredHolds() {
    const now = Date.now();
    const expired = db
      .prepare(
        `SELECT edition_number FROM edition_slots WHERE status = 'HELD' AND hold_expires_at IS NOT NULL AND hold_expires_at <= ?`,
      )
      .all(now);
    if (expired.length > 0) {
      const clearStmt = db.prepare(`
        UPDATE edition_slots
        SET status = 'AVAILABLE', hold_expires_at = NULL, held_by_session = NULL
        WHERE edition_number = ?
      `);
      for (const row of expired) {
        clearStmt.run(row.edition_number);
      }
    }
  }

  function mapPieceRow(row, lots = []) {
    return {
      id: row.id,
      slug: row.slug,
      code: row.code,
      name: row.name,
      frenchTitle: row.french_title,
      subtitle: row.subtitle,
      baseCaratWeight: row.base_carat_weight,
      diamondCount: row.diamond_count,
      componentCount: row.component_count,
      basePriceUsd: row.base_price_usd,
      gramWeightPt950: row.gram_weight_pt950,
      toleranceMicrons: row.tolerance_microns,
      claspMechanism: row.clasp_mechanism,
      surfaceFinish: row.surface_finish,
      hotspots: {
        act1: { x: row.hotspot_act1_x, y: row.hotspot_act1_y },
        act2: { x: row.hotspot_act2_x, y: row.hotspot_act2_y },
        optimalScrollPct: row.optimal_scroll_pct,
      },
      summary: row.summary,
      diamondLots: lots,
    };
  }

  function mapLotRow(row) {
    return {
      id: row.id,
      pieceId: row.piece_id,
      pieceName: row.piece_name || undefined,
      pieceSlug: row.piece_slug || undefined,
      giaReportNumber: row.gia_report_number,
      girdleInscription: row.girdle_inscription,
      lotTitle: row.lot_title,
      cutShape: row.cut_shape,
      stoneCount: row.stone_count,
      caratWeight: row.carat_weight,
      colorGrade: row.color_grade,
      clarityGrade: row.clarity_grade,
      diamondType: row.diamond_type,
      cutGrade: row.cut_grade,
      polish: row.polish,
      symmetry: row.symmetry,
      fluorescence: row.fluorescence,
      proportions: {
        tablePct: row.table_pct,
        depthPct: row.depth_pct,
        crownAngle: row.crown_angle,
        pavilionAngle: row.pavilion_angle,
      },
      measurementsMm: row.measurements_mm,
      originMine: row.origin_mine,
      provenanceHash: row.provenance_hash,
    };
  }

  function listPieces() {
    const rows = db.prepare('SELECT * FROM jewelry_pieces ORDER BY code ASC').all();
    const lots = db
      .prepare(
        `SELECT dl.*, jp.name AS piece_name, jp.slug AS piece_slug
         FROM diamond_lots dl
         JOIN jewelry_pieces jp ON jp.id = dl.piece_id
         ORDER BY dl.id ASC`,
      )
      .all()
      .map(mapLotRow);

    return rows.map((row) =>
      mapPieceRow(
        row,
        lots.filter((l) => l.pieceId === row.id),
      ),
    );
  }

  function getPieceBySlug(slug) {
    const row = db.prepare('SELECT * FROM jewelry_pieces WHERE slug = ?').get(slug);
    if (!row) return null;
    const lots = db
      .prepare(
        `SELECT dl.*, jp.name AS piece_name, jp.slug AS piece_slug
         FROM diamond_lots dl
         JOIN jewelry_pieces jp ON jp.id = dl.piece_id
         WHERE dl.piece_id = ?`,
      )
      .all(row.id)
      .map(mapLotRow);
    return mapPieceRow(row, lots);
  }

  function listCertificates(query = '') {
    const q = String(query || '').trim().toUpperCase();
    const rows = db
      .prepare(
        `SELECT dl.*, jp.name AS piece_name, jp.slug AS piece_slug, jp.code AS piece_code
         FROM diamond_lots dl
         JOIN jewelry_pieces jp ON jp.id = dl.piece_id
         ORDER BY jp.code ASC, dl.carat_weight DESC`,
      )
      .all()
      .map((r) => ({ ...mapLotRow(r), pieceCode: r.piece_code }));

    if (!q) return rows;
    return rows.filter(
      (r) =>
        r.giaReportNumber.toUpperCase().includes(q) ||
        r.girdleInscription.toUpperCase().includes(q) ||
        r.lotTitle.toUpperCase().includes(q) ||
        (r.pieceName && r.pieceName.toUpperCase().includes(q)) ||
        (r.pieceSlug && r.pieceSlug.toUpperCase().includes(q)),
    );
  }

  function listEditions() {
    sweepExpiredHolds();
    const now = Date.now();
    return db
      .prepare('SELECT * FROM edition_slots ORDER BY edition_number ASC')
      .all()
      .map((row) => ({
        editionNumber: row.edition_number,
        editionCode: row.edition_code,
        status: row.status,
        vaultCity: row.vault_city,
        collectorMonogram: row.collector_monogram,
        acquiredAt: row.acquired_at,
        holdExpiresAt: row.hold_expires_at,
        holdRemainingSeconds:
          row.status === 'HELD' && row.hold_expires_at
            ? Math.max(0, Math.round((row.hold_expires_at - now) / 1000))
            : 0,
        heldBySession: row.held_by_session,
        reservationRef: row.reservation_ref,
      }));
  }

  function holdEdition(editionNumber, sessionToken) {
    sweepExpiredHolds();
    const num = Number(editionNumber);
    if (!Number.isInteger(num) || num < 1 || num > 10) {
      return { error: 'Edition number must be between 1 and 10.', status: 400 };
    }
    const existing = db
      .prepare('SELECT * FROM edition_slots WHERE edition_number = ?')
      .get(num);
    if (!existing) {
      return { error: 'Edition slot not found.', status: 404 };
    }
    if (existing.status === 'ACQUIRED') {
      return {
        error: `Edition ${existing.edition_code} has already been acquired by a private collector.`,
        status: 409,
      };
    }
    if (
      existing.status === 'HELD' &&
      existing.held_by_session &&
      existing.held_by_session !== sessionToken
    ) {
      return {
        error: `Edition ${existing.edition_code} is currently under a 15-minute concierge hold by another client.`,
        status: 409,
      };
    }

    // Release any previous hold held by this same session on another edition
    db.prepare(
      `UPDATE edition_slots
       SET status = 'AVAILABLE', hold_expires_at = NULL, held_by_session = NULL
       WHERE status = 'HELD' AND held_by_session = ? AND edition_number != ?`,
    ).run(sessionToken, num);

    const expiresAt = Date.now() + 15 * 60 * 1000; // 15 minutes
    db.prepare(
      `UPDATE edition_slots
       SET status = 'HELD', hold_expires_at = ?, held_by_session = ?
       WHERE edition_number = ?`,
    ).run(expiresAt, sessionToken, num);

    recordAudit(
      'EDITION_HOLD_LOCKED',
      'Private Client Session',
      `15-minute cryptographic soft-lock placed on Edition N° ${String(num).padStart(2, '0')}/10.`,
    );

    return {
      edition: listEditions().find((e) => e.editionNumber === num),
      editions: listEditions(),
    };
  }

  function releaseEdition(editionNumber, sessionToken, isAdmin = false) {
    sweepExpiredHolds();
    const num = Number(editionNumber);
    const existing = db
      .prepare('SELECT * FROM edition_slots WHERE edition_number = ?')
      .get(num);
    if (!existing) return { error: 'Edition not found.', status: 404 };

    if (
      !isAdmin &&
      existing.status === 'HELD' &&
      existing.held_by_session &&
      existing.held_by_session !== sessionToken
    ) {
      return { error: 'Cannot release an edition held by another session.', status: 403 };
    }

    if (existing.status === 'HELD' || (isAdmin && num > 3 && num !== 6)) {
      db.prepare(
        `UPDATE edition_slots
         SET status = 'AVAILABLE', hold_expires_at = NULL, held_by_session = NULL,
             collector_monogram = NULL, acquired_at = NULL, reservation_ref = NULL
         WHERE edition_number = ?`,
      ).run(num);
      recordAudit(
        'EDITION_RELEASED',
        isAdmin ? 'Atelier Admin' : 'Private Client',
        `Edition N° ${String(num).padStart(2, '0')}/10 returned to AVAILABLE vault status.`,
      );
    }

    return { editions: listEditions() };
  }

  function createReservation(payload = {}, sessionToken = '') {
    sweepExpiredHolds();
    const editionNumber = Number(payload.editionNumber || 4);
    const clientName = String(payload.clientName || '').trim();
    const clientEmail = String(payload.clientEmail || '').trim();
    const clientPhone = String(payload.clientPhone || '').trim();

    if (!clientName || !clientEmail || !clientEmail.includes('@')) {
      return { error: 'Valid full name and private email address are required.', status: 400 };
    }

    const slot = db
      .prepare('SELECT * FROM edition_slots WHERE edition_number = ?')
      .get(editionNumber);
    if (!slot) {
      return { error: 'Selected edition slot does not exist.', status: 404 };
    }
    if (slot.status === 'ACQUIRED') {
      return {
        error: `Edition ${slot.edition_code} is already allocated. Please select an available edition.`,
        status: 409,
      };
    }
    if (
      slot.status === 'HELD' &&
      slot.held_by_session &&
      sessionToken &&
      slot.held_by_session !== sessionToken
    ) {
      return {
        error: `Edition ${slot.edition_code} is held by another collector. Please choose another available edition.`,
        status: 409,
      };
    }

    const pieces = listPieces();
    const quote = calculateBespokeQuote(payload, pieces);
    const initials = clientName
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 3)
      .map((part) => `${part[0].toUpperCase()}.`)
      .join(' ');

    const randSuffix = String(Math.floor(1000 + Math.random() * 9000));
    const referenceCode = `ITD-2026-${String(editionNumber).padStart(2, '0')}${randSuffix.slice(0, 2)}`;
    const id = `res-${randomBytes(6).toString('hex')}`;
    const createdAt = new Date().toISOString();
    const dispatchMethod =
      payload.dispatchMethod === 'SALON_HANDOVER'
        ? 'SALON_HANDOVER'
        : payload.dispatchMethod === 'PRIVATE_AVIATION'
          ? 'PRIVATE_AVIATION'
          : 'ARMOURED_COURIER';

    const provenanceSignature = sha256(
      `${referenceCode}|${editionNumber}|${clientName}|${quote.metalAlloy.code}|${quote.diamondTier.code}|${createdAt}`,
    );

    db.prepare(`
      INSERT INTO reservations (
        id, reference_code, edition_number, client_name, client_email, client_phone,
        monogram, scope, piece_slug, item_title, metal_alloy, diamond_tier,
        ring_size, wrist_size_mm, engraving_text, destination_hub, dispatch_method,
        total_valuation_usd, estimated_lead_days, provenance_signature, status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      referenceCode,
      editionNumber,
      clientName,
      clientEmail,
      clientPhone || null,
      initials || 'P. C.',
      quote.scope,
      quote.pieceSlug,
      quote.title,
      quote.metalAlloy.code,
      quote.diamondTier.code,
      quote.ringSize,
      quote.wristSizeMm,
      quote.engravingText || null,
      quote.destinationHub.code,
      dispatchMethod,
      quote.breakdown.totalValuationUsd,
      quote.metrics.estimatedLeadDays,
      provenanceSignature,
      'CONFIRMED_VAULT',
      createdAt,
    );

    db.prepare(`
      UPDATE edition_slots
      SET status = 'ACQUIRED',
          vault_city = ?,
          collector_monogram = ?,
          acquired_at = ?,
          hold_expires_at = NULL,
          held_by_session = NULL,
          reservation_ref = ?
      WHERE edition_number = ?
    `).run(
      quote.destinationHub.name.split('—')[0].trim() + ' — Allocated',
      initials || 'P. C.',
      createdAt,
      referenceCode,
      editionNumber,
    );

    recordAudit(
      'RESERVATION_CONFIRMED',
      clientName,
      `Allocated Edition N° ${String(editionNumber).padStart(2, '0')}/10 (${referenceCode}) · $${quote.breakdown.totalValuationUsd.toLocaleString()} USD.`,
    );

    return {
      reservation: getReservationByRef(referenceCode),
      editions: listEditions(),
    };
  }

  function getReservationByRef(refCode) {
    const code = String(refCode || '').trim().toUpperCase();
    const row = db
      .prepare('SELECT * FROM reservations WHERE UPPER(reference_code) = ?')
      .get(code);
    if (!row) return null;
    const alloy = ALLOY_OPTIONS[row.metal_alloy] || ALLOY_OPTIONS.PT950;
    const tier = DIAMOND_TIERS[row.diamond_tier] || DIAMOND_TIERS.D_VVS1;
    const hub = DESTINATION_HUBS[row.destination_hub] || DESTINATION_HUBS.GENEVA;

    return {
      id: row.id,
      referenceCode: row.reference_code,
      editionNumber: row.edition_number,
      editionCode: `N° ${String(row.edition_number).padStart(2, '0')} / 10`,
      clientName: row.client_name,
      clientEmail: row.client_email,
      clientPhone: row.client_phone,
      monogram: row.monogram,
      scope: row.scope,
      pieceSlug: row.piece_slug,
      itemTitle: row.item_title,
      metalAlloy: alloy,
      diamondTier: tier,
      ringSize: row.ring_size,
      wristSizeMm: row.wrist_size_mm,
      engravingText: row.engraving_text,
      destinationHub: hub,
      dispatchMethod: row.dispatch_method,
      totalValuationUsd: row.total_valuation_usd,
      estimatedLeadDays: row.estimated_lead_days,
      provenanceSignature: row.provenance_signature,
      status: row.status,
      createdAt: row.created_at,
    };
  }

  function createAppointment(payload = {}) {
    const clientName = String(payload.clientName || '').trim();
    const clientEmail = String(payload.clientEmail || '').trim();
    const salonCity = String(payload.salonCity || 'Geneva — Rue du Rhône').trim();
    const preferredDate = String(payload.preferredDate || '2026-11-05').trim();
    const focusPiece = String(payload.focusPiece || 'Complete Ice Tray Parure').trim();
    const notes = String(payload.notes || '').trim().slice(0, 280);

    if (!clientName || !clientEmail || !clientEmail.includes('@')) {
      return { error: 'Name and valid email are required to schedule a private viewing.', status: 400 };
    }

    const bookingCode = `SALON-${Math.floor(10000 + Math.random() * 90000)}`;
    const id = `apt-${randomBytes(5).toString('hex')}`;
    const createdAt = new Date().toISOString();

    db.prepare(`
      INSERT INTO salon_appointments (
        id, booking_code, client_name, client_email, salon_city,
        preferred_date, focus_piece, notes, status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'SCHEDULED', ?)
    `).run(id, bookingCode, clientName, clientEmail, salonCity, preferredDate, focusPiece, notes || null, createdAt);

    recordAudit(
      'SALON_VIEWING_BOOKED',
      clientName,
      `Private salon viewing (${bookingCode}) scheduled at ${salonCity} on ${preferredDate}.`,
    );

    return {
      appointment: {
        id,
        bookingCode,
        clientName,
        clientEmail,
        salonCity,
        preferredDate,
        focusPiece,
        notes,
        status: 'SCHEDULED',
        createdAt,
      },
    };
  }

  function getAdminOverview() {
    sweepExpiredHolds();
    const editions = listEditions();
    const reservations = db
      .prepare('SELECT reference_code FROM reservations ORDER BY created_at DESC LIMIT 20')
      .all()
      .map((r) => getReservationByRef(r.reference_code));
    const appointments = db
      .prepare('SELECT * FROM salon_appointments ORDER BY created_at DESC LIMIT 15')
      .all()
      .map((r) => ({
        id: r.id,
        bookingCode: r.booking_code,
        clientName: r.client_name,
        clientEmail: r.client_email,
        salonCity: r.salon_city,
        preferredDate: r.preferred_date,
        focusPiece: r.focus_piece,
        notes: r.notes,
        status: r.status,
        createdAt: r.created_at,
      }));
    const auditLog = db
      .prepare('SELECT * FROM atelier_audit_log ORDER BY id DESC LIMIT 25')
      .all()
      .map((a) => ({
        id: a.id,
        eventType: a.event_type,
        actor: a.actor,
        detail: a.detail,
        createdAt: a.created_at,
      }));

    const availableCount = editions.filter((e) => e.status === 'AVAILABLE').length;
    const heldCount = editions.filter((e) => e.status === 'HELD').length;
    const acquiredCount = editions.filter((e) => e.status === 'ACQUIRED').length;
    const totalPipelineUsd = reservations.reduce((acc, r) => acc + (r?.totalValuationUsd || 0), 0);

    return {
      metrics: {
        availableEditions: availableCount,
        heldEditions: heldCount,
        acquiredEditions: acquiredCount,
        totalReservations: reservations.length,
        totalAppointments: appointments.length,
        totalPipelineUsd,
      },
      editions,
      reservations,
      appointments,
      auditLog,
    };
  }

  let isClosed = false;
  return {
    db,
    listPieces,
    getPieceBySlug,
    listCertificates,
    listEditions,
    holdEdition,
    releaseEdition,
    createReservation,
    getReservationByRef,
    createAppointment,
    getAdminOverview,
    calculateBespokeQuote: (input) => calculateBespokeQuote(input, listPieces()),
    close: () => {
      if (!isClosed) {
        isClosed = true;
        try {
          db.close();
        } catch {
          // ignore if already closed
        }
      }
    },
  };
}
