import { describe, expect, it } from "vitest";
import { TRPCError } from "@trpc/server";
import { assertTenantMembership } from "./workspaces";

describe("workspace tenant isolation", () => {
  it("returns the tenant id only for the authenticated user's membership", () => {
    expect(assertTenantMembership(7, { userId: 7, workspaceId: 42 }, 42)).toBe(42);
  });

  it("rejects a workspace id that is not in the user's membership", () => {
    expect(() => assertTenantMembership(7, { userId: 7, workspaceId: 42 }, 84)).toThrow(TRPCError);
  });

  it("rejects membership belonging to another user", () => {
    expect(() => assertTenantMembership(7, { userId: 8, workspaceId: 42 }, 42)).toThrow(TRPCError);
  });

  it("rejects users without a workspace membership", () => {
    expect(() => assertTenantMembership(7, null)).toThrow(TRPCError);
  });
});
