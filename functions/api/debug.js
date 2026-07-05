export async function onRequest(context) {
  const { env } = context;
  return new Response(JSON.stringify({ status: "ok", pass_length: (env.LISTMONK_PASS || "").length }), {
    headers: { "Content-Type": "application/json" },
  });
}
