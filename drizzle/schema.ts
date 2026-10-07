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

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
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

/** One business workspace is the tenant boundary for all brand-owned records. */
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
    workspaceId: int("workspaceId")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    userId: int("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: mysqlEnum("role", ["owner", "member"]).default("owner").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [
    uniqueIndex("workspace_members_workspace_user_unique").on(table.workspaceId, table.userId),
    index("workspace_members_user_idx").on(table.userId),
  ],
);
export type WorkspaceMember = typeof workspaceMembers.$inferSelect;

/** Brand identity is tenant-owned; profile facts are added in Batch 2. */
export const brands = mysqlTable(
  "brands",
  {
    id: int("id").autoincrement().primaryKey(),
    workspaceId: int("workspaceId")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    slug: varchar("slug", { length: 64 }).notNull(),
    name: varchar("name", { length: 160 }).notNull(),
    websiteUrl: varchar("websiteUrl", { length: 255 }),
    isDemo: boolean("isDemo").default(false).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [
    uniqueIndex("brands_workspace_slug_unique").on(table.workspaceId, table.slug),
    index("brands_workspace_idx").on(table.workspaceId),
  ],
);
export type Brand = typeof brands.$inferSelect;
