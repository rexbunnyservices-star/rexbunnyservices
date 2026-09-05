import { useState, useEffect } from 'preact/hooks';

const PIN = '9690';

interface WebsiteLead {
  id: string;
  name: string;
  email: string;
  website: string;
  auditScore: {
    performanceScore?: number;
    seoScore?: number;
    accessibilityScore?: number;
    bestPracticesScore?: number;
  } | null;
  aiVisibility: {
    aiVisibilityScore?: number;
    hasLlmsTxt?: boolean;
    hasStructuredData?: boolean;
  } | null;
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
  prospectType?: string;
  webDevScore?: number;
  webDevRecommendation?: string;
  created: string;
  updated: string;
}

interface N8nWorkflow {
  id: string;
  name: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  nodes?: unknown[];
}

interface N8nExecution {
  id: string;
  workflowId: string;
  workflowData?: { name: string };
  status: string;
  finished: boolean;
  mode: string;
  startedAt: string;
  stoppedAt: string;
}

type Tab = 'overview' | 'workflows' | 'executions' | 'leads' | 'prospects' | 'bootes';

interface BootesLead {
  id: string;
  name: string;
  phoneNumber: string;
  email?: string;
  source?: string;
  status?: string;
  consent?: boolean;
  waStatus?: string;
  visitStatus?: string;
  leadInterest?: string;
  created?: string;
}

interface BootesStats {
  total: number;
  sources: { organic: number; meta_paid: number; landing: number; optin: number };
  consent: number;
  wa: { sent: number; failed: number };
  campaign: {
    email_sent: number;
    no_email_found: number;
    email_unverified: number;
    pending: number;
  };
  visits: { booked: number };
}

const leadStatusColors: Record<string, string> = {
  new: 'bg-blue-600/20 text-blue-400',
  pending: 'bg-yellow-600/20 text-yellow-400',
  running: 'bg-cyan-600/20 text-cyan-400',
  completed: 'bg-green-600/20 text-green-400',
  contacted: 'bg-purple-600/20 text-purple-400',
  qualified: 'bg-emerald-600/20 text-emerald-400',
  converted: 'bg-brand-600/20 text-brand-400',
  lost: 'bg-red-600/20 text-red-400',
};

const prospectStatusColors: Record<string, string> = {
  discovered: 'bg-blue-600/20 text-blue-400',
  enriched: 'bg-cyan-600/20 text-cyan-400',
  qualified: 'bg-green-600/20 text-green-400',
  low_priority: 'bg-yellow-600/20 text-yellow-400',
  contacted: 'bg-purple-600/20 text-purple-400',
  responded: 'bg-emerald-600/20 text-emerald-400',
  converted: 'bg-brand-600/20 text-brand-400',
  replied: 'bg-emerald-600/20 text-emerald-400',
  booked: 'bg-brand-600/20 text-brand-400',
  unsubscribed: 'bg-red-600/20 text-red-400',
  web_dev_qualified: 'bg-orange-600/20 text-orange-400',
};

function StatusBadge({ status, colors }: { status: string; colors: Record<string, string> }) {
  return (
    <span
      class={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
        colors[status] || 'bg-gray-200 text-gray-600'
      }`}
    >
      {status?.replace(/_/g, ' ') || '—'}
    </span>
  );
}

function MetricCard({
  value,
  label,
  color = 'text-brand-400',
}: {
  value: number | string;
  label: string;
  color?: string;
}) {
  return (
    <div class="rounded-xl border border-gray-200 bg-white p-4 text-center">
      <div class={`text-2xl font-bold ${color}`}>{value}</div>
      <div class="text-xs text-gray-500 mt-1">{label}</div>
    </div>
  );
}

function exportCSV<T extends Record<string, unknown>>(rows: T[], filename: string) {
  if (!rows.length) return;
  const keys = Object.keys(rows[0]);
  const csvRows = [
    keys.join(','),
    ...rows.map((r) =>
      keys
        .map((k) => {
          const v = r[k];
          const s = v === null || v === undefined ? '' : String(v);
          return s.includes(',') || s.includes('"') || s.includes('\n')
            ? `"${s.replace(/"/g, '""')}"`
            : s;
        })
        .join(','),
    ),
  ];
  const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function formatDuration(startedAt: string, stoppedAt: string): string {
  const ms = new Date(stoppedAt).getTime() - new Date(startedAt).getTime();
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`;
}

function PinGate({ onUnlock }: { onUnlock: () => void }) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  const handleSubmit = () => {
    if (pin === PIN) {
      sessionStorage.setItem('dash_auth', '1');
      onUnlock();
    } else {
      setError(true);
      setPin('');
    }
  };

  return (
    <div class="flex min-h-[400px] items-center justify-center">
      <div class="w-full max-w-sm rounded-xl border border-gray-200 bg-white p-8 text-center">
        <div class="mb-4 text-4xl">🔒</div>
        <h2 class="mb-2 text-lg font-bold text-gray-700">Admin Access</h2>
        <p class="mb-6 text-sm text-gray-500">Enter your PIN to access the dashboard.</p>
        <input
          type="password"
          maxlength={4}
          value={pin}
          onInput={(e) => {
            setPin((e.target as HTMLInputElement).value);
            setError(false);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSubmit();
          }}
          placeholder="••••"
          class="mb-4 w-full rounded-lg border border-gray-300 bg-gray-100 px-4 py-3 text-center text-2xl tracking-[0.5em] text-gray-700 placeholder-gray-400 focus:border-brand-500 focus:outline-none"
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
  const [tab, setTab] = useState<Tab>('overview');
  const [leads, setLeads] = useState<WebsiteLead[]>([]);
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [workflows, setWorkflows] = useState<N8nWorkflow[]>([]);
  const [executions, setExecutions] = useState<N8nExecution[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [leadFilter, setLeadFilter] = useState('all');
  const [prospectFilter, setProspectFilter] = useState('all');
  const [bootesLeads, setBootesLeads] = useState<BootesLead[]>([]);
  const [bootesStats, setBootesStats] = useState<BootesStats | null>(null);
  const [busyWorkflow, setBusyWorkflow] = useState<string | null>(null);
  const [selectedExec, setSelectedExec] = useState<N8nExecution | null>(null);
  const [execDetail, setExecDetail] = useState<any>(null);
  const [execLoading, setExecLoading] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem('dash_auth') === '1') setAuthed(true);
  }, []);

  useEffect(() => {
    if (authed) loadAll();
  }, [authed]);

  async function loadAll() {
    setLoading(true);
    setError('');
    const headers = { 'x-api-key': PIN };
    try {
      const [leadsRes, pbRes, wfRes, execRes, bootesRes] = await Promise.allSettled([
        fetch('/api/n8n-leads?collection=leads&limit=500', { headers }),
        fetch('/api/n8n-leads?collection=prospects&limit=500', { headers }),
        fetch('/api/n8n-data?resource=workflows-all&limit=50', { headers }),
        fetch('/api/n8n-data?resource=executions&limit=100', { headers }),
        fetch('/api/n8n-leads?stats=bootes', { headers }),
      ]);

      if (leadsRes.status === 'fulfilled' && leadsRes.value.ok) {
        const d = await leadsRes.value.json();
        setLeads(d.items || []);
      }
      if (pbRes.status === 'fulfilled' && pbRes.value.ok) {
        const d = await pbRes.value.json();
        setProspects(d.items || []);
      }
      if (wfRes.status === 'fulfilled' && wfRes.value.ok) {
        const d = await wfRes.value.json();
        setWorkflows(d.data || []);
      }
      if (execRes.status === 'fulfilled' && execRes.value.ok) {
        const d = await execRes.value.json();
        setExecutions(d.data || []);
      }
      if (bootesRes.status === 'fulfilled' && bootesRes.value.ok) {
        const d = await bootesRes.value.json();
        setBootesLeads(d.items || []);
        setBootesStats(d.stats || null);
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function toggleWorkflow(w: N8nWorkflow) {
    setBusyWorkflow(w.id);
    setError('');
    try {
      const res = await fetch('/api/n8n-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': PIN },
        body: JSON.stringify({ workflowId: w.id, active: !w.active }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || 'Toggle failed');
      setWorkflows((ws) => ws.map((x) => (x.id === w.id ? { ...x, active: !w.active } : x)));
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusyWorkflow(null);
    }
  }

  async function openExecution(e: N8nExecution) {
    setSelectedExec(e);
    setExecDetail(null);
    setExecLoading(true);
    try {
      const res = await fetch(`/api/n8n-data?resource=execution&id=${e.id}`, {
        headers: { 'x-api-key': PIN },
      });
      if (res.ok) {
        const d = await res.json();
        setExecDetail(d.data || d);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setExecLoading(false);
    }
  }

  const filteredLeads = leads.filter((l) => {
    if (leadFilter !== 'all' && l.status !== leadFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        (l.name || '').toLowerCase().includes(q) ||
        (l.email || '').toLowerCase().includes(q) ||
        (l.website || '').toLowerCase().includes(q)
      );
    }
    return true;
  });

  const filteredProspects = prospects.filter((p) => {
    if (prospectFilter === 'web-dev' && p.prospectType !== 'web-dev') return false;
    if (prospectFilter !== 'all' && prospectFilter !== 'web-dev' && p.status !== prospectFilter)
      return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        (p.name || '').toLowerCase().includes(q) ||
        (p.businessType || '').toLowerCase().includes(q) ||
        (p.address || '').toLowerCase().includes(q) ||
        (p.website || '').toLowerCase().includes(q) ||
        (p.prospectType || '').toLowerCase().includes(q)
      );
    }
    return true;
  });

  const filteredExecutions = executions.filter((e) => {
    if (search) {
      const q = search.toLowerCase();
      const wfName = e.workflowData?.name || '';
      return (
        wfName.toLowerCase().includes(q) ||
        (e.status || '').toLowerCase().includes(q) ||
        e.id.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const activeWorkflows = workflows.filter((w) => w.active);
  const inactiveWorkflows = workflows.filter((w) => !w.active);
  const successExeCount = executions.filter((e) => e.finished && e.status === 'success').length;
  const failedExeCount = executions.filter((e) => e.status === 'error').length;
  const successRate =
    executions.length > 0 ? Math.round((successExeCount / executions.length) * 100) : 0;

  const leadStats = {
    total: leads.length,
    new: leads.filter((l) => l.status === 'new' || !l.status).length,
    pending: leads.filter((l) => l.status === 'pending').length,
    running: leads.filter((l) => l.status === 'running').length,
    completed: leads.filter((l) => l.status === 'completed').length,
    contacted: leads.filter((l) => l.status === 'contacted').length,
    qualified: leads.filter((l) => l.status === 'qualified').length,
    converted: leads.filter((l) => l.status === 'converted').length,
  };

  const prospectStats = {
    total: prospects.length,
    discovered: prospects.filter((p) => p.status === 'discovered').length,
    enriched: prospects.filter((p) => p.status === 'enriched').length,
    qualified: prospects.filter((p) => p.status === 'qualified').length,
    lowPriority: prospects.filter((p) => p.status === 'low_priority').length,
    contacted: prospects.filter((p) => p.status === 'contacted').length,
    replied: prospects.filter((p) => p.status === 'replied' || p.status === 'responded').length,
    converted: prospects.filter((p) => p.status === 'converted').length,
    webDevTotal: prospects.filter((p) => p.prospectType === 'web-dev').length,
    webDevQualified: prospects.filter((p) => p.status === 'web_dev_qualified').length,
    webDevAvgScore: (() => {
      const scored = prospects.filter((p) => p.prospectType === 'web-dev' && p.webDevScore != null);
      return scored.length
        ? Math.round(scored.reduce((s, p) => s + (p.webDevScore || 0), 0) / scored.length)
        : 0;
    })(),
    webDevStrong: prospects.filter(
      (p) => p.prospectType === 'web-dev' && p.webDevRecommendation === 'strongly needed',
    ).length,
  };

  if (!authed) return <PinGate onUnlock={() => setAuthed(true)} />;

  const tabs: { id: Tab; label: string; count?: number }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'workflows', label: 'Workflows', count: workflows.length },
    { id: 'executions', label: 'Executions', count: executions.length },
    { id: 'leads', label: 'Leads', count: leadStats.total },
    { id: 'prospects', label: 'Prospects', count: prospectStats.total },
    { id: 'bootes', label: 'Bootes', count: bootesStats?.total },
  ];

  return (
    <div class="space-y-6">
      {error && (
        <div class="rounded-xl border border-red-800 bg-red-900/20 p-4 text-center text-red-400">
          <p class="font-medium">Error loading data</p>
          <p class="mt-1 text-xs text-gray-500">{error}</p>
        </div>
      )}

      {/* Tab Navigation */}
      <div class="flex items-center gap-1 rounded-xl border border-gray-200 bg-white p-1 overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => {
              setTab(t.id);
              setSearch('');
            }}
            class={`flex-shrink-0 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all ${
              tab === t.id ? 'bg-brand-600 text-white' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.label}
            {t.count !== undefined && <span class="ml-1 text-xs opacity-70">({t.count})</span>}
          </button>
        ))}
      </div>

      {/* Search + Actions */}
      {tab !== 'overview' && (
        <div class="flex flex-wrap gap-3">
          <input
            type="text"
            value={search}
            onInput={(e) => setSearch((e.target as HTMLInputElement).value)}
            placeholder={
              tab === 'workflows'
                ? 'Search workflow name...'
                : tab === 'executions'
                  ? 'Search workflow, status, ID...'
                  : tab === 'leads'
                    ? 'Search name, email, website...'
                    : 'Search name, business, address...'
            }
            class="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-700 placeholder-gray-400 focus:border-brand-500 focus:outline-none"
          />
          <button
            onClick={loadAll}
            class="rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-600 hover:text-gray-700"
          >
            Refresh
          </button>
          <button
            onClick={() => {
              if (tab === 'leads') {
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
                  `website-leads-${new Date().toISOString().slice(0, 10)}.csv`,
                );
              } else if (tab === 'prospects') {
                exportCSV(
                  filteredProspects.map((p) => ({
                    name: p.name,
                    businessType: p.businessType,
                    address: p.address,
                    website: p.website,
                    phoneNumber: p.phoneNumber,
                    rating: p.rating,
                    aiScore: p.aiScore,
                    prospectType: p.prospectType || '—',
                    webDevScore: p.webDevScore != null ? p.webDevScore : '—',
                    webDevRecommendation: p.webDevRecommendation || '—',
                    niche: p.niche,
                    status: p.status,
                    source: p.source,
                    searchQuery: p.searchQuery,
                    created: p.created,
                  })),
                  `prospects-${new Date().toISOString().slice(0, 10)}.csv`,
                );
              } else if (tab === 'workflows') {
                exportCSV(
                  workflows.map((w) => ({
                    name: w.name,
                    active: w.active,
                    id: w.id,
                    createdAt: w.createdAt,
                    updatedAt: w.updatedAt,
                  })),
                  `workflows-${new Date().toISOString().slice(0, 10)}.csv`,
                );
              } else if (tab === 'executions') {
                exportCSV(
                  filteredExecutions.map((e) => ({
                    id: e.id,
                    workflow: e.workflowData?.name || e.workflowId,
                    status: e.status,
                    mode: e.mode,
                    startedAt: e.startedAt,
                    stoppedAt: e.stoppedAt,
                  })),
                  `executions-${new Date().toISOString().slice(0, 10)}.csv`,
                );
              } else if (tab === 'bootes') {
                exportCSV(
                  bootesLeads.map((b) => ({
                    name: b.name,
                    phone: b.phoneNumber,
                    email: b.email || '',
                    source: b.source || '',
                    status: b.status || '',
                    consent: b.consent ? 'yes' : 'no',
                    waStatus: b.waStatus || '',
                    visitStatus: b.visitStatus || '',
                    interest: b.leadInterest || '',
                    created: b.created || '',
                  })),
                  `bootes-leads-${new Date().toISOString().slice(0, 10)}.csv`,
                );
              }
            }}
            class="rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-500"
          >
            Export CSV
          </button>
        </div>
      )}

      {/* Loading */}
      {loading && <div class="p-8 text-center text-gray-500">Loading dashboard data...</div>}

      {/* ==================== OVERVIEW TAB ==================== */}
      {!loading && tab === 'overview' && (
        <>
          {/* Summary Cards */}
          <div class="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
            <MetricCard
              value={activeWorkflows.length}
              label="Active Workflows"
              color="text-green-400"
            />
            <MetricCard value={workflows.length} label="Total Workflows" color="text-white" />
            <MetricCard value={executions.length} label="Recent Executions" color="text-blue-400" />
            <MetricCard
              value={`${successRate}%`}
              label="Success Rate"
              color={
                successRate >= 90
                  ? 'text-green-400'
                  : successRate >= 70
                    ? 'text-yellow-400'
                    : 'text-red-400'
              }
            />
            <MetricCard value={leadStats.total} label="Total Leads" color="text-purple-400" />
            <MetricCard value={prospectStats.total} label="Total Prospects" color="text-cyan-400" />
          </div>

          {/* Web Dev Quick Stats */}
          {prospectStats.webDevTotal > 0 && (
            <div class="rounded-xl border border-orange-700/30 bg-orange-900/10 p-4">
              <h3 class="mb-3 flex items-center gap-2 text-sm font-semibold text-orange-400">
                <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
                Web Dev Pipeline
              </h3>
              <div class="grid grid-cols-2 gap-3 md:grid-cols-4">
                <MetricCard
                  value={prospectStats.webDevTotal}
                  label="No-Website Prospects"
                  color="text-orange-400"
                />
                <MetricCard
                  value={prospectStats.webDevQualified}
                  label="Ready to Contact"
                  color="text-green-400"
                />
                <MetricCard
                  value={prospectStats.webDevStrong}
                  label="Strongly Need Site"
                  color="text-red-400"
                />
                <MetricCard
                  value={prospectStats.webDevAvgScore}
                  label="Avg Web Dev Score"
                  color="text-cyan-400"
                />
              </div>
            </div>
          )}

          {/* Quick Workflow List */}
          <div class="rounded-xl border border-gray-200 bg-white p-4">
            <h3 class="mb-3 text-sm font-semibold text-gray-700">Active Workflows</h3>
            <div class="space-y-2">
              {activeWorkflows.map((w) => (
                <div
                  key={w.id}
                  class="flex items-center justify-between rounded-lg bg-gray-100 px-4 py-2.5"
                >
                  <div class="flex items-center gap-3">
                    <span class="h-2 w-2 rounded-full bg-green-400" />
                    <span class="text-sm font-medium text-gray-700">{w.name}</span>
                  </div>
                  <span class="text-xs text-gray-500">{w.id}</span>
                </div>
              ))}
              {inactiveWorkflows.length > 0 && (
                <div class="mt-2 border-t border-gray-200 pt-2">
                  <p class="mb-2 text-xs text-gray-400">Inactive</p>
                  {inactiveWorkflows.map((w) => (
                    <div
                      key={w.id}
                      class="flex items-center justify-between rounded-lg px-4 py-2 opacity-60"
                    >
                      <div class="flex items-center gap-3">
                        <span class="h-2 w-2 rounded-full bg-gray-300" />
                        <span class="text-sm text-gray-500">{w.name}</span>
                      </div>
                      <span class="text-xs text-gray-400">{w.id}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Recent Executions */}
          <div class="rounded-xl border border-gray-200 bg-white p-4">
            <h3 class="mb-3 text-sm font-semibold text-gray-700">Recent Executions</h3>
            {executions.length === 0 ? (
              <p class="text-sm text-gray-500">No recent executions</p>
            ) : (
              <div class="space-y-1">
                {executions.slice(0, 10).map((e) => (
                  <div
                    key={e.id}
                    class="flex items-center justify-between rounded-lg px-4 py-2 hover:bg-gray-100"
                  >
                    <div class="flex items-center gap-3">
                      <span
                        class={`h-2 w-2 rounded-full ${
                          e.status === 'success'
                            ? 'bg-green-400'
                            : e.status === 'error'
                              ? 'bg-red-400'
                              : 'bg-yellow-400'
                        }`}
                      />
                      <span class="text-sm text-gray-700">
                        {e.workflowData?.name || e.workflowId}
                      </span>
                      <span class="text-xs text-gray-400">#{e.id}</span>
                    </div>
                    <div class="flex items-center gap-4 text-xs text-gray-500">
                      <span>{e.mode}</span>
                      {e.stoppedAt && <span>{formatDuration(e.startedAt, e.stoppedAt)}</span>}
                      <span>
                        {new Date(e.startedAt).toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* ==================== WORKFLOWS TAB ==================== */}
      {!loading && tab === 'workflows' && (
        <>
          <div class="grid grid-cols-2 gap-3 md:grid-cols-4">
            <MetricCard value={activeWorkflows.length} label="Active" color="text-green-400" />
            <MetricCard value={inactiveWorkflows.length} label="Inactive" color="text-gray-500" />
            <MetricCard value={workflows.length} label="Total" color="text-white" />
            <MetricCard value={executions.length} label="Total Executions" color="text-blue-400" />
          </div>

          <div class="rounded-xl border border-gray-200 bg-white">
            <div class="overflow-x-auto">
              <table class="w-full text-left text-sm">
                <thead>
                  <tr class="border-b border-gray-200 text-xs uppercase text-gray-500">
                    <th class="px-4 py-3">Status</th>
                    <th class="px-4 py-3">Name</th>
                    <th class="px-4 py-3">ID</th>
                    <th class="px-4 py-3">Created</th>
                    <th class="px-4 py-3">Updated</th>
                    <th class="px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-200">
                  {workflows
                    .filter((w) => {
                      if (search) {
                        const q = search.toLowerCase();
                        return (
                          (w.name || '').toLowerCase().includes(q) || w.id.toLowerCase().includes(q)
                        );
                      }
                      return true;
                    })
                    .map((w) => (
                      <tr key={w.id} class="hover:bg-gray-100">
                        <td class="px-4 py-3">
                          <span
                            class={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                              w.active
                                ? 'bg-green-600/20 text-green-400'
                                : 'bg-gray-200 text-gray-500'
                            }`}
                          >
                            <span
                              class={`h-1.5 w-1.5 rounded-full ${
                                w.active ? 'bg-green-400' : 'bg-gray-400'
                              }`}
                            />
                            {w.active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td class="px-4 py-3 font-medium text-gray-700">{w.name}</td>
                        <td class="px-4 py-3 text-xs text-gray-500 font-mono">{w.id}</td>
                        <td class="px-4 py-3 text-xs text-gray-500">
                          {w.createdAt
                            ? new Date(w.createdAt).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              })
                            : '—'}
                        </td>
                        <td class="px-4 py-3 text-xs text-gray-500">
                          {w.updatedAt
                            ? new Date(w.updatedAt).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              })
                            : '—'}
                        </td>
                        <td class="px-4 py-3">
                          <button
                            onClick={() => toggleWorkflow(w)}
                            disabled={busyWorkflow === w.id}
                            class={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-50 ${
                              w.active
                                ? 'bg-red-600/20 text-red-400 hover:bg-red-600/30'
                                : 'bg-green-600 text-white hover:bg-green-500'
                            }`}
                          >
                            {busyWorkflow === w.id ? '...' : w.active ? 'Deactivate' : 'Activate'}
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ==================== EXECUTIONS TAB ==================== */}
      {!loading && tab === 'executions' && (
        <>
          <div class="grid grid-cols-2 gap-3 md:grid-cols-4">
            <MetricCard value={executions.length} label="Total" color="text-white" />
            <MetricCard value={successExeCount} label="Succeeded" color="text-green-400" />
            <MetricCard value={failedExeCount} label="Failed" color="text-red-400" />
            <MetricCard
              value={`${successRate}%`}
              label="Success Rate"
              color={
                successRate >= 90
                  ? 'text-green-400'
                  : successRate >= 70
                    ? 'text-yellow-400'
                    : 'text-red-400'
              }
            />
          </div>

          <div class="rounded-xl border border-gray-200 bg-white">
            {filteredExecutions.length === 0 ? (
              <div class="p-8 text-center text-gray-500">No executions found</div>
            ) : (
              <div class="overflow-x-auto">
                <table class="w-full text-left text-sm">
                  <thead>
                    <tr class="border-b border-gray-200 text-xs uppercase text-gray-500">
                      <th class="px-4 py-3">Status</th>
                      <th class="px-4 py-3">Workflow</th>
                      <th class="px-4 py-3">Execution ID</th>
                      <th class="px-4 py-3">Mode</th>
                      <th class="px-4 py-3">Duration</th>
                      <th class="px-4 py-3">Started</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-gray-200">
                    {filteredExecutions.map((e) => (
                      <tr
                        key={e.id}
                        onClick={() => openExecution(e)}
                        class="cursor-pointer hover:bg-gray-100"
                      >
                        <td class="px-4 py-3">
                          <span
                            class={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                              e.status === 'success'
                                ? 'bg-green-600/20 text-green-400'
                                : e.status === 'error'
                                  ? 'bg-red-600/20 text-red-400'
                                  : e.status === 'waiting'
                                    ? 'bg-yellow-600/20 text-yellow-400'
                                    : 'bg-gray-200 text-gray-600'
                            }`}
                          >
                            {e.status}
                          </span>
                        </td>
                        <td class="px-4 py-3 font-medium text-gray-700">
                          {e.workflowData?.name || e.workflowId}
                        </td>
                        <td class="px-4 py-3 text-xs text-gray-500 font-mono">#{e.id}</td>
                        <td class="px-4 py-3 text-xs text-gray-500">{e.mode}</td>
                        <td class="px-4 py-3 text-xs text-gray-500">
                          {e.stoppedAt ? formatDuration(e.startedAt, e.stoppedAt) : '—'}
                        </td>
                        <td class="px-4 py-3 text-xs text-gray-500">
                          {new Date(e.startedAt).toLocaleString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
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

      {/* ==================== LEADS TAB ==================== */}
      {!loading && tab === 'leads' && (
        <>
          <div class="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-7">
            <MetricCard value={leadStats.total} label="Total" color="text-white" />
            <MetricCard value={leadStats.new} label="New" color="text-blue-400" />
            <MetricCard value={leadStats.running} label="Running" color="text-cyan-400" />
            <MetricCard value={leadStats.completed} label="Completed" color="text-green-400" />
            <MetricCard value={leadStats.contacted} label="Contacted" color="text-purple-400" />
            <MetricCard value={leadStats.qualified} label="Qualified" color="text-emerald-400" />
            <MetricCard value={leadStats.converted} label="Converted" color="text-brand-400" />
          </div>

          <div class="flex flex-wrap gap-2">
            {[
              'all',
              'new',
              'pending',
              'running',
              'completed',
              'contacted',
              'qualified',
              'converted',
              'lost',
            ].map((f) => (
              <button
                key={f}
                onClick={() => setLeadFilter(f)}
                class={`rounded-full px-3 py-1 text-xs font-medium transition-all ${
                  leadFilter === f
                    ? 'bg-brand-600 text-white'
                    : 'border border-gray-300 text-gray-500 hover:text-gray-700'
                }`}
              >
                {f === 'all' ? `All (${leadStats.total})` : f}
              </button>
            ))}
          </div>

          <div class="rounded-xl border border-gray-200 bg-white">
            {filteredLeads.length === 0 ? (
              <div class="p-8 text-center text-gray-500">
                <p>No website leads found</p>
                <p class="mt-1 text-xs text-gray-400">
                  Leads will appear when visitors submit the AI Visibility Audit form
                </p>
              </div>
            ) : (
              <div class="overflow-x-auto">
                <table class="w-full text-left text-sm">
                  <thead>
                    <tr class="border-b border-gray-200 text-xs uppercase text-gray-500">
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
                  <tbody class="divide-y divide-gray-200">
                    {filteredLeads.map((lead) => (
                      <tr key={lead.id} class="hover:bg-gray-100">
                        <td class="px-4 py-3 font-medium text-gray-700">{lead.name || '—'}</td>
                        <td class="px-4 py-3 text-gray-600">{lead.email || '—'}</td>
                        <td class="px-4 py-3">
                          {lead.website ? (
                            <a
                              href={
                                lead.website.startsWith('http')
                                  ? lead.website
                                  : `https://${lead.website}`
                              }
                              target="_blank"
                              rel="noopener noreferrer"
                              class="text-brand-400 hover:underline text-xs"
                            >
                              {(() => {
                                try {
                                  return new URL(
                                    lead.website.startsWith('http')
                                      ? lead.website
                                      : `https://${lead.website}`,
                                  ).hostname;
                                } catch {
                                  return lead.website;
                                }
                              })()}
                            </a>
                          ) : (
                            <span class="text-gray-400">—</span>
                          )}
                        </td>
                        <td class="px-4 py-3">
                          {lead.score ? (
                            <span
                              class={`font-bold ${
                                lead.score >= 70
                                  ? 'text-green-400'
                                  : lead.score >= 40
                                    ? 'text-yellow-400'
                                    : 'text-red-400'
                              }`}
                            >
                              {lead.score}
                            </span>
                          ) : (
                            <span class="text-gray-400">—</span>
                          )}
                        </td>
                        <td class="px-4 py-3">
                          {lead.aiVisibility?.aiVisibilityScore != null ? (
                            <span
                              class={`font-bold ${
                                lead.aiVisibility.aiVisibilityScore >= 70
                                  ? 'text-green-400'
                                  : lead.aiVisibility.aiVisibilityScore >= 40
                                    ? 'text-yellow-400'
                                    : 'text-red-400'
                              }`}
                            >
                              {lead.aiVisibility.aiVisibilityScore}
                            </span>
                          ) : (
                            <span class="text-gray-400">—</span>
                          )}
                        </td>
                        <td class="px-4 py-3">
                          <StatusBadge status={lead.status || 'new'} colors={leadStatusColors} />
                        </td>
                        <td class="px-4 py-3 text-gray-600">{lead.serviceInterest || '—'}</td>
                        <td class="px-4 py-3 text-xs text-gray-500">
                          {lead.created
                            ? new Date(lead.created).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                              })
                            : '—'}
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
      {!loading && tab === 'prospects' && (
        <>
          <div class="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-7">
            <MetricCard value={prospectStats.total} label="Total" color="text-white" />
            <MetricCard value={prospectStats.discovered} label="Discovered" color="text-blue-400" />
            <MetricCard value={prospectStats.enriched} label="Enriched" color="text-cyan-400" />
            <MetricCard value={prospectStats.qualified} label="Qualified" color="text-green-400" />
            <MetricCard
              value={prospectStats.lowPriority}
              label="Low Priority"
              color="text-yellow-400"
            />
            <MetricCard value={prospectStats.contacted} label="Contacted" color="text-purple-400" />
            <MetricCard value={prospectStats.replied} label="Replied" color="text-emerald-400" />
          </div>

          {/* Web Dev Prospects Row */}
          <div class="rounded-xl border border-orange-700/30 bg-orange-900/10 p-4">
            <h3 class="mb-3 text-sm font-semibold text-orange-400">
              Web Dev Prospects (no website)
            </h3>
            <div class="grid grid-cols-2 gap-3 md:grid-cols-5">
              <MetricCard
                value={prospectStats.webDevTotal}
                label="Total Web Dev"
                color="text-orange-400"
              />
              <MetricCard
                value={prospectStats.webDevQualified}
                label="Qualified (score ≥ 5)"
                color="text-green-400"
              />
              <MetricCard
                value={prospectStats.webDevAvgScore}
                label="Avg Score (0-12)"
                color="text-cyan-400"
              />
              <MetricCard
                value={prospectStats.webDevStrong}
                label="Strongly Needed"
                color="text-red-400"
              />
              <MetricCard
                value={
                  prospectStats.webDevTotal > 0
                    ? `${Math.round(
                        (prospectStats.webDevQualified / prospectStats.webDevTotal) * 100,
                      )}%`
                    : '—'
                }
                label="Qualified Rate"
                color="text-brand-400"
              />
            </div>
          </div>

          <div class="flex flex-wrap gap-2">
            {[
              'all',
              'discovered',
              'enriched',
              'qualified',
              'low_priority',
              'web_dev_qualified',
              'contacted',
              'replied',
              'converted',
            ].map((f) => (
              <button
                key={f}
                onClick={() => setProspectFilter(f)}
                class={`rounded-full px-3 py-1 text-xs font-medium transition-all ${
                  prospectFilter === f
                    ? 'bg-brand-600 text-white'
                    : 'border border-gray-300 text-gray-500 hover:text-gray-700'
                }`}
              >
                {f === 'all' ? `All (${prospectStats.total})` : f.replace(/_/g, ' ')}
              </button>
            ))}
            <span class="mx-1 self-center text-xs text-gray-400">|</span>
            <button
              onClick={() => setProspectFilter((f) => (f === 'web-dev' ? 'all' : 'web-dev'))}
              class={`rounded-full px-3 py-1 text-xs font-medium transition-all ${
                prospectFilter === 'web-dev'
                  ? 'bg-orange-600 text-white'
                  : 'border border-orange-700/50 text-orange-500 hover:text-orange-400'
              }`}
            >
              {prospectFilter === 'web-dev' ? 'All' : `Web Dev (${prospectStats.webDevTotal})`}
            </button>
          </div>

          <div class="rounded-xl border border-gray-200 bg-white">
            {filteredProspects.length === 0 ? (
              <div class="p-8 text-center text-gray-500">
                <p>No prospects found</p>
                <p class="mt-1 text-xs text-gray-400">
                  Prospects will appear after WF 01 discovers them via Geoapify
                </p>
              </div>
            ) : (
              <div class="overflow-x-auto">
                <table class="w-full text-left text-sm">
                  <thead>
                    <tr class="border-b border-gray-200 text-xs uppercase text-gray-500">
                      <th class="px-4 py-3">Name</th>
                      <th class="px-4 py-3">Type</th>
                      <th class="px-4 py-3">Address</th>
                      <th class="px-4 py-3">Rating</th>
                      <th class="px-4 py-3">AI Score</th>
                      <th class="px-4 py-3">Web Dev</th>
                      <th class="px-4 py-3">Score</th>
                      <th class="px-4 py-3">Need</th>
                      <th class="px-4 py-3">Niche</th>
                      <th class="px-4 py-3">Status</th>
                      <th class="px-4 py-3">Website</th>
                      <th class="px-4 py-3">Date</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-gray-200">
                    {filteredProspects.map((p) => (
                      <tr key={p.id} class="hover:bg-gray-100">
                        <td class="px-4 py-3 font-medium text-gray-700">{p.name || '—'}</td>
                        <td class="px-4 py-3 text-gray-600">{p.businessType || '—'}</td>
                        <td
                          class="px-4 py-3 max-w-[160px] truncate text-gray-600"
                          title={p.address}
                        >
                          {p.address || '—'}
                        </td>
                        <td class="px-4 py-3">
                          {p.rating ? (
                            <span
                              class={`font-bold ${
                                p.rating >= 4
                                  ? 'text-green-400'
                                  : p.rating >= 3
                                    ? 'text-yellow-400'
                                    : 'text-red-400'
                              }`}
                            >
                              {p.rating} ★
                            </span>
                          ) : (
                            <span class="text-gray-400">—</span>
                          )}
                        </td>
                        <td class="px-4 py-3">
                          {p.aiScore ? (
                            <span
                              class={`font-bold ${
                                p.aiScore >= 70
                                  ? 'text-green-400'
                                  : p.aiScore >= 50
                                    ? 'text-yellow-400'
                                    : 'text-red-400'
                              }`}
                            >
                              {p.aiScore}
                            </span>
                          ) : (
                            <span class="text-gray-400">—</span>
                          )}
                        </td>
                        <td class="px-4 py-3">
                          {p.prospectType === 'web-dev' ? (
                            <span class="inline-flex items-center gap-1 rounded-full bg-orange-600/20 px-2 py-0.5 text-xs font-medium text-orange-400">
                              <svg
                                class="h-3 w-3"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  stroke-linecap="round"
                                  stroke-linejoin="round"
                                  stroke-width="2"
                                  d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                                />
                              </svg>
                              Dev
                            </span>
                          ) : p.prospectType === 'seo' ? (
                            <span class="text-xs text-green-500">SEO</span>
                          ) : (
                            <span class="text-gray-400">—</span>
                          )}
                        </td>
                        <td class="px-4 py-3">
                          {p.webDevScore != null ? (
                            <span
                              class={`font-bold ${
                                p.webDevScore >= 9
                                  ? 'text-red-400'
                                  : p.webDevScore >= 5
                                    ? 'text-yellow-400'
                                    : 'text-gray-500'
                              }`}
                            >
                              {p.webDevScore}/12
                            </span>
                          ) : (
                            <span class="text-gray-400">—</span>
                          )}
                        </td>
                        <td class="px-4 py-3">
                          {p.webDevRecommendation ? (
                            <span
                              class={`text-xs font-medium ${
                                p.webDevRecommendation === 'strongly needed'
                                  ? 'text-red-400'
                                  : p.webDevRecommendation === 'would help'
                                    ? 'text-yellow-400'
                                    : 'text-gray-500'
                              }`}
                            >
                              {p.webDevRecommendation}
                            </span>
                          ) : (
                            <span class="text-gray-400">—</span>
                          )}
                        </td>
                        <td class="px-4 py-3 text-gray-600">{p.niche || '—'}</td>
                        <td class="px-4 py-3">
                          <StatusBadge status={p.status} colors={prospectStatusColors} />
                        </td>
                        <td class="px-4 py-3">
                          {p.website ? (
                            <a
                              href={
                                p.website.startsWith('http') ? p.website : `https://${p.website}`
                              }
                              target="_blank"
                              rel="noopener noreferrer"
                              class="text-brand-400 hover:underline text-xs"
                            >
                              {(() => {
                                try {
                                  return new URL(
                                    p.website.startsWith('http')
                                      ? p.website
                                      : `https://${p.website}`,
                                  ).hostname;
                                } catch {
                                  return p.website;
                                }
                              })()}
                            </a>
                          ) : (
                            <span class="text-gray-400">—</span>
                          )}
                        </td>
                        <td class="px-4 py-3 text-xs text-gray-500">
                          {p.created
                            ? new Date(p.created).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                              })
                            : '—'}
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

      {/* ==================== BOOTES TAB ==================== */}
      {!loading && tab === 'bootes' && bootesStats && (
        <>
          <div class="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-8">
            <MetricCard value={bootesStats.total} label="Total" color="text-white" />
            <MetricCard value={bootesStats.sources.organic} label="Organic" color="text-blue-400" />
            <MetricCard
              value={bootesStats.sources.meta_paid}
              label="Meta Paid"
              color="text-purple-400"
            />
            <MetricCard value={bootesStats.sources.landing} label="Landing" color="text-cyan-400" />
            <MetricCard value={bootesStats.sources.optin} label="Opt-in" color="text-green-400" />
            <MetricCard value={bootesStats.consent} label="Consent" color="text-emerald-400" />
            <MetricCard value={bootesStats.wa.sent} label="WA Sent" color="text-teal-400" />
            <MetricCard
              value={bootesStats.visits.booked}
              label="Visits Booked"
              color="text-brand-400"
            />
          </div>

          {/* WhatsApp + Email Campaign */}
          <div class="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div class="rounded-xl border border-gray-200 bg-white p-4">
              <h3 class="mb-3 text-sm font-semibold text-gray-700">WhatsApp Cloud API</h3>
              <div class="grid grid-cols-2 gap-3">
                <MetricCard value={bootesStats.wa.sent} label="Sent" color="text-teal-400" />
                <MetricCard value={bootesStats.wa.failed} label="Failed" color="text-red-400" />
              </div>
            </div>
            <div class="rounded-xl border border-gray-200 bg-white p-4">
              <h3 class="mb-3 text-sm font-semibold text-gray-700">Cold-Email Campaign</h3>
              <div class="grid grid-cols-2 gap-3 md:grid-cols-4">
                <MetricCard
                  value={bootesStats.campaign.email_sent}
                  label="Sent"
                  color="text-green-400"
                />
                <MetricCard
                  value={bootesStats.campaign.pending}
                  label="Pending"
                  color="text-yellow-400"
                />
                <MetricCard
                  value={bootesStats.campaign.no_email_found}
                  label="No Email"
                  color="text-gray-500"
                />
                <MetricCard
                  value={bootesStats.campaign.email_unverified}
                  label="Unverified"
                  color="text-red-400"
                />
              </div>
            </div>
          </div>

          {/* Recent bootes_leads */}
          <div class="rounded-xl border border-gray-200 bg-white">
            {bootesLeads.length === 0 ? (
              <div class="p-8 text-center text-gray-500">
                <p>No Bootes leads found</p>
                <p class="mt-1 text-xs text-gray-400">
                  Leads appear when the organic/metadata/landing pipelines ingest them
                </p>
              </div>
            ) : (
              <div class="overflow-x-auto">
                <table class="w-full text-left text-sm">
                  <thead>
                    <tr class="border-b border-gray-200 text-xs uppercase text-gray-500">
                      <th class="px-4 py-3">Name</th>
                      <th class="px-4 py-3">Phone</th>
                      <th class="px-4 py-3">Email</th>
                      <th class="px-4 py-3">Source</th>
                      <th class="px-4 py-3">Status</th>
                      <th class="px-4 py-3">Consent</th>
                      <th class="px-4 py-3">WA</th>
                      <th class="px-4 py-3">Visit</th>
                      <th class="px-4 py-3">Interest</th>
                      <th class="px-4 py-3">Date</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-gray-200">
                    {bootesLeads.map((b) => (
                      <tr key={b.id} class="hover:bg-gray-100">
                        <td class="px-4 py-3 font-medium text-gray-700">{b.name || '—'}</td>
                        <td class="px-4 py-3 text-xs text-gray-600 font-mono">
                          {b.phoneNumber || '—'}
                        </td>
                        <td class="px-4 py-3 text-xs text-gray-600">{b.email || '—'}</td>
                        <td class="px-4 py-3">
                          <span
                            class={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                              b.source === 'meta_paid'
                                ? 'bg-purple-600/20 text-purple-400'
                                : b.source === 'optin'
                                  ? 'bg-green-600/20 text-green-400'
                                  : b.source === 'landing'
                                    ? 'bg-cyan-600/20 text-cyan-400'
                                    : 'bg-blue-600/20 text-blue-400'
                            }`}
                          >
                            {b.source || 'organic'}
                          </span>
                        </td>
                        <td class="px-4 py-3 text-xs text-gray-600">{b.status || '—'}</td>
                        <td class="px-4 py-3">
                          {b.consent ? (
                            <span class="text-xs font-semibold text-green-400">Yes</span>
                          ) : (
                            <span class="text-xs text-gray-400">No</span>
                          )}
                        </td>
                        <td class="px-4 py-3 text-xs text-gray-600">{b.waStatus || '—'}</td>
                        <td class="px-4 py-3 text-xs text-gray-600">{b.visitStatus || '—'}</td>
                        <td class="px-4 py-3 text-xs text-gray-600">{b.leadInterest || '—'}</td>
                        <td class="px-4 py-3 text-xs text-gray-500">
                          {b.created
                            ? new Date(b.created).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                              })
                            : '—'}
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

      {/* Execution detail modal */}
      {selectedExec && (
        <div
          class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => setSelectedExec(null)}
        >
          <div
            class="max-h-[80vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-gray-700 bg-gray-900 p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div class="mb-4 flex items-center justify-between">
              <h3 class="text-lg font-bold text-gray-100">
                Execution #{selectedExec.id} —{' '}
                {selectedExec.workflowData?.name || selectedExec.workflowId}
              </h3>
              <button
                onClick={() => setSelectedExec(null)}
                class="rounded-lg bg-gray-800 px-3 py-1.5 text-sm text-gray-400 hover:text-gray-200"
              >
                Close
              </button>
            </div>
            <div class="mb-4 grid grid-cols-2 gap-3 text-sm md:grid-cols-4">
              <MetricCard
                value={selectedExec.status}
                label="Status"
                color={
                  selectedExec.status === 'success'
                    ? 'text-green-400'
                    : selectedExec.status === 'error'
                      ? 'text-red-400'
                      : 'text-yellow-400'
                }
              />
              <MetricCard value={selectedExec.mode} label="Mode" color="text-blue-400" />
              <MetricCard
                value={selectedExec.finished ? 'Yes' : 'No'}
                label="Finished"
                color="text-cyan-400"
              />
              <MetricCard
                value={
                  selectedExec.stoppedAt
                    ? formatDuration(selectedExec.startedAt, selectedExec.stoppedAt)
                    : '—'
                }
                label="Duration"
                color="text-gray-300"
              />
            </div>
            <div class="space-y-2 text-xs text-gray-400">
              <p>
                <span class="text-gray-500">Started:</span>{' '}
                {new Date(selectedExec.startedAt).toLocaleString()}
              </p>
              <p>
                <span class="text-gray-500">Stopped:</span>{' '}
                {selectedExec.stoppedAt ? new Date(selectedExec.stoppedAt).toLocaleString() : '—'}
              </p>
            </div>
            {execLoading && <p class="mt-4 text-sm text-gray-500">Loading execution detail...</p>}
            {!execLoading && execDetail && execDetail.error && (
              <div class="mt-4 rounded-lg border border-red-800 bg-red-900/20 p-4">
                <p class="mb-1 text-sm font-semibold text-red-400">Error</p>
                <pre class="whitespace-pre-wrap font-mono text-xs text-red-300">
                  {typeof execDetail.error === 'string'
                    ? execDetail.error
                    : JSON.stringify(execDetail.error, null, 2)}
                </pre>
              </div>
            )}
            {!execLoading && execDetail && !execDetail.error && (
              <div class="mt-4 rounded-lg border border-gray-700 bg-gray-800/40 p-4">
                <p class="text-sm font-semibold text-green-400">
                  {execDetail.status === 'success'
                    ? 'Execution succeeded'
                    : `Status: ${execDetail.status}`}
                </p>
                {execDetail.errorText && (
                  <pre class="mt-2 whitespace-pre-wrap font-mono text-xs text-red-300">
                    {execDetail.errorText}
                  </pre>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Footer info */}
      {!loading && (
        <div class="text-center text-xs text-gray-400">
          {tab === 'leads'
            ? `Showing ${filteredLeads.length} of ${leadStats.total} website leads`
            : tab === 'prospects'
              ? `Showing ${filteredProspects.length} of ${prospectStats.total} prospects`
              : tab === 'workflows'
                ? `${workflows.length} workflows (${activeWorkflows.length} active)`
                : tab === 'executions'
                  ? `Showing ${filteredExecutions.length} of ${executions.length} executions`
                  : tab === 'bootes'
                    ? `${bootesLeads.length} recent of ${
                        bootesStats?.total || 0
                      } total bootes leads`
                    : `${activeWorkflows.length} active workflows · ${executions.length} recent executions`}
          <span class="mx-2">·</span>
          <span>Last refreshed: {new Date().toLocaleTimeString()}</span>
          <span class="mx-2">·</span>
          <button
            onClick={() => {
              sessionStorage.removeItem('dash_auth');
              setAuthed(false);
            }}
            class="text-gray-400 hover:text-red-400"
          >
            Lock Dashboard
          </button>
        </div>
      )}
    </div>
  );
}
