const POCKETBASE_URL = process.env.POCKETBASE_URL || "";

function computeCompositeScore(performanceScore, seoScore, aiVisibilityScore) {
  return Math.round((performanceScore * 0.3 + seoScore * 0.3 + aiVisibilityScore * 0.4));
}

export async function handler(event) {
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
  };

  try {
    const { leadId, lighthouseResult, aiVisibilityResult } = JSON.parse(event.body || "{}");

    if (!leadId) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: "Missing leadId" }) };
    }

    const compositeScore = computeCompositeScore(
      lighthouseResult?.performanceScore || 0,
      lighthouseResult?.seoScore || 0,
      aiVisibilityResult?.aiVisibilityScore || 0
    );

    const response = await fetch(`${POCKETBASE_URL}/api/collections/leads/records/${leadId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        auditScore: lighthouseResult,
        aiVisibility: aiVisibilityResult,
        score: compositeScore,
        status: "completed",
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      console.error("PocketBase update error:", response.status, body);
      return { statusCode: 500, headers, body: JSON.stringify({ error: "Failed to update audit" }) };
    }

    return { statusCode: 200, headers, body: JSON.stringify({ status: "ok" }) };
  } catch (error) {
    console.error("Audit callback error:", error);
    return { statusCode: 500, headers, body: JSON.stringify({ error: "Internal server error" }) };
  }
}
