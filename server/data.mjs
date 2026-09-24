import { randomUUID } from 'node:crypto';

export const COUNTRIES = [
  ['Senegal', 'SN', 'Dakar'],
  ['Côte d’Ivoire', 'CI', 'Abidjan'],
  ['Mali', 'ML', 'Bamako'],
  ['Burkina Faso', 'BF', 'Ouagadougou'],
  ['The Gambia', 'GM', 'Banjul'],
  ['Uganda', 'UG', 'Kampala'],
  ['Niger', 'NE', 'Niamey'],
  ['Sierra Leone', 'SL', 'Freetown'],
  ['Cameroon', 'CM', 'Douala'],
  ['Kenya', 'KE', 'Nairobi'],
  ['Ghana', 'GH', 'Accra'],
  ['United Kingdom', 'GB', 'London'],
  ['Spain', 'ES', 'Madrid'],
];

const PEOPLE = [
  ['Amina Ndiaye', 'People Operations Lead', 'People'],
  ['Moussa Diop', 'Platform Engineer', 'Engineering'],
  ['Fatou Sarr', 'Learning Partner', 'Learning'],
  ['Ibrahima Fall', 'Operations Specialist', 'Operations'],
  ['Mariama Koné', 'People Systems Analyst', 'People'],
  ['Yao Kouassi', 'Data Engineer', 'Data'],
  ['Aïcha Traoré', 'Payroll Specialist', 'Finance'],
  ['Koffi N’Guessan', 'Talent Partner', 'Talent'],
  ['Aminata Coulibaly', 'Operations Lead', 'Operations'],
  ['Oumar Keïta', 'Support Engineer', 'Engineering'],
  ['Sira Diarra', 'People Partner', 'People'],
  ['Boubacar Touré', 'Finance Analyst', 'Finance'],
  ['Awa Ouédraogo', 'Market Operations Lead', 'Operations'],
  ['Issa Sawadogo', 'Analytics Engineer', 'Data'],
  ['Mariam Kaboré', 'Talent Coordinator', 'Talent'],
  ['Adama Barry', 'Learning Coordinator', 'Learning'],
  ['Fatou Jallow', 'People Partner', 'People'],
  ['Lamin Ceesay', 'Operations Specialist', 'Operations'],
  ['Isatou Sowe', 'Finance Analyst', 'Finance'],
  ['Ousman Bah', 'Support Specialist', 'Operations'],
  ['Grace Nakato', 'Engineering Lead', 'Engineering'],
  ['Daniel Okello', 'Data Analyst', 'Data'],
  ['Sarah Achieng', 'People Operations Specialist', 'People'],
  ['Peter Mugisha', 'Payroll Analyst', 'Finance'],
  ['Hadiza Issoufou', 'People Partner', 'People'],
  ['Moussa Abdou', 'Operations Specialist', 'Operations'],
  ['Aïssatou Amadou', 'Talent Partner', 'Talent'],
  ['Ibrahim Sani', 'Platform Engineer', 'Engineering'],
  ['Aminata Kamara', 'Operations Lead', 'Operations'],
  ['Mohamed Bangura', 'Finance Analyst', 'Finance'],
  ['Hawa Sesay', 'Learning Partner', 'Learning'],
  ['Ibrahim Conteh', 'Data Analyst', 'Data'],
  ['Mireille Njoya', 'People Partner', 'People'],
  ['Alain Mbarga', 'Backend Engineer', 'Engineering'],
  ['Estelle Manga', 'Talent Partner', 'Talent'],
  ['Samuel Etame', 'Operations Specialist', 'Operations'],
  ['Wanjiku Mwangi', 'People Technology Lead', 'People'],
  ['Brian Otieno', 'Software Engineer', 'Engineering'],
  ['Njeri Kamau', 'Data Engineer', 'Data'],
  ['Kwame Mensah', 'Finance Lead', 'Finance'],
  ['Abena Owusu', 'Talent Operations Lead', 'Talent'],
  ['Kofi Asante', 'Integrations Engineer', 'Engineering'],
  ['Oliver Reed', 'Security Engineer', 'Engineering'],
  ['Amelia Brooks', 'People Analytics Lead', 'Data'],
  ['Lucía Martín', 'Learning Experience Lead', 'Learning'],
  ['Daniel García', 'Product Engineer', 'Engineering'],
  ['Sofia Álvarez', 'People Systems Specialist', 'People'],
  ['Zara Abdi', 'Data Platform Engineer', 'Data'],
];
const countryFor = (i) =>
  i < 36 ? Math.floor(i / 4) : i < 39 ? 9 : i < 42 ? 10 : i < 44 ? 11 : i < 47 ? 12 : 9;
const slug = (s) =>
  s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z ]/g, '')
    .trim()
    .replace(/ +/g, '.');

const AGENT_DEFINITIONS = [
  [
    'people-lead',
    'People orchestrator',
    'People',
    'orchestrator',
    'Coordinates onboarding and service requests with a human review gate.',
  ],
  [
    'data-lead',
    'Data orchestrator',
    'Data',
    'orchestrator',
    'Coordinates extract, mapping, validation and migration reconciliation.',
  ],
  [
    'payroll-lead',
    'Payroll orchestrator',
    'Finance',
    'orchestrator',
    'Routes payroll readiness checks; never executes payments.',
  ],
  [
    'service-lead',
    'Service orchestrator',
    'People',
    'orchestrator',
    'Coordinates request classification, routing and draft responses.',
  ],
  [
    'extract',
    'Source connector',
    'Data',
    'specialist',
    'Reads the current session’s synthetic employee records.',
  ],
  [
    'mapping',
    'Schema mapper',
    'Data',
    'specialist',
    'Maps approved country, department and field formats.',
  ],
  [
    'quality',
    'Quality sentinel',
    'Data',
    'specialist',
    'Evaluates record values against explicit sample validation rules.',
  ],
  [
    'reconcile',
    'Reconciliation analyst',
    'Data',
    'specialist',
    'Compares source and proposed record counts and identifiers.',
  ],
  [
    'privacy',
    'Privacy reviewer',
    'People',
    'specialist',
    'Checks synthetic-only scope and prevents sensitive exports to AI.',
  ],
  [
    'identity',
    'Identity checker',
    'People',
    'specialist',
    'Checks onboarding identity fields and manager references.',
  ],
  [
    'access',
    'Access planner',
    'Engineering',
    'specialist',
    'Prepares least-privilege sample access recommendations.',
  ],
  [
    'learning',
    'Learning planner',
    'Learning',
    'specialist',
    'Drafts a sample learning checklist for a new starter.',
  ],
  [
    'onboarding',
    'Onboarding coordinator',
    'People',
    'specialist',
    'Prepares starter tasks and records approved demo activation.',
  ],
  [
    'classify',
    'Request classifier',
    'People',
    'specialist',
    'Classifies requests by an explicit category-to-team rule.',
  ],
  [
    'policy',
    'Policy librarian',
    'People',
    'specialist',
    'Retrieves labeled fictional handbook excerpts.',
  ],
  [
    'routing',
    'Routing specialist',
    'People',
    'specialist',
    'Assigns synthetic support requests to the appropriate team.',
  ],
  ['response', 'Response drafter', 'People', 'specialist', 'Prepares a grounded reply for review.'],
  [
    'country',
    'Country mapper',
    'Finance',
    'specialist',
    'Validates country codes against the demo’s country catalogue.',
  ],
  [
    'payroll',
    'Payroll readiness analyst',
    'Finance',
    'specialist',
    'Checks start dates, country codes and manager references.',
  ],
  [
    'exceptions',
    'Exception triage',
    'Finance',
    'specialist',
    'Groups unresolved readiness issues by owner and severity.',
  ],
  [
    'reporting',
    'Reporting analyst',
    'Data',
    'specialist',
    'Calculates aggregates from the actual 48-record sample.',
  ],
  [
    'audit',
    'Audit recorder',
    'People',
    'specialist',
    'Records explicit decisions and resulting synthetic state changes.',
  ],
];
const AGENT_EXECUTION = {
  'people-lead': ['onboarding'],
  'data-lead': ['migration'],
  'payroll-lead': ['payroll'],
  'service-lead': ['service-desk'],
  extract: ['migration'],
  mapping: ['migration', 'csv-preview'],
  quality: ['migration', 'csv-preview'],
  reconcile: ['migration'],
  privacy: ['migration'],
  identity: ['onboarding'],
  access: ['onboarding'],
  learning: ['onboarding'],
  onboarding: ['onboarding'],
  classify: ['service-desk'],
  policy: ['service-desk', 'chat'],
  routing: ['service-desk'],
  response: ['service-desk'],
  country: ['payroll'],
  payroll: ['payroll'],
  exceptions: ['payroll'],
  reporting: ['payroll', 'chat'],
  audit: [
    'migration',
    'onboarding',
    'service-desk',
    'payroll',
    'csv-preview',
    'ticket-create',
    'csv-export',
  ],
};
export const AGENTS = AGENT_DEFINITIONS.map(([id, name, department, kind, description]) => ({
  id,
  name,
  department,
  kind,
  role: kind === 'orchestrator' ? 'Department coordinator' : 'Bounded tool specialist',
  description,
  execution: {
    type: id === 'audit' ? 'state-event-writer' : 'deterministic-tool',
    scenarios: AGENT_EXECUTION[id],
  },
}));

export const SAMPLE_POLICIES = [
  {
    id: 'leave',
    title: 'Sample handbook · leave',
    detail:
      'Fictional demo policy: submit planned leave through the People service desk with dates and country. A manager reviews the request. Entitlements are not configured in this demo.',
  },
  {
    id: 'onboarding',
    title: 'Sample handbook · onboarding',
    detail:
      'Fictional demo checklist: confirm employee ID, company email, country, start date and manager; review access; complete security and data-handling orientation. People Operations approves activation.',
  },
  {
    id: 'payroll',
    title: 'Sample handbook · payroll readiness',
    detail:
      'Fictional demo control: reconcile employee counts, country codes, start dates and manager references before a payroll specialist reviews exceptions. This demo calculates no pay and sends no payments.',
  },
  {
    id: 'privacy',
    title: 'Sample handbook · data handling',
    detail:
      'Fictional demo control: use synthetic records only, export the minimum fields required, and require a human decision before changing records. Production retention and access rules require a separate design review.',
  },
];

export function seedState() {
  const now = new Date().toISOString();
  const employees = PEOPLE.map(([name, role, department], i) => {
    const [country, countryCode, location] = COUNTRIES[countryFor(i)];
    return {
      id: `EMP-${String(i + 1).padStart(3, '0')}`,
      name,
      initials: name
        .split(' ')
        .map((p) => p[0])
        .slice(0, 2)
        .join(''),
      role,
      department,
      country,
      countryCode,
      location,
      email: `${slug(name)}@peopleos.example`,
      status: i >= 46 ? 'onboarding' : i === 14 || i === 30 ? 'leave' : 'active',
      manager: i === 36 ? 'Amina Ndiaye' : 'Wanjiku Mwangi',
      startDate: `202${2 + (i % 5)}-${String(1 + (i % 9)).padStart(2, '0')}-${String(1 + (i % 24)).padStart(2, '0')}`,
    };
  });
  const issues = [];
  const introduce = (index, field, incorrect, rule, severity = 'medium') => {
    const employee = employees[index];
    const proposedValue = employee[field];
    employee[field] = incorrect;
    issues.push({
      id: `DQ-${String(issues.length + 1).padStart(3, '0')}`,
      employeeId: employee.id,
      employee: employee.name,
      field,
      currentValue: incorrect,
      proposedValue,
      severity,
      status: 'open',
      country: employee.country,
      rule,
    });
  };
  [1, 5, 17, 29].forEach((i) =>
    introduce(
      i,
      'email',
      employees[i].email.replace('@', ' '),
      'Valid company email format',
      'high',
    ),
  );
  [4, 10, 22, 34].forEach((i) =>
    introduce(i, 'manager', '', 'Manager must reference an existing employee', 'high'),
  );
  [8, 24, 40].forEach((i) =>
    introduce(i, 'countryCode', 'UNK', 'Country code must match the country catalogue', 'high'),
  );
  [12, 20, 32].forEach((i) => introduce(i, 'startDate', '', 'Start date must use YYYY-MM-DD'));
  [15, 38].forEach((i) =>
    introduce(
      i,
      'department',
      i === 15 ? 'L&D' : 'Data & Analytics',
      'Department must match the target taxonomy',
      'low',
    ),
  );
  const tickets = [
    ['Confirm September starter checklist', 'Onboarding', 'Kenya', 'high'],
    ['Update a manager reference', 'Data correction', 'Senegal', 'medium'],
    ['Help with learning portal access', 'Access', 'Uganda', 'medium'],
    ['Review payroll country mapping', 'Payroll', 'Ghana', 'high'],
    ['Where do I request planned leave?', 'Leave', 'Côte d’Ivoire', 'low'],
    ['Correct employee profile email', 'Data correction', 'Sierra Leone', 'medium'],
    ['Confirm orientation session details', 'Onboarding', 'Spain', 'low'],
    ['Restore access to the reporting workspace', 'Access', 'United Kingdom', 'high'],
  ].map(([subject, category, country, priority], i) => ({
    id: `HR-${1041 + i}`,
    subject,
    category,
    country,
    status: i === 6 ? 'resolved' : i === 1 || i === 3 ? 'in_progress' : 'open',
    priority,
    assignee:
      i === 1
        ? 'People Operations'
        : i === 3
          ? 'Payroll team'
          : i === 6
            ? 'People Operations'
            : 'Unassigned',
    createdAt: new Date(Date.now() - (i + 1) * 3600000).toISOString(),
  }));
  return {
    employees,
    issues,
    tickets,
    runs: [],
    audit: [
      {
        id: randomUUID(),
        action: 'Workspace initialized',
        actor: 'Demo system',
        detail:
          'Loaded 48 fictional employee records across 13 countries. No production data or services are connected.',
        createdAt: now,
      },
    ],
    createdAt: now,
    ticketCounter: 1049,
    revision: 0,
  };
}

export function addAudit(state, action, actor, detail) {
  state.audit.unshift({
    id: randomUUID(),
    action,
    actor,
    detail,
    createdAt: new Date().toISOString(),
  });
  state.audit = state.audit.slice(0, 150);
}

export function statsFor(state) {
  const openIssues = state.issues.filter((i) => i.status === 'open').length;
  const affected = new Set(state.issues.filter((i) => i.status === 'open').map((i) => i.employeeId))
    .size;
  const total = state.employees.length;
  return {
    employees: total,
    totalEmployees: total,
    headcount: total,
    activeEmployees: state.employees.filter((e) => e.status === 'active').length,
    onboarding: state.employees.filter((e) => e.status === 'onboarding').length,
    countries: new Set(state.employees.map((e) => e.country)).size,
    departments: new Set(state.employees.map((e) => e.department)).size,
    openIssues,
    dataQuality: Number((((total - affected) / total) * 100).toFixed(1)),
    openTickets: state.tickets.filter((t) => t.status !== 'resolved').length,
    awaitingApproval: state.runs.filter((r) => r.status === 'awaiting_approval').length,
    completedRuns: state.runs.filter((r) => r.status === 'completed').length,
    agents: AGENTS.length,
    orchestrators: 4,
    specialists: 18,
  };
}

export function workspaceFor(state) {
  return {
    employees: state.employees,
    tickets: state.tickets,
    issues: state.issues,
    runs: state.runs,
    audit: state.audit,
    agents: AGENTS,
    stats: statsFor(state),
    mode: 'demo',
    dataNotice:
      'All names and employee records are fictional. Independent portfolio project; not affiliated with Wave.',
    revision: state.revision,
  };
}
