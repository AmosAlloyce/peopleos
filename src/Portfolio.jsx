import { useEffect, useRef, useState } from 'react';
import {
  ArrowDown,
  ArrowUpRight,
  Code2,
  Database,
  GitBranch,
  Github,
  Layers3,
  Play,
  ShieldCheck,
  Sparkles,
  X,
} from 'lucide-react';
import './portfolio.css';

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
        <span>FIG. 001</span>
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
        <span className="portfolio-detail-number">0{selected + 1}</span>
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

function VideoDialog({ open, onClose }) {
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
          <h2 id="portfolio-video-title">PeopleOS, in motion.</h2>
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
          ref={video}
          controls
          autoPlay
          playsInline
          preload="metadata"
          poster="/demo/poster.jpg"
        >
          <source src="/demo/peopleos-demo.mp4" type="video/mp4" />
          <track
            default
            kind="captions"
            src="/demo/peopleos-demo.vtt"
            srcLang="en"
            label="English"
          />
          Your browser does not support embedded video.{' '}
          <a href="/demo/peopleos-demo.mp4">Download the walkthrough.</a>
        </video>
      )}
      <p className="portfolio-video-note">
        Follow a migration from source data to validation, human review, and an auditable result.{' '}
        <a href="/app/migration">
          Try it yourself <ArrowUpRight size={13} />
        </a>
      </p>
    </dialog>
  );
}

export default function Portfolio() {
  const [videoOpen, setVideoOpen] = useState(false);
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
            ALLOYCE AMOS<span>ENGINEER & BUILDER</span>
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
            Approach
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
        <section className="portfolio-hero" aria-labelledby="portfolio-hero-title">
          <div className="portfolio-hero-copy">
            <p className="portfolio-eyebrow">
              <span className="portfolio-live-dot" />
              SOFTWARE ENGINEER & DATA ENGINEER
            </p>
            <h1 id="portfolio-hero-title">
              Useful systems.
              <br />
              <em>Human impact.</em>
            </h1>
            <p className="portfolio-hero-description">
              I’m Alloyce. I connect software, data, and AI to make complex work feel simple.
              Thoughtfully built, from the first pipeline to the final pixel.
            </p>
            <div className="portfolio-hero-actions">
              <a className="portfolio-button portfolio-button-dark" href="#work">
                Explore my work <ArrowDown size={17} />
              </a>
              <a className="portfolio-text-link" href="/app">
                Meet PeopleOS <ArrowUpRight size={17} />
              </a>
            </div>
            <div className="portfolio-hero-footnote">
              <span>BUILT WITH INTENTION.</span>
              <span>DESIGNED FOR PEOPLE.</span>
            </div>
          </div>
          <SystemVisual />
        </section>

        <div className="portfolio-practice-strip" aria-label="Areas of practice">
          <span>MY PRACTICE</span>
          <p>
            Software engineering <i />
            Data systems <i />
            Applied AI <i />
            Thoughtful interfaces
          </p>
          <Code2 size={20} strokeWidth={1.4} aria-hidden="true" />
        </div>

        <section
          className="portfolio-work portfolio-section"
          id="work"
          aria-labelledby="portfolio-work-title"
        >
          <div className="portfolio-section-heading">
            <div>
              <p className="portfolio-eyebrow">01 / SELECTED WORK</p>
              <h2 id="portfolio-work-title">
                An idea, <em>made real.</em>
              </h2>
            </div>
            <p>
              One connected system.
              <br />A lot of considered decisions.
            </p>
          </div>
          <article className="portfolio-project">
            <div className="portfolio-project-topline">
              <span>
                <i />
                FLAGSHIP PROJECT
              </span>
              <span>01 / PEOPLE & OPERATIONS</span>
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
                  people operations, and data quality—with humans in control.
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
            <div className="portfolio-project-bottom">
              <p>
                <span className="portfolio-live-dot" />
                Working prototype · Synthetic data · Optional live AI
              </p>
              <div>
                <button className="portfolio-project-watch" onClick={() => setVideoOpen(true)}>
                  <Play size={14} fill="currentColor" />
                  Watch the walkthrough
                </button>
                <a className="portfolio-button portfolio-button-lime" href="/app">
                  Launch PeopleOS <ArrowUpRight size={17} />
                </a>
              </div>
            </div>
          </article>

          <div className="portfolio-case-notes">
            <div>
              <span className="portfolio-small-index">THE CHALLENGE</span>
              <h3>
                Complexity is inevitable.
                <br />
                Friction is a choice.
              </h3>
            </div>
            <p>
              Moving HR data across systems is more than a file transfer. Different country rules,
              inconsistent records, and disconnected teams make every handoff matter. PeopleOS makes
              those handoffs visible, testable, and easier to manage.
            </p>
            <a className="portfolio-text-link" href="/app/migration">
              Explore the migration lab <ArrowUpRight size={17} />
            </a>
          </div>
        </section>

        <section
          className="portfolio-approach portfolio-section"
          id="approach"
          aria-labelledby="portfolio-approach-title"
        >
          <div className="portfolio-section-heading">
            <div>
              <p className="portfolio-eyebrow">02 / UNDER THE SURFACE</p>
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
          <div className="portfolio-architecture">
            <div className="portfolio-architecture-header">
              <span>
                <GitBranch size={17} /> THE ORCHESTRATION MODEL
              </span>
              <span>
                EXPLORE IT LIVE <ArrowDown size={14} />
              </span>
            </div>
            <div className="portfolio-human">
              <div className="portfolio-human-icon">
                <ShieldCheck size={20} />
              </div>
              <div>
                <strong>A human owns the decision.</strong>
                <p>Agents propose. People approve. Every change leaves a trace.</p>
              </div>
              <span>HUMAN REVIEW</span>
            </div>
            <div className="portfolio-architecture-branches" aria-hidden="true">
              <span />
              <span />
              <span />
              <span />
            </div>
            <div className="portfolio-departments">
              {departments.map((department, index) => {
                const Icon = department.icon;
                return (
                  <a
                    className="portfolio-department"
                    key={department.id}
                    href={`/app/${['workflows', 'migration', 'workflows', 'service-desk'][index]}`}
                  >
                    <span className="portfolio-department-number">
                      0{index + 1}
                      <ArrowUpRight size={15} />
                    </span>
                    <Icon className="portfolio-department-icon" size={25} strokeWidth={1.5} />
                    <h3>{department.name}</h3>
                    <p>{department.specialists}</p>
                    <span className="portfolio-department-footer">
                      <i />
                      DEPARTMENT ORCHESTRATOR
                    </span>
                  </a>
                );
              })}
            </div>
            <div className="portfolio-shared-layer">
              <span>
                <Database size={15} />A SHARED FOUNDATION
              </span>
              <p>
                Validated data<span>/</span>Policy context<span>/</span>Audit history<span>/</span>
                Session isolation
              </p>
            </div>
          </div>
          <div className="portfolio-principles">
            <article>
              <span className="portfolio-principle-index">
                01 <span />
              </span>
              <h3>Trust the data first.</h3>
              <p>
                Validate, reconcile, and explain exceptions before they move downstream. A clear
                record beats a confident guess.
              </p>
            </article>
            <article>
              <span className="portfolio-principle-index">
                02 <span />
              </span>
              <h3>Automate with intention.</h3>
              <p>
                Let focused agents handle repeatable work. Make their work inspectable and their
                actions subject to review.
              </p>
            </article>
            <article>
              <span className="portfolio-principle-index">
                03 <span />
              </span>
              <h3>Build for the person.</h3>
              <p>
                Show what happened, why it matters, and what to do next. Useful software makes the
                next step feel obvious.
              </p>
            </article>
          </div>
        </section>

        <section className="portfolio-demo-section" aria-labelledby="portfolio-demo-title">
          <div className="portfolio-demo-inner">
            <div className="portfolio-demo-copy">
              <p className="portfolio-eyebrow">LESS SLIDES. MORE SOFTWARE.</p>
              <h2 id="portfolio-demo-title">
                Take it
                <br />
                <em>for a spin.</em>
              </h2>
              <p>
                Follow a data migration from first check to final approval. Then try the workspace
                yourself—including an assistant you can talk to.
              </p>
              <div className="portfolio-demo-actions">
                <button
                  className="portfolio-button portfolio-button-dark"
                  onClick={() => setVideoOpen(true)}
                >
                  <Play size={14} fill="currentColor" />
                  Play the walkthrough
                </button>
                <a className="portfolio-text-link" href="/app">
                  Open live demo <ArrowUpRight size={16} />
                </a>
              </div>
              <span className="portfolio-demo-caption">RECORDED WALKTHROUGH · SYNTHETIC DATA</span>
            </div>
            <button
              className="portfolio-film"
              onClick={() => setVideoOpen(true)}
              aria-label="Play the PeopleOS recorded walkthrough"
            >
              <img
                src="/demo/poster.jpg"
                alt="Preview of the PeopleOS recorded product walkthrough"
                loading="lazy"
                width="1440"
                height="900"
              />
              <span className="portfolio-film-shade" />
              <span className="portfolio-film-topline">
                <span>PEOPLEOS / IN MOTION</span>
                <span>PRODUCT WALKTHROUGH</span>
              </span>
              <span className="portfolio-film-play">
                <Play size={26} fill="currentColor" />
              </span>
              <span className="portfolio-film-bottom">
                <span>
                  From messy data.
                  <br />
                  <em>To a confident decision.</em>
                </span>
                <ArrowUpRight size={24} />
              </span>
            </button>
          </div>
        </section>

        <section
          className="portfolio-about portfolio-section"
          id="about"
          aria-labelledby="portfolio-about-title"
        >
          <div className="portfolio-about-heading">
            <p className="portfolio-eyebrow">03 / THE PERSON BEHIND THE BUILD</p>
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
              I like the space where a real problem meets a well-built system.
            </p>
            <p>
              I’m Alloyce Amos, a software engineer and data engineer. My work brings together the
              parts that are often treated separately: reliable data, practical automation, and an
              interface that makes sense to the person using it.
            </p>
            <p>
              PeopleOS is an independent exploration of that approach, inspired by the operational
              challenges of growing teams across Africa. It’s a working demonstration of how I
              think, design, and build.
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
              <span>APPLIED AI</span>
            </div>
          </div>
        </section>

        <section className="portfolio-contact">
          <div>
            <p className="portfolio-eyebrow">GOOD WORK STARTS WITH A CONVERSATION.</p>
            <h2>
              Let’s build something
              <br />
              <em>that matters.</em>
            </h2>
          </div>
          <a
            href="https://github.com/amosalloyce"
            target="_blank"
            rel="noreferrer"
            aria-label="Connect with Alloyce Amos on GitHub"
          >
            <ArrowUpRight size={45} strokeWidth={1.3} />
          </a>
        </section>
      </main>
      <footer className="portfolio-footer">
        <a className="portfolio-footer-name" href="#portfolio-main">
          Alloyce Amos<span>SOFTWARE ENGINEER & DATA ENGINEER</span>
        </a>
        <p>
          Independent portfolio. PeopleOS uses synthetic data.
          <br />
          Not affiliated with Wave or any HRIS vendor.
        </p>
        <a className="portfolio-footer-top" href="#portfolio-main">
          Back to top <ArrowUpRight size={15} />
        </a>
      </footer>
      <VideoDialog open={videoOpen} onClose={() => setVideoOpen(false)} />
    </div>
  );
}
