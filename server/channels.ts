import { and, eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { channelConnections } from "../drizzle/schema";
import type { User } from "../drizzle/schema";
import { getDb } from "./db";
import { getCurrentWorkspace } from "./workspaces";

export const channelProvider = z.enum(["instagram", "whatsapp"]);
export type ChannelProvider = z.infer<typeof channelProvider>;

export async function setSimulatedChannel(user: User, provider: ChannelProvider, connected: boolean) {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Workspace storage is unavailable." });
  const workspace = await getCurrentWorkspace(user);
  const brand = workspace.brands[0];
  if (!brand) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Set up your brand before connecting channels." });

  const now = new Date();
  const status = connected ? "simulated_connected" : "disconnected";
  await db.insert(channelConnections).values({
    workspaceId: workspace.id,
    brandId: brand.id,
    provider,
    status,
    isSimulation: true,
    connectedAt: connected ? now : null,
  }).onDuplicateKeyUpdate({
    set: { status, isSimulation: true, connectedAt: connected ? now : null, updatedAt: now },
  });

  const [saved] = await db.select({ provider: channelConnections.provider, status: channelConnections.status, isSimulation: channelConnections.isSimulation })
    .from(channelConnections)
    .where(and(
      eq(channelConnections.workspaceId, workspace.id),
      eq(channelConnections.brandId, brand.id),
      eq(channelConnections.provider, provider),
    ))
    .limit(1);
  return saved;
}
