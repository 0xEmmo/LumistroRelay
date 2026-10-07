import { useAuth } from "@/_core/hooks/useAuth";
import RelayWordmark from "@/components/RelayWordmark";
import { ArrowRight, ArrowUpRight, Check, ClipboardList, Instagram, MessageCircle, ShieldCheck, Sparkles } from "lucide-react";
import { Link } from "wouter";
import "../owner-workspace.css";

const steps = [
  { number: "01", title: "Set up your brand", text: "Add the business details, products, policies and approved answers your team wants Relay to use." },
  { number: "02", title: "Choose your channels", text: "Try simulated Instagram, WhatsApp or both. These preview connections never touch a real account." },
  { number: "03", title: "Test the receptionist", text: "Ask a customer question. See an answer draft, a safe follow-up, or a clear handoff when a person is needed." },
];

export default function Home() {
  const { user } = useAuth();

  return (
    <main className="relay-home">
      <header className="relay-header">
        <Link className="relay-home-brand" href="/" aria-label="Lumistro Relay home"><RelayWordmark /></Link>
        <nav className="relay-nav" aria-label="Main navigation">
          <a href="#how-it-works">How it works</a>
          <Link className="relay-nav-cta" href="/workspace">{user ? "Open workspace" : "Owner sign in"} <ArrowUpRight size={15} /></Link>
        </nav>
      </header>

      <section className="relay-hero owner-hero">
        <div className="relay-hero-copy">
          <div className="relay-kicker"><span className="relay-kicker-dot" /> YOUR BUSINESS’S FIRST RESPONSE</div>
          <h1>Reply to every customer <em>before they move on.</em></h1>
          <p className="relay-hero-lede">Set up your business, choose the channels you want to prepare for, and test a receptionist that drafts from your approved facts—while your team stays in control.</p>
          <div className="relay-hero-actions">
            <Link className="relay-button relay-button-primary" href="/workspace">{user ? "Open your workspace" : "Set up your brand"} <ArrowRight size={17} /></Link>
            <a className="relay-button relay-button-secondary" href="#how-it-works">See how it works <ArrowUpRight size={16} /></a>
          </div>
          <div className="relay-trust-line"><ShieldCheck size={16} /><span>Approved facts only</span><span className="relay-trust-separator">·</span><span>Human approval stays visible</span></div>
        </div>

        <div className="relay-hero-visual owner-hero-visual" aria-label="Preview of a Relay owner workspace">
          <div className="relay-visual-orbit relay-orbit-one" />
          <div className="relay-visual-orbit relay-orbit-two" />
          <div className="owner-preview-card">
            <div className="owner-preview-head"><span className="relay-mini-mark">R</span><div><span className="relay-eyebrow">YOUR WORKSPACE</span><strong>Receptionist setup</strong></div><span className="owner-preview-ready"><Check size={13} /> IN CONTROL</span></div>
            <div className="owner-preview-progress"><span style={{ width: "42%" }} /></div>
            <div className="owner-preview-row"><span className="owner-preview-icon"><ClipboardList size={17} /></span><div><strong>Business facts</strong><small>Add information Relay can safely use</small></div><span className="owner-preview-step">01</span></div>
            <div className="owner-preview-row"><span className="owner-preview-icon"><MessageCircle size={17} /></span><div><strong>Channel preview</strong><small>Instagram · WhatsApp · or both</small></div><span className="owner-preview-step">02</span></div>
            <div className="owner-preview-row owner-preview-test"><span className="owner-preview-icon"><Sparkles size={17} /></span><div><strong>Test your receptionist</strong><small>Draft · ask · hand off</small></div><ArrowRight size={16} /> </div>
            <div className="owner-preview-foot"><span><Instagram size={14} /> SIMULATED</span><span><MessageCircle size={14} /> SIMULATED</span><small>No live account linked</small></div>
          </div>
        </div>
      </section>

      <section className="relay-principles" id="how-it-works">
        <div className="relay-section-heading"><span className="relay-eyebrow">A WORKSPACE YOU CAN ACTUALLY TRY</span><p>Set it up with your facts. <span>See how Relay responds before connecting a live channel.</span></p></div>
        <div className="relay-steps">
          {steps.map(step => (
            <article className="relay-step" key={step.number}>
              <span className="relay-step-number">{step.number}</span>
              <h2>{step.title}</h2>
              <p>{step.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="owner-principles-strip">
        <div><ShieldCheck size={18} /><strong>Grounded</strong><span>Uses only your saved business facts.</span></div>
        <div><MessageCircle size={18} /><strong>Clear about connections</strong><span>Simulated states are visibly labelled.</span></div>
        <div><Sparkles size={18} /><strong>Human-led</strong><span>Drafts are for testing; nothing is sent.</span></div>
      </section>

      <footer className="relay-footer"><Link href="/" aria-label="Lumistro Relay home"><RelayWordmark /></Link><span>Human in control. Facts in context.</span><span>© Lumistro Relay</span></footer>
    </main>
  );
}
