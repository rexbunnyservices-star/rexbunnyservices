import { useState, useEffect } from "preact/hooks";

interface AuditResults {
  performanceScore: number;
  seoScore: number;
  accessabilityScore: number;
  bestPracticesScore: number;
  lcp: number;
  cls: number;
  tbt: number;
  aiVisibility: {
    gptBotStatus: string;
    hasLlmsTxt: boolean;
    hasStructuredData: boolean;
    entityClarity: string;
    aiVisibilityScore: number;
  };
  compositeScore: number;
}

function ScoreRing({ score, size = 120 }: { score: number; size?: number }) {
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 80 ? "#22c55e" : score >= 50 ? "#eab308" : "#ef4444";

  return (
    <div class="relative inline-flex items-center justify-center">
      <svg width={size} height={size} class="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#1f2937" stroke-width="8" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          stroke-width="8"
          stroke-dasharray={circumference}
          stroke-dashoffset={offset}
          stroke-linecap="round"
          class="transition-all duration-1000 ease-out"
        />
      </svg>
      <span class="absolute flex flex-col items-center">
        <span class="text-3xl font-bold">{score}</span>
        <span class="text-xs text-dark-400">/100</span>
      </span>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: number }) {
  const color = value >= 80 ? "text-green-400" : value >= 50 ? "text-yellow-400" : "text-red-400";
  return (
    <div class="rounded-lg bg-dark-800 p-4 text-center">
      <div class={`text-2xl font-bold ${color}`}>{value}</div>
      <div class="mt-1 text-xs text-dark-400">{label}</div>
    </div>
  );
}

export default function LeadAuditTool() {
  const [url, setUrl] = useState("");
  const [email, setEmail] = useState("");
  const [step, setStep] = useState<"form" | "running" | "complete">("form");
  const [leadId, setLeadId] = useState<string | null>(null);
  const [results, setResults] = useState<AuditResults | null>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (step !== "running" || !leadId) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/audit-status?leadId=${leadId}`);
        const data = await res.json();
        setProgress((prev) => Math.min(prev + 15, 90));

        if (data.status === "completed") {
          clearInterval(interval);
          setResults(data);
          setStep("complete");
          setProgress(100);
        }
      } catch {
        // retry
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [step, leadId]);

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    setStep("running");
    setProgress(10);

    try {
      const res = await fetch("/api/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, email }),
      });
      const { leadId: id } = await res.json();
      setLeadId(id);
    } catch {
      setStep("form");
    }
  };

  const handleReset = () => {
    setStep("form");
    setResults(null);
    setLeadId(null);
    setProgress(0);
  };

  if (step === "running") {
    return (
      <div class="rounded-xl bg-dark-800 p-8 text-center">
        <div class="mb-6 h-2 w-full overflow-hidden rounded-full bg-dark-700">
          <div
            class="h-full rounded-full bg-brand-500 transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div class="mb-2 text-lg font-semibold text-white">Analyzing your site...</div>
        <div class="text-sm text-dark-400">
          {progress < 30 && "Running Lighthouse performance audit..."}
          {progress >= 30 && progress < 60 && "Checking AI search crawlability..."}
          {progress >= 60 && progress < 90 && "Evaluating structured data and entity signals..."}
          {progress >= 90 && "Generating your report..."}
        </div>
      </div>
    );
  }

  if (step === "complete" && results) {
    return (
      <div class="rounded-xl bg-dark-800 p-8">
        <div class="mb-6 flex flex-col items-center">
          <ScoreRing score={results.compositeScore} />
          <h4 class="mt-4 text-xl font-bold text-white">Your AI Visibility Score</h4>
        </div>

        <div class="mb-6 grid grid-cols-3 gap-3">
          <MetricCard label="Performance" value={results.performanceScore} />
          <MetricCard label="SEO" value={results.seoScore} />
          <MetricCard label="AI Readiness" value={results.aiVisibility.aiVisibilityScore} />
        </div>

        <div class="mb-6 rounded-lg bg-dark-900 p-4">
          <h5 class="mb-3 text-sm font-semibold uppercase tracking-wider text-dark-400">
            AI Crawl Status
          </h5>
          <ul class="space-y-2 text-sm">
            <li class="flex items-center gap-2">
              <span class={results.aiVisibility.gptBotStatus === "crawlable" ? "text-green-400" : "text-red-400"}>
                {results.aiVisibility.gptBotStatus === "crawlable" ? "✓" : "✗"}
              </span>
              GPTBot: {results.aiVisibility.gptBotStatus}
            </li>
            <li class="flex items-center gap-2">
              <span class={results.aiVisibility.hasLlmsTxt ? "text-green-400" : "text-red-400"}>
                {results.aiVisibility.hasLlmsTxt ? "✓" : "✗"}
              </span>
              llms.txt: {results.aiVisibility.hasLlmsTxt ? "Found" : "Missing"}
            </li>
            <li class="flex items-center gap-2">
              <span class={results.aiVisibility.hasStructuredData ? "text-green-400" : "text-red-400"}>
                {results.aiVisibility.hasStructuredData ? "✓" : "✗"}
              </span>
              Structured Data: {results.aiVisibility.hasStructuredData ? "Found" : "Missing"}
            </li>
          </ul>
        </div>

        <p class="mb-4 text-sm text-dark-300">
          Your full audit report has been sent to <strong class="text-white">{email}</strong>.
          Book a strategy call to get your personalized GEO roadmap.
        </p>

        <div class="flex flex-col gap-3 sm:flex-row">
          <a
            href="https://cal.rexbunnyservices.online/strategy-call"
            target="_blank"
            rel="noopener noreferrer"
            class="flex-1 rounded-lg bg-brand-600 px-6 py-3 text-center font-semibold text-white transition-colors hover:bg-brand-500"
          >
            Book Your Strategy Call →
          </a>
          <button
            onClick={handleReset}
            class="rounded-lg border border-dark-600 px-6 py-3 text-sm font-medium text-dark-200 transition-colors hover:border-dark-500"
          >
            Run Another Audit
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} class="rounded-xl bg-dark-800 p-8">
      <h3 class="mb-2 text-2xl font-bold text-white">Free AI Visibility & SEO Audit</h3>
      <p class="mb-6 text-sm text-dark-400">
        Discover how your site performs for both search engines and AI models like ChatGPT, Gemini, and Perplexity.
      </p>
      <div class="mb-4">
        <input
          type="url"
          placeholder="yourwebsite.com"
          value={url}
          onInput={(e) => setUrl((e.target as HTMLInputElement).value)}
          required
          class="w-full rounded-lg border border-dark-700 bg-dark-900 px-4 py-3 text-white placeholder-dark-500 focus:border-brand-500 focus:outline-none"
        />
      </div>
      <div class="mb-4">
        <input
          type="email"
          placeholder="your@email.com"
          value={email}
          onInput={(e) => setEmail((e.target as HTMLInputElement).value)}
          required
          class="w-full rounded-lg border border-dark-700 bg-dark-900 px-4 py-3 text-white placeholder-dark-500 focus:border-brand-500 focus:outline-none"
        />
      </div>
      <label class="mb-6 flex items-start gap-2 text-xs text-dark-400">
        <input type="checkbox" required class="mt-0.5" />
        I agree to receive the audit report and follow-up strategies via email
      </label>
      <button
        type="submit"
        class="w-full rounded-lg bg-brand-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-brand-500"
      >
        Run My Free Audit →
      </button>
    </form>
  );
}
