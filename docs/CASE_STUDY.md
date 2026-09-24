# PeopleOS · interview case study

**Alloyce Amos — Software Engineer & Data Engineer**  
Independent portfolio project inspired by Wave's public HR Systems Analyst role. All employees and policies are fictional.

## A 60-second introduction

“I built PeopleOS to show how I approach the boundary between HR operations and engineering. The central problem is a migration that must preserve employee records while exposing exceptions and keeping people in control of changes.

“The demo starts with 48 synthetic profiles across 13 countries and 16 deliberately introduced field errors. A migration run executes checks, stages corrections, reconciles the proposed target, and presents a reviewable result. Approval changes the data and its audit history together. Other workflows cover starter handoffs, support routing, and payroll readiness.

“The agent structure makes responsibilities visible: four coordinators and 18 specialists. The current tools are deterministic, with optional Groq for explanation. That choice makes outcomes testable and keeps model-generated language outside the mutation path. I can also demonstrate the API through n8n, the source data through CSV validation, and the user journey through a recorded walkthrough.”

## Requirement-to-evidence matrix

| Interview topic | Show in the product | Explain in the implementation |
| --- | --- | --- |
| HRIS migration | Open issues → migration trace → proposal → approval → improved quality | Five validation rules, preserved IDs/counts, stale-proposal preflight |
| Data quality | Specific field errors and proposed values | The same session dataset drives directory, reporting, and corrections |
| Data transformation | CSV preview and field mapping | Bounded parser, validation results, rejected inputs, no automatic import commit |
| Service operations | Create a request; route the unassigned queue | Explicit categories, responsible teams, human review, no external messages |
| Country-aware systems | Country filters and readiness exceptions | Shared country catalogue; sample routing, without invented statutory rules |
| Workflow design | Four run scenarios and visible tool outputs | Bounded responsibilities, explicit state transitions, duplicate/stale decision rejection |
| Reporting | Country/department distribution and CSV export | Calculated sample aggregates; formula-safe export |
| AI judgment | Ask for a migration explanation; inspect sources and mode | Server-side key, aggregate context, fallback, rate limits, no model-authorized mutation |
| End-user enablement | English/French assistant, voice controls, recorded walkthrough | Reviewable text, browser-dependent voice, usable text fallback |
| Integrations | Import the n8n JSON and inspect the proposal | Actual HTTP endpoints and session continuity; Workday is a future adapter |
| Operations | Explain Docker/Caddy and optional persistent demo sessions | Small server footprint, explicit proxy configuration, bounded visitor state |

The CSV preview and optional persistence are part of the current implementation when enabled; consult the API documentation and environment configuration. They are not a production migration pipeline or enterprise audit system.

## Suggested five-minute demonstration

1. **Problem and scope, 30 seconds.** Explain the synthetic records and the migration risk: a plausible dashboard is insufficient unless its numbers reconcile.
2. **Data quality and migration, 90 seconds.** Inspect one exception, run checks, show the staged before/after values, approve, and verify the new state. Explain that proposed correction values come from controlled fixtures, not model guesses.
3. **CSV and service workflow, 60 seconds.** Preview a small CSV with a field error, then show a support-routing proposal. Point out the shared API/state model.
4. **Orchestration and AI, 60 seconds.** Show coordinator/specialist responsibilities, ask the analyst to explain the result, and describe what happens if the provider is unavailable.
5. **Engineering and next steps, 60 seconds.** Show the audit, test evidence, n8n export, deployment files, and the proposed real-tenant integration boundary.

## What is real, what is simulated, what comes next

| Implemented and inspectable | Deliberately simulated | Proposed next stage |
| --- | --- | --- |
| Runnable UI, API, validators, proposals, approval mutations, session isolation | Employees, data errors, handbook, teams, country catalogue | Tenant-backed worker source and reviewed field mappings |
| CSV parse/validation preview | Source-backed correction values seeded in fixtures | Staging tables, rejected-row remediation, resumable batch import |
| Four executable workflows and audit events | Internal demo assignments, activation, readiness review tickets | Real provisioning, ticketing, payroll-system connectors |
| Optional live explanation through Groq | Keyless assistant uses deterministic, grounded responses | Versioned prompts, broader evaluation set, provider monitoring |
| Browser speech and a recorded product walkthrough | Generic synthetic narration, no personal voice cloning | Controlled speech provider with agreed data handling |
| Docker deployment package; optional SQLite session persistence | Anonymous visitors act as their own demo reviewer | SSO, authorized approvers, durable protected audit, disaster recovery |

## Decisions worth discussing

**Agents describe responsibilities.** Separate tasks and outputs make the workflow understandable, but a new agent name alone does not create a capability. The demo uses ordinary functions where rules suffice. A production design would justify additional autonomous agents with measurable improvement in resolution quality or human time saved.

**Explanation is separate from execution.** Models help phrase a summary; typed proposals and deterministic checks govern changes. This is a practical response to the cost of an incorrect employee-data mutation.

**Approval includes a preflight.** The source may change between proposal and decision. Checking the relevant prior values before applying the whole proposal prevents a stale screen from silently overwriting newer work.

**One small service is enough to demonstrate the architecture.** The portfolio, app, and API share a deployable unit. Optional SQLite improves demo continuity without introducing a distributed database. A real integration workload may justify a queue, transactional database, workers, and observability after its volumes and failure modes are understood.

**Evidence stays proportional.** Sample metrics are computed from 48 records. No claims are made about production savings, 5,000-person load performance, Workday experience, legal compliance, or customer adoption.

## Evaluation plan for the next iteration

| Evaluation | Method | Success evidence |
| --- | --- | --- |
| Migration correctness | Known input/error fixtures; compare identities, counts, field changes, and rejected rows | Every expected error detected; no unapproved change; exact reconciliation |
| Approval safety | Repeat decisions, alter source before approval, approve overlapping proposals | No duplicate application; stale/conflicting proposals fail with clear feedback |
| Assistant factuality | English/French question set before and after state changes, including unsupported requests | Correct counts and cited context; admits unsupported capabilities; no invented actions |
| Provider failure | Timeouts, malformed responses, quota exhaustion, missing credentials | Useful labeled fallback and unchanged deterministic workflow behavior |
| Isolation and durability | Separate cookies/tokens, restart, expiry, reset | No cross-session reads; only unexpired persisted sessions restore |
| Accessibility and task usability | Keyboard, mobile, readable errors, text alternatives, a short observer-led test | Users complete review and approval without unexplained dead ends |
| Representative scale | Generate larger synthetic datasets, then measure CPU, memory, API latency and batch throughput | Report measured percentiles and failure limits before claiming capacity |

Test results demonstrate the implemented behavior; planned evaluations do not imply they have already been executed. The next production discussion should start with access to a sandbox tenant, actual source schemas, policy owners, integration constraints, and a cutover/reconciliation plan.

Sources and role context: [research notes](RESEARCH.md). System boundaries: [architecture](ARCHITECTURE.md). Deployment: [Oracle/DuckDNS guide](DEPLOYMENT.md).
