import React, { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  ArrowDownToLine,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  AudioLines,
  Bell,
  BookOpen,
  BriefcaseBusiness,
  ChartNoAxesCombined,
  Check,
  CheckCheck,
  ChevronDown,
  ChevronRight,
  ChevronsUpDown,
  CircleHelp,
  ClipboardCheck,
  Clock3,
  Database,
  FileCheck2,
  FileSpreadsheet,
  Filter,
  GitBranch,
  Globe2,
  Headphones,
  LayoutDashboard,
  Layers3,
  LoaderCircle,
  Menu,
  MessageSquare,
  MoreHorizontal,
  Network,
  Play,
  Plus,
  RefreshCw,
  Search,
  Settings2,
  ShieldCheck,
  Sparkles,
  Users,
  Workflow,
  X,
  Zap,
} from 'lucide-react';
import { api } from './lib/api.js';
import {
  Avatar,
  Badge,
  Busy,
  Empty,
  IconButton,
  Modal,
  Panel,
  TextButton,
  formatStatus,
  timeAgo,
} from './components/UI.jsx';
import AfricaMap from './components/AfricaMap.jsx';
import VoiceAssistant from './components/VoiceAssistant.jsx';
import WorkflowStudio from './components/WorkflowStudio.jsx';
import ImportPreview from './components/ImportPreview.jsx';

const navigation = [
  ['overview', 'Overview', LayoutDashboard],
  ['people', 'People directory', Users],
  ['migration', 'Migration hub', Database],
  ['workflows', 'Agent studio', Workflow],
  ['service-desk', 'Service desk', Headphones],
  ['insights', 'People insights', ChartNoAxesCombined],
  ['audit', 'Audit trail', ShieldCheck],
];
const countryFlag = {
  Senegal: '🇸🇳',
  "Côte d'Ivoire": '🇨🇮',
  'Côte d’Ivoire': '🇨🇮',
  Mali: '🇲🇱',
  'Burkina Faso': '🇧🇫',
  'The Gambia': '🇬🇲',
  Gambia: '🇬🇲',
  Uganda: '🇺🇬',
  Niger: '🇳🇪',
  'Sierra Leone': '🇸🇱',
  Cameroon: '🇨🇲',
  Kenya: '🇰🇪',
  Ghana: '🇬🇭',
  Spain: '🇪🇸',
  'United Kingdom': '🇬🇧',
};
const normal = (s) => s?.replaceAll('’', "'").toLowerCase();
const toneFor = (s) =>
  ['resolved', 'active', 'approved', 'complete', 'completed'].includes(s)
    ? 'green'
    : ['open', 'awaiting_approval', 'onboarding', 'warning', 'high'].includes(s)
      ? 'amber'
      : s === 'critical'
        ? 'red'
        : 'neutral';
function Country({ name }) {
  return (
    <span className="country">
      <span>{countryFlag[name] || '◉'}</span>
      {name}
    </span>
  );
}
function PageHeader({ eyebrow, title, description, children }) {
  return (
    <div className="page-heading">
      <div>
        {eyebrow && <div className="eyebrow">{eyebrow}</div>}
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      <div className="heading-actions">{children}</div>
    </div>
  );
}
function Scope({ country, setCountry, countries }) {
  return (
    <label className="select-control">
      <Globe2 size={15} />
      <span className="sr-only">Country scope</span>
      <select value={country} onChange={(e) => setCountry(e.target.value)}>
        <option value="all">All countries</option>
        {countries.map((c) => (
          <option key={c}>{c}</option>
        ))}
      </select>
      <ChevronDown size={14} />
    </label>
  );
}
export default function HrApp() {
  const sectionFromPath = () => {
    const s = location.pathname.split('/')[2] || 'overview';
    return navigation.some((n) => n[0] === s) ? s : 'overview';
  };
  const [section, setSection] = useState(sectionFromPath),
    [workspace, setWorkspace] = useState(null),
    [health, setHealth] = useState(null),
    [error, setError] = useState(''),
    [country, setCountry] = useState('all'),
    [modal, setModal] = useState(null),
    [copilot, setCopilot] = useState(null),
    [toast, setToast] = useState(''),
    [sidebar, setSidebar] = useState(false),
    [search, setSearch] = useState(''),
    [scenario, setScenario] = useState('migration'),
    [busy, setBusy] = useState(false),
    [showImport, setShowImport] = useState(false);
  async function refresh() {
    const data = await api('/workspace');
    setWorkspace(data);
    return data;
  }
  useEffect(() => {
    let active = true;
    Promise.all([api('/workspace'), api('/health')])
      .then(([w, h]) => {
        if (active) {
          setWorkspace(w);
          setHealth(h);
        }
      })
      .catch((e) => active && setError(e.message));
    return () => {
      active = false;
    };
  }, []);
  useEffect(() => {
    const fn = () => setSection(sectionFromPath());
    window.addEventListener('popstate', fn);
    return () => window.removeEventListener('popstate', fn);
  }, []);
  useEffect(() => {
    document.title = `${navigation.find((n) => n[0] === section)?.[1]} · PeopleOS`;
  }, [section]);
  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(''), 5000);
    return () => clearTimeout(id);
  }, [toast]);
  useEffect(() => {
    const fn = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setModal({ type: 'search' });
      }
    };
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, []);
  function navigate(next) {
    setSection(next);
    history.pushState({}, '', `/app${next === 'overview' ? '' : `/${next}`}`);
    setSidebar(false);
    setSearch('');
    window.scrollTo({ top: 0, behavior: 'instant' });
  }
  function runScenario(value) {
    setScenario(value);
    navigate('workflows');
  }
  const employees = workspace?.employees || [],
    issues = workspace?.issues || [],
    tickets = workspace?.tickets || [],
    runs = workspace?.runs || [],
    audit = workspace?.audit || [],
    agents = workspace?.agents || [];
  const countries = [...new Set(employees.map((e) => e.country))].sort();
  const scoped =
    country === 'all' ? employees : employees.filter((e) => normal(e.country) === normal(country));
  const openIssues = issues.filter((i) => i.status !== 'resolved'),
    pendingRuns = runs.filter((r) => r.status === 'awaiting_approval');
  const quality = employees.length
    ? Math.round(
        (100 * (employees.length - new Set(openIssues.map((i) => i.employeeId)).size)) /
          employees.length,
      )
    : 100;
  async function reset() {
    setBusy(true);
    try {
      await api('/reset', {});
      await refresh();
      setModal(null);
      setCountry('all');
      setToast('A fresh demo workspace is ready.');
    } catch (e) {
      setToast(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="hr-app">
      <a className="skip-link" href="#main-content">
        Skip to workspace
      </a>
      {sidebar && (
        <button
          className="sidebar-backdrop"
          aria-label="Close navigation"
          onClick={() => setSidebar(false)}
        />
      )}
      <aside className={`sidebar ${sidebar ? 'is-open' : ''}`}>
        <a className="app-brand" href="/app">
          <span className="brand-mark">
            <Layers3 size={22} />
          </span>
          people<span>os</span>
          <span className="brand-dot" />
        </a>
        <button className="workspace-switch" onClick={() => setModal({ type: 'workspace' })}>
          <span className="workspace-icon">P</span>
          <span>
            <strong>People operations</strong>
            <small>Demo workspace</small>
          </span>
          <ChevronsUpDown size={14} />
        </button>
        <div className="nav-label">WORKSPACE</div>
        <nav aria-label="Workspace navigation">
          {navigation.map(([id, label, Icon]) => (
            <button
              key={id}
              className={`nav-item ${section === id ? 'active' : ''}`}
              aria-current={section === id ? 'page' : undefined}
              onClick={() => navigate(id)}
            >
              <Icon size={18} />
              <span>{label}</span>
              {id === 'migration' && openIssues.length > 0 && (
                <span className="nav-count">{openIssues.length}</span>
              )}
              {id === 'workflows' && <span className="nav-new">NEW</span>}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <button className="copilot-card" onClick={() => setCopilot('concierge')}>
            <div>
              <span className="copilot-icon">
                <AudioLines size={20} />
              </span>
              <span className="small-dot" />
              Ready when you are
            </div>
            <strong>Meet your people copilot</strong>
            <p>A helping hand. Just a conversation away.</p>
            <span className="copilot-card-link">
              Let’s talk <ArrowUpRight size={15} />
            </span>
          </button>
          <button className="nav-item" onClick={() => setModal({ type: 'guide' })}>
            <CircleHelp size={18} />
            <span>Help & documentation</span>
            <ArrowUpRight size={14} />
          </button>
          <a className="nav-item back-portfolio" href="/">
            <ArrowLeft size={17} />
            <span>Back to portfolio</span>
          </a>
          <div className="profile">
            <Avatar initials="AA" index={3} />
            <div>
              <strong>Alloyce Amos</strong>
              <small>Workspace administrator</small>
            </div>
            <button
              className="profile-settings"
              aria-label="Workspace settings"
              onClick={() => setModal({ type: 'workspace' })}
            >
              <Settings2 size={16} />
            </button>
          </div>
        </div>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <div className="breadcrumb">
            <IconButton
              label="Open navigation"
              className="mobile-menu icon-button"
              onClick={() => setSidebar(true)}
            >
              <Menu size={20} />
            </IconButton>
            <span>Workspace</span>
            <ChevronRight size={13} />
            <strong>{navigation.find((n) => n[0] === section)?.[1]}</strong>
          </div>
          <div className="topbar-actions">
            <Badge tone="green" dot>
              Demo environment
            </Badge>
            <button className="global-search" onClick={() => setModal({ type: 'search' })}>
              <Search size={15} />
              <span>Search anything</span>
              <kbd>⌘ K</kbd>
            </button>
            <span className="topbar-divider" />
            <IconButton
              label="View notifications"
              onClick={() => setModal({ type: 'notifications' })}
            >
              <Bell size={18} />
              {pendingRuns.length > 0 && <i className="notification-dot" />}
            </IconButton>
            <Avatar initials="AA" size="small" index={3} />
          </div>
        </header>
        <main id="main-content" className="app-content">
          {error ? (
            <div className="connection-error">
              <Database size={30} />
              <h1>The workspace is taking a moment.</h1>
              <p>{error}</p>
              <button className="button primary" onClick={() => location.reload()}>
                Try again
              </button>
            </div>
          ) : !workspace ? (
            <div className="workspace-loading">
              <Busy>Preparing your workspace…</Busy>
            </div>
          ) : (
            <>
              {section === 'overview' && (
                <>
                  <PageHeader
                    eyebrow="YOUR PEOPLE, IN PERSPECTIVE"
                    title="A good day to make an impact."
                    description="A little clarity for everything that keeps your people moving."
                  >
                    <Scope country={country} setCountry={setCountry} countries={countries} />
                    <button className="button primary" onClick={() => setCopilot('analyst')}>
                      <Sparkles size={15} />
                      Ask copilot
                    </button>
                  </PageHeader>
                  <div className="overview-banner">
                    <span className="banner-icon">
                      <GitBranch size={19} />
                    </span>
                    <div>
                      <strong>
                        {openIssues.length
                          ? 'Your next chapter starts with cleaner data.'
                          : 'Your data is ready for its next chapter.'}
                      </strong>
                      <span>
                        {openIssues.length
                          ? `${openIssues.length} data exceptions to review before your next migration rehearsal.`
                          : 'All configured checks are clear. Rehearse again whenever you need.'}
                      </span>
                    </div>
                    <button onClick={() => navigate('migration')}>
                      Open migration hub <ArrowRight size={16} />
                    </button>
                  </div>
                  <div className="stats-grid">
                    <Stat
                      label="People in your workspace"
                      value={scoped.length.toString().padStart(2, '0')}
                      note="Synthetic employee records"
                      icon={Users}
                      spark="bars"
                    />
                    <Stat
                      label="Connected countries"
                      value={country === 'all' ? countries.length : '01'}
                      note={country === 'all' ? 'Operating markets + talent hubs' : country}
                      icon={Globe2}
                      spark="map"
                    />
                    <Stat
                      label="Data quality"
                      value={`${quality}%`}
                      note={`${openIssues.length} exceptions need attention`}
                      icon={ShieldCheck}
                      spark="line"
                      warning={quality < 100}
                    />
                    <Stat
                      label="Open conversations"
                      value={tickets
                        .filter((t) => t.status !== 'resolved')
                        .length.toString()
                        .padStart(2, '0')}
                      note="People support cases"
                      icon={MessageSquare}
                      spark="dots"
                    />
                  </div>
                  <div className="overview-middle">
                    <Panel
                      title="People without borders"
                      subtitle="One connected team. Many local contexts."
                      action={
                        <Badge tone="green" dot>
                          Sample workforce
                        </Badge>
                      }
                      className="footprint-panel"
                    >
                      <div className="footprint-body">
                        <div className="country-legend">
                          <span className="eyebrow">OUR SHARED FOOTPRINT</span>
                          <h3>
                            Built for a<br />
                            world of people.
                          </h3>
                          <p>
                            Local understanding.
                            <br />
                            Connected operations.
                          </p>
                          <div className="country-total">
                            <strong>{country === 'all' ? countries.length : '1'}</strong>
                            <span>
                              {country === 'all' ? 'countries represented' : 'country selected'}
                            </span>
                          </div>
                          <div className="avatar-stack">
                            {employees.slice(0, 5).map((e, i) => (
                              <Avatar key={e.id} {...e} size="small" index={i} />
                            ))}
                            <span>+{Math.max(0, employees.length - 5)}</span>
                          </div>
                          <button className="text-button" onClick={() => navigate('people')}>
                            Meet the people
                            <ArrowUpRight size={14} />
                          </button>
                        </div>
                        <AfricaMap
                          employees={employees}
                          selected={country}
                          onSelect={(name) => {
                            const match = countries.find((c) => normal(c) === normal(name));
                            if (match) setCountry(match);
                          }}
                        />
                      </div>
                      <div className="footprint-footer">
                        <span>
                          <i className="legend-dot" />
                          African operations
                        </span>
                        <span>
                          <i className="legend-dot light" />
                          Remote talent hubs
                        </span>
                        <button
                          onClick={() => {
                            setCountry('all');
                            navigate('people');
                          }}
                        >
                          Explore directory <ArrowRight size={13} />
                        </button>
                      </div>
                    </Panel>
                    <Panel
                      title="Your attention, where it matters"
                      subtitle="A focused look at the next best steps."
                      action={
                        <span className="attention-count">
                          {openIssues.length +
                            pendingRuns.length +
                            tickets.filter((t) => t.status === 'open').length}
                        </span>
                      }
                      className="attention-panel"
                    >
                      <button className="attention-item" onClick={() => navigate('migration')}>
                        <span className="attention-icon amber-bg">
                          <Database size={18} />
                        </span>
                        <div>
                          <strong>Migration readiness</strong>
                          <p>{openIssues.length} data exceptions to investigate</p>
                          <Badge tone={openIssues.length ? 'amber' : 'green'}>
                            {openIssues.length ? 'Review required' : 'Checks clear'}
                          </Badge>
                        </div>
                        <ChevronRight size={16} />
                      </button>
                      <button className="attention-item" onClick={() => navigate('workflows')}>
                        <span className="attention-icon purple-bg">
                          <GitBranch size={18} />
                        </span>
                        <div>
                          <strong>
                            {pendingRuns.length
                              ? 'Proposals ready for review'
                              : 'Your agents are ready'}
                          </strong>
                          <p>
                            {pendingRuns.length
                              ? `${pendingRuns.length} runs awaiting your approval`
                              : runs.length
                                ? `${runs.length} workflows recorded in this session`
                                : 'Run your first workflow rehearsal'}
                          </p>
                          <span className="small-meta">Human approval at every write</span>
                        </div>
                        <ChevronRight size={16} />
                      </button>
                      <button className="attention-item" onClick={() => navigate('service-desk')}>
                        <span className="attention-icon blue-bg">
                          <Headphones size={18} />
                        </span>
                        <div>
                          <strong>People need a hand</strong>
                          <p>
                            {tickets.filter((t) => t.status === 'open').length} new conversations in
                            your inbox
                          </p>
                          <span className="small-meta">Let the service agent help triage</span>
                        </div>
                        <ChevronRight size={16} />
                      </button>
                      <button className="attention-footer" onClick={() => setCopilot('analyst')}>
                        <AudioLines size={17} />
                        Listen to your workspace briefing
                        <ArrowUpRight size={14} />
                      </button>
                    </Panel>
                  </div>
                  <div className="overview-bottom">
                    <Panel
                      title="The engine behind the everyday"
                      subtitle="Specialist agents, working together with purpose."
                      action={
                        <TextButton onClick={() => navigate('workflows')}>
                          Open agent studio
                        </TextButton>
                      }
                      className="engine-panel"
                    >
                      <div className="mini-agent-flow">
                        <div className="mini-node trigger-node">
                          <span>
                            <Zap size={19} />
                          </span>
                          <strong>One request</strong>
                          <small>You set the direction</small>
                        </div>
                        <div className="flow-connector">
                          <i />
                        </div>
                        <div className="mini-node orchestrator-node">
                          <span>
                            <Network size={20} />
                          </span>
                          <strong>Orchestrate</strong>
                          <small>Route to the right team</small>
                        </div>
                        <div className="flow-connector">
                          <i />
                        </div>
                        <div className="mini-node specialist-node">
                          <div className="specialist-icons">
                            <span>
                              <Database size={16} />
                            </span>
                            <span>
                              <ShieldCheck size={16} />
                            </span>
                            <span>
                              <FileCheck2 size={16} />
                            </span>
                          </div>
                          <strong>Specialists at work</strong>
                          <small>Check · reconcile · explain</small>
                        </div>
                        <div className="flow-connector">
                          <i />
                        </div>
                        <div className="mini-node review-node">
                          <span>
                            <ClipboardCheck size={20} />
                          </span>
                          <strong>Your approval</strong>
                          <small>People stay in control</small>
                        </div>
                      </div>
                      <div className="engine-footer">
                        <span>
                          <i className="green-dot" />
                          {agents.filter((a) => a.kind === 'orchestrator').length} orchestrators
                        </span>
                        <span>
                          {agents.filter((a) => a.kind === 'specialist').length} specialist
                          definitions
                        </span>
                        <span>Deterministic execution · optional AI</span>
                      </div>
                    </Panel>
                    <Panel
                      title="Recently in your workspace"
                      action={<TextButton onClick={() => navigate('audit')}>View all</TextButton>}
                      className="activity-panel"
                    >
                      <div className="activity-list">
                        {audit.slice(0, 3).map((a, i) => (
                          <div className="activity-item" key={a.id}>
                            <span className={`activity-bullet bullet-${i}`}>
                              <Check size={11} />
                            </span>
                            <div>
                              <strong>{a.action}</strong>
                              <p>{a.detail}</p>
                              <small>{timeAgo(a.createdAt)}</small>
                            </div>
                          </div>
                        ))}
                      </div>
                    </Panel>
                  </div>
                </>
              )}
              {section === 'people' && (
                <>
                  <PageHeader
                    eyebrow="PEOPLE OPERATIONS"
                    title="Every person. One place."
                    description="A connected directory for a distributed, growing team."
                  >
                    <Scope country={country} setCountry={setCountry} countries={countries} />
                    <a className="button primary" href="/api/export" download>
                      <ArrowDownToLine size={15} />
                      Export CSV
                    </a>
                  </PageHeader>
                  <div className="section-toolbar">
                    <div className="segmented">
                      <button className="selected">
                        All people <span>{scoped.length}</span>
                      </button>
                    </div>
                    <label className="search-field">
                      <Search size={16} />
                      <input
                        placeholder="Find a person, team, or role…"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        aria-label="Search people"
                      />
                    </label>
                  </div>
                  <Panel
                    title="People directory"
                    subtitle="All records are fictional and generated for this demonstration."
                    action={<Badge>{scoped.length} people</Badge>}
                  >
                    <div className="table-scroll">
                      <table>
                        <thead>
                          <tr>
                            <th>Employee</th>
                            <th>Team & role</th>
                            <th>Location</th>
                            <th>Status</th>
                            <th>Start date</th>
                            <th>
                              <span className="sr-only">View</span>
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {scoped
                            .filter((e) =>
                              `${e.name} ${e.department} ${e.role}`
                                .toLowerCase()
                                .includes(search.toLowerCase()),
                            )
                            .map((e, i) => (
                              <tr
                                key={e.id}
                                onClick={() => setModal({ type: 'employee', data: e })}
                              >
                                <td>
                                  <button
                                    className="person-cell"
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      setModal({ type: 'employee', data: e });
                                    }}
                                  >
                                    <Avatar {...e} index={i} />
                                    <span>
                                      <strong>{e.name}</strong>
                                      <small>{e.email}</small>
                                    </span>
                                  </button>
                                </td>
                                <td>
                                  <strong>{e.department}</strong>
                                  <small>{e.role}</small>
                                </td>
                                <td>
                                  <Country name={e.country} />
                                  <small>{e.location}</small>
                                </td>
                                <td>
                                  <Badge tone={toneFor(e.status)} dot>
                                    {formatStatus(e.status)}
                                  </Badge>
                                </td>
                                <td className="mono small">{e.startDate}</td>
                                <td>
                                  <ChevronRight size={15} />
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                    {scoped.filter((e) =>
                      `${e.name} ${e.department} ${e.role}`
                        .toLowerCase()
                        .includes(search.toLowerCase()),
                    ).length === 0 && (
                      <Empty title="No matching people">Try a different name or country.</Empty>
                    )}
                  </Panel>
                </>
              )}
              {section === 'migration' && (
                <>
                  <PageHeader
                    eyebrow="2026 · IMPLEMENTATION WORKSPACE"
                    title="A better move starts here."
                    description="Understand the source. Reconcile every exception. Move with confidence."
                  >
                    <button className="button" onClick={() => setShowImport(true)}>
                      <FileSpreadsheet size={15} />
                      CSV lab
                    </button>
                    <button className="button" onClick={() => setModal({ type: 'mapping' })}>
                      <GitBranch size={15} />
                      Field mapping
                    </button>
                    <button className="button primary" onClick={() => runScenario('migration')}>
                      <Play size={14} />
                      Run validation
                    </button>
                  </PageHeader>
                  <div className="migration-stages">
                    {[
                      ['01', 'Extract', 'Synthetic source loaded', true],
                      ['02', 'Transform', 'Mappings documented', true],
                      ['03', 'Validate', `${openIssues.length} exceptions to review`, false],
                      ['04', 'Review', 'Human approval required', false],
                      ['05', 'Reconcile', 'Verify target values', false],
                    ].map(([n, t, d, done], i) => (
                      <React.Fragment key={n}>
                        <div
                          className={`migration-stage ${done ? 'done' : ''} ${i === 2 ? 'current' : ''}`}
                        >
                          <span>{done ? <Check size={16} /> : n}</span>
                          <div>
                            <strong>{t}</strong>
                            <small>{d}</small>
                          </div>
                        </div>
                        {i < 4 && <ChevronRight size={16} />}
                      </React.Fragment>
                    ))}
                  </div>
                  <div className="migration-summary">
                    <div>
                      <span>Source records</span>
                      <strong>{employees.length}</strong>
                      <small>Sample HRIS export</small>
                    </div>
                    <div>
                      <span>Records without exceptions</span>
                      <strong>
                        {employees.length - new Set(openIssues.map((i) => i.employeeId)).size}
                      </strong>
                      <small>Required fields validated</small>
                    </div>
                    <div>
                      <span>Open exceptions</span>
                      <strong className="amber-text">{openIssues.length}</strong>
                      <small>Inspect before proceeding</small>
                    </div>
                    <div>
                      <span>Data readiness</span>
                      <strong>{quality}%</strong>
                      <div className="progress-track">
                        <i style={{ width: `${quality}%` }} />
                      </div>
                    </div>
                  </div>
                  <Panel
                    title="Exception review"
                    subtitle="Every flag has a rule, a source value, and a proposed next step."
                    action={
                      <Badge tone={openIssues.length ? 'amber' : 'green'} dot>
                        {openIssues.length ? 'Needs review' : 'All clear'}
                      </Badge>
                    }
                  >
                    <div className="table-scroll">
                      <table>
                        <thead>
                          <tr>
                            <th>Employee</th>
                            <th>Validation rule</th>
                            <th>Source value</th>
                            <th>Proposed value</th>
                            <th>Priority</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {issues.map((i) => (
                            <tr key={i.id} onClick={() => setModal({ type: 'issue', data: i })}>
                              <td>
                                <button
                                  className="table-link"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setModal({ type: 'issue', data: i });
                                  }}
                                >
                                  {i.employee}
                                </button>
                                <small>{i.country}</small>
                              </td>
                              <td>
                                <strong>{i.field}</strong>
                                <small className="truncate-cell">{i.rule}</small>
                              </td>
                              <td>
                                <code className="source-value">
                                  {i.currentValue || '— missing —'}
                                </code>
                              </td>
                              <td>
                                <code className="target-value">
                                  {i.proposedValue || 'Manual review'}
                                </code>
                              </td>
                              <td>
                                <Badge tone={toneFor(i.severity)}>{formatStatus(i.severity)}</Badge>
                              </td>
                              <td>
                                <Badge tone={toneFor(i.status)} dot>
                                  {formatStatus(i.status)}
                                </Badge>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="table-footer">
                      <ShieldCheck size={14} />
                      <span>Source data is preserved until you review and approve a proposal.</span>
                      <a href="/api/export" download>
                        Download source CSV
                        <ArrowDownToLine size={13} />
                      </a>
                    </div>
                  </Panel>
                  <div className="migration-note">
                    <BookOpen size={19} />
                    <div>
                      <strong>A rehearsal with real engineering behind it.</strong>
                      <p>
                        Field validation, duplicate detection, proposed transformations, and
                        approval gates execute against synthetic data. The Workday connection is a
                        documented integration design.
                      </p>
                    </div>
                    <a href="/workflows/peopleos-migration.json" download>
                      Get n8n workflow
                      <ArrowDownToLine size={14} />
                    </a>
                  </div>
                </>
              )}
              {section === 'workflows' && (
                <WorkflowStudio
                  workspace={workspace}
                  scenario={scenario}
                  setScenario={setScenario}
                  refresh={refresh}
                  notify={setToast}
                />
              )}
              {section === 'service-desk' && (
                <>
                  <PageHeader
                    eyebrow="PEOPLE EXPERIENCE"
                    title="Support that feels human."
                    description="One front door for the questions, requests, and moments that matter."
                  >
                    <button className="button" onClick={() => runScenario('service-desk')}>
                      <Sparkles size={15} />
                      Triage with agents
                    </button>
                    <button
                      className="button primary"
                      onClick={() => setModal({ type: 'ticket-form' })}
                    >
                      <Plus size={16} />
                      New request
                    </button>
                  </PageHeader>
                  <div className="service-stats">
                    {[
                      [
                        'Open requests',
                        tickets.filter((t) => t.status === 'open').length,
                        MessageSquare,
                      ],
                      [
                        'In progress',
                        tickets.filter((t) => t.status === 'in_progress').length,
                        Clock3,
                      ],
                      [
                        'Resolved',
                        tickets.filter((t) => t.status === 'resolved').length,
                        CheckCheck,
                      ],
                    ].map(([t, n, I]) => (
                      <div key={t}>
                        <I size={21} />
                        <span>{t}</span>
                        <strong>{n}</strong>
                      </div>
                    ))}
                  </div>
                  <div className="section-toolbar">
                    <span className="eyebrow">YOUR SUPPORT INBOX</span>
                    <label className="search-field">
                      <Search size={16} />
                      <input
                        aria-label="Search requests"
                        placeholder="Search requests…"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                      />
                    </label>
                  </div>
                  <Panel title="Conversations" action={<Badge>{tickets.length} requests</Badge>}>
                    <div className="ticket-list">
                      {tickets
                        .filter((t) =>
                          `${t.subject} ${t.category}`.toLowerCase().includes(search.toLowerCase()),
                        )
                        .map((t, i) => (
                          <button
                            className="ticket-row"
                            key={t.id}
                            onClick={() => setModal({ type: 'ticket', data: t })}
                          >
                            <span className={`ticket-icon ${i % 2 ? 'purple-bg' : 'blue-bg'}`}>
                              <Headphones size={19} />
                            </span>
                            <div className="ticket-main">
                              <span className="small-meta mono">{t.id}</span>
                              <strong>{t.subject}</strong>
                              <span>
                                {t.category} <i>·</i> {t.country}
                              </span>
                            </div>
                            <Badge tone={toneFor(t.priority)}>{formatStatus(t.priority)}</Badge>
                            <span className="ticket-assignee">
                              {t.assignee || 'Awaiting triage'}
                            </span>
                            <Badge tone={toneFor(t.status)} dot>
                              {formatStatus(t.status)}
                            </Badge>
                            <ChevronRight size={15} />
                          </button>
                        ))}
                    </div>
                    {tickets.filter((t) =>
                      `${t.subject} ${t.category}`.toLowerCase().includes(search.toLowerCase()),
                    ).length === 0 && (
                      <Empty title="No matching conversations">
                        Try another search, or create a new request.
                      </Empty>
                    )}
                  </Panel>
                  <button className="service-voice-banner" onClick={() => setCopilot('concierge')}>
                    <AudioLines size={30} />
                    <div>
                      <strong>Sometimes, it’s easier to talk.</strong>
                      <p>
                        Your people concierge can explain example policies and help you find your
                        next step.
                      </p>
                    </div>
                    <span>
                      Start a conversation
                      <ArrowUpRight size={18} />
                    </span>
                  </button>
                </>
              )}
              {section === 'insights' && (
                <>
                  <PageHeader
                    eyebrow="FROM DATA TO UNDERSTANDING"
                    title="A clearer picture of your people."
                    description="Transparent measures, grounded in the records in this workspace."
                  >
                    <Scope country={country} setCountry={setCountry} countries={countries} />
                    <a className="button" href="/api/export" download>
                      <ArrowDownToLine size={15} />
                      Export data
                    </a>
                  </PageHeader>
                  <div className="insights-grid">
                    <Panel
                      title="A team of many strengths"
                      subtitle="Employee distribution by department"
                    >
                      <Distribution items={scoped} field="department" />
                    </Panel>
                    <Panel
                      title="Connected across borders"
                      subtitle="Employee distribution by country"
                    >
                      <Distribution items={scoped} field="country" />
                    </Panel>
                    <Panel
                      title="Employment status"
                      subtitle="Current snapshot · synthetic records"
                    >
                      <div className="status-chart">
                        <div
                          className="status-donut"
                          style={{
                            background: `conic-gradient(#217f73 0 ${(scoped.filter((e) => e.status === 'active').length / Math.max(scoped.length, 1)) * 100}%, #a2bded 0 ${(scoped.filter((e) => e.status === 'active' || e.status === 'onboarding').length / Math.max(scoped.length, 1)) * 100}%, #ccd6dd 0 100%)`,
                          }}
                        >
                          <div>
                            <strong>{scoped.length}</strong>
                            <span>people</span>
                          </div>
                        </div>
                        <div>
                          {['active', 'onboarding', 'leave'].map((s, i) => (
                            <div className="status-legend" key={s}>
                              <span style={{ background: ['#217f73', '#a2bded', '#ccd6dd'][i] }} />
                              <span>{formatStatus(s)}</span>
                              <strong>{scoped.filter((e) => e.status === s).length}</strong>
                            </div>
                          ))}
                        </div>
                      </div>
                    </Panel>
                    <Panel
                      title="Data quality, explained"
                      subtitle="No black box. Just a reproducible measure."
                    >
                      <div className="quality-explainer">
                        <span className="quality-number">
                          {quality}
                          <small>%</small>
                        </span>
                        <div>
                          <strong>Records without open exceptions</strong>
                          <p>
                            ({employees.length} records −{' '}
                            {new Set(openIssues.map((i) => i.employeeId)).size} affected records) ÷{' '}
                            {employees.length} × 100
                          </p>
                        </div>
                      </div>
                      <p className="insight-footnote">
                        Calculated across the full workspace. This is a validation coverage
                        indicator, not a legal compliance certification or a measure of employee
                        performance.
                      </p>
                      <TextButton onClick={() => navigate('migration')}>
                        Explore the underlying exceptions
                      </TextButton>
                    </Panel>
                  </div>
                  <div className="insight-method">
                    <BookOpen size={22} />
                    <div>
                      <strong>Good analytics begin with honest data.</strong>
                      <p>
                        This demo reports observed counts. Performance and learning analytics are a
                        future integration, once appropriate data, access controls, and evaluation
                        criteria are available.
                      </p>
                    </div>
                  </div>
                </>
              )}
              {section === 'audit' && (
                <>
                  <PageHeader
                    eyebrow="ACCOUNTABILITY BY DESIGN"
                    title="Every action has a story."
                    description="Follow the decisions, validations, and approvals in your demo session."
                  >
                    <Badge tone="green" dot>
                      Session audit trail
                    </Badge>
                  </PageHeader>
                  <Panel
                    title="Workspace activity"
                    subtitle="Newest events first. Your demo session is isolated from other visitors."
                    action={<Badge>{audit.length} events</Badge>}
                  >
                    <div className="audit-list">
                      {audit.map((a, i) => (
                        <div className="audit-event" key={a.id}>
                          <div className="audit-rail">
                            <span>
                              {/approv/i.test(a.action) ? (
                                <ShieldCheck size={17} />
                              ) : (
                                <Activity size={17} />
                              )}
                            </span>
                            {i < audit.length - 1 && <i />}
                          </div>
                          <div>
                            <div className="audit-title">
                              <strong>{a.action}</strong>
                              <time dateTime={a.createdAt}>
                                {new Date(a.createdAt).toLocaleString('en-GB', {
                                  day: '2-digit',
                                  month: 'short',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                  second: '2-digit',
                                })}
                              </time>
                            </div>
                            <p>{a.detail}</p>
                            <span className="small-meta">
                              <span className="audit-actor">{a.actor}</span>
                              <span className="mono">{a.id}</span>
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Panel>
                </>
              )}
              <footer className="workspace-footer">
                <span>
                  <span className="green-dot" />
                  Independent portfolio project · synthetic data only
                </span>
                <span>
                  Thoughtfully built by <a href="/">Alloyce Amos</a>
                  <span className="footer-separator">/</span>
                  <a href="https://github.com/amosalloyce" target="_blank" rel="noreferrer">
                    GitHub
                    <ArrowUpRight size={12} />
                  </a>
                </span>
              </footer>
            </>
          )}
        </main>
      </div>
      {toast && (
        <div className="toast" role="status">
          <Check size={17} />
          {toast}
          <button aria-label="Dismiss message" onClick={() => setToast('')}>
            <X size={14} />
          </button>
        </div>
      )}
      {showImport && <ImportPreview onClose={() => setShowImport(false)} onValidated={refresh} />}{' '}
      {copilot && <VoiceAssistant initialPersona={copilot} onClose={() => setCopilot(null)} />}
      {modal && (
        <Modal
          title={
            {
              search: 'Find your way',
              notifications: 'Your attention list',
              workspace: 'Your demo workspace',
              guide: 'A quick guide to PeopleOS',
              employee: 'Employee profile',
              issue: 'Validation detail',
              mapping: 'Source → target mapping',
              'ticket-form': 'Create a support request',
              ticket: 'Request details',
            }[modal.type]
          }
          onClose={() => setModal(null)}
          wide={modal.type === 'mapping'}
        >
          {modal.type === 'search' ? (
            <SearchModal
              employees={employees}
              navigate={(id) => {
                navigate(id);
                setModal(null);
              }}
              onEmployee={(data) => setModal({ type: 'employee', data })}
            />
          ) : modal.type === 'workspace' ? (
            <>
              <div className="workspace-modal-brand">
                <Layers3 size={29} />
                <h3>PeopleOS · Demo workspace</h3>
              </div>
              <p>
                Explore with fictional people and example policies. Each visitor gets an isolated
                workspace; changes belong to your session.
              </p>
              <dl className="detail-list">
                <div>
                  <dt>Inference</dt>
                  <dd>
                    {health?.providerConfigured
                      ? 'Groq configured · optional'
                      : 'Deterministic demo'}
                  </dd>
                </div>
                <div>
                  <dt>Integrations</dt>
                  <dd>Synthetic source adapters</dd>
                </div>
                <div>
                  <dt>Actions</dt>
                  <dd>Human approval required</dd>
                </div>
                <div>
                  <dt>Data retention</dt>
                  <dd>
                    {health?.storage === 'sqlite'
                      ? 'SQLite · 2-hour session expiry'
                      : 'Memory · 2-hour session expiry'}
                  </dd>
                </div>
              </dl>
              <button className="button danger" onClick={reset} disabled={busy}>
                {busy ? (
                  <Busy>Resetting…</Busy>
                ) : (
                  <>
                    <RefreshCw size={15} />
                    Reset my demo workspace
                  </>
                )}
              </button>
            </>
          ) : modal.type === 'notifications' ? (
            <>
              <p>
                You have {openIssues.length} open data exceptions and {pendingRuns.length} workflow
                proposals awaiting review.
              </p>
              <button
                className="notification-link"
                onClick={() => {
                  navigate('migration');
                  setModal(null);
                }}
              >
                <Database size={20} />
                <span>
                  <strong>Review data quality exceptions</strong>
                  <small>Investigate source values and proposed fixes</small>
                </span>
                <ArrowRight size={18} />
              </button>
              <button
                className="notification-link"
                onClick={() => {
                  navigate('workflows');
                  setModal(null);
                }}
              >
                <GitBranch size={20} />
                <span>
                  <strong>Visit agent studio</strong>
                  <small>Run or review a workflow</small>
                </span>
                <ArrowRight size={18} />
              </button>
            </>
          ) : modal.type === 'guide' ? (
            <>
              <p>
                PeopleOS is an independent engineering demonstration inspired by the challenges of
                multi-country HR operations.
              </p>
              <ol className="guide-steps">
                <li>
                  <strong>Investigate.</strong> Open Migration hub and inspect a flagged record.
                </li>
                <li>
                  <strong>Run.</strong> Start a validation workflow in Agent studio.
                </li>
                <li>
                  <strong>Understand.</strong> Click each execution step to inspect its output.
                </li>
                <li>
                  <strong>Decide.</strong> Approve or reject the proposed changes.
                </li>
                <li>
                  <strong>Verify.</strong> Revisit the directory, quality metric, and audit trail.
                </li>
              </ol>
              <a className="button primary" href="/workflows/peopleos-migration.json" download>
                <ArrowDownToLine size={16} />
                Download n8n workflow
              </a>
              <p className="muted">
                Workday and payroll are integration designs, not connected production systems. This
                project does not claim employment at or affiliation with Wave.
              </p>
            </>
          ) : modal.type === 'employee' ? (
            <EmployeeDetail employee={modal.data} issues={issues} />
          ) : modal.type === 'issue' ? (
            <>
              <Badge tone={toneFor(modal.data.severity)}>
                {formatStatus(modal.data.severity)} priority
              </Badge>
              <h3>
                {modal.data.employee} · {modal.data.field}
              </h3>
              <p>{modal.data.rule}</p>
              <dl className="detail-list">
                <div>
                  <dt>Source value</dt>
                  <dd>
                    <code>{modal.data.currentValue || 'Missing'}</code>
                  </dd>
                </div>
                <div>
                  <dt>Proposed value</dt>
                  <dd>
                    <code>{modal.data.proposedValue || 'Manual review required'}</code>
                  </dd>
                </div>
                <div>
                  <dt>Status</dt>
                  <dd>{formatStatus(modal.data.status)}</dd>
                </div>
              </dl>
              <p>
                Run the migration workflow to evaluate this exception and review the full proposal
                before applying changes.
              </p>
              <button
                className="button primary"
                onClick={() => {
                  setModal(null);
                  runScenario('migration');
                }}
              >
                Open validation workflow
                <ArrowRight size={15} />
              </button>
            </>
          ) : modal.type === 'mapping' ? (
            <>
              <p>
                Example source-to-target contract. A real tenant would require vendor configuration,
                permissions, and reconciliation against the approved schema.
              </p>
              <table className="mapping-table">
                <thead>
                  <tr>
                    <th>Source field</th>
                    <th>Transformation</th>
                    <th>Target field</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ['employee_id', 'Stable identifier · never regenerate', 'Worker_ID'],
                    ['full_name', 'Trim whitespace', 'Legal_Name'],
                    ['email', 'Trim · lowercase · validate', 'Primary_Work_Email'],
                    ['country', 'Normalize country reference', 'Country_Reference'],
                    ['department', 'Map approved organization', 'Supervisory_Organization'],
                    ['manager_id', 'Check referential integrity', 'Manager_Reference'],
                    ['start_date', 'ISO 8601 date validation', 'Hire_Date'],
                    ['status', 'Map controlled vocabulary', 'Worker_Status'],
                  ].map((r) => (
                    <tr key={r[0]}>
                      {r.map((v, i) => (
                        <td key={i}>{i === 1 ? v : <code>{v}</code>}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          ) : modal.type === 'ticket-form' ? (
            <TicketForm
              countries={countries}
              onCreated={async () => {
                await refresh();
                setModal(null);
                setToast('Request created. Your service team can now triage it.');
              }}
            />
          ) : modal.type === 'ticket' ? (
            <>
              <Badge tone={toneFor(modal.data.status)}>{formatStatus(modal.data.status)}</Badge>
              <h3>{modal.data.subject}</h3>
              <p>
                {modal.data.description ||
                  'A sample request awaiting review by the People support team.'}
              </p>
              <dl className="detail-list">
                {[
                  ['Reference', modal.data.id],
                  ['Category', modal.data.category],
                  ['Country', modal.data.country],
                  ['Priority', modal.data.priority],
                  ['Assigned to', modal.data.assignee || 'Awaiting triage'],
                ].map(([k, v]) => (
                  <div key={k}>
                    <dt>{k}</dt>
                    <dd>{v}</dd>
                  </div>
                ))}
              </dl>
              <button
                className="button primary"
                onClick={() => {
                  setModal(null);
                  runScenario('service-desk');
                }}
              >
                <Sparkles size={15} />
                Open triage workflow
              </button>
            </>
          ) : null}
        </Modal>
      )}
    </div>
  );
}
function Stat({ label, value, note, icon: Icon, spark, warning }) {
  return (
    <div className="stat-card">
      <div className="stat-top">
        <span>{label}</span>
        <Icon size={17} />
      </div>
      <div className="stat-value">
        <strong>{value}</strong>
        <svg
          className={`stat-spark ${warning ? 'amber' : ''}`}
          viewBox="0 0 90 37"
          aria-hidden="true"
        >
          {spark === 'line' ? (
            <path d="M1 32 13 28 23 31 35 23 44 25 54 14 65 18 75 8 87 4" />
          ) : spark === 'bars' ? (
            [15, 22, 17, 29, 23, 34, 28, 37].map((v, i) => (
              <rect key={i} x={i * 11} y={37 - v} width="6" height={v} rx="2" />
            ))
          ) : spark === 'dots' ? (
            Array.from({ length: 24 }, (_, i) => (
              <circle
                key={i}
                cx={6 + (i % 8) * 11}
                cy={7 + Math.floor(i / 8) * 12}
                r="3"
                opacity={0.3 + ((i * 7) % 10) / 14}
              />
            ))
          ) : (
            <>
              <path d="M2 24Q17 3 29 22T56 18T87 9" />
              <path d="M2 34Q17 13 29 32T56 28T87 19" opacity=".3" />
            </>
          )}
        </svg>
      </div>
      <div className="stat-note">
        <span className={warning ? 'amber-dot' : 'green-dot'} />
        {note}
      </div>
    </div>
  );
}
function Distribution({ items, field }) {
  const grouped = Object.entries(
    items.reduce((a, e) => ({ ...a, [e[field]]: (a[e[field]] || 0) + 1 }), {}),
  ).sort((a, b) => b[1] - a[1]);
  return (
    <div className="distribution">
      {grouped.map(([name, n], i) => (
        <div key={name}>
          <div>
            <span>{field === 'country' ? <Country name={name} /> : name}</span>
            <strong>
              {n}
              <small>{Math.round((n / Math.max(items.length, 1)) * 100)}%</small>
            </strong>
          </div>
          <div className="distribution-track">
            <i
              style={{
                width: `${(n / Math.max(...grouped.map((g) => g[1]), 1)) * 100}%`,
                background: ['#278a7b', '#518fba', '#7e96cb', '#9a91b9', '#bb9b76'][i % 5],
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
function EmployeeDetail({ employee: e, issues }) {
  return (
    <>
      <div className="employee-detail-top">
        <Avatar {...e} size="large" />
        <h3>{e.name}</h3>
        <p>{e.role}</p>
        <Badge tone={toneFor(e.status)} dot>
          {formatStatus(e.status)}
        </Badge>
      </div>
      <dl className="detail-list">
        {[
          ['Employee ID', e.id],
          ['Department', e.department],
          ['Location', `${e.location} · ${e.country}`],
          ['Work email', e.email],
          ['Manager', e.manager],
          ['Start date', e.startDate],
        ].map(([k, v]) => (
          <div key={k}>
            <dt>{k}</dt>
            <dd>{v || 'Not yet provided'}</dd>
          </div>
        ))}
      </dl>
      <div className="inline-note">
        <ShieldCheck size={17} />
        {issues.filter((i) => i.employeeId === e.id && i.status !== 'resolved').length} open data
        exceptions for this record.
      </div>
      <p className="small-meta">
        Fictional employee · this profile contains no real personal data.
      </p>
    </>
  );
}
function SearchModal({ employees, navigate, onEmployee }) {
  const [q, setQ] = useState('');
  return (
    <>
      <label className="search-field command-input">
        <Search size={18} />
        <input
          autoFocus
          aria-label="Search workspace"
          placeholder="Search pages or people…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <kbd>ESC</kbd>
      </label>
      <div className="command-results">
        {navigation
          .filter(([, label]) => label.toLowerCase().includes(q.toLowerCase()))
          .map(([id, label, Icon]) => (
            <button key={id} onClick={() => navigate(id)}>
              <Icon size={17} />
              <span>{label}</span>
              <ArrowUpRight size={15} />
            </button>
          ))}
        {q &&
          employees
            .filter((e) => e.name.toLowerCase().includes(q.toLowerCase()))
            .slice(0, 6)
            .map((e) => (
              <button key={e.id} onClick={() => onEmployee(e)}>
                <Avatar {...e} size="small" />
                <span>{e.name}</span>
                <small>{e.department}</small>
              </button>
            ))}
        {q &&
          !navigation.some(([, l]) => l.toLowerCase().includes(q.toLowerCase())) &&
          !employees.some((e) => e.name.toLowerCase().includes(q.toLowerCase())) && (
            <Empty title="Nothing found">Try a person’s name or a workspace page.</Empty>
          )}
      </div>
    </>
  );
}
function TicketForm({ countries, onCreated }) {
  const [error, setError] = useState(''),
    [busy, setBusy] = useState(false);
  return (
    <form
      className="ticket-form"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setError('');
        const form = new FormData(e.currentTarget);
        try {
          await api('/tickets', Object.fromEntries(form));
          await onCreated();
        } catch (err) {
          setError(err.message);
        } finally {
          setBusy(false);
        }
      }}
    >
      <p>Describe a fictional support request to explore the triage workflow.</p>
      <label>
        Subject
        <input
          name="subject"
          required
          minLength={5}
          maxLength={160}
          placeholder="How can the People team help?"
        />
      </label>
      <div className="form-columns">
        <label>
          Category
          <select name="category" aria-label="Category">
            <option>Data correction</option>
            <option>Access</option>
            <option>Payroll</option>
            <option>Leave</option>
            <option>Onboarding</option>
            <option>Other</option>
          </select>
        </label>
        <label>
          Country
          <select name="country" aria-label="Country">
            {countries.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>
      </div>
      <label>
        Description
        <textarea
          name="description"
          required
          minLength={10}
          maxLength={2000}
          rows="4"
          placeholder="Include the context your support team needs…"
        />
      </label>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <button disabled={busy} className="button primary">
        {busy ? (
          <Busy>Creating request…</Busy>
        ) : (
          <>
            Create request
            <ArrowRight size={15} />
          </>
        )}
      </button>
    </form>
  );
}
