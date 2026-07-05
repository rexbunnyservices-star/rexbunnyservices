export async function onRequest(context) {
  const { request, env } = context;

  console.log("Subscribe function called", request.method, request.url);

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
    const body = await request.json();
    console.log("Request body parsed", JSON.stringify(body));

    const { email, name, source } = body;

    if (!email) {
      return new Response(JSON.stringify({ error: "Missing email" }), { status: 400, headers });
    }

    const listmonkUrl = "https://listmonk.rexbunnyservices.online";
    const listId = 1;
    const username = "listmonk-api";
    const password = env.LISTMONK_PASS || "";

    if (!password) {
      console.error("Listmonk password not configured");
      return new Response(JSON.stringify({ error: "Service not configured" }), { status: 500, headers });
    }

    const basicAuth = btoa(`${username}:${password}`);
    const fetchUrl = `${listmonkUrl}/api/subscribers`;
    console.log("Fetching", fetchUrl);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000);

    try {
      const response = await fetch(fetchUrl, {
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
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      console.log("Response status:", response.status);
      const respBody = await response.text();
      console.log("Response body:", respBody);

      if (!response.ok) {
        return new Response(JSON.stringify({ error: "Listmonk API error", detail: { status: response.status, body: respBody } }), { status: 500, headers });
      }

      return new Response(JSON.stringify({ status: "ok" }), { status: 200, headers });
    } catch (fetchError) {
      clearTimeout(timeoutId);
      console.error("Fetch error:", fetchError.message, fetchError.stack);
      return new Response(JSON.stringify({ error: "Listmonk connection error", detail: fetchError.message }), { status: 502, headers });
    }
  } catch (error) {
    console.error("Subscribe error:", error.message, error.stack);
    return new Response(JSON.stringify({ error: "Internal error", detail: error.message }), { status: 500, headers });
  }
}
