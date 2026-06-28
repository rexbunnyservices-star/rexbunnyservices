import type { APIRoute } from "astro";
import { getClient } from "../../lib/pocketbase";

export const GET: APIRoute = async ({ url }) => {
  try {
    const leadId = url.searchParams.get("leadId");
    if (!leadId) {
      return new Response(JSON.stringify({ error: "Missing leadId" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const pb = getClient();
    const lead = await pb.collection("leads").getOne(leadId);

    return new Response(
      JSON.stringify({
        status: lead.status,
        auditScore: lead.auditScore,
        aiVisibility: lead.aiVisibility,
        score: lead.score,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Audit status error:", error);
    return new Response(JSON.stringify({ error: "Not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }
};
