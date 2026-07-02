function getMailchimpDc(apiKey) {
  const parts = apiKey.split("-");
  return parts.length > 1 ? parts[1] : "us21";
}

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

    if (!env.MAILCHIMP_API_KEY || !env.MAILCHIMP_LIST_ID) {
      console.error("Mailchimp env vars not configured");
      return new Response(JSON.stringify({ error: "Service not configured" }), { status: 500, headers });
    }

    const dc = getMailchimpDc(env.MAILCHIMP_API_KEY);
    const url = `https://${dc}.api.mailchimp.com/3.0/lists/${env.MAILCHIMP_LIST_ID}/members`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `apikey ${env.MAILCHIMP_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email_address: email,
        status: "subscribed",
        merge_fields: { FNAME: name || email.split("@")[0] },
        tags: [source || "website_form"],
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      console.error("Mailchimp error:", response.status, body);
      return new Response(JSON.stringify({ error: "Failed to subscribe" }), { status: 500, headers });
    }

    return new Response(JSON.stringify({ status: "ok" }), { status: 200, headers });
  } catch (error) {
    console.error("Subscribe error:", error);
    return new Response(JSON.stringify({ error: "Failed to subscribe" }), { status: 500, headers });
  }
}
