import type { APIRoute } from "astro";

const MAILCHIMP_API_KEY = import.meta.env.MAILCHIMP_API_KEY || "";
const MAILCHIMP_LIST_ID = import.meta.env.MAILCHIMP_LIST_ID || "";

function getMailchimpDc(): string {
  const parts = MAILCHIMP_API_KEY.split("-");
  return parts.length > 1 ? parts[1] : "us21";
}

export const POST: APIRoute = async ({ request }) => {
  try {
    const { email, name, source } = await request.json();

    if (!email) {
      return new Response(JSON.stringify({ error: "Missing email" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!MAILCHIMP_API_KEY || !MAILCHIMP_LIST_ID) {
      console.error("Mailchimp env vars not configured");
      return new Response(JSON.stringify({ error: "Service not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const dc = getMailchimpDc();
    const url = `https://${dc}.api.mailchimp.com/3.0/lists/${MAILCHIMP_LIST_ID}/members`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `apikey ${MAILCHIMP_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email_address: email,
        status: "subscribed",
        merge_fields: {
          FNAME: name || email.split("@")[0],
        },
        tags: [source || "website_form"],
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      console.error("Mailchimp error:", response.status, body);
      return new Response(JSON.stringify({ error: "Failed to subscribe" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
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
