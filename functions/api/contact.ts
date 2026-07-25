interface Env {
  FORMS: KVNamespace;
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
