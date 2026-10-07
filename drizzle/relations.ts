import { relations } from "drizzle-orm";
import {
  aiRuns,
  brandFaqs,
  brandProfiles,
  brands,
  catalogueItems,
  channelConnections,
  users,
  workspaceMembers,
  workspaces,
} from "./schema";

export const usersRelations = relations(users, ({ many }) => ({
  workspaceMemberships: many(workspaceMembers),
  ownedWorkspaces: many(workspaces),
  aiRuns: many(aiRuns),
}));

export const workspacesRelations = relations(workspaces, ({ many, one }) => ({
  owner: one(users, { fields: [workspaces.ownerUserId], references: [users.id] }),
  members: many(workspaceMembers),
  brands: many(brands),
  profiles: many(brandProfiles),
  catalogueItems: many(catalogueItems),
  faqs: many(brandFaqs),
  channels: many(channelConnections),
  aiRuns: many(aiRuns),
}));

export const workspaceMembersRelations = relations(workspaceMembers, ({ one }) => ({
  workspace: one(workspaces, { fields: [workspaceMembers.workspaceId], references: [workspaces.id] }),
  user: one(users, { fields: [workspaceMembers.userId], references: [users.id] }),
}));

export const brandsRelations = relations(brands, ({ one, many }) => ({
  workspace: one(workspaces, { fields: [brands.workspaceId], references: [workspaces.id] }),
  profile: one(brandProfiles, { fields: [brands.id], references: [brandProfiles.brandId] }),
  catalogueItems: many(catalogueItems),
  faqs: many(brandFaqs),
  channels: many(channelConnections),
  aiRuns: many(aiRuns),
}));

export const brandProfilesRelations = relations(brandProfiles, ({ one }) => ({
  workspace: one(workspaces, { fields: [brandProfiles.workspaceId], references: [workspaces.id] }),
  brand: one(brands, { fields: [brandProfiles.brandId], references: [brands.id] }),
}));

export const catalogueItemsRelations = relations(catalogueItems, ({ one }) => ({
  workspace: one(workspaces, { fields: [catalogueItems.workspaceId], references: [workspaces.id] }),
  brand: one(brands, { fields: [catalogueItems.brandId], references: [brands.id] }),
}));

export const brandFaqsRelations = relations(brandFaqs, ({ one }) => ({
  workspace: one(workspaces, { fields: [brandFaqs.workspaceId], references: [workspaces.id] }),
  brand: one(brands, { fields: [brandFaqs.brandId], references: [brands.id] }),
}));

export const channelConnectionsRelations = relations(channelConnections, ({ one }) => ({
  workspace: one(workspaces, { fields: [channelConnections.workspaceId], references: [workspaces.id] }),
  brand: one(brands, { fields: [channelConnections.brandId], references: [brands.id] }),
}));

export const aiRunsRelations = relations(aiRuns, ({ one }) => ({
  workspace: one(workspaces, { fields: [aiRuns.workspaceId], references: [workspaces.id] }),
  brand: one(brands, { fields: [aiRuns.brandId], references: [brands.id] }),
  user: one(users, { fields: [aiRuns.userId], references: [users.id] }),
}));
