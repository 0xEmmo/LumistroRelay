import { describe, expect, it } from "vitest";
import { brandSetupInput, catalogueItemInput, faqInput, updateFaqIntentInput } from "./brandSetup";

const setup = {
  name: "Example Brand",
  websiteUrl: "",
  menuUrl: "",
  industry: "Retail",
  description: "",
  locations: "",
  openingHours: "",
  contactDetails: "",
  deliveryAreas: "",
  paymentMethods: "",
  orderInstructions: "",
  policies: "",
  voice: "friendly" as const,
};

const product = {
  name: "Example Item",
  category: "Products",
  description: "",
  price: "",
  variants: "",
  availability: "unknown" as const,
  imageUrl: "",
};

describe("owner URL inputs", () => {
  it("accepts empty optional fields and ordinary HTTP(S) URLs", () => {
    expect(brandSetupInput.safeParse({ ...setup, websiteUrl: "https://example.com" }).success).toBe(true);
    expect(brandSetupInput.safeParse({ ...setup, menuUrl: "https://example.com/menu" }).success).toBe(true);
    expect(catalogueItemInput.safeParse({ ...product, imageUrl: "http://cdn.example.com/item.png" }).success).toBe(true);
    expect(brandSetupInput.safeParse(setup).success).toBe(true);
    expect(catalogueItemInput.safeParse(product).success).toBe(true);
  });

  it.each(["not-a-url", "javascript:alert(1)", "ftp://example.com/file.png", "https://user:pass@example.com"]) (
    "rejects unsafe or malformed URL %s",
    value => {
      expect(brandSetupInput.safeParse({ ...setup, websiteUrl: value }).success).toBe(false);
      expect(brandSetupInput.safeParse({ ...setup, menuUrl: value }).success).toBe(false);
      expect(catalogueItemInput.safeParse({ ...product, imageUrl: value }).success).toBe(false);
    },
  );
});

describe("owner-selected FAQ topics", () => {
  const faq = { question: "When do you close?", answer: "We close at 5pm.", relatedPhrases: "closing time" };

  it("defaults an FAQ without an explicit topic to general and accepts a selected intent", () => {
    expect(faqInput.parse(faq).intent).toBe("faq");
    expect(faqInput.parse({ ...faq, intent: "opening_hours" }).intent).toBe("opening_hours");
    expect(faqInput.parse({ ...faq, intent: "delivery_fee" }).intent).toBe("delivery_fee");
  });

  it("rejects unknown topics and invalid category-change targets", () => {
    expect(faqInput.safeParse({ ...faq, intent: "guess" }).success).toBe(false);
    expect(updateFaqIntentInput.safeParse({ id: 4, intent: "policy" }).success).toBe(true);
    expect(updateFaqIntentInput.safeParse({ id: 4, intent: "guess" }).success).toBe(false);
    expect(updateFaqIntentInput.safeParse({ id: 0, intent: "opening_hours" }).success).toBe(false);
  });
});
