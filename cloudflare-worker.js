/* =====================================================================================================
   DASHBOARD DATA LINK (a Cloudflare Worker)
   Reads your workbook (a Google Sheet, or any link to an .xlsx file) and hands it only to your dashboard,
   and, if you set a password, only to people who have signed in.

   Setup (about 10 minutes, free on Cloudflare's free plan):
     1. Cloudflare dashboard > Workers & Pages > Create > Create Worker > name it (e.g. my-dashboard-data) > Deploy.
     2. Edit code: replace everything with this file, then Deploy.
     3. Settings > Variables and Secrets: add the settings below, then Deploy again.
     4. Put the Worker's address (https://my-dashboard-data.<you>.workers.dev) in the dashboard's config.js as
        data.workerUrl, and set data.password to true if you added DASHBOARD_PASSWORD.

   Settings (Worker > Settings > Variables and Secrets):
     DASHBOARD_SITES         Required. Your dashboard's address, e.g. https://my-dashboard.pages.dev
                             (several, comma-separated; its preview addresses are allowed automatically;
                             add http://localhost:8080 to test on your own computer).
     SHEET_ID                The Google Sheet's ID: the long code in its address, between /d/ and /edit.
     FILE_URL                Or instead: a direct download link to an .xlsx file (OneDrive, Dropbox ?dl=1, S3...).
     DASHBOARD_PASSWORD      Secret, recommended. The password people type to open the dashboard.
                             Changing it signs everyone out straight away.
     GOOGLE_SERVICE_ACCOUNT  Secret, recommended for Google Sheets. A service account key (the whole JSON file).
                             Share the sheet with the service account's email (Viewer) and the sheet can stay
                             private: no "anyone with the link" needed.
     GOOGLE_API_KEY          Secret, optional. Only for a sheet shared as "Anyone with the link can view" without a
                             service account: lets the Worker check for changes without downloading the file.
   ===================================================================================================== */

const SIGN_IN_DAYS = 30;                                  // how long a browser stays signed in
const XLSX_TYPE = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
const enc = new TextEncoder();
const b64url = buf => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

/* ---------- who may use this data link ---------- */
function allowedOrigin(request, env) {
  const origin = request.headers.get("Origin");
  if (!origin || origin === "null") return null;          // typed into a browser, a robot, or a local file: no
  const sites = String(env.DASHBOARD_SITES || "").split(",").map(s => s.trim().replace(/\/+$/, "")).filter(Boolean);
  for (const s of sites) {
    if (origin === s) return origin;
    const host = s.replace(/^https?:\/\//, "");
    if (origin.startsWith("https://") && origin.endsWith("." + host)) return origin;   // preview versions
  }
  return null;
}

/* ---------- sign-in: a token signed with a key made from the password ---------- */
async function signingKey(password) {
  return crypto.subtle.importKey("raw", enc.encode("dashboard-token-v1|" + password), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
}
async function makeToken(password) {
  const exp = Math.floor(Date.now() / 1000) + SIGN_IN_DAYS * 86400;
  const sig = await crypto.subtle.sign("HMAC", await signingKey(password), enc.encode(String(exp)));
  return { token: exp + "." + b64url(sig), expires: exp * 1000 };
}
async function sameText(a, b) {                              // constant-time comparison
  const [x, y] = await Promise.all([crypto.subtle.digest("SHA-256", enc.encode(String(a))), crypto.subtle.digest("SHA-256", enc.encode(String(b)))]);
  const p = new Uint8Array(x), q = new Uint8Array(y); let diff = 0;
  for (let i = 0; i < p.length; i++) diff |= p[i] ^ q[i];
  return diff === 0;
}
async function validToken(request, password) {
  const m = (request.headers.get("Authorization") || "").match(/^Bearer\s+(\d+)\.([A-Za-z0-9_-]+)$/);
  if (!m || Number(m[1]) * 1000 < Date.now()) return false;
  const expected = await crypto.subtle.sign("HMAC", await signingKey(password), enc.encode(m[1]));
  return sameText(b64url(expected), m[2]);
}

/* ---------- Google: a service account keeps the sheet private ---------- */
let TOKEN = { v: null, exp: 0 };
async function googleToken(env) {
  if (!env.GOOGLE_SERVICE_ACCOUNT) return null;
  if (TOKEN.v && TOKEN.exp > Date.now() + 60000) return TOKEN.v;
  let sa; try { sa = JSON.parse(env.GOOGLE_SERVICE_ACCOUNT); } catch (e) { throw new Error("GOOGLE_SERVICE_ACCOUNT is not valid JSON: paste the whole key file"); }
  const now = Math.floor(Date.now() / 1000);
  const head = b64url(enc.encode(JSON.stringify({ alg: "RS256", typ: "JWT" })));
  const claim = b64url(enc.encode(JSON.stringify({ iss: sa.client_email, scope: "https://www.googleapis.com/auth/drive.readonly", aud: "https://oauth2.googleapis.com/token", iat: now, exp: now + 3600 })));
  const der = Uint8Array.from(atob(String(sa.private_key || "").replace(/-----[^-]+-----/g, "").replace(/\s+/g, "")), c => c.charCodeAt(0));
  const key = await crypto.subtle.importKey("pkcs8", der, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, enc.encode(head + "." + claim));
  const r = await fetch("https://oauth2.googleapis.com/token", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: "grant_type=" + encodeURIComponent("urn:ietf:params:oauth:grant-type:jwt-bearer") + "&assertion=" + head + "." + claim + "." + b64url(sig) });
  const j = await r.json().catch(() => ({}));
  if (!j.access_token) throw new Error("Google refused the service account (" + (j.error_description || j.error || r.status) + ")");
  TOKEN = { v: j.access_token, exp: Date.now() + (j.expires_in || 3600) * 1000 };
  return TOKEN.v;
}
const timed = async (url, ms, init) => { const c = new AbortController(); const t = setTimeout(() => c.abort(), ms);
  try { return await fetch(url, { redirect: "follow", ...(init || {}), signal: c.signal }); } catch (e) { return null; } finally { clearTimeout(t); } };

/* the workbook's version: changes whenever the workbook does, so the dashboard only downloads it when it has changed */
async function version(env) {
  if (env.FILE_URL) {
    const r = await timed(env.FILE_URL, 10000, { method: "HEAD" });
    if (!r || !r.ok) return { v: null };
    return { v: r.headers.get("etag") || r.headers.get("last-modified") || null, modified: r.headers.get("last-modified") || "" };
  }
  if (!env.SHEET_ID) return { v: null, error: "Set SHEET_ID or FILE_URL in the Worker settings" };
  const tok = await googleToken(env);
  if (!tok && !env.GOOGLE_API_KEY) return { v: null, note: "Add GOOGLE_SERVICE_ACCOUNT or GOOGLE_API_KEY for instant change checks" };
  const u = "https://www.googleapis.com/drive/v3/files/" + env.SHEET_ID + "?fields=modifiedTime,md5Checksum,version,size,mimeType&supportsAllDrives=true" + (tok ? "" : "&key=" + env.GOOGLE_API_KEY);
  const r = await timed(u, 10000, tok ? { headers: { Authorization: "Bearer " + tok } } : undefined);
  if (!r) return { v: null, error: "Google Drive did not answer in time" };
  if (!r.ok) return { v: null, error: "Google Drive answered " + r.status + (r.status === 404 ? ": check SHEET_ID, and that the sheet is shared with the service account" : "") };
  const m = await r.json();
  return { v: m.md5Checksum || (m.version ? "v" + m.version : m.modifiedTime), modified: m.modifiedTime, size: m.size, mimeType: m.mimeType };
}

/* the workbook itself */
async function workbook(env) {
  const bust = "t=" + Date.now();
  if (env.FILE_URL) return timed(env.FILE_URL + (env.FILE_URL.includes("?") ? "&" : "?") + bust, 60000);
  if (!env.SHEET_ID) return null;
  const tok = await googleToken(env);
  const auth = tok ? { headers: { Authorization: "Bearer " + tok } } : undefined;
  const exportUrl = "https://docs.google.com/spreadsheets/d/" + env.SHEET_ID + "/export?format=xlsx&" + bust;
  if (tok) {
    const meta = await version(env);
    if (meta.mimeType && meta.mimeType !== "application/vnd.google-apps.spreadsheet")        // an uploaded .xlsx kept in Drive
      return timed("https://www.googleapis.com/drive/v3/files/" + env.SHEET_ID + "?alt=media&supportsAllDrives=true", 60000, auth);
    const r = await timed(exportUrl, 60000, auth);
    if (r && r.ok && !(r.headers.get("content-type") || "").includes("text/html")) return r;
    return timed("https://www.googleapis.com/drive/v3/files/" + env.SHEET_ID + "/export?mimeType=" + encodeURIComponent(XLSX_TYPE), 60000, auth);
  }
  return timed(exportUrl, 60000);                             // a sheet shared as "Anyone with the link can view"
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const password = env.DASHBOARD_PASSWORD || "";
    const origin = allowedOrigin(request, env);
    const cors = origin ? { "Access-Control-Allow-Origin": origin, "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Authorization, Content-Type", "Access-Control-Max-Age": "600", "Vary": "Origin" } : {};
    const json = (obj, status = 200) => new Response(JSON.stringify(obj), { status, headers: { ...cors, "Content-Type": "application/json", "Cache-Control": "no-store" } });
    const routes = ["/status", "/login", "/meta", "/book", "/instagram"];
    if (routes.includes(url.pathname)) {
      if (request.method === "OPTIONS") return new Response(null, { status: origin ? 204 : 403, headers: cors });
      if (!origin) return json({ error: "This data link only answers its own dashboard. Add the dashboard's address to DASHBOARD_SITES." }, 403);
    }
    try {
      /* /status: is everything set up? Never includes figures. */
      if (url.pathname === "/status") {
        let sheet = { ok: null, modified: "", note: "" };
        if (!env.SHEET_ID && !env.FILE_URL) sheet = { ok: false, modified: "", note: "Set SHEET_ID or FILE_URL in the Worker settings" };
        else { try { const m = await version(env); sheet = m.error ? { ok: false, modified: "", note: m.error } : { ok: m.v ? true : null, modified: m.modified || "", note: m.note || "" }; }
               catch (e) { sheet = { ok: false, modified: "", note: String(e && e.message || e) }; } }
        return json({ ok: true, passwordLink: true, passwordSet: !!password, sheet });
      }
      /* /login: the password in, a sign-in token out */
      if (url.pathname === "/login") {
        if (request.method !== "POST") return json({ error: "Use POST." }, 405);
        if (!password) return json({ error: "No password is set up (DASHBOARD_PASSWORD), so none is needed." }, 400);
        let given = ""; try { given = String((await request.json()).password || ""); } catch (e) {}
        if (!given || !(await sameText(given, password))) { await new Promise(r => setTimeout(r, 1200)); return json({ error: "That password isn't right." }, 401); }
        return json(await makeToken(password));
      }
      /* with a password, everything below needs a signed-in browser */
      if (password && ["/meta", "/book", "/instagram"].includes(url.pathname) && !(await validToken(request, password)))
        return json({ error: "Please sign in again.", signIn: true }, 401);
      if (url.pathname === "/instagram") return json({ followers: null });   // optional: add an Instagram API call here
      if (url.pathname === "/meta") { const m = await version(env); return json(m, m.error ? 502 : 200); }
      if (url.pathname === "/book") {
        const up = await workbook(env);
        if (!up) return json({ error: "The workbook did not arrive in time. Try again in a minute." }, 504);
        if (!up.ok) return json({ error: "The workbook link answered " + up.status + (up.status === 404 || up.status === 403 ? ": check SHEET_ID / FILE_URL and the sharing settings" : "") }, 502);
        if ((up.headers.get("content-type") || "").includes("text/html"))
          return json({ error: "The link returned a web page instead of the workbook: share the sheet with the service account, or as 'Anyone with the link can view'" }, 502);
        return new Response(up.body, { headers: { ...cors, "Content-Type": XLSX_TYPE, "Cache-Control": "no-store" } });
      }
    } catch (e) { return json({ error: String(e && e.message || e) }, 500); }
    return json({ ok: true, message: "Dashboard data link is running. It only answers its own dashboard." });
  }
};
