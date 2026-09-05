interface Env {
  DASHBOARD_API_KEY?: string;
  PB_URL?: string;
  PB_EMAIL?: string;
  PB_PASSWORD?: string;
}

function response(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
    },
  });
}

function checkAuth(request: Request, env: Env) {
  const key = env.DASHBOARD_API_KEY || '9690';
  if (request.headers.get('x-api-key') !== key) {
    return response({ error: 'Unauthorized' }, 401);
  }
}

async function pbLogin(baseUrl: string, email: string, password: string) {
  const res = await fetch(`${baseUrl}/api/collections/_superusers/auth-with-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identity: email, password }),
  });
  if (!res.ok) throw new Error('PocketBase auth failed');
  const { token } = await res.json();
  return token;
}

function buildLeadFilter(params: URLSearchParams): string {
  const parts: string[] = [];
  const platform = params.get('platform');
  const intent = params.get('intent');
  const city = params.get('city');
  const buyerProfile = params.get('buyerProfile');
  const minScore = params.get('minScore');
  const budgetMin = params.get('budgetMin');
  const budgetMax = params.get('budgetMax');
  const q = params.get('q');

  if (platform && platform !== 'all') {
    parts.push(
      platform
        .split(',')
        .filter(Boolean)
        .map((p) => `platform_source='${p.replace(/'/g, '')}'`)
        .join('||'),
    );
  }
  if (intent && intent !== 'all') {
    parts.push(`intent_type='${intent.replace(/'/g, '')}'`);
  }
  if (city && city !== 'all') {
    parts.push(
      city
        .split(',')
        .filter(Boolean)
        .map((c) => `city~'${c.replace(/'/g, '')}'`)
        .join('||'),
    );
  }
  if (buyerProfile && buyerProfile !== 'all') {
    parts.push(
      buyerProfile
        .split(',')
        .filter(Boolean)
        .map((b) => `buyer_profile~'${b.replace(/'/g, '')}'`)
        .join('||'),
    );
  }
  if (minScore && !isNaN(Number(minScore))) {
    parts.push(`intent_score>=${Math.max(0, Number(minScore))}`);
  }
  if (budgetMin && !isNaN(Number(budgetMin))) {
    parts.push(
      `(price>=${Number(budgetMin)}${isNaN(Number(budgetMin)) ? '' : ''}||budget_max>=${Number(
        budgetMin,
      )})`,
    );
  }
  if (budgetMax && !isNaN(Number(budgetMax))) {
    parts.push(`(price<=${Number(budgetMax)}||budget_min<=${Number(budgetMax)})`);
  }
  if (q && q.trim()) {
    const needle = q
      .replace(/[\\'"<>]/g, '')
      .trim()
      .toLowerCase();
    parts.push(
      `(name~'${needle}'||phone~'${needle}'||email~'${needle}'||profile_url~'${needle}'||buyer_profile~'${needle}'||budget_stated~'${needle}'||city~'${needle}'||category~'${needle}')`.replace(
        /\\/g,
        '',
      ),
    );
  }
  return parts.join('&&');
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const authFail = checkAuth(context.request, context.env);
  if (authFail) return authFail;

  try {
    const url = new URL(context.request.url);
    const resource = url.searchParams.get('resource') || 'leads';
    const filter = buildLeadFilter(url.searchParams);

    const pbUrl = context.env.PB_URL || 'https://pb.rexbunnyservices.online';
    const email = context.env.PB_EMAIL || 'admin@rexbunnyservices.com';
    const password = context.env.PB_PASSWORD || 'Admin12345!';
    const token = await pbLogin(pbUrl, email, password);

    if (resource === 'leads') {
      const limit = Math.min(parseInt(url.searchParams.get('limit') || '500') || 500, 1000);
      let api = `${pbUrl}/api/collections/social_leads/records?perPage=${limit}&sort=-scraped_at`;
      if (filter) {
        api += `&filter=${encodeURIComponent(filter)}`;
      }
      const res = await fetch(api, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`PocketBase leads fetch failed (${res.status})`);
      const data = await res.json();
      return response({ items: data.items || [], total: data.totalItems || 0 });
    }

    if (resource === 'jobs') {
      const limit = Math.min(parseInt(url.searchParams.get('limit') || '100') || 100, 500);
      const api = `${pbUrl}/api/collections/scrape_jobs/records?perPage=${limit}&sort=-started_at`;
      const res = await fetch(api, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`PocketBase jobs fetch failed (${res.status})`);
      const data = await res.json();
      return response({ items: data.items || [], total: data.totalItems || 0 });
    }

    return response({ error: `Unknown resource: ${resource}` }, 400);
  } catch (e: any) {
    return response({ error: e.message }, 500);
  }
};
