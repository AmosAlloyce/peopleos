import React, { useEffect, useState } from 'react';
import {
  ArrowDownToLine,
  ArrowRight,
  ArrowUpRight,
  Check,
  CheckCheck,
  ChevronDown,
  ChevronRight,
  Clock3,
  ClipboardCheck,
  Code2,
  Database,
  FileCheck2,
  GitBranch,
  Headphones,
  Layers3,
  Network,
  Play,
  Plus,
  ShieldCheck,
  Sparkles,
  Users,
  Workflow,
  X,
  Zap,
} from 'lucide-react';
import { api } from '../lib/api.js';
import { Badge, Busy, Empty, Modal, Panel, formatStatus, timeAgo } from './UI.jsx';
const scenarios = [
  {
    id: 'migration',
    name: 'Migration validation',
    subtitle: 'Extract, validate, reconcile',
    icon: Database,
    color: 'blue',
    orchestrator: 'Data',
    nodes: [
      ['data-lead', 'Plan the review'],
      ['extract', 'Extract snapshot'],
      ['mapping', 'Map target schema'],
      ['quality', 'Validate records'],
      ['reconcile', 'Reconcile target'],
      ['privacy', 'Review boundaries'],
    ],
  },
  {
    id: 'onboarding',
    name: 'New joiner journey',
    subtitle: 'A thoughtful first day',
    icon: Users,
    color: 'purple',
    orchestrator: 'People',
    nodes: [
      ['people-lead', 'Plan onboarding'],
      ['identity', 'Verify identity'],
      ['access', 'Plan access'],
      ['learning', 'Prepare learning'],
      ['onboarding', 'Stage handoff'],
    ],
  },
  {
    id: 'service-desk',
    name: 'Intelligent service desk',
    subtitle: 'The right request, the right team',
    icon: Headphones,
    color: 'green',
    orchestrator: 'Service',
    nodes: [
      ['service-lead', 'Scope the queue'],
      ['classify', 'Classify requests'],
      ['policy', 'Retrieve guidance'],
      ['routing', 'Validate routing'],
      ['response', 'Draft responses'],
    ],
  },
  {
    id: 'payroll',
    name: 'Payroll readiness',
    subtitle: 'Confidence before the cut-off',
    icon: FileCheck2,
    color: 'amber',
    orchestrator: 'Payroll',
    nodes: [
      ['payroll-lead', 'Scope the records'],
      ['country', 'Validate countries'],
      ['payroll', 'Check readiness'],
      ['exceptions', 'Group exceptions'],
      ['reporting', 'Prepare report'],
    ],
  },
];
const nodeIcons = {
  extract: Database,
  mapping: GitBranch,
  quality: ShieldCheck,
  reconcile: CheckCheck,
  privacy: ShieldCheck,
  identity: Users,
  access: Layers3,
  learning: FileCheck2,
  onboarding: ClipboardCheck,
  classify: Layers3,
  policy: FileCheck2,
  routing: GitBranch,
  response: Headphones,
  country: Network,
  payroll: FileCheck2,
  exceptions: ShieldCheck,
  reporting: FileCheck2,
};
export default function WorkflowStudio({ workspace, scenario, setScenario, refresh, notify }) {
  const [run, setRun] = useState(null),
    [busy, setBusy] = useState(false),
    [decisionBusy, setDecisionBusy] = useState(false),
    [selected, setSelected] = useState(null),
    [tab, setTab] = useState('canvas'),
    [registry, setRegistry] = useState(false),
    [error, setError] = useState('');
  const config = scenarios.find((s) => s.id === scenario) || scenarios[0];
  useEffect(() => {
    setRun(null);
    setSelected(null);
    setError('');
  }, [scenario]);
  async function execute() {
    setBusy(true);
    setError('');
    setSelected(null);
    try {
      const next = await api('/runs', { scenario });
      setRun(next);
      await refresh();
      notify('Workflow executed. Review the proposal before applying changes.');
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  async function decide(decision) {
    setDecisionBusy(true);
    setError('');
    try {
      const next = await api(`/runs/${run.id}/approve`, { decision });
      setRun(next);
      await refresh();
      notify(
        decision === 'approve'
          ? 'Approved. Demo changes applied and recorded in the audit trail.'
          : 'Proposal rejected. Employee records are unchanged.',
      );
    } catch (e) {
      setError(e.message);
    } finally {
      setDecisionBusy(false);
    }
  }
  const existingRuns = workspace.runs.filter((r) => r.scenario === scenario);
  const activeStep = run?.steps.find((s) => s.id === selected);
  const activeAgent = workspace.agents.find((a) => a.id === (activeStep?.agent || selected));
  function choose(id) {
    setScenario(id);
    setRun(null);
    setSelected(null);
  }
  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">THE INTELLIGENCE BEHIND THE OPERATIONS</div>
          <h1>Good systems work together.</h1>
          <p>Follow the work from a single request to a considered decision.</p>
        </div>
        <div className="heading-actions">
          <button className="button" onClick={() => setRegistry(true)}>
            <Network size={15} />
            Agent directory<span className="button-counter">{workspace.agents.length}</span>
          </button>
          <a className="button" href="/workflows/peopleos-migration.json" download>
            <ArrowDownToLine size={15} />
            n8n export
          </a>
        </div>
      </div>
      <div className="workflow-layout">
        <aside className="workflow-library">
          <div className="library-heading">
            <span className="eyebrow">WORKFLOW LIBRARY</span>
            <Badge>04</Badge>
          </div>
          {scenarios.map((s) => (
            <button
              key={s.id}
              className={`workflow-choice ${scenario === s.id ? 'selected' : ''}`}
              onClick={() => choose(s.id)}
            >
              <span className={`${s.color}-bg`}>
                <s.icon size={18} />
              </span>
              <div>
                <strong>{s.name}</strong>
                <small>{s.subtitle}</small>
              </div>
              <ChevronRight size={14} />
            </button>
          ))}
          <div className="library-note">
            <ShieldCheck size={21} />
            <strong>Designed for trust.</strong>
            <p>Specialists investigate. Orchestrators coordinate. You make the final call.</p>
            <span>Every change has an audit trail.</span>
          </div>
          <div className="recent-runs">
            <span className="eyebrow">RECENT RUNS</span>
            {existingRuns.length === 0 ? (
              <p>No runs yet. Your first rehearsal starts here.</p>
            ) : (
              existingRuns.slice(0, 5).map((r) => (
                <button
                  key={r.id}
                  onClick={() => {
                    setRun(r);
                    setSelected(null);
                  }}
                  className={run?.id === r.id ? 'active' : ''}
                >
                  <span className={`run-status-dot ${r.status}`} />
                  <div>
                    <strong>{r.id}</strong>
                    <small>{timeAgo(r.createdAt)}</small>
                  </div>
                  <ChevronRight size={13} />
                </button>
              ))
            )}
          </div>
        </aside>
        <section className="studio">
          <div className="studio-header">
            <div>
              <span className={`studio-icon ${config.color}-bg`}>
                <config.icon size={20} />
              </span>
              <div>
                <h2>{config.name}</h2>
                <p>
                  {config.orchestrator} orchestrator <span>·</span> {config.nodes.length - 1}{' '}
                  specialists <span>·</span> Human review
                </p>
              </div>
            </div>
            <button className="button primary" onClick={execute} disabled={busy || decisionBusy}>
              {busy ? (
                <Busy>Executing…</Busy>
              ) : (
                <>
                  <Play size={14} />
                  Run workflow
                </>
              )}
            </button>
          </div>
          <div className="studio-toolbar">
            <div className="studio-tabs">
              <button className={tab === 'canvas' ? 'active' : ''} onClick={() => setTab('canvas')}>
                <Workflow size={14} />
                Workflow
              </button>
              <button
                className={tab === 'execution' ? 'active' : ''}
                onClick={() => setTab('execution')}
              >
                <Code2 size={14} />
                Execution log{run && <span>{run.steps.length}</span>}
              </button>
            </div>
            <Badge tone={run?.mode === 'live' ? 'purple' : 'neutral'} dot>
              {run?.mode === 'live' ? 'AI summary enabled' : 'Deterministic execution'}
            </Badge>
          </div>
          {error && (
            <div className="studio-error" role="alert">
              {error}
            </div>
          )}
          {tab === 'canvas' ? (
            <div className="workflow-canvas">
              <div className="canvas-context">
                <span>
                  <i className="green-dot" />
                  Synthetic data workspace
                </span>
                <span>{run ? `${run.steps.length} steps executed` : 'Ready to run'}</span>
              </div>
              <div className="canvas-start">
                <span>
                  <Zap size={17} />
                </span>
                <div>
                  <strong>Manual trigger</strong>
                  <small>You start the workflow</small>
                </div>
                <Badge tone="green">Input</Badge>
              </div>
              <div className="canvas-spine" />
              <div className="canvas-orchestrator">
                <span>
                  <Network size={22} />
                </span>
                <div>
                  <small>DEPARTMENT ORCHESTRATOR</small>
                  <strong>{config.orchestrator} operations</strong>
                </div>
                <i />
                <Badge tone="purple">Coordinate</Badge>
              </div>
              <div className="canvas-spine fork" />
              <div className="canvas-nodes">
                {config.nodes.map(([id, label], i) => {
                  const step = run?.steps[i],
                    I = nodeIcons[id] || Network;
                  return (
                    <button
                      key={id}
                      className={`canvas-node ${step ? 'executed' : ''} ${step?.status === 'warning' ? 'warning' : ''} ${selected === (step?.id || id) ? 'selected' : ''}`}
                      onClick={() => setSelected(step?.id || id)}
                    >
                      <span
                        className={`node-icon ${i === 0 ? 'purple-bg' : i === 3 ? 'green-bg' : 'blue-bg'}`}
                      >
                        <I size={19} />
                      </span>
                      <div>
                        <small>
                          {String(i + 1).padStart(2, '0')} /{' '}
                          {i === 0 ? 'ORCHESTRATOR' : 'SPECIALIST'}
                        </small>
                        <strong>{step?.label || label}</strong>
                      </div>
                      <span className={`node-indicator ${step?.status || ''}`}>
                        {step ? step.status === 'warning' ? '!' : <Check size={12} /> : <span />}
                      </span>
                      <div className="node-bottom">
                        <span>{workspace.agents.find((a) => a.id === id)?.name || id}</span>
                        <small>{step ? `${step.durationMs}ms` : 'Ready'}</small>
                      </div>
                    </button>
                  );
                })}
              </div>
              <div className="canvas-spine" />
              <div className={`canvas-approval ${run?.status === 'completed' ? 'approved' : ''}`}>
                <span>
                  <ClipboardCheck size={20} />
                </span>
                <div>
                  <strong>
                    {run?.status === 'completed'
                      ? 'Approved & recorded'
                      : run?.status === 'rejected'
                        ? 'Proposal rejected'
                        : 'Human review & approval'}
                  </strong>
                  <small>
                    {run ? 'Review the actual output below' : 'No writes before your decision'}
                  </small>
                </div>
                <ShieldCheck size={18} />
              </div>
              <div className="canvas-legend">
                <span>
                  <i className="legend-dot" />
                  Tool execution
                </span>
                <span>
                  <i className="legend-dot purple" />
                  Orchestration
                </span>
                <span>
                  <i className="legend-dot amber" />
                  Human control
                </span>
              </div>
            </div>
          ) : (
            <div className="execution-log">
              {run ? (
                <>
                  <div className="log-meta">
                    <code>{run.id}</code>
                    <span>{new Date(run.createdAt).toLocaleString()}</span>
                    <Badge>{formatStatus(run.status)}</Badge>
                  </div>
                  {run.steps.map((s, i) => (
                    <button className="log-step" key={s.id} onClick={() => setSelected(s.id)}>
                      <span className={`log-check ${s.status === 'warning' ? 'warning' : ''}`}>
                        {s.status === 'warning' ? '!' : <Check size={13} />}
                      </span>
                      <div>
                        <strong>
                          {String(i + 1).padStart(2, '0')} · {s.label}
                        </strong>
                        <p>{s.detail}</p>
                      </div>
                      <code>{s.durationMs}ms</code>
                      <ChevronRight size={14} />
                    </button>
                  ))}
                </>
              ) : (
                <Empty title="The story starts with a run">
                  Execute this workflow to see each tool’s actual output, timing, and validation
                  result.
                </Empty>
              )}
            </div>
          )}
          <div className="studio-bottom">
            <span>
              <ShieldCheck size={14} />
              Bounded tools · explicit rules · reviewable outputs
            </span>
            <span>v1.0</span>
          </div>
        </section>
      </div>
      {run && (
        <section className="run-result">
          <div className="run-result-heading">
            <span className={`result-icon ${run.status === 'completed' ? 'green-bg' : 'amber-bg'}`}>
              <ClipboardCheck size={24} />
            </span>
            <div>
              <div className="eyebrow">
                {run.status === 'awaiting_approval' ? 'READY FOR YOUR REVIEW' : 'DECISION RECORDED'}
              </div>
              <h2>{run.proposal.title}</h2>
              <p>
                {run.status === 'completed'
                  ? run.result
                  : run.status === 'rejected'
                    ? 'You rejected this proposal. No employee records or requests were changed by this run.'
                    : run.summary}
              </p>
            </div>
            <Badge
              tone={
                run.status === 'awaiting_approval'
                  ? 'amber'
                  : run.status === 'completed'
                    ? 'green'
                    : 'neutral'
              }
            >
              {formatStatus(run.status)}
            </Badge>
          </div>
          <p className="proposal-description">{run.proposal.description}</p>
          {run.proposal.fixes?.length > 0 && (
            <div className="proposal-table table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Record</th>
                    <th>Field</th>
                    <th>Before</th>
                    <th>After approval</th>
                  </tr>
                </thead>
                <tbody>
                  {run.proposal.fixes.map((f, i) => (
                    <tr key={i}>
                      <td>{f.employeeId}</td>
                      <td>{f.field}</td>
                      <td>
                        <code className="source-value">{f.before || 'Missing'}</code>
                      </td>
                      <td>
                        <code className="target-value">{f.after}</code>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {run.proposal.tasks && (
            <ul className="proposal-tasks">
              {run.proposal.tasks.map((t) => (
                <li key={t}>
                  <Check size={14} />
                  {t}
                </li>
              ))}
            </ul>
          )}
          {run.proposal.routes && (
            <div className="proposal-routes">
              {run.proposal.routes.map((r) => (
                <div key={r.ticketId}>
                  <span>{r.ticketId}</span>
                  <strong>{r.subject}</strong>
                  <ArrowRight size={14} />
                  <Badge>{r.assignee}</Badge>
                </div>
              ))}
            </div>
          )}
          {run.proposal.report && (
            <div className="report-summary">
              <span>
                <strong>{run.proposal.report.records}</strong>profiles checked
              </span>
              <span>
                <strong>{run.proposal.report.exceptions}</strong>readiness exceptions
              </span>
              <span>
                <strong>{run.proposal.report.countries}</strong>countries represented
              </span>
            </div>
          )}
          {run.proposal.blocked && (
            <p className="form-error">
              Identity exceptions must be resolved before this handoff can be approved.
            </p>
          )}
          {run.status === 'awaiting_approval' ? (
            <div className="approval-actions">
              <span>
                <ShieldCheck size={16} />
                Your decision is recorded in the audit trail.
              </span>
              <button className="button" onClick={() => decide('reject')} disabled={decisionBusy}>
                Reject proposal
              </button>
              <button
                className="button primary"
                onClick={() => decide('approve')}
                disabled={decisionBusy || run.proposal.blocked}
              >
                {decisionBusy ? (
                  <Busy>Recording decision…</Busy>
                ) : (
                  <>
                    <Check size={16} />
                    Approve changes
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="decision-complete">
              <Check size={17} />
              {run.status === 'completed'
                ? 'Demo changes applied. The directory, metrics, and audit trail now reflect this decision.'
                : 'Proposal closed. No changes from this run were applied.'}
            </div>
          )}
        </section>
      )}
      {!run && (
        <div className="studio-empty-note">
          <Sparkles size={18} />
          <span>
            Run a rehearsal to see computed validation results and a proposal you can approve or
            reject.
          </span>
        </div>
      )}
      {selected && (
        <Modal
          title={activeStep?.label || activeAgent?.name || 'Workflow step'}
          onClose={() => setSelected(null)}
          drawer
        >
          <Badge tone={activeStep?.status === 'warning' ? 'amber' : 'green'}>
            {activeStep ? formatStatus(activeStep.status) : 'Ready to execute'}
          </Badge>
          <h3>{activeAgent?.name}</h3>
          <p>{activeAgent?.description}</p>
          {activeStep ? (
            <>
              <div className="step-detail">
                <strong>Execution result</strong>
                <p>{activeStep.detail}</p>
                <span className="small-meta">
                  Computed in {activeStep.durationMs}ms · {run.id}
                </span>
              </div>
              <h4>Tool output</h4>
              <pre className="tool-output">{JSON.stringify(activeStep.output, null, 2)}</pre>
            </>
          ) : (
            <div className="inline-note">
              <Play size={17} />
              Run the workflow to inspect this specialist’s output.
            </div>
          )}
        </Modal>
      )}
      {registry && (
        <Modal title="The people behind your agents" onClose={() => setRegistry(false)} wide>
          <p>
            Four department orchestrators coordinate 18 bounded specialists. The demo executes
            explicit tools and validation rules; optional Groq adds explanations. These are software
            capabilities, not autonomous employee decision makers.
          </p>
          <div className="agent-registry">
            {workspace.agents.map((a) => (
              <div key={a.id}>
                <span className={a.kind === 'orchestrator' ? 'purple-bg' : 'blue-bg'}>
                  {a.kind === 'orchestrator' ? <Network size={19} /> : <Zap size={18} />}
                </span>
                <div>
                  <strong>{a.name}</strong>
                  <Badge tone={a.kind === 'orchestrator' ? 'purple' : 'neutral'}>
                    {a.department}
                  </Badge>
                  <p>{a.description}</p>
                </div>
              </div>
            ))}
          </div>
        </Modal>
      )}
    </>
  );
}
