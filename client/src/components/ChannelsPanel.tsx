import { useState } from "react";
import { Check, Instagram, MessageCircle, Radio, ShieldAlert, Unplug } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "../../../server/routers";

type SetupData = inferRouterOutputs<AppRouter>["workspace"]["setup"];

export default function ChannelsPanel({ data }: { data: SetupData }) {
  const utils = trpc.useUtils();
  const [pending, setPending] = useState<string | null>(null);
  const update = trpc.workspace.setSimulatedChannel.useMutation({
    onSuccess: async result => {
      setPending(null);
      toast.success(result?.status === "simulated_connected" ? "Simulation connected." : "Simulation disconnected.");
      await utils.workspace.setup.invalidate();
    },
    onError: error => { setPending(null); toast.error(error.message || "Channel state could not be updated."); },
  });
  const getConnection = (provider: "instagram" | "whatsapp") => data.channels.find(row => row.provider === provider);
  const cards = [
    { provider: "instagram" as const, name: "Instagram", description: "Preview how a social messaging channel could appear in Relay.", Icon: Instagram },
    { provider: "whatsapp" as const, name: "WhatsApp", description: "Preview a familiar messaging channel in your owner workspace.", Icon: MessageCircle },
  ];

  return (
    <div className="owner-panel-stack">
      <section className="owner-card">
        <div className="owner-card-heading"><div><p className="owner-eyebrow">STEP 02 · CHANNELS</p><h2>Choose the channels to prepare for</h2><p>You can simulate Instagram, WhatsApp, or both independently.</p></div><span className="owner-simulated-pill"><Radio size={13} /> SIMULATION</span></div>
        <div className="owner-warning"><ShieldAlert size={18} /><p><strong>These are simulated connections.</strong> No Instagram or WhatsApp account is linked, no credentials are stored, and no customer messages are read or sent.</p></div>
        <div className="owner-channel-grid">
          {cards.map(({ provider, name, description, Icon }) => {
            const connection = getConnection(provider);
            const connected = connection?.status === "simulated_connected";
            const isPending = pending === provider && update.isPending;
            return (
              <article className="owner-channel-card" key={provider}>
                <div className="owner-channel-card-head"><span className={`owner-channel-icon owner-channel-${provider}`}><Icon size={21} /></span><span className={connected ? "owner-status-chip is-simulated" : "owner-status-chip"}>{connected ? <><Check size={12} /> Simulated</> : "Not connected"}</span></div>
                <h3>{name}</h3><p>{description}</p>
                <button className={connected ? "relay-button relay-button-secondary" : "relay-button relay-button-primary"} disabled={isPending} onClick={() => { setPending(provider); update.mutate({ provider, connected: !connected }); }}>
                  {connected ? <><Unplug size={15} /> {isPending ? "Updating…" : "Disconnect simulation"}</> : <><Check size={15} /> {isPending ? "Connecting…" : "Try simulated connection"}</>}
                </button>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}
