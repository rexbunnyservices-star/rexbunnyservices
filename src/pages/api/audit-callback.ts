import type { APIRoute } from "astro";
import { getClient } from "../../lib/pocketbase";
import { computeCompositeScore } from "../../lib/audit-engine";

export const POST: APIRoute = async ({ request }) => {
  try {
    const { leadId, lighthouseResult, aiVisibilityResult } = await request.json();

    if (!leadId) {
      return new Response(JSON.stringify({ error: "Missing leadId" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const compositeScore = computeCompositeScore(
      lighthouseResult?.performanceScore || 0,
      lighthouseResult?.seoScore || 0,
      aiVisibilityResult?.aiVisibilityScore || 0
    );

    const pb = getClient();
    await pb.collection("leads").update(leadId, {
      auditScore: lighthouseResult,
      aiVisibility: aiVisibilityResult,
      score: compositeScore,
      status: "completed",
    });

    return new Response(JSON.stringify({ status: "ok" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Audit callback error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
