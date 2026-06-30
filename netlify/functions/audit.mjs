const POCKETBASE_URL = process.env.POCKETBASE_URL || "";
const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL || "";
const N8N_WEBHOOK_AUTH = process.env.N8N_WEBHOOK_AUTH || "";
const PUBLIC_SITE_URL = process.env.PUBLIC_SITE_URL || "https://rexbunnyservices.online";

export async function handler(event) {
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
  };

  try {
    const { url, email } = JSON.parse(event.body || "{}");

    if (!url || !email) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: "Missing fields" }) };
    }

    const response = await fetch(`${POCKETBASE_URL}/api/collections/leads/records`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        website: url,
        status: "pending",
        source: "audit_tool",
        score: 0,
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      console.error("PocketBase error:", response.status, body);
      return { statusCode: 500, headers, body: JSON.stringify({ error: "Failed to create audit" }) };
    }

    const lead = await response.json();

    if (N8N_WEBHOOK_URL) {
      const webhookHeaders = { "Content-Type": "application/json" };
      if (N8N_WEBHOOK_AUTH) {
        webhookHeaders["Authorization"] = N8N_WEBHOOK_AUTH;
      }

      fetch(N8N_WEBHOOK_URL, {
        method: "POST",
        headers: webhookHeaders,
        body: JSON.stringify({
          leadId: lead.id,
          url,
          email,
          callbackUrl: `${PUBLIC_SITE_URL}/api/audit-callback`,
        }),
      }).catch((err) => console.error("n8n webhook error:", err));
    }

    return {
      statusCode: 202,
      headers,
      body: JSON.stringify({ leadId: lead.id, status: "pending" }),
    };
  } catch (error) {
    console.error("Audit error:", error);
    return { statusCode: 500, headers, body: JSON.stringify({ error: "Internal server error" }) };
  }
}
