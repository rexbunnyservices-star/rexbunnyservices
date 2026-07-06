export async function onRequest(context) {
  const { request } = context;
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

    const pbUrl = "https://pb.rexbunnyservices.online";
    const n8nUrl = "https://n8n.rexbunnyservices.online";

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000);

    const pbResp = await fetch(`${pbUrl}/api/collections/leads/records`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        website: url,
        status: "pending",
        source: "audit_tool",
        score: 0,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!pbResp.ok) {
      const body = await pbResp.text();
      console.error("PocketBase error:", pbResp.status, body);
      return new Response(JSON.stringify({ error: "Failed to create audit", detail: { status: pbResp.status, body: body } }), { status: 500, headers });
    }

    const lead = await pbResp.json();

    fetch(`${n8nUrl}/webhook/run-audit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        leadId: lead.id,
        url,
        email,
        callbackUrl: "https://rexbunnyservices.online/api/audit-callback",
      }),
    }).catch((err) => console.error("n8n webhook error:", err));

    return new Response(JSON.stringify({ leadId: lead.id, status: "pending" }), { status: 202, headers });
  } catch (error) {
    console.error("Audit error:", error.message, error.stack);
    return new Response(JSON.stringify({ error: "Internal server error" }), { status: 500, headers });
  }
}
