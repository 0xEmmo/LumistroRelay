import { and, desc, eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  aiRuns,
  brandFaqs,
  brandProfiles,
  brands,
  catalogueItems,
  channelConnections,
  workspaces,
} from "../drizzle/schema";
import type { User } from "../drizzle/schema";
import { getDb } from "./db";
import { getCurrentWorkspace } from "./workspaces";
import { faqIntentValues } from "../shared/receptionist-intents";

export const brandSetupInput = z.object({
  name: z.string().trim().min(2).max(160),
  websiteUrl: z.string().trim().max(255).refine(value => isOptionalHttpUrl(value), "Enter a valid HTTP or HTTPS website URL."),
  menuUrl: z.string().trim().max(500).refine(value => isOptionalHttpUrl(value), "Enter a valid HTTP or HTTPS menu URL."),
  industry: z.string().trim().min(2).max(100),
  description: z.string().trim().max(4000),
  locations: z.string().trim().max(3000),
  openingHours: z.string().trim().max(3000),
  contactDetails: z.string().trim().max(3000),
  deliveryAreas: z.string().trim().max(3000),
  paymentMethods: z.string().trim().max(2000),
  orderInstructions: z.string().trim().max(3000),
  policies: z.string().trim().max(4000),
  voice: z.enum(["friendly", "professional", "premium", "casual", "playful", "short_direct"]),
});
export type BrandSetupInput = z.infer<typeof brandSetupInput>;

export const catalogueItemInput = z.object({
  name: z.string().trim().min(1).max(160),
  category: z.string().trim().min(1).max(100),
  description: z.string().trim().max(2500),
  price: z.string().trim().max(100),
  variants: z.string().trim().max(1000),
  availability: z.enum(["available", "unavailable", "unknown"]),
  imageUrl: z.string().trim().max(500).refine(value => isOptionalHttpUrl(value), "Enter a valid HTTP or HTTPS image URL."),
});
export type CatalogueItemInput = z.infer<typeof catalogueItemInput>;

function isOptionalHttpUrl(value: string) {
  if (!value) return true;
  try {
    const url = new URL(value);
    return (url.protocol === "http:" || url.protocol === "https:") && Boolean(url.hostname) && !url.username && !url.password;
  } catch {
    return false;
  }
}

export const faqInput = z.object({
  question: z.string().trim().min(3).max(500),
  answer: z.string().trim().min(2).max(4000),
  relatedPhrases: z.string().trim().max(1000),
  intent: z.enum(faqIntentValues).default("faq"),
});
export type FaqInput = z.infer<typeof faqInput>;
export const updateFaqIntentInput = z.object({ id: z.number().int().positive(), intent: z.enum(faqIntentValues) });
export type UpdateFaqIntentInput = z.infer<typeof updateFaqIntentInput>;

const slugify = (name: string) =>
  name.normalize("NFKD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 64) || "brand";

const requiredBrand = async (user: User) => {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Workspace storage is unavailable." });
  const workspace = await getCurrentWorkspace(user);
  const brand = workspace.brands[0];
  if (!brand) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Set up your brand before using this feature." });
  return { db, workspace, brand };
};

export async function getOwnerSetup(user: User) {
  const workspace = await getCurrentWorkspace(user);
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Workspace storage is unavailable." });
  const brand = workspace.brands[0] ?? null;
  if (!brand) return { workspace, brand: null, profile: null, catalogue: [], faqs: [], channels: [], aiRuns: [] };

  const [profileRows, catalogue, faqs, channels, runs] = await Promise.all([
    db.select().from(brandProfiles)
      .where(and(eq(brandProfiles.workspaceId, workspace.id), eq(brandProfiles.brandId, brand.id), eq(brandProfiles.isApproved, true)))
      .limit(1),
    db.select().from(catalogueItems)
      .where(and(eq(catalogueItems.workspaceId, workspace.id), eq(catalogueItems.brandId, brand.id)))
      .orderBy(desc(catalogueItems.createdAt)).limit(100),
    db.select().from(brandFaqs)
      .where(and(eq(brandFaqs.workspaceId, workspace.id), eq(brandFaqs.brandId, brand.id)))
      .orderBy(desc(brandFaqs.createdAt)).limit(100),
    db.select().from(channelConnections)
      .where(and(eq(channelConnections.workspaceId, workspace.id), eq(channelConnections.brandId, brand.id))),
    db.select().from(aiRuns)
      .where(and(eq(aiRuns.workspaceId, workspace.id), eq(aiRuns.brandId, brand.id)))
      .orderBy(desc(aiRuns.createdAt)).limit(10),
  ]);

  return { workspace, brand, profile: profileRows[0] ?? null, catalogue, faqs, channels, aiRuns: runs };
}

export async function saveBrandSetup(user: User, input: BrandSetupInput) {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Workspace storage is unavailable." });
  const workspace = await getCurrentWorkspace(user);
  const brandSlug = slugify(input.name);
  let savedBrandId = 0;

  await db.transaction(async tx => {
    const [lockedWorkspace] = await tx.select({ id: workspaces.id })
      .from(workspaces)
      .where(eq(workspaces.id, workspace.id))
      .limit(1)
      .for("update");
    if (!lockedWorkspace) throw new TRPCError({ code: "NOT_FOUND", message: "Workspace not found." });

    const [existing] = await tx.select({ id: brands.id }).from(brands).where(eq(brands.workspaceId, workspace.id)).limit(1);
    if (existing) {
      savedBrandId = existing.id;
      await tx.update(brands).set({ slug: brandSlug, name: input.name, websiteUrl: input.websiteUrl || null })
        .where(and(eq(brands.id, existing.id), eq(brands.workspaceId, workspace.id)));
    } else {
      await tx.insert(brands).values({
        workspaceId: workspace.id,
        slug: brandSlug,
        name: input.name,
        websiteUrl: input.websiteUrl || null,
        isDemo: false,
      });
      const [created] = await tx.select({ id: brands.id }).from(brands).where(eq(brands.workspaceId, workspace.id)).limit(1);
      if (!created) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Brand could not be saved." });
      savedBrandId = created.id;
    }

    const profileValues = {
      workspaceId: workspace.id,
      brandId: savedBrandId,
      industry: input.industry,
      description: input.description,
      menuUrl: input.menuUrl || null,
      locations: input.locations,
      openingHours: input.openingHours,
      contactDetails: input.contactDetails,
      deliveryAreas: input.deliveryAreas,
      paymentMethods: input.paymentMethods,
      orderInstructions: input.orderInstructions,
      policies: input.policies,
      voice: input.voice,
      isApproved: true,
    };
    await tx.insert(brandProfiles).values(profileValues).onDuplicateKeyUpdate({
      set: {
        industry: input.industry,
        description: input.description,
        menuUrl: input.menuUrl || null,
        locations: input.locations,
        openingHours: input.openingHours,
        contactDetails: input.contactDetails,
        deliveryAreas: input.deliveryAreas,
        paymentMethods: input.paymentMethods,
        orderInstructions: input.orderInstructions,
        policies: input.policies,
        voice: input.voice,
        isApproved: true,
      },
    });
    await tx.update(workspaces).set({ name: input.name }).where(eq(workspaces.id, workspace.id));
  });

  return { success: true, brandId: savedBrandId };
}

export async function addCatalogueItem(user: User, input: CatalogueItemInput) {
  const { db, workspace, brand } = await requiredBrand(user);
  await db.insert(catalogueItems).values({
    workspaceId: workspace.id,
    brandId: brand.id,
    name: input.name,
    category: input.category,
    description: input.description,
    price: input.price || null,
    variants: input.variants,
    availability: input.availability,
    imageUrl: input.imageUrl || null,
    isApproved: true,
  });
  return { success: true };
}

export async function removeCatalogueItem(user: User, id: number) {
  const { db, workspace, brand } = await requiredBrand(user);
  await db.delete(catalogueItems).where(and(
    eq(catalogueItems.id, id),
    eq(catalogueItems.workspaceId, workspace.id),
    eq(catalogueItems.brandId, brand.id),
  ));
  return { success: true };
}

export async function addFaq(user: User, input: FaqInput) {
  const { db, workspace, brand } = await requiredBrand(user);
  await db.insert(brandFaqs).values({
    workspaceId: workspace.id,
    brandId: brand.id,
    question: input.question,
    answer: input.answer,
    relatedPhrases: input.relatedPhrases,
    intent: input.intent,
    isApproved: true,
  });
  return { success: true };
}

export async function updateFaqIntent(user: User, input: UpdateFaqIntentInput) {
  const { db, workspace, brand } = await requiredBrand(user);
  await db.update(brandFaqs).set({ intent: input.intent }).where(and(
    eq(brandFaqs.id, input.id),
    eq(brandFaqs.workspaceId, workspace.id),
    eq(brandFaqs.brandId, brand.id),
  ));
  return { success: true };
}

export async function removeFaq(user: User, id: number) {
  const { db, workspace, brand } = await requiredBrand(user);
  await db.delete(brandFaqs).where(and(
    eq(brandFaqs.id, id),
    eq(brandFaqs.workspaceId, workspace.id),
    eq(brandFaqs.brandId, brand.id),
  ));
  return { success: true };
}
