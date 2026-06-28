import type { APIRoute } from "astro";

export const POST: APIRoute = async ({ request }) => {
  try {
    const { email, name, source } = await request.json();

    if (!email) {
      return new Response(JSON.stringify({ error: "Missing email" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Forward to Listmonk
    const listmonkUrl = import.meta.env.LISTMONK_URL || "http://localhost:9000";
    const response = await fetch(`${listmonkUrl}/api/subscribers`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        name: name || email.split("@")[0],
        status: "enabled",
        lists: [1],
        attribs: { source: source || "website_form" },
      }),
    });

    if (!response.ok) {
      throw new Error(`Listmonk error: ${response.status}`);
    }

    return new Response(JSON.stringify({ status: "ok" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Subscribe error:", error);
    return new Response(JSON.stringify({ error: "Failed to subscribe" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
