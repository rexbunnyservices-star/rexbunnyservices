import { useState, useEffect } from "preact/hooks";

const API_BASE = "/api/n8n-leads";
const PIN = "9690";

interface WebsiteLead {
  id: string;
  name: string;
  email: string;
  website: string;
  auditScore: { performanceScore?: number; seoScore?: number; accessibilityScore?: number; bestPracticesScore?: number } | null;
  aiVisibility: { aiVisibilityScore?: number; hasLlmsTxt?: boolean; hasStructuredData?: boolean } | null;
  score: number;
  status: string;
  source: string;
  serviceInterest: string;
  created: string;
  updated: string;
}

interface Prospect {
  id: string;
  name: string;
  address: string;
  placeId: string;
  rating: number;
  totalRatings: number;
  businessType: string;
  website: string;
  phoneNumber: string;
  lat: number;
  lng: number;
  searchQuery: string;
  niche: string;
  source: string;
  status: string;
  aiScore: number;
  painPoints: string;
  valueProposition: string;
  personalizedEmail: string;
  emailSubject: string;
  campaignStatus: string;
  followUpCount: number;
  created: string;
  updated: string;
}

type Tab = "leads" | "prospects";

const leadStatusColors: Record<string, string> = {
  new: "bg-blue-600/20 text-blue-400",
  pending: "bg-yellow-600/20 text-yellow-400",
  running: "bg-cyan-600/20 text-cyan-400",
  completed: "bg-green-600/20 text-green-400",
  contacted: "bg-purple-600/20 text-purple-400",
  qualified: "bg-emerald-600/20 text-emerald-400",
  converted: "bg-brand-600/20 text-brand-400",
  lost: "bg-red-600/20 text-red-400",
};

const prospectStatusColors: Record<string, string> = {
  discovered: "bg-blue-600/20 text-blue-400",
  enriched: "bg-cyan-600/20 text-cyan-400",
  qualified: "bg-green-600/20 text-green-400",
  low_priority: "bg-yellow-600/20 text-yellow-400",
  contacted: "bg-purple-600/20 text-purple-400",
  responded: "bg-emerald-600/20 text-emerald-400",
  converted: "bg-brand-600/20 text-brand-400",
  replied: "bg-emerald-600/20 text-emerald-400",
  booked: "bg-brand-600/20 text-brand-400",
  unsubscribed: "bg-red-600/20 text-red-400",
};

function StatusBadge({ status, colors }: { status: string; colors: Record<string, string> }) {
  return (
    <span class={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${colors[status] || "bg-dark-700 text-dark-300"}`}>
      {status?.replace(/_/g, " ") || "—"}
    </span>
  );
}

function MetricCard({ value, label, color = "text-brand-400" }: { value: number | string; label: string; color?: string }) {
  return (
    <div class="rounded-xl border border-dark-800 bg-dark-900 p-4 text-center">
      <div class={`text-2xl font-bold ${color}`}>{value}</div>
      <div class="text-xs text-dark-400 mt-1">{label}</div>
    </div>
  );
}

function exportCSV<T extends Record<string, unknown>>(rows: T[], filename: string) {
  if (!rows.length) return;
  const keys = Object.keys(rows[0]);
  const csvRows = [
    keys.join(","),
    ...rows.map((r) =>
      keys
        .map((k) => {
          const v = r[k];
          const s = v === null || v === undefined ? "" : String(v);
          return s.includes(",") || s.includes('"') || s.includes("\n") ? `"${s.replace(/"/g, '""')}"` : s;
        })
        .join(",")
    ),
  ];
  const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function PinGate({ onUnlock }: { onUnlock: () => void }) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);

  const handleSubmit = () => {
    if (pin === PIN) {
      sessionStorage.setItem("dash_auth", "1");
      onUnlock();
    } else {
      setError(true);
      setPin("");
    }
  };

  return (
    <div class="flex min-h-[400px] items-center justify-center">
      <div class="w-full max-w-sm rounded-xl border border-dark-800 bg-dark-900 p-8 text-center">
        <div class="mb-4 text-4xl">🔒</div>
        <h2 class="mb-2 text-lg font-bold text-white">Admin Access</h2>
        <p class="mb-6 text-sm text-dark-400">Enter your PIN to access the dashboard.</p>
        <input
          type="password"
          maxlength={4}
          value={pin}
          onInput={(e) => { setPin((e.target as HTMLInputElement).value); setError(false); }}
          onKeyDown={(e) => { if (e.key === "Enter") handleSubmit(); }}
          placeholder="••••"
          class="mb-4 w-full rounded-lg border border-dark-700 bg-dark-800 px-4 py-3 text-center text-2xl tracking-[0.5em] text-white placeholder-dark-600 focus:border-brand-500 focus:outline-none"
          autoFocus
        />
        {error && <p class="mb-4 text-sm text-red-400">Wrong PIN. Try again.</p>}
        <button
          onClick={handleSubmit}
          class="w-full rounded-lg bg-brand-600 px-4 py-3 font-semibold text-white transition-colors hover:bg-brand-500"
        >
          Enter Dashboard
        </button>
      </div>
    </div>
  );
}

export default function MainDashboard() {
  const [authed, setAuthed] = useState(false);
  const [tab, setTab] = useState<Tab>("leads");
  const [leads, setLeads] = useState<WebsiteLead[]>([]);
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [leadFilter, setLeadFilter] = useState("all");
  const [prospectFilter, setProspectFilter] = useState("all");

  useEffect(() => {
    if (sessionStorage.getItem("dash_auth") === "1") setAuthed(true);
  }, []);

  useEffect(() => {
    if (authed) loadAll();
  }, [authed]);

  async function loadAll() {
    setLoading(true);
    setError("");
    try {
      const [leadsRes, pbRes] = await Promise.allSettled([
        fetch(`${API_BASE}?collection=leads&limit=500`),
        fetch(`${API_BASE}?collection=prospects&limit=500`),
      ]);

      if (leadsRes.status === "fulfilled" && leadsRes.value.ok) {
        const d = await leadsRes.value.json();
        setLeads(d.items || []);
      }

      if (pbRes.status === "fulfilled" && pbRes.value.ok) {
        const d = await pbRes.value.json();
        setProspects(d.items || []);
      }

      if (leadsRes.status === "rejected" && pbRes.status === "rejected") {
        throw new Error("Failed to load data from both sources");
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  const filteredLeads = leads.filter((l) => {
    if (leadFilter !== "all" && l.status !== leadFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        (l.name || "").toLowerCase().includes(q) ||
        (l.email || "").toLowerCase().includes(q) ||
        (l.website || "").toLowerCase().includes(q)
      );
    }
    return true;
  });

  const filteredProspects = prospects.filter((p) => {
    if (prospectFilter !== "all" && p.status !== prospectFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        (p.name || "").toLowerCase().includes(q) ||
        (p.businessType || "").toLowerCase().includes(q) ||
        (p.address || "").toLowerCase().includes(q) ||
        (p.website || "").toLowerCase().includes(q)
      );
    }
    return true;
  });

  const leadStats = {
    total: leads.length,
    new: leads.filter((l) => l.status === "new" || !l.status).length,
    pending: leads.filter((l) => l.status === "pending").length,
    running: leads.filter((l) => l.status === "running").length,
    completed: leads.filter((l) => l.status === "completed").length,
    contacted: leads.filter((l) => l.status === "contacted").length,
    qualified: leads.filter((l) => l.status === "qualified").length,
    converted: leads.filter((l) => l.status === "converted").length,
  };

  const prospectStats = {
    total: prospects.length,
    discovered: prospects.filter((p) => p.status === "discovered").length,
    enriched: prospects.filter((p) => p.status === "enriched").length,
    qualified: prospects.filter((p) => p.status === "qualified").length,
    lowPriority: prospects.filter((p) => p.status === "low_priority").length,
    contacted: prospects.filter((p) => p.status === "contacted").length,
    replied: prospects.filter((p) => p.status === "replied" || p.status === "responded").length,
    converted: prospects.filter((p) => p.status === "converted").length,
  };

  if (!authed) return <PinGate onUnlock={() => setAuthed(true)} />;

  return (
    <div class="space-y-6">
      {error && (
        <div class="rounded-xl border border-red-800 bg-red-900/20 p-4 text-center text-red-400">
          <p class="font-medium">Error loading data</p>
          <p class="mt-1 text-xs text-dark-400">{error}</p>
        </div>
      )}

      {/* Tab Navigation */}
      <div class="flex items-center gap-1 rounded-xl border border-dark-800 bg-dark-900 p-1">
        <button
          onClick={() => { setTab("leads"); setSearch(""); }}
          class={`flex-1 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all ${
            tab === "leads" ? "bg-brand-600 text-white" : "text-dark-400 hover:text-white"
          }`}
        >
          Website Leads <span class="ml-1 text-xs opacity-70">({leadStats.total})</span>
        </button>
        <button
          onClick={() => { setTab("prospects"); setSearch(""); }}
          class={`flex-1 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all ${
            tab === "prospects" ? "bg-brand-600 text-white" : "text-dark-400 hover:text-white"
          }`}
        >
          Lead Gen Prospects <span class="ml-1 text-xs opacity-70">({prospectStats.total})</span>
        </button>
      </div>

      {/* Search + Actions */}
      <div class="flex flex-wrap gap-3">
        <input
          type="text"
          value={search}
          onInput={(e) => setSearch((e.target as HTMLInputElement).value)}
          placeholder={tab === "leads" ? "Search name, email, website..." : "Search name, business, address..."}
          class="flex-1 rounded-lg border border-dark-700 bg-dark-900 px-4 py-2.5 text-sm text-white placeholder-dark-500 focus:border-brand-500 focus:outline-none"
        />
        <button
          onClick={loadAll}
          class="rounded-lg border border-dark-700 px-4 py-2.5 text-sm text-dark-300 hover:text-white"
        >
          Refresh
        </button>
        <button
          onClick={() => {
            if (tab === "leads") {
              exportCSV(
                filteredLeads.map((l) => ({
                  name: l.name,
                  email: l.email,
                  website: l.website,
                  score: l.score,
                  status: l.status,
                  source: l.source,
                  serviceInterest: l.serviceInterest,
                  created: l.created,
                })),
                `website-leads-${new Date().toISOString().slice(0, 10)}.csv`
              );
            } else {
              exportCSV(
                filteredProspects.map((p) => ({
                  name: p.name,
                  businessType: p.businessType,
                  address: p.address,
                  website: p.website,
                  phoneNumber: p.phoneNumber,
                  rating: p.rating,
                  aiScore: p.aiScore,
                  niche: p.niche,
                  status: p.status,
                  source: p.source,
                  searchQuery: p.searchQuery,
                  created: p.created,
                })),
                `prospects-${new Date().toISOString().slice(0, 10)}.csv`
              );
            }
          }}
          class="rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-500"
        >
          Export CSV
        </button>
      </div>

      {/* Loading */}
      {loading && <div class="p-8 text-center text-dark-400">Loading dashboard data...</div>}

      {/* ==================== WEBSITE LEADS TAB ==================== */}
      {!loading && tab === "leads" && (
        <>
          {/* Lead Metrics */}
          <div class="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-7">
            <MetricCard value={leadStats.total} label="Total" color="text-white" />
            <MetricCard value={leadStats.new} label="New" color="text-blue-400" />
            <MetricCard value={leadStats.running} label="Running" color="text-cyan-400" />
            <MetricCard value={leadStats.completed} label="Completed" color="text-green-400" />
            <MetricCard value={leadStats.contacted} label="Contacted" color="text-purple-400" />
            <MetricCard value={leadStats.qualified} label="Qualified" color="text-emerald-400" />
            <MetricCard value={leadStats.converted} label="Converted" color="text-brand-400" />
          </div>

          {/* Lead Filter */}
          <div class="flex flex-wrap gap-2">
            {["all", "new", "pending", "running", "completed", "contacted", "qualified", "converted", "lost"].map((f) => (
              <button
                key={f}
                onClick={() => setLeadFilter(f)}
                class={`rounded-full px-3 py-1 text-xs font-medium transition-all ${
                  leadFilter === f ? "bg-brand-600 text-white" : "border border-dark-700 text-dark-400 hover:text-white"
                }`}
              >
                {f === "all" ? `All (${leadStats.total})` : f}
              </button>
            ))}
          </div>

          {/* Leads Table */}
          <div class="rounded-xl border border-dark-800 bg-dark-900">
            {filteredLeads.length === 0 ? (
              <div class="p-8 text-center text-dark-400">
                <p>No website leads found</p>
                <p class="mt-1 text-xs text-dark-500">Leads will appear when visitors submit the AI Visibility Audit form</p>
              </div>
            ) : (
              <div class="overflow-x-auto">
                <table class="w-full text-left text-sm">
                  <thead>
                    <tr class="border-b border-dark-800 text-xs uppercase text-dark-400">
                      <th class="px-4 py-3">Name</th>
                      <th class="px-4 py-3">Email</th>
                      <th class="px-4 py-3">Website</th>
                      <th class="px-4 py-3">Score</th>
                      <th class="px-4 py-3">AI Visibility</th>
                      <th class="px-4 py-3">Status</th>
                      <th class="px-4 py-3">Service</th>
                      <th class="px-4 py-3">Date</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-dark-800">
                    {filteredLeads.map((lead) => (
                      <tr key={lead.id} class="hover:bg-dark-800/50">
                        <td class="px-4 py-3 font-medium text-white">{lead.name || "—"}</td>
                        <td class="px-4 py-3 text-dark-300">{lead.email || "—"}</td>
                        <td class="px-4 py-3">
                          {lead.website ? (
                            <a
                              href={lead.website.startsWith("http") ? lead.website : `https://${lead.website}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              class="text-brand-400 hover:underline text-xs"
                            >
                              {(() => { try { return new URL(lead.website.startsWith("http") ? lead.website : `https://${lead.website}`).hostname; } catch { return lead.website; } })()}
                            </a>
                          ) : (
                            <span class="text-dark-500">—</span>
                          )}
                        </td>
                        <td class="px-4 py-3">
                          {lead.score ? (
                            <span class={`font-bold ${lead.score >= 70 ? "text-green-400" : lead.score >= 40 ? "text-yellow-400" : "text-red-400"}`}>
                              {lead.score}
                            </span>
                          ) : (
                            <span class="text-dark-500">—</span>
                          )}
                        </td>
                        <td class="px-4 py-3">
                          {lead.aiVisibility?.aiVisibilityScore != null ? (
                            <span class={`font-bold ${lead.aiVisibility.aiVisibilityScore >= 70 ? "text-green-400" : lead.aiVisibility.aiVisibilityScore >= 40 ? "text-yellow-400" : "text-red-400"}`}>
                              {lead.aiVisibility.aiVisibilityScore}
                            </span>
                          ) : (
                            <span class="text-dark-500">—</span>
                          )}
                        </td>
                        <td class="px-4 py-3">
                          <StatusBadge status={lead.status || "new"} colors={leadStatusColors} />
                        </td>
                        <td class="px-4 py-3 text-dark-300">{lead.serviceInterest || "—"}</td>
                        <td class="px-4 py-3 text-xs text-dark-400">
                          {lead.created ? new Date(lead.created).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* ==================== PROSPECTS TAB ==================== */}
      {!loading && tab === "prospects" && (
        <>
          {/* Prospect Metrics */}
          <div class="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-7">
            <MetricCard value={prospectStats.total} label="Total" color="text-white" />
            <MetricCard value={prospectStats.discovered} label="Discovered" color="text-blue-400" />
            <MetricCard value={prospectStats.enriched} label="Enriched" color="text-cyan-400" />
            <MetricCard value={prospectStats.qualified} label="Qualified" color="text-green-400" />
            <MetricCard value={prospectStats.lowPriority} label="Low Priority" color="text-yellow-400" />
            <MetricCard value={prospectStats.contacted} label="Contacted" color="text-purple-400" />
            <MetricCard value={prospectStats.replied} label="Replied" color="text-emerald-400" />
          </div>

          {/* Prospect Filter */}
          <div class="flex flex-wrap gap-2">
            {["all", "discovered", "enriched", "qualified", "low_priority", "contacted", "replied", "converted"].map((f) => (
              <button
                key={f}
                onClick={() => setProspectFilter(f)}
                class={`rounded-full px-3 py-1 text-xs font-medium transition-all ${
                  prospectFilter === f ? "bg-brand-600 text-white" : "border border-dark-700 text-dark-400 hover:text-white"
                }`}
              >
                {f === "all" ? `All (${prospectStats.total})` : f.replace(/_/g, " ")}
              </button>
            ))}
          </div>

          {/* Prospects Table */}
          <div class="rounded-xl border border-dark-800 bg-dark-900">
            {filteredProspects.length === 0 ? (
              <div class="p-8 text-center text-dark-400">
                <p>No prospects found</p>
                <p class="mt-1 text-xs text-dark-500">Prospects will appear after WF 01 discovers them via Geoapify</p>
              </div>
            ) : (
              <div class="overflow-x-auto">
                <table class="w-full text-left text-sm">
                  <thead>
                    <tr class="border-b border-dark-800 text-xs uppercase text-dark-400">
                      <th class="px-4 py-3">Name</th>
                      <th class="px-4 py-3">Type</th>
                      <th class="px-4 py-3">Address</th>
                      <th class="px-4 py-3">Rating</th>
                      <th class="px-4 py-3">AI Score</th>
                      <th class="px-4 py-3">Niche</th>
                      <th class="px-4 py-3">Status</th>
                      <th class="px-4 py-3">Website</th>
                      <th class="px-4 py-3">Date</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-dark-800">
                    {filteredProspects.map((p) => (
                      <tr key={p.id} class="hover:bg-dark-800/50">
                        <td class="px-4 py-3 font-medium text-white">{p.name || "—"}</td>
                        <td class="px-4 py-3 text-dark-300">{p.businessType || "—"}</td>
                        <td class="px-4 py-3 max-w-[200px] truncate text-dark-300" title={p.address}>{p.address || "—"}</td>
                        <td class="px-4 py-3">
                          {p.rating ? (
                            <span class={`font-bold ${p.rating >= 4 ? "text-green-400" : p.rating >= 3 ? "text-yellow-400" : "text-red-400"}`}>
                              {p.rating} ★
                            </span>
                          ) : (
                            <span class="text-dark-500">—</span>
                          )}
                        </td>
                        <td class="px-4 py-3">
                          {p.aiScore ? (
                            <span class={`font-bold ${p.aiScore >= 70 ? "text-green-400" : p.aiScore >= 50 ? "text-yellow-400" : "text-red-400"}`}>
                              {p.aiScore}
                            </span>
                          ) : (
                            <span class="text-dark-500">—</span>
                          )}
                        </td>
                        <td class="px-4 py-3 text-dark-300">{p.niche || "—"}</td>
                        <td class="px-4 py-3">
                          <StatusBadge status={p.status} colors={prospectStatusColors} />
                        </td>
                        <td class="px-4 py-3">
                          {p.website ? (
                            <a
                              href={p.website.startsWith("http") ? p.website : `https://${p.website}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              class="text-brand-400 hover:underline text-xs"
                            >
                              {(() => { try { return new URL(p.website.startsWith("http") ? p.website : `https://${p.website}`).hostname; } catch { return p.website; } })()}
                            </a>
                          ) : (
                            <span class="text-dark-500">—</span>
                          )}
                        </td>
                        <td class="px-4 py-3 text-xs text-dark-400">
                          {p.created ? new Date(p.created).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* Footer info */}
      {!loading && (
        <div class="text-center text-xs text-dark-500">
          {tab === "leads"
            ? `Showing ${filteredLeads.length} of ${leadStats.total} website leads`
            : `Showing ${filteredProspects.length} of ${prospectStats.total} prospects`
          }
          <span class="mx-2">·</span>
          <span>Last refreshed: {new Date().toLocaleTimeString()}</span>
          <span class="mx-2">·</span>
          <button onClick={() => { sessionStorage.removeItem("dash_auth"); setAuthed(false); }} class="text-dark-500 hover:text-red-400">Lock Dashboard</button>
        </div>
      )}
    </div>
  );
}
