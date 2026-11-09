// Serves a static snapshot of a product's website while its app has no host.
// - Every HTML page gets the banner (env.BANNER) injected at the top of <body>.
// - App and auth paths (env.APP_PATHS, comma-separated prefixes) show waitlist.html.
// - /api/* answers 503 + Retry-After so webhook senders redeliver instead of dropping.
// - POST /waitlist stores the email in KV (env.WAITLIST).
const EMAIL = /^[^\s@]{1,64}@[^\s@]{1,255}\.[^\s@]{2,}$/;

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    if (path.startsWith('/api/')) {
      return new Response('Temporarily unavailable', {
        status: 503, headers: { 'retry-after': '3600', 'cache-control': 'no-store' },
      });
    }

    if (path === '/waitlist' && request.method === 'POST') return join(request, env);

    const app = (env.APP_PATHS || '').split(',').map((s) => s.trim()).filter(Boolean);
    if (path === '/waitlist' || app.some((p) => path === p || path.startsWith(p + '/'))) {
      return withBanner(await env.ASSETS.fetch(new Request(new URL('/waitlist', url), { headers: request.headers })), env, 200);
    }

    // Next's client router asks for RSC payloads; a 404 makes it fall back to a full page load.
    if (request.headers.get('rsc') === '1' || url.searchParams.has('_rsc')) {
      return new Response(null, { status: 404, headers: { 'cache-control': 'no-store' } });
    }

    let res = await env.ASSETS.fetch(new Request(new URL(path, url), { headers: request.headers }));
    if (res.status === 404) {
      // Unknown page (an app deep link, an old URL): send people to the waitlist.
      res = await env.ASSETS.fetch(new Request(new URL('/waitlist', url), { headers: request.headers }));
      return withBanner(res, env, 404);
    }
    return withBanner(res, env);
  },
};

function withBanner(res, env, status) {
  const type = res.headers.get('content-type') || '';
  if (!type.includes('text/html')) return res;
  // Added after load, not in the served HTML: React hydrates <body> and would drop a
  // node it did not render. A pill at bottom-left stays clear of fixed headers.
  const banner = JSON.stringify(env.BANNER || '');
  const script = `<script>(function(){var t=${banner};function add(){if(document.getElementById('hk-banner'))return;` +
    `var d=document.createElement('div');d.id='hk-banner';d.setAttribute('role','status');` +
    `d.style.cssText='position:fixed;left:16px;bottom:16px;z-index:2147483000;max-width:min(560px,calc(100vw - 32px));` +
    `padding:10px 14px;border-radius:14px;font:500 14px/1.4 system-ui,sans-serif;background:#111;` +
    `color:#fff;border:1px solid rgba(255,255,255,.18);box-shadow:0 8px 30px rgba(0,0,0,.35)';` +
    `d.textContent=t+' ';var a=document.createElement('a');a.href='/waitlist';a.textContent='Join the waitlist';` +
    `a.style.cssText='color:inherit;font-weight:700;text-decoration:underline';d.appendChild(a);document.body.appendChild(d)}` +
    `var n=0,i=setInterval(function(){add();if(++n>20)clearInterval(i)},500);addEventListener('load',add)})()</script>`;
  const out = new HTMLRewriter().on('body', {
    element(el) { el.append(script, { html: true }); },
  }).transform(res);
  const headers = new Headers(out.headers);
  headers.set('cache-control', 'public, max-age=300');
  return new Response(out.body, { status: status ?? out.status, headers });
}

async function join(request, env) {
  let body;
  try { body = await request.json(); } catch { return json({ error: 'invalid' }, 400); }
  if (body && body.company) return json({ ok: true }); // honeypot
  const email = String(body?.email ?? '').trim().toLowerCase();
  if (email.length > 254 || !EMAIL.test(email)) return json({ error: 'invalid_email' }, 400);
  const key = `email:${email}`;
  if (!(await env.WAITLIST.get(key))) {
    await env.WAITLIST.put(key, JSON.stringify({
      at: new Date().toISOString(),
      source: String(body?.source ?? '').slice(0, 300),
      country: request.cf?.country ?? null,
    }));
  }
  return json({ ok: true });
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
  });
}
