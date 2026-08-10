interface Env {
  FORMS: KVNamespace;
  DASHBOARD_API_KEY?: string;
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

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const authFail = checkAuth(context.request, context.env);
  if (authFail) return authFail;

  try {
    const url = new URL(context.request.url);
    const type = url.searchParams.get("type") || "audit";
    const prefix = type === "contact" ? "contact_" : "audit_";

    const list = await context.env.FORMS.list({ prefix });
    const items = [];
    for (const keyMeta of list.keys) {
      try {
        const raw = await context.env.FORMS.get(keyMeta.name);
        if (!raw) continue;
        items.push({ key: keyMeta.name, data: JSON.parse(raw) });
      } catch {
        // skip unparseable
      }
    }
    return response({ type, total: items.length, items });
  } catch (e: any) {
    return response({ error: e.message }, 500);
  }
};

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const authFail = checkAuth(context.request, context.env);
  if (authFail) return authFail;

  try {
    const { keys } = await context.request.json();
    if (!Array.isArray(keys) || keys.length === 0) {
      return response({ error: "keys array is required" }, 400);
    }
    let deleted = 0;
    for (const key of keys) {
      await context.env.FORMS.delete(key);
      deleted++;
    }
    return response({ deleted });
  } catch (e: any) {
    return response({ error: e.message }, 500);
  }
};
