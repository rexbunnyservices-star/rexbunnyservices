const POCKETBASE_URL = process.env.POCKETBASE_URL || "";

export async function handler(event) {
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
  };

  try {
    const { url, email } = JSON.parse(event.body || "{}");

    if (!url || !email) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: "Missing fields" }) };
    }

    const response = await fetch(`${POCKETBASE_URL}/api/collections/leads/records`, {
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
      return { statusCode: 500, headers, body: JSON.stringify({ error: "Failed to create audit" }) };
    }

    const lead = await response.json();

    return {
      statusCode: 202,
      headers,
      body: JSON.stringify({ leadId: lead.id, status: "pending" }),
    };
  } catch (error) {
    console.error("Audit error:", error);
    return { statusCode: 500, headers, body: JSON.stringify({ error: "Internal server error" }) };
  }
}
