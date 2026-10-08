import {
  boolean,
  index,
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/mysql-core";

/** Core user table backing the Manus OAuth flow. */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/** A workspace is a tenant boundary; each owner starts in an isolated workspace. */
export const workspaces = mysqlTable("workspaces", {
  id: int("id").autoincrement().primaryKey(),
  slug: varchar("slug", { length: 64 }).notNull().unique(),
  name: varchar("name", { length: 160 }).notNull(),
  ownerUserId: int("ownerUserId").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type Workspace = typeof workspaces.$inferSelect;

/** Explicit membership is required before a user can access workspace data. */
export const workspaceMembers = mysqlTable(
  "workspace_members",
  {
    id: int("id").autoincrement().primaryKey(),
    workspaceId: int("workspaceId").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
    userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
    role: mysqlEnum("role", ["owner", "member"]).default("owner").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [
    uniqueIndex("workspace_members_workspace_user_unique").on(table.workspaceId, table.userId),
    index("workspace_members_user_idx").on(table.userId),
  ],
);
export type WorkspaceMember = typeof workspaceMembers.$inferSelect;

/** One owner-created brand per workspace; demo brands remain private seed data. */
export const brands = mysqlTable(
  "brands",
  {
    id: int("id").autoincrement().primaryKey(),
    workspaceId: int("workspaceId").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
    slug: varchar("slug", { length: 64 }).notNull(),
    name: varchar("name", { length: 160 }).notNull(),
    websiteUrl: varchar("websiteUrl", { length: 255 }),
    isDemo: boolean("isDemo").default(false).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [
    uniqueIndex("brands_workspace_slug_unique").on(table.workspaceId, table.slug),
    uniqueIndex("brands_workspace_unique").on(table.workspaceId),
    index("brands_workspace_idx").on(table.workspaceId),
  ],
);
export type Brand = typeof brands.$inferSelect;

/** Owner-submitted facts are the approved source material for AI test runs. */
export const brandProfiles = mysqlTable(
  "brand_profiles",
  {
    id: int("id").autoincrement().primaryKey(),
    workspaceId: int("workspaceId").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
    brandId: int("brandId").notNull().references(() => brands.id, { onDelete: "cascade" }),
    industry: varchar("industry", { length: 100 }).notNull(),
    description: text("description").notNull(),
    locations: text("locations").notNull(),
    openingHours: text("openingHours").notNull(),
    contactDetails: text("contactDetails").notNull(),
    deliveryAreas: text("deliveryAreas").notNull(),
    paymentMethods: text("paymentMethods").notNull(),
    orderInstructions: text("orderInstructions").notNull(),
    policies: text("policies").notNull(),
    menuUrl: varchar("menuUrl", { length: 500 }),
    voice: mysqlEnum("voice", ["friendly", "professional", "premium", "casual", "playful", "short_direct"]).default("friendly").notNull(),
    isApproved: boolean("isApproved").default(true).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [
    uniqueIndex("brand_profiles_brand_unique").on(table.brandId),
    index("brand_profiles_workspace_idx").on(table.workspaceId),
  ],
);
export type BrandProfile = typeof brandProfiles.$inferSelect;

/** Product or service facts entered and approved by the owner. */
export const catalogueItems = mysqlTable(
  "catalogue_items",
  {
    id: int("id").autoincrement().primaryKey(),
    workspaceId: int("workspaceId").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
    brandId: int("brandId").notNull().references(() => brands.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 160 }).notNull(),
    category: varchar("category", { length: 100 }).notNull(),
    description: text("description").notNull(),
    price: varchar("price", { length: 100 }),
    variants: text("variants").notNull(),
    availability: mysqlEnum("availability", ["available", "unavailable", "unknown"]).default("unknown").notNull(),
    imageUrl: varchar("imageUrl", { length: 500 }),
    isApproved: boolean("isApproved").default(true).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [
    index("catalogue_items_brand_idx").on(table.brandId),
    index("catalogue_items_workspace_idx").on(table.workspaceId),
  ],
);
export type CatalogueItem = typeof catalogueItems.$inferSelect;

/** Approved FAQ answers and owner-supplied matching phrases. */
export const brandFaqs = mysqlTable(
  "brand_faqs",
  {
    id: int("id").autoincrement().primaryKey(),
    workspaceId: int("workspaceId").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
    brandId: int("brandId").notNull().references(() => brands.id, { onDelete: "cascade" }),
    question: varchar("question", { length: 500 }).notNull(),
    answer: text("answer").notNull(),
    relatedPhrases: text("relatedPhrases").notNull(),
    isApproved: boolean("isApproved").default(true).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [
    index("brand_faqs_brand_idx").on(table.brandId),
    index("brand_faqs_workspace_idx").on(table.workspaceId),
  ],
);
export type BrandFaq = typeof brandFaqs.$inferSelect;

/** Product-preview channel states only; no live credentials or provider tokens are stored. */
export const channelConnections = mysqlTable(
  "channel_connections",
  {
    id: int("id").autoincrement().primaryKey(),
    workspaceId: int("workspaceId").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
    brandId: int("brandId").notNull().references(() => brands.id, { onDelete: "cascade" }),
    provider: mysqlEnum("provider", ["instagram", "whatsapp"]).notNull(),
    status: mysqlEnum("status", ["disconnected", "simulated_connected"]).default("disconnected").notNull(),
    isSimulation: boolean("isSimulation").default(true).notNull(),
    connectedAt: timestamp("connectedAt"),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [
    uniqueIndex("channel_connections_brand_provider_unique").on(table.brandId, table.provider),
    index("channel_connections_workspace_idx").on(table.workspaceId),
  ],
);
export type ChannelConnection = typeof channelConnections.$inferSelect;

/** Persisted receptionist tests for debugging, with explicit source-record references. */
export const aiRuns = mysqlTable(
  "ai_runs",
  {
    id: int("id").autoincrement().primaryKey(),
    workspaceId: int("workspaceId").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
    brandId: int("brandId").notNull().references(() => brands.id, { onDelete: "cascade" }),
    userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
    customerMessage: text("customerMessage").notNull(),
    decision: mysqlEnum("decision", ["ANSWER", "ASK", "HANDOFF"]).notNull(),
    replyDraft: text("replyDraft").notNull(),
    confidence: int("confidence").notNull(),
    intent: varchar("intent", { length: 160 }).notNull(),
    missingInformation: text("missingInformation").notNull(),
    leadData: text("leadData").notNull(),
    internalReason: text("internalReason").notNull(),
    sourceRecords: text("sourceRecords").notNull(),
    promptVersion: varchar("promptVersion", { length: 80 }).notNull(),
    model: varchar("model", { length: 80 }).notNull(),
    mode: mysqlEnum("mode", ["llm", "safety_rule", "fallback", "built_in"]).default("llm").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [
    index("ai_runs_workspace_created_idx").on(table.workspaceId, table.createdAt),
    index("ai_runs_brand_created_idx").on(table.brandId, table.createdAt),
  ],
);
export type AiRun = typeof aiRuns.$inferSelect;
