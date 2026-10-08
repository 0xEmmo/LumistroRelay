import { useEffect, useState, type FormEvent } from "react";
import { Check, Clock3, Plus, Save, ShieldCheck, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "../../../server/routers";

type SetupData = inferRouterOutputs<AppRouter>["workspace"]["setup"];
type BrandForm = {
  name: string; websiteUrl: string; menuUrl: string; industry: string; description: string; locations: string;
  openingHours: string; contactDetails: string; deliveryAreas: string; paymentMethods: string;
  orderInstructions: string; policies: string; voice: "friendly" | "professional" | "premium" | "casual" | "playful" | "short_direct";
};
const industries = ["Restaurant & food", "Fashion & apparel", "Beauty & wellness", "Events", "Real estate", "School & education", "Retail", "Professional services", "Other"];
const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const paymentOptions = ["Cash", "Card", "Bank transfer", "POS", "Online payment", "Mobile money"];
const orderOptions = ["WhatsApp", "Instagram DM", "Website", "Phone", "In person", "Booking link"];
const emptyForm: BrandForm = {
  name: "", websiteUrl: "", menuUrl: "", industry: "", description: "", locations: "", openingHours: "",
  contactDetails: "", deliveryAreas: "", paymentMethods: "", orderInstructions: "", policies: "", voice: "friendly",
};

function TextField({ label, value, onChange, placeholder, required = false, type = "text" }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string; required?: boolean; type?: string }) {
  return <label className="owner-field"><span>{label}{required && <i> *</i>}</span><input className="owner-input" type={type} value={value} onChange={event => onChange(event.target.value)} placeholder={placeholder} required={required} maxLength={1000} /></label>;
}
function TextAreaField({ label, value, onChange, placeholder, rows = 3, required = false }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string; rows?: number; required?: boolean }) {
  return <label className="owner-field"><span>{label}{required && <i> *</i>}</span><textarea className="owner-input owner-textarea" rows={rows} value={value} onChange={event => onChange(event.target.value)} placeholder={placeholder} maxLength={4000} required={required} /></label>;
}
function tokenList(value: string) {
  return value.split(/[,;\n]+/).map(item => item.trim()).filter(Boolean);
}
function ChoiceGroup({ label, options, value, onChange, help }: { label: string; options: string[]; value: string; onChange: (value: string) => void; help?: string }) {
  const selected = tokenList(value);
  const toggle = (option: string) => {
    const next = selected.some(item => item.toLowerCase() === option.toLowerCase())
      ? selected.filter(item => item.toLowerCase() !== option.toLowerCase())
      : [...selected, option];
    onChange(next.join(", "));
  };
  return <fieldset className="owner-choice-group"><legend>{label}</legend>{help && <p>{help}</p>}<div className="owner-chip-grid">{options.map(option => {
    const active = selected.some(item => item.toLowerCase() === option.toLowerCase());
    return <button type="button" key={option} aria-pressed={active} className={active ? "owner-option-chip is-active" : "owner-option-chip"} onClick={() => toggle(option)}>{active && <Check size={12} />}{option}</button>;
  })}</div></fieldset>;
}
function safePreviewUrl(value: string) {
  try {
    const parsed = new URL(value);
    return (parsed.protocol === "https:" || parsed.protocol === "http:") && !parsed.username && !parsed.password;
  } catch { return false; }
}
function questionStarters(industry: string) {
  const value = industry.toLowerCase();
  if (/restaurant|food/.test(value)) return ["Can I see your menu?", "Which areas do you deliver to?", "How do I place an order?", "What payment methods do you accept?"];
  if (/fashion|apparel|retail/.test(value)) return ["What products do you offer?", "How can I check sizes or options?", "How do I place an order?", "Which areas do you serve?"];
  if (/beauty|wellness/.test(value)) return ["What services do you offer?", "How do I book a service?", "Where are you located?", "What should I know before my appointment?"];
  if (/event/.test(value)) return ["What types of events do you support?", "How can I request a quote?", "What details should I include in an enquiry?"];
  if (/real estate/.test(value)) return ["Which properties or services do you offer?", "How can I arrange a viewing?", "Where are your listings located?"];
  if (/school|education/.test(value)) return ["How do I apply?", "What programmes do you offer?", "How can I contact admissions?"];
  return ["What services do you offer?", "Where are you located?", "How can I contact you?", "How do I book or place an order?"];
}
function savedFactSuggestions(profile: NonNullable<SetupData["profile"]>) {
  return [
    { question: "What are your opening hours?", answer: profile.openingHours, relatedPhrases: "business hours, opening times, when do you open" },
    { question: "Which areas do you serve?", answer: profile.deliveryAreas, relatedPhrases: "delivery areas, service areas, do you deliver" },
    { question: "Which payment methods do you accept?", answer: profile.paymentMethods, relatedPhrases: "how can I pay, payment options" },
    { question: "How do I place an order?", answer: profile.orderInstructions, relatedPhrases: "ordering, purchase, booking instructions" },
    { question: "Where are you located?", answer: profile.locations, relatedPhrases: "address, location, where can I find you" },
    { question: "How can I contact you?", answer: profile.contactDetails, relatedPhrases: "phone, email, contact details" },
    { question: "What policies should customers know?", answer: profile.policies, relatedPhrases: "cancellation, returns, terms" },
    { question: "Can I see your menu?", answer: profile.menuUrl ? `You can view our menu here: ${profile.menuUrl}` : "", relatedPhrases: "menu link, catalogue" },
  ].filter(item => item.answer.trim());
}

export default function BrandSetupPanel({ data, onSaved }: { data: SetupData; onSaved?: () => void }) {
  const utils = trpc.useUtils();
  const [form, setForm] = useState<BrandForm>(emptyForm);
  const [otherIndustry, setOtherIndustry] = useState("");
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [openTime, setOpenTime] = useState("");
  const [closeTime, setCloseTime] = useState("");
  const [item, setItem] = useState({ name: "", category: "", description: "", price: "", variants: "", availability: "unknown" as "available" | "unavailable" | "unknown", imageUrl: "" });
  const [faq, setFaq] = useState({ question: "", answer: "", relatedPhrases: "" });

  useEffect(() => {
    if (!data.brand) {
      setForm(emptyForm);
      setOtherIndustry("");
      return;
    }
    const savedIndustry = data.profile?.industry ?? "";
    const knownIndustry = industries.slice(0, -1).includes(savedIndustry);
    setOtherIndustry(knownIndustry ? "" : savedIndustry);
    setForm({
      name: data.brand.name,
      websiteUrl: data.brand.websiteUrl ?? "",
      menuUrl: data.profile?.menuUrl ?? "",
      industry: knownIndustry ? savedIndustry : savedIndustry ? "Other" : "",
      description: data.profile?.description ?? "",
      locations: data.profile?.locations ?? "",
      openingHours: data.profile?.openingHours ?? "",
      contactDetails: data.profile?.contactDetails ?? "",
      deliveryAreas: data.profile?.deliveryAreas ?? "",
      paymentMethods: data.profile?.paymentMethods ?? "",
      orderInstructions: data.profile?.orderInstructions ?? "",
      policies: data.profile?.policies ?? "",
      voice: data.profile?.voice ?? "friendly",
    });
  }, [data.brand?.id, data.profile?.id]);

  const saveSetup = trpc.workspace.saveBrandSetup.useMutation({
    onSuccess: async () => {
      toast.success("Brand details saved. Relay will use these as approved facts.");
      await Promise.all([utils.workspace.setup.invalidate(), utils.workspace.current.invalidate()]);
      onSaved?.();
    },
    onError: error => toast.error(error.message || "We couldn’t save those details."),
  });
  const addItem = trpc.workspace.addCatalogueItem.useMutation({
    onSuccess: async () => {
      setItem({ name: "", category: "", description: "", price: "", variants: "", availability: "unknown", imageUrl: "" });
      toast.success("Item added to your approved information.");
      await utils.workspace.setup.invalidate();
    },
    onError: error => toast.error(error.message || "We couldn’t add that item."),
  });
  const removeItem = trpc.workspace.removeCatalogueItem.useMutation({
    onSuccess: () => void utils.workspace.setup.invalidate(),
    onError: error => toast.error(error.message || "We couldn’t remove that item."),
  });
  const addFaq = trpc.workspace.addFaq.useMutation({
    onSuccess: async () => {
      setFaq({ question: "", answer: "", relatedPhrases: "" });
      toast.success("FAQ added to your approved information.");
      await utils.workspace.setup.invalidate();
    },
    onError: error => toast.error(error.message || "We couldn’t add that FAQ."),
  });
  const removeFaq = trpc.workspace.removeFaq.useMutation({
    onSuccess: () => void utils.workspace.setup.invalidate(),
    onError: error => toast.error(error.message || "We couldn’t remove that FAQ."),
  });

  const change = (key: keyof BrandForm, value: string) => setForm(previous => ({ ...previous, [key]: value }));
  const submitSetup = (event: FormEvent) => {
    event.preventDefault();
    saveSetup.mutate({ ...form, industry: form.industry === "Other" ? otherIndustry.trim() : form.industry });
  };
  const applyPreset = (preset: string[]) => setSelectedDays(preset);
  const toggleDay = (day: string) => setSelectedDays(previous => previous.includes(day) ? previous.filter(value => value !== day) : [...previous, day]);
  const applyHours = () => {
    if (!selectedDays.length || !openTime || !closeTime) {
      toast.error("Choose at least one day and both times first.");
      return;
    }
    const orderedDays = days.filter(day => selectedDays.includes(day));
    change("openingHours", `${orderedDays.join(", ")}: ${openTime}–${closeTime}`);
    toast.success("Schedule added. You can edit it below for breaks or exceptions.");
  };
  const submitItem = (event: FormEvent) => { event.preventDefault(); addItem.mutate(item); };
  const submitFaq = (event: FormEvent) => { event.preventDefault(); addFaq.mutate(faq); };
  const loadStarterQuestion = (question: string) => setFaq(previous => ({ ...previous, question }));
  const loadSavedFact = (suggestion: { question: string; answer: string; relatedPhrases: string }) => {
    setFaq(suggestion);
    toast.info("Review or edit this saved answer, then add it to your FAQs.");
  };

  const factSuggestions = data.profile ? savedFactSuggestions(data.profile) : [];
  const dayPresets = [
    { label: "Weekdays", value: days.slice(0, 5) },
    { label: "Mon–Sat", value: days.slice(0, 6) },
    { label: "Every day", value: days },
    { label: "Weekends", value: days.slice(5) },
  ];

  return (
    <div className="owner-panel-stack">
      <section className="owner-card">
        <div className="owner-card-heading"><div><p className="owner-eyebrow">STEP 01 · YOUR BUSINESS</p><h2>Tell Relay about your business</h2><p>Choose common details or type your own. Only information you save here can be used in receptionist tests.</p></div><span className="owner-approved"><Check size={14} /> Owner-approved</span></div>
        <form onSubmit={submitSetup} className="owner-form">
          <div className="owner-form-grid">
            <TextField label="Business name" value={form.name} onChange={value => change("name", value)} placeholder="The name customers know" required />
            <label className="owner-field"><span>Business type <i> *</i></span><select className="owner-input" value={form.industry} onChange={event => change("industry", event.target.value)} required><option value="">Choose the closest fit</option>{industries.map(industry => <option key={industry}>{industry}</option>)}</select></label>
            {form.industry === "Other" && <TextField label="Describe your business type" value={otherIndustry} onChange={setOtherIndustry} placeholder="e.g. Home repair" required />}
            <TextField label="Website (optional)" type="url" value={form.websiteUrl} onChange={value => change("websiteUrl", value)} placeholder="https://yourbusiness.com" />
            <TextField label="Menu or catalogue link (optional)" type="url" value={form.menuUrl} onChange={value => change("menuUrl", value)} placeholder="https://yourbusiness.com/menu" />
            <label className="owner-field"><span>Brand voice</span><select className="owner-input" value={form.voice} onChange={event => change("voice", event.target.value as BrandForm["voice"])}><option value="friendly">Friendly</option><option value="professional">Professional</option><option value="premium">Premium</option><option value="casual">Casual</option><option value="playful">Playful</option><option value="short_direct">Short and direct</option></select></label>
          </div>
          <TextAreaField label="What does your business do?" value={form.description} onChange={value => change("description", value)} placeholder="Describe your products, services, and who you serve using facts you approve." />
          <div className="owner-form-grid">
            <TextAreaField label="Locations" value={form.locations} onChange={value => change("locations", value)} placeholder="Addresses or areas served from each location" />
            <div className="owner-field"><span>Build opening hours with choices</span><p className="owner-helper">Choose the days and times you’re open. Add holidays or different weekend hours in the editable details below.</p><div className="owner-preset-row">{dayPresets.map(preset => <button type="button" className="owner-text-chip" key={preset.label} onClick={() => applyPreset(preset.value)}>{preset.label}</button>)}</div><div className="owner-day-picker">{days.map(day => <button type="button" key={day} aria-pressed={selectedDays.includes(day)} className={selectedDays.includes(day) ? "owner-day-chip is-active" : "owner-day-chip"} onClick={() => toggleDay(day)}>{day}</button>)}</div><div className="owner-time-grid"><label className="owner-field"><span>Opens</span><input className="owner-input" type="time" value={openTime} onChange={event => setOpenTime(event.target.value)} /></label><label className="owner-field"><span>Closes</span><input className="owner-input" type="time" value={closeTime} onChange={event => setCloseTime(event.target.value)} /></label></div><button type="button" className="owner-small-button" onClick={applyHours}><Clock3 size={14} /> Use this schedule</button></div>
            <TextAreaField label="Opening hours and exceptions" value={form.openingHours} onChange={value => change("openingHours", value)} placeholder="The selected schedule appears here; add holidays, breaks, or time-zone notes." />
            <TextAreaField label="Contact details" value={form.contactDetails} onChange={value => change("contactDetails", value)} placeholder="Phone, email, or approved contact instructions" />
            <TextAreaField label="Delivery or service areas" value={form.deliveryAreas} onChange={value => change("deliveryAreas", value)} placeholder="List only areas you serve and any approved limits" />
          </div>
          <ChoiceGroup label="Payment methods you accept" options={paymentOptions} value={form.paymentMethods} onChange={value => change("paymentMethods", value)} help="Select all that apply; add a custom option in the details field if needed." />
          <TextAreaField label="Payment details or exceptions" value={form.paymentMethods} onChange={value => change("paymentMethods", value)} placeholder="Selected options appear here. Add details such as payment links or conditions." rows={2} />
          <ChoiceGroup label="How customers can order or book" options={orderOptions} value={form.orderInstructions} onChange={value => change("orderInstructions", value)} help="Select the channels you actually use; you can add instructions below." />
          <TextAreaField label="Ordering or booking instructions" value={form.orderInstructions} onChange={value => change("orderInstructions", value)} placeholder="Selected options appear here. Add steps, links, booking rules, or details." rows={2} />
          <TextAreaField label="Policies" value={form.policies} onChange={value => change("policies", value)} placeholder="Cancellation, delivery, returns, or other policies you approve" />
          <p className="owner-helper">Website, menu and image links must use HTTP or HTTPS. Relay will only show links and images you provide here.</p>
          <div className="owner-form-footer"><span><ShieldCheckIcon /> Save only details you approve Relay to use.</span><button className="relay-button relay-button-primary" disabled={saveSetup.isPending}><Save size={16} /> {saveSetup.isPending ? "Saving…" : data.brand ? "Save business details" : "Create my brand"}</button></div>
        </form>
      </section>

      {data.brand && (
        <div className="owner-form-grid owner-data-grid">
          <section className="owner-card owner-subcard">
            <div className="owner-card-heading"><div><p className="owner-eyebrow">APPROVED FACTS</p><h2>Products and services</h2><p>Save exact pricing and availability. Leave them blank if they are not confirmed.</p></div></div>
            <form onSubmit={submitItem} className="owner-compact-form">
              <TextField label="Name" value={item.name} onChange={value => setItem(previous => ({ ...previous, name: value }))} placeholder="Product or service" required />
              <div className="owner-form-grid"><TextField label="Category" value={item.category} onChange={value => setItem(previous => ({ ...previous, category: value }))} placeholder="e.g. Main course" required /><TextField label="Price" value={item.price} onChange={value => setItem(previous => ({ ...previous, price: value }))} placeholder="Exact approved price, if known" /></div>
              <TextAreaField label="Description" value={item.description} onChange={value => setItem(previous => ({ ...previous, description: value }))} placeholder="Product/service details" rows={2} />
              <div className="owner-form-grid"><TextField label="Variants or add-ons" value={item.variants} onChange={value => setItem(previous => ({ ...previous, variants: value }))} placeholder="Sizes, flavours, packages, options" /><label className="owner-field"><span>Availability</span><select className="owner-input" value={item.availability} onChange={event => setItem(previous => ({ ...previous, availability: event.target.value as typeof item.availability }))}><option value="unknown">Not confirmed</option><option value="available">Available</option><option value="unavailable">Unavailable</option></select></label></div>
              <TextField label="Image URL (optional)" type="url" value={item.imageUrl} onChange={value => setItem(previous => ({ ...previous, imageUrl: value }))} placeholder="https://…" />
              {item.imageUrl && safePreviewUrl(item.imageUrl) && <img className="owner-item-form-preview" src={item.imageUrl} alt="Product preview" loading="lazy" />}
              <button className="owner-small-button" type="submit" disabled={addItem.isPending}><Plus size={15} /> Add product or service</button>
            </form>
            <div className="owner-record-list">{data.catalogue.length === 0 ? <p className="owner-muted">No products or services added yet.</p> : data.catalogue.map(record => <article className="owner-record" key={record.id}>{record.imageUrl && <img className="owner-record-thumb" src={record.imageUrl} alt="" loading="lazy" />}<div><strong>{record.name}</strong><small>{record.category} · {record.price || "Price not added"} · {record.availability === "unknown" ? "Availability not confirmed" : record.availability}</small></div><button type="button" className="owner-icon-button" aria-label={`Remove ${record.name}`} onClick={() => removeItem.mutate({ id: record.id })}><Trash2 size={15} /></button></article>)}</div>
          </section>

          <section className="owner-card owner-subcard">
            <div className="owner-card-heading"><div><p className="owner-eyebrow">APPROVED ANSWERS</p><h2>Frequently asked questions</h2><p>Choose a question starter or add an answer copied from facts you already saved. Review every answer before adding it.</p></div></div>
            <div className="owner-faq-ideas"><span className="owner-helper-label">Question starters for {form.industry && form.industry !== "Other" ? form.industry : "your business"}</span><div className="owner-chip-grid">{questionStarters(form.industry).map(question => <button type="button" className="owner-text-chip" key={question} onClick={() => loadStarterQuestion(question)}>{question}</button>)}</div></div>
            {factSuggestions.length > 0 && <div className="owner-faq-ideas"><span className="owner-helper-label">Use an answer from your saved details</span><div className="owner-fact-suggestions">{factSuggestions.map(suggestion => <button type="button" className="owner-fact-suggestion" key={suggestion.question} onClick={() => loadSavedFact(suggestion)}><strong>{suggestion.question}</strong><small>{suggestion.answer}</small></button>)}</div></div>}
            <form onSubmit={submitFaq} className="owner-compact-form">
              <TextAreaField label="Customer question" value={faq.question} onChange={value => setFaq(previous => ({ ...previous, question: value }))} placeholder="Select a starter or write a question customers ask" rows={2} required />
              <TextAreaField label="Approved answer" value={faq.answer} onChange={value => setFaq(previous => ({ ...previous, answer: value }))} placeholder="Write the answer your team approves" rows={3} required />
              <TextField label="Related phrases (optional)" value={faq.relatedPhrases} onChange={value => setFaq(previous => ({ ...previous, relatedPhrases: value }))} placeholder="Other ways customers might ask" />
              <button className="owner-small-button" type="submit" disabled={addFaq.isPending}><Plus size={15} /> Add FAQ</button>
            </form>
            <div className="owner-record-list">{data.faqs.length === 0 ? <p className="owner-muted">No FAQs added yet.</p> : data.faqs.map(record => <article className="owner-record owner-faq-record" key={record.id}><div><strong>{record.question}</strong><small>{record.answer}</small></div><button type="button" className="owner-icon-button" aria-label={`Remove FAQ: ${record.question}`} onClick={() => removeFaq.mutate({ id: record.id })}><Trash2 size={15} /></button></article>)}</div>
          </section>
        </div>
      )}
    </div>
  );
}

function ShieldCheckIcon() {
  return <span aria-hidden="true" className="owner-shield-mark"><Check size={12} /></span>;
}
