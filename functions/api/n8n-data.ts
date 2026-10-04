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
    headers: { 'Content-Type': 'application/json' },
  });
}

function checkAuth(request: Request, env: Env) {
  const key = env.DASHBOARD_API_KEY || '9690';
  if (request.headers.get('x-api-key') !== key) {
    return response({ error: 'Unauthorized' }, 401);
  }
}

async function getN8nCookie(baseUrl: string, email: string, password: string) {
  const res = await fetch(`${baseUrl}/rest/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ emailOrLdapLoginId: email, password }),
  });
  if (!res.ok) throw new Error(`n8n login failed (${res.status})`);
  const cookie = res.headers.get('set-cookie') || '';
  const match = cookie.match(/n8n-auth=([^;]+)/);
  if (!match) throw new Error('n8n auth cookie not found');
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
    const resource = url.searchParams.get('resource') || 'workflows-all';
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 200);

    const n8nUrl = context.env.N8N_URL || 'https://n8n.rexbunnyservices.online';

    let cookie = await context.env.FORMS.get('n8n_auth_cookie', 'text');

    if (!cookie) {
      const email = context.env.N8N_EMAIL || 'help@rexbunnyservices.com';
      const password = context.env.N8N_PASSWORD || 'Admin12345!';
      cookie = await getN8nCookie(n8nUrl, email, password);
      await context.env.FORMS.put('n8n_auth_cookie', cookie, { expirationTtl: 600 });
    }

    if (resource === 'workflows-all') {
      const data = await fetchFromN8n(n8nUrl, cookie, `/rest/workflows?limit=${limit}`);
      return response({ data: data.data || [] });
    }

    if (resource === 'executions') {
      const data = await fetchFromN8n(n8nUrl, cookie, `/rest/executions?limit=${limit}`);
      return response({ data: data.data?.results || [] });
    }

    if (resource === 'execution') {
      const id = url.searchParams.get('id');
      if (!id) return response({ error: 'Missing id' }, 400);
      const data = await fetchFromN8n(n8nUrl, cookie, `/rest/executions/${id}?includeData=true`);
      const summary: any = {
        id: data.id,
        status: data.status,
        finished: data.finished,
        mode: data.mode,
        startedAt: data.startedAt,
        stoppedAt: data.stoppedAt,
        workflowData: data.workflowData || {},
        error: null,
      };
      const flat = (data as any).data;
      if (Array.isArray(flat)) {
        for (const el of flat) {
          if (el && typeof el === 'object' && (el as any).error) {
            const err = (el as any).error;
            summary.error =
              typeof err === 'string' ? err : err?.message || JSON.stringify(err).slice(0, 500);
            break;
          }
        }
      }
      return response({ data: summary });
    }

    return response({ error: 'Unknown resource' }, 400);
  } catch (e: any) {
    return response({ error: e.message }, 500);
  }
};

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const authFail = checkAuth(context.request, context.env);
  if (authFail) return authFail;

  try {
    const body: any = await context.request.json();
    const { workflowId, active } = body || {};
    if (!workflowId || typeof active !== 'boolean') {
      return response({ error: 'workflowId and active (boolean) required' }, 400);
    }

    const n8nUrl = context.env.N8N_URL || 'https://n8n.rexbunnyservices.online';

    let cookie = await context.env.FORMS.get('n8n_auth_cookie', 'text');
    if (!cookie) {
      const email = context.env.N8N_EMAIL || 'help@rexbunnyservices.com';
      const password = context.env.N8N_PASSWORD || 'Admin12345!';
      cookie = await getN8nCookie(n8nUrl, email, password);
      await context.env.FORMS.put('n8n_auth_cookie', cookie, { expirationTtl: 600 });
    }

    if (active) {
      const wf = await fetchFromN8n(n8nUrl, cookie, `/rest/workflows/${workflowId}`);
      const versionId = wf?.activeVersionId || wf?.versionId;
      if (!versionId) return response({ error: 'No versionId found for workflow' }, 400);
      const res = await fetch(`${n8nUrl}/rest/workflows/${workflowId}/activate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Cookie: cookie },
        body: JSON.stringify({ versionId }),
      });
      if (!res.ok) {
        const t = await res.text();
        throw new Error(`activate failed (${res.status}): ${t.slice(0, 300)}`);
      }
      return response({ ok: true, active: true });
    }

    const res = await fetch(`${n8nUrl}/rest/workflows/${workflowId}/deactivate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookie },
    });
    if (!res.ok) {
      const t = await res.text();
      throw new Error(`deactivate failed (${res.status}): ${t.slice(0, 300)}`);
    }
    return response({ ok: true, active: false });
  } catch (e: any) {
    return response({ error: e.message }, 500);
  }
};
