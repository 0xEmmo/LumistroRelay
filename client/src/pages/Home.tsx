import { useAuth } from "@/_core/hooks/useAuth";
import RelayWordmark from "@/components/RelayWordmark";
import { startLogin } from "@/const";
import { ArrowRight, ArrowUpRight, Check, CircleHelp, MessageSquareText, ShieldCheck, UserRound } from "lucide-react";
import { Link } from "wouter";

const steps = [
  { number: "01", title: "Understand", text: "Relay starts with the information your business has approved." },
  { number: "02", title: "Draft", text: "A clear first response is prepared for your team to review." },
  { number: "03", title: "You decide", text: "Your person edits, approves, or takes over when judgment matters." },
];

export default function Home() {
  const { user } = useAuth();

  return (
    <main className="relay-home">
      <header className="relay-header">
        <Link className="relay-home-brand" href="/" aria-label="Lumistro Relay home"><RelayWordmark /></Link>
        <nav className="relay-nav" aria-label="Main navigation">
          <Link href="/demo/foodician">Foodician demo</Link>
          {user ? (
            <Link className="relay-nav-cta" href="/workspace">Open workspace <ArrowUpRight size={15} /></Link>
          ) : (
            <button className="relay-nav-cta" onClick={() => startLogin()}>Sign in <ArrowUpRight size={15} /></button>
          )}
        </nav>
      </header>

      <section className="relay-hero">
        <div className="relay-hero-copy">
          <div className="relay-kicker"><span className="relay-kicker-dot" /> YOUR BUSINESS’S FIRST RESPONSE</div>
          <h1>Reply to every customer <em>before they move on.</em></h1>
          <p className="relay-hero-lede">Relay answers customers using your actual business information, drafts safe responses for your team, captures useful enquiries, and brings in a human when it matters.</p>
          <div className="relay-hero-actions">
            <Link className="relay-button relay-button-primary" href="/demo/foodician">Try the Foodician demo <ArrowRight size={17} /></Link>
            <button className="relay-button relay-button-secondary" onClick={() => startLogin()}>Set up your brand <ArrowUpRight size={16} /></button>
          </div>
          <div className="relay-trust-line"><ShieldCheck size={16} /><span>Grounded in approved facts.</span><span className="relay-trust-separator">·</span><span>Never sends without your say.</span></div>
        </div>

        <div className="relay-hero-visual" aria-label="Illustration of a human-reviewed Relay draft">
          <div className="relay-visual-orbit relay-orbit-one" />
          <div className="relay-visual-orbit relay-orbit-two" />
          <div className="relay-preview-card">
            <div className="relay-preview-head">
              <div className="relay-preview-brand"><span className="relay-mini-mark">R</span><span>Relay workspace</span></div>
              <span className="relay-preview-private"><span /> PRIVATE</span>
            </div>
            <div className="relay-preview-divider" />
            <div className="relay-preview-label-row"><span className="relay-eyebrow">NEW ENQUIRY</span><span className="relay-preview-time">JUST NOW</span></div>
            <div className="relay-preview-message"><MessageSquareText size={16} /><span>A customer message is ready for your team.</span></div>
            <div className="relay-preview-draft">
              <div className="relay-preview-draft-head"><span className="relay-draft-mark"><Check size={13} /></span><span>REPLY DRAFT</span><span className="relay-preview-human"><UserRound size={13} /> HUMAN REVIEW</span></div>
              <p>Relay drafts from your approved business information. Your team decides what goes out.</p>
              <div className="relay-preview-actions"><span className="relay-preview-line" /><span className="relay-preview-line short" /><span className="relay-preview-lock"><ShieldCheck size={13} /> Not sent</span></div>
            </div>
            <div className="relay-preview-footer"><span className="relay-preview-avatar"><UserRound size={13} /></span><span>Your team has the final say.</span><span className="relay-preview-state"><span /> READY</span></div>
          </div>
          <div className="relay-fact-chip"><CircleHelp size={15} /><span>Approved facts only</span></div>
        </div>
      </section>

      <section className="relay-principles" id="how-it-works">
        <div className="relay-section-heading"><span className="relay-eyebrow">FAST FIRST RESPONSES. HUMAN JUDGMENT.</span><p>Built to help your team move quickly <span>without handing over the final word.</span></p></div>
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

      <section className="relay-foodician-strip">
        <div className="relay-foodician-mark">F</div>
        <div className="relay-foodician-copy"><span className="relay-eyebrow">FIRST SAMPLE BRAND</span><h2>Meet the Foodician demo workspace.</h2><p>A seeded brand identity, ready for approved business details.</p></div>
        <Link className="relay-text-link" href="/demo/foodician">Open the demo <ArrowRight size={16} /></Link>
      </section>

      <footer className="relay-footer"><Link href="/" aria-label="Lumistro Relay home"><RelayWordmark /></Link><span>Human in control. Facts in context.</span><span>© Lumistro Relay</span></footer>
    </main>
  );
}
