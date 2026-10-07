# Lumistro Relay V1 — Todo

This project uses this `TODO.md` as the project todo list because no native Webdev todo operation is available in the current session. The plan lives in [`plan.md`](./plan.md). Keep the requested batches controlled: this first build pass implements Batch 1 only; later batches remain open. Do not mark an outcome complete until its described product behavior is present.

## Batch 1 — Foundation

- [x] **Foundation, authentication, and tenant data:** Initialize the managed TypeScript web app. Create authentication. Create workspace and brand tables. Enforce tenant isolation. Seed the Foodician demo workspace. Configure TypeScript diagnostics. Add a route manifest. Create the plan and todo files. Use the managed Webdev server and relational database. Scope every brand-owned record by workspace/tenant ID. Keep secrets server-side. Add loading, empty, error, and success states. Add unit tests for tenant isolation. The first pass implements this foundation only; do not implement later batches early.
- [x] **Preview landing and demo entry:** Use the landing-page headline “Reply to every customer before they move on.” Use the subheadline “Relay answers customers using your actual business information, drafts safe responses for your team, captures useful enquiries, and brings in a human when it matters.” Provide the primary CTA “Try the Foodician demo” and secondary CTA “Set up your brand.” The public landing page stays distinct from authenticated workspace access.

## Batch 2 — Brand setup

- [ ] **Business setup and profile:** Build a setup flow called “Tell Relay about your business.” Provide a structured business profile containing business name, description, locations, opening hours, contact details, delivery/service areas, payment methods, booking/order instructions, and policies.
- [ ] **Products and services catalogue:** Provide catalogue fields for name, category, description, price, variants/add-ons, availability, and image URL. Do not supply unapproved prices or availability.
- [ ] **FAQs and brand voice:** Provide FAQs with approved answers and related phrases. Provide brand voice settings for friendly, professional, premium, casual, playful, and short/direct.

## Batch 3 — Grounded AI engine

- [ ] **Approved-information AI and decisions:** Use approved structured database information only; do not add vector search. Return ANSWER when approved information is sufficient, ASK when one safe missing detail can be collected, and HANDOFF when information is missing, sensitive, uncertain, complex, or requires human judgment. Never invent prices, fees, availability, stock status, opening hours, discounts, delivery estimates, refund decisions, allergy/safety information, or reservation availability. Always require human approval for complaints, refunds, discounts, large/custom orders, catering quotes, allergy/safety questions, unclear availability, legal, financial, or sensitive matters, and any request to speak with a human. Show confidence and apply grounding rules.
- [ ] **Structured AI result and run history:** Return decision, reply draft, confidence, intent, missing information, lead data, and internal reason. Store every AI run for debugging with its source records and prompt/model versions. Make LLM calls server-side only. Discover the live model catalogue before selecting a model.
- [ ] **AI test console:** Build a test console called “Test your receptionist.”

## Batch 4 — Evaluation console

- [ ] **Foodician evaluation set:** Create 100 realistic Foodician questions with expected outcomes ANSWER, ASK, or HANDOFF: 25 straightforward FAQs, 15 pricing, 15 delivery, 10 availability, 10 ordering, 10 complaints, 5 refunds, 5 ambiguous, and 5 malicious/unsafe/unanswerable.
- [ ] **Evaluation results and versioning:** Run evaluation cases and show question, expected decision, actual decision, pass/fail, generated reply, confidence, and reason for failure where applicable. Track prompt/model versions.

## Batch 5 — Simulated inbox

- [ ] **Suggested-reply conversations:** Provide a simulated conversation inbox and customer message simulator. Suggested-reply mode is the default: AI understands; AI drafts; a human approves or edits; the response is sent in the simulation. Do not send replies to a live channel.
- [ ] **Human control, queues, and outcomes:** Provide an AI/human toggle per conversation; a human handoff queue; an unanswered-question queue; and conversation outcome labels. Staff can take over a conversation.
- [ ] **Foodician demonstration flow:** Customer asks “Do you deliver to Lekki?” and Relay drafts an answer using approved delivery information. Customer asks “How much is chicken pasta?” and Relay retrieves the approved product price. Customer asks “Can you cater for 150 people at my wedding?” and Relay asks for date, guest count, location, budget, and contact. The dashboard shows “Qualified catering enquiry.” A staff member can take over the conversation. The complete demo communicates the product in approximately 60 seconds.
- [ ] **Basic metrics:** Show conversation count, response time, draft acceptance rate, handoff rate, unanswered questions, qualified enquiries, orders/bookings influenced, and staff time saved estimate.

## Batch 6 — Provider abstraction

- [ ] **Mock messaging providers:** Create a provider abstraction for future messaging channels: `MessageProvider`, `InstagramProvider`, and `WhatsAppProvider`. Add mock Instagram and WhatsApp providers for the first demo. Keep provider/webhook handling separate from slow AI work. Make provider events idempotent and retry-safe. Do not request Meta credentials or implement live messaging until the internal system and evaluation suite work.

## Cross-cutting product constraints

- [ ] **Brand-based architecture and scope limits:** Support business brands across restaurants/food brands and later fashion, beauty, events, real estate, schools, and other businesses. V1 has one brand workspace. Do not add billing, public pricing tiers, Bumpa integration, CRM integration, a vector database or embeddings, a complex workflow engine, multi-brand management, advanced team permissions, fully autonomous ordering, multiple live messaging channels, or a large analytics suite. Do not implement live Instagram or WhatsApp before the internal system and evaluation suite work.
- [ ] **Safety, reliability, and operator states:** If live integrations are unavailable, the mock inbox and Foodician demo still work completely. Add loading, empty, error, and success states. Add unit tests for grounding rules, ANSWER/ASK/HANDOFF decisions, tenant isolation, duplicate provider events, and human handoff.
- [ ] **Post-V1 validation gate:** After the internal system works, interview 3–5 Lagos businesses; ask whether serious enquiries arrive mainly through Instagram or WhatsApp; inspect their last 10 enquiries; choose one real channel; run one restaurant pilot in suggested-reply mode; measure response time, staff time saved, qualified enquiries, and orders/bookings influenced. Only after that add automation, a second channel, billing, integrations, and broader industries.
