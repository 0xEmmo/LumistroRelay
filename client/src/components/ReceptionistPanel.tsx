import { useState, type FormEvent } from "react";
import { AlertTriangle, ArrowUpRight, Bot, Check, CircleHelp, Loader2, MessageSquareText, Send, ShieldCheck, Sparkles, UserRound } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "../../../server/routers";

type SetupData = inferRouterOutputs<AppRouter>["workspace"]["setup"];
type TestResult = inferRouterOutputs<AppRouter>["workspace"]["testReceptionist"];

const decisionLabel: Record<TestResult["decision"], string> = { ANSWER: "Answer draft", ASK: "Clarifying question", HANDOFF: "Human handoff" };
const parseArray = (value: string) => {
  try { const parsed: unknown = JSON.parse(value); return Array.isArray(parsed) ? parsed.map(String) : []; }
  catch { return []; }
};
const parseSourceRefs = (value: string) => {
  try {
    const parsed: unknown = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];
    return parsed.flatMap(item => {
      if (typeof item === "string") return [item];
      if (typeof item === "object" && item !== null && "ref" in item && typeof item.ref === "string") return [item.ref];
      if (typeof item === "object" && item !== null && "kind" in item && typeof item.kind === "string" && "id" in item && Number.isInteger(Number(item.id))) return [`${item.kind}:${Number(item.id)}`];
      if (typeof item === "object" && item !== null && "id" in item && Number.isInteger(Number(item.id))) return [`#${Number(item.id)}`];
      return [];
    });
  } catch { return []; }
};
const sourceLabel = (ref: string) => {
  const [kind, id, field] = ref.split(":");
  if (kind === "product" || kind === "catalogue_item") return `Product/service #${id}`;
  if (kind === "faq") return `FAQ #${id}`;
  if (kind === "brand_profile") return `Business profile #${id}`;
  if (kind === "profile") {
    const labels: Record<string, string> = { openingHours: "Business hours", deliveryAreas: "Delivery areas", locations: "Locations", contactDetails: "Contact details", paymentMethods: "Payment methods", orderInstructions: "Order instructions", policies: "Policies", description: "Business description", industry: "Business type", websiteUrl: "Website", businessName: "Business name" };
    return `${labels[field] ?? "Business information"} #${id}`;
  }
  return ref;
};
const parseLeadData = (value: string) => {
  try {
    const parsed: unknown = JSON.parse(value);
    return typeof parsed === "object" && parsed !== null ? parsed as TestResult["leadData"] : {} as TestResult["leadData"];
  } catch { return {} as TestResult["leadData"]; }
};

export default function ReceptionistPanel({ data }: { data: SetupData }) {
  const utils = trpc.useUtils();
  const [message, setMessage] = useState("");
  const [latest, setLatest] = useState<TestResult | null>(null);
  const test = trpc.workspace.testReceptionist.useMutation({
    onSuccess: async result => { setLatest(result); await utils.workspace.setup.invalidate(); },
    onError: error => toast.error(error.message || "The receptionist test failed. Your message was not sent."),
  });
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!message.trim()) return;
    test.mutate({ message: message.trim() });
  };

  return (
    <div className="owner-panel-stack">
      <section className="owner-card owner-test-card">
        <div className="owner-card-heading"><div><p className="owner-eyebrow">STEP 03 · AI RECEPTIONIST</p><h2>Test your receptionist</h2><p>Ask as a customer. Relay uses only saved, owner-approved details from {data.brand?.name ?? "your business"}.</p></div><span className="owner-test-ready"><Sparkles size={14} /> SERVER-SIDE AI</span></div>
        <div className="owner-test-warning"><ShieldCheck size={17} /><span>Test drafts stay in this workspace. Nothing is sent to Instagram, WhatsApp, or a customer.</span></div>
        <div className="owner-test-body">
          <div className="owner-message-prompt"><span className="owner-message-avatar"><UserRound size={17} /></span><div><strong>Customer message</strong><small>Try a question that your business information can answer.</small></div></div>
          <form onSubmit={submit} className="owner-test-form">
            <textarea className="owner-input owner-test-input" value={message} onChange={event => setMessage(event.target.value)} placeholder="Type a customer question…" maxLength={3000} required />
            <div className="owner-test-form-footer"><span>{message.length}/3000 characters</span><button className="relay-button relay-button-primary" disabled={test.isPending || !message.trim()}>{test.isPending ? <><Loader2 className="owner-spin" size={16} /> Testing…</> : <><Send size={15} /> Test response</>}</button></div>
          </form>
          <div className="owner-sample-prompts"><span>Try:</span>{["What are your opening hours?", "How do I place an order?", "Can I speak to someone?"].map(prompt => <button type="button" key={prompt} onClick={() => setMessage(prompt)}>{prompt} <ArrowUpRight size={12} /></button>)}</div>
        </div>
      </section>

      {latest && <ResultCard result={latest} />}

      <section className="owner-card">
        <div className="owner-card-heading"><div><p className="owner-eyebrow">RECENT TESTS</p><h2>Test history</h2><p>Recent drafts and safe handoffs from your workspace.</p></div></div>
        {data.aiRuns.length === 0 ? <div className="owner-empty-inline"><CircleHelp size={18} /><span>Your test history will appear here after the first run.</span></div> : <div className="owner-test-history">{data.aiRuns.map(run => {
          const result = { decision: run.decision, replyDraft: run.replyDraft, confidence: run.confidence, intent: run.intent, missingInformation: parseArray(run.missingInformation), leadData: parseLeadData(run.leadData), internalReason: run.internalReason, sourceRefs: parseSourceRefs(run.sourceRecords), mode: run.mode, model: run.model } as TestResult;
          return <article className="owner-history-row" key={run.id}><div className={`owner-decision-badge owner-decision-${run.decision.toLowerCase()}`}>{run.decision}</div><div className="owner-history-main"><strong>{run.customerMessage}</strong><p>{run.replyDraft}</p><small>{run.mode === "fallback" ? "Safe fallback · model output not used" : run.mode === "safety_rule" ? "Safety rule · human review required" : `AI draft · ${run.model}`} · {run.promptVersion} · {new Date(run.createdAt).toLocaleString()}</small></div><button className="owner-history-open" type="button" onClick={() => setLatest(result)} aria-label="View saved test details"><ArrowUpRight size={15} /></button></article>;
        })}</div>}
      </section>
    </div>
  );
}

function ResultCard({ result }: { result: TestResult }) {
  const Icon = result.decision === "ANSWER" ? Check : result.decision === "ASK" ? CircleHelp : AlertTriangle;
  const missing = result.missingInformation;
  const leadFields = Object.entries(result.leadData).filter(([, value]) => value.trim());
  return (
    <section className={`owner-card owner-result owner-result-${result.decision.toLowerCase()}`} aria-live="polite">
      <div className="owner-result-heading"><div className={`owner-decision-badge owner-decision-${result.decision.toLowerCase()}`}><Icon size={14} /> {decisionLabel[result.decision].toUpperCase()}</div><span className="owner-result-mode">{result.mode === "llm" ? <><Bot size={13} /> AI · {result.model}</> : result.mode === "safety_rule" ? <><ShieldCheck size={13} /> SAFETY RULE</> : <><AlertTriangle size={13} /> SAFE FALLBACK</>}</span></div>
      <div className="owner-result-body"><p className="owner-eyebrow">DRAFT PREVIEW · NOT SENT</p><p className="owner-reply-draft">{result.replyDraft}</p><div className="owner-result-meta"><span>Confidence <strong>{result.confidence}%</strong></span><span>Intent <strong>{result.intent}</strong></span></div>
        {missing.length > 0 && <div className="owner-result-detail"><strong>Missing information</strong><ul>{missing.map((item, index) => <li key={`${item}-${index}`}>{item}</li>)}</ul></div>}
        {leadFields.length > 0 && <div className="owner-result-detail"><strong>Lead details captured</strong><ul>{leadFields.map(([key, value]) => <li key={key}>{key}: {value}</li>)}</ul></div>}
        <div className="owner-result-detail"><strong>Internal reason</strong><p>{result.internalReason}</p></div>
        {result.sourceRefs.length > 0 && <div className="owner-source-list"><ShieldCheck size={14} /><span>Approved sources: {result.sourceRefs.map(sourceLabel).join(", ")}</span></div>}
      </div>
    </section>
  );
}
