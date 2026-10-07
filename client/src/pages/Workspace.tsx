import { useAuth } from "@/_core/hooks/useAuth";
import RelayWordmark from "@/components/RelayWordmark";
import { startLogin } from "@/const";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Check, LogOut, ShieldCheck } from "lucide-react";
import { Link } from "wouter";

export default function Workspace() {
  const { user, loading, logout } = useAuth();
  const workspaceQuery = trpc.workspace.current.useQuery({}, {
    enabled: !loading && Boolean(user),
    retry: false,
  });

  if (loading) {
    return (
      <main className="relay-state-page" aria-live="polite">
        <div className="relay-state-card">
          <span className="relay-spinner" aria-hidden="true" />
          <p>Checking your secure workspace…</p>
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="relay-state-page">
        <section className="relay-state-card">
          <RelayWordmark />
          <p className="relay-eyebrow">PRIVATE WORKSPACE</p>
          <h1>Sign in to continue.</h1>
          <p>Relay keeps business information inside the workspace it belongs to.</p>
          <button className="relay-button relay-button-primary" onClick={() => startLogin()}>
            Sign in with Manus
          </button>
          <Link className="relay-back-link" href="/">Back to Lumistro Relay</Link>
        </section>
      </main>
    );
  }

  if (workspaceQuery.isLoading) {
    return (
      <main className="relay-state-page" aria-live="polite">
        <div className="relay-state-card">
          <span className="relay-spinner" aria-hidden="true" />
          <p>Loading your workspace…</p>
        </div>
      </main>
    );
  }

  if (workspaceQuery.isError) {
    return (
      <main className="relay-state-page">
        <section className="relay-state-card">
          <RelayWordmark />
          <p className="relay-eyebrow">ACCESS CHECK</p>
          <h1>We couldn’t verify this workspace.</h1>
          <p>Only an account with an explicit workspace membership can open its business records.</p>
          <div className="relay-action-row">
            <button className="relay-button relay-button-primary" onClick={() => void workspaceQuery.refetch()}>
              Try again
            </button>
            <Link className="relay-back-link" href="/">Back to home</Link>
          </div>
        </section>
      </main>
    );
  }

  const workspace = workspaceQuery.data;
  if (!workspace) {
    return (
      <main className="relay-state-page">
        <section className="relay-state-card">
          <RelayWordmark />
          <p className="relay-eyebrow">WORKSPACE</p>
          <h1>No workspace is available yet.</h1>
          <p>The demo foundation is seeded. Workspace access is granted only through an explicit owner membership.</p>
          <Link className="relay-back-link" href="/">Back to home</Link>
        </section>
      </main>
    );
  }

  return (
    <main className="workspace-page">
      <header className="workspace-topbar">
        <Link href="/" aria-label="Back to home"><RelayWordmark /></Link>
        <div className="workspace-user">
          <span>{user.name || user.email || "Workspace owner"}</span>
          <button className="workspace-signout" onClick={() => void logout()} aria-label="Sign out">
            <LogOut size={16} />
            <span>Sign out</span>
          </button>
        </div>
      </header>

      <section className="workspace-content">
        <div className="workspace-heading">
          <div>
            <p className="relay-eyebrow">YOUR BUSINESS WORKSPACE</p>
            <h1>{workspace.name}</h1>
            <p className="workspace-lede">A safe foundation for your business’s first response.</p>
          </div>
          <div className="workspace-secure-badge"><ShieldCheck size={16} /> Owner access verified</div>
        </div>

        <section className="workspace-card">
          <div className="workspace-card-head">
            <div>
              <p className="relay-eyebrow">BRAND</p>
              <h2>Your workspace brand</h2>
            </div>
            <span className="workspace-status"><Check size={14} /> Seeded</span>
          </div>
          {workspace.brands.length ? (
            <div className="workspace-brand-list">
              {workspace.brands.map(brand => (
                <article className="workspace-brand-row" key={brand.id}>
                  <span className="brand-avatar">{brand.name.slice(0, 1)}</span>
                  <div className="workspace-brand-copy">
                    <strong>{brand.name}</strong>
                    <span>{brand.websiteUrl ? "Demo brand identity connected" : "Brand identity"}</span>
                  </div>
                  <Link className="workspace-brand-link" href="/demo/foodician">View demo <ArrowLeft size={14} /></Link>
                </article>
              ))}
            </div>
          ) : (
            <div className="workspace-empty">
              <span className="workspace-empty-mark"><Check size={17} /></span>
              <div><strong>No brand record yet</strong><p>Your first brand will appear here when it is added.</p></div>
            </div>
          )}
        </section>

        <div className="workspace-note">
          <span className="workspace-note-dot" />
          <div><strong>Human in control, from the first reply.</strong><p>This foundation does not send customer messages. Approved business details and receptionist tools are added in later batches.</p></div>
        </div>
      </section>
    </main>
  );
}
