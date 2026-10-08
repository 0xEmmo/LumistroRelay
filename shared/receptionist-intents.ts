export const semanticIntentValues = [
  "greeting",
  "menu",
  "price",
  "delivery_fee",
  "availability",
  "opening_hours",
  "delivery_area",
  "delivery_time",
  "order_instructions",
  "booking_instructions",
  "payment_methods",
  "location",
  "contact_details",
  "policy",
  "business_information",
  "product_details",
  "faq",
  "other",
] as const;

export type SemanticIntent = (typeof semanticIntentValues)[number];

/** FAQ topics are selected by the owner; time-sensitive availability is intentionally excluded. */
export const faqIntentValues = [
  "faq",
  "opening_hours",
  "menu",
  "price",
  "delivery_fee",
  "delivery_area",
  "delivery_time",
  "order_instructions",
  "booking_instructions",
  "payment_methods",
  "location",
  "contact_details",
  "policy",
  "business_information",
  "product_details",
] as const satisfies readonly SemanticIntent[];

export type FaqIntent = (typeof faqIntentValues)[number];

export const faqIntentLabels: Record<FaqIntent, string> = {
  faq: "General question",
  opening_hours: "Opening hours",
  menu: "Menu or catalogue",
  price: "Price or fee",
  delivery_fee: "Delivery or service fee",
  delivery_area: "Delivery or service areas",
  delivery_time: "Delivery timing",
  order_instructions: "How to order or book",
  booking_instructions: "Bookings and appointments",
  payment_methods: "Payment methods",
  location: "Location or address",
  contact_details: "Contact details",
  policy: "Policies, returns or cancellations",
  business_information: "About the business",
  product_details: "Products or services",
};
