export type PromptProfile = {
  menuUrl?: string | null;
  openingHours?: string | null;
  deliveryAreas?: string | null;
  paymentMethods?: string | null;
  orderInstructions?: string | null;
} | null;
export type PromptProduct = { name: string; price?: string | null; availability?: "available" | "unavailable" | "unknown" };
export type PromptFaq = { question: string; relatedPhrases?: string | null };
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
  const faqHas = (pattern: RegExp) => safeFaqs.some(faq => pattern.test(`${faq.question} ${faq.relatedPhrases ?? ""}`));

  if (profile?.menuUrl?.trim() || catalogue.length > 0 || faqHas(/\b(?:menu|catalog(?:ue)?|product list|service list)\b/i)) {
    prompts.push({ message: "Can I see your menu?", reason: "Your saved menu link, catalogue or menu FAQ" });
  }
  if (profile?.openingHours?.trim() || faqHas(/\b(?:hours?|open|opening times?)\b/i)) {
    prompts.push({ message: "What are your opening hours?", reason: "Your saved hours or FAQ" });
  }
  if (profile?.deliveryAreas?.trim() || faqHas(/\b(?:deliver|delivery|service areas?|areas? do you serve)\b/i)) {
    prompts.push({ message: "Which areas do you serve?", reason: "Your saved service areas or FAQ" });
  }
  if (profile?.paymentMethods?.trim() || faqHas(/\b(?:payment|pay|cash|card|transfer)\b/i)) {
    prompts.push({ message: "Which payment methods do you accept?", reason: "Your saved payment details or FAQ" });
  }
  if (profile?.orderInstructions?.trim() || faqHas(/\b(?:order|ordering|purchase|buy|place an order)\b/i)) {
    prompts.push({ message: "How do I place an order?", reason: "Your saved ordering instructions or FAQ" });
  }
  const pricedProduct = catalogue.find(product => product.price?.trim());
  if (pricedProduct) prompts.push({ message: `How much is ${pricedProduct.name}?`, reason: "Exact owner-saved product price" });
  const knownAvailability = catalogue.find(product => product.availability && product.availability !== "unknown");
  if (knownAvailability) prompts.push({ message: `Is ${knownAvailability.name} available?`, reason: "Owner-listed availability for this named item" });
  const answerableFaq = safeFaqs.find(faq => faq.question.trim());
  if (answerableFaq) prompts.push({ message: answerableFaq.question, reason: "Your owner-approved FAQ answer" });

  const seen = new Set<string>();
  return prompts.filter(prompt => {
    const key = prompt.message.trim().toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).slice(0, 8);
}
