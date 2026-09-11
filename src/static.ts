const WEB_ROOT = new URL("../../web/", import.meta.url);

const ASSETS: Record<string, { file: string; contentType: string }> = {
  "/": { file: "index.html", contentType: "text/html; charset=utf-8" },
  "/settings": { file: "settings.html", contentType: "text/html; charset=utf-8" },
  "/settings.html": { file: "settings.html", contentType: "text/html; charset=utf-8" },
  "/privacy": { file: "privacy.html", contentType: "text/html; charset=utf-8" },
  "/privacy.html": { file: "privacy.html", contentType: "text/html; charset=utf-8" },
  "/app.css": { file: "app.css", contentType: "text/css; charset=utf-8" },
  "/app.js": { file: "app.js", contentType: "application/javascript; charset=utf-8" },
  "/settings.js": { file: "settings.js", contentType: "application/javascript; charset=utf-8" },
  "/assets/icon.svg": { file: "assets/icon.svg", contentType: "image/svg+xml" },
  "/assets/favicon-16.png": { file: "assets/favicon-16.png", contentType: "image/png" },
  "/assets/favicon-32.png": { file: "assets/favicon-32.png", contentType: "image/png" },
  "/assets/apple-touch-icon.png": { file: "assets/apple-touch-icon.png", contentType: "image/png" },
  "/assets/fonts/manrope-vietnamese.woff2": { file: "assets/fonts/manrope-vietnamese.woff2", contentType: "font/woff2" },
  "/assets/fonts/manrope-latin-ext.woff2": { file: "assets/fonts/manrope-latin-ext.woff2", contentType: "font/woff2" },
  "/assets/fonts/manrope-latin.woff2": { file: "assets/fonts/manrope-latin.woff2", contentType: "font/woff2" },
};

const HTML_SECURITY_HEADERS: Record<string, string> = {
  "content-security-policy": "default-src 'self'; script-src 'self'; style-src 'self'; connect-src 'self' http: https:; frame-ancestors 'none'",
  "referrer-policy": "no-referrer",
};

async function serveWebAsset(pathname: string): Promise<Response | null> {
  const asset = ASSETS[pathname];
  if (!asset) return null;

  const file = Bun.file(new URL(asset.file, WEB_ROOT));
  if (!(await file.exists())) return null;

  return new Response(file, {
    headers: {
      "content-type": asset.contentType,
      "cache-control": "no-store",
      "x-content-type-options": "nosniff",
      ...(asset.contentType.startsWith("text/html") ? HTML_SECURITY_HEADERS : {}),
    },
  });
}

export function createWebFetch(apiFetch: (request: Request) => Promise<Response>) {
  return async function fetch(request: Request): Promise<Response> {
    if (request.method !== "GET" && request.method !== "HEAD") return apiFetch(request);

    const asset = await serveWebAsset(new URL(request.url).pathname);
    if (!asset) return apiFetch(request);
    if (request.method === "HEAD") return new Response(null, { status: asset.status, headers: asset.headers });
    return asset;
  };
}
