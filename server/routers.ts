import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { addCatalogueItem, addFaq, brandSetupInput, catalogueItemInput, faqInput, getOwnerSetup, removeCatalogueItem, removeFaq, saveBrandSetup } from "./brandSetup";
import { channelProvider, setSimulatedChannel } from "./channels";
import { testReceptionist } from "./receptionist";
import { getCurrentWorkspace } from "./workspaces";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  workspace: router({
    current: protectedProcedure.query(({ ctx }) => getCurrentWorkspace(ctx.user)),
    setup: protectedProcedure.query(({ ctx }) => getOwnerSetup(ctx.user)),
    saveBrandSetup: protectedProcedure
      .input(brandSetupInput)
      .mutation(({ ctx, input }) => saveBrandSetup(ctx.user, input)),
    addCatalogueItem: protectedProcedure
      .input(catalogueItemInput)
      .mutation(({ ctx, input }) => addCatalogueItem(ctx.user, input)),
    removeCatalogueItem: protectedProcedure
      .input(z.object({ id: z.number().int().positive() }))
      .mutation(({ ctx, input }) => removeCatalogueItem(ctx.user, input.id)),
    addFaq: protectedProcedure
      .input(faqInput)
      .mutation(({ ctx, input }) => addFaq(ctx.user, input)),
    removeFaq: protectedProcedure
      .input(z.object({ id: z.number().int().positive() }))
      .mutation(({ ctx, input }) => removeFaq(ctx.user, input.id)),
    setSimulatedChannel: protectedProcedure
      .input(z.object({ provider: channelProvider, connected: z.boolean() }))
      .mutation(({ ctx, input }) => setSimulatedChannel(ctx.user, input.provider, input.connected)),
    testReceptionist: protectedProcedure
      .input(z.object({ message: z.string().trim().min(1).max(3000) }))
      .mutation(({ ctx, input }) => testReceptionist(ctx.user, input.message)),
  }),
});

export type AppRouter = typeof appRouter;
