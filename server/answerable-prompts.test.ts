import { describe, expect, it } from "vitest";
import { answerablePrompts } from "../client/src/lib/answerable-prompts";

const messages = (input: Parameters<typeof answerablePrompts>[0]) => answerablePrompts(input).map(item => item.message);

describe("owner-data-derived receptionist suggestions", () => {
  it("always offers a plain greeting and nothing else when there are no saved facts", () => {
    expect(messages({ profile: null, catalogue: [], faqs: [] })).toEqual(["Hello"]);
  });

  it("offers only prompts supported by saved fields and the catalogue", () => {
    const result = messages({
      profile: { menuUrl: "", openingHours: "Mon-Fri: 9am-5pm", deliveryAreas: "Lekki and Ikoyi", paymentMethods: "Card", orderInstructions: "Order on WhatsApp" },
      catalogue: [{ name: "Chicken Pasta", price: "₦8,000", availability: "available" }],
      faqs: [],
    });
    expect(result).toContain("Hello");
    expect(result).toContain("Can I see your menu?");
    expect(result).toContain("What are your opening hours?");
    expect(result).toContain("Which areas do you serve?");
    expect(result).toContain("Which payment methods do you accept?");
    expect(result).toContain("How do I place an order?");
    expect(result).toContain("How much is Chicken Pasta?");
    expect(result).toContain("Is Chicken Pasta available?");
  });

  it("does not offer unsupported availability or unsafe FAQ prompts", () => {
    const result = messages({
      profile: { menuUrl: "", openingHours: "", deliveryAreas: "", paymentMethods: "", orderInstructions: "" },
      catalogue: [{ name: "Blue Dress", price: "", availability: "unknown" }],
      faqs: [
        { question: "What is your refund policy?", relatedPhrases: "refunds" },
        { question: "How do I complain?", relatedPhrases: "complaint" },
      ],
    });
    expect(result).toContain("Hello");
    expect(result).toContain("Can I see your menu?");
    expect(result).not.toContain("Is Blue Dress available?");
    expect(result).not.toContain("What is your refund policy?");
    expect(result).not.toContain("How do I complain?");
  });

  it("uses a safe approved FAQ as a question suggestion when no profile field is set", () => {
    const result = messages({
      profile: { menuUrl: "", openingHours: "", deliveryAreas: "", paymentMethods: "", orderInstructions: "" },
      catalogue: [],
      faqs: [{ question: "Where is your shop?", relatedPhrases: "address, location" }],
    });
    expect(result).toContain("Where is your shop?");
  });
});
