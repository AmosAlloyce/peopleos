import { randomUUID } from 'node:crypto';
import { performance } from 'node:perf_hooks';
import { COUNTRIES, SAMPLE_POLICIES, addAudit } from './data.mjs';
import { validIsoDate, VALID_DEPARTMENTS } from './import.mjs';

const COUNTRY_CODES = new Map(COUNTRIES.map(([name, code]) => [name, code]));
const ROUTING = {
  Onboarding: 'People Operations',
  'Data correction': 'HR Systems',
  Access: 'IT service desk',
  Payroll: 'Payroll team',
  Leave: 'People Operations',
  Other: 'People Operations',
};
export const SCENARIOS = ['migration', 'onboarding', 'service-desk', 'payroll'];

export function validateEmployees(employees) {
  const names = new Set(employees.map((e) => e.name));
  const errors = [];
  for (const employee of employees) {
    const check = (field, valid, rule) => {
      if (!valid) errors.push({ employeeId: employee.id, field, rule, country: employee.country });
    };
    check(
      'email',
      /^[^\s@]+@peopleos\.example$/.test(employee.email),
      'Valid company email format',
    );
    check(
      'manager',
      names.has(employee.manager) && employee.manager !== employee.name,
      'Manager must reference an existing employee',
    );
    check(
      'countryCode',
      COUNTRY_CODES.get(employee.country) === employee.countryCode,
      'Country code must match the country catalogue',
    );
    check('startDate', validIsoDate(employee.startDate), 'Start date must use YYYY-MM-DD');
    check(
      'department',
      VALID_DEPARTMENTS.has(employee.department),
      'Department must match the target taxonomy',
    );
  }
  return errors;
}

export function executeWorkflow(state, scenario) {
  if (!SCENARIOS.includes(scenario)) throw new Error('Unknown workflow scenario');
  const steps = [];
  const step = (agent, label, compute) => {
    const start = performance.now();
    const result = compute();
    steps.push({
      id: `${agent}-${steps.length + 1}`,
      agent,
      label,
      status: result.warning ? 'warning' : 'complete',
      detail: result.detail,
      durationMs: Math.max(1, Math.round(performance.now() - start)),
      output: result.output ?? null,
    });
    return result.output;
  };
  let proposal;
  let summary;
  if (scenario === 'migration') {
    step('data-lead', 'Plan the migration review', () => ({
      detail: `Scoped ${state.employees.length} records and ${state.issues.filter((i) => i.status === 'open').length} known exceptions for extraction, mapping and reconciliation.`,
      output: {
        specialists: ['extract', 'mapping', 'quality', 'reconcile', 'privacy'],
        humanGate: true,
      },
    }));
    const extracted = step('extract', 'Extract source snapshot', () => ({
      detail: `Read ${state.employees.length} fictional records from this visitor’s workspace.`,
      output: structuredClone(state.employees),
    }));
    step('mapping', 'Validate target schema', () => ({
      detail: `Mapped 13 countries and 7 target departments. Employee IDs are preserved.`,
      output: { countryCount: COUNTRY_CODES.size, targetDepartments: [...VALID_DEPARTMENTS] },
    }));
    const errors = step('quality', 'Run five record-level checks', () => {
      const issues = validateEmployees(extracted);
      return {
        detail: `${extracted.length * 5} checks executed; ${issues.length} field exceptions require review.`,
        warning: issues.length > 0,
        output: issues,
      };
    });
    const fixes = state.issues
      .filter(
        (issue) =>
          issue.status === 'open' &&
          errors.some((e) => e.employeeId === issue.employeeId && e.field === issue.field),
      )
      .map((issue) => ({
        issueId: issue.id,
        employeeId: issue.employeeId,
        field: issue.field,
        before: issue.currentValue,
        after: issue.proposedValue,
      }));
    const proposed = structuredClone(extracted);
    for (const fix of fixes) proposed.find((e) => e.id === fix.employeeId)[fix.field] = fix.after;
    step('reconcile', 'Reconcile proposed target', () => {
      const remaining = validateEmployees(proposed);
      return {
        detail: `${proposed.length}/${extracted.length} records reconciled, ${new Set(proposed.map((e) => e.id)).size} unique IDs, ${remaining.length} remaining field exceptions after proposed fixes.`,
        warning: remaining.length > 0,
        output: {
          sourceCount: extracted.length,
          targetCount: proposed.length,
          uniqueIds: new Set(proposed.map((e) => e.id)).size,
          remainingExceptions: remaining.length,
        },
      };
    });
    step('privacy', 'Check data and approval boundary', () => ({
      detail:
        'Synthetic sample only. No employee-level records sent to an AI provider. Changes remain staged until a human decision.',
      output: { data: 'synthetic', externalRecordsSent: 0, approvalRequired: true },
    }));
    proposal = {
      type: 'data_fixes',
      title: `Apply ${fixes.length} reviewed data corrections`,
      description:
        'Normalize the synthetic records using the sample source-of-truth values. No real HRIS is connected.',
      fixes,
      affectedRecords: new Set(fixes.map((f) => f.employeeId)).size,
      count: fixes.length,
    };
    summary = `${extracted.length} records checked. ${fixes.length} proposed corrections are ready for human review; no employee records have been changed.`;
  } else if (scenario === 'onboarding') {
    const employee = state.employees.find((e) => e.status === 'onboarding');
    step('people-lead', 'Select the next sample starter', () => ({
      detail: employee
        ? `${employee.name} · ${employee.department} · ${employee.country}.`
        : 'No onboarding records remain in this demo workspace.',
      warning: !employee,
      output: employee
        ? { employeeId: employee.id, department: employee.department, country: employee.country }
        : null,
    }));
    const identityErrors = step('identity', 'Verify required identity fields', () => {
      const errors = employee
        ? validateEmployees(state.employees).filter((e) => e.employeeId === employee.id)
        : [];
      return {
        detail: employee
          ? `${5 - errors.length}/5 identity and reference checks passed.`
          : 'Identity check skipped: no starter is available.',
        warning: !employee || errors.length > 0,
        output: errors,
      };
    });
    const access = step('access', 'Prepare access checklist', () => {
      const permissions = [
        'Employee self-service',
        'Security orientation',
        employee?.department === 'Data'
          ? 'Analytics sandbox · read only'
          : 'People sandbox · read only',
      ];
      return {
        detail: `Prepared ${permissions.length} sample access requests. No accounts or permissions are provisioned.`,
        output: permissions,
      };
    });
    const learning = step('learning', 'Assemble learning plan', () => ({
      detail:
        'Security basics, handling employee data, and the local team introduction added to the sample checklist.',
      output: ['Security basics', 'Employee data handling', 'Local team introduction'],
    }));
    step('onboarding', 'Stage People Operations handoff', () => ({
      detail: employee
        ? `A starter checklist ticket will be created after approval. ${identityErrors.length ? 'Resolve identity exceptions before running again.' : 'The fictional profile can be activated.'}`
        : 'No changes are proposed.',
      warning: !employee || identityErrors.length > 0,
      output: { activationReady: Boolean(employee && !identityErrors.length) },
    }));
    proposal = {
      type: 'onboarding',
      title: employee ? `Approve ${employee.name}’s sample starter handoff` : 'No starters pending',
      description:
        'Activate the fictional profile and create an internal demo checklist. Production account provisioning is not connected.',
      employeeId: employee?.id ?? null,
      beforeStatus: employee?.status ?? null,
      blocked: !employee || identityErrors.length > 0,
      tasks: [...access, ...learning],
      count: employee ? 1 : 0,
    };
    summary = employee
      ? `Prepared an onboarding checklist for ${employee.name}. ${identityErrors.length ? 'Identity exceptions block activation.' : 'A human approval will activate the sample profile and create the handoff ticket.'}`
      : 'All sample starters have already been reviewed; no activation is proposed.';
  } else if (scenario === 'service-desk') {
    const tickets = state.tickets.filter((t) => t.status === 'open' && t.assignee === 'Unassigned');
    step('service-lead', 'Scope the service queue', () => ({
      detail: `${tickets.length} unassigned requests selected from ${state.tickets.length} total tickets. Resolved and assigned tickets are excluded.`,
      output: {
        eligible: tickets.length,
        excluded: state.tickets.length - tickets.length,
        specialists: ['classify', 'policy', 'routing', 'response'],
      },
    }));
    const routes = step('classify', 'Classify the unassigned queue', () => ({
      detail: `${tickets.length} open, unassigned requests classified using explicit request categories.`,
      output: tickets.map((t) => ({
        ticketId: t.id,
        subject: t.subject,
        category: t.category,
        assignee: ROUTING[t.category] || ROUTING.Other,
        previousAssignee: t.assignee,
        previousStatus: t.status,
      })),
    }));
    step('policy', 'Retrieve sample handbook guidance', () => ({
      detail:
        'Retrieved labeled fictional leave, onboarding and payroll-readiness guidance. No statutory entitlement is inferred.',
      output: SAMPLE_POLICIES.map((p) => ({ title: p.title, detail: p.detail })),
    }));
    step('routing', 'Validate team destinations', () => ({
      detail: `${routes.length} destinations validated against ${new Set(Object.values(ROUTING)).size} demo teams. No external messages will be sent.`,
      output: { teams: [...new Set(routes.map((r) => r.assignee))], routes: routes.length },
    }));
    step('response', 'Prepare service desk drafts', () => ({
      detail: `Prepared ${routes.length} acknowledgements for People Operations to review.`,
      output: routes.map((r) => ({
        ticketId: r.ticketId,
        draft: `Your ${r.category.toLowerCase()} request is ready for ${r.assignee} to review. This is a fictional demo acknowledgement.`,
      })),
    }));
    proposal = {
      type: 'ticket_routes',
      title: `Route ${routes.length} sample support requests`,
      description:
        'Assign requests to the relevant demo teams and mark them in progress. Draft replies remain inside this workspace.',
      routes,
      count: routes.length,
    };
    summary = `${routes.length} unassigned requests have reviewable routing proposals. Approval updates this demo queue; no emails or chat messages are sent.`;
  } else {
    const records = step('payroll-lead', 'Read the payroll-readiness snapshot', () => ({
      detail: `${state.employees.length} synthetic profiles in scope; salaries and bank details are intentionally absent.`,
      output: state.employees.length,
    }));
    step('country', 'Validate country-code mappings', () => {
      const invalid = state.employees.filter((e) => COUNTRY_CODES.get(e.country) !== e.countryCode);
      return {
        detail: `${records - invalid.length}/${records} country codes match the 13-country catalogue.`,
        warning: invalid.length > 0,
        output: { checked: records, mismatches: invalid.map((e) => e.id) },
      };
    });
    const exceptions = step('payroll', 'Check readiness controls', () => {
      const errors = validateEmployees(state.employees).filter((e) =>
        ['manager', 'countryCode', 'startDate'].includes(e.field),
      );
      return {
        detail: `${records * 3} readiness checks executed; ${errors.length} exceptions need specialist review. No payroll calculations performed.`,
        warning: errors.length > 0,
        output: errors,
      };
    });
    step('exceptions', 'Group exceptions for review', () => {
      const byCountry = {};
      for (const exception of exceptions)
        byCountry[exception.country] = (byCountry[exception.country] || 0) + 1;
      return {
        detail: `${exceptions.length} exceptions grouped across ${Object.keys(byCountry).length} countries.`,
        output: byCountry,
      };
    });
    step('reporting', 'Prepare reconciliation report', () => ({
      detail: `${records} source records retained; ${new Set(state.employees.map((e) => e.id)).size} unique employee IDs. Report is ready for a human payroll reviewer.`,
      output: {
        sourceCount: records,
        uniqueIds: new Set(state.employees.map((e) => e.id)).size,
        exceptionCount: exceptions.length,
        paymentExecution: false,
      },
    }));
    proposal = {
      type: 'payroll_report',
      title: 'Publish the sample readiness report',
      description:
        'Create a review ticket with the readiness results. This does not approve payroll or move money.',
      count: exceptions.length,
      exceptions,
      report: {
        records,
        exceptions: exceptions.length,
        countries: new Set(state.employees.map((e) => e.country)).size,
        generatedAt: new Date().toISOString(),
      },
    };
    summary = `${records} profiles reconciled. ${exceptions.length} payroll-readiness exceptions were found. Approval publishes a sample review ticket, not a payment.`;
  }
  // Keep outputs explainable without duplicating the full roster inside every run.
  for (const current of steps)
    if (current.agent === 'extract')
      current.output = {
        recordCount: state.employees.length,
        fields: Object.keys(state.employees[0]),
        source: 'session synthetic dataset',
      };
  const run = {
    id: `RUN-${randomUUID().slice(0, 8).toUpperCase()}`,
    scenario,
    status: 'awaiting_approval',
    steps,
    summary,
    createdAt: new Date().toISOString(),
    proposal,
    mode: 'demo',
    baseRevision: state.revision,
  };
  state.runs.unshift(run);
  addAudit(
    state,
    'Workflow staged',
    'Workflow engine',
    `${scenario}: ${steps.length} tools executed. ${proposal.title}. Awaiting human approval.`,
  );
  return run;
}

export class WorkflowError extends Error {
  constructor(message, status = 409) {
    super(message);
    this.status = status;
  }
}

export function decideRun(state, run, decision) {
  if (run.status !== 'awaiting_approval')
    throw new WorkflowError(
      'This workflow already has a decision. Start a new run to propose further changes.',
    );
  if (decision === 'reject') {
    run.status = 'rejected';
    run.decidedAt = new Date().toISOString();
    addAudit(
      state,
      'Workflow rejected',
      'Demo reviewer',
      `${run.id}: ${run.proposal.title}. No proposed changes applied.`,
    );
    return run;
  }
  const proposal = run.proposal;
  if (proposal.blocked)
    throw new WorkflowError(
      'This proposal is blocked. Resolve the source exceptions or choose a different workflow.',
    );
  // Preflight the entire proposal before mutating anything. Stale concurrent proposals fail closed.
  if (proposal.type === 'data_fixes')
    for (const fix of proposal.fixes) {
      const employee = state.employees.find((e) => e.id === fix.employeeId);
      const issue = state.issues.find((i) => i.id === fix.issueId);
      if (!employee || !issue || issue.status !== 'open' || employee[fix.field] !== fix.before)
        throw new WorkflowError(
          'The source data changed after this run. Start the workflow again to review a fresh proposal.',
        );
    }
  if (proposal.type === 'onboarding') {
    const employee = state.employees.find((e) => e.id === proposal.employeeId);
    if (!employee || employee.status !== proposal.beforeStatus)
      throw new WorkflowError('This starter has already changed. Run onboarding again.');
  }
  if (proposal.type === 'ticket_routes')
    for (const route of proposal.routes) {
      const ticket = state.tickets.find((t) => t.id === route.ticketId);
      if (
        !ticket ||
        ticket.status !== route.previousStatus ||
        ticket.assignee !== route.previousAssignee
      )
        throw new WorkflowError(
          'The queue changed after this proposal. Run service-desk routing again.',
        );
    }
  if (proposal.type === 'payroll_report' && run.baseRevision !== state.revision)
    throw new WorkflowError(
      'Employee or workflow data changed. Run payroll readiness again for a current report.',
    );
  if (['onboarding', 'payroll_report'].includes(proposal.type) && state.tickets.length >= 50)
    throw new WorkflowError(
      'This demo workspace has reached its ticket limit. Reset the demo to continue.',
      429,
    );
  let detail;
  if (proposal.type === 'data_fixes') {
    for (const fix of proposal.fixes) {
      state.employees.find((e) => e.id === fix.employeeId)[fix.field] = fix.after;
      state.issues.find((i) => i.id === fix.issueId).status = 'resolved';
    }
    detail = `Applied ${proposal.fixes.length} approved corrections to ${proposal.affectedRecords} fictional records.`;
  } else if (proposal.type === 'onboarding') {
    const employee = state.employees.find((e) => e.id === proposal.employeeId);
    employee.status = 'active';
    state.tickets.unshift({
      id: `HR-${state.ticketCounter++}`,
      subject: `Starter checklist · ${employee.name}`,
      category: 'Onboarding',
      country: employee.country,
      status: 'in_progress',
      priority: 'medium',
      assignee: 'People Operations',
      createdAt: new Date().toISOString(),
      description: proposal.tasks.join('\n'),
    });
    detail = `Activated fictional profile ${employee.id} and created a checklist ticket. No accounts provisioned.`;
  } else if (proposal.type === 'ticket_routes') {
    for (const route of proposal.routes)
      Object.assign(
        state.tickets.find((t) => t.id === route.ticketId),
        { assignee: route.assignee, status: 'in_progress' },
      );
    detail = `Routed ${proposal.routes.length} sample tickets. No external messages sent.`;
  } else {
    state.tickets.unshift({
      id: `HR-${state.ticketCounter++}`,
      subject: `Payroll readiness · ${proposal.count} exceptions for review`,
      category: 'Payroll',
      country: 'All countries',
      status: 'in_progress',
      priority: proposal.count ? 'high' : 'low',
      assignee: 'Payroll team',
      createdAt: new Date().toISOString(),
      description: `${proposal.report.records} fictional profiles reviewed. ${proposal.report.exceptions} exceptions. No payment calculated or executed.`,
    });
    detail = `Published a readiness review ticket for ${proposal.report.records} fictional profiles. No payment calculated or executed.`;
  }
  state.revision += 1;
  run.status = 'completed';
  run.decidedAt = new Date().toISOString();
  run.result = detail;
  addAudit(state, 'Workflow approved', 'Demo reviewer', `${run.id}: ${detail}`);
  return run;
}
