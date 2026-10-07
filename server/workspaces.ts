import { and, eq, isNull } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { brands, type User, workspaceMembers, workspaces } from "../drizzle/schema";
import { getDb } from "./db";

export type TenantMembership = Pick<typeof workspaceMembers.$inferSelect, "userId" | "workspaceId">;

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
    throw new TRPCError({ code: "FORBIDDEN", message: "You do not have access to this workspace." });
  }
  return membership.workspaceId;
}

/** Provision one isolated workspace per authenticated owner; never claim the shared demo tenant. */
async function ensureOwnerWorkspace(user: User): Promise<number> {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Workspace storage is unavailable." });

  const slug = `owner-${user.id}`;
  await db.transaction(async tx => {
    await tx.insert(workspaces).values({
      slug,
      name: "Your workspace",
      ownerUserId: user.id,
    }).onDuplicateKeyUpdate({ set: { slug } });

    const [workspace] = await tx
      .select({ id: workspaces.id, ownerUserId: workspaces.ownerUserId })
      .from(workspaces)
      .where(eq(workspaces.slug, slug))
      .limit(1)
      .for("update");
    if (!workspace) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Workspace could not be created." });

    if (workspace.ownerUserId !== null && workspace.ownerUserId !== user.id) {
      throw new TRPCError({ code: "FORBIDDEN", message: "This workspace belongs to another owner." });
    }
    if (workspace.ownerUserId === null) {
      await tx.update(workspaces)
        .set({ ownerUserId: user.id })
        .where(and(eq(workspaces.id, workspace.id), isNull(workspaces.ownerUserId)));
    }

    await tx.insert(workspaceMembers)
      .values({ workspaceId: workspace.id, userId: user.id, role: "owner" })
      .onDuplicateKeyUpdate({ set: { role: "owner" } });
  });

  const [workspace] = await db
    .select({ id: workspaces.id })
    .from(workspaces)
    .where(eq(workspaces.slug, slug))
    .limit(1);
  if (!workspace) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Workspace could not be resolved." });
  return workspace.id;
}

/** Resolve only the authenticated owner's own tenant and the brand inside that tenant. */
export async function getCurrentWorkspace(user: User) {
  const workspaceId = await ensureOwnerWorkspace(user);
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Workspace storage is unavailable." });

  const [membership] = await db
    .select({ userId: workspaceMembers.userId, workspaceId: workspaceMembers.workspaceId })
    .from(workspaceMembers)
    .where(and(eq(workspaceMembers.userId, user.id), eq(workspaceMembers.workspaceId, workspaceId)))
    .limit(1);
  assertTenantMembership(user.id, membership, workspaceId);

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
