import { relations } from "drizzle-orm";
import { brands, users, workspaceMembers, workspaces } from "./schema";

export const usersRelations = relations(users, ({ many }) => ({
  workspaceMemberships: many(workspaceMembers),
  ownedWorkspaces: many(workspaces),
}));

export const workspacesRelations = relations(workspaces, ({ many, one }) => ({
  owner: one(users, {
    fields: [workspaces.ownerUserId],
    references: [users.id],
  }),
  members: many(workspaceMembers),
  brands: many(brands),
}));

export const workspaceMembersRelations = relations(workspaceMembers, ({ one }) => ({
  workspace: one(workspaces, {
    fields: [workspaceMembers.workspaceId],
    references: [workspaces.id],
  }),
  user: one(users, {
    fields: [workspaceMembers.userId],
    references: [users.id],
  }),
}));

export const brandsRelations = relations(brands, ({ one }) => ({
  workspace: one(workspaces, {
    fields: [brands.workspaceId],
    references: [workspaces.id],
  }),
}));
