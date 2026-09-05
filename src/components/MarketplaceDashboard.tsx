import { useEffect, useMemo, useState } from 'preact/hooks';

const PIN = '9690';

interface SocialLead {
  id: string;
  name?: string;
  phone?: string;
  email?: string;
  website?: string;
  address?: string;
  city?: string;
  category?: string;
  platform_source?: string;
  profile_url?: string;
  follower_count?: number;
  post_count?: number;
  engagement_rate?: number;
  business_type?: string;
  scraped_at?: string;
  intent_type?: string;
  intent_score?: number;
  buyer_profile?: string;
  budget_stated?: string;
  budget_min?: number;
  budget_max?: number;
  price?: number;
  price_raw?: string;
  lat?: number | null;
  lon?: number | null;
  distance_km?: number | null;
  filter_reason?: string;
  source?: string;
}

interface ScrapeJob {
  id: string;
  job_id?: string;
  user_fingerprint?: string;
  city?: string;
  budget_min?: number;
  budget_max?: number;
  distance_km?: number;
  query?: string;
  status?: string;
  written_count?: number;
  error_message?: string;
  started_at?: string;
  completed_at?: string;
  duration_sec?: number;
}

const PLATFORMS = [
  'all',
  'reddit',
  'bizdata',
  'instagram',
  'facebook',
  'linkedin',
  'twitter',
  'indiamart',
  'justdial',
  'olx',
  'quikr',
];
const BUYER_PROFILES = ['all', 'nri', 'investor', 'end_user', 'resale'];
const SEARCH_FIELDS: (keyof SocialLead)[] = [
  'name',
  'profile_url',
  'buyer_profile',
  'budget_stated',
  'address',
  'city',
  'category',
  'email',
  'phone',
];

function MetricCard({
  value,
  label,
  color = 'text-brand-600',
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

function intentColor(score: number | undefined): string {
  const s = typeof score === 'number' ? score : 0;
  if (s >= 70) return 'bg-green-100 text-green-800';
  if (s >= 40) return 'bg-amber-100 text-amber-800';
  return 'bg-red-100 text-red-700';
}

function intentHeatRow(score: number | undefined): string {
  const s = typeof score === 'number' ? score : 0;
  if (s >= 70) return 'rgba(220, 252, 231, 0.45)';
  if (s >= 40) return 'rgba(254, 243, 199, 0.45)';
  return 'rgba(254, 226, 226, 0.45)';
}

function leadBudget(lead: SocialLead): number {
  if (typeof lead.price === 'number' && lead.price > 0) return lead.price;
  return Math.max(lead.budget_max || 0, lead.budget_min || 0);
}

function str(v: unknown): string {
  return v === null || v === undefined ? '' : String(v);
}

function fmtNum(n: number | null | undefined): string {
  if (n === null || n === undefined || isNaN(n)) return '';
  return n >= 10000000
    ? `₹${(n / 10000000).toFixed(2)} Cr`
    : n >= 100000
      ? `₹${Math.round(n / 100000)} L`
      : `₹${n}`;
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
        <h2 class="mb-2 text-lg font-bold text-gray-700">Rex Market Place Access</h2>
        <p class="mb-6 text-sm text-gray-500">Enter your PIN to view the scraper leads.</p>
        <input
          type="password"
          maxLength={4}
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

function JobStatusBadge({ status }: { status?: string }) {
  const s = str(status).toLowerCase();
  const cls =
    s === 'completed' || s === 'success'
      ? 'bg-green-100 text-green-800'
      : s === 'running'
        ? 'bg-blue-100 text-blue-700'
        : s === 'failed' || s === 'error'
          ? 'bg-red-100 text-red-700'
          : 'bg-gray-100 text-gray-500';
  return (
    <span class={`rounded-full px-2 py-0.5 text-xs font-medium ${cls}`}>{s || 'unknown'}</span>
  );
}

export default function MarketplaceDashboard() {
  const [authed, setAuthed] = useState(false);
  const [leads, setLeads] = useState<SocialLead[]>([]);
  const [jobs, setJobs] = useState<ScrapeJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [platform, setPlatform] = useState('all');
  const [intent, setIntent] = useState('all');
  const [city, setCity] = useState('all');
  const [buyerProfile, setBuyerProfile] = useState('all');
  const [budgetMin, setBudgetMin] = useState('');
  const [budgetMax, setBudgetMax] = useState('');
  const [minScore, setMinScore] = useState('');
  const [selected, setSelected] = useState<SocialLead | null>(null);

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
      const [leadsRes, jobsRes] = await Promise.allSettled([
        fetch('/api/marketplace?resource=leads&limit=1000', { headers }),
        fetch('/api/marketplace?resource=jobs&limit=100', { headers }),
      ]);
      if (leadsRes.status === 'fulfilled' && leadsRes.value.ok) {
        const d = await leadsRes.value.json();
        setLeads(d.items || []);
      } else {
        const d = leadsRes.status === 'fulfilled' ? await leadsRes.value.json() : {};
        setError(
          d.error ||
            `Leads fetch failed (${
              leadsRes.status === 'fulfilled' ? leadsRes.value.status : 'rejected'
            })`,
        );
      }
      if (jobsRes.status === 'fulfilled' && jobsRes.value.ok) {
        const d = await jobsRes.value.json();
        setJobs(d.items || []);
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  const cities = useMemo(() => {
    const m = new Map<string, number>();
    for (const l of leads) {
      const c = str(l.city).trim().toLowerCase();
      if (c) m.set(c, (m.get(c) || 0) + 1);
    }
    return ['all', ...[...m.keys()].sort()];
  }, [leads]);

  const countBy = (field: (l: SocialLead) => string) => {
    const m = new Map<string, number>();
    for (const l of leads) {
      const k = field(l) || 'n/a';
      m.set(k, (m.get(k) || 0) + 1);
    }
    return m;
  };

  const platformCounts = useMemo(() => countBy((l) => str(l.platform_source)), [leads]);
  const intentCounts = useMemo(() => countBy((l) => str(l.intent_type)), [leads]);

  const filteredLeads = useMemo(() => {
    const q = search.trim().toLowerCase();
    const bMin = budgetMin ? Number(budgetMin) : null;
    const bMax = budgetMax ? Number(budgetMax) : null;
    const mScore = minScore ? Number(minScore) : null;
    return leads.filter((l) => {
      if (platform !== 'all' && str(l.platform_source).toLowerCase() !== platform) return false;
      if (intent !== 'all' && str(l.intent_type).toLowerCase() !== intent) return false;
      if (city !== 'all' && str(l.city).trim().toLowerCase() !== city) return false;
      if (buyerProfile !== 'all' && str(l.buyer_profile).toLowerCase() !== buyerProfile)
        return false;
      if (bMin !== null && leadBudget(l) > 0 && leadBudget(l) < bMin) return false;
      if (bMax !== null && leadBudget(l) > 0 && leadBudget(l) > bMax) return false;
      if (mScore !== null && (typeof l.intent_score !== 'number' || l.intent_score < mScore))
        return false;
      if (q) {
        const hay = SEARCH_FIELDS.map((f) => str(l[f]).toLowerCase()).join(' ');
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [leads, search, platform, intent, city, buyerProfile, budgetMin, budgetMax, minScore]);

  const dedupGroups = useMemo(() => {
    const byPhone = new Map<string, SocialLead[]>();
    const byEmail = new Map<string, SocialLead[]>();
    const byWebsite = new Map<string, SocialLead[]>();
    for (const l of leads) {
      const p = (str(l.phone) || '').replace(/[^0-9+]/g, '');
      const e = str(l.email).toLowerCase();
      const w = str(l.website)
        .toLowerCase()
        .replace(/^https?:\/\//, '')
        .replace(/\/$/, '');
      if (p.length >= 10) {
        const arr = byPhone.get(p) || [];
        arr.push(l);
        byPhone.set(p, arr);
      }
      if (e.includes('@')) {
        const arr = byEmail.get(e) || [];
        arr.push(l);
        byEmail.set(e, arr);
      }
      if (w) {
        const arr = byWebsite.get(w) || [];
        arr.push(l);
        byWebsite.set(w, arr);
      }
    }
    const groups: { key: string; kind: string; leads: SocialLead[] }[] = [];
    for (const [k, v] of byPhone)
      if (v.length > 1) groups.push({ key: k, kind: 'phone', leads: v });
    for (const [k, v] of byEmail)
      if (v.length > 1) groups.push({ key: k, kind: 'email', leads: v });
    for (const [k, v] of byWebsite)
      if (v.length > 1) groups.push({ key: k, kind: 'website', leads: v });
    return groups;
  }, [leads]);

  const avgScore = useMemo(() => {
    const scored = leads.filter((l) => typeof l.intent_score === 'number');
    if (!scored.length) return 0;
    return scored.reduce((a, l) => a + (l.intent_score || 0), 0) / scored.length;
  }, [leads]);

  const latestJob = useMemo(() => jobs[0], [jobs]);

  const scraperStatus = useMemo(() => {
    if (!jobs.length)
      return {
        color: 'bg-red-100 text-red-700',
        dot: 'bg-red-500',
        text: 'Scraper idle — 0 jobs recorded (check VPS)',
      };
    const j = latestJob;
    const s = str(j.status).toLowerCase();
    if (s === 'completed' || s === 'success') {
      return {
        color: 'bg-green-100 text-green-800',
        dot: 'bg-green-500',
        text: `Last scrape ${s}${j.city ? ` · ${str(j.city)}` : ''}${
          typeof j.written_count === 'number' ? ` · ${j.written_count} written` : ''
        }`,
      };
    }
    if (s === 'running')
      return {
        color: 'bg-blue-100 text-blue-700',
        dot: 'bg-blue-500',
        text: `Scrape running${j.city ? ` · ${str(j.city)}` : ''}`,
      };
    return {
      color: 'bg-amber-100 text-amber-800',
      dot: 'bg-amber-500',
      text: `Last scrape ${s || 'unknown'}`,
    };
  }, [jobs, latestJob]);

  const citySpread = useMemo(() => {
    const m = new Map<string, { count: number; sum: number }>();
    for (const l of leads) {
      const c = str(l.city).trim() || 'n/a';
      const cur = m.get(c) || { count: 0, sum: 0 };
      cur.count += 1;
      if (typeof l.intent_score === 'number') cur.sum += l.intent_score;
      m.set(c, cur);
    }
    return [...m.entries()]
      .map(([name, v]) => ({ name, count: v.count, avg: v.count ? v.sum / v.count : 0 }))
      .sort((a, b) => b.count - a.count);
  }, [leads]);

  function resetFilters() {
    setSearch('');
    setPlatform('all');
    setIntent('all');
    setCity('all');
    setBuyerProfile('all');
    setBudgetMin('');
    setBudgetMax('');
    setMinScore('');
  }

  if (!authed) return <PinGate onUnlock={() => setAuthed(true)} />;

  return (
    <div class="mx-auto max-w-7xl px-4 py-8">
      <div class="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 class="text-2xl font-bold text-gray-900">Rex Market Place Scraper</h2>
          <p class="text-sm text-gray-500 mt-1">
            Buyer-intent &amp; business leads collected across social platforms &amp; directories.
          </p>
        </div>
        <div class="flex items-center gap-3">
          <span
            class={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium ${scraperStatus.color}`}
          >
            <span class={`h-2 w-2 rounded-full ${scraperStatus.dot}`} />
            {scraperStatus.text}
          </span>
          <button
            onClick={loadAll}
            class="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50"
          >
            Refresh
          </button>
        </div>
      </div>

      {dedupGroups.length > 0 && (
        <div class="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          ⚠️ Potential duplicates detected: {dedupGroups.length} group
          {dedupGroups.length > 1 ? 's' : ''} share the same phone/email/website across platforms.
          Consider deduping before outreach.
        </div>
      )}

      {error && (
        <div class="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div class="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
        <MetricCard value={leads.length} label="Total Leads" color="text-brand-600" />
        <MetricCard
          value={platformCounts.get('reddit') || 0}
          label="Reddit"
          color="text-orange-600"
        />
        <MetricCard
          value={platformCounts.get('bizdata') || 0}
          label="Bizdata"
          color="text-blue-600"
        />
        <MetricCard value={intentCounts.get('buyer') || 0} label="Buyers" color="text-green-600" />
        <MetricCard value={avgScore.toFixed(0)} label="Avg Intent Score" color="text-amber-600" />
        <MetricCard value={citySpread.length} label="Cities" color="text-gray-700" />
        <MetricCard value={jobs.length} label="Scrape Jobs" color="text-purple-600" />
      </div>

      <div class="mb-6 grid gap-4 lg:grid-cols-3">
        <div class="rounded-xl border border-gray-200 bg-white p-4 lg:col-span-1">
          <h3 class="mb-3 text-sm font-semibold text-gray-700">City Spread (territory view)</h3>
          {citySpread.map((c) => {
            const max = citySpread[0]?.count || 1;
            const pct = (c.count / max) * 100;
            const barColor =
              c.avg >= 70
                ? 'bg-green-500'
                : c.avg >= 40
                  ? 'bg-amber-500'
                  : c.avg > 0
                    ? 'bg-red-400'
                    : 'bg-gray-300';
            return (
              <div key={c.name} class="mb-2">
                <div class="flex items-center justify-between text-xs text-gray-600">
                  <span class="capitalize">{c.name}</span>
                  <span>
                    {c.count} {c.count === 1 ? 'lead' : 'leads'}
                    {c.avg > 0 && <span class="ml-1 text-gray-400">avg {c.avg.toFixed(0)}</span>}
                  </span>
                </div>
                <div class="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
                  <div class={`h-full ${barColor}`} style={`width:${pct}%`} />
                </div>
              </div>
            );
          })}
          {!citySpread.length && <p class="text-xs text-gray-400">No city data.</p>}
        </div>

        <div class="rounded-xl border border-gray-200 bg-white p-4 lg:col-span-2">
          <h3 class="mb-3 text-sm font-semibold text-gray-700">Search &amp; Filters</h3>
          <input
            type="text"
            value={search}
            onInput={(e) => setSearch((e.target as HTMLInputElement).value)}
            placeholder="Search name, profile, budget, address, city, category, email, phone…"
            class="mb-3 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:border-brand-500 focus:outline-none"
          />
          <div class="mb-2 flex flex-wrap items-center gap-1.5">
            <span class="mr-1 text-xs font-medium text-gray-400">Platform</span>
            {PLATFORMS.map((p) => (
              <button
                key={p}
                onClick={() => setPlatform(p)}
                class={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize transition-colors ${
                  platform === p
                    ? 'bg-brand-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {p}
                {p !== 'all' && <span class="ml-1 opacity-70">{platformCounts.get(p) || 0}</span>}
              </button>
            ))}
          </div>
          <div class="mb-2 flex flex-wrap items-center gap-1.5">
            <span class="mr-1 text-xs font-medium text-gray-400">Intent</span>
            {(['all', 'buyer'] as const).map((it) => (
              <button
                key={it}
                onClick={() => setIntent(it)}
                class={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize transition-colors ${
                  intent === it
                    ? 'bg-brand-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {it}
                {it !== 'all' && <span class="ml-1 opacity-70">{intentCounts.get(it) || 0}</span>}
              </button>
            ))}
          </div>
          <div class="mb-2 flex flex-wrap items-center gap-1.5">
            <span class="mr-1 text-xs font-medium text-gray-400">City</span>
            {cities.map((c) => (
              <button
                key={c}
                onClick={() => setCity(c)}
                class={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize transition-colors ${
                  city === c
                    ? 'bg-brand-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
          <div class="mb-2 flex flex-wrap items-center gap-1.5">
            <span class="mr-1 text-xs font-medium text-gray-400">Buyer profile</span>
            {BUYER_PROFILES.map((b) => (
              <button
                key={b}
                onClick={() => setBuyerProfile(b)}
                class={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize transition-colors ${
                  buyerProfile === b
                    ? 'bg-brand-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {b.replace('_', ' ')}
              </button>
            ))}
          </div>
          <div class="flex flex-wrap items-end gap-3">
            <div>
              <label class="mb-1 block text-xs font-medium text-gray-400">Budget min (₹)</label>
              <input
                type="number"
                value={budgetMin}
                onInput={(e) => setBudgetMin((e.target as HTMLInputElement).value)}
                placeholder="e.g. 1500000"
                class="w-32 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 focus:border-brand-500 focus:outline-none"
              />
            </div>
            <div>
              <label class="mb-1 block text-xs font-medium text-gray-400">Budget max (₹)</label>
              <input
                type="number"
                value={budgetMax}
                onInput={(e) => setBudgetMax((e.target as HTMLInputElement).value)}
                placeholder="e.g. 50000000"
                class="w-32 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 focus:border-brand-500 focus:outline-none"
              />
            </div>
            <div>
              <label class="mb-1 block text-xs font-medium text-gray-400">Min intent score</label>
              <input
                type="number"
                value={minScore}
                onInput={(e) => setMinScore((e.target as HTMLInputElement).value)}
                placeholder="0–100"
                class="w-24 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 focus:border-brand-500 focus:outline-none"
              />
            </div>
            <button
              onClick={resetFilters}
              class="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50"
            >
              Reset
            </button>
            <span class="ml-auto text-xs text-gray-400">
              Showing {filteredLeads.length} of {leads.length}
            </span>
          </div>
        </div>
      </div>

      <div class="mb-3 flex items-center justify-between">
        <h3 class="text-sm font-semibold text-gray-700">Leads</h3>
        <button
          onClick={() =>
            exportCSV(
              filteredLeads.map((l) => ({
                name: l.name,
                platform_source: l.platform_source,
                city: l.city,
                intent_type: l.intent_type,
                intent_score: l.intent_score,
                buyer_profile: l.buyer_profile,
                budget_stated: l.budget_stated,
                price: l.price,
                budget_min: l.budget_min,
                budget_max: l.budget_max,
                phone: l.phone,
                email: l.email,
                website: l.website,
                profile_url: l.profile_url,
                address: l.address,
                category: l.category,
                business_type: l.business_type,
                scraped_at: l.scraped_at,
              })),
              `marketplace-leads-${new Date().toISOString().slice(0, 10)}.csv`,
            )
          }
          class="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50"
        >
          Export CSV
        </button>
      </div>

      {loading ? (
        <div class="py-16 text-center text-gray-400">Loading leads…</div>
      ) : (
        <div class="overflow-x-auto rounded-xl border border-gray-200 bg-white">
          <table class="w-full text-left text-sm">
            <thead>
              <tr class="border-b border-gray-200 bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                <th class="px-4 py-2.5">Lead</th>
                <th class="px-4 py-2.5">Platform</th>
                <th class="px-4 py-2.5">City</th>
                <th class="px-4 py-2.5">Intent</th>
                <th class="px-4 py-2.5">Score</th>
                <th class="px-4 py-2.5">Buyer profile</th>
                <th class="px-4 py-2.5">Budget</th>
                <th class="px-4 py-2.5">Contact</th>
                <th class="px-4 py-2.5">Scraped</th>
              </tr>
            </thead>
            <tbody>
              {filteredLeads.map((l) => (
                <tr
                  key={l.id}
                  onClick={() => setSelected(l)}
                  class="cursor-pointer border-b border-gray-100 transition-colors hover:bg-brand-50"
                  style={`background:${intentHeatRow(l.intent_score)}`}
                >
                  <td class="px-4 py-2.5">
                    <div class="font-medium text-gray-800">{l.name || '—'}</div>
                    <div class="text-xs text-gray-400">
                      {str(l.category) || str(l.business_type) || ''}
                    </div>
                  </td>
                  <td class="px-4 py-2.5">
                    <span class="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium capitalize text-gray-600">
                      {str(l.platform_source) || '—'}
                    </span>
                  </td>
                  <td class="px-4 py-2.5 text-gray-600">{str(l.city) || '—'}</td>
                  <td class="px-4 py-2.5 text-gray-600">
                    {str(l.intent_type) || '—'}
                    {typeof l.distance_km === 'number' && (
                      <span class="ml-1 text-xs text-gray-400">({l.distance_km.toFixed(0)}km)</span>
                    )}
                  </td>
                  <td class="px-4 py-2.5">
                    <span
                      class={`rounded-full px-2 py-0.5 text-xs font-semibold ${intentColor(
                        l.intent_score,
                      )}`}
                    >
                      {typeof l.intent_score === 'number' ? l.intent_score : '—'}
                    </span>
                  </td>
                  <td class="px-4 py-2.5">
                    {l.buyer_profile ? (
                      <span class="rounded-full bg-blue-50 px-2 py-0.5 text-xs capitalize text-blue-700">
                        {str(l.buyer_profile).replace('_', ' ')}
                      </span>
                    ) : (
                      <span class="text-gray-300">—</span>
                    )}
                  </td>
                  <td class="px-4 py-2.5 text-gray-600">
                    <div>{fmtNum(leadBudget(l)) || '—'}</div>
                    {str(l.budget_stated) && (
                      <div class="text-xs text-gray-400">“{l.budget_stated}”</div>
                    )}
                  </td>
                  <td class="px-4 py-2.5 text-gray-600">
                    {l.phone ? (
                      <div>
                        <a
                          href={`tel:${l.phone}`}
                          class="text-brand-600 hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {l.phone}
                        </a>
                      </div>
                    ) : (
                      <div class="text-gray-300">—</div>
                    )}
                    {l.email ? (
                      <div class="text-xs">
                        <a
                          href={`mailto:${l.email}`}
                          class="text-brand-600 hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {l.email}
                        </a>
                      </div>
                    ) : (
                      <div class="text-gray-300">—</div>
                    )}
                  </td>
                  <td class="px-4 py-2.5 text-xs text-gray-400">
                    {l.scraped_at ? new Date(l.scraped_at).toLocaleDateString() : '—'}
                  </td>
                </tr>
              ))}
              {!filteredLeads.length && (
                <tr>
                  <td colSpan={9} class="px-4 py-10 text-center text-gray-400">
                    No leads match the current filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <h3 class="mb-3 mt-8 text-sm font-semibold text-gray-700">Scrape Jobs</h3>
      {jobs.length === 0 ? (
        <div class="rounded-xl border border-dashed border-gray-300 bg-white px-4 py-10 text-center">
          <div class="mb-2 text-2xl">🛰️</div>
          <p class="text-sm font-medium text-gray-600">Scraper idle — no job records found</p>
          <p class="mt-1 text-xs text-gray-400">
            Check the VPS: /opt/rex-scraper cron and scraper_api.py writing to scrape_jobs.
          </p>
        </div>
      ) : (
        <div class="overflow-x-auto rounded-xl border border-gray-200 bg-white">
          <table class="w-full text-left text-sm">
            <thead>
              <tr class="border-b border-gray-200 bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                <th class="px-4 py-2.5">Job</th>
                <th class="px-4 py-2.5">City</th>
                <th class="px-4 py-2.5">Query</th>
                <th class="px-4 py-2.5">Budget</th>
                <th class="px-4 py-2.5">Distance</th>
                <th class="px-4 py-2.5">Status</th>
                <th class="px-4 py-2.5">Written</th>
                <th class="px-4 py-2.5">Duration</th>
                <th class="px-4 py-2.5">Started</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((j) => (
                <tr key={j.id} class="border-b border-gray-100">
                  <td class="px-4 py-2.5 font-mono text-xs text-gray-700">
                    {str(j.job_id) || j.id}
                  </td>
                  <td class="px-4 py-2.5 capitalize text-gray-600">{str(j.city) || '—'}</td>
                  <td class="px-4 py-2.5 text-gray-600">{str(j.query) || '—'}</td>
                  <td class="px-4 py-2.5 text-gray-600">
                    {fmtNum(j.budget_min)} – {fmtNum(j.budget_max)}
                  </td>
                  <td class="px-4 py-2.5 text-gray-600">
                    {typeof j.distance_km === 'number' ? `${j.distance_km}km` : '—'}
                  </td>
                  <td class="px-4 py-2.5">
                    <JobStatusBadge status={j.status} />
                  </td>
                  <td class="px-4 py-2.5 text-gray-600">
                    {typeof j.written_count === 'number' ? j.written_count : '—'}
                  </td>
                  <td class="px-4 py-2.5 text-gray-600">
                    {typeof j.duration_sec === 'number' ? `${j.duration_sec}s` : '—'}
                  </td>
                  <td class="px-4 py-2.5 text-xs text-gray-400">
                    {j.started_at ? new Date(j.started_at).toLocaleString() : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selected && (
        <div
          class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setSelected(null)}
        >
          <div
            class="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div class="mb-4 flex items-start justify-between">
              <div>
                <h3 class="text-lg font-bold text-gray-900">{selected.name || 'Unnamed lead'}</h3>
                <div class="mt-1 flex flex-wrap gap-2 text-xs">
                  <span class="rounded-full bg-gray-100 px-2 py-0.5 font-medium capitalize text-gray-600">
                    {str(selected.platform_source) || 'unknown platform'}
                  </span>
                  <span
                    class={`rounded-full px-2 py-0.5 font-semibold ${intentColor(
                      selected.intent_score,
                    )}`}
                  >
                    intent{' '}
                    {typeof selected.intent_score === 'number' ? selected.intent_score : 'n/a'}
                  </span>
                  {selected.buyer_profile && (
                    <span class="rounded-full bg-blue-50 px-2 py-0.5 font-medium capitalize text-blue-700">
                      {str(selected.buyer_profile).replace('_', ' ')}
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={() => setSelected(null)}
                class="rounded-lg border border-gray-200 px-2 py-1 text-gray-500 hover:bg-gray-50"
              >
                ✕
              </button>
            </div>
            <dl class="grid grid-cols-1 gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
              {[
                ['City', selected.city],
                ['Category', selected.category],
                ['Business type', selected.business_type],
                ['Address', selected.address],
                ['Phone', selected.phone],
                ['Email', selected.email],
                ['Website', selected.website],
                ['Budget stated', selected.budget_stated],
                ['Budget (₹)', fmtNum(leadBudget(selected))],
                ['Intent type', selected.intent_type],
                [
                  'Followers',
                  typeof selected.follower_count === 'number'
                    ? selected.follower_count.toLocaleString()
                    : '',
                ],
                ['Posts', typeof selected.post_count === 'number' ? selected.post_count : ''],
                [
                  'Engagement rate',
                  typeof selected.engagement_rate === 'number'
                    ? `${selected.engagement_rate}%`
                    : '',
                ],
                [
                  'Distance',
                  typeof selected.distance_km === 'number'
                    ? `${selected.distance_km.toFixed(0)}km`
                    : '',
                ],
                ['Filter reason', selected.filter_reason],
                [
                  'Scraped at',
                  selected.scraped_at ? new Date(selected.scraped_at).toLocaleString() : '',
                ],
              ]
                .filter(([, v]) => str(v))
                .map(([k, v]) => (
                  <div key={str(k)}>
                    <dt class="text-xs font-medium uppercase tracking-wide text-gray-400">
                      {str(k)}
                    </dt>
                    <dd class="text-gray-700">{str(v)}</dd>
                  </div>
                ))}
            </dl>
            {selected.profile_url && (
              <a
                href={selected.profile_url}
                target="_blank"
                rel="noopener noreferrer"
                class="mt-4 inline-block rounded-lg bg-brand-600 px-3 py-2 text-sm font-medium text-white hover:bg-brand-500"
              >
                Open profile ↗
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
