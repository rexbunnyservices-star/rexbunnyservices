// Public pipeline count ONLY. Returns an integer and nothing else.
// The prospects collection carries emails, phone numbers and names, so its
// PocketBase list rule must stay admin-only. This endpoint exists so the
// homepage can render a live count without exposing a single record.
interface Env {
  PB_URL?: string;
  PB_EMAIL?: string;
  PB_PASSWORD?: string;
}

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  const pbUrl = env.PB_URL || 'https://pb.rexbunnyservices.online';

  try {
    const auth = await fetch(`${pbUrl}/api/collections/_superusers/auth-with-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identity: env.PB_EMAIL || 'admin@rexbunnyservices.com',
        password: env.PB_PASSWORD,
      }),
    });
    if (!auth.ok) throw new Error(`auth ${auth.status}`);

    const { token } = await auth.json();

    const res = await fetch(`${pbUrl}/api/collections/prospects/records?perPage=1`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error(`read ${res.status}`);

    const { totalItems } = await res.json();

    return new Response(JSON.stringify({ totalItems }), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=300',
      },
    });
  } catch {
    // Never leak the reason, and never fail the page build over a count.
    return new Response(JSON.stringify({ totalItems: null }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store',
      },
    });
  }
};
