import { and, eq, isNull } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import {
  brands,
  type User,
  workspaceMembers,
  workspaces,
} from "../drizzle/schema";
import { ENV } from "./_core/env";
import { getDb } from "./db";

export const FOODICIAN_WORKSPACE_SLUG = "foodician-demo";
export const FOODICIAN_BRAND_SLUG = "foodician";

export type TenantMembership = Pick<
  typeof workspaceMembers.$inferSelect,
  "userId" | "workspaceId"
>;

/**
 * Resolves a tenant only from an authenticated user's persisted membership.
 * A supplied workspace id is a selector, never proof of authorization.
 */
export function assertTenantMembership(
  authenticatedUserId: number,
  membership: TenantMembership | null | undefined,
  requestedWorkspaceId?: number,
): number {
  if (
    !membership ||
    membership.userId !== authenticatedUserId ||
    (requestedWorkspaceId !== undefined && membership.workspaceId !== requestedWorkspaceId)
  ) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "You do not have access to this workspace.",
    });
  }
  return membership.workspaceId;
}

/** First authenticated user claims once unless a configured owner identity restricts the claim. */
async function ensureFoodicianOwnerMembership(user: User): Promise<void> {
  if (ENV.ownerOpenId && (user.openId !== ENV.ownerOpenId || user.role !== "admin")) return;

  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Workspace storage is unavailable." });

  await db.transaction(async tx => {
    const [workspace] = await tx
      .select({ id: workspaces.id, ownerUserId: workspaces.ownerUserId })
      .from(workspaces)
      .where(eq(workspaces.slug, FOODICIAN_WORKSPACE_SLUG))
      .limit(1)
      .for("update");
    if (!workspace) return;
    if (workspace.ownerUserId !== null && workspace.ownerUserId !== user.id) return;

    if (workspace.ownerUserId === null) {
      await tx
        .update(workspaces)
        .set({ ownerUserId: user.id })
        .where(and(eq(workspaces.id, workspace.id), isNull(workspaces.ownerUserId)));
    }

    const [claimedWorkspace] = await tx
      .select({ ownerUserId: workspaces.ownerUserId })
      .from(workspaces)
      .where(eq(workspaces.id, workspace.id))
      .limit(1);
    if (claimedWorkspace?.ownerUserId !== user.id) return;

    await tx
      .insert(workspaceMembers)
      .values({ workspaceId: workspace.id, userId: user.id, role: "owner" })
      .onDuplicateKeyUpdate({ set: { role: "owner" } });
  });
}

/** Returns only the current user's explicitly assigned workspace and its tenant-scoped brands. */
export async function getCurrentWorkspace(user: User, requestedWorkspaceId?: number) {
  await ensureFoodicianOwnerMembership(user);

  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Workspace storage is unavailable." });

  const memberships = await db
    .select({ userId: workspaceMembers.userId, workspaceId: workspaceMembers.workspaceId })
    .from(workspaceMembers)
    .where(eq(workspaceMembers.userId, user.id))
    .limit(20);
  const membership = memberships.find(row =>
    requestedWorkspaceId === undefined || row.workspaceId === requestedWorkspaceId
  ) ?? memberships[0];
  const workspaceId = assertTenantMembership(user.id, membership, requestedWorkspaceId);

  const [workspace] = await db
    .select({ id: workspaces.id, name: workspaces.name, slug: workspaces.slug })
    .from(workspaces)
    .where(eq(workspaces.id, workspaceId))
    .limit(1);
  if (!workspace) throw new TRPCError({ code: "NOT_FOUND", message: "Workspace not found." });

  const workspaceBrands = await db
    .select({ id: brands.id, name: brands.name, slug: brands.slug, websiteUrl: brands.websiteUrl })
    .from(brands)
    .where(eq(brands.workspaceId, workspaceId));

  return { ...workspace, brands: workspaceBrands };
}

/** Public demo projection intentionally returns brand identity only, never tenant/member data. */
export async function getPublicFoodicianBrand() {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Demo data is temporarily unavailable." });

  const [brand] = await db
    .select({ name: brands.name, slug: brands.slug, websiteUrl: brands.websiteUrl })
    .from(brands)
    .innerJoin(workspaces, eq(brands.workspaceId, workspaces.id))
    .where(and(
      eq(workspaces.slug, FOODICIAN_WORKSPACE_SLUG),
      eq(brands.slug, FOODICIAN_BRAND_SLUG),
      eq(brands.isDemo, true),
    ))
    .limit(1);

  return brand ?? null;
}
