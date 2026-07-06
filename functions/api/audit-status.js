export async function onRequest(context) {
  const { request } = context;
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
  };

  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET, OPTIONS", "Access-Control-Allow-Headers": "Content-Type" } });
  }

  if (request.method !== "GET") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers });
  }

  try {
    const url = new URL(request.url);
    const leadId = url.searchParams.get("leadId");

    if (!leadId) {
      return new Response(JSON.stringify({ error: "Missing leadId" }), { status: 400, headers });
    }

    const pbUrl = "https://pb.rexbunnyservices.online";

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000);

    const response = await fetch(`${pbUrl}/api/collections/leads/records/${leadId}`, {
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return new Response(JSON.stringify({ error: "Not found" }), { status: 404, headers });
    }

    const lead = await response.json();

    return new Response(JSON.stringify({
      status: lead.status,
      auditScore: lead.auditScore,
      aiVisibility: lead.aiVisibility,
      score: lead.score,
    }), { status: 200, headers });
  } catch (error) {
    console.error("Audit status error:", error.message, error.stack);
    return new Response(JSON.stringify({ error: "Not found" }), { status: 404, headers });
  }
}
