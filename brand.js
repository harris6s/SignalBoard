/* =====================================================================================================
   PERSONALISATION: your logo, colour, name and words.
   Three ways, strongest first:
     1. The Personalize panel (top bar): changes show straight away and are kept in this browser.
        "Download for GitHub" gives you config.js and logo.png to put in your repository for everyone.
     2. A logo file in img/: upload img/logo.png (or replace img/logo.svg) and it is used everywhere,
        and the dashboard's accent colour is taken from it automatically.
     3. config.js: every setting, written down.
   ===================================================================================================== */
(function () {
  'use strict';
  const DASH = window.DASH = window.DASH || {};
  const KEY = 'dash-brand', LOGO_KEY = 'dash-logo';
  const ORIGINAL = JSON.parse(JSON.stringify(DASH));              /* the site's own settings, for Reset and Download */
  const get = k => { try { return localStorage.getItem(k); } catch (e) { return null; } };
  const set = (k, v) => { try { v == null ? localStorage.removeItem(k) : localStorage.setItem(k, v); return true; } catch (e) { return false; } };
  let saved = {}; try { saved = JSON.parse(get(KEY) || '{}') || {}; } catch (e) { saved = {}; }

  /* this browser's choices on top of config.js */
  const merge = (a, b) => { for (const k in b) { const v = b[k]; if (v === undefined || v === null || v === '') continue;
      if (typeof v === 'object' && !Array.isArray(v)) a[k] = merge(a[k] && typeof a[k] === 'object' ? a[k] : {}, v); else a[k] = v; } return a; };
  merge(DASH, saved);

  /* ---------------- currency: the symbol on every money figure ---------------- */
  (function () {
    const code = String(DASH.currency || 'USD').trim().toUpperCase() || 'USD';
    const part = disp => { try { const p = new Intl.NumberFormat('en', { style: 'currency', currency: code, currencyDisplay: disp }).formatToParts(1).find(x => x.type === 'currency'); return p && p.value; } catch (e) { return null; } };
    const sym = part('narrowSymbol') || part('symbol') || (code === 'USD' ? '$' : code);
    window.DASH_CUR = { code, sym: sym.length > 1 && /[A-Za-z.]$/.test(sym) ? sym + '\u00a0' : sym, icon: sym.length <= 2 ? sym : '\u00a4', name: code === 'USD' ? 'US dollars' : code };
  })();

  /* ---------------- colour: from settings, or from the logo ---------------- */
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  function toHsl(r, g, b) { r /= 255; g /= 255; b /= 255; const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2; let h = 0, s = 0;
    if (mx !== mn) { const d = mx - mn; s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
      h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; h *= 60; } return [h, s, l]; }
  function fromHsl(h, s, l) { const k = n => (n + h / 30) % 12, a = s * Math.min(l, 1 - l), f = n => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
    return [f(0), f(8), f(4)].map(x => Math.round(x * 255)); }
  const hex = rgb => '#' + rgb.map(x => clamp(Math.round(x), 0, 255).toString(16).padStart(2, '0')).join('');
  const parseHex = h => { const m = String(h || '').trim().match(/^#?([0-9a-f]{3}|[0-9a-f]{6})$/i); if (!m) return null; let x = m[1]; if (x.length === 3) x = x.split('').map(c => c + c).join('');
    return [0, 2, 4].map(i => parseInt(x.slice(i, i + 2), 16)); };
  const lum = rgb => { const c = rgb.map(v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; };

  /* the logo's main colour: the most common strong colour, ignoring white, black, greys and transparent pixels */
  function colourOf(img) {
    const n = 72, c = document.createElement('canvas'); c.width = c.height = n; const x = c.getContext('2d', { willReadFrequently: true });
    x.drawImage(img, 0, 0, n, n); let d; try { d = x.getImageData(0, 0, n, n).data; } catch (e) { return null; }
    const bins = Array.from({ length: 36 }, () => ({ w: 0, r: 0, g: 0, b: 0 }));
    for (let i = 0; i < d.length; i += 4) { if (d[i + 3] < 128) continue; const r = d[i], g = d[i + 1], b = d[i + 2], [h, s, l] = toHsl(r, g, b);
      if (s < 0.28 || l < 0.1 || l > 0.93) continue; const w = s * (1 - Math.abs(l - 0.5) * 1.2), k = Math.floor(h / 10) % 36, o = bins[k]; o.w += w; o.r += r * w; o.g += g * w; o.b += b * w; }
    let best = -1, bw = 0; for (let k = 0; k < 36; k++) { const w = bins[k].w + 0.5 * (bins[(k + 35) % 36].w + bins[(k + 1) % 36].w); if (w > bw) { bw = w; best = k; } }
    if (best < 0 || bw < 6 || !bins[best].w) return null;           /* a black, white or grey logo: keep the theme's own accent */
    const o = bins[best]; return hex([o.r / o.w, o.g / o.w, o.b / o.w]);
  }
  /* a logo that fills its whole square (an app icon) makes a heavy watermark, so the summary leaves it out */
  function solidOf(img) { const n = 40, c = document.createElement('canvas'); c.width = c.height = n; const x = c.getContext('2d', { willReadFrequently: true });
    x.drawImage(img, 0, 0, n, n); let d; try { d = x.getImageData(0, 0, n, n).data; } catch (e) { return false; }
    let k = 0; for (let i = 3; i < d.length; i += 4) if (d[i] > 200) k++; return k / (n * n) > 0.6; }
  const markSolid = v => document.documentElement.classList.toggle('logo-solid', !!v);
  /* one colour, adjusted for each theme so it always reads: lighter on dark themes, deeper on light ones */
  function applyColour(c) {
    let st = document.getElementById('brandvars'); const rgb = parseHex(c);
    if (!rgb) { if (st) st.remove(); return; }
    const [h, s, l] = toHsl(...rgb), sat = Math.max(s, 0.42);
    const dark = fromHsl(h, sat, clamp(l, 0.56, 0.72)), light = fromHsl(h, Math.min(1, sat + 0.05), clamp(l, 0.3, 0.44));
    const ink = v => (lum(v) > 0.4 ? '#111111' : '#FFFFFF'), soft = (v, a) => `rgba(${v.join(',')},${a})`;
    if (!st) { st = document.createElement('style'); st.id = 'brandvars'; (document.head || document.documentElement).appendChild(st); }
    st.textContent = `html[data-theme]{--brand:${hex(dark)};--brand-soft:${soft(dark, .13)};--brand-ink:${ink(dark)}}` +
      `html[data-theme="programme"],html[data-theme="daylight"]{--brand:${hex(light)};--brand-soft:${soft(light, .1)};--brand-ink:${ink(light)}}`;
  }

  /* ---------------- logo: an upload in this browser, config.js, or a file in img/ ---------------- */
  const DEFAULT_LOGO = 'img/logo.svg', AUTO_KEY = 'dash-logo-colour';
  const EXPLICIT = DASH.logo && DASH.logo !== DEFAULT_LOGO ? DASH.logo : '';    /* the template's placeholder doesn't count, so img/logo.png still wins */
  let logoSrc = get(LOGO_KEY) || EXPLICIT || get('dash-logo-found') || DEFAULT_LOGO, autoColour = null;
  const tag = s => (s && s.length > 300 ? 'local:' + s.length + ':' + s.slice(-40) : s || '');
  /* the colour found in the logo last time, so the page opens in it without a flash */
  try { const c = JSON.parse(get(AUTO_KEY) || 'null'); if (c && c.src === tag(logoSrc)) { autoColour = c.colour || null; markSolid(c.solid); } } catch (e) {}
  const probe = src => new Promise(res => { const im = new Image(); im.onload = () => res(im); im.onerror = () => res(null); im.src = src; });
  function paintLogo() {
    document.querySelectorAll('#brandlogo,#printlogo,.gate-logo,.hero-mark,.pz-logo-img').forEach(el => { el.src = logoSrc; });
    const fav = document.getElementById('favicon'); if (fav) fav.href = logoSrc;
  }
  async function findLogo() {
    const local = get(LOGO_KEY);
    /* img/logo.png first, so uploading one to the repository is all it takes; then the logo.svg that ships with the template */
    const list = local ? [local] : EXPLICIT ? [EXPLICIT, 'img/logo.png'] : ['img/logo.png'];
    let img = null, src = null; for (const s of list) { img = await probe(s); if (img) { src = s; break; } }
    if (!img) { img = await probe(DEFAULT_LOGO); src = DEFAULT_LOGO; }
    if (!local && !EXPLICIT) set('dash-logo-found', src);
    if (src !== logoSrc) { logoSrc = src; paintLogo(); }
    autoColour = img && src !== DEFAULT_LOGO ? colourOf(img) : null;
    const solid = !!img && src !== DEFAULT_LOGO && solidOf(img); markSolid(solid);
    set(AUTO_KEY, JSON.stringify({ src: tag(src), colour: autoColour, solid }));
    if (!DASH.color && !document.getElementById('pz')) applyColour(autoColour);
    return src;
  }
  applyColour(DASH.color || autoColour);
  const ready = findLogo();

  /* ---------------- the brand on the page ---------------- */
  function paintBrand() {
    const name = DASH.name || 'Your Brand', tag = DASH.tagline || 'Analytics dashboard';
    const t = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
    t('brandname', name); t('brandtag', tag); t('printname', name);
    paintLogo();
    const b = document.getElementById('pzbtn'); if (b) b.hidden = DASH.allowPersonalize === false;
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', paintBrand); else paintBrand();

  /* ---------------- the Personalize panel ---------------- */
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const CURRENCIES = [['USD', 'US dollar'], ['EUR', 'Euro'], ['GBP', 'British pound'], ['QAR', 'Qatari riyal'], ['AED', 'UAE dirham'], ['SAR', 'Saudi riyal'], ['KWD', 'Kuwaiti dinar'], ['BHD', 'Bahraini dinar'], ['OMR', 'Omani rial'],
    ['EGP', 'Egyptian pound'], ['ZAR', 'South African rand'], ['NGN', 'Nigerian naira'], ['KES', 'Kenyan shilling'], ['INR', 'Indian rupee'], ['PKR', 'Pakistani rupee'], ['AUD', 'Australian dollar'], ['NZD', 'New Zealand dollar'],
    ['CAD', 'Canadian dollar'], ['CHF', 'Swiss franc'], ['SEK', 'Swedish krona'], ['NOK', 'Norwegian krone'], ['DKK', 'Danish krone'], ['PLN', 'Polish zloty'], ['TRY', 'Turkish lira'], ['BRL', 'Brazilian real'], ['MXN', 'Mexican peso'],
    ['JPY', 'Japanese yen'], ['CNY', 'Chinese yuan'], ['HKD', 'Hong Kong dollar'], ['SGD', 'Singapore dollar'], ['MYR', 'Malaysian ringgit'], ['IDR', 'Indonesian rupiah'], ['PHP', 'Philippine peso'], ['THB', 'Thai baht'], ['KRW', 'South Korean won']];
  const THEMES = [['', 'Midnight (visitors can change it)'], ['midnight', 'Midnight'], ['broadcast', 'Broadcast'], ['programme', 'Programme'], ['daylight', 'Daylight']];
  const LOCKED_PAGES = new Set(['summary', 'actions', 'connect']);
  let draft = null, draftLogo, draftColour, before = null;

  function pagesList() {
    try { return NAV.flatMap(([g, items]) => items.map(([id, label]) => ({ id, label, g }))).filter(p => !LOCKED_PAGES.has(p.id)); }   /* NAV is defined in app.js */
    catch (e) { return []; }
  }
  function open() {
    draft = JSON.parse(JSON.stringify({ name: DASH.name || '', tagline: DASH.tagline || '', website: DASH.website || '', handles: DASH.handles || {}, words: DASH.words || {},
      currency: DASH.currency || 'USD', theme: DASH.theme || '', color: DASH.color || '', pages: DASH.pages || {} }));
    draftLogo = get(LOGO_KEY); draftColour = DASH.color || ''; before = { logo: logoSrc, auto: autoColour, solid: document.documentElement.classList.contains('logo-solid') };
    let el = document.getElementById('pz'); if (el) el.remove();
    el = document.createElement('div'); el.id = 'pz'; el.className = 'pz'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true'); el.setAttribute('aria-labelledby', 'pz-t');
    const hide = new Set((draft.pages.hide || []).map(String)), W = draft.words || {}, H = draft.handles || {};
    const field = (id, label, val, ph) => `<label class="pz-f"><span>${label}</span><input id="${id}" value="${esc(val)}" placeholder="${esc(ph || '')}" autocomplete="off"></label>`;
    el.innerHTML = `<div class="pz-card">
      <div class="pz-top"><div><h2 id="pz-t">Make it yours</h2><p>Changes show straight away. <b>Save</b> keeps them in this browser; <b>Download for GitHub</b> gives you the files that make them the default for everyone.</p></div>
        <button type="button" class="pz-x" data-pz="close" aria-label="Close">✕</button></div>
      <div class="pz-grid">
        <section><h3>Logo</h3>
          <div class="pz-logo"><img class="pz-logo-img" alt="Your logo" src="${esc(logoSrc)}"><div class="pz-logo-b">
            <button type="button" class="btn" data-pz="upload">Upload your logo</button>
            <button type="button" class="btn ghost" data-pz="nologo">Use the default</button>
            <small>PNG, SVG, JPG or WebP. Square, or with space around it, works best.</small></div></div>
          <input type="file" id="pz-file" accept="image/png,image/svg+xml,image/jpeg,image/webp" hidden>
          <h3>Colour</h3>
          <div class="pz-col"><input type="color" id="pz-color" value="${esc(draftColour || autoColour || '#d9a857')}" aria-label="Accent colour">
            <div class="pz-col-b"><button type="button" class="btn" data-pz="fromlogo"${autoColour ? '' : ' disabled'}>Use the logo’s colour</button><button type="button" class="btn ghost" data-pz="nocolour">Theme’s own colour</button></div></div>
          <p class="pz-n" id="pz-colnote">${draftColour ? 'Your own accent colour.' : autoColour ? 'Taken from your logo.' : 'The theme’s own accent. Upload a colourful logo, or pick a colour.'}</p>
          <h3>Look</h3>
          <label class="pz-f"><span>Theme for new visitors</span><select id="pz-theme">${THEMES.map(([v, l]) => `<option value="${v}"${v === draft.theme ? ' selected' : ''}>${l}</option>`).join('')}</select></label>
          <label class="pz-f"><span>Currency</span><select id="pz-cur">${CURRENCIES.map(([v, l]) => `<option value="${v}"${v === draft.currency ? ' selected' : ''}>${v}, ${l}</option>`).join('')}</select></label>
        </section>
        <section><h3>Name</h3>
          ${field('pz-name', 'Brand name', draft.name, 'Your Brand')}${field('pz-tagline', 'Line under the name', draft.tagline, 'Analytics dashboard')}
          ${field('pz-website', 'Website', draft.website, 'yourwebsite.com')}${field('pz-tt', 'TikTok handle', H.tiktok || '', 'yourbrand')}${field('pz-x', 'X handle', H.x || '', 'yourbrand')}
          <h3>Your words</h3><p class="pz-n">The action plan uses these in its advice.</p>
          ${field('pz-niche', 'What you post about', W.niche || '', 'travel, football, cooking')}${field('pz-moments', 'When interest peaks', W.moments || '', 'match days, launches, holiday weekends')}
          ${field('pz-partners', 'Who you could collaborate with', W.partners || '', 'creators and brands in your niche')}${field('pz-app', 'What your app gives people', W.appFeatures || '', 'alerts, updates and exclusive content')}
        </section>
        <section><h3>Pages</h3><p class="pz-n">Untick the pages you don’t need. The summary, action plan and Connect data are always there.</p>
          <div class="pz-pages">${pagesList().map(p => `<label class="pz-chk"><input type="checkbox" data-page="${esc(p.id)}"${hide.has(p.id) ? '' : ' checked'}><span>${esc(p.label)}</span></label>`).join('')}</div>
          <label class="pz-chk pz-auto"><input type="checkbox" id="pz-hideempty"${draft.pages.hideEmpty === false ? '' : ' checked'}><span>Hide pages for platforms with no data in the workbook</span></label>
        </section>
      </div>
      <div class="pz-gh" id="pz-gh" hidden></div>
      <div class="pz-foot"><button type="button" class="btn ghost" data-pz="reset">Reset to the site’s settings</button><span class="pz-sp"></span>
        <button type="button" class="btn" data-pz="download">Download for GitHub</button><button type="button" class="btn primary" data-pz="save">Save</button></div></div>`;
    document.body.appendChild(el); document.body.classList.add('pz-open');
    setTimeout(() => { const f = el.querySelector('#pz-name'); if (f) f.focus(); }, 30);
  }
  function close() { const el = document.getElementById('pz'); if (el) el.remove(); document.body.classList.remove('pz-open');
    /* nothing saved: undo the live preview */ if (before) { logoSrc = before.logo; autoColour = before.auto; markSolid(before.solid); before = null; } applyColour(DASH.color || autoColour); paintBrand(); }
  function read() {
    const v = id => { const el = document.getElementById(id); return el ? el.value.trim() : ''; };
    const hide = [...document.querySelectorAll('#pz [data-page]')].filter(c => !c.checked).map(c => c.dataset.page);
    return { name: v('pz-name'), tagline: v('pz-tagline'), website: v('pz-website'), handles: { tiktok: v('pz-tt').replace(/^@/, ''), x: v('pz-x').replace(/^@/, '') },
      words: { niche: v('pz-niche'), moments: v('pz-moments'), partners: v('pz-partners'), appFeatures: v('pz-app') }, currency: v('pz-cur') || 'USD', theme: v('pz-theme'),
      color: draftColour || '', pages: { hide, hideEmpty: !!(document.getElementById('pz-hideempty') || {}).checked } };
  }
  /* a logo, shrunk to at most 512 pixels and saved as PNG */
  function takeLogo(file) {
    if (!file) return; if (!/^image\//.test(file.type)) { note('That file is not an image.'); return; }
    const fr = new FileReader(); fr.onload = () => { const im = new Image(); im.onload = () => {
        const iw = im.naturalWidth || 512, ih = im.naturalHeight || 512, s = /svg/.test(file.type) ? 512 / Math.max(iw, ih) : Math.min(1, 512 / Math.max(iw, ih)), w = Math.max(1, Math.round(iw * s)), h = Math.max(1, Math.round(ih * s));
        const c = document.createElement('canvas'); c.width = w; c.height = h; c.getContext('2d').drawImage(im, 0, 0, w, h);
        draftLogo = c.toDataURL('image/png'); logoSrc = draftLogo; paintLogo();
        autoColour = colourOf(im); markSolid(solidOf(im)); const b = document.querySelector('[data-pz="fromlogo"]'); if (b) b.disabled = !autoColour;
        if (!draftColour) { applyColour(autoColour); const ci = document.getElementById('pz-color'); if (ci && autoColour) ci.value = autoColour; }
        note(autoColour ? 'Logo added. The accent colour now comes from it.' : 'Logo added. It has no strong colour, so the theme’s accent stays.'); };
      im.onerror = () => note('That image could not be read.'); im.src = fr.result; };
    fr.readAsDataURL(file);
  }
  function note(t) { const n = document.getElementById('pz-colnote'); if (n) n.textContent = t; }
  function save() { const d = read(); if (draftLogo && !set(LOGO_KEY, draftLogo)) { note('That logo is too big to keep in this browser. Try a smaller PNG.'); return; } if (!draftLogo) set(LOGO_KEY, null);
    if (!set(KEY, JSON.stringify(d))) { note('This browser is not letting the page keep settings (a private window?). Use Download for GitHub instead.'); return; } before = null;
    if (d.theme) { try { localStorage.setItem('dash-theme', d.theme); } catch (e) {} }
    location.reload(); }
  function reset() { set(KEY, null); set(LOGO_KEY, null); set('dash-logo-found', null); location.reload(); }

  /* config.js for the repository: the panel's choices plus the site's own data settings */
  const q = v => JSON.stringify(v == null ? '' : v);
  function configText(d) {
    const data = Object.assign({ workerUrl: '', password: false, fileUrl: '', allowOpenFile: true, sample: 'sample-data.xlsx' }, ORIGINAL.data || {});
    const topics = Object.assign({ phrases: {}, same: {}, ignore: [] }, ORIGINAL.topics || {});
    return `/* =====================================================================================================
   DASHBOARD SETTINGS. Made with the Personalize panel; edit anything here by hand too.
   ===================================================================================================== */
window.DASH = {

  /* ---------- your brand ---------- */
  name: ${q(d.name || 'Your Brand')},
  tagline: ${q(d.tagline || 'Analytics dashboard')},
  logo: ${q(draftLogo ? '' : EXPLICIT)},                              // leave empty to use img/logo.png (or img/logo.svg)
  color: ${q(d.color || '')},                            // accent colour, e.g. '#1E88E5'; empty = taken from your logo
  website: ${q(d.website || '')},
  handles: { tiktok: ${q(d.handles.tiktok)}, x: ${q(d.handles.x)} },
  currency: ${q(d.currency || 'USD')},                         // the currency your stores and ad accounts pay you in
  theme: ${q(d.theme || '')},                             // theme for new visitors: midnight, broadcast, programme or daylight
  allowPersonalize: ${ORIGINAL.allowPersonalize === false ? 'false' : 'true'},               // show the Personalize button

  /* ---------- words the action plan uses in its advice ---------- */
  words: {
    niche: ${q(d.words.niche || 'your niche')},
    moments: ${q(d.words.moments || 'big moments')},
    partners: ${q(d.words.partners || 'creators and brands in your niche')},
    appFeatures: ${q(d.words.appFeatures || 'alerts, updates and exclusive content')}
  },

  /* ---------- pages ---------- */
  pages: {
    hide: ${JSON.stringify(d.pages.hide || [])},          // pages to leave out
    hideEmpty: ${d.pages.hideEmpty === false ? 'false' : 'true'}         // hide pages for platforms with no data in the workbook
  },

  /* ---------- where the data comes from: see README.md ---------- */
  data: {
    workerUrl: ${q(data.workerUrl)},
    password: ${data.password ? 'true' : 'false'},
    fileUrl: ${q(data.fileUrl)},
    allowOpenFile: ${data.allowOpenFile === false ? 'false' : 'true'},
    sample: ${q(data.sample)}
  },

  /* ---------- topics (optional): help the action plan read your captions ---------- */
  topics: ${JSON.stringify(topics)}
};

window.ATR_MANUAL = window.ATR_MANUAL || { instagramFollowers: null };
`;
  }
  function download(name, href) { const a = document.createElement('a'); a.href = href; a.download = name; document.body.appendChild(a); a.click(); setTimeout(() => { a.remove(); if (href.startsWith('blob:')) URL.revokeObjectURL(href); }, 500); }
  function forGitHub() {
    const d = read(); download('config.js', URL.createObjectURL(new Blob([configText(d)], { type: 'text/javascript' })));
    if (draftLogo) setTimeout(() => download('logo.png', draftLogo), 400);
    const gh = document.getElementById('pz-gh'); if (!gh) return; gh.hidden = false;
    gh.innerHTML = `<h3>Put them in your GitHub repository</h3><ol>
      <li>Open your repository on GitHub. Click <b>config.js</b>, then the pencil to edit, paste in the new file’s contents (or use <b>Add file › Upload files</b> to replace it), and press <b>Commit changes</b>.</li>
      ${draftLogo ? '<li>Open the <b>img</b> folder, choose <b>Add file › Upload files</b>, drop in <b>logo.png</b> and commit.</li>' : ''}
      <li>GitHub Pages updates the site in about a minute, for everyone who opens it.</li></ol>`;
    gh.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  document.addEventListener('click', e => {
    const b = e.target.closest('[data-pz]'); if (!b) return; const k = b.dataset.pz;
    if (k === 'open') { e.preventDefault(); open(); return; }
    if (!document.getElementById('pz')) return;
    if (k === 'close') close();
    else if (k === 'upload') { const f = document.getElementById('pz-file'); if (f) { f.value = ''; f.click(); } }
    else if (k === 'nologo') { draftLogo = null; (async () => { let im = null, src = null;
        for (const s of EXPLICIT ? [EXPLICIT, 'img/logo.png', DEFAULT_LOGO] : ['img/logo.png', DEFAULT_LOGO]) { im = await probe(s); if (im) { src = s; break; } }
        logoSrc = src || DEFAULT_LOGO; paintLogo(); autoColour = im && src !== DEFAULT_LOGO ? colourOf(im) : null; markSolid(!!im && src !== DEFAULT_LOGO && solidOf(im));
        const fb = document.querySelector('[data-pz="fromlogo"]'); if (fb) fb.disabled = !autoColour; if (!draftColour) applyColour(autoColour);
        note(src === DEFAULT_LOGO ? 'Back to the placeholder logo.' : 'Back to the logo in the img folder.'); })(); }
    else if (k === 'fromlogo') { draftColour = ''; applyColour(autoColour); const ci = document.getElementById('pz-color'); if (ci && autoColour) ci.value = autoColour; note('Taken from your logo.'); }
    else if (k === 'nocolour') { draftColour = ''; autoColour = null; applyColour(null); note('The theme’s own accent colour.'); }
    else if (k === 'save') save();
    else if (k === 'reset') reset();
    else if (k === 'download') forGitHub();
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && document.getElementById('pz')) close(); });
  document.addEventListener('change', e => { if (e.target && e.target.id === 'pz-file') takeLogo(e.target.files && e.target.files[0]); });
  document.addEventListener('input', e => {
    const id = e.target && e.target.id; if (!id || !document.getElementById('pz')) return;
    if (id === 'pz-color') { draftColour = e.target.value; applyColour(draftColour); note('Your own accent colour.'); }
    if (id === 'pz-name') { const el = document.getElementById('brandname'); if (el) el.textContent = e.target.value || 'Your Brand'; }
    if (id === 'pz-tagline') { const el = document.getElementById('brandtag'); if (el) el.textContent = e.target.value || 'Analytics dashboard'; }
  });

  window.DASH_BRAND = { logo: () => logoSrc, colour: () => DASH.color || autoColour, ready, open };
})();
