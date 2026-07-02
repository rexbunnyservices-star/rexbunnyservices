function computeCompositeScore(performanceScore, seoScore, aiVisibilityScore) {
  return Math.round((performanceScore * 0.3 + seoScore * 0.3 + aiVisibilityScore * 0.4));
}

export async function onRequest(context) {
  const { request, env } = context;
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
  };

  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type" } });
  }

  if (request.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers });
  }

  try {
    const { leadId, lighthouseResult, aiVisibilityResult } = await request.json();

    if (!leadId) {
      return new Response(JSON.stringify({ error: "Missing leadId" }), { status: 400, headers });
    }

    const compositeScore = computeCompositeScore(
      lighthouseResult?.performanceScore || 0,
      lighthouseResult?.seoScore || 0,
      aiVisibilityResult?.aiVisibilityScore || 0
    );

    const response = await fetch(`${env.POCKETBASE_URL}/api/collections/leads/records/${leadId}`, {
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
      return new Response(JSON.stringify({ error: "Failed to update audit" }), { status: 500, headers });
    }

    return new Response(JSON.stringify({ status: "ok" }), { status: 200, headers });
  } catch (error) {
    console.error("Audit callback error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), { status: 500, headers });
  }
}
