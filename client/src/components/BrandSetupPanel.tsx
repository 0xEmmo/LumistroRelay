import { useEffect, useState, type FormEvent } from "react";
import { Check, Plus, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "../../../server/routers";

type SetupData = inferRouterOutputs<AppRouter>["workspace"]["setup"];
type BrandForm = {
  name: string; websiteUrl: string; industry: string; description: string; locations: string;
  openingHours: string; contactDetails: string; deliveryAreas: string; paymentMethods: string;
  orderInstructions: string; policies: string; voice: "friendly" | "professional" | "premium" | "casual" | "playful" | "short_direct";
};
const emptyForm: BrandForm = {
  name: "", websiteUrl: "", industry: "Restaurant / food", description: "", locations: "", openingHours: "",
  contactDetails: "", deliveryAreas: "", paymentMethods: "", orderInstructions: "", policies: "", voice: "friendly",
};

function TextField({ label, value, onChange, placeholder, required = false }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string; required?: boolean }) {
  return <label className="owner-field"><span>{label}{required && <i> *</i>}</span><input className="owner-input" value={value} onChange={event => onChange(event.target.value)} placeholder={placeholder} required={required} maxLength={3000} /></label>;
}
function TextAreaField({ label, value, onChange, placeholder, rows = 3 }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string; rows?: number }) {
  return <label className="owner-field"><span>{label}</span><textarea className="owner-input owner-textarea" rows={rows} value={value} onChange={event => onChange(event.target.value)} placeholder={placeholder} maxLength={4000} /></label>;
}

export default function BrandSetupPanel({ data, onSaved }: { data: SetupData; onSaved?: () => void }) {
  const utils = trpc.useUtils();
  const [form, setForm] = useState<BrandForm>(emptyForm);
  const [item, setItem] = useState({ name: "", category: "", description: "", price: "", variants: "", availability: "unknown" as "available" | "unavailable" | "unknown", imageUrl: "" });
  const [faq, setFaq] = useState({ question: "", answer: "", relatedPhrases: "" });

  useEffect(() => {
    if (!data.brand) {
      setForm(emptyForm);
      return;
    }
    setForm({
      name: data.brand.name,
      websiteUrl: data.brand.websiteUrl ?? "",
      industry: data.profile?.industry ?? "Restaurant / food",
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
    saveSetup.mutate(form);
  };
  const submitItem = (event: FormEvent) => {
    event.preventDefault();
    addItem.mutate(item);
  };
  const submitFaq = (event: FormEvent) => {
    event.preventDefault();
    addFaq.mutate(faq);
  };

  return (
    <div className="owner-panel-stack">
      <section className="owner-card">
        <div className="owner-card-heading"><div><p className="owner-eyebrow">STEP 01 · YOUR BUSINESS</p><h2>Tell Relay about your business</h2><p>Only information you save here can be used in receptionist tests.</p></div><span className="owner-approved"><Check size={14} /> Owner-approved</span></div>
        <form onSubmit={submitSetup} className="owner-form">
          <div className="owner-form-grid">
            <TextField label="Business name" value={form.name} onChange={value => change("name", value)} placeholder="e.g. The name customers know" required />
            <TextField label="Website (optional)" value={form.websiteUrl} onChange={value => change("websiteUrl", value)} placeholder="https://yourbusiness.com" />
            <label className="owner-field"><span>Business type</span><select className="owner-input" value={form.industry} onChange={event => change("industry", event.target.value)}><option>Restaurant / food</option><option>Fashion</option><option>Beauty</option><option>Events</option><option>Real estate</option><option>School / education</option><option>Other</option></select></label>
            <label className="owner-field"><span>Brand voice</span><select className="owner-input" value={form.voice} onChange={event => change("voice", event.target.value)}><option value="friendly">Friendly</option><option value="professional">Professional</option><option value="premium">Premium</option><option value="casual">Casual</option><option value="playful">Playful</option><option value="short_direct">Short and direct</option></select></label>
          </div>
          <TextAreaField label="What does your business do?" value={form.description} onChange={value => change("description", value)} placeholder="Describe your business using facts you are comfortable approving for customer replies." />
          <div className="owner-form-grid">
            <TextAreaField label="Locations" value={form.locations} onChange={value => change("locations", value)} placeholder="Addresses or areas served from each location" />
            <TextAreaField label="Opening hours" value={form.openingHours} onChange={value => change("openingHours", value)} placeholder="Days, times, time zone, and holidays if known" />
            <TextAreaField label="Contact details" value={form.contactDetails} onChange={value => change("contactDetails", value)} placeholder="Phone, email, or approved contact instructions" />
            <TextAreaField label="Delivery or service areas" value={form.deliveryAreas} onChange={value => change("deliveryAreas", value)} placeholder="List only areas you serve and any approved limits" />
            <TextAreaField label="Payment methods" value={form.paymentMethods} onChange={value => change("paymentMethods", value)} placeholder="Payment methods your business accepts" />
            <TextAreaField label="Booking or order instructions" value={form.orderInstructions} onChange={value => change("orderInstructions", value)} placeholder="How customers should place an order or request a booking" />
          </div>
          <TextAreaField label="Policies" value={form.policies} onChange={value => change("policies", value)} placeholder="Cancellation, delivery, returns, or other policies you approve" />
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
              <div className="owner-form-grid"><TextField label="Variants or add-ons" value={item.variants} onChange={value => setItem(previous => ({ ...previous, variants: value }))} placeholder="Options customers can choose" /><label className="owner-field"><span>Availability</span><select className="owner-input" value={item.availability} onChange={event => setItem(previous => ({ ...previous, availability: event.target.value as typeof item.availability }))}><option value="unknown">Not confirmed</option><option value="available">Available</option><option value="unavailable">Unavailable</option></select></label></div>
              <TextField label="Image URL (optional)" value={item.imageUrl} onChange={value => setItem(previous => ({ ...previous, imageUrl: value }))} placeholder="https://…" />
              <button className="owner-small-button" type="submit" disabled={addItem.isPending}><Plus size={15} /> Add product or service</button>
            </form>
            <div className="owner-record-list">{data.catalogue.length === 0 ? <p className="owner-muted">No products or services added yet.</p> : data.catalogue.map(record => <article className="owner-record" key={record.id}><div><strong>{record.name}</strong><small>{record.category} · {record.price || "Price not added"} · {record.availability === "unknown" ? "Availability not confirmed" : record.availability}</small></div><button type="button" className="owner-icon-button" aria-label={`Remove ${record.name}`} onClick={() => removeItem.mutate({ id: record.id })}><Trash2 size={15} /></button></article>)}</div>
          </section>

          <section className="owner-card owner-subcard">
            <div className="owner-card-heading"><div><p className="owner-eyebrow">APPROVED ANSWERS</p><h2>Frequently asked questions</h2><p>Write the answer you want Relay to use—not a guess.</p></div></div>
            <form onSubmit={submitFaq} className="owner-compact-form">
              <TextAreaField label="Customer question" value={faq.question} onChange={value => setFaq(previous => ({ ...previous, question: value }))} placeholder="What do customers ask?" rows={2} />
              <TextAreaField label="Approved answer" value={faq.answer} onChange={value => setFaq(previous => ({ ...previous, answer: value }))} placeholder="The answer your team approves" rows={3} />
              <TextField label="Related phrases (optional)" value={faq.relatedPhrases} onChange={value => setFaq(previous => ({ ...previous, relatedPhrases: value }))} placeholder="Other ways customers might ask" />
              <button className="owner-small-button" type="submit" disabled={addFaq.isPending}><Plus size={15} /> Add FAQ</button>
            </form>
            <div className="owner-record-list">{data.faqs.length === 0 ? <p className="owner-muted">No FAQs added yet.</p> : data.faqs.map(record => <article className="owner-record owner-faq-record" key={record.id}><div><strong>{record.question}</strong><small>{record.answer}</small></div><button type="button" className="owner-icon-button" aria-label="Remove FAQ" onClick={() => removeFaq.mutate({ id: record.id })}><Trash2 size={15} /></button></article>)}</div>
          </section>
        </div>
      )}
    </div>
  );
}

function ShieldCheckIcon() {
  return <span aria-hidden="true" className="owner-shield-mark"><Check size={12} /></span>;
}
