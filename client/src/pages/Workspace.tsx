import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import RelayWordmark from "@/components/RelayWordmark";
import BrandSetupPanel from "@/components/BrandSetupPanel";
import ChannelsPanel from "@/components/ChannelsPanel";
import ReceptionistPanel from "@/components/ReceptionistPanel";
import { startLogin } from "@/const";
import { trpc } from "@/lib/trpc";
import { Activity, Building2, Check, LogOut, MessageCircle, Settings2, ShieldCheck, Sparkles } from "lucide-react";
import { Link } from "wouter";
import "../owner-workspace.css";

type WorkspaceTab = "brand" | "channels" | "test";

export default function Workspace() {
  const { user, loading, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<WorkspaceTab>("brand");
  const setupQuery = trpc.workspace.setup.useQuery(undefined, { enabled: !loading && Boolean(user), retry: false });

  if (loading) return <StateCard title="Checking your session…" />;
  if (!user) {
    return <main className="relay-state-page"><section className="relay-state-card"><RelayWordmark /><p className="relay-eyebrow">OWNER WORKSPACE</p><h1>Sign in to set up your brand.</h1><p>Your business information stays inside your own private workspace.</p><button className="relay-button relay-button-primary" onClick={() => startLogin()}>Sign in with Manus</button><Link className="relay-back-link" href="/">Back to Lumistro Relay</Link></section></main>;
  }
  if (setupQuery.isLoading) return <StateCard title="Preparing your workspace…" />;
  if (setupQuery.isError || !setupQuery.data) {
    return <main className="relay-state-page"><section className="relay-state-card"><RelayWordmark /><p className="relay-eyebrow">WORKSPACE</p><h1>We couldn’t load your workspace.</h1><p>Your saved information has not been removed. Try loading it again.</p><button className="relay-button relay-button-primary" onClick={() => void setupQuery.refetch()}>Try again</button><Link className="relay-back-link" href="/">Back to home</Link></section></main>;
  }

  const data = setupQuery.data;
  const brandReady = Boolean(data.brand && data.profile);
  const channelReady = data.channels.some(channel => channel.status === "simulated_connected");
  const testReady = data.aiRuns.length > 0;
  const tabs: { id: WorkspaceTab; title: string; icon: typeof Building2; description: string; ready: boolean }[] = [
    { id: "brand", title: "Brand setup", icon: Building2, description: "Business facts, services & FAQs", ready: brandReady },
    { id: "channels", title: "Channels", icon: MessageCircle, description: "Instagram & WhatsApp preview", ready: channelReady },
    { id: "test", title: "AI receptionist", icon: Sparkles, description: "Test a safe response", ready: testReady },
  ];
  const showTab = (tab: WorkspaceTab) => {
    if ((tab === "channels" || tab === "test") && !data.brand) {
      setActiveTab("brand");
      return;
    }
    setActiveTab(tab);
  };

  return (
    <main className="owner-workspace-page">
      <header className="workspace-topbar owner-topbar">
        <Link href="/" aria-label="Back to home"><RelayWordmark /></Link>
        <div className="workspace-user"><span>{user.name || user.email || "Business owner"}</span><button className="workspace-signout" onClick={() => void logout()} aria-label="Sign out"><LogOut size={16} /><span>Sign out</span></button></div>
      </header>
      <div className="owner-dashboard-layout">
        <aside className="owner-sidebar">
          <div className="owner-sidebar-heading"><p className="owner-eyebrow">YOUR WORKSPACE</p><h2>{data.brand?.name ?? "New business"}</h2><span><ShieldCheck size={13} /> Private to your account</span></div>
          <nav className="owner-side-nav" aria-label="Workspace sections">{tabs.map(({ id, title, icon: Icon, description, ready }) => <button key={id} className={activeTab === id ? "owner-side-link is-active" : "owner-side-link"} onClick={() => showTab(id)}><Icon size={17} /><span><strong>{title}</strong><small>{description}</small></span>{ready ? <Check className="owner-side-check" size={15} /> : <span className="owner-side-step" />}</button>)}</nav>
          <div className="owner-sidebar-note"><Activity size={15} /><p><strong>Nothing is live yet.</strong><br />Channel connections are simulations, and AI output is a draft for you to inspect.</p></div>
        </aside>

        <section className="owner-main-content">
          <div className="owner-dashboard-heading"><div><p className="owner-eyebrow">LUMISTRO RELAY · OWNER CONSOLE</p><h1>{activeTab === "brand" ? (data.brand ? "Your brand, your facts." : "Let’s set up your brand.") : activeTab === "channels" ? "Prepare your channels." : "See your receptionist work."}</h1><p>{activeTab === "brand" ? "Add the information you want Relay to use. You can change it whenever your business changes." : activeTab === "channels" ? "Choose Instagram, WhatsApp, or both. These are clearly labelled simulations—not live account connections." : "Ask a customer question and inspect the draft, confidence, sources, and handoff decision."}</p></div><span className="owner-private-pill"><ShieldCheck size={14} /> OWNER WORKSPACE</span></div>

          <div className="owner-progress-strip" aria-label="Setup progress">{tabs.map((tab, index) => <button type="button" key={tab.id} className={activeTab === tab.id ? "owner-progress-step is-current" : tab.ready ? "owner-progress-step is-done" : "owner-progress-step"} onClick={() => showTab(tab.id)}><span>{tab.ready ? <Check size={13} /> : `0${index + 1}`}</span><strong>{tab.title}</strong></button>)}</div>

          {activeTab === "brand" && <BrandSetupPanel data={data} onSaved={() => void setupQuery.refetch()} />}
          {activeTab === "channels" && <ChannelsPanel data={data} />}
          {activeTab === "test" && <ReceptionistPanel data={data} />}
        </section>
      </div>
    </main>
  );
}

function StateCard({ title }: { title: string }) {
  return <main className="relay-state-page" aria-live="polite"><div className="relay-state-card"><span className="relay-spinner" aria-hidden="true" /><p>{title}</p></div></main>;
}
