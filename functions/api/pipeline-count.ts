// Public pipeline count. Returns the CURRENT record count plus the ALL-TIME
// processed total (1,618 prospects scanned as of the 2026-09-30 audit — this
// includes records later deleted, so it never falls when PB is cleaned up).
// The prospects collection carries emails, phone numbers and names, so its
// PocketBase list rule must stay admin-only. This endpoint exists so the
// homepage can render a count without exposing a single record.
const TOTAL_PROCESSED_BASELINE = 1618;
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

    return new Response(JSON.stringify({
      totalItems,
      totalProcessed: Math.max(TOTAL_PROCESSED_BASELINE, totalItems),
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=300',
      },
    });
  } catch {
    // Never leak the reason, and never fail the page build over a count.
    return new Response(JSON.stringify({ totalItems: null, totalProcessed: TOTAL_PROCESSED_BASELINE }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store',
      },
    });
  }
};
