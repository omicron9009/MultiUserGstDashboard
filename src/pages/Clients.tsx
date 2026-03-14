import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { authApi } from "@/services/api";
import { StatusBadge } from "@/components/StatusBadge";
import { Search, RefreshCw, ExternalLink, Plus, Users } from "lucide-react";
import { toast } from "sonner";

interface ClientSession {
  gstin: string;
  active: boolean;
  username?: string;
  token_expiry?: string;
  session_expiry?: string;
  last_refresh?: string;
}

// Demo GSTINs for when the backend isn't connected
const DEMO_CLIENTS: ClientSession[] = [
  { gstin: "27AABFP2335E1ZM", active: true, username: "demo_user", token_expiry: new Date(Date.now() + 3600000).toISOString(), last_refresh: new Date().toISOString() },
  { gstin: "29AAGCR4375J1ZU", active: false, username: "client2" },
  { gstin: "07AAACN0375P1ZT", active: true, username: "client3", token_expiry: new Date(Date.now() + 7200000).toISOString(), last_refresh: new Date(Date.now() - 3600000).toISOString() },
];

export default function ClientsPage() {
  const navigate = useNavigate();
  const [clients, setClients] = useState<ClientSession[]>(DEMO_CLIENTS);
  const [search, setSearch] = useState("");
  const [refreshingGstin, setRefreshingGstin] = useState<string | null>(null);

  const filtered = clients.filter(
    (c) =>
      c.gstin.toLowerCase().includes(search.toLowerCase()) ||
      c.username?.toLowerCase().includes(search.toLowerCase())
  );

  const handleRefresh = async (gstin: string) => {
    setRefreshingGstin(gstin);
    try {
      await authApi.refreshSession(gstin);
      toast.success(`Session refreshed for ${gstin}`);
      // Re-fetch session status
      const session = await authApi.getSession(gstin);
      setClients((prev) =>
        prev.map((c) => (c.gstin === gstin ? { ...c, ...session } : c))
      );
    } catch (err: any) {
      toast.error(err.message || "Refresh failed");
    } finally {
      setRefreshingGstin(null);
    }
  };

  return (
    <div className="p-6 lg:p-8 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Clients</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {clients.length} client{clients.length !== 1 ? "s" : ""} managed
          </p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
          <Plus className="w-4 h-4" />
          Add Client
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by GSTIN or name..."
          className="w-full pl-10 pr-4 py-2.5 rounded-md border border-input bg-card text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      {/* Client Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((client) => (
          <div
            key={client.gstin}
            className="glass-card p-5 hover:shadow-md transition-shadow group"
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="font-mono text-sm font-semibold text-foreground">{client.gstin}</p>
                {client.username && (
                  <p className="text-xs text-muted-foreground mt-0.5">{client.username}</p>
                )}
              </div>
              <StatusBadge
                status={client.active ? "active" : "expired"}
                label={client.active ? "Active" : "Expired"}
              />
            </div>

            {client.last_refresh && (
              <p className="text-xs text-muted-foreground mb-4">
                Last refresh: {new Date(client.last_refresh).toLocaleString("en-IN")}
              </p>
            )}

            <div className="flex items-center gap-2 pt-3 border-t border-border">
              <button
                onClick={() => navigate(`/client/${client.gstin}`)}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-md text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                <ExternalLink className="w-3 h-3" />
                Dashboard
              </button>
              <button
                onClick={() => handleRefresh(client.gstin)}
                disabled={refreshingGstin === client.gstin}
                className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-md text-xs font-medium border border-border text-foreground hover:bg-muted transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-3 h-3 ${refreshingGstin === client.gstin ? "animate-spin" : ""}`} />
                Refresh
              </button>
            </div>
          </div>
        ))}
      </div>

      {!filtered.length && (
        <div className="text-center py-16">
          <Users className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No clients found</p>
        </div>
      )}
    </div>
  );
}
