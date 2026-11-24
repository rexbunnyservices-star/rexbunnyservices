// Framer's built-in analytics sends sendBeacon POSTs to /<origin>/anonymous.
// On the template's own domain Framer hosts this; our Pages project did not,
// producing 405 console errors. Return 204 so beacons are silently accepted.
const handler: PagesFunction = async () =>
  new Response(null, {
    status: 204,
    headers: { 'Cache-Control': 'no-store' },
  });

export const onRequestPost = handler;
export const onRequestGet = handler;
