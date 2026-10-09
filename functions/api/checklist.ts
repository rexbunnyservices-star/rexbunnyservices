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
  if (!password) throw new Error('PB_PASSWORD not configured');

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

async function sendChecklistEmail(toEmail: string) {
  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f4f6f8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:32px 16px">
<table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden">
<tr><td style="padding:32px;text-align:center;background:linear-gradient(135deg,#1e1b4b,#312e81)">
<h1 style="margin:0;font-size:22px;color:#ffffff">Your Free 20-Point GEO Checklist</h1>
<p style="margin:8px 0 0;color:#a5b4fc;font-size:14px">RexBunny Services</p>
</td></tr>
<tr><td style="padding:32px">
<p style="font-size:14px;color:#1e293b;line-height:1.6">Your checklist is ready. Here is what it covers so you can make your website visible to ChatGPT, Gemini, Perplexity, and Copilot:</p>
<ul style="font-size:14px;color:#475569;line-height:1.8;padding-left:20px">
<li>Technical setup &mdash; llms.txt, robots.txt for AI bots, HTTPS, Core Web Vitals</li>
<li>Structured data &mdash; Organization, ProfessionalService, FAQPage, BreadcrumbList, WebSite</li>
<li>Content optimization &mdash; clear homepage, answer-based service pages, citation-ready blog</li>
<li>Authority signals &mdash; backlinks, social profiles, press, verifiable testimonials, case studies</li>
</ul>
<p style="font-size:14px;color:#1e293b;line-height:1.6">Grab the full interactive checklist anytime at <a href="https://rexbunnyservices.online/geo-checklist" style="color:#312e81;font-weight:600">rexbunnyservices.online/geo-checklist</a>.</p>
<table width="100%" cellpadding="0" cellspacing="0">
<tr><td align="center" style="padding:8px 0">
<a href="https://rexbunnyservices.online/lead-engine" style="display:inline-block;background:#312e81;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:8px;font-size:14px;font-weight:600">Run Your Free AI Visibility Audit</a>
</td></tr>
</table>
</td></tr>
<tr><td style="padding:24px 32px;background:#f8fafc;text-align:center">
<p style="margin:0;font-size:12px;color:#94a3b8">RexBunny Services — Marketing Agency for AI &amp; Search</p>
</td></tr>
</table>
</td></tr></table>
</body>
</html>`;

  const webhookUrl = 'https://n8n.rexbunnyservices.online/webhook/audit-email';
  const res = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      to: toEmail,
      subject: 'Your Free 20-Point GEO Checklist',
      html,
    }),
  });
  if (!res.ok) {
    const errBody = await res.text();
    throw new Error(`Checklist relay error ${res.status}: ${errBody}`);
  }
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const { email, name, source } = await context.request.json();
    if (!email) {
      return new Response(JSON.stringify({ error: 'email is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const leadSource = source === 'geo-checklist' ? 'geo-checklist' : 'exit-popup';
    const key = `checklist_${Date.now()}_${crypto.randomUUID().slice(0, 8)}`;
    await context.env.FORMS.put(
      key,
      JSON.stringify({
        type: 'checklist',
        email,
        name: name || '',
        source: leadSource,
        status: 'new',
        createdAt: new Date().toISOString(),
      }),
      { expirationTtl: 604800 },
    );

    try {
      await syncLeadToPocketBase(context.env, {
        email,
        name: name || '',
        serviceInterest: 'geo',
        source: leadSource,
        status: 'new',
        website: '',
        score: 0,
      });
    } catch (err) {
      console.error('Failed to sync checklist lead to PocketBase:', err);
    }

    await sendChecklistEmail(email).catch((err) => {
      console.error('Failed to send checklist email:', err);
    });

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch {
    return new Response(JSON.stringify({ error: 'Failed to capture email' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
