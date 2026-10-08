import { describe, expect, it } from "vitest";
import { attachmentsForSources, isGreetingOnly, isMenuRequest, requiredFactHandoffReason, requiredHandoffReason, renderGroundedReply, safeAskDraft, sourceSupportsQuestion, type GroundingSource } from "./receptionist";

const emptyDetails = {
  openingHours: "", deliveryAreas: "", paymentMethods: "", orderInstructions: "",
  locations: "", contactDetails: "", policies: "",
};

describe("receptionist mandatory handoffs", () => {
  it.each([
    "I want a refund for my order",
    "Can I get a discount?",
    "My child has a peanut allergy—is this safe?",
    "Is this safe to eat?",
    "Can you cater for 150 people at my wedding?",
    "Please let me speak with a human",
    "I need a human",
    "I need a person",
    "Human please",
    "Can I get human support?",
    "I need legal advice about this contract",
    "I have a problem with my order",
    "I'm not happy with my order",
    "This was a terrible experience",
    "The order is incorrect",
  ])("requires human review for: %s", message => {
    expect(requiredHandoffReason(message)).toBeTruthy();
  });
});

describe("receptionist fact-boundary handoffs", () => {
  it.each(["What are your hours?", "Are you open tomorrow?"]) ("hands off for missing hours: %s", message => {
    expect(requiredFactHandoffReason(message, emptyDetails, [])).toMatch(/opening hours/i);
  });

  it("hands off for ambiguous time questions and missing shipping/service-area facts", () => {
    expect(requiredFactHandoffReason("What time?", emptyDetails, [])).toMatch(/ambiguous/i);
    expect(requiredFactHandoffReason("Do you deliver?", emptyDetails, [])).toMatch(/delivery or service-area/i);
    expect(requiredFactHandoffReason("Do you ship?", emptyDetails, [])).toMatch(/delivery or service-area/i);
    expect(requiredFactHandoffReason("Which areas do you serve?", emptyDetails, [])).toMatch(/delivery or service-area/i);
  });

  it("hands off when delivery, order, location, or contact facts are missing", () => {
    expect(requiredFactHandoffReason("Can I order?", emptyDetails, [])).toMatch(/ordering or booking/i);
    expect(requiredFactHandoffReason("Where are you located?", emptyDetails, [])).toMatch(/location/i);
    expect(requiredFactHandoffReason("How can I contact you?", emptyDetails, [])).toMatch(/contact details/i);
  });

  it("hands off for unapproved fees/prices, stock, variants, and unconfirmed table availability", () => {
    expect(requiredFactHandoffReason("How much is Chicken Pasta?", emptyDetails, [
      { name: "Chicken Pasta", price: null, availability: "unknown" },
    ])).toMatch(/approved price/i);
    expect(requiredFactHandoffReason("What is the delivery fee?", emptyDetails, [])).toMatch(/approved price/i);
    expect(requiredFactHandoffReason("Is the Blue Dress available?", emptyDetails, [
      { name: "Blue Dress", price: null, availability: "unknown" },
    ])).toMatch(/availability is not confirmed/i);
    expect(requiredFactHandoffReason("Is the Blue Dress available in size medium?", emptyDetails, [
      { name: "Blue Dress", price: null, availability: "available" },
    ])).toMatch(/variant-specific/i);
    expect(requiredFactHandoffReason("Can you hold a table at 7pm?", emptyDetails, [])).toMatch(/not live/i);
  });

  it("matches mentioned products at word boundaries in price and availability checks", () => {
    const products = [
      { name: "Chicken Pasta", price: "₦8,000", availability: "available" as const },
      { name: "Chick", price: null, availability: "unknown" as const },
    ];
    expect(requiredFactHandoffReason("How much is Chicken Pasta?", emptyDetails, products)).toBeNull();
    expect(requiredFactHandoffReason("How much is Chick?", emptyDetails, products)).toMatch(/approved price/i);
  });

  it("permits an exact approved FAQ to answer a missing profile field", () => {
    const hoursFaq: GroundingSource = {
      ref: "faq:3", kind: "faq", id: 3, label: "Hours", text: "We open weekdays at 9am and close at 5pm.",
      value: { question: "What are your opening hours?", relatedPhrases: "when do you open, business hours" },
    };
    expect(requiredFactHandoffReason("What are your opening hours?", emptyDetails, [], [hoursFaq])).toBeNull();
  });

  it("hands off for unsupported delivery estimates and payment details", () => {
    expect(requiredFactHandoffReason("How long does delivery take?", emptyDetails, [])).toMatch(/delivery-time/i);
    expect(requiredFactHandoffReason("Do you take card?", emptyDetails, [])).toMatch(/payment-method/i);
  });
});

describe("greeting, menu, and owner-approved media", () => {
  it("recognizes a plain greeting but not a greeting combined with an unsupported request", () => {
    expect(isGreetingOnly("Hello")).toBe(true);
    expect(isGreetingOnly("Hi there!")).toBe(true);
    expect(isGreetingOnly("Hello, can I see your menu?")).toBe(false);
  });

  it("recognizes menu requests without treating arbitrary messages as a menu query", () => {
    expect(isMenuRequest("Can I see your menu?" )).toBe(true);
    expect(isMenuRequest("What products do you offer?" )).toBe(true);
    expect(isMenuRequest("What time do you open?" )).toBe(false);
  });

  it("answers plain greetings with the saved brand name without invoking a factual answer", async () => {
    const { builtInGreeting } = await import("./receptionist");
    const result = builtInGreeting("Lumistro Bakehouse", "friendly", "profile:8:businessName");
    expect(result).toMatchObject({ decision: "ANSWER", mode: "built_in", replyDraft: expect.stringContaining("Lumistro Bakehouse"), sourceRefs: ["profile:8:businessName"], attachments: [] });
  });

  it("answers menu requests with an owner-saved link or catalogue items and handoffs without them", async () => {
    const { builtInMenuReply } = await import("./receptionist");
    const product: GroundingSource = { ref: "product:9", kind: "product", id: 9, label: "Chicken Pasta", text: "{}", value: { name: "Chicken Pasta", category: "Main", description: "", price: "₦8,000", variants: "", availability: "available", imageUrl: "https://cdn.example.com/pasta.jpg" } };
    const itemResult = builtInMenuReply("Lumistro Bakehouse", { id: 8, menuUrl: null }, [{ id: 9, name: "Chicken Pasta", price: "₦8,000" }], [product]);
    expect(itemResult.decision).toBe("ANSWER");
    expect(itemResult.replyDraft).toContain("Chicken Pasta — ₦8,000");
    expect(itemResult.attachments).toContainEqual({ kind: "image", url: "https://cdn.example.com/pasta.jpg", label: "Chicken Pasta" });

    const menuSource: GroundingSource = { ref: "profile:8:menuUrl", kind: "profile", id: 8, field: "menuUrl", label: "Menu link", text: "https://example.com/menu" };
    const linkResult = builtInMenuReply("Lumistro Bakehouse", { id: 8, menuUrl: "https://example.com/menu" }, [], [menuSource]);
    expect(linkResult.attachments).toContainEqual({ kind: "link", url: "https://example.com/menu", label: "Open menu" });

    const emptyResult = builtInMenuReply("Lumistro Bakehouse", { id: 8, menuUrl: null }, [], []);
    expect(emptyResult.decision).toBe("HANDOFF");
    expect(emptyResult.attachments).toEqual([]);
  });

  it("attaches only credential-free HTTP(S) owner URLs and saved product image URLs", () => {
    const menu: GroundingSource = { ref: "profile:2:menuUrl", kind: "profile", id: 2, field: "menuUrl", label: "Menu link", text: "https://example.com/menu" };
    const product: GroundingSource = {
      ref: "product:2", kind: "product", id: 2, label: "Pasta", text: "{}",
      value: { name: "Pasta", category: "Main", description: "", price: "₦8,000", variants: "", availability: "available", imageUrl: "https://cdn.example.com/pasta.jpg" },
    };
    const unsafe: GroundingSource = { ref: "profile:2:websiteUrl", kind: "profile", id: 2, field: "websiteUrl", label: "Website", text: "javascript:alert(1)" };
    expect(attachmentsForSources([menu, product, unsafe])).toEqual([
      { kind: "link", url: "https://example.com/menu", label: "Open menu" },
      { kind: "image", url: "https://cdn.example.com/pasta.jpg", label: "Pasta" },
    ]);
  });
});

describe("grounded answer construction and source relevance", () => {
  const faq: GroundingSource = {
    ref: "faq:8", kind: "faq", id: 8, label: "When are you open?",
    text: "We are open Monday to Friday, 9am to 5pm.",
    value: { question: "When are you open?", relatedPhrases: "business hours, opening times" },
  };
  const description: GroundingSource = {
    ref: "profile:8:description", kind: "profile", id: 8, field: "description", label: "Business description",
    text: "We make fresh pastries for local customers.",
  };
  const businessName: GroundingSource = {
    ref: "profile:8:businessName", kind: "profile", id: 8, field: "businessName", label: "Business name",
    text: "Lumistro Bakehouse",
  };
  const industry: GroundingSource = {
    ref: "profile:8:industry", kind: "profile", id: 8, field: "industry", label: "Business type",
    text: "Bakery",
  };
  const locations: GroundingSource = {
    ref: "profile:8:locations", kind: "profile", id: 8, field: "locations", label: "Locations",
    text: "12 Adeola Street, Lagos.",
  };
  const hoursCandle: GroundingSource = {
    ref: "product:8", kind: "product", id: 8, label: "Hours Candle", text: "{}",
    value: { name: "Hours Candle", category: "Gift", description: "", price: "", variants: "", availability: "unknown" },
  };
  const chickenPasta: GroundingSource = {
    ref: "product:9", kind: "product", id: 9, label: "Chicken Pasta", text: "{}",
    value: { name: "Chicken Pasta", category: "Main", description: "", price: "₦8,000", variants: "", availability: "available" },
  };
  const shortChickName: GroundingSource = {
    ref: "product:10", kind: "product", id: 10, label: "Chick", text: "{}",
    value: { name: "Chick", category: "Main", description: "", price: "", variants: "", availability: "unknown" },
  };
  const offerName: GroundingSource = {
    ref: "product:11", kind: "product", id: 11, label: "Offer", text: "{}",
    value: { name: "Offer", category: "Gift", description: "", price: "", variants: "", availability: "unknown" },
  };

  it("renders the exact owner-approved FAQ answer and never accepts model-authored answer prose", () => {
    expect(sourceSupportsQuestion(faq, "What are your hours?")).toBe(true);
    expect(renderGroundedReply([faq], "friendly")).toBe("We are open Monday to Friday, 9am to 5pm.");
  });

  it("rejects unrelated profile fields and generic catalogue questions", () => {
    const addressQuestion = "What is your business address?";
    expect(sourceSupportsQuestion(description, addressQuestion)).toBe(false);
    expect(sourceSupportsQuestion(businessName, addressQuestion)).toBe(false);
    expect(sourceSupportsQuestion(industry, addressQuestion)).toBe(false);
    expect(sourceSupportsQuestion(locations, addressQuestion)).toBe(true);
    expect(sourceSupportsQuestion(hoursCandle, "What products do you offer?")).toBe(false);
    expect(sourceSupportsQuestion(offerName, "What products do you offer?")).toBe(false);
    expect(sourceSupportsQuestion(offerName, "Which product do you offer?")).toBe(false);
    expect(sourceSupportsQuestion(hoursCandle, "What are your business hours?")).toBe(false);
    expect(sourceSupportsQuestion(chickenPasta, "How much is Chicken Pasta?")).toBe(true);
    expect(sourceSupportsQuestion(shortChickName, "How much is Chicken Pasta?")).toBe(false);
  });

  it("keeps same-numbered source records unambiguous by kind and profile field", () => {
    const hours: GroundingSource = { ref: "profile:8:openingHours", kind: "profile", id: 8, field: "openingHours", label: "Opening hours", text: "Monday to Friday, 9am to 5pm" };
    expect(hours.ref).not.toBe(hoursCandle.ref);
    expect(sourceSupportsQuestion(hours, "What are your hours?")).toBe(true);
  });

  it("uses exact fixed aliases for one safe missing detail only", () => {
    expect(safeAskDraft(["location/delivery area"])?.replyDraft).toBe("What area should we check for you?");
    expect(safeAskDraft(["location"])?.missingInformation).toEqual(["location/delivery area"]);
    expect(safeAskDraft(["phone number"])).toBeNull();
    expect(safeAskDraft(["location phone"])).toBeNull();
    expect(safeAskDraft(["date contact"])).toBeNull();
    expect(safeAskDraft(["date and guest count"])).toBeNull();
    expect(safeAskDraft(["date", "guest count"])).toBeNull();
  });
});
