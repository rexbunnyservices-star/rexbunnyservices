interface Env {
  FORMS: KVNamespace;
}

const esc = (v: unknown): string =>
  String(v ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

/**
 * Shareable, server-rendered audit scorecard.
 * The KV record contains NO email (stripped by /api/audit), so this page can
 * be public. OG tags are rendered server-side so LinkedIn/X/FB show the card.
 */
export const onRequestGet: PagesFunction<Env> = async (context) => {
  const token = (context.params.token as string) || '';
  if (!/^[a-f0-9]{12}$/.test(token)) {
    return new Response('Not found', { status: 404 });
  }

  let data: any = null;
  try {
    const raw = await context.env.FORMS.get(`share:${token}`, 'text');
    if (raw) data = JSON.parse(raw);
  } catch {
    // fall through to 404
  }
  if (!data) return new Response('Not found', { status: 404 });

  const score = Number(data.score) || 0;
  const website = String(data.website || '');
  const issues: string[] = Array.isArray(data.issues) ? data.issues.slice(0, 4) : [];
  const host = new URL(context.request.url).origin;
  const canonical = `${host}/audit/${token}`;
  const displayHost = (() => {
    try {
      return new URL(website).hostname.replace(/^www\./, '');
    } catch {
      return website;
    }
  })();
  const headline = `${displayHost} scored ${score}/100 on AI Visibility`;
  const description = `4 things holding ${displayHost} back from being found in ChatGPT, Perplexity and Gemini. See the report — and try it on your own site.`;
  const color = score >= 80 ? '#22c55e' : score >= 50 ? '#f59e0b' : '#ff6b00';
  const ogImage = `${host}/rex/assets/audit-share-card.png`;

  const issueHtml = issues
    .map((it, i) => `<li><span>${String(i + 1).padStart(2, '0')}</span>${esc(it)}</li>`)
    .join('');

  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(headline)} — RexBunny Services</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${esc(canonical)}">
<meta property="og:type" content="website">
<meta property="og:url" content="${esc(canonical)}">
<meta property="og:title" content="${esc(headline)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:image" content="${esc(ogImage)}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(headline)}">
<meta name="twitter:description" content="${esc(description)}">
<meta name="twitter:image" content="${esc(ogImage)}">
<link rel="icon" href="/favicon.ico">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Funnel+Display:wght@500;700&family=Geist+Mono:wght@400;500&display=swap" rel="stylesheet">
<style>
:root{--ink:#0d0e10;--bone:#eeeee8;--acc:#ff6b00;--mut:#9a9aa2}
*{box-sizing:border-box}html,body{margin:0;padding:0}
body{background:var(--ink);color:var(--bone);font-family:'Geist Mono',ui-monospace,monospace;min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:48px 20px}
.wrap{width:100%;max-width:720px}
.brand{display:flex;align-items:center;gap:10px;margin-bottom:34px}
.brand img{height:42px;width:auto}
.brand span{font:500 11px 'Geist Mono',monospace;letter-spacing:.14em;text-transform:uppercase;color:var(--mut)}
.card{border:1px solid rgba(238,238,232,.14);border-radius:24px;background:linear-gradient(160deg,#16181b,#0d0e10);padding:38px 40px;box-shadow:0 30px 90px rgba(0,0,0,.55)}
.eb{font:500 11px 'Geist Mono',monospace;letter-spacing:.14em;text-transform:uppercase;color:var(--mut);margin:0 0 16px}
.site{font:500 clamp(1.3rem,4vw,2rem) 'Funnel Display',sans-serif;letter-spacing:-.03em;margin:0 0 26px;word-break:break-all}
.scoreline{display:flex;align-items:baseline;gap:16px;flex-wrap:wrap;margin-bottom:8px}
.score{font:700 clamp(4.5rem,16vw,9rem) 'Funnel Display',sans-serif;line-height:.9;letter-spacing:-.07em;color:${color}}
.outof{font:500 18px 'Geist Mono',monospace;color:var(--mut)}
.label{font:500 12px 'Geist Mono',monospace;letter-spacing:.16em;text-transform:uppercase;color:var(--mut);margin:0 0 30px}
ol{list-style:none;margin:0 0 32px;padding:0;display:grid;gap:12px}
li{display:flex;gap:16px;align-items:flex-start;padding:14px 16px;border:1px solid rgba(238,238,232,.1);border-radius:12px;background:rgba(255,255,255,.02);font-size:13px;line-height:1.55}
li span{color:var(--acc);font-weight:500;flex:none}
.challenge{font:600 clamp(1.2rem,3.4vw,1.7rem) 'Funnel Display',sans-serif;line-height:1.15;margin:0 0 24px}
.challenge em{font-style:normal;color:var(--acc)}
.cta{display:inline-flex;align-items:center;gap:12px;background:var(--acc);color:#0d0e10;text-decoration:none;font:700 14px 'Geist Mono',monospace;letter-spacing:.04em;padding:16px 24px;border-radius:999px;transition:transform .2s,box-shadow .2s}
.cta:hover{transform:translateY(-2px);box-shadow:0 12px 30px rgba(255,107,0,.35)}
.share{display:flex;gap:10px;flex-wrap:wrap;margin-top:22px}
.share button,.share a{font:500 11px 'Geist Mono',monospace;letter-spacing:.08em;text-transform:uppercase;color:var(--bone);background:transparent;border:1px solid rgba(238,238,232,.22);border-radius:999px;padding:10px 16px;cursor:pointer;text-decoration:none;transition:border-color .2s,color .2s}
.share button:hover,.share a:hover{border-color:var(--acc);color:var(--acc)}
.foot{margin-top:24px;font-size:11px;color:var(--mut);line-height:1.6}
@media(max-width:600px){.card{padding:26px 22px}}
</style>
</head>
<body>
<div class="wrap">
  <div class="brand"><img src="/rex/assets/rex-logo.png" alt=""><span>RexBunny Services · AI Visibility Audit</span></div>
  <div class="card">
    <p class="eb">Live audit result</p>
    <h1 class="site">${esc(displayHost)}</h1>
    <div class="scoreline"><span class="score">${score}</span><span class="outof">/ 100</span></div>
    <p class="label">AI Visibility Score</p>
    ${issues.length ? `<p class="eb">Four fastest fixes</p><ol>${issueHtml}</ol>` : ''}
    <p class="challenge">My site scored <em>${score}/100</em> for AI visibility.<br>Can you beat it?</p>
    <a class="cta" href="/#audit" id="try">Take the free audit <span aria-hidden="true">→</span></a>
    <div class="share">
      <button id="li" type="button">Share on LinkedIn</button>
      <button id="tw" type="button">Post on X</button>
      <button id="cp" type="button">Copy link</button>
    </div>
    <p class="foot">Scored ${esc(new Date(data.checkedAt || Date.now()).toISOString().slice(0, 10))} · 18 live checks · No client results implied. Your report is on its way to your inbox.</p>
  </div>
</div>
<script>
(function(){
  var url=location.href, txt=${JSON.stringify(headline + ' — can you beat it?')};
  document.getElementById('li').addEventListener('click',function(){window.open('https://www.linkedin.com/sharing/share-offsite/?url='+encodeURIComponent(url),'_blank','noopener')});
  document.getElementById('tw').addEventListener('click',function(){window.open('https://twitter.com/intent/tweet?text='+encodeURIComponent(txt)+'&url='+encodeURIComponent(url),'_blank','noopener')});
  document.getElementById('cp').addEventListener('click',function(){navigator.clipboard&&navigator.clipboard.writeText(url).then(function(){this.textContent='Copied!'}.bind(this))});
  document.getElementById('try').addEventListener('click',function(){try{window.umami&&window.umami.track('audit-shared-click')}catch(e){}});
  try{if(window.umami)window.umami.track('audit-result-view',{score:${score}})}catch(e){}
})();
</script>
</body>
</html>`;

  return new Response(html, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, max-age=300',
    },
  });
};
