interface Env {
  FORMS: KVNamespace;
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

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const { name, email, company, phone, service, message } = await context.request.json();
    if (!name || !email || !message) {
      return new Response(JSON.stringify({ error: "name, email, and message are required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const key = `contact_${Date.now()}_${crypto.randomUUID().slice(0, 8)}`;
    await context.env.FORMS.put(key, JSON.stringify({
      type: "contact",
      name, email, company: company || "", phone: phone || "",
      service_type: service || "other", inquiry: message,
      source: "contact-form",
      createdAt: new Date().toISOString(),
    }), { expirationTtl: 604800 });

    try {
      await syncLeadToPocketBase(context.env, {
        email,
        name: name || "",
        serviceInterest: service || "other",
        source: "contact-form",
        status: "new",
        website: "",
        score: 0,
      });
    } catch (err) {
      console.error("Failed to sync contact lead to PocketBase:", err);
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch {
    return new Response(JSON.stringify({ error: "Failed to submit form" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
