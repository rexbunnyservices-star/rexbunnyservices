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
    const { email, name, source } = await request.json();

    if (!email) {
      return new Response(JSON.stringify({ error: "Missing email" }), { status: 400, headers });
    }

    const listmonkUrl = env.LISTMONK_URL || "https://listmonk.rexbunnyservices.online";
    const listId = parseInt(env.LISTMONK_LIST_ID || "1", 10);
    const username = env.LISTMONK_USER || "admin";
    const password = env.LISTMONK_PASS || "";

    if (!password) {
      console.error("Listmonk password not configured");
      return new Response(JSON.stringify({ error: "Service not configured" }), { status: 500, headers });
    }

    const basicAuth = btoa(`${username}:${password}`);

    const response = await fetch(`${listmonkUrl}/api/subscribers`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${basicAuth}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        name: name || email.split("@")[0],
        status: "enabled",
        lists: [listId],
        attribs: { source: source || "website_form" },
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      console.error("Listmonk error:", response.status, body);
      return new Response(JSON.stringify({ error: "Failed to subscribe" }), { status: 500, headers });
    }

    return new Response(JSON.stringify({ status: "ok" }), { status: 200, headers });
  } catch (error) {
    console.error("Subscribe error:", error);
    return new Response(JSON.stringify({ error: "Failed to subscribe" }), { status: 500, headers });
  }
}
