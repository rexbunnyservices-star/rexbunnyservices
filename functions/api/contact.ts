interface Env {
  FORMS: KVNamespace;
  PB_URL?: string;
  PB_EMAIL?: string;
  PB_PASSWORD?: string;
}

async function syncLeadToPocketBase(env: Env, lead: any) {
  const baseUrl = env.PB_URL || 'https://pb.rexbunnyservices.online';
  const email = env.PB_EMAIL || 'admin@rexbunnyservices.com';
  const password = env.PB_PASSWORD;

  const authRes = await fetch(`${baseUrl}/api/collections/_superusers/auth-with-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identity: email, password }),
  });
  if (!authRes.ok) throw new Error('PocketBase auth failed');
  const { token } = await authRes.json();

  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

  const existingRes = await fetch(
    `${baseUrl}/api/collections/leads/records?perPage=1&filter=${encodeURIComponent(
      `email="${lead.email}"`,
    )}`,
    { headers },
  );
  if (existingRes.ok) {
    const existing = await existingRes.json();
    if (existing.items?.length) return { deduped: true, id: existing.items[0].id };
  }

  const createRes = await fetch(`${baseUrl}/api/collections/leads/records`, {
    method: 'POST',
    headers,
    body: JSON.stringify(lead),
  });
  if (!createRes.ok) throw new Error(`PocketBase create failed (${createRes.status})`);
  const created = await createRes.json();
  return { deduped: false, id: created.id };
}


// Built-in KV rate limiter for public, unauthenticated form endpoints.
// 12 requests / hour / connecting IP. Key is IP-hashed so no raw PII is stored.
async function rateLimited(env: Env, request: Request): Promise<Response | null> {
  const ip = request.headers.get('Cf-Connecting-IP') || request.headers.get('x-forwarded-for') || 'unknown';
  let hash = 5381;
  for (let i = 0; i < ip.length; i++) hash = ((hash << 5) + hash + ip.charCodeAt(i)) | 0;
  const bucket = Math.floor(Date.now() / 3600000);
  const key = `rl:${Math.abs(hash).toString(36)}:${bucket}`;
  try {
    const raw = await env.FORMS.get(key, 'text');
    const n = raw ? parseInt(raw, 10) || 0 : 0;
    if (n >= 12) {
      return new Response(JSON.stringify({ error: 'Too many requests. Please try again later.' }), {
        status: 429,
        headers: { 'Content-Type': 'application/json', 'Retry-After': '3600' },
      });
    }
    await env.FORMS.put(key, String(n + 1), { expirationTtl: 3600 });
  } catch {
    // Never block a real submission because the limiter failed.
  }
  return null;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  
  const limited = await rateLimited(context.env, context.request);
  if (limited) return limited;
try {
    const { name, email, company, phone, service, message, source } = await context.request.json();
    if (!name || !email || !message) {
      return new Response(JSON.stringify({ error: 'name, email, and message are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const key = `contact_${Date.now()}_${crypto.randomUUID().slice(0, 8)}`;
    await context.env.FORMS.put(
      key,
      JSON.stringify({
        type: 'contact',
        name,
        email,
        company: company || '',
        phone: phone || '',
        service_type: service || 'other',
        inquiry: message,
        source: source || 'contact-form',
        createdAt: new Date().toISOString(),
      }),
      { expirationTtl: 604800 },
    );

    try {
      await syncLeadToPocketBase(context.env, {
        email,
        name: name || '',
        serviceInterest: service || 'other',
        source: source || 'contact-form',
        status: 'new',
        website: '',
        score: 0,
      });
    } catch (err) {
      console.error('Failed to sync contact lead to PocketBase:', err);
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch {
    return new Response(JSON.stringify({ error: 'Failed to submit form' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
