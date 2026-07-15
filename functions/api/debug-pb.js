export async function onRequest(context) {
  const corsHeaders = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
  };

  try {
    const pbUrl = "https://pb.rexbunnyservices.online";
    
    // Test 1: Can we reach PB at all?
    const healthRes = await fetch(`${pbUrl}/api/health`);
    const health = await healthRes.json();
    
    // Test 2: Can we fetch prospects?
    const prospectsRes = await fetch(`${pbUrl}/api/collections/prospects/records?perPage=1`);
    const prospectsOk = prospectsRes.ok;
    const prospectsStatus = prospectsRes.status;
    let prospectsData = null;
    try { prospectsData = await prospectsRes.json(); } catch(e) { prospectsData = await prospectsRes.text(); }
    
    // Test 3: Can we fetch leads?
    const leadsRes = await fetch(`${pbUrl}/api/collections/leads/records?perPage=1`);
    const leadsOk = leadsRes.ok;
    const leadsStatus = leadsRes.status;
    
    return new Response(JSON.stringify({
      health: { ok: healthRes.ok, data: health },
      prospects: { ok: prospectsOk, status: prospectsStatus, hasItems: !!prospectsData?.items },
      leads: { ok: leadsOk, status: leadsStatus },
    }, null, 2), { status: 200, headers: corsHeaders });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message, stack: error.stack }), { status: 500, headers: corsHeaders });
  }
}
