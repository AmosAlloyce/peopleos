# Shared implementation contract

React/Vite frontend, Express 5 API, Node 22. Synthetic public demo. Root builds HR UI + common CSS. Portfolio agent owns `src/Portfolio.jsx` and `src/portfolio.css` only. Backend agent owns `server/` and `test/`. Research agent owns research/deployment docs, Docker files, and n8n export.

Client routes are `/` portfolio and `/app` HR app, with `/app/:section` deep links. Sections: overview, people, migration, workflows, service-desk, insights, audit. Portfolio default export renders standalone page and imports its own CSS; links to `/app` and video `/demo/peopleos-demo.mp4`, captions `/demo/peopleos-demo.vtt`, poster `/demo/poster.jpg`. Use normal anchor navigation. Confirmed identity: Alloyce Amos, Software Engineer & Data Engineer, GitHub https://github.com/amosalloyce. Do not invent work experience, clients, projects, metrics, or credentials.

API endpoints:
- GET `/api/health`: `{status, mode: 'demo'|'live', provider, version}`
- GET `/api/workspace`: `{employees, tickets, issues, runs, audit, agents, stats}`
- POST `/api/runs` body `{scenario:'migration'|'onboarding'|'service-desk'|'payroll'}` returns run with `{id, scenario, status:'awaiting_approval', steps:[{id, agent, label, status, detail, durationMs}], summary, createdAt, proposal}`. Executed deterministic workflows, each step actual validation/tool logic. Groq optional for summary only; accurate mode labels.
- POST `/api/runs/:id/approve` body `{decision:'approve'|'reject'}` produces updated run, applies demo data fixes where appropriate and writes audit; cannot approve twice.
- POST `/api/chat` body `{message, language:'en'|'fr', persona:'concierge'|'analyst'|'onboarding'}` returns `{reply, mode, sources:[{title,detail}], agent}`. Do not emit private information. Limit input, rates and provider calls.
- POST `/api/tickets` body `{subject,category,country,description}` returns ticket.
- POST `/api/reset` resets per-session demo state.
- GET `/api/export` returns synthetic employees CSV with spreadsheet formula safety.

Isolate visitor state by server-issued HttpOnly SameSite cookie, stored in SQLite or bounded in-memory map. Server does not need real HR authentication because only synthetic sample data. Document production limitations; do not expose actual provider key. For n8n use dedicated API token or cookie forwarding, not public arbitrary URL proxy.

Employee schema `{id,name,initials,role,department,country,countryCode,location,email,status,manager,startDate}`. Ticket `{id,subject,category,country,status,priority,assignee,createdAt}`. Issue `{id,employeeId,employee,field,currentValue,proposedValue,severity,status,country,rule}`. Agent `{id,name,department,role,kind:'orchestrator'|'specialist',description}`. Audit `{id,action,actor,detail,createdAt}`. Stats derive from actual employee sample; large-scale 5,000+ is architecture target only, not claimed actual records.
