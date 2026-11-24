interface Env {
  FORMS: KVNamespace;
  AUDIT_WEBHOOK_URL?: string;
  PB_URL?: string;
  PB_EMAIL?: string;
  PB_PASSWORD?: string;
  PSI_API_KEY?: string;
}

/**
 * Deterministic, self-hosted scoring engine.
 *
 * Why this exists: the previous version relied on the Google PageSpeed Insights
 * API with no key. Anonymous PSI calls are rate-limited hard (429) from
 * Cloudflare egress, so the retry loop exhausted and EVERY visitor got
 * performance=0, seo=0, structured=0 — i.e. every prospect was told their site
 * scored 20/100. That is worse than having no lead magnet at all.
 *
 * These checks need no third-party API: we fetch the prospect's own page,
 * robots.txt, llms.txt and sitemap.xml and score what we actually observe.
 * PSI is used only as an optional enrichment when PSI_API_KEY is configured.
 */

const FETCH_TIMEOUT = 9000;

async function safeFetch(url: string, init: RequestInit = {}): Promise<Response | null> {
  try {
    return await fetch(url, {
      ...init,
      redirect: 'follow',
      signal: AbortSignal.timeout(FETCH_TIMEOUT),
      headers: {
        'User-Agent':
          'Mozilla/5.0 (compatible; RexBunnyAudit/1.0; +https://rexbunnyservices.online/services/seo)',
        Accept: 'text/html,application/xhtml+xml,text/plain,*/*',
        ...(init.headers || {}),
      },
    });
  } catch {
    return null;
  }
}

/** Parse robots.txt into { agent -> directives[] } groups (RFC 9309, simplified). */
function parseRobots(txt: string): Map<string, string[]> {
  const groups = new Map<string, string[]>();
  let current: string[] = [];
  let inRules = false;

  for (const raw of txt.split(/\r?\n/)) {
    const line = raw.replace(/#.*$/, '').trim();
    if (!line) continue;
    const idx = line.indexOf(':');
    if (idx === -1) continue;
    const field = line.slice(0, idx).trim().toLowerCase();
    const value = line.slice(idx + 1).trim();

    if (field === 'user-agent') {
      if (inRules) {
        current = [];
        inRules = false;
      }
      current.push(value.toLowerCase());
    } else if (field === 'allow' || field === 'disallow') {
      inRules = true;
      for (const agent of current) {
        const rules = groups.get(agent) || [];
        rules.push(`${field} ${value}`);
        groups.set(agent, rules);
      }
    }
  }
  return groups;
}

/** A crawler is blocked only if a matching group disallows the root path. */
function isBlocked(groups: Map<string, string[]>, agent: string): boolean {
  const candidates = [agent.toLowerCase(), '*'];
  for (const key of candidates) {
    const rules = groups.get(key);
    if (!rules) continue;
    const rootDisallow = rules.some((r) => /^disallow\s+\/\s*$/i.test(r));
    const rootAllow = rules.some((r) => /^allow\s+\/\s*$/i.test(r));
    if (rootDisallow && !rootAllow) return true;
  }
  return false;
}

interface Signal {
  key: string;
  label: string;
  points: number;
  earned: number;
  fix?: string;
}

function scoreRobots(robotsTxt: string | null): { crawl: Signal[]; aiBlocked: boolean } {
  const crawl: Signal[] = [];
  if (!robotsTxt) {
    crawl.push({
      key: 'robots_missing',
      label: 'robots.txt is missing or unreachable',
      points: 6,
      earned: 0,
      fix: 'Publish a robots.txt so crawlers know what they may index.',
    });
    return { crawl, aiBlocked: false };
  }

  const groups = parseRobots(robotsTxt);
  const gpt = isBlocked(groups, 'gptbot');
  // ClaudeBot is Anthropic's primary crawler. Claude-Web / Anthropic-AI being
  // allowed does NOT un-block it, so judge each agent independently.
  const claude = isBlocked(groups, 'claudebot');
  const perplexity = isBlocked(groups, 'perplexitybot');
  const googleExt = isBlocked(groups, 'google-extended');

  crawl.push({
    key: 'gptbot',
    label: gpt ? 'GPTBot (ChatGPT) is blocked' : 'GPTBot (ChatGPT) is allowed',
    points: 8,
    earned: gpt ? 0 : 8,
    fix: gpt ? 'Remove the GPTBot disallow from robots.txt — ChatGPT cannot cite you.' : undefined,
  });
  crawl.push({
    key: 'claudebot',
    label: claude ? 'ClaudeBot (Anthropic) is blocked' : 'ClaudeBot (Anthropic) is allowed',
    points: 5,
    earned: claude ? 0 : 5,
    fix: claude ? 'Allow ClaudeBot if you want to appear in Claude answers.' : undefined,
  });
  crawl.push({
    key: 'perplexity',
    label: perplexity ? 'PerplexityBot is blocked' : 'PerplexityBot is allowed',
    points: 5,
    earned: perplexity ? 0 : 5,
    fix: perplexity
      ? 'Allow PerplexityBot — it is the highest-intent AI referral source.'
      : undefined,
  });
  crawl.push({
    key: 'google_extended',
    label: googleExt
      ? 'Google-Extended is blocked (no AI Overview grounding)'
      : 'Google-Extended is allowed',
    points: 4,
    earned: googleExt ? 0 : 4,
    fix: googleExt ? 'Allow Google-Extended to be eligible for AI Overviews.' : undefined,
  });

  return { crawl, aiBlocked: gpt || claude || perplexity };
}

function extractJsonLdTypes(html: string): string[] {
  const types = new Set<string>();
  const blocks = html.matchAll(
    /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi,
  );
  for (const block of blocks) {
    const body = block[1];
    for (const m of body.matchAll(/"@type"\s*:\s*"([^"]+)"/g)) types.add(m[1]);
  }
  return [...types];
}


// Built-in KV rate limiter for public, unauthenticated form endpoints.
// 12 requests / hour / connecting IP. Key is IP-hashed so no raw PII is stored.
async function rateLimited(env: Env, request: Request, action: string): Promise<Response | null> {
  const ip = request.headers.get('Cf-Connecting-IP') || request.headers.get('x-forwarded-for') || 'unknown';
  let hash = 5381;
  for (let i = 0; i < ip.length; i++) hash = ((hash << 5) + hash + ip.charCodeAt(i)) | 0;
  const bucket = Math.floor(Date.now() / 3600000);
  const key = `rl:${action}:${Math.abs(hash).toString(36)}:${bucket}`;
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
  
  const limited = await rateLimited(context.env, context.request, 'audit');
  if (limited) return limited;
try {
    const { url, email } = (await context.request.json()) as { url?: string; email?: string };
    const emailOk = typeof email === 'string' && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email);
    if (!url || !emailOk) {
      return new Response(JSON.stringify({ error: 'A valid url and email are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    let normalizedUrl = url.trim();
    if (!/^https?:\/\//i.test(normalizedUrl)) normalizedUrl = `https://${normalizedUrl}`;

    let origin: string;
    try {
      origin = new URL(normalizedUrl).origin;
    } catch {
      return new Response(JSON.stringify({ error: 'That URL could not be parsed.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // ── Fetch everything we score, in parallel ─────────────────────────────
    const t0 = Date.now();
    const [pageRes, robotsRes, llmsRes, sitemapRes] = await Promise.all([
      safeFetch(normalizedUrl),
      safeFetch(`${origin}/robots.txt`),
      safeFetch(`${origin}/llms.txt`),
      safeFetch(`${origin}/sitemap.xml`),
    ]);
    const ttfb = Date.now() - t0;

    if (!pageRes || !pageRes.ok) {
      return new Response(
        JSON.stringify({
          error:
            'We could not load that site. Check the URL is public, or that it is not blocking bots.',
        }),
        { status: 422, headers: { 'Content-Type': 'application/json' } },
      );
    }

    const html = await pageRes.text();
    const headers = pageRes.headers;
    const robotsTxt = robotsRes && robotsRes.ok ? await robotsRes.text() : null;
    const hasLlmsTxt = Boolean(llmsRes && llmsRes.ok);
    const hasSitemap = Boolean(sitemapRes && sitemapRes.ok);

    // ── A. AI crawlability (32) ────────────────────────────────────────────
    const { crawl: crawlSignals, aiBlocked } = scoreRobots(robotsTxt);

    const llmsSignal: Signal = {
      key: 'llms_txt',
      label: hasLlmsTxt ? 'llms.txt published' : 'No llms.txt',
      points: 7,
      earned: hasLlmsTxt ? 7 : 0,
      fix: hasLlmsTxt
        ? undefined
        : 'Add an llms.txt so AI assistants get a clean summary of your business.',
    };
    const sitemapSignal: Signal = {
      key: 'sitemap',
      label: hasSitemap ? 'sitemap.xml published' : 'No sitemap.xml',
      points: 3,
      earned: hasSitemap ? 3 : 0,
      fix: hasSitemap ? undefined : 'Publish a sitemap.xml and declare it in robots.txt.',
    };
    const crawlAll = [...crawlSignals, llmsSignal, sitemapSignal];
    const crawlMax = crawlAll.reduce((a, s) => a + s.points, 0);
    const crawlEarned = crawlAll.reduce((a, s) => a + s.earned, 0);

    // ── B. Structured data & entity clarity (26) ───────────────────────────
    const ldTypes = extractJsonLdTypes(html);
    const hasLd = ldTypes.length > 0;
    const hasOrg = ldTypes.some((t) =>
      /^(Organization|LocalBusiness|ProfessionalService|Corporation|Person)$/i.test(t),
    );
    const hasRich = ldTypes.some((t) =>
      /^(FAQPage|Article|BlogPosting|Service|Product|BreadcrumbList|HowTo|Review)$/i.test(t),
    );
    const hasCanonical = /<link[^>]+rel=["']canonical["']/i.test(html);
    const metaDesc = html.match(
      /<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i,
    )?.[1];

    const schemaSignals: Signal[] = [
      {
        key: 'jsonld',
        label: hasLd ? `JSON-LD found (${ldTypes.slice(0, 3).join(', ')})` : 'No JSON-LD markup',
        points: 8,
        earned: hasLd ? 8 : 0,
        fix: hasLd ? undefined : 'Add JSON-LD so search engines and LLMs can read your entity.',
      },
      {
        key: 'organization',
        label: hasOrg ? 'Business entity declared' : 'No Organization/LocalBusiness entity',
        points: 7,
        earned: hasOrg ? 7 : 0,
        fix: hasOrg
          ? undefined
          : 'Declare an Organization schema with name, logo, contact and area served.',
      },
      {
        key: 'rich',
        label: hasRich ? 'Rich-result schema present' : 'No FAQ/Article/Service schema',
        points: 6,
        earned: hasRich ? 6 : 0,
        fix: hasRich
          ? undefined
          : 'Add FAQPage and Article schema — these are what get quoted in AI answers.',
      },
      {
        key: 'canonical',
        label: hasCanonical ? 'Canonical tag set' : 'No canonical tag',
        points: 5,
        earned: hasCanonical ? 5 : 0,
        fix: hasCanonical ? undefined : 'Add a self-referencing canonical tag on every page.',
      },
    ];
    const schemaMax = schemaSignals.reduce((a, s) => a + s.points, 0);
    const schemaEarned = schemaSignals.reduce((a, s) => a + s.earned, 0);

    // ── C. Content & answer readiness (20) ─────────────────────────────────
    const title = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.trim() || '';
    const textOnly = html
      .replace(/<(script|style|svg|noscript)[\s\S]*?<\/\1>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    const wordCount = textOnly ? textOnly.split(' ').length : 0;
    const h1Count = (html.match(/<h1[\s>]/gi) || []).length;
    const hasViewport = /<meta[^>]+name=["']viewport["']/i.test(html);
    const hasOg = /<meta[^>]+property=["']og:(title|image)["']/i.test(html);

    const contentSignals: Signal[] = [
      {
        key: 'title',
        label:
          title.length >= 10 && title.length <= 65
            ? 'Title tag is well sized'
            : `Title tag is ${title.length} characters (aim 10–65)`,
        points: 5,
        earned: title.length >= 10 && title.length <= 65 ? 5 : 0,
        fix: 'Rewrite the title tag to 10–65 characters with the primary keyword first.',
      },
      {
        key: 'description',
        label:
          metaDesc && metaDesc.length >= 50 && metaDesc.length <= 165
            ? 'Meta description is well sized'
            : 'Meta description missing or badly sized',
        points: 5,
        earned: metaDesc && metaDesc.length >= 50 && metaDesc.length <= 165 ? 5 : 0,
        fix: 'Write a 50–165 character meta description that answers a real question.',
      },
      {
        key: 'headings',
        label: h1Count === 1 ? 'One clear H1' : `${h1Count} H1 tags found (want exactly 1)`,
        points: 5,
        earned: h1Count === 1 ? 5 : 0,
        fix: 'Use exactly one H1 per page and structure the rest as H2/H3.',
      },
      {
        key: 'depth',
        label: wordCount >= 300 ? `${wordCount} words of content` : `${wordCount} words is thin`,
        points: 5,
        earned: wordCount >= 300 ? 5 : 0,
        fix: 'Aim for 300+ words per page — thin pages are rarely cited by AI assistants.',
      },
    ];
    const contentMax = contentSignals.reduce((a, s) => a + s.points, 0);
    const contentEarned = contentSignals.reduce((a, s) => a + s.earned, 0);

    // ── D. Technical health (24) ───────────────────────────────────────────
    const isHttps = normalizedUrl.startsWith('https://');
    const htmlKb = Math.round(new Blob([html]).size / 1024);
    const hsts = Boolean(headers.get('strict-transport-security'));
    const nosniff = (headers.get('x-content-type-options') || '').includes('nosniff');

    const techSignals: Signal[] = [
      {
        key: 'https',
        label: isHttps ? 'Served over HTTPS' : 'Not served over HTTPS',
        points: 6,
        earned: isHttps ? 6 : 0,
        fix: isHttps ? undefined : 'Serve the site over HTTPS.',
      },
      {
        key: 'weight',
        label: htmlKb <= 150 ? `HTML is ${htmlKb} KB` : `HTML is ${htmlKb} KB (heavy)`,
        points: 5,
        earned: htmlKb <= 150 ? 5 : 0,
        fix: 'Cut inline CSS/JS — a heavy document delays first paint on mobile.',
      },
      {
        key: 'ttfb',
        label: ttfb < 800 ? `First byte in ${ttfb} ms` : `First byte took ${ttfb} ms`,
        points: 4,
        earned: ttfb < 800 ? 4 : 0,
        fix: 'Cache HTML at the edge — origin round-trips above 800 ms are felt on mobile.',
      },
      {
        key: 'headers',
        label: hsts && nosniff ? 'Security headers present' : 'Security headers incomplete',
        points: 4,
        earned: hsts && nosniff ? 4 : 0,
        fix: 'Add HSTS and X-Content-Type-Options: nosniff.',
      },
    ];

    // Mobile viewport + social cards are table stakes; fold into content score.
    if (hasViewport)
      contentSignals.push({ key: 'viewport', label: 'Mobile viewport set', points: 0, earned: 0 });
    if (hasOg)
      contentSignals.push({ key: 'og', label: 'Open Graph tags present', points: 0, earned: 0 });

    const techMax = techSignals.reduce((a, s) => a + s.points, 0);
    const techEarned = techSignals.reduce((a, s) => a + s.earned, 0);

    // ── Optional PSI enrichment (only if a key is configured) ───────────────
    let psiPerformance: number | null = null;
    let lcp = 0;
    let cls = 0;
    let tbt = 0;
    if (context.env.PSI_API_KEY) {
      try {
        const psiUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(
          normalizedUrl,
        )}&category=PERFORMANCE&strategy=MOBILE&key=${context.env.PSI_API_KEY}`;
        const res = await safeFetch(psiUrl);
        if (res && res.ok) {
          const psi = (await res.json()) as any;
          const lh = psi?.lighthouseResult;
          if (lh?.categories?.performance?.score != null) {
            psiPerformance = Math.round(lh.categories.performance.score * 100);
            lcp = Math.round(lh.audits?.['largest-contentful-paint']?.numericValue || 0);
            cls = Number((lh.audits?.['cumulative-layout-shift']?.numericValue || 0).toFixed(3));
            tbt = Math.round(lh.audits?.['total-blocking-time']?.numericValue || 0);
          }
        }
      } catch {
        /* PSI is optional enrichment; never fail the audit on it */
      }
    }

    // ── Aggregate ──────────────────────────────────────────────────────────
    const pct = (earned: number, max: number) => (max ? Math.round((earned / max) * 100) : 0);
    const crawlPct = pct(crawlEarned, crawlMax);
    const schemaPct = pct(schemaEarned, schemaMax);
    const contentPct = pct(contentEarned, contentMax);
    const techPct = pct(techEarned, techMax);

    const compositeScore = Math.round(
      crawlPct * 0.32 + schemaPct * 0.26 + contentPct * 0.2 + techPct * 0.22,
    );

    // The four highest-value misses, ordered by points lost.
    const issues = [...crawlAll, ...schemaSignals, ...contentSignals, ...techSignals]
      .filter((s) => s.points > s.earned && s.fix)
      .sort((a, b) => b.points - b.earned - (a.points - a.earned))
      .slice(0, 4)
      .map((s) => s.fix as string);

    const results = {
      scoreVersion: '2.0',
      compositeScore,
      breakdown: {
        aiCrawlability: crawlPct,
        structuredData: schemaPct,
        content: contentPct,
        technical: techPct,
      },
      issues,
      aiVisibility: {
        // legacy shape kept for the existing email template + PocketBase
        gptBotStatus: aiBlocked ? 'blocked' : robotsTxt ? 'allowed' : 'unknown',
        hasLlmsTxt,
        hasStructuredData: hasLd,
        entityClarity: hasOrg ? 'clear' : 'vague',
        aiVisibilityScore: crawlPct,
      },
      // legacy numeric fields
      performanceScore: psiPerformance ?? techPct,
      seoScore: Math.round((schemaPct + contentPct) / 2),
      bestPracticesScore: techPct,
      accessabilityScore: techPct,
      metricsAvailable: psiPerformance !== null,
      lcp,
      cls,
      tbt,
      email,
      url: normalizedUrl,
      checkedAt: new Date().toISOString(),
    };

    // ── Persist (KV) ───────────────────────────────────────────────────────
    const key = `audit_${Date.now()}_${crypto.randomUUID().slice(0, 8)}`;
    await context.env.FORMS.put(
      key,
      JSON.stringify({
        type: 'audit',
        email,
        website: normalizedUrl,
        auditScore: compositeScore,
        breakdown: results.breakdown,
        issues,
        aiVisibility: results.aiVisibility,
        score: compositeScore,
        source: 'audit-tool',
        status: 'new',
        createdAt: results.checkedAt,
      }),
      { expirationTtl: 604800 },
    );

    try {
      await syncLeadToPocketBase(context.env, {
        email,
        website: normalizedUrl,
        auditScore: compositeScore,
        score: compositeScore,
        breakdown: results.breakdown,
        issues,
        aiVisibility: results.aiVisibility,
        source: 'audit-tool',
        status: 'new',
      });
    } catch (err) {
      console.error('Failed to sync audit lead to PocketBase:', err);
    }

    // ── Viral share token ──────────────────────────────────────────────────
    // Store a PUBLIC-SAFE copy (no email) under a short token so the result
    // can be rendered on a shareable page with OG meta. Email is never exposed.
    const shareToken = crypto.randomUUID().replace(/-/g, '').slice(0, 12);
    await context.env.FORMS.put(
      `share:${shareToken}`,
      JSON.stringify({
        score: compositeScore,
        website: normalizedUrl,
        issues,
        breakdown: results.breakdown,
        checkedAt: results.checkedAt,
      }),
      { expirationTtl: 2592000 }, // 30 days
    );
    const shareOrigin = new URL(context.request.url).origin;
    const shareUrl = `${shareOrigin}/audit/${shareToken}`;

    await sendAuditEmail(email, normalizedUrl, { ...results, shareUrl }).catch((err) => {
      console.error('Failed to send audit email:', err);
    });

    return new Response(
      JSON.stringify({ ...results, shareToken, shareUrl }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    );
  } catch (e: any) {
    return new Response(
      JSON.stringify({ error: 'Audit failed', detail: e?.message || String(e) }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }
};

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
  const { token } = (await authRes.json()) as { token: string };

  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

  const existingRes = await fetch(
    `${baseUrl}/api/collections/leads/records?perPage=1&filter=${encodeURIComponent(
      `email="${lead.email}"`,
    )}`,
    { headers },
  );
  if (existingRes.ok) {
    const existing = (await existingRes.json()) as any;
    if (existing.items?.length) return { deduped: true, id: existing.items[0].id };
  }

  const createRes = await fetch(`${baseUrl}/api/collections/leads/records`, {
    method: 'POST',
    headers,
    body: JSON.stringify(lead),
  });
  if (!createRes.ok) throw new Error(`PocketBase create failed (${createRes.status})`);
  const created = (await createRes.json()) as any;
  return { deduped: false, id: created.id };
}

async function sendAuditEmail(toEmail: string, siteUrl: string, results: any) {
  const color =
    results.compositeScore >= 80 ? '#22c55e' : results.compositeScore >= 50 ? '#eab308' : '#ef4444';
  const b = results.breakdown;
  const issues: string[] = results.issues || [];

  const bar = (label: string, value: number) => {
    const c = value >= 80 ? '#22c55e' : value >= 50 ? '#eab308' : '#ef4444';
    return `<tr>
<td style="padding:6px 0;font-size:13px;color:#475569;width:150px">${label}</td>
<td style="padding:6px 0">
<div style="background:#e2e8f0;border-radius:99px;height:8px;width:100%">
<div style="background:${c};height:8px;border-radius:99px;width:${value}%"></div>
</div>
</td>
<td style="padding:6px 0;font-size:13px;color:#1e293b;text-align:right;width:44px;font-weight:600">${value}</td>
</tr>`;
  };

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
<div style="display:inline-block;width:120px;height:120px;border-radius:50%;border:6px solid ${color};line-height:108px;margin:0 auto">
<span style="font-size:36px;font-weight:bold;color:#1e293b">${results.compositeScore}</span>
</div>
<p style="margin:8px 0 0;font-size:14px;color:#64748b">Composite AI Visibility Score</p>
</div>
<table width="100%" cellpadding="0" cellspacing="0">
${bar('AI crawlability', b.aiCrawlability)}
${bar('Structured data', b.structuredData)}
${bar('Content depth', b.content)}
${bar('Technical health', b.technical)}
</table>
${
  issues.length
    ? `<div style="margin:24px 0;border-top:1px solid #e2e8f0"></div>
<h2 style="font-size:15px;color:#1e293b;margin:0 0 12px">Your four fastest wins</h2>
<ol style="margin:0;padding-left:20px;color:#475569;font-size:13px;line-height:1.7">
${issues.map((i) => `<li style="margin-bottom:8px">${i}</li>`).join('')}
</ol>`
    : `<p style="font-size:13px;color:#475569">Nothing critical is broken. The next gains are authority and content depth.</p>`
}
<div style="margin:24px 0;border-top:1px solid #e2e8f0"></div>
<p style="font-size:13px;color:#64748b;line-height:1.5">We scored ${siteUrl} against the signals that decide whether ChatGPT, Perplexity, Gemini and Google's AI Overviews can find, read and quote you. Fixing the list above is exactly what our AI Search package does.</p>
<div style="margin:24px 0;padding:18px;border:1px solid #fed7aa;border-radius:10px;background:#fff7ed">
<p style="margin:0 0 10px;font-size:14px;color:#9a3412;font-weight:600">My site scored ${results.compositeScore}/100 for AI visibility. Can you beat it?</p>
<a href="${results.shareUrl || 'https://rexbunnyservices.online/rex/'}" style="font-size:13px;color:#c2410c">View &amp; share your scorecard →</a>
</div>
<table width="100%" cellpadding="0" cellspacing="0">
<tr><td align="center" style="padding:8px 0">
<a href="https://rexbunnyservices.online/pricing" style="display:inline-block;background:#c2410c;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:8px;font-size:14px;font-weight:600">See what fixing it costs</a>
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

  const webhookUrl = 'https://n8n.rexbunnyservices.online/webhook/audit-email';
  const res = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      to: toEmail,
      subject: `Your AI Visibility Score: ${results.compositeScore}/100`,
      html,
    }),
  });

  if (!res.ok) {
    const errBody = await res.text();
    throw new Error(`Audit relay error ${res.status}: ${errBody}`);
  }
}
