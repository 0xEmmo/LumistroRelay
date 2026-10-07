import RelayWordmark from "@/components/RelayWordmark";
import { startLogin } from "@/const";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, ArrowUpRight, ShieldCheck } from "lucide-react";
import { Link } from "wouter";

export default function FoodicianDemo() {
  const brandQuery = trpc.workspace.foodicianDemo.useQuery();

  return (
    <main className="demo-page">
      <header className="demo-topbar">
        <Link href="/" aria-label="Back to home"><RelayWordmark /></Link>
        <span className="demo-preview-label"><span /> FOUNDATION PREVIEW</span>
      </header>

      <section className="demo-content">
        <Link className="demo-back" href="/"><ArrowLeft size={15} /> Back to Relay</Link>
        <p className="relay-eyebrow">FOODICIAN · SAMPLE BRAND</p>
        <h1>A demo workspace,<br /><em>grounded from the start.</em></h1>
        <p className="demo-lede">This is the seeded Foodician brand identity. Relay will only answer from business details that have been explicitly approved.</p>

        {brandQuery.isLoading ? (
          <div className="demo-card demo-state" role="status"><span className="relay-spinner" /> Loading the seeded brand…</div>
        ) : brandQuery.isError ? (
          <div className="demo-card demo-state demo-error" role="alert">
            <strong>The demo record is temporarily unavailable.</strong>
            <p>Try the preview again in a moment.</p>
            <button className="relay-button relay-button-secondary" onClick={() => void brandQuery.refetch()}>Retry</button>
          </div>
        ) : !brandQuery.data ? (
          <div className="demo-card demo-state">
            <strong>Foodician’s demo record is not seeded yet.</strong>
            <p>The public preview will become available once the foundation seed has completed.</p>
          </div>
        ) : (
          <article className="demo-card">
            <div className="demo-card-top">
              <span className="brand-avatar brand-avatar-large">{brandQuery.data.name.slice(0, 1)}</span>
              <div>
                <span className="demo-card-caption">DEMO BRAND</span>
                <h2>{brandQuery.data.name}</h2>
              </div>
              <span className="demo-verified"><ShieldCheck size={15} /> Seeded</span>
            </div>
            <div className="demo-record-row">
              <span>Business website</span>
              <a href={brandQuery.data.websiteUrl ?? "https://treatsbyfoodician.com.ng/"} target="_blank" rel="noreferrer">
                treatsbyfoodician.com.ng <ArrowUpRight size={14} />
              </a>
            </div>
            <div className="demo-grounding-note">
              <ShieldCheck size={18} />
              <p><strong>No business facts are assumed.</strong> Menu prices, delivery coverage, hours, policies, and availability must be added as approved information before Relay can answer those questions.</p>
            </div>
          </article>
        )}

        <div className="demo-next-step">
          <div><span className="relay-eyebrow">HUMAN-APPROVED BY DEFAULT</span><p>The workspace is ready for business setup. The receptionist and simulated inbox follow in later build batches.</p></div>
          <button className="relay-button relay-button-primary" onClick={() => startLogin()}>Set up your brand <ArrowUpRight size={16} /></button>
        </div>
      </section>
    </main>
  );
}
