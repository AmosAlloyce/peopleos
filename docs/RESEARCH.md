# PeopleOS: research and design decisions

Research checked on 23 September 2026. PeopleOS is an independent portfolio project by **Alloyce Amos, Software Engineer & Data Engineer**. It is inspired by a public role description, without access to Wave's systems, employee records, internal policies, or Workday tenant.

## What the role calls for

Wave's HR Systems Analyst role emphasizes a 2026 HRIS migration, data quality, service operations, country-specific workflows, reporting, and Workday experience. Those requirements informed the scenarios below. The role's 5,000+ employee experience requirement is an architectural design target; the demo does not claim to have processed that many records. [Official role](https://www.wave.com/en/careers/job/5834948004/)

| Role requirement | Demonstration | Evidence a reviewer can inspect |
| --- | --- | --- |
| Migration and reconciliation | Validate synthetic worker records, propose corrections, pause for approval | Field-level issues, run steps, updated quality metrics, audit history |
| Multi-country processes | Country-aware onboarding and payroll readiness | Routing, named responsibilities, exception lists |
| Internal service desk | Submit a request and execute a triage workflow | Ticket priority, category, assignment, audit events |
| HR reporting | Derive dashboard values from the same worker dataset | Country and department distribution, CSV export |
| Integrations | Run the API through an importable n8n workflow | HTTP requests, session forwarding, recorded outputs |
| Training and support | English/French assistant with voice input and spoken replies where supported | Source context, editable transcript, text fallback |

Wave's public careers page emphasizes direct communication, learning, and practical impact. The design response is an inspectable system: visible data, explicit AI mode, concise reasoning, and approval before applying changes. This is a design interpretation, not a claim about their internal tooling. [Wave careers](https://www.wave.com/en/careers/)

## AI provider and orchestration

**Decision:** a small Node service performs deterministic checks; an optional Groq request turns structured context into an explanation. A named specialist represents a bounded responsibility, not a permanently running model process. This keeps the free-server footprint modest and lets the demo work without credentials.

The default candidate is `openai/gpt-oss-20b` on Groq, configurable through `GROQ_MODEL`. Groq currently lists it as a production model. Their current catalogue labels the Llama 3.1/3.3 options as Enterprise, so old tutorials promising unrestricted free access should not drive this project's configuration. Account permissions, availability, pricing, and quotas must be checked in the actual Groq account. [Groq models](https://console.groq.com/docs/models), [GPT OSS 20B on Groq](https://console.groq.com/docs/model/openai/gpt-oss-20b)

The integration uses Groq's documented chat-completions endpoint. Provider keys stay in server environment variables. Provider failure falls back to the deterministic response and reports the actual response mode. Language-model text never authorizes a mutation. [Groq API reference](https://console.groq.com/docs/api-reference)

## Workday boundary

Workday offers SOAP interfaces for large system-to-system exchanges and REST APIs for smaller interactive transactions. A real migration would require tenant-specific permissions, supported service versions, field mappings, reconciliation, and a sandbox test plan. PeopleOS implements the surrounding migration controls with fixtures; it does **not** connect to, reproduce, or certify Workday. [Workday APIs](https://developer.workday.com/api-overview), [Workday SOAP documentation](https://developer.workday.com/documentation/GUID-43742c5c-4caf-436f-bdd5-94330d32288c-enHYPHENus/)

A future adapter should preserve source identifiers, effective dates, references, validation results, and idempotency keys; quarantine rejected rows; reconcile source-to-target totals; and require a controlled cutover. These are proposed engineering decisions, not implemented tenant capabilities. This project demonstrates transferable skills and cannot substitute for actual Workday administration experience.

## Workflow portability

n8n imports JSON workflows. Its HTTP Request node can return response headers and status, allowing the demo's `Set-Cookie` response to be forwarded on subsequent calls. The included workflow uses standard nodes and creates its own synthetic workspace. It ends with a reviewable proposal; it does not submit an approval. [n8n import/export](https://docs.n8n.io/build/manage-workflows/export-and-import/), [HTTP Request node](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.httprequest/)

## Voice with a useful purpose

Three assistant personas support everyday questions, migration explanations, and onboarding guidance. Voice input populates text for review, while read-aloud helps rehearse an HR handover. Browser speech recognition has uneven support and may transmit audio to the browser provider; speech synthesis depends on installed voices. The interface therefore retains text interaction. Voice is never used to identify an employee, infer emotion, evaluate a candidate, or authorize a change. [Speech recognition](https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition), [Speech synthesis](https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesis)

## Hosting decision

One application container plus Caddy is sufficient for this demo. The application serves both the portfolio and API; an external AI provider avoids hosting model weights. The images support the normal ARM64/AMD64 deployment path through native Docker builds. [Docker multi-platform builds](https://docs.docker.com/build/building/multi-platform/)

Oracle's current Always Free documentation gives A1 resources equivalent to **2 OCPUs and 12 GB**, with allocation subject to the tenancy's limits and home-region capacity. Older 4 OCPU/24 GB examples should not be assumed to apply. Check **Limits, Quotas and Usage** before sizing or changing the existing server. The same documentation says idle instances may be reclaimed, so keep source and deployment configuration elsewhere. [Oracle Always Free resources](https://docs.oracle.com/en-us/iaas/Content/FreeTier/freetier_topic-Always_Free_Resources.htm)

DuckDNS can point a chosen subdomain to the approved server IP. Caddy obtains and renews certificates when the hostname resolves correctly and validation traffic can reach the server. Server identity, DNS ownership, and existing services must be established before deployment. [DuckDNS specification](https://www.duckdns.org/spec.jsp), [Caddy automatic HTTPS](https://caddyserver.com/docs/automatic-https)

## Deliberate scope

This release uses synthetic records and sample policies. It does not claim legal compliance, validate real payroll, rank employees, predict attrition, make employment decisions, or measure customer savings. Production use would require authenticated users, authorized approvers, durable data and audit storage, integration credentials, jurisdiction-specific policy review, and privacy/security assessment.
