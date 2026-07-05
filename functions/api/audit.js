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
    const { url, email } = await request.json();

    if (!url || !email) {
      return new Response(JSON.stringify({ error: "Missing fields" }), { status: 400, headers });
    }

    const response = await fetch(`http://pb-internal.rexbunnyservices.online:8090/api/collections/leads/records`, {
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
      return new Response(JSON.stringify({ error: "Failed to create audit" }), { status: 500, headers });
    }

    const lead = await response.json();

    const webhookHeaders = { "Content-Type": "application/json" };

    fetch("http://n8n-internal.rexbunnyservices.online:5678/webhook/run-audit", {
        method: "POST",
        headers: webhookHeaders,
        body: JSON.stringify({
          leadId: lead.id,
          url,
          email,
          callbackUrl: `https://rexbunnyservices.online/api/audit-callback`,
        }),
      }).catch((err) => console.error("n8n webhook error:", err));

    return new Response(JSON.stringify({ leadId: lead.id, status: "pending" }), { status: 202, headers });
  } catch (error) {
    console.error("Audit error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), { status: 500, headers });
  }
}
