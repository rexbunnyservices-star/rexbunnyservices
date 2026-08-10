interface Env {
  FORMS: KVNamespace;
  AUDIT_WEBHOOK_URL?: string;
  PB_URL?: string;
  PB_EMAIL?: string;
  PB_PASSWORD?: string;
}

async function syncLeadToPocketBase(env: Env, lead: any) {
  const baseUrl = env.PB_URL || "https://pb.rexbunnyservices.online";
  const email = env.PB_EMAIL || "admin@rexbunnyservices.com";
  const password = env.PB_PASSWORD || "Admin12345!";

  const authRes = await fetch(`${baseUrl}/api/collections/_superusers/auth-with-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ identity: email, password }),
  });
  if (!authRes.ok) throw new Error("PocketBase auth failed");
  const { token } = await authRes.json();

  const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };

  const existingRes = await fetch(
    `${baseUrl}/api/collections/leads/records?perPage=1&filter=${encodeURIComponent(`email="${lead.email}"`)}`,
    { headers }
  );
  if (existingRes.ok) {
    const existing = await existingRes.json();
    if (existing.items?.length) return { deduped: true, id: existing.items[0].id };
  }

  const createRes = await fetch(`${baseUrl}/api/collections/leads/records`, {
    method: "POST",
    headers,
    body: JSON.stringify(lead),
  });
  if (!createRes.ok) throw new Error(`PocketBase create failed (${createRes.status})`);
  const created = await createRes.json();
  return { deduped: false, id: created.id };
}

async function sendAuditEmail(toEmail: string, siteUrl: string, results: any) {
  const color = results.compositeScore >= 80 ? "#22c55e" : results.compositeScore >= 50 ? "#eab308" : "#ef4444";
  const gptIcon = results.aiVisibility.gptBotStatus === "allowed" ? "✅" : "❌";
  const llmsIcon = results.aiVisibility.hasLlmsTxt ? "✅" : "❌";
  const sdIcon = results.aiVisibility.hasStructuredData ? "✅" : "❌";

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f4f6f8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:32px 16px">
<table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden">
<tr><td style="padding:32px;text-align:center;background:linear-gradient(135deg,#1e1b4b,#312e81)">
<h1 style="margin:0;font-size:22px;color:#ffffff">Your Free AI Visibility Audit</h1>
<p style="margin:8px 0 0;color:#a5b4fc;font-size:14px">${siteUrl}</p>
</td></tr>
<tr><td style="padding:32px">
<div style="text-align:center;margin-bottom:24px">
<div style="display:inline-block;width:120px;height:120px;border-radius:50%;border:6px solid ${color};display:flex;align-items:center;justify-content:center;margin:0 auto">
<span style="font-size:36px;font-weight:bold;color:#1e293b">${results.compositeScore}</span>
</div>
<p style="margin:8px 0 0;font-size:14px;color:#64748b">Composite Search Visibility Score</p>
</div>
<table width="100%" cellpadding="0" cellspacing="0">
<tr>
<td width="33%" style="padding:8px;text-align:center">
<div style="background:#f8fafc;border-radius:8px;padding:12px">
<div style="font-size:20px;font-weight:bold;color:#1e293b">${results.performanceScore}</div>
<div style="font-size:11px;color:#64748b">Performance</div>
</div>
</td>
<td width="33%" style="padding:8px;text-align:center">
<div style="background:#f8fafc;border-radius:8px;padding:12px">
<div style="font-size:20px;font-weight:bold;color:#1e293b">${results.seoScore}</div>
<div style="font-size:11px;color:#64748b">SEO</div>
</div>
</td>
<td width="33%" style="padding:8px;text-align:center">
<div style="background:#f8fafc;border-radius:8px;padding:12px">
<div style="font-size:20px;font-weight:bold;color:#1e293b">${results.aiVisibility.aiVisibilityScore}</div>
<div style="font-size:11px;color:#64748b">AI Readiness</div>
</div>
</td>
</tr>
</table>
<div style="margin:20px 0;border-top:1px solid #e2e8f0"></div>
<h2 style="font-size:15px;color:#1e293b;margin:0 0 12px">Core Web Vitals</h2>
<table width="100%" cellpadding="0" cellspacing="0">
<tr>
<td style="padding:6px 0;font-size:13px;color:#475569">LCP</td>
<td style="padding:6px 0;font-size:13px;color:#1e293b;text-align:right">${(results.lcp / 1000).toFixed(1)}s</td>
</tr>
<tr>
<td style="padding:6px 0;font-size:13px;color:#475569;border-top:1px solid #f1f5f9">CLS</td>
<td style="padding:6px 0;font-size:13px;color:#1e293b;text-align:right;border-top:1px solid #f1f5f9">${results.cls}</td>
</tr>
<tr>
<td style="padding:6px 0;font-size:13px;color:#475569;border-top:1px solid #f1f5f9">TBT</td>
<td style="padding:6px 0;font-size:13px;color:#1e293b;text-align:right;border-top:1px solid #f1f5f9">${results.tbt}ms</td>
</tr>
</table>
<div style="margin:20px 0;border-top:1px solid #e2e8f0"></div>
<h2 style="font-size:15px;color:#1e293b;margin:0 0 12px">AI Crawl Status</h2>
<table width="100%" cellpadding="0" cellspacing="0">
<tr><td style="padding:6px 0;font-size:13px">${gptIcon} GPTBot: ${results.aiVisibility.gptBotStatus}</td></tr>
<tr><td style="padding:6px 0;font-size:13px">${llmsIcon} llms.txt: ${results.aiVisibility.hasLlmsTxt ? "Found" : "Missing"}</td></tr>
<tr><td style="padding:6px 0;font-size:13px">${sdIcon} Structured Data: ${results.aiVisibility.hasStructuredData ? "Found" : "Missing"}</td></tr>
</table>
<div style="margin:24px 0;border-top:1px solid #e2e8f0"></div>
<p style="font-size:13px;color:#64748b;line-height:1.5">This is a high-level overview. For a full strategic roadmap tailored to your site, book a free strategy call with our team.</p>
<table width="100%" cellpadding="0" cellspacing="0">
<tr><td align="center" style="padding:8px 0">
<a href="https://cal.rexbunnyservices.online/strategy-call" style="display:inline-block;background:#312e81;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:8px;font-size:14px;font-weight:600">Book Your Free Strategy Call</a>
</td></tr>
</table>
</td></tr>
<tr><td style="padding:24px 32px;background:#f8fafc;text-align:center">
<p style="margin:0;font-size:12px;color:#94a3b8">RexBunny Services — Marketing Agency for AI &amp; Search</p>
<p style="margin:4px 0 0;font-size:11px;color:#94a3b8">${siteUrl}</p>
</td></tr>
</table>
</td></tr></table>
</body>
</html>`;

  const webhookUrl = "https://n8n.rexbunnyservices.online/webhook/audit-email";
  const res = await fetch(webhookUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      to: toEmail,
      subject: `Your Free AI Visibility Audit for ${siteUrl}`,
      html,
    }),
  });

  if (!res.ok) {
    const errBody = await res.text();
    throw new Error(`Audit relay error ${res.status}: ${errBody}`);
  }
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const { url, email } = await context.request.json();
    if (!url || !email) {
      return new Response(JSON.stringify({ error: "url and email are required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const normalizedUrl = url.startsWith("http") ? url : `https://${url}`;
    let performanceScore = 0, seoScore = 0, bestPracticesScore = 0;
    let lcp = 0, cls = 0, tbt = 0, hasStructuredData = false;

    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        if (attempt > 0) await new Promise(r => setTimeout(r, 3000 * attempt));
        const psiUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(normalizedUrl)}&category=PERFORMANCE&category=SEO&category=BEST_PRACTICES&strategy=MOBILE`;
        const psiRes = await fetch(psiUrl);
        if (psiRes.status === 429) continue;
        if (!psiRes.ok) continue;
        const psiData = await psiRes.json() as any;
        const cats = psiData?.lighthouseResult?.categories || {};
        performanceScore = Math.round((cats.performance?.score || 0) * 100);
        seoScore = Math.round((cats.seo?.score || 0) * 100);
        bestPracticesScore = Math.round((cats["best-practices"]?.score || 0) * 100);
        const audits = psiData?.lighthouseResult?.audits || {};
        lcp = audits["largest-contentful-paint"]?.numericValue || 0;
        cls = audits["cumulative-layout-shift"]?.numericValue || 0;
        tbt = audits["total-blocking-time"]?.numericValue || 0;
        hasStructuredData = audits["structured-data"]?.score === 1;
        break;
      } catch { /* retry */ }
    }

    const origin = new URL(normalizedUrl).origin;
    let gptBotStatus = "unknown", hasLlmsTxt = false;
    try { const r = await fetch(`${origin}/robots.txt`); if (r.ok) gptBotStatus = (await r.text()).toLowerCase().includes("gptbot") ? "blocked" : "allowed"; } catch { /* ignore */ }
    try { hasLlmsTxt = (await fetch(`${origin}/llms.txt`)).ok; } catch { /* ignore */ }

    let aiVisibilityScore = 50;
    if (gptBotStatus === "allowed") aiVisibilityScore += 15;
    if (hasLlmsTxt) aiVisibilityScore += 20;
    if (hasStructuredData) aiVisibilityScore += 15;
    aiVisibilityScore = Math.min(aiVisibilityScore, 100);

    const compositeScore = Math.round(performanceScore * 0.3 + seoScore * 0.3 + aiVisibilityScore * 0.4);

    const results = {
      performanceScore, seoScore, accessabilityScore: bestPracticesScore, bestPracticesScore,
      lcp: Math.round(lcp), cls: parseFloat(cls.toFixed(3)), tbt: Math.round(tbt),
      aiVisibility: { gptBotStatus, hasLlmsTxt, hasStructuredData, entityClarity: hasStructuredData ? "clear" : "vague", aiVisibilityScore },
      compositeScore, email, url: normalizedUrl,
    };

    const key = `audit_${Date.now()}_${crypto.randomUUID().slice(0, 8)}`;
    await context.env.FORMS.put(key, JSON.stringify({
      type: "audit",
      email, website: normalizedUrl, auditScore: compositeScore,
      aiVisibility: { gptBotStatus, hasLlmsTxt, hasStructuredData, aiVisibilityScore },
      score: compositeScore, source: "audit-tool", status: "new",
      createdAt: new Date().toISOString(),
    }), { expirationTtl: 604800 });

    try {
      await syncLeadToPocketBase(context.env, {
        email,
        website: normalizedUrl,
        auditScore: compositeScore,
        score: compositeScore,
        aiVisibility: { gptBotStatus, hasLlmsTxt, hasStructuredData, aiVisibilityScore },
        source: "audit-tool",
        status: "new",
      });
    } catch (err) {
      console.error("Failed to sync audit lead to PocketBase:", err);
    }

    await sendAuditEmail(email, normalizedUrl, results).catch((err) => {
      console.error("Failed to send audit email:", err);
    });

    return new Response(JSON.stringify(results), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: "Audit failed", detail: e?.message || String(e) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
