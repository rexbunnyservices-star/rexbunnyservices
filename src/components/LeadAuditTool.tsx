import { useState } from "preact/hooks";

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
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#e5e7eb" stroke-width="8" />
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
        <span class="text-3xl font-bold text-gray-900">{score}</span>
        <span class="text-xs text-gray-500">/100</span>
      </span>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: number }) {
  const color = value >= 80 ? "text-green-400" : value >= 50 ? "text-yellow-400" : "text-red-400";
  return (
    <div class="rounded-lg bg-gray-100 p-4 text-center">
      <div class={`text-2xl font-bold ${color}`}>{value}</div>
      <div class="mt-1 text-xs text-gray-500">{label}</div>
    </div>
  );
}

export default function LeadAuditTool() {
  const [url, setUrl] = useState("");
  const [email, setEmail] = useState("");
  const [step, setStep] = useState<"form" | "running" | "complete">("form");
  const [results, setResults] = useState<AuditResults | null>(null);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    setStep("running");
    setProgress(10);
    setError("");

    const progressInterval = setInterval(() => {
      setProgress((prev) => Math.min(prev + 5, 95));
    }, 2000);

    try {
      setProgress(30);
      const res = await fetch("/api/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, email }),
      });

      if (!res.ok) throw new Error("Audit request failed");

      setProgress(90);
      const data: AuditResults = await res.json();

      setResults(data);
      setStep("complete");
      setProgress(100);
    } catch {
      setError("Something went wrong. Please try again.");
      setStep("form");
    } finally {
      clearInterval(progressInterval);
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
      <div class="rounded-xl bg-gray-100 p-8 text-center">
        <div class="mb-6 h-2 w-full overflow-hidden rounded-full bg-gray-200">
          <div
            class="h-full rounded-full bg-brand-500 transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div class="mb-2 text-lg font-semibold text-gray-900">Analyzing your site...</div>
        <div class="text-sm text-gray-500">
          {progress < 30 && "Preparing audit request..."}
          {progress >= 30 && progress < 60 && "Running Lighthouse performance audit..."}
          {progress >= 60 && progress < 90 && "Checking AI search crawlability..."}
          {progress >= 90 && "Generating your report..."}
        </div>
      </div>
    );
  }

  if (step === "complete" && results) {
    return (
      <div class="rounded-xl bg-gray-100 p-8">
        <div class="mb-6 flex flex-col items-center">
          <ScoreRing score={results.compositeScore} />
          <h4 class="mt-4 text-xl font-bold text-gray-900">Your AI Visibility Score</h4>
        </div>

        <div class="mb-6 grid grid-cols-3 gap-3">
          <MetricCard label="Performance" value={results.performanceScore} />
          <MetricCard label="SEO" value={results.seoScore} />
          <MetricCard label="AI Readiness" value={results.aiVisibility.aiVisibilityScore} />
        </div>

        <div class="mb-6 rounded-lg bg-white p-4">
          <h5 class="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-500">
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

        <p class="mb-4 text-sm text-gray-600">
          Your full audit report has been sent to <strong class="text-gray-900">{email}</strong>.
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
            class="rounded-lg border border-gray-300 px-6 py-3 text-sm font-medium text-gray-700 transition-colors hover:border-gray-400"
          >
            Run Another Audit
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} class="rounded-xl bg-gray-100 p-8">
      <h3 class="mb-2 text-2xl font-bold text-gray-900">Free AI Visibility & SEO Audit</h3>
      <p class="mb-6 text-sm text-gray-500">
        Discover how your site performs for both search engines and AI models like ChatGPT, Gemini, and Perplexity.
      </p>
      {error && (
        <div class="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>
      )}
      <div class="mb-4">
        <input
          type="url"
          placeholder="yourwebsite.com"
          value={url}
          onInput={(e) => setUrl((e.target as HTMLInputElement).value)}
          required
          class="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 placeholder-gray-400 focus:border-brand-500 focus:outline-none"
        />
      </div>
      <div class="mb-4">
        <input
          type="email"
          placeholder="your@email.com"
          value={email}
          onInput={(e) => setEmail((e.target as HTMLInputElement).value)}
          required
          class="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 placeholder-gray-400 focus:border-brand-500 focus:outline-none"
        />
      </div>
      <label class="mb-6 flex items-start gap-2 text-xs text-gray-500">
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
