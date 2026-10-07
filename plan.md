# Lumistro Relay V1 — Implementation Plan

## Product direction

Lumistro Relay is an owner-facing workspace for businesses that need timely, grounded first responses to customer enquiries. A business owner signs in, creates a brand profile and approved facts, simulates connecting Instagram, WhatsApp, or both, then tests a receptionist that drafts a safe response from those facts. Human control stays visible: this phase does not send customer messages or claim a real social account is connected.

The public site must feel like an operational product owners can enter, not a Foodician demo. Remove Foodician from public navigation, landing-page calls to action, routes, and public API projections. Retain its seeded record only as private future demo/evaluation material; do not show it to new owners or delete shared records as part of this redesign.

The user selected simulated Instagram and WhatsApp linking for this build phase and a working AI test console; live Meta connections can be added later after the setup flow is ready and the required Meta business/developer configuration is available. An owner can simulate Instagram, WhatsApp, or both. Every simulation is plainly labelled as simulated and must never imply that a real account has been authorized.

## Implementation and serving

Continue the canonical GitHub project at `0xEmmo/LumistroRelay` on `main`; fetch and integrate `origin/main` before further edits and before each checkpoint push. Preserve the initialized managed React/TypeScript/Vite frontend, Express/tRPC backend, Drizzle ORM and MySQL-compatible managed database, Manus OAuth sessions, and existing port 3000 Preview/runtime. Auto-publish remains off. Keep all database access and LLM credentials server-side; use the platform's supplied LLM helper and credentials rather than a browser call or separately managed API key.

Each authenticated user receives an idempotent, isolated workspace and owner membership. The resolver never returns the shared Foodician demo tenant to ordinary owners. Tenant IDs are derived from server-side memberships, never trusted from client input. New business profile, product/service, FAQ, simulated-channel, and AI-run records are scoped through the authenticated owner's brand/workspace.

The owner flow is: public product landing → Manus sign-in → owner workspace creation → business/brand setup → simulated channel selection/connection → “Test your receptionist.” The workspace offers clear progress, empty, loading, success, and error states. The brand setup captures business name, description, industry/category, website, locations, opening hours, contact details, delivery/service areas, payment methods, booking/order instructions, policies, products/services (name, category, description, price, variants/add-ons, availability, image URL), FAQs with approved answers and related phrases, and one of the requested brand voices. Owner-saved information is the approved knowledge source for the test. Optional website and image values must be blank or credential-free HTTP/HTTPS URLs.

Persist simulated Instagram and WhatsApp connection state separately per brand. Provide explicit connect/disconnect and connected-in-simulation states. Do not request Meta credentials, add live OAuth, ingest messages, publish, or send replies in this phase. Real provider adapters and live channel flows remain future work.

The test console accepts an owner-entered customer message and calls the server-side Manus LLM using only that owner's saved approved brand information. The live catalog returned the available `gpt-5-mini` ID; a structured-output call was verified successfully. The model classifies intent/decision, proposes typed source references, and extracts lead fields, but it does not author customer-facing factual prose. References are kind/field-qualified (`profile:<id>:<field>`, `product:<id>`, `faq:<id>`), validated against the current tenant's approved sources, and checked for question relevance. On ANSWER, the server builds the displayed draft only from exact approved field values or the exact saved FAQ answer; unsupported, ambiguous, irrelevant, or malformed references fail closed to HANDOFF. ASK is allowed only for one allowlisted low-risk detail and uses a fixed server-written question template. Lead values are kept only if their exact text appears in the customer message. Store each run with decision, draft, confidence, intent, missing information, filtered lead data, internal reason, typed source references, run mode, and prompt/model version. Do not add embeddings/vector search. Never invent prices, fees, availability, stock, hours, discounts, delivery times/areas, refund outcomes, allergy/safety information, contact details, or reservation availability. Deterministically hand off complaints/problems, refunds, discounts, custom/large orders, catering quotes, allergy/safety, unclear product or booking availability, missing requested prices/hours/delivery/payment/order/location/contact/policy facts, unsupported delivery-time estimates, legal/financial/sensitive topics, and explicit human requests. The console only drafts; no customer message is sent.

## Data and service boundaries

- Retain the starter `users` and OAuth/session implementation. Use actual Manus identities; no mock login or development bypass.
- Retain tenant-owned workspace, membership, and brand tables; provide idempotent per-owner workspace creation and additive Drizzle migrations for brand profile, products/services, FAQs, simulated channel states, and AI run history.
- Keep a shared demo seed private and inaccessible through normal owner workspace resolution and public routes. No demo-specific public route or API is part of the owner-facing phase.
- Keep owner-scoped tRPC procedures in focused backend modules (workspace setup, brand facts, channels, receptionist). Validate input with Zod, authorize with persisted membership, and filter each record by the derived workspace/brand ID.
- Treat customer messages as untrusted data in prompts. Construct model context only from approved database facts, constrain structured output, validate every source reference in server code, build customer-facing answers from exact approved data, and persist run mode plus source-record references.
- Channel simulation is a product preview only. Actual channel OAuth, webhooks, provider retries, and outgoing messages remain future work.

## Project structure

- `client/src/pages/Home.tsx` — public owner-first landing page; no Foodician demo CTA or brand content.
- `client/src/pages/Workspace.tsx` — authenticated operations shell, first-run progress, brand setup and AI test entry.
- `client/src/components/BrandSetupPanel.tsx` — business profile, product/service and FAQ editors.
- `client/src/components/ChannelsPanel.tsx` — Instagram/WhatsApp simulated connection cards.
- `client/src/components/ReceptionistPanel.tsx` — test composer, decision drafts and saved run history with readable source labels.
- `client/src/owner-workspace.css` — responsive landing and owner-console styling.
- `client/src/App.tsx` and `client/public/manus-routes.json` — only real public/workspace routes, synchronized with source; not-found fallback routes are excluded.
- `drizzle/schema.ts`, `drizzle/relations.ts`, `drizzle/*.sql` — additive typed tenant-owned tables and migrations.
- `server/workspaces.ts`, `server/brandSetup.ts`, `server/channels.ts`, `server/receptionist.ts` — idempotent tenant provisioning, scoped owner operations, safe simulated state, URL validation, source-grounded AI tests, and deterministic handoffs.
- `server/routers.ts` plus `server/_core/llm.ts` — validated tRPC routes and server-only platform AI invocation.
- `server/*.test.ts` — tenant authorization, URL, source grounding, and safety-rule coverage.
- `plan.md` and `TODO.md` — current product approach and explicit outcome-based remaining scope.

## Design direction

- **Design Movement:** quiet editorial service design, borrowing the restraint and typographic confidence of a hospitality operations journal rather than a generic chatbot or analytics SaaS.
- **Core Principles:** make the next owner action obvious; keep human control visible; make approved facts and simulated integrations legible; fit dense work comfortably on mobile.
- **Color Philosophy:** warm off-white is the welcoming work surface; deep charcoal/navy anchors trust; evergreen marks verified, ready, and simulated-connected states; muted amber and red are reserved for missing information or handoff risk.
- **Layout Paradigm:** a product-led public entry leading into a compact, left-anchored owner workspace with a persistent brand rail, focused setup/test surface, and contextual status column; collapse to one reading column on mobile.
- **Signature Elements:** a relay-loop glyph with a human handoff dot; crisp ANSWER/ASK/HANDOFF badges; compact “SIMULATED” channel indicators that prevent demo states being mistaken for real authorization.
- **Interaction Philosophy:** replace decorative demo interactions with real form save, progress, connection-state, and AI-test transitions. Confirm every state change in place; preserve user-entered values on error; make the test console explicitly draft-only.
- **Animation:** brief 140–180 ms fades/slides for state changes and loading only; avoid decorative loops and parallax; honor `prefers-reduced-motion`.
- **Typography System:** Inter/system-ui for labels and body copy paired with Georgia for editorial display headings; use clear size/weight hierarchy and tabular numerals where relevant.
- **Brand Essence:** the first-response workspace for small customer-facing businesses that answers from approved facts and hands judgment to a person; **calm, grounded, responsive**.
- **Brand Voice:** direct, warm, and specific; never imply a live connection or answer unsupported by business records. Examples: “Set up your brand. See your receptionist work.” and “A draft is ready. Your team has the final say.”
- **Wordmark & Logo:** retain the custom “Lumistro Relay” wordmark and compact rounded relay path that bends toward one human handoff dot.
- **Signature Brand Color:** evergreen `#2F6B55`, used sparingly for verified/ready states.

## Controlled delivery sequence

1. **Foundation (complete):** managed app, Manus OAuth, tenant schema, server-derived access, private Foodician seed, TypeScript diagnostics, route manifest, and baseline landing/workspace.
2. **Owner-first entry and per-owner workspace (complete):** remove public Foodician demo surfaces; add owner-oriented calls to action and one isolated workspace per authenticated owner with no shared demo claim.
3. **Brand setup (complete):** collect the structured profile, product/service entries, FAQs, policies, and voice settings; save owner-submitted information as the approved knowledge base.
4. **Simulated channel setup (complete):** let each owner select Instagram, WhatsApp, or both and exercise explicit simulated connect/disconnect states without live account authorization or messaging.
5. **Grounded receptionist test (complete):** classify with the server-side LLM against only owner-approved facts; validate kind/field-specific references; assemble ANSWER drafts from exact approved source data; use one safe fixed ASK template; apply deterministic HANDOFF rules; persist inspectable runs; never send customer messages.
6. **Later internal evaluation and conversation workflow:** build the 100-case Foodician evaluator and simulated inbox with human approval, takeover, outcomes, and basic metrics after the owner setup/test loop is usable.
7. **Future live-channel integration:** only after the mock flow and grounded internal system are ready, separately configure Meta Business/Developer assets and implement requested live Instagram/WhatsApp authorization/webhooks under an explicit scope.

## Explicit exclusions

Do not expose Foodician as the public demo during this phase; do not build live Instagram/WhatsApp authorization, webhooks or sending, billing, public pricing tiers, Bumpa/CRM integrations, embeddings/vector search, a complex workflow engine, multi-brand management, advanced team permissions, fully autonomous ordering, or a large analytics suite. Do not claim mock channel states are real account connections. Continue to require human approval and use approved facts only.
