import { useEffect, useRef, useState } from 'react';
import { ArrowUpRight, Check, FileCode2, GitBranch, ShieldCheck } from 'lucide-react';
import './portfolio-craft.css';

// This record and rule mirror server/data.mjs and validateEmployees in server/workflows.mjs.
// The illustration never mutates a visitor's PeopleOS session.
const sample = {
  id: 'EMP-002',
  source: 'moussa.diop peopleos.example',
  proposed: 'moussa.diop@peopleos.example',
  rule: /^[^\s@]+@peopleos\.example$/,
};

const traceSteps = [
  {
    title: 'Start with the source.',
    label: 'Source',
    text: 'A missing @ makes this seeded email invalid. Keep the original value so the problem stays inspectable.',
  },
  {
    title: 'Make the check explicit.',
    label: 'Check',
    text: 'A deterministic format rule flags the field. There is no model guessing whether this address is valid.',
  },
  {
    title: 'Put a person at the boundary.',
    label: 'Review',
    text: 'The sample source-of-truth value becomes a proposal. A reviewer can inspect the before and after before applying it.',
  },
  {
    title: 'Keep the decision connected.',
    label: 'Audit',
    text: 'In the working app, approval records the action and its result. This illustration leaves the record unchanged.',
  },
];

function useDeskDepth(ref) {
  useEffect(() => {
    const element = ref.current;
    if (!element) return undefined;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    const fine = window.matchMedia('(hover: hover) and (pointer: fine)');
    let frame = 0;
    let pointerX = 0;
    let pointerY = 0;
    const render = () => {
      frame = 0;
      const rect = element.getBoundingClientRect();
      const progress = reduced.matches
        ? 0
        : Math.min(
            1,
            Math.max(
              0,
              (window.innerHeight * 0.38 - rect.top) / (rect.height + window.innerHeight * 0.15),
            ),
          );
      element.style.setProperty('--desk-progress', progress.toFixed(4));
      element.style.setProperty('--desk-x', reduced.matches ? '0' : pointerX.toFixed(3));
      element.style.setProperty('--desk-y', reduced.matches ? '0' : pointerY.toFixed(3));
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(render);
    };
    const move = (event) => {
      if (!fine.matches || reduced.matches) return;
      const rect = element.getBoundingClientRect();
      pointerX = (event.clientX - rect.left) / rect.width - 0.5;
      pointerY = (event.clientY - rect.top) / rect.height - 0.5;
      schedule();
    };
    const leave = () => {
      pointerX = 0;
      pointerY = 0;
      schedule();
    };
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    element.addEventListener('pointermove', move);
    element.addEventListener('pointerleave', leave);
    reduced.addEventListener('change', schedule);
    schedule();
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      element.removeEventListener('pointermove', move);
      element.removeEventListener('pointerleave', leave);
      reduced.removeEventListener('change', schedule);
    };
  }, [ref]);
}

export function ProjectDesk({ selected, onSelect }) {
  const ref = useRef(null);
  useDeskDepth(ref);
  return (
    <div
      ref={ref}
      className={`portfolio-desk is-${selected}`}
      aria-label="Two working project previews"
    >
      <div className="portfolio-desk-grid" aria-hidden="true" />
      <div className="portfolio-desk-axis" aria-hidden="true">
        <span /> <span />
      </div>
      <figure className="portfolio-desk-window portfolio-desk-finpulse">
        <figcaption>
          <span className="portfolio-desk-dot" /> FinPulse <span>Credit data engineering</span>
        </figcaption>
        <img
          src="/demo/finpulse-workspace.jpg"
          alt="Actual FinPulse overview, with data pipeline health and portfolio insights"
          width="1440"
          height="960"
        />
      </figure>
      <figure className="portfolio-desk-window portfolio-desk-peopleos">
        <figcaption>
          <span className="portfolio-desk-dot" /> PeopleOS <span>People operations</span>
        </figcaption>
        <img
          src="/demo/workspace.jpg"
          alt="Actual PeopleOS workspace, with workforce data and migration quality checks"
          width="1440"
          height="960"
          fetchPriority="high"
        />
      </figure>
      <div className="portfolio-desk-index" aria-label="Bring a project into focus">
        <button aria-pressed={selected === 'peopleos'} onClick={() => onSelect('peopleos')}>
          <span /> PeopleOS
        </button>
        <button aria-pressed={selected === 'finpulse'} onClick={() => onSelect('finpulse')}>
          <span /> FinPulse
        </button>
        <a
          href={selected === 'peopleos' ? '#peopleos-project' : '#finpulse-project'}
          aria-label={`Explore ${selected === 'peopleos' ? 'PeopleOS' : 'FinPulse'} project`}
        >
          <ArrowUpRight size={19} />
        </a>
      </div>
    </div>
  );
}

export function RecordTrace() {
  const [active, setActive] = useState(0);
  const section = useRef(null);
  const manualUntil = useRef(0);
  useEffect(() => {
    const media = window.matchMedia(
      '(min-width: 900px) and (prefers-reduced-motion: no-preference)',
    );
    if (!media.matches) return undefined;
    let frame = 0;
    const update = () => {
      frame = 0;
      if (!media.matches || !section.current || Date.now() < manualUntil.current) return;
      const buttons = [...section.current.querySelectorAll('.portfolio-trace-step')];
      const nearest = buttons.reduce(
        (best, button, index) => {
          const distance = Math.abs(
            button.getBoundingClientRect().top + 40 - window.innerHeight * 0.48,
          );
          return distance < best.distance ? { index, distance } : best;
        },
        { index: 0, distance: Infinity },
      );
      const rect = section.current.getBoundingClientRect();
      if (rect.top < window.innerHeight * 0.6 && rect.bottom > window.innerHeight * 0.4)
        setActive(nearest.index);
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    window.addEventListener('scroll', schedule, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', schedule);
    };
  }, []);
  const valid = sample.rule.test(active < 2 ? sample.source : sample.proposed);
  return (
    <section
      ref={section}
      className="portfolio-trace"
      data-sc-act="flow"
      aria-labelledby="portfolio-trace-title"
    >
      <div className="portfolio-trace-heading">
        <p>Small details. Visible decisions.</p>
        <h3 id="portfolio-trace-title">Follow one record.</h3>
        <p>The engineering is in what happens between the screens.</p>
      </div>
      <div className="portfolio-trace-layout">
        <div className="portfolio-trace-steps" aria-label="Record inspection steps">
          {traceSteps.map((step, index) => (
            <button
              key={step.label}
              className={`portfolio-trace-step ${active === index ? 'is-active' : ''}`}
              aria-pressed={active === index}
              aria-controls="portfolio-record-evidence"
              onClick={() => {
                manualUntil.current = Date.now() + 1000;
                setActive(index);
              }}
            >
              <span className="portfolio-trace-step-label">
                <span />
                {step.label}
              </span>
              <strong>{step.title}</strong>
              <span>{step.text}</span>
            </button>
          ))}
        </div>
        <div
          className="portfolio-trace-plate"
          id="portfolio-record-evidence"
          role="region"
          aria-label={`${traceSteps[active].label} evidence`}
        >
          <div className="portfolio-trace-plate-header">
            <FileCode2 size={18} />
            <span>{sample.id}</span>
            <span>Synthetic example</span>
          </div>
          <div className="portfolio-trace-field">
            <span>Original email</span>
            <code>
              moussa.diop<span className="portfolio-trace-error">␠</span>peopleos.example
            </code>
            <p>␠ represents the space in the source value.</p>
          </div>
          <div className={`portfolio-trace-evidence is-step-${active}`} key={active}>
            {active === 0 && (
              <>
                <span className="portfolio-trace-label">SOURCE SNAPSHOT</span>
                <h4>Preserve the original.</h4>
                <p>A field exception should always lead back to the value that caused it.</p>
              </>
            )}
            {active === 1 && (
              <>
                <span className="portfolio-trace-label">VALID COMPANY EMAIL FORMAT</span>
                <code className="portfolio-trace-rule">{sample.rule.toString()}</code>
                <p>
                  <span className="portfolio-trace-status is-failed">
                    {valid ? 'Pass' : 'Fail'}
                  </span>{' '}
                  The source does not match the rule.
                </p>
              </>
            )}
            {active === 2 && (
              <>
                <span className="portfolio-trace-label">PROPOSED VALUE</span>
                <code className="portfolio-trace-proposed">
                  moussa.diop<mark>@</mark>peopleos.example
                </code>
                <p>
                  <Check size={16} /> {valid ? 'Format check passes.' : 'Format check fails.'}{' '}
                  Approval is still required.
                </p>
              </>
            )}
            {active === 3 && (
              <>
                <span className="portfolio-trace-label">APPROVAL BOUNDARY</span>
                <h4>
                  <ShieldCheck size={24} /> Keep the human decision.
                </h4>
                <p>
                  The live workflow records who approved the proposal and what changed. No approval
                  or update occurs on this page.
                </p>
              </>
            )}
          </div>
          <a href="/app/migration">
            Inspect the working migration <ArrowUpRight size={17} />
          </a>
        </div>
      </div>
      <p className="portfolio-trace-note">
        <GitBranch size={14} /> A local illustration of the actual PeopleOS seed and validation
        rule. Open the app to run it.
      </p>
    </section>
  );
}

export function ProjectClose({ selected, onSelect }) {
  const people = selected === 'peopleos';
  return (
    <section
      className="portfolio-project-close"
      data-sc-act="flow"
      aria-labelledby="portfolio-close-title"
    >
      <div>
        <h2 id="portfolio-close-title">
          The work is open.
          <br />
          <em>Take a closer look.</em>
        </h2>
        <p>Explore the system, follow the decisions, or read the code.</p>
      </div>
      <div className="portfolio-close-choice">
        <div role="group" aria-label="Choose a project to explore">
          <button aria-pressed={people} onClick={() => onSelect('peopleos')}>
            PeopleOS
          </button>
          <button aria-pressed={!people} onClick={() => onSelect('finpulse')}>
            FinPulse
          </button>
        </div>
        <p>
          {people
            ? 'People operations, with human review built in.'
            : 'Credit data, with quality and lineage built in.'}
        </p>
        <a className="portfolio-close-launch" href={people ? '/app' : '/finpulse/'}>
          Launch {people ? 'PeopleOS' : 'FinPulse'} <ArrowUpRight size={20} />
        </a>
        <a
          className="portfolio-close-source"
          href={`https://github.com/AmosAlloyce/${people ? 'peopleos' : 'FinPulse'}`}
          target="_blank"
          rel="noreferrer"
        >
          View source <ArrowUpRight size={16} />
        </a>
      </div>
    </section>
  );
}
