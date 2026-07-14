import { useState, useEffect } from "preact/hooks";

const PB_URL = import.meta.env.PUBLIC_POCKETBASE_URL || "https://pb.rexbunnyservices.online";

interface Lead {
  id: string;
  email: string;
  website: string;
  name: string;
  status: string;
  source: string;
  score: number;
  serviceInterest: string;
  auditScore: { performanceScore?: number; seoScore?: number } | null;
  aiVisibility: { aiVisibilityScore?: number } | null;
  created: string;
  updated: string;
}

interface Stats {
  total: number;
  new: number;
  pending: number;
  running: number;
  completed: number;
  contacted: number;
  converted: number;
  lost: number;
}

const statusColors: Record<string, string> = {
  new: "bg-blue-600/20 text-blue-400",
  pending: "bg-yellow-600/20 text-yellow-400",
  running: "bg-orange-600/20 text-orange-400",
  completed: "bg-green-600/20 text-green-400",
  contacted: "bg-purple-600/20 text-purple-400",
  qualified: "bg-emerald-600/20 text-emerald-400",
  converted: "bg-brand-600/20 text-brand-400",
  lost: "bg-red-600/20 text-red-400",
};

function StatusBadge({ status }: { status: string }) {
  return (
    <span class={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[status] || "bg-dark-700 text-dark-300"}`}>
      {status}
    </span>
  );
}

function ScoreDisplay({ label, value, max }: { label: string; value: number | undefined; max: number }) {
  if (value === undefined || value === null) {
    return <span class="text-dark-500">--</span>;
  }
  const pct = Math.round((value / max) * 100);
  const color = pct >= 80 ? "text-green-400" : pct >= 50 ? "text-yellow-400" : "text-red-400";
  return (
    <div class="text-center">
      <div class={`text-lg font-bold ${color}`}>{value}</div>
      <div class="text-[10px] text-dark-500">{label}</div>
    </div>
  );
}

export default function LeadsDashboard() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    fetchLeads();
  }, []);

  async function fetchLeads() {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("pb_token");
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(`${PB_URL}/api/collections/leads/records?sort=-created&perPage=100`, { headers });
      if (!res.ok) throw new Error(`PocketBase returned ${res.status}`);
      const data = await res.json();
      setLeads(data.items || []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(leadId: string, newStatus: string) {
    setUpdating(leadId);
    try {
      const token = localStorage.getItem("pb_token");
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(`${PB_URL}/api/collections/leads/records/${leadId}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error("Update failed");
      setLeads((prev) => prev.map((l) => (l.id === leadId ? { ...l, status: newStatus } : l)));
    } catch (e: any) {
      alert(`Error: ${e.message}`);
    } finally {
      setUpdating(null);
    }
  }

  const filtered = leads.filter((l) => {
    if (filter !== "all" && l.status !== filter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        l.email?.toLowerCase().includes(q) ||
        l.website?.toLowerCase().includes(q) ||
        l.name?.toLowerCase().includes(q) ||
        l.source?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const stats: Stats = {
    total: leads.length,
    new: leads.filter((l) => l.status === "new").length,
    pending: leads.filter((l) => l.status === "pending").length,
    running: leads.filter((l) => l.status === "running").length,
    completed: leads.filter((l) => l.status === "completed").length,
    contacted: leads.filter((l) => l.status === "contacted").length,
    converted: leads.filter((l) => l.status === "converted").length,
    lost: leads.filter((l) => l.status === "lost").length,
  };

  return (
    <div class="space-y-6">
      {error && (
        <div class="rounded-xl border border-red-800 bg-red-900/20 p-4 text-center text-red-400">
          <p class="font-medium">Could not load leads</p>
          <p class="mt-1 text-xs text-dark-400">{error}</p>
          <p class="mt-2 text-xs text-dark-500">Make sure PocketBase is accessible at {PB_URL}</p>
        </div>
      )}

      {/* Stats Grid */}
      <div class="grid grid-cols-4 gap-3 md:grid-cols-8">
        {[
          { label: "Total", value: stats.total, color: "text-white" },
          { label: "New", value: stats.new, color: "text-blue-400" },
          { label: "Pending", value: stats.pending, color: "text-yellow-400" },
          { label: "Running", value: stats.running, color: "text-orange-400" },
          { label: "Completed", value: stats.completed, color: "text-green-400" },
          { label: "Contacted", value: stats.contacted, color: "text-purple-400" },
          { label: "Converted", value: stats.converted, color: "text-brand-400" },
          { label: "Lost", value: stats.lost, color: "text-red-400" },
        ].map((s) => (
          <button
            key={s.label}
            onClick={() => setFilter(filter === s.label.toLowerCase() && s.label !== "Total" ? "all" : s.label.toLowerCase() === "total" ? "all" : s.label.toLowerCase())}
            class={`rounded-xl border p-3 text-center transition-all ${
              (s.label === "Total" && filter === "all") || filter === s.label.toLowerCase()
                ? "border-brand-500/50 bg-brand-950/30"
                : "border-dark-800 bg-dark-900 hover:border-dark-700"
            }`}
          >
            <div class={`text-2xl font-bold ${s.color}`}>{s.value}</div>
            <div class="text-xs text-dark-400">{s.label}</div>
          </button>
        ))}
      </div>

      {/* Search */}
      <div class="flex gap-3">
        <input
          type="text"
          value={search}
          onInput={(e) => setSearch((e.target as HTMLInputElement).value)}
          placeholder="Search by email, website, name, or source..."
          class="flex-1 rounded-lg border border-dark-700 bg-dark-900 px-4 py-2.5 text-sm text-white placeholder-dark-500 focus:border-brand-500 focus:outline-none"
        />
        <button
          onClick={fetchLeads}
          class="rounded-lg border border-dark-700 px-4 py-2.5 text-sm text-dark-300 hover:text-white"
        >
          Refresh
        </button>
      </div>

      {/* Leads Table */}
      <div class="rounded-xl border border-dark-800 bg-dark-900">
        {loading ? (
          <div class="p-8 text-center text-dark-400">Loading leads...</div>
        ) : filtered.length === 0 ? (
          <div class="p-8 text-center text-dark-400">
            <p>No leads {filter !== "all" ? `with status "${filter}"` : ""}</p>
            <p class="mt-1 text-xs text-dark-500">{leads.length === 0 ? "Leads will appear here when visitors submit the audit form" : "Try a different filter or search term"}</p>
          </div>
        ) : (
          <div class="overflow-x-auto">
            <table class="w-full text-left text-sm">
              <thead>
                <tr class="border-b border-dark-800 text-xs uppercase text-dark-400">
                  <th class="px-4 py-3">Email</th>
                  <th class="px-4 py-3">Website</th>
                  <th class="px-4 py-3">Status</th>
                  <th class="px-4 py-3">Scores</th>
                  <th class="px-4 py-3">Source</th>
                  <th class="px-4 py-3">Date</th>
                  <th class="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-dark-800">
                {filtered.map((lead) => (
                  <>
                    <tr class="hover:bg-dark-800/50">
                      <td class="px-4 py-3">
                        <div class="font-medium text-white">{lead.email || <span class="text-dark-500">No email</span>}</div>
                        {lead.name && <div class="text-xs text-dark-400">{lead.name}</div>}
                      </td>
                      <td class="px-4 py-3">
                        {lead.website ? (
                          <a href={lead.website.startsWith("http") ? lead.website : `https://${lead.website}`} target="_blank" rel="noopener noreferrer" class="text-brand-400 hover:underline">
                            {lead.website}
                          </a>
                        ) : (
                          <span class="text-dark-500">--</span>
                        )}
                      </td>
                      <td class="px-4 py-3">
                        <StatusBadge status={lead.status || "new"} />
                      </td>
                      <td class="px-4 py-3">
                        <div class="flex gap-3">
                          <ScoreDisplay label="Perf" value={lead.auditScore?.performanceScore} max={100} />
                          <ScoreDisplay label="SEO" value={lead.auditScore?.seoScore} max={100} />
                          <ScoreDisplay label="AI" value={lead.aiVisibility?.aiVisibilityScore} max={100} />
                        </div>
                      </td>
                      <td class="px-4 py-3 text-dark-300">{lead.source || <span class="text-dark-500">--</span>}</td>
                      <td class="px-4 py-3 text-xs text-dark-400">
                        {lead.created ? new Date(lead.created).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "--"}
                      </td>
                      <td class="px-4 py-3">
                        <select
                          value={lead.status || "new"}
                          onChange={(e) => updateStatus(lead.id, (e.target as HTMLSelectElement).value)}
                          disabled={updating === lead.id}
                          class="rounded border border-dark-700 bg-dark-800 px-2 py-1 text-xs text-white focus:border-brand-500 focus:outline-none disabled:opacity-50"
                        >
                          {["new", "pending", "running", "completed", "contacted", "qualified", "converted", "lost"].map((s) => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      </td>
                    </tr>
                    {expandedId === lead.id && (
                      <tr>
                        <td colspan="7" class="bg-dark-800/50 px-4 py-4">
                          <div class="grid grid-cols-2 gap-4 text-xs md:grid-cols-4">
                            <div>
                              <span class="text-dark-500">ID:</span>
                              <span class="ml-2 font-mono text-dark-300">{lead.id}</span>
                            </div>
                            <div>
                              <span class="text-dark-500">Score:</span>
                              <span class="ml-2 text-white">{lead.score || 0}</span>
                            </div>
                            <div>
                              <span class="text-dark-500">Service Interest:</span>
                              <span class="ml-2 text-white">{lead.serviceInterest || "--"}</span>
                            </div>
                            <div>
                              <span class="text-dark-500">Updated:</span>
                              <span class="ml-2 text-white">{lead.updated || "--"}</span>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {leads.length > 0 && (
        <div class="text-center text-xs text-dark-500">
          Showing {filtered.length} of {leads.length} leads
        </div>
      )}
    </div>
  );
}
