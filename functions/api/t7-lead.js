export async function onRequest(context) {
  const { request, env } = context;

  console.log("T7 lead function called", request.method, request.url);

  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
  };

  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  }

  if (request.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers });
  }

  try {
    const body = await request.json();
    console.log("Request body parsed", JSON.stringify(body));

    const { name, phone, email, preferred_unit, budget, message, source } = body;

    if (!name || !phone) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: name and phone are required" }),
        { status: 400, headers }
      );
    }

    const webhookUrl =
      env.N8N_T7_WEBHOOK || "https://n8n.rexbunnyservices.online/webhook/t7-lead";

    const payload = {
      name: String(name).trim(),
      phone: String(phone).trim(),
      email: email ? String(email).trim() : "",
      preferred_unit: preferred_unit || "",
      budget: budget || "",
      message: message || "",
      source: source || "tower7_site",
    };

    console.log("Forwarding to n8n webhook", webhookUrl);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000);

    try {
      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      console.log("n8n webhook response status:", response.status);

      if (!response.ok) {
        const respBody = await response.text();
        console.error("n8n webhook error body:", respBody);
        return new Response(
          JSON.stringify({ error: "Lead service error", detail: { status: response.status } }),
          { status: 502, headers }
        );
      }

      return new Response(JSON.stringify({ status: "ok" }), { status: 200, headers });
    } catch (fetchError) {
      clearTimeout(timeoutId);
      console.error("Fetch error:", fetchError.message, fetchError.stack);
      return new Response(
        JSON.stringify({ error: "Lead service connection error", detail: fetchError.message }),
        { status: 502, headers }
      );
    }
  } catch (error) {
    console.error("t7-lead error:", error.message, error.stack);
    return new Response(JSON.stringify({ error: "Internal error", detail: error.message }), { status: 500, headers });
  }
}
