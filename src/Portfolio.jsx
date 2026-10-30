import { useEffect, useRef, useState } from 'react';
import {
  ArrowUpRight,
  GitBranch,
  Github,
  Globe,
  Layers3,
  Play,
  ShieldCheck,
  Sparkles,
  X,
} from 'lucide-react';
import './portfolio.css';
import './finpulse-project.css';
import { ProjectDesk, RecordTrace, ProjectClose } from './PortfolioCraft.jsx';

const walkthroughs = {
  peopleos: {
    title: 'PeopleOS, in motion.',
    source: '/demo/peopleos-demo.mp4',
    captions: '/demo/peopleos-demo.vtt',
    poster: '/demo/poster.jpg',
    description:
      'Follow a migration from source data to validation, human review, and an auditable result.',
    demo: '/app/migration',
  },
  finpulse: {
    title: 'FinPulse, in motion.',
    source: '/demo/finpulse-demo.mp4',
    captions: '/demo/finpulse-demo.vtt',
    poster: '/demo/finpulse-poster.jpg',
    description:
      'Follow synthetic events through validation, quarantine, and a traceable credit data pipeline.',
    demo: '/finpulse/',
  },
  icetray: {
    title: 'Ice Tray Diamonds, in motion.',
    source: '/demo/icetray-demo.mp4',
    captions: '/demo/icetray-demo.vtt',
    poster: '/demo/icetray-workspace.jpg',
    description:
      'Experience the 384-frame 60fps scroll flipbook, 2K optical inspection stage, SQLite WAL edition holds, bespoke configurator, and cryptographic GIA provenance ledger.',
    demo: '/ice-tray-diamonds/',
  },
};

const departments = [
  {
    id: 'people',
    name: 'People operations',
    short: 'People',
    icon: Layers3,
    label: 'A better first day.',
    detail:
      'An onboarding orchestrator coordinates identity checks, access planning, and the handoff to a human.',
    specialists: 'Identity · Access · Learning',
    x: 18,
    y: 30,
  },
  {
    id: 'data',
    name: 'Data & migration',
    short: 'Data',
    icon: GitBranch,
    label: 'Make the move with confidence.',
    detail:
      'A migration orchestrator maps source data, validates records, and prepares changes for review.',
    specialists: 'Mapping · Validation · Reconciliation',
    x: 79,
    y: 23,
  },
  {
    id: 'payroll',
    name: 'Payroll readiness',
    short: 'Payroll',
    icon: ShieldCheck,
    label: 'Get the details right.',
    detail:
      'A payroll orchestrator checks country-specific data and routes exceptions to the right reviewer.',
    specialists: 'Country checks · Exceptions · Reporting',
    x: 18,
    y: 74,
  },
  {
    id: 'service',
    name: 'People service desk',
    short: 'Service',
    icon: Sparkles,
    label: 'Find a clear next step.',
    detail:
      'A service orchestrator classifies requests, retrieves policy context, and drafts a response for review.',
    specialists: 'Classification · Policy · Routing',
    x: 81,
    y: 71,
  },
];

function SystemVisual() {
  const [selected, setSelected] = useState(1);
  const active = departments[selected];
  return (
    <div className="portfolio-system" aria-label="Explore the PeopleOS system architecture">
      <div className="portfolio-system-caption">
        <span>ANATOMY OF A USEFUL SYSTEM</span>
      </div>
      <div className="portfolio-network">
        <svg
          className="portfolio-network-lines"
          viewBox="0 0 500 380"
          fill="none"
          aria-hidden="true"
        >
          <defs>
            <pattern
              id="portfolio-dots"
              x="0"
              y="0"
              width="20"
              height="20"
              patternUnits="userSpaceOnUse"
            >
              <circle cx="1" cy="1" r=".75" fill="currentColor" />
            </pattern>
          </defs>
          <rect
            width="500"
            height="380"
            fill="url(#portfolio-dots)"
            className="portfolio-dotfield"
          />
          <ellipse cx="250" cy="190" rx="158" ry="118" className="portfolio-orbit" />
          <ellipse
            cx="250"
            cy="190"
            rx="215"
            ry="160"
            className="portfolio-orbit portfolio-orbit-outer"
          />
          <path
            d="M90 114 H168 Q182 114 182 128 V176 Q182 190 196 190 H250"
            className={selected === 0 ? 'portfolio-connector is-active' : 'portfolio-connector'}
          />
          <path
            d="M395 87 H333 Q319 87 319 101 V176 Q319 190 305 190 H250"
            className={selected === 1 ? 'portfolio-connector is-active' : 'portfolio-connector'}
          />
          <path
            d="M90 281 H168 Q182 281 182 267 V204 Q182 190 196 190 H250"
            className={selected === 2 ? 'portfolio-connector is-active' : 'portfolio-connector'}
          />
          <path
            d="M405 270 H333 Q319 270 319 256 V204 Q319 190 305 190 H250"
            className={selected === 3 ? 'portfolio-connector is-active' : 'portfolio-connector'}
          />
          <circle cx="250" cy="30" r="3" fill="currentColor" opacity=".3" />
          <circle cx="250" cy="350" r="3" fill="currentColor" opacity=".3" />
        </svg>
        <div className="portfolio-network-core">
          <span className="portfolio-core-mark">
            <span />
            <span />
            <span />
          </span>
          <strong>
            People<span>OS</span>
          </strong>
          <span className="portfolio-core-caption">HUMAN AT THE CENTER</span>
        </div>
        {departments.map((department, index) => {
          const Icon = department.icon;
          return (
            <button
              key={department.id}
              className={`portfolio-network-node ${selected === index ? 'is-selected' : ''}`}
              style={{ '--node-x': `${department.x}%`, '--node-y': `${department.y}%` }}
              onClick={() => setSelected(index)}
              aria-pressed={selected === index}
              aria-label={`Explore ${department.name}`}
            >
              <span className="portfolio-node-icon">
                <Icon size={19} strokeWidth={1.6} />
              </span>
              <span className="portfolio-node-title">{department.short}</span>
              <span className="portfolio-node-status">
                <i />
                Orchestrator
              </span>
            </button>
          );
        })}
        <div className="portfolio-network-tag">
          <span className="portfolio-live-dot" />
          CONNECTED BY DESIGN
        </div>
      </div>
      <div className="portfolio-system-detail" aria-live="polite">
        <div>
          <strong>{active.label}</strong>
          <p>{active.detail}</p>
        </div>
        <ArrowUpRight size={19} aria-hidden="true" />
      </div>
      <span className="portfolio-diagram-hint">Select a department to explore the thinking.</span>
    </div>
  );
}

function VideoDialog({ project, onClose }) {
  const open = Boolean(project);
  const walkthrough = walkthroughs[project] || walkthroughs.peopleos;
  const dialog = useRef(null);
  const video = useRef(null);
  useEffect(() => {
    if (open && dialog.current && !dialog.current.open) dialog.current.showModal();
    if (!open && dialog.current?.open) dialog.current.close();
  }, [open]);
  return (
    <dialog
      ref={dialog}
      className="portfolio-video-dialog"
      onClose={() => {
        video.current?.pause();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) dialog.current.close();
      }}
      aria-labelledby="portfolio-video-title"
    >
      <div className="portfolio-video-heading">
        <div>
          <h2 id="portfolio-video-title">{walkthrough.title}</h2>
          <p>Recorded walkthrough · synthetic data</p>
        </div>
        <button
          className="portfolio-dialog-close"
          onClick={() => dialog.current.close()}
          aria-label="Close recorded walkthrough"
        >
          <X size={22} />
        </button>
      </div>
      {open && (
        <video
          key={project}
          ref={video}
          controls
          autoPlay
          playsInline
          preload="metadata"
          poster={walkthrough.poster}
        >
          <source src={walkthrough.source} type="video/mp4" />
          <track default kind="captions" src={walkthrough.captions} srcLang="en" label="English" />
          Your browser does not support embedded video.{' '}
          <a href={walkthrough.source}>Download the walkthrough.</a>
        </video>
      )}
      <p className="portfolio-video-note">
        {walkthrough.description}{' '}
        <a href={walkthrough.demo}>
          Try it yourself <ArrowUpRight size={13} />
        </a>
      </p>
    </dialog>
  );
}

export default function Portfolio() {
  const [videoProject, setVideoProject] = useState(null);
  const [selectedProject, setSelectedProject] = useState('canvasly');
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <div className="portfolio">
      <a className="portfolio-skip" href="#portfolio-main">
        Skip to content
      </a>
      <header className="portfolio-header">
        <a className="portfolio-wordmark" href="/" aria-label="Alloyce Amos home">
          <span className="portfolio-monogram">
            aa<span>.</span>
          </span>
          <span className="portfolio-wordmark-name">
            ALLOYCE AMOS<span>SOFTWARE & DATA ENGINEER</span>
          </span>
        </a>
        <button
          className="portfolio-menu-toggle"
          aria-expanded={menuOpen}
          aria-controls="portfolio-navigation"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {menuOpen ? 'Close' : 'Menu'} {menuOpen ? <X size={17} /> : <span>+</span>}
        </button>
        <nav
          id="portfolio-navigation"
          className={`portfolio-nav ${menuOpen ? 'is-open' : ''}`}
          aria-label="Main navigation"
        >
          <a href="#work" onClick={() => setMenuOpen(false)}>
            Selected work
          </a>
          <a href="#approach" onClick={() => setMenuOpen(false)}>
            Architecture
          </a>
          <a href="#about" onClick={() => setMenuOpen(false)}>
            About
          </a>
          <a
            href="https://github.com/amosalloyce"
            target="_blank"
            rel="noreferrer"
            className="portfolio-nav-github"
          >
            GitHub <ArrowUpRight size={15} />
          </a>
        </nav>
      </header>

      <main id="portfolio-main">
        <section
          className="portfolio-hero"
          data-sc-act="flow"
          aria-labelledby="portfolio-hero-title"
        >
          <div className="portfolio-hero-copy">
            <h1 id="portfolio-hero-title">
              Useful systems.
              <br />
              <em>Human impact.</em>
            </h1>
            <p className="portfolio-hero-description">
              I’m Alloyce. I build software, data pipelines, and practical AI that turn complex work
              into clear, inspectable decisions.
            </p>
            <div className="portfolio-hero-actions">
              <a className="portfolio-button portfolio-button-dark" href="#work">
                Explore the systems <ArrowUpRight size={17} />
              </a>
            </div>
            <div className="portfolio-hero-systems" aria-label="Jump to a featured system">
              <a
                href="#canvasly-project"
                onMouseEnter={() => setSelectedProject('canvasly')}
                className={selectedProject === 'canvasly' ? 'is-active' : ''}
              >
                <span>01</span> Canvasly
              </a>
              <a
                href="#peopleos-project"
                onMouseEnter={() => setSelectedProject('peopleos')}
                className={selectedProject === 'peopleos' ? 'is-active' : ''}
              >
                <span>02</span> PeopleOS
              </a>
              <a
                href="#finpulse-project"
                onMouseEnter={() => setSelectedProject('finpulse')}
                className={selectedProject === 'finpulse' ? 'is-active' : ''}
              >
                <span>03</span> FinPulse
              </a>
              <a
                href="#icetray-project"
                onMouseEnter={() => setSelectedProject('icetray')}
                className={selectedProject === 'icetray' ? 'is-active' : ''}
              >
                <span>04</span> Ice Tray
              </a>
            </div>
          </div>
          <ProjectDesk selected={selectedProject} onSelect={setSelectedProject} />
        </section>

        <section
          className="portfolio-work portfolio-section"
          id="work"
          aria-labelledby="portfolio-work-title"
        >
          <div className="portfolio-section-heading">
            <div>
              <h2 id="portfolio-work-title">
                Ideas, <em>made real.</em>
              </h2>
            </div>
            <p>
              Four live systems.
              <br />
              One considered engineering standard.
            </p>
          </div>

          <article
            className="portfolio-finpulse portfolio-canvasly"
            id="canvasly-project"
            data-sc-act="flow"
            aria-labelledby="portfolio-canvasly-title"
          >
            <div className="portfolio-finpulse-topline">
              <span>
                <i /> 01 / FLAGSHIP SYSTEM
              </span>
              <span>SPATIAL WORKSPACE &amp; AI TECHOPS</span>
            </div>
            <div className="portfolio-finpulse-intro">
              <div>
                <div className="portfolio-finpulse-brand">
                  <Globe size={26} strokeWidth={1.8} aria-hidden="true" />
                  <h3 id="portfolio-canvasly-title">Canvasly</h3>
                </div>
                <p>
                  Spatial collaboration,
                  <br />
                  <em>autonomous TechOps.</em>
                </p>
              </div>
              <div className="portfolio-finpulse-description">
                <p>
                  An enterprise visual workspace paired with a 100% open-source AI TechOps &amp;
                  RevOps engine. Combines an interactive 3D capability globe and multiplayer
                  infinite canvas with 5 self-hosted n8n Redis BullMQ workflows, Groq LPU RAG
                  triage, a 0-tab support console, and Datadog APM flame graphs.
                </p>
                <div className="portfolio-finpulse-tags">
                  <span>REACT 19 &amp; 3D GLOBE</span>
                  <span>N8N + REDIS BULLMQ</span>
                  <span>GROQ LPU &amp; PGVECTOR</span>
                </div>
              </div>
            </div>
            <a
              className="portfolio-finpulse-preview"
              href="/canvasly/"
              aria-label="Open the interactive Canvasly B2B SaaS and AI TechOps platform"
            >
              <div className="portfolio-finpulse-browser">
                <span>
                  <i />
                  <i />
                  <i />
                </span>
                <span>canvasly / enterprise workspace &amp; techops</span>
                <span>LIVE ON ORACLE ARM64</span>
              </div>
              <img
                src="/demo/canvasly-workspace.jpg"
                alt="Canvasly B2B SaaS homepage featuring an interactive 3D capability globe, infinite multiplayer canvas, and open-source AI TechOps architecture"
                loading="lazy"
                width="1440"
                height="960"
              />
              <span className="portfolio-finpulse-enter">
                Enter Canvasly Platform <ArrowUpRight size={19} />
              </span>
            </a>
            <ol
              className="portfolio-finpulse-pipeline"
              aria-label="Canvasly full-stack architecture"
            >
              <li>
                <span>01 / SPATIAL SaaS &amp; 3D GLOBE</span>
                <strong>Interactive capability globe.</strong>
                <p>
                  1,150-dot Fibonacci 3D sphere, multiplayer canvas, and Magic Import™ schema
                  rescue.
                </p>
              </li>
              <li>
                <span>02 / N8N QUEUE &amp; GROQ RAG</span>
                <strong>Zero-cost autonomous triage.</strong>
                <p>
                  5 self-hosted n8n workflows on Redis 7 BullMQ with pgvector semantic routing.
                </p>
              </li>
              <li>
                <span>03 / 0-TAB CONSOLE &amp; APM</span>
                <strong>Unified support &amp; telemetry.</strong>
                <p>
                  Plain/Linear command bar (Cmd+K), 1-click Stripe refunds, and Datadog flame
                  graphs.
                </p>
              </li>
            </ol>
            <div className="portfolio-finpulse-bottom">
              <p>
                <i /> OCI Always Free ARM64 · Self-Hosted n8n · Groq LPU · PostgreSQL 16 pgvector
              </p>
              <div>
                <a
                  className="portfolio-finpulse-source"
                  href="https://github.com/AmosAlloyce/canvasly-techops"
                  target="_blank"
                  rel="noreferrer"
                >
                  <Github size={16} /> View source <ArrowUpRight size={14} />
                </a>
                <a className="portfolio-finpulse-launch" href="/canvasly/">
                  Launch Canvasly <ArrowUpRight size={18} />
                </a>
              </div>
            </div>
          </article>

          <article className="portfolio-project" id="peopleos-project" data-sc-act="flow">
            <div className="portfolio-project-topline">
              <span>
                <i />
                02 / FLAGSHIP SYSTEM
              </span>
              <span>PEOPLE &amp; OPERATIONS</span>
            </div>
            <div className="portfolio-project-intro">
              <div>
                <div className="portfolio-project-title">
                  <span className="portfolio-project-logo">
                    <span />
                    <span />
                    <span />
                  </span>
                  <h3>PeopleOS</h3>
                </div>
                <p>
                  Good people deserve
                  <br />
                  <em>better systems.</em>
                </p>
              </div>
              <div className="portfolio-project-summary">
                <p>
                  An AI-assisted HR workspace for the complexity of a multi-country team. Migration,
                  people operations, and data quality, with humans in control.
                </p>
                <div className="portfolio-project-tags">
                  <span>HR SYSTEMS</span>
                  <span>AGENT ORCHESTRATION</span>
                  <span>DATA ENGINEERING</span>
                </div>
              </div>
            </div>
            <a
              className="portfolio-project-preview"
              href="/app"
              aria-label="Open the interactive PeopleOS workspace"
            >
              <div className="portfolio-browser-bar">
                <span className="portfolio-browser-dots">
                  <i />
                  <i />
                  <i />
                </span>
                <span>
                  <ShieldCheck size={11} />
                  peopleos / workspace
                </span>
                <span className="portfolio-preview-live">
                  <i />
                  INTERACTIVE DEMO
                </span>
              </div>
              <img
                src="/demo/workspace.jpg"
                alt="PeopleOS workspace showing a workforce overview, data quality checks, and an AI operations assistant"
                loading="lazy"
                width="1440"
                height="960"
              />
              <span className="portfolio-preview-cta">
                Enter the workspace <ArrowUpRight size={20} />
              </span>
            </a>
            <ol
              className="portfolio-project-pipeline"
              aria-label="PeopleOS architecture pillars"
            >
              <li>
                <span>01 / MULTI-COUNTRY HRIS</span>
                <strong>Unified workforce record.</strong>
                <p>Country-aware profiles, policy context, and role-based access across regions.</p>
              </li>
              <li>
                <span>02 / SCHEMA &amp; MIGRATION</span>
                <strong>Deterministic quality checks.</strong>
                <p>Validates CSV imports, flags field-level anomalies, and stages clean proposals.</p>
              </li>
              <li>
                <span>03 / HUMAN IN THE LOOP</span>
                <strong>Bounded orchestration.</strong>
                <p>Four specialist orchestrators draft actions while humans own every approval.</p>
              </li>
            </ol>
            <div className="portfolio-project-bottom">
              <p>
                <span className="portfolio-live-dot" />
                Working prototype · Synthetic data · Optional live AI
              </p>
              <div>
                <a
                  className="portfolio-project-source"
                  href="https://github.com/AmosAlloyce/peopleos"
                  target="_blank"
                  rel="noreferrer"
                >
                  <Github size={16} /> View source <ArrowUpRight size={14} />
                </a>
                <button
                  className="portfolio-project-watch"
                  onClick={() => setVideoProject('peopleos')}
                >
                  <Play size={14} fill="currentColor" />
                  Watch the walkthrough
                </button>
                <a className="portfolio-button portfolio-button-lime" href="/app">
                  Launch PeopleOS <ArrowUpRight size={17} />
                </a>
              </div>
            </div>
          </article>

          <article
            className="portfolio-finpulse"
            id="finpulse-project"
            data-sc-act="flow"
            aria-labelledby="portfolio-finpulse-title"
          >
            <div className="portfolio-finpulse-topline">
              <span>
                <i /> 03 / FEATURED SYSTEM
              </span>
              <span>CREDIT DATA ENGINEERING</span>
            </div>
            <div className="portfolio-finpulse-intro">
              <div>
                <div className="portfolio-finpulse-brand">
                  <svg width="32" height="28" viewBox="0 0 32 28" fill="none" aria-hidden="true">
                    <path
                      d="M2 17h6l4-11 7 19 5-13 3 5h3"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <h3 id="portfolio-finpulse-title">FinPulse</h3>
                </div>
                <p>
                  From raw events
                  <br />
                  <em>to trusted signals.</em>
                </p>
              </div>
              <div className="portfolio-finpulse-description">
                <p>
                  Synthetic mobile-money, GSM, and loan events become traceable credit portfolio
                  data. Run the pipeline, quarantine invalid events, and follow each result back to
                  its source.
                </p>
                <div className="portfolio-finpulse-tags">
                  <span>PYTHON &amp; FASTAPI</span>
                  <span>DATA QUALITY</span>
                  <span>LINEAGE</span>
                </div>
              </div>
            </div>
            <a
              className="portfolio-finpulse-preview"
              href="/finpulse/"
              aria-label="Open the interactive FinPulse data workspace"
            >
              <div className="portfolio-finpulse-browser">
                <span>
                  <i />
                  <i />
                  <i />
                </span>
                <span>finpulse / data workspace</span>
                <span>LIVE SANDBOX</span>
              </div>
              <img
                src="/demo/finpulse-workspace.jpg"
                alt="FinPulse data workspace with pipeline status, quality checks, and credit portfolio insights"
                loading="lazy"
                width="1440"
                height="960"
              />
              <span className="portfolio-finpulse-enter">
                Explore the pipeline <ArrowUpRight size={19} />
              </span>
            </a>
            <ol
              className="portfolio-finpulse-pipeline"
              aria-label="FinPulse data processing layers"
            >
              <li>
                <span>01 / BRONZE</span>
                <strong>Keep the source.</strong>
                <p>Ingest synthetic events with immutable raw payload lineage.</p>
              </li>
              <li>
                <span>02 / SILVER</span>
                <strong>Make quality visible.</strong>
                <p>Validate schemas, normalize currencies, and quarantine bad rows.</p>
              </li>
              <li>
                <span>03 / GOLD</span>
                <strong>Build a trusted view.</strong>
                <p>Aggregate credit risk signals with traceable record-level lineage.</p>
              </li>
            </ol>
            <div className="portfolio-finpulse-bottom">
              <p>
                <i /> Synthetic sandbox · Real Python processing
              </p>
              <div>
                <a
                  className="portfolio-finpulse-source"
                  href="https://github.com/AmosAlloyce/FinPulse"
                  target="_blank"
                  rel="noreferrer"
                >
                  <Github size={16} /> View source <ArrowUpRight size={14} />
                </a>
                <button
                  className="portfolio-finpulse-watch"
                  onClick={() => setVideoProject('finpulse')}
                >
                  <Play size={14} fill="currentColor" />
                  Watch FinPulse walkthrough
                </button>
                <a className="portfolio-finpulse-launch" href="/finpulse/">
                  Launch FinPulse <ArrowUpRight size={18} />
                </a>
              </div>
            </div>
          </article>

          <article
            className="portfolio-finpulse portfolio-icetray"
            id="icetray-project"
            data-sc-act="flow"
            aria-labelledby="portfolio-icetray-title"
          >
            <div className="portfolio-finpulse-topline">
              <span>
                <i /> 04 / FEATURED SYSTEM
              </span>
              <span>INTERACTIVE PRODUCT EXPERIENCE</span>
            </div>
            <div className="portfolio-finpulse-intro">
              <div>
                <div className="portfolio-finpulse-brand">
                  <Sparkles size={26} strokeWidth={1.8} aria-hidden="true" />
                  <h3 id="portfolio-icetray-title">Ice Tray Diamonds</h3>
                </div>
                <p>
                  384 optical frames,
                  <br />
                  <em>driven by the scroll.</em>
                </p>
              </div>
              <div className="portfolio-finpulse-description">
                <p>
                  A full-stack Haute Joaillerie digital atelier pairing a 60fps inertial scroll
                  flipbook and interactive spatial canvas hotspots with an Express 5 REST API,
                  SQLite WAL edition allocation locks, live bespoke pricing, and a cryptographic GIA
                  provenance registry.
                </p>
                <div className="portfolio-finpulse-tags">
                  <span>REACT 19 &amp; CANVAS</span>
                  <span>EXPRESS 5 REST API</span>
                  <span>SQLITE WAL LEDGER</span>
                </div>
              </div>
            </div>
            <a
              className="portfolio-finpulse-preview"
              href="/ice-tray-diamonds/"
              aria-label="Open the interactive Ice Tray Diamonds digital atelier"
            >
              <div className="portfolio-finpulse-browser">
                <span>
                  <i />
                  <i />
                  <i />
                </span>
                <span>ice-tray-diamonds / digital atelier</span>
                <span>FULL-STACK LIVE</span>
              </div>
              <img
                src="/demo/icetray-workspace.jpg"
                alt="Ice Tray Diamonds scroll-flipbook website showing deconstructed diamond jewelry over a warm studio grey background"
                loading="lazy"
                width="1440"
                height="960"
              />
              <span className="portfolio-finpulse-enter">
                Enter the Digital Atelier <ArrowUpRight size={19} />
              </span>
            </a>
            <ol
              className="portfolio-finpulse-pipeline"
              aria-label="Ice Tray Diamonds full-stack architecture"
            >
              <li>
                <span>01 / SPATIAL CANVAS</span>
                <strong>60fps inertial flipbook.</strong>
                <p>Spring-damped 384-frame scroll with interactive piece hotspots &amp; audio.</p>
              </li>
              <li>
                <span>02 / BESPOKE API</span>
                <strong>Live valuation &amp; holds.</strong>
                <p>REST API calculates alloy/Type IIa pricing &amp; locks 15-min edition holds.</p>
              </li>
              <li>
                <span>03 / GIA VAULT LEDGER</span>
                <strong>SQLite WAL provenance.</strong>
                <p>Verifies SHA-256 GIA dossiers, issues Vault Passes &amp; powers Atelier OS.</p>
              </li>
            </ol>
            <div className="portfolio-finpulse-bottom">
              <p>
                <i /> React 19 · Express 5 REST API · SQLite WAL · 384-frame 60fps canvas
              </p>
              <div>
                <a
                  className="portfolio-finpulse-source"
                  href="https://github.com/AmosAlloyce/ice-tray-diamonds"
                  target="_blank"
                  rel="noreferrer"
                >
                  <Github size={16} /> View source <ArrowUpRight size={14} />
                </a>
                <button
                  className="portfolio-finpulse-watch"
                  onClick={() => setVideoProject('icetray')}
                >
                  <Play size={14} fill="currentColor" />
                  Watch Ice Tray walkthrough
                </button>
                <a className="portfolio-finpulse-launch" href="/ice-tray-diamonds/">
                  Launch Ice Tray Diamonds <ArrowUpRight size={18} />
                </a>
              </div>
            </div>
          </article>
        </section>

        <section
          className="portfolio-approach portfolio-section"
          id="approach"
          aria-labelledby="portfolio-approach-title"
        >
          <div className="portfolio-section-heading">
            <div>
              <h2 id="portfolio-approach-title">
                Intelligence needs
                <br />
                <em>good architecture.</em>
              </h2>
            </div>
            <p>
              Small, focused agents.
              <br />
              Clear boundaries. Shared context.
              <br />A person in the loop.
            </p>
          </div>
          <div className="portfolio-inside" data-sc-act="flow">
            <SystemVisual />
            <div className="portfolio-inside-notes">
              <ShieldCheck size={28} strokeWidth={1.4} />
              <h3>A human owns the decision.</h3>
              <p>
                Across Canvasly, PeopleOS, and FinPulse, bounded specialist workflows handle
                ingestion, schema healing, and retrieval while keeping high-stakes approvals and
                audit history firmly in human hands.
              </p>
              <ul>
                {departments.map((department, index) => (
                  <li key={department.id}>
                    <a
                      href={`/app/${['workflows', 'migration', 'workflows', 'service-desk'][index]}`}
                    >
                      <span>
                        <strong>{department.name}</strong>
                        <span>{department.specialists}</span>
                      </span>
                      <ArrowUpRight size={19} />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="portfolio-principles">
            <article>
              <h3>Trust the data first.</h3>
              <p>
                Validate, reconcile, and explain exceptions before they move downstream. A clear
                record beats a confident guess.
              </p>
            </article>
            <article>
              <h3>Automate with intention.</h3>
              <p>
                Let focused agents handle repeatable work. Make their work inspectable and their
                actions subject to review.
              </p>
            </article>
            <article>
              <h3>Build for the person.</h3>
              <p>
                Show what happened, why it matters, and what to do next. Useful software makes the
                next step feel obvious.
              </p>
            </article>
          </div>

          <RecordTrace />
        </section>

        <section
          className="portfolio-about portfolio-section"
          id="about"
          aria-labelledby="portfolio-about-title"
        >
          <div className="portfolio-about-heading">
            <h2 id="portfolio-about-title">
              Curious by nature.
              <br />
              <em>Engineer by practice.</em>
            </h2>
            <div className="portfolio-signature" aria-label="Alloyce Amos">
              Alloyce <span>Amos.</span>
            </div>
          </div>
          <div className="portfolio-about-copy">
            <p className="portfolio-about-lead">
              I like the space where a real operational problem meets a well-architected system.
            </p>
            <p>
              I’m Alloyce Amos, a software engineer and data engineer. My work brings together the
              parts that are often treated separately: resilient data pipelines, practical AI
              orchestration, and interfaces designed around the person making the decision.
            </p>
            <p>
              From Canvasly’s zero-cost AI TechOps &amp; infinite workspace to PeopleOS’s
              multi-country HR orchestration, FinPulse’s Bronze-Silver-Gold credit lineage, and Ice
              Tray’s 60fps spatial commerce engine, each system is built end-to-end and deployed
              live to demonstrate how I design, engineer, and ship.
            </p>
            <a
              className="portfolio-text-link"
              href="https://github.com/amosalloyce"
              target="_blank"
              rel="noreferrer"
            >
              <Github size={17} />
              Find me on GitHub <ArrowUpRight size={17} />
            </a>
            <div className="portfolio-about-details">
              <span>SOFTWARE ENGINEERING</span>
              <span>DATA ENGINEERING</span>
              <span>APPLIED AI &amp; TECHOPS</span>
            </div>
          </div>
        </section>

        <ProjectClose selected={selectedProject} onSelect={setSelectedProject} />
      </main>
      <footer className="portfolio-footer">
        <a className="portfolio-footer-name" href="#portfolio-main">
          Alloyce Amos<span>SOFTWARE ENGINEER & DATA ENGINEER</span>
        </a>
        <p>
          Independent engineering portfolio · 4 live production demos.
          <br />
          Built with React, Node.js, Python, PostgreSQL, SQLite &amp; self-hosted open-source AI.
        </p>
        <a className="portfolio-footer-top" href="#portfolio-main">
          Back to top <ArrowUpRight size={15} />
        </a>
      </footer>
      <VideoDialog project={videoProject} onClose={() => setVideoProject(null)} />
    </div>
  );
}
