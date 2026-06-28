export interface AuditResult {
  leadId: string;
  performanceScore: number;
  seoScore: number;
  accessibilityScore: number;
  bestPracticesScore: number;
  lcp: number;
  cls: number;
  tbt: number;
  aiVisibility: {
    gptBotStatus: "crawlable" | "blocked";
    hasLlmsTxt: boolean;
    hasStructuredData: boolean;
    entityClarity: "high" | "medium" | "low";
    aiVisibilityScore: number;
  };
  compositeScore: number;
}

export function computeCompositeScore(lighthouseScore: number, seoScore: number, aiScore: number): number {
  const perfWeight = 0.4;
  const seoWeight = 0.2;
  const aiWeight = 0.4;
  return Math.round(lighthouseScore * perfWeight + seoScore * seoWeight + aiScore * aiWeight);
}

export function getLeadPriority(score: number): "hot" | "warm" | "cold" {
  if (score < 30) return "hot";
  if (score < 50) return "warm";
  return "cold";
}

export function getRecommendations(audit: Partial<AuditResult>): string[] {
  const recs: string[] = [];
  if (audit.aiVisibility?.gptBotStatus === "blocked") {
    recs.push("Unblock GPTBot in your robots.txt to allow AI crawlers.");
  }
  if (!audit.aiVisibility?.hasLlmsTxt) {
    recs.push("Create an llms.txt file to guide AI crawlers to your key content.");
  }
  if (!audit.aiVisibility?.hasStructuredData) {
    recs.push("Add JSON-LD structured data to help AI models understand your entity.");
  }
  if (audit.performanceScore && audit.performanceScore < 60) {
    recs.push("Optimize Core Web Vitals — LCP, CLS, and TBT need improvement.");
  }
  return recs;
}
