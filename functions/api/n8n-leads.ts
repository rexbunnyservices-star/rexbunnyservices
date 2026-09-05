interface Env {
  DASHBOARD_API_KEY?: string;
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
    headers: { 'Content-Type': 'application/json' },
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

async function fetchFromCollection(
  baseUrl: string,
  token: string,
  collection: string,
  limit: number,
  sort = '-created',
) {
  const url = `${baseUrl}/api/collections/${collection}/records?perPage=${limit}&skipTotal=1&sort=${sort}`;
  const res = await fetch(url, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw new Error(`PocketBase fetch failed (${res.status})`);
  return await res.json();
}

async function pbCount(baseUrl: string, token: string, collection: string, filter: string) {
  const url = `${baseUrl}/api/collections/${collection}/records?perPage=1&count=1${
    filter ? `&filter=${encodeURIComponent(filter)}` : ''
  }`;
  const res = await fetch(url, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw new Error(`PocketBase count failed (${res.status})`);
  const j: any = await res.json();
  return typeof j.totalItems === 'number' ? j.totalItems : 0;
}

async function countSafe(baseUrl: string, token: string, collection: string, filter: string) {
  try {
    return await pbCount(baseUrl, token, collection, filter);
  } catch {
    return 0;
  }
}

async function bootesStats(baseUrl: string, token: string) {
  const c = 'bootes_leads';
  const [
    total,
    organic,
    metaPaid,
    landing,
    optin,
    consent,
    waSent,
    waFailed,
    emailed,
    noEmail,
    unverified,
    pending,
    visitBooked,
  ] = await Promise.all([
    countSafe(baseUrl, token, c, ''),
    countSafe(baseUrl, token, c, 'source = "organic"'),
    countSafe(baseUrl, token, c, 'source = "meta_paid"'),
    countSafe(baseUrl, token, c, 'source = "landing"'),
    countSafe(baseUrl, token, c, 'source = "optin"'),
    countSafe(baseUrl, token, c, 'consent = true'),
    countSafe(baseUrl, token, c, 'waStatus = "sent"'),
    countSafe(baseUrl, token, c, 'waStatus = "failed"'),
    countSafe(baseUrl, token, c, 'campaignStatus = "email_sent"'),
    countSafe(baseUrl, token, c, 'campaignStatus = "no_email_found"'),
    countSafe(baseUrl, token, c, 'campaignStatus = "email_unverified"'),
    countSafe(baseUrl, token, c, 'campaignStatus = ""'),
    countSafe(baseUrl, token, c, 'visitStatus = "booked"'),
  ]);
  const recent = await fetchFromCollection(baseUrl, token, c, 20, '-id');
  return response({
    items: recent.items || [],
    stats: {
      total,
      sources: { organic, meta_paid: metaPaid, landing, optin },
      consent,
      wa: { sent: waSent, failed: waFailed },
      campaign: {
        email_sent: emailed,
        no_email_found: noEmail,
        email_unverified: unverified,
        pending,
      },
      visits: { booked: visitBooked },
    },
  });
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const authFail = checkAuth(context.request, context.env);
  if (authFail) return authFail;

  try {
    const url = new URL(context.request.url);
    const collection = url.searchParams.get('collection') || 'prospects';
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '500'), 1000);

    const pbUrl = context.env.PB_URL || 'https://pb.rexbunnyservices.online';

    const email = context.env.PB_EMAIL || 'admin@rexbunnyservices.com';
    const password = context.env.PB_PASSWORD || 'Admin12345!';
    const token = await pbLogin(pbUrl, email, password);

    if (url.searchParams.get('stats') === 'bootes') {
      return await bootesStats(pbUrl, token);
    }

    if (collection === 'prospects' || collection === 'leads' || collection === 'bootes_leads') {
      const data = await fetchFromCollection(pbUrl, token, collection, limit);
      return response({ items: data.items || [] });
    }

    return response({ error: 'Unknown collection' }, 400);
  } catch (e: any) {
    return response({ error: e.message }, 500);
  }
};
