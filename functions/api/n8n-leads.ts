interface Env {
  PB_URL?: string;
  PB_EMAIL?: string;
  PB_PASSWORD?: string;
  N8N_URL?: string;
  N8N_EMAIL?: string;
  N8N_PASSWORD?: string;
}

function response(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

async function pbLogin(baseUrl: string, email: string, password: string) {
  const res = await fetch(`${baseUrl}/api/collections/_superusers/auth-with-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ identity: email, password }),
  });
  if (!res.ok) throw new Error("PocketBase auth failed");
  const { token } = await res.json();
  return token;
}

async function fetchFromCollection(baseUrl: string, token: string, collection: string, limit: number) {
  const url = `${baseUrl}/api/collections/${collection}/records?perPage=${limit}&skipTotal=1&sort=-created`;
  const res = await fetch(url, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw new Error(`PocketBase fetch failed (${res.status})`);
  return await res.json();
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const url = new URL(context.request.url);
    const collection = url.searchParams.get("collection") || "prospects";
    const limit = Math.min(parseInt(url.searchParams.get("limit") || "500"), 1000);

    const pbUrl = context.env.PB_URL || "https://pb.rexbunnyservices.online";

    if (collection === "prospects") {
      const data = await fetchFromCollection(pbUrl, "", "prospects", limit);
      return response({ items: data.items || [] });
    }

    if (collection === "leads") {
      const email = context.env.PB_EMAIL || "admin@rexbunnyservices.com";
      const password = context.env.PB_PASSWORD || "Admin12345!";
      const token = await pbLogin(pbUrl, email, password);
      const data = await fetchFromCollection(pbUrl, token, "leads", limit);
      return response({ items: data.items || [] });
    }

    return response({ error: "Unknown collection" }, 400);
  } catch (e: any) {
    return response({ error: e.message }, 500);
  }
};
