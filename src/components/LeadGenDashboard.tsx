import { useState, useEffect } from "preact/hooks";

const PB_URL = "http://localhost:8090";

interface Prospect {
  id: string;
  name: string;
  email: string;
  website: string;
  niche: string;
  status: string;
  aiScore: number;
  rating: number;
  campaignStatus: string;
  followUpCount: number;
  enrichedAt: string;
  created: string;
}

interface Stats {
  total: number;
  discovered: number;
  qualified: number;
  contacted: number;
  replied: number;
  booked: number;
  lowPriority: number;
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    discovered: "bg-blue-600/20 text-blue-400",
    qualified: "bg-green-600/20 text-green-400",
    low_priority: "bg-yellow-600/20 text-yellow-400",
    contacted: "bg-purple-600/20 text-purple-400",
    replied: "bg-emerald-600/20 text-emerald-400",
    booked: "bg-brand-600/20 text-brand-400",
    unsubscribed: "bg-red-600/20 text-red-400",
  };
  return (
    <span class={`rounded-full px-2.5 py-0.5 text-xs font-medium ${colors[status] || "bg-dark-700 text-dark-300"}`}>
      {status.replace("_", " ")}
    </span>
  );
}

export default function LeadGenDashboard() {
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("dentist Chicago");
  const [activeNiche, setActiveNiche] = useState("local_business");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetchProspects();
  }, []);

  async function fetchProspects() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${PB_URL}/api/collections/prospects/records?sort=-created&perPage=50`);
      if (!res.ok) throw new Error(`PocketBase returned ${res.status}`);
      const data = await res.json();
      setProspects(data.items || []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function triggerScrape() {
    setSending(true);
    try {
      const res = await fetch("http://localhost:5678/webhook/find-leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: searchQuery, activeNiche }),
      });
      if (!res.ok) throw new Error(`n8n returned ${res.status}`);
      const data = await res.json();
      alert(`Found ${data.length || 0} prospects!`);
      fetchProspects();
    } catch (e: any) {
      alert(`Error: ${e.message}. Make sure n8n webhook is activated.`);
    } finally {
      setSending(false);
    }
  }

  const stats: Stats = {
    total: prospects.length,
    discovered: prospects.filter((p) => p.status === "discovered").length,
    qualified: prospects.filter((p) => p.status === "qualified").length,
    contacted: prospects.filter((p) => p.status === "contacted").length,
    replied: prospects.filter((p) => p.status === "replied").length,
    booked: prospects.filter((p) => p.status === "booked").length,
    lowPriority: prospects.filter((p) => p.status === "low_priority").length,
  };

  return (
    <div class="space-y-6">
      {/* Stats Grid */}
      <div class="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          { label: "Total Leads", value: stats.total, color: "text-white" },
          { label: "Discovered", value: stats.discovered, color: "text-blue-400" },
          { label: "Qualified", value: stats.qualified, color: "text-green-400" },
          { label: "Contacted", value: stats.contacted, color: "text-purple-400" },
          { label: "Replied", value: stats.replied, color: "text-emerald-400" },
          { label: "Booked", value: stats.booked, color: "text-brand-400" },
          { label: "Low Priority", value: stats.lowPriority, color: "text-yellow-400" },
        ].map((s) => (
          <div class="rounded-xl border border-dark-800 bg-dark-900 p-4 text-center">
            <div class={`text-2xl font-bold ${s.color}`}>{s.value}</div>
            <div class="text-xs text-dark-400">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Scrape Controls */}
      <div class="rounded-xl border border-dark-800 bg-dark-900 p-4">
        <h3 class="mb-3 text-sm font-bold text-white">Trigger Lead Discovery</h3>
        <div class="flex flex-wrap gap-3">
          <input
            type="text"
            value={searchQuery}
            onInput={(e) => setSearchQuery((e.target as HTMLInputElement).value)}
            placeholder='e.g. "plumber Austin"'
            class="flex-1 rounded-lg border border-dark-700 bg-dark-800 px-3 py-2 text-sm text-white placeholder-dark-500 focus:border-brand-500 focus:outline-none"
          />
          <select
            value={activeNiche}
            onChange={(e) => setActiveNiche((e.target as HTMLSelectElement).value)}
            class="rounded-lg border border-dark-700 bg-dark-800 px-3 py-2 text-sm text-white focus:border-brand-500 focus:outline-none"
          >
            <option value="local_business">Local Business</option>
            <option value="podcast_clipping">Podcast Clipping</option>
            <option value="saas_founder">SaaS Founder</option>
          </select>
          <button
            onClick={triggerScrape}
            disabled={sending}
            class="rounded-lg bg-brand-600 px-4 py-2 text-sm font-bold text-white hover:bg-brand-500 disabled:opacity-50"
          >
            {sending ? "Scraping..." : "Find Leads"}
          </button>
          <button
            onClick={fetchProspects}
            class="rounded-lg border border-dark-700 px-4 py-2 text-sm text-dark-300 hover:text-white"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Prospects Table */}
      <div class="rounded-xl border border-dark-800 bg-dark-900">
        {loading ? (
          <div class="p-8 text-center text-dark-400">Loading prospects...</div>
        ) : error ? (
          <div class="p-8 text-center text-red-400">
            <p>Could not load prospects</p>
            <p class="mt-1 text-xs text-dark-400">{error}</p>
            <p class="mt-2 text-xs text-dark-500">Make sure PocketBase is running on port 8090</p>
          </div>
        ) : prospects.length === 0 ? (
          <div class="p-8 text-center text-dark-400">
            <p>No prospects yet</p>
            <p class="mt-1 text-xs text-dark-500">Use the form above to find leads via n8n</p>
          </div>
        ) : (
          <div class="overflow-x-auto">
            <table class="w-full text-left text-sm">
              <thead>
                <tr class="border-b border-dark-800 text-xs uppercase text-dark-400">
                  <th class="px-4 py-3">Name</th>
                  <th class="px-4 py-3">Niche</th>
                  <th class="px-4 py-3">Status</th>
                  <th class="px-4 py-3">AI Score</th>
                  <th class="px-4 py-3">Rating</th>
                  <th class="px-4 py-3">Website</th>
                  <th class="px-4 py-3">Campaign</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-dark-800">
                {prospects.map((p) => (
                  <tr class="hover:bg-dark-800/50">
                    <td class="px-4 py-3 font-medium text-white">{p.name}</td>
                    <td class="px-4 py-3 text-dark-300">{p.niche}</td>
                    <td class="px-4 py-3"><StatusBadge status={p.status} /></td>
                    <td class="px-4 py-3">
                      {p.aiScore ? (
                        <span class={`font-bold ${p.aiScore >= 70 ? "text-green-400" : p.aiScore >= 50 ? "text-yellow-400" : "text-red-400"}`}>
                          {p.aiScore}
                        </span>
                      ) : (
                        <span class="text-dark-500">—</span>
                      )}
                    </td>
                    <td class="px-4 py-3 text-dark-300">{p.rating || "—"}</td>
                    <td class="px-4 py-3">
                      {p.website ? (
                        <a href={p.website} target="_blank" rel="noopener noreferrer" class="text-brand-400 hover:underline">
                          {new URL(p.website).hostname}
                        </a>
                      ) : (
                        <span class="text-dark-500">—</span>
                      )}
                    </td>
                    <td class="px-4 py-3 text-dark-300">{p.campaignStatus || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Credentials Status */}
      <div class="rounded-xl border border-dark-800 bg-dark-900 p-4">
        <h3 class="mb-2 text-sm font-bold text-white">Integration Status</h3>
        <div class="space-y-1 text-xs text-dark-400">
          <p>n8n: <span class="text-green-400" id="n8n-status">Checking...</span></p>
          <p>PocketBase: <span class="text-green-400" id="pb-status">{error ? "Error" : "Connected"}</span></p>
          <p>Active Niche: <span class="text-brand-400">{activeNiche}</span></p>
        </div>
        <p class="mt-3 text-xs text-dark-500">
          Configure: <code class="text-brand-400">lead-gen/config/niches.json</code> |
          n8n UI: <a href="http://localhost:5678" class="text-brand-400 hover:underline" target="_blank">localhost:5678</a> |
          PocketBase: <a href="http://localhost:8090/_/" class="text-brand-400 hover:underline" target="_blank">localhost:8090</a>
        </p>
      </div>
    </div>
  );
}
