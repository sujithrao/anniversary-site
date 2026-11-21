// Keeps the site behind a countdown until the anniversary.
// Before OPEN_AT every page shows countdown.html and every other file is held back.
// Visiting any page with ?preview=PREVIEW_KEY once sets a cookie so you can see the real site early.
const OPEN_AT = Date.parse("2026-11-24T00:00:00-08:00"); // midnight, Pacific time
const PREVIEW_KEY = "amVJjO6gja9191tJ";

export async function onRequest(ctx) {
  if (Date.now() >= OPEN_AT) return ctx.next();

  const url = new URL(ctx.request.url);
  if (url.searchParams.get("preview") === PREVIEW_KEY) {
    return new Response(null, {
      status: 302,
      headers: {
        Location: url.pathname,
        "Set-Cookie": `preview=${PREVIEW_KEY}; Path=/; Secure; HttpOnly; SameSite=Lax; Max-Age=1209600`,
      },
    });
  }
  const cookie = ctx.request.headers.get("Cookie") || "";
  if (cookie.split(/;\s*/).includes(`preview=${PREVIEW_KEY}`)) return ctx.next();

  const accept = ctx.request.headers.get("Accept") || "";
  const isPage = url.pathname === "/" || url.pathname.endsWith(".html") || accept.includes("text/html");
  if (!isPage) return new Response("Not yet", { status: 404, headers: { "Cache-Control": "no-store" } });

  const page = await ctx.env.ASSETS.fetch(new URL("/countdown", url));
  return new Response(page.body, {
    status: 200,
    headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" },
  });
}
