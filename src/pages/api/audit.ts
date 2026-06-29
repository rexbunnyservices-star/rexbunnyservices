import type { APIRoute } from "astro";
import { getClient } from "../../lib/pocketbase";

export const POST: APIRoute = async ({ request }) => {
  try {
    const { url, email } = await request.json();

    if (!url || !email) {
      return new Response(JSON.stringify({ error: "Missing fields" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const pb = getClient();
    const lead = await pb.collection("leads").create({
      email,
      website: url,
      status: "pending",
      source: "audit_tool",
      score: 0,
    });

    return new Response(JSON.stringify({ leadId: lead.id, status: "pending" }), {
      status: 202,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Audit error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
