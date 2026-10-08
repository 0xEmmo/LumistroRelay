# Lumistro Relay V1 — Revised Implementation Plan

## Product direction

Lumistro Relay is a private, owner-facing workspace for customer-facing businesses. An owner signs in, creates a business profile with facts they approve, simulates connecting Instagram, WhatsApp, or both, and tests a receptionist that drafts useful, grounded responses. The public site is an owner product entry—not a Foodician demo. Foodician remains private seed/evaluation material for a later internal demo; it must not appear in public navigation, landing-page CTAs, public routes, public API projections, or a new owner's workspace.

The current AI test experience must be welcoming as well as safe. It includes a deterministic greeting path and owner-specific answerable question starters. Customer wording must be matched by meaning, not by whether it repeats a preset prompt or stored FAQ phrase: for example, “What time do you close?” can use the same approved opening-hours source as “What are your opening hours?”. The system should not route ordinary greetings, menu requests, or semantically supported questions to a human merely because wording differs. It must still hand off uncertainty, risk, or unsupported business claims. A real-message send is out of scope: all output remains a preview draft in the owner's console.

The owner should not have to type every setup fact. Use selectable business types, preset day groups plus opening/closing time controls, payment-method multi-selects, ordering-channel choices, and selectable brand voice. Keep free-text fields for exceptions, contact instructions, policies and business-specific detail. Provide industry-aware FAQ question starters and one-click FAQ additions derived only from already-saved approved facts; never invent their answers. Suggested receptionist tests are derived from the owner's saved menu, profile, products and FAQs so each non-handoff suggestion has a source that can actually answer it. Include a built-in greeting test even before a menu exists.

## Implementation and serving

Continue the canonical GitHub repository `0xEmmo/LumistroRelay` on `main`; fetch/integrate `origin/main` before edits and before checkpoint pushes. Retain the managed React/TypeScript/Vite frontend, Express/tRPC backend, Drizzle/MySQL-compatible database, Manus OAuth sessions, TypeScript diagnostics, and current port 3000 Preview. Auto-publish is off: push code to GitHub but do not publish the site unless separately requested. Keep LLM access and secrets server-side through the supplied Manus LLM helper.

Each authenticated owner gets an idempotent, isolated workspace and membership. Workspace/brand IDs are derived from server-side membership, never client input. The new owner flow is public product entry → sign-in → the owner's workspace → brand setup → simulated Instagram/WhatsApp selection → a working receptionist test. It must display useful loading, empty, error, success and unsaved/error-preservation states.

Brand setup stores the business name, credential-free HTTP(S) website and optional menu link, business type/category, description, locations, opening hours, contact details, delivery/service areas, payment methods, ordering/booking instructions, policies, brand voice, owner-approved products/services (name, category, description, exact price if known, variants/add-ons, availability, optional HTTP(S) image URL), and FAQs with approved answers, related phrases, and an owner-selected intent category (opening hours, menu, product details, product price, delivery/service fee, delivery area/time, ordering/booking, payment, location, contact, policy, business information, or general). A brand owner may select saved business types, day groups, times, common payment methods, order channels, voice, and FAQ intent instead of typing every value; free text remains available for custom details. Selected information is persisted as owner-approved facts. A menu link and product images come only from owner-supplied, validated URLs; the model may not create or choose a link/image.

Channel cards simulate Instagram and WhatsApp connect/disconnect state independently, support either or both, and show an unmistakable “SIMULATED” label. No credentials, account authorization, webhook events, customer messages, or outgoing responses are part of this phase.

The receptionist test service uses the live-catalogued `gpt-5-mini` server-side only for semantic intent classification, selecting exact source references, safe missing detail and lead extraction. It is instructed to recognize synonyms, paraphrases, colloquial wording and ordinary spelling variations; suggested prompts are examples, not an allowed-question list. FAQ sources are eligible only when their owner-selected intent category matches the classified intent; a general FAQ cannot satisfy a specific fact topic. Delivery/service fees use their own `delivery_fee` intent and can never be answered from a product price; a priced service catalogue item remains a product/service price unless the question actually concerns a fee. Product selection is semantic, not exact customer-word matching; product-detail, price and availability answers require a unique matching product record, and price/availability additionally require the exact saved price or confirmed status. A product-specific price FAQ must refer to that same unique catalogue item; a generic price FAQ may answer only a generic pricing question. Server validation checks that each selected owner-scoped source type/field is compatible with the classified intent, but does not require literal customer/source phrase overlap. The server never uses model-written factual prose for an ANSWER: it builds factual drafts from the exact saved value/FAQ answer. Maintain deterministic handoffs for complaints/problems, refunds, discounts, sensitive/safety/legal/financial matters, custom/large/catering orders, explicit human requests, unclear stock/variant/booking availability, and requested facts that are missing. ASK remains limited to one allowlisted safe detail. A simple greeting is handled with a short built-in greeting using only the saved business name; a menu request is answered only when a validated owner menu link, approved catalogue items, or a matching approved FAQ exists. Product/menu answers may attach owner-supplied item images, and saved website/menu/FAQ URLs are rendered as clickable HTTP(S) links. Persist any attachment with the source record so run history remains faithful. No outgoing message is sent.

Quick test questions are constructed from saved facts—e.g., hours only when hours exist, an exact price question only for a named product with a saved price, and a menu prompt only when the menu/catalogue exists. Tapping a chip runs that test. A “speak to a person” check remains available as an intentional handoff example, clearly separated from answerable suggestions. Do not claim these suggestions are generative AI; deterministic suggestions are preferable because they can be guaranteed to match available source facts.

## Data and service boundaries

- Reuse real Manus OAuth and the existing owner-specific workspace/member resolver. Do not restore first-user ownership of Foodician.
- Use additive Drizzle migrations for the profile's optional `menuUrl`, controlled FAQ intent category, and any safe extension to the persisted AI-run mode/source metadata. Existing FAQ rows receive a safe `general`/`faq` default and owners can recategorize them. Do not delete shared seed or user records.
- Keep every query scoped to the authenticated workspace and brand, validate owner input with Zod, and permit only blank or credential-free HTTP(S) URLs for business/menu/image links.
- Treat customer messages as untrusted data. The model may select only exact approved source identifiers and must classify meaning rather than match wording. Server code validates source type/intent, owns factual answer text, attachments, lead-field filtering, and handoff policy.
- Simulated channel state is not an integration. Provider OAuth, webhooks, actual messages, a customer inbox, autonomous send, the 100-case internal evaluation suite, metrics, and billing remain later work.

## Project structure

- `client/src/pages/Home.tsx` — owner-first public entry with no demo brand or demo CTA.
- `client/src/pages/Workspace.tsx` — authenticated owner shell, progress, brand/channel/test navigation.
- `client/src/components/BrandSetupPanel.tsx` — structured business profile controls, products/services, fact-derived FAQ starters and editable FAQ templates.
- `client/src/components/ChannelsPanel.tsx` — clearly simulated Instagram and WhatsApp connection toggles.
- `client/src/components/ReceptionistPanel.tsx` — owner-specific answerable test chips, draft/decision, clickable source/media, and saved history.
- `client/src/owner-workspace.css` — responsive owner setup, selectable options, menu/product previews and test results.
- `client/src/App.tsx` and `client/public/manus-routes.json` — real routes only; no Foodician demo route.
- `drizzle/schema.ts`, `drizzle/relations.ts`, and `drizzle/*.sql` — tenant-owned typed tables plus additive menu/media-history migration.
- `server/workspaces.ts`, `server/brandSetup.ts`, `server/channels.ts`, `server/receptionist.ts` — per-owner provisioning, scoped approved facts, simulated connection state, and safe server-only AI tests.
- `server/routers.ts` and `server/_core/llm.ts` — protected tRPC procedures and the managed server-side AI call.
- `server/*.test.ts` — tenant, URL, option/source-grounding, greeting/menu and safety coverage.
- `plan.md` and `TODO.md` — this current approach and full outcome clauses.

## Design direction

- **Design Movement:** quiet editorial service design, borrowing the restraint and typographic confidence of a hospitality operations journal rather than a generic chatbot or analytics SaaS.
- **Core Principles:** make the next owner action obvious; keep human control visible; make approved facts and simulated integrations legible; fit dense work comfortably on mobile.
- **Color Philosophy:** warm off-white is the welcoming work surface; deep charcoal/navy anchors trust; evergreen marks verified, ready, and simulated-connected states; muted amber and red are reserved for missing information or handoff risk.
- **Layout Paradigm:** product-led public entry into a left-anchored owner workspace; focused setup/test surface, contextual status, short option groups and readable source cards; collapse to one reading column on mobile.
- **Signature Elements:** relay-loop glyph with a handoff dot; crisp ANSWER/ASK/HANDOFF badges; compact “SIMULATED” channel indicators that cannot be mistaken for real authorization.
- **Interaction Philosophy:** replace decorative demo interactions with real form save, suggested starter, connection-state and AI-test transitions. Mark which values are selected or saved, preserve edits on recoverable errors, and make every AI output draft-only.
- **Animation:** brief 140–180 ms fades/slides for state changes and loading only; avoid decorative loops/parallax; honor `prefers-reduced-motion`.
- **Typography System:** Inter/system-ui for labels/body copy paired with Georgia for editorial display headings; clear size/weight hierarchy and tabular numerals where relevant.
- **Brand Essence:** the first-response workspace for small customer-facing businesses that answers from approved facts and hands judgment to a person; **calm, grounded, responsive**.
- **Brand Voice:** direct, warm, and specific; never imply a live connection or answer unsupported by business records. Examples: “Set up your brand. See your receptionist work.” and “A draft is ready. Your team has the final say.”
- **Wordmark & Logo:** retain the custom Lumistro Relay wordmark and compact rounded relay path bending toward one human handoff dot.
- **Signature Brand Color:** evergreen `#2F6B55`, reserved for verified/ready states.

## Controlled delivery sequence

1. **Foundation and owner-first workspace (complete):** managed app, Manus OAuth, per-owner tenant isolation, private seed, owner-only public product entry, TypeScript diagnostics and real route manifest.
2. **Structured owner setup and simulated channels (complete):** owner profile, catalogue, FAQs, selectable channel simulations and safe URL validation.
3. **Grounded receptionist baseline (complete):** server-side LLM test, exact owner-fact answer construction, one-safe-detail ASK, deterministic handoffs and persisted run history.
4. **Owner guidance and natural test behavior (complete):** selectable hours/payment/order setup, fact-derived FAQ/test suggestions, successful built-in greeting, menu links and approved product-image previews in results/history.
5. **Category-aware FAQ matching and price safety (complete):** owners select a controlled topic when creating FAQs and can recategorize saved FAQs; industry starters, saved-fact templates and suggested test prompts follow those topics; an additive migration gives existing rows the safe `faq` default; FAQ retrieval is restricted to the exact classified intent; delivery/service fees are distinct from product prices while priced service items remain products; product-detail, price and availability answers require a uniquely matched catalogue item; price/availability additionally require the exact saved value; and generic price FAQs answer only generic pricing questions.
6. **Later internal evaluation/inbox:** 100-case Foodician evaluator and simulated conversation inbox with approval, takeover, outcomes and metrics.
7. **Future live-channel integrations:** only after this owner setup and test loop is ready, separately configure Meta Business/Developer assets and implement requested Instagram/WhatsApp OAuth, webhooks and sending.

## Explicit exclusions

Do not expose Foodician publicly during this phase; do not implement live Instagram/WhatsApp authorization, webhooks or sending, billing, public pricing tiers, Bumpa/CRM integrations, embeddings/vector search, a complex workflow engine, multi-brand management, advanced team permissions, fully autonomous ordering, or a large analytics suite. Do not claim mock channel states are real. Continue to require a human for judgment and draft approval.
