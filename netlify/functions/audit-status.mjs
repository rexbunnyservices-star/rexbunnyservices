const POCKETBASE_URL = process.env.POCKETBASE_URL || "";

export async function handler(event) {
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
  };

  try {
    const leadId = event.queryStringParameters?.leadId;

    if (!leadId) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: "Missing leadId" }) };
    }

    const response = await fetch(`${POCKETBASE_URL}/api/collections/leads/records/${leadId}`);

    if (!response.ok) {
      return { statusCode: 404, headers, body: JSON.stringify({ error: "Not found" }) };
    }

    const lead = await response.json();

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        status: lead.status,
        auditScore: lead.auditScore,
        aiVisibility: lead.aiVisibility,
        score: lead.score,
      }),
    };
  } catch (error) {
    console.error("Audit status error:", error);
    return { statusCode: 404, headers, body: JSON.stringify({ error: "Not found" }) };
  }
}
