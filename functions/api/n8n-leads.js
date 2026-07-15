export async function onRequest(context) {
  const { request } = context;
  const corsHeaders = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (request.method !== "GET") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers: corsHeaders });
  }

  try {
    const url = new URL(request.url);
    const collection = url.searchParams.get("collection") || "leads";
    const limit = Math.min(parseInt(url.searchParams.get("limit") || "100", 10), 500);
    const sort = url.searchParams.get("sort") || "-id";
    const page = parseInt(url.searchParams.get("page") || "1", 10);
    const filter = url.searchParams.get("filter") || "";

    const pbUrl = "https://pb.rexbunnyservices.online";
    let pbUrl_fetch = `${pbUrl}/api/collections/${encodeURIComponent(collection)}/records?sort=${sort}&perPage=${limit}&page=${page}`;
    if (filter) pbUrl_fetch += `&filter=${encodeURIComponent(filter)}`;

    const dataRes = await fetch(pbUrl_fetch);

    if (!dataRes.ok) {
      let errText;
      try { errText = await dataRes.text(); } catch(e) { errText = "Could not read error body"; }
      return new Response(JSON.stringify({ error: "PocketBase error", detail: errText, status: dataRes.status, url: pbUrl_fetch }), { status: 502, headers: corsHeaders });
    }

    let data;
    try { data = await dataRes.json(); } catch(e) {
      return new Response(JSON.stringify({ error: "Failed to parse PB response", detail: e.message }), { status: 502, headers: corsHeaders });
    }
    return new Response(JSON.stringify({ items: data.items || [], totalItems: data.totalItems || 0, totalPages: data.totalPages || 0, page: data.page || page }), { status: 200, headers: corsHeaders });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders });
  }
}
