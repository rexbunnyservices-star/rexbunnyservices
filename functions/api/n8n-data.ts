interface Env {
  FORMS: KVNamespace;
  DASHBOARD_API_KEY?: string;
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

function checkAuth(request: Request, env: Env) {
  const key = env.DASHBOARD_API_KEY || "9690";
  if (request.headers.get("x-api-key") !== key) {
    return response({ error: "Unauthorized" }, 401);
  }
}

async function getN8nCookie(baseUrl: string, email: string, password: string) {
  const res = await fetch(`${baseUrl}/rest/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ emailOrLdapLoginId: email, password }),
  });
  if (!res.ok) throw new Error(`n8n login failed (${res.status})`);
  const cookie = res.headers.get("set-cookie") || "";
  const match = cookie.match(/n8n-auth=([^;]+)/);
  if (!match) throw new Error("n8n auth cookie not found");
  return match[0];
}

async function fetchFromN8n(baseUrl: string, cookie: string, path: string) {
  const res = await fetch(`${baseUrl}${path}`, {
    headers: { Cookie: cookie },
  });
  if (!res.ok) throw new Error(`n8n API error (${res.status})`);
  return await res.json();
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const authFail = checkAuth(context.request, context.env);
  if (authFail) return authFail;

  try {
    const url = new URL(context.request.url);
    const resource = url.searchParams.get("resource") || "workflows-all";
    const limit = Math.min(parseInt(url.searchParams.get("limit") || "50"), 200);

    const n8nUrl = context.env.N8N_URL || "https://n8n.rexbunnyservices.online";

    let cookie = await context.env.FORMS.get("n8n_auth_cookie", "text");

    if (!cookie) {
      const email = context.env.N8N_EMAIL || "help@rexbunnyservices.com";
      const password = context.env.N8N_PASSWORD || "Admin12345!";
      cookie = await getN8nCookie(n8nUrl, email, password);
      await context.env.FORMS.put("n8n_auth_cookie", cookie, { expirationTtl: 600 });
    }

    if (resource === "workflows-all") {
      const data = await fetchFromN8n(n8nUrl, cookie, `/rest/workflows?limit=${limit}`);
      return response({ data: data.data || [] });
    }

    if (resource === "executions") {
      const data = await fetchFromN8n(n8nUrl, cookie, `/rest/executions?limit=${limit}`);
      return response({ data: data.data?.results || [] });
    }

    return response({ error: "Unknown resource" }, 400);
  } catch (e: any) {
    return response({ error: e.message }, 500);
  }
};
