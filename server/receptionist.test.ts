import { describe, expect, it } from "vitest";
import {
  attachmentsForSources,
  builtInGreeting,
  builtInMenuReply,
  buildReceptionistSystemPrompt,
  isGreetingOnly,
  isMenuRequest,
  requiredFactHandoffReason,
  requiredHandoffReason,
  renderGroundedReply,
  safeAskDraft,
  selectSourcesForIntent,
  sourceSupportsIntent,
  type GroundingSource,
} from "./receptionist";

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
  it.each(["What are your hours?", "Are you open tomorrow?", "What time do you close?"]) (
    "hands off when hours are absent: %s",
    message => expect(requiredFactHandoffReason(message, emptyDetails, [])).toMatch(/opening hours/i),
  );

  it("lets paraphrased hours questions reach semantic source selection", () => {
    const savedHours = { ...emptyDetails, openingHours: "Monday to Friday, 9am to 5pm" };
    const hoursFaq: GroundingSource = {
      ref: "faq:3", kind: "faq", id: 3, label: "Opening hours",
      text: "We open weekdays at 9am and close at 5pm.",
      value: { question: "What are your opening hours?", relatedPhrases: "business hours, opening times", intent: "opening_hours" },
    };

    expect(requiredFactHandoffReason("What time do you close?", savedHours, [])).toBeNull();
    // The FAQ wording does not contain “close”; it must still be considered by the semantic matcher.
    expect(requiredFactHandoffReason("What time do you close?", emptyDetails, [], [hoursFaq])).toBeNull();
    expect(sourceSupportsIntent(hoursFaq, "opening_hours")).toBe(true);
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
    expect(requiredFactHandoffReason("What is the delivery fee?", emptyDetails, [])).toMatch(/approved delivery or service fee/i);
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
      { id: 9, name: "Chicken Pasta", price: "₦8,000", availability: "available" as const },
      { id: 10, name: "Chick", price: null, availability: "unknown" as const },
    ];
    const chickenPasta: GroundingSource = {
      ref: "product:9", kind: "product", id: 9, label: "Chicken Pasta", text: "{}",
      value: { name: "Chicken Pasta", category: "Main", description: "", price: "₦8,000", variants: "", availability: "available" },
    };
    const chick: GroundingSource = {
      ref: "product:10", kind: "product", id: 10, label: "Chick", text: "{}",
      value: { name: "Chick", category: "Main", description: "", price: "", variants: "", availability: "unknown" },
    };
    expect(requiredFactHandoffReason("How much is Chicken Pasta?", emptyDetails, products)).toBeNull();
    expect(requiredFactHandoffReason("How much is Chicken Pasta?", emptyDetails, products, [], { intent: "price", sources: [chickenPasta] })).toBeNull();
    expect(requiredFactHandoffReason("How much is Chick?", emptyDetails, products, [], { intent: "price", sources: [chick] })).toMatch(/approved price/i);
    expect(requiredFactHandoffReason("How much is Chicken Pasta?", emptyDetails, products, [], { intent: "price", sources: [chick] })).toMatch(/approved price/i);
    expect(requiredFactHandoffReason("Is Chicken Pasta available?", emptyDetails, products, [], { intent: "availability", sources: [chickenPasta] })).toBeNull();
    expect(requiredFactHandoffReason("Is Chicken Pasta available?", emptyDetails, products, [], { intent: "availability", sources: [chick] })).toMatch(/availability is not confirmed/i);
    expect(requiredFactHandoffReason("Tell me about Chicken Pasta", emptyDetails, products, [], { intent: "product_details", sources: [chickenPasta] })).toBeNull();
    expect(requiredFactHandoffReason("Tell me about Chicken Pasta", emptyDetails, products, [], { intent: "product_details", sources: [chick] })).toMatch(/not uniquely identified/i);
  });

  it("requires a delivery-fee FAQ rather than reusing an unrelated product price", () => {
    const pricedPasta = { id: 9, name: "Chicken Pasta", price: "₦8,000", availability: "available" as const };
    const feeFaq: GroundingSource = {
      ref: "faq:22", kind: "faq", id: 22, label: "Delivery fee",
      text: "Delivery to Lekki costs ₦1,500.",
      value: { question: "What is the delivery fee?", relatedPhrases: "shipping cost, courier charge", intent: "delivery_fee" },
    };
    const productPriceFaq: GroundingSource = {
      ref: "faq:23", kind: "faq", id: 23, label: "Pasta price",
      text: "Chicken Pasta costs ₦8,000.",
      value: { question: "How much is Chicken Pasta?", relatedPhrases: "Chicken Pasta price", intent: "price" },
    };
    const genericPriceFaq: GroundingSource = {
      ref: "faq:25", kind: "faq", id: 25, label: "General pricing",
      text: "Our current prices are listed in the approved catalogue.",
      value: { question: "What are your prices?", relatedPhrases: "price list, pricing information", intent: "price" },
    };

    expect(requiredFactHandoffReason("What is the delivery fee?", emptyDetails, [pricedPasta], [productPriceFaq])).toMatch(/approved delivery or service fee/i);
    expect(requiredFactHandoffReason("Is delivery free?", emptyDetails, [pricedPasta], [productPriceFaq])).toMatch(/approved delivery or service fee/i);
    expect(requiredFactHandoffReason("What is the delivery fee?", emptyDetails, [pricedPasta], [feeFaq])).toBeNull();
    expect(requiredFactHandoffReason("What is the delivery fee?", emptyDetails, [pricedPasta], [feeFaq], { intent: "delivery_fee", sources: [feeFaq] })).toBeNull();
    expect(requiredFactHandoffReason("How much is Chicken Pasta?", emptyDetails, [pricedPasta], [productPriceFaq], { intent: "price", sources: [productPriceFaq] })).toBeNull();
    expect(requiredFactHandoffReason("How much is Unknown Pie?", emptyDetails, [pricedPasta], [productPriceFaq], { intent: "price", sources: [productPriceFaq] })).toMatch(/approved price/i);
    expect(requiredFactHandoffReason("What are your prices?", emptyDetails, [pricedPasta], [genericPriceFaq], { intent: "price", sources: [genericPriceFaq] })).toBeNull();
    expect(requiredFactHandoffReason("How much is Unknown Pie?", emptyDetails, [pricedPasta], [genericPriceFaq], { intent: "price", sources: [genericPriceFaq] })).toMatch(/approved price/i);

    const cleaningService = { id: 26, name: "Home cleaning service", price: "₦12,000", availability: "available" as const };
    const cleaningSource: GroundingSource = {
      ref: "product:26", kind: "product", id: 26, label: "Home cleaning service", text: "{}",
      value: { name: "Home cleaning service", category: "Services", description: "", price: "₦12,000", variants: "", availability: "available" },
    };
    expect(requiredFactHandoffReason("How much is the home-cleaning service?", emptyDetails, [cleaningService], [], { intent: "price", sources: [cleaningSource] })).toBeNull();
    expect(sourceSupportsIntent(feeFaq, "delivery_fee")).toBe(true);
    expect(sourceSupportsIntent(feeFaq, "price")).toBe(false);
    expect(sourceSupportsIntent(productPriceFaq, "delivery_fee")).toBe(false);
  });

  it("hands off for unsupported delivery estimates and payment details", () => {
    expect(requiredFactHandoffReason("How long does delivery take?", emptyDetails, [])).toMatch(/delivery-time/i);
    expect(requiredFactHandoffReason("Do you take card?", emptyDetails, [])).toMatch(/payment-method/i);
  });

  it("allows an approved delivery-time FAQ without requiring a separate service-area answer", () => {
    const deliveryTimeFaq: GroundingSource = {
      ref: "faq:24", kind: "faq", id: 24, label: "Delivery time",
      text: "Delivery normally takes 45 minutes.",
      value: { question: "How long does delivery take?", relatedPhrases: "arrival time, delivery estimate", intent: "delivery_time" },
    };
    expect(requiredFactHandoffReason("How long does delivery take?", emptyDetails, [], [deliveryTimeFaq])).toBeNull();
    expect(requiredFactHandoffReason("How long does delivery take?", emptyDetails, [], [deliveryTimeFaq], { intent: "delivery_time", sources: [deliveryTimeFaq] })).toBeNull();
  });
});

describe("greeting, menu, and owner-approved media", () => {
  it("recognizes a plain greeting but not a greeting combined with an unsupported request", () => {
    expect(isGreetingOnly("Hello")).toBe(true);
    expect(isGreetingOnly("Hi there!")).toBe(true);
    expect(isGreetingOnly("Good morning, how are you?")).toBe(true);
    expect(isGreetingOnly("Hello, can I see your menu?")).toBe(false);
  });

  it("recognizes menu requests without treating arbitrary messages as a menu query", () => {
    expect(isMenuRequest("Can I see your menu?")).toBe(true);
    expect(isMenuRequest("What products do you offer?")).toBe(true);
    expect(isMenuRequest("What time do you open?")).toBe(false);
  });

  it("answers plain greetings with the saved brand name", () => {
    const result = builtInGreeting("Lumistro Bakehouse", "friendly", "profile:8:businessName");
    expect(result).toMatchObject({
      decision: "ANSWER",
      mode: "built_in",
      replyDraft: expect.stringContaining("Lumistro Bakehouse"),
      sourceRefs: ["profile:8:businessName"],
      attachments: [],
    });
  });

  it("answers menu requests with saved links or catalogue items and hands off without them", () => {
    const product: GroundingSource = {
      ref: "product:9", kind: "product", id: 9, label: "Chicken Pasta", text: "{}",
      value: { name: "Chicken Pasta", category: "Main", description: "", price: "₦8,000", variants: "", availability: "available", imageUrl: "https://cdn.example.com/pasta.jpg" },
    };
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

describe("grounded answer construction and semantic intent matching", () => {
  const faq: GroundingSource = {
    ref: "faq:8", kind: "faq", id: 8, label: "When are you open?",
    text: "We are open Monday to Friday, 9am to 5pm.",
    value: { question: "What are your opening hours?", relatedPhrases: "business hours, opening times", intent: "opening_hours" },
  };
  const hours: GroundingSource = {
    ref: "profile:8:openingHours", kind: "profile", id: 8, field: "openingHours", label: "Opening hours",
    text: "Monday to Friday, 9am to 5pm",
  };
  const businessName: GroundingSource = {
    ref: "profile:8:businessName", kind: "profile", id: 8, field: "businessName", label: "Business name", text: "Lumistro Bakehouse",
  };
  const locations: GroundingSource = {
    ref: "profile:8:locations", kind: "profile", id: 8, field: "locations", label: "Locations", text: "12 Adeola Street, Lagos.",
  };
  const chickenPasta: GroundingSource = {
    ref: "product:9", kind: "product", id: 9, label: "Chicken Pasta", text: "{}",
    value: { name: "Chicken Pasta", category: "Main", description: "", price: "₦8,000", variants: "", availability: "available" },
  };
  const unpricedProduct: GroundingSource = {
    ref: "product:10", kind: "product", id: 10, label: "Chick", text: "{}",
    value: { name: "Chick", category: "Main", description: "", price: "", variants: "", availability: "unknown" },
  };

  it("tells the production model to match meaning instead of requiring suggested wording", () => {
    const prompt = buildReceptionistSystemPrompt("Lumistro Bakehouse");
    expect(prompt).toContain("synonyms, paraphrases, colloquial wording");
    expect(prompt).toContain("Customers do not have to use a suggested/default question");
    expect(prompt).toContain("What time do you close?");
    expect(prompt).toContain("relatedPhrases as semantic hints");
    expect(prompt).toContain("A general faq category is not evidence for a specific business-fact intent");
    expect(prompt).toContain("A delivery or service fee is delivery_fee, never a catalogue product price");
  });

  it("renders exact saved FAQ/profile text, irrespective of the question's surface wording", () => {
    expect(sourceSupportsIntent(faq, "opening_hours")).toBe(true);
    expect(sourceSupportsIntent(hours, "opening_hours")).toBe(true);
    expect(renderGroundedReply([faq], "friendly")).toBe("We are open Monday to Friday, 9am to 5pm.");
    expect(renderGroundedReply([hours], "friendly")).toContain("Monday to Friday, 9am to 5pm");
  });

  it("allows only source types compatible with the model-classified intent", () => {
    const generalFaq: GroundingSource = {
      ref: "faq:50", kind: "faq", id: 50, label: "General answer", text: "Ask the team for details.",
      value: { question: "Do you offer more services?", relatedPhrases: "services", intent: "faq" },
    };
    expect(sourceSupportsIntent(locations, "location")).toBe(true);
    expect(sourceSupportsIntent(businessName, "location")).toBe(false);
    expect(sourceSupportsIntent(businessName, "business_information")).toBe(true);
    expect(sourceSupportsIntent(chickenPasta, "price")).toBe(true);
    expect(sourceSupportsIntent(chickenPasta, "delivery_fee")).toBe(false);
    expect(sourceSupportsIntent(unpricedProduct, "price")).toBe(false);
    expect(sourceSupportsIntent(unpricedProduct, "availability")).toBe(false);
    expect(sourceSupportsIntent(faq, "availability")).toBe(false);
    expect(sourceSupportsIntent(generalFaq, "opening_hours")).toBe(false);
    expect(sourceSupportsIntent(generalFaq, "faq")).toBe(true);
    expect(sourceSupportsIntent(hours, "not_a_supported_intent")).toBe(false);
  });

  it("prefers the matching structured fact over a duplicate FAQ and accepts a semantic FAQ alone", () => {
    expect(selectSourcesForIntent([hours, faq], "opening_hours")).toEqual([hours]);
    expect(selectSourcesForIntent([faq], "opening_hours")).toEqual([faq]);
    expect(selectSourcesForIntent([businessName, faq], "opening_hours")).toEqual([faq]);
  });

  it("keeps same-numbered source records unambiguous by kind and field", () => {
    const hoursCandle: GroundingSource = {
      ref: "product:8", kind: "product", id: 8, label: "Hours Candle", text: "{}",
      value: { name: "Hours Candle", category: "Gift", description: "", price: "", variants: "", availability: "unknown" },
    };
    expect(hours.ref).not.toBe(hoursCandle.ref);
    expect(sourceSupportsIntent(hours, "opening_hours")).toBe(true);
    expect(sourceSupportsIntent(hoursCandle, "opening_hours")).toBe(false);
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
