const MAILCHIMP_API_KEY = process.env.MAILCHIMP_API_KEY || "";
const MAILCHIMP_LIST_ID = process.env.MAILCHIMP_LIST_ID || "";

function getMailchimpDc() {
  const parts = MAILCHIMP_API_KEY.split("-");
  return parts.length > 1 ? parts[1] : "us21";
}

export async function handler(event) {
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
  };

  try {
    const { email, name, source } = JSON.parse(event.body || "{}");

    if (!email) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: "Missing email" }) };
    }

    if (!MAILCHIMP_API_KEY || !MAILCHIMP_LIST_ID) {
      console.error("Mailchimp env vars not configured");
      return { statusCode: 500, headers, body: JSON.stringify({ error: "Service not configured" }) };
    }

    const dc = getMailchimpDc();
    const url = `https://${dc}.api.mailchimp.com/3.0/lists/${MAILCHIMP_LIST_ID}/members`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `apikey ${MAILCHIMP_API_KEY}`,
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
      return { statusCode: 500, headers, body: JSON.stringify({ error: "Failed to subscribe" }) };
    }

    return { statusCode: 200, headers, body: JSON.stringify({ status: "ok" }) };
  } catch (error) {
    console.error("Subscribe error:", error);
    return { statusCode: 500, headers, body: JSON.stringify({ error: "Failed to subscribe" }) };
  }
}
