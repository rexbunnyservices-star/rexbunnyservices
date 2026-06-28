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
      status: "running",
      source: "audit_tool",
      score: 0,
    });

    // Fire n8n webhook asynchronously
    const webhookUrl = import.meta.env.N8N_WEBHOOK_URL || "http://localhost:5678";
    const payload = {
      leadId: lead.id,
      url,
      email,
      callbackUrl: `${import.meta.env.PUBLIC_SITE_URL || "http://localhost:3000"}/api/audit-callback`,
    };

    fetch(`${webhookUrl}/webhook/run-audit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).catch((err) => console.error("n8n webhook error:", err));

    return new Response(JSON.stringify({ leadId: lead.id, status: "running" }), {
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
