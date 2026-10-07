# Lumistro Relay V1 — Implementation Plan

## Product and delivery boundary

Lumistro Relay is a human-controlled first-response assistant for business enquiries: it uses each business’s approved information, drafts replies, captures useful leads, and brings in a person when judgment is needed. The first sales niche is Lagos restaurants and food brands, with Foodician as the sample brand. The data model stays industry-neutral for later fashion, beauty, events, real estate, schools, and other businesses. This plan covers the full V1 roadmap; this build pass implements **Batch 1 — Foundation only**. Setup content, AI, evaluation, simulated inbox, metrics, and mock messaging providers remain later batches.

## Implementation approach and serving model

Use the initialized Manus-managed **web-db-user** starter: React + TypeScript + Vite on the frontend; Express + tRPC on the server; Drizzle ORM and the managed MySQL-compatible relational database for durable records. The app is served by the existing Express process on configured port 3000 in Preview; Vite serves the frontend in development and the starter’s static build serves the frontend in production. Keep database access and any future model/provider secrets on the server. Use existing Manus OAuth and session middleware for authentication rather than introducing a separate password system or identity provider.

The existing starter has a public `/` route, protected-procedure scaffolding, Manus OAuth routes, a `users` table and migration, and `pnpm check`/`pnpm test`. Extend those foundations additively. The public landing page remains viewable without a session; sign-in and the authenticated workspace surface use the supplied OAuth flow. Do not create a development-only mock identity or bypass authorization.

Every workspace-owned business record must carry a workspace/tenant identifier, and every read or write must derive authorization from the authenticated user’s server-side membership, then filter by that trusted workspace identifier. Never accept a workspace identifier from the browser as proof of access. Keep brand relationships consistent with the owning workspace; use database constraints where supported and verify authorization at the procedure boundary. Seed Foodician idempotently as demo identity/workspace/brand data; do not invent prices, hours, availability, policies, delivery coverage, or other business facts. The current managed project has no configured `OWNER_OPEN_ID`; the user explicitly approved allowing the first authenticated Manus account that reaches the workspace to claim the single demo tenant. Owner assignment and membership creation occur in one transaction, so failure rolls back both; thereafter every access requires persisted membership and the stored owner identity. If an explicit `OWNER_OPEN_ID` is configured, only that matching admin account may claim it. Reconsider first-account claiming before a public launch.

## Data and service boundaries

- Retain the starter `users` table and OAuth/session code.
- Add `workspaces`, workspace membership/ownership, and `brands` as the Batch 1 domain foundation. A workspace owns its brand records; V1 intentionally supports one brand workspace and does not expose multi-brand management or advanced team permissions.
- In Batch 2, add structured business profile, product/service catalogue, FAQ, policy, and voice data. Each tenant-owned record carries workspace ownership and is queried through the authenticated workspace boundary.
- In Batch 3, implement a server-only grounded decision engine. It receives only approved structured records, returns the structured decision/reply/confidence/intent/missing-information/lead-data/internal-reason result, and routes uncertain/sensitive/judgment cases to HANDOFF. Persist each AI run with its prompt/model version and source-record references. Do not use embeddings or vector search.
- In Batch 4, keep the Foodician evaluation dataset deterministic and versioned: 100 cases split into 25 straightforward FAQs, 15 pricing, 15 delivery, 10 availability, 10 ordering, 10 complaints, 5 refunds, 5 ambiguous, and 5 malicious/unsafe/unanswerable. Expected decisions are ANSWER, ASK, or HANDOFF; the evaluation view shows expected/actual decision, pass/fail, generated reply, confidence, and failure reason.
- In Batch 5, model a simulated conversation inbox with customer messages, AI drafts, human approval/edit/send in simulation as the default, per-conversation AI/human mode, handoff and unanswered queues, and outcome labels. Keep real messaging out of this batch.
- In Batch 6, define `MessageProvider` with mock Instagram and WhatsApp implementations. Keep inbound event handling distinct from slow AI work; make provider events idempotent and retry-safe. Do not request Meta credentials or connect live channels.
- Metrics are limited to the requested basics: conversation count, response time, draft acceptance rate, handoff rate, unanswered questions, qualified enquiries, orders/bookings influenced, and a clearly labelled staff-time-saved estimate.

## Safety and product behavior

Use only information explicitly approved in the business profile, catalogue, FAQs, policies, and later structured records. Never invent prices, fees, availability, stock status, opening hours, discounts, delivery estimates, refund decisions, allergy/safety information, or reservation availability. Choose ANSWER only when approved information is sufficient; ASK only when one safe missing detail can be collected; otherwise HANDOFF when information is missing, sensitive, uncertain, complex, or needs judgment. Complaints, refunds, discounts, large/custom orders, catering quotes, allergy/safety questions, unclear availability, legal/financial/sensitive matters, and requests for a human always require human approval.

The Foodician scenario for later demonstration remains: answer “Do you deliver to Lekki?” only from approved delivery details; answer “How much is chicken pasta?” only from an approved product price; for “Can you cater for 150 people at my wedding?” collect date, guest count, location, budget, and contact, label the result “Qualified catering enquiry,” and let staff take over. The eventual demonstration should communicate the product in approximately 60 seconds.

## Project structure and responsibilities

- `client/src/App.tsx` — public and authenticated route composition.
- `client/src/pages/Home.tsx` — premium public landing page with the approved landing copy and Foodician/setup calls to action.
- `client/src/pages/Workspace.tsx` (or equivalent) — Batch 1 authenticated foundation and the safe Foodician workspace entry; later batches extend it without implementing their features early.
- `client/src/index.css` — Relay palette, type hierarchy, responsive operations-dashboard primitives, and reduced-motion behavior.
- `client/public/manus-routes.json` — static, source-derived page route manifest served before the development server starts and synchronized with route changes.
- `drizzle/schema.ts`, `drizzle/relations.ts`, `drizzle/*.sql` — typed relational schema, relations, and additive migrations.
- `server/db.ts` and focused `server/*.ts` modules — persistence, workspace resolution, tenant-scoped queries, and idempotent Foodician seed behavior.
- `server/routers.ts` and focused server router modules — authenticated tRPC procedures; derive workspace authorization on the server.
- `server/*.test.ts` — unit coverage for tenant access and foundational behavior now, then grounding/decision/idempotency/handoff behavior as those later batches are implemented.
- `plan.md` and `TODO.md` — implementation decisions and complete, batch-organized outcomes; only delivered outcomes are marked complete.

## Design direction

- **Design Movement:** quiet editorial service design, borrowing the restraint and typographic confidence of a hospitality operations journal rather than a generic chatbot or analytics SaaS.
- **Core Principles:** human control stays visible; business facts are traceable and calm; dense work remains legible on a phone; every state has a clear next action.
- **Color Philosophy:** warm off-white is the welcoming work surface; deep charcoal/navy anchors trust and readability; a single ownable evergreen marks connected, approved, and healthy states. Neutral amber and muted red are reserved for attention and risk, not decoration.
- **Layout Paradigm:** an editorial, left-aligned canvas with a narrow brand rail, a focused primary work column, and an optional contextual side panel; on mobile, collapse to one reading column with compact controls rather than shrinking a desktop grid.
- **Signature Elements:** a small relay-loop glyph with a single “handoff” point; restrained pill badges for ANSWER/ASK/HANDOFF; fine dividers and compact timestamps that make operational state easy to scan.
- **Interaction Philosophy:** no customer-facing answer is silently sent; suggested replies visibly wait for human approval. Confirm state changes in place, preserve edits, and make the human takeover path prominent.
- **Animation:** use brief 140–180 ms fades/slides only for state changes and loading; avoid decorative loops and parallax; honor `prefers-reduced-motion` and keep status changes understandable without motion.
- **Typography System:** Inter/system-ui for interface labels and body copy, paired with Georgia for editorial display headlines; use tabular numerals for metrics and a restrained size/weight scale.
- **Brand Essence:** the first-response workspace for small customer-facing businesses that answers from approved facts and hands judgment to a person; **calm, grounded, responsive**.
- **Brand Voice:** direct, warm, and specific; never claim certainty beyond the business record. Examples: “Reply to every customer before they move on.” and “A draft is ready. Your team has the final say.”
- **Wordmark & Logo:** a custom “Lumistro Relay” wordmark paired with a compact rounded relay path that bends toward one human handoff dot; do not rely on an unmodified default text logo.
- **Signature Brand Color:** evergreen `#2F6B55`, used sparingly for approved/connected/healthy states.

## Controlled build sequence

1. **Batch 1 — Foundation (this pass):** initialize the managed web app; create authentication; create workspace and brand tables; enforce tenant isolation; seed the Foodician demo workspace; configure TypeScript diagnostics; add the route manifest; create plan and todo files. Preserve the starter OAuth and database integrations. Add the public landing and authenticated entry needed to make the foundation previewable, without implementing later-batch workflows.
2. **Batch 2 — Brand setup:** build “Tell Relay about your business,” the business profile (business name, description, locations, opening hours, contact details, delivery/service areas, payment methods, booking/order instructions, policies), products/services (name, category, description, price, variants/add-ons, availability, image URL), FAQs (approved answers and related phrases), and all requested brand-voice choices.
3. **Batch 3 — AI engine:** use structured database context only; no vector search; implement ANSWER/ASK/HANDOFF and safety/confidence rules; persist every AI run and source records; keep LLM calls server-side; inspect the live model catalogue before choosing a model.
4. **Batch 4 — Evaluation console:** add and run the 100-question Foodician set; display each required evaluation field; track prompt/model versions.
5. **Batch 5 — Simulated inbox:** implement message simulation, suggested reply by default, approve/edit/send in simulation, per-conversation AI/human switch, handoff and unanswered queues, and conversation outcomes.
6. **Batch 6 — Provider abstraction:** define the future provider boundary and mock Instagram/WhatsApp providers; no Meta credentials and no live channels until the internal system and evaluation suite work.

## Explicit exclusions

Do not build billing, public pricing tiers, Bumpa or CRM integrations, vector database/embeddings, complex workflow engine, multi-brand management, advanced team permissions, fully autonomous ordering, multiple live messaging channels, a large analytics suite, or live Instagram/WhatsApp integration before the internal system and evaluation suite work. Do not expand Batch 1 into setup, AI, evaluation, inbox, or provider implementation. After V1, validate with 3–5 Lagos businesses, inspect 10 recent enquiries each, select one channel, pilot one restaurant in suggested-reply mode, and measure response time, staff time saved, qualified enquiries, and influenced orders/bookings before considering automation, another channel, billing, integrations, or broader industries.
