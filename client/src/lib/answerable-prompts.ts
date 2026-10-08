export type PromptProfile = {
  menuUrl?: string | null;
  openingHours?: string | null;
  deliveryAreas?: string | null;
  paymentMethods?: string | null;
  orderInstructions?: string | null;
} | null;
export type PromptProduct = { name: string; price?: string | null; availability?: "available" | "unavailable" | "unknown" };
export type PromptFaq = { question: string; relatedPhrases?: string | null; intent?: string | null };
export type SuggestedPrompt = { message: string; reason: string };

const unsafeQuestion = /\b(refund|complaint|complain|problem|discount|allerg|safety|human|manager|legal|financial|sensitive|cater|catering|custom order|large order|quote|availability|available|in stock|booking|reservation|appointment|time slot)\b/i;

/**
 * Keep answerable examples predictable and grounded. These are assembled from
 * saved owner facts, not invented by an LLM. Safety/handoff examples are shown
 * separately in the UI.
 */
export function answerablePrompts(input: { profile: PromptProfile; catalogue: PromptProduct[]; faqs: PromptFaq[] }): SuggestedPrompt[] {
  const { profile, catalogue, faqs } = input;
  const prompts: SuggestedPrompt[] = [{ message: "Hello", reason: "A built-in greeting always works" }];
  const safeFaqs = faqs.filter(faq => faq.question.trim() && !unsafeQuestion.test(`${faq.question} ${faq.relatedPhrases ?? ""}`));
  const faqHasIntent = (intent: string) => safeFaqs.some(faq => faq.intent === intent);

  if (profile?.menuUrl?.trim() || catalogue.length > 0 || faqHasIntent("menu")) {
    prompts.push({ message: "Can I see your menu?", reason: "Your saved menu link, catalogue or menu FAQ" });
  }
  if (profile?.openingHours?.trim() || faqHasIntent("opening_hours")) {
    prompts.push({ message: "What are your opening hours?", reason: "Your saved hours or FAQ" });
  }
  if (profile?.deliveryAreas?.trim() || faqHasIntent("delivery_area")) {
    prompts.push({ message: "Which areas do you serve?", reason: "Your saved service areas or FAQ" });
  }
  if (profile?.paymentMethods?.trim() || faqHasIntent("payment_methods")) {
    prompts.push({ message: "Which payment methods do you accept?", reason: "Your saved payment details or FAQ" });
  }
  if (profile?.orderInstructions?.trim() || faqHasIntent("order_instructions") || faqHasIntent("booking_instructions")) {
    prompts.push({ message: "How do I place an order?", reason: "Your saved ordering instructions or FAQ" });
  }
  if (faqHasIntent("delivery_fee")) prompts.push({ message: "What is the delivery fee?", reason: "Your owner-approved delivery-fee FAQ" });
  const pricedProduct = catalogue.find(product => product.price?.trim());
  if (pricedProduct) prompts.push({ message: `How much is ${pricedProduct.name}?`, reason: "Exact owner-saved product price" });
  const knownAvailability = catalogue.find(product => product.availability && product.availability !== "unknown");
  if (knownAvailability) prompts.push({ message: `Is ${knownAvailability.name} available?`, reason: "Owner-listed availability for this named item" });
  const answerableFaq = safeFaqs.find(faq => faq.question.trim() && faq.intent !== "unknown");
  if (answerableFaq) prompts.push({ message: answerableFaq.question, reason: "Your owner-approved FAQ answer" });

  const seen = new Set<string>();
  return prompts.filter(prompt => {
    const key = prompt.message.trim().toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).slice(0, 8);
}
