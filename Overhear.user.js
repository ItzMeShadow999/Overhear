// ==UserScript==
// @name         Overhear
// @namespace    itzmeshadow999
// @version      1.2
// @description  Identify music playing in videos on YouTube, Instagram, X, Reddit and any other website, then copy a yt-dlp download command. UI adopts each site's own CSS.
// @icon         https://iili.io/nc2jxs9.md.png
// @updateURL    https://raw.githubusercontent.com/ItzMeShadow999/Overhear/main/Overhear.user.js
// @downloadURL  https://raw.githubusercontent.com/ItzMeShadow999/Overhear/main/Overhear.user.js
// @match        *://*/*
// @exclude      *://discord.com/*
// @exclude      *://*.discord.com/*
// @exclude      *://discordapp.com/*
// @exclude      *://*.discordapp.com/*
// @grant        GM_xmlhttpRequest
// @grant        GM_addStyle
// @grant        GM_setClipboard
// @connect      127.0.0.1
// @connect      localhost
// @run-at       document-idle
// ==/UserScript==

(() => {
  'use strict';

  if (/(^|\.)(discord|discordapp)\.com$/.test(location.hostname)) return;

  if (window !== window.top && (innerWidth < 320 || innerHeight < 180)) return;
  if (!document.body) return;

  const SERVER = 'http://127.0.0.1:5057/identify';
  const RECORD_MS = 12000;
  const MUSIC_DIR = '~\\Music';

  const SIZE = 48;
  const CARD_W = 288;
  const IS_IG = location.hostname.endsWith('instagram.com');
  const IS_YT = location.hostname.endsWith('youtube.com');
  const IS_X = /(^|\.)(x|twitter)\.com$/.test(location.hostname);
  const IS_RD = /(^|\.)reddit\.com$/.test(location.hostname);

  const IS_OVERLAY = !IS_YT && !IS_IG;
  const TOP_SAFE = IS_X || IS_RD ? 60 : 0;
  const OUTSIDE_GAP = 16;
  const IG_OFFSET_X = 84;
  const IG_OFFSET_Y = 52;

  const ICON_NOTE =
    '<svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" aria-hidden="true"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/></svg>';
  const ICON_COPY =
    '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>';
  const ICON_CHECK =
    '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>';

  const SITE_VARS = {
    yt: {
      surface: ['--yt-spec-menu-background', '--yt-spec-base-background'],
      raised: ['--yt-spec-badge-chip-background', '--yt-spec-additive-background'],
      raisedHover: ['--yt-spec-button-chip-background-hover'],
      border: ['--yt-spec-10-percent-layer', '--yt-spec-outline'],
      ink: ['--yt-spec-text-primary'],
      muted: ['--yt-spec-text-secondary'],
      link: ['--yt-spec-call-to-action'],
      primary: ['--yt-spec-text-primary'],
      primaryInk: ['--yt-spec-text-primary-inverse'],
      danger: ['--yt-spec-brand-link-text', '--yt-spec-error-indicator'],
    },
    ig: {
      surface: ['--ig-elevated-background', '--ig-primary-background'],
      raised: ['--ig-secondary-background', '--ig-highlight-background'],
      raisedHover: ['--ig-hover-overlay'],
      border: ['--ig-separator', '--ig-stroke'],
      ink: ['--ig-primary-text'],
      muted: ['--ig-secondary-text'],
      link: ['--ig-link'],
      primary: ['--ig-primary-button'],
      primaryInk: ['--ig-primary-button-text'],
      danger: ['--ig-error-or-destructive'],
    },

    x: {},

    rd: {
      surface: ['--color-neutral-background'],
      raised: ['--color-secondary-background', '--color-neutral-background-hover'],
      raisedHover: ['--color-secondary-background-hover', '--color-neutral-background-hover'],
      border: ['--color-neutral-border-weak', '--color-neutral-border'],
      ink: ['--color-neutral-content'],
      muted: ['--color-neutral-content-weak'],
    },
  };

  const FALLBACK = {
    yt: {
      dark: { surface: '#282828', raised: 'rgba(255,255,255,.1)', raisedHover: 'rgba(255,255,255,.2)', border: 'rgba(255,255,255,.1)', ink: '#f1f1f1', muted: '#aaaaaa', link: '#3ea6ff', primary: '#f1f1f1', primaryInk: '#0f0f0f', danger: '#ff4e45' },
      light: { surface: '#ffffff', raised: 'rgba(0,0,0,.05)', raisedHover: 'rgba(0,0,0,.1)', border: 'rgba(0,0,0,.1)', ink: '#0f0f0f', muted: '#606060', link: '#065fd4', primary: '#0f0f0f', primaryInk: '#ffffff', danger: '#cc0000' },
    },
    ig: {
      dark: { surface: '#262626', raised: '#363636', raisedHover: '#404040', border: '#363636', ink: '#f5f5f5', muted: '#a8a8a8', link: '#e0f1ff', primary: '#0095f6', primaryInk: '#ffffff', danger: '#ff3040' },
      light: { surface: '#ffffff', raised: '#efefef', raisedHover: '#dbdbdb', border: '#dbdbdb', ink: '#000000', muted: '#737373', link: '#00376b', primary: '#0095f6', primaryInk: '#ffffff', danger: '#ed4956' },
    },
    x: {
      dark: { surface: '#000000', raised: 'rgba(255,255,255,.10)', raisedHover: 'rgba(255,255,255,.18)', border: '#2f3336', ink: '#e7e9ea', muted: '#71767b', link: '#1d9bf0', primary: '#0f78c0', primaryInk: '#ffffff', danger: '#f4212e' },
      light: { surface: '#ffffff', raised: 'rgba(15,20,25,.06)', raisedHover: 'rgba(15,20,25,.12)', border: '#eff3f4', ink: '#0f1419', muted: '#536471', link: '#1d9bf0', primary: '#0f78c0', primaryInk: '#ffffff', danger: '#f4212e' },
    },
    rd: {
      dark: { surface: '#0b1416', raised: 'rgba(255,255,255,.10)', raisedHover: 'rgba(255,255,255,.18)', border: 'rgba(255,255,255,.14)', ink: '#eef1f3', muted: '#b8c5c9', link: '#648efc', primary: '#d93a00', primaryInk: '#ffffff', danger: '#ff585b' },
      light: { surface: '#ffffff', raised: 'rgba(0,0,0,.06)', raisedHover: 'rgba(0,0,0,.12)', border: 'rgba(0,0,0,.14)', ink: '#0f1a1c', muted: '#576f76', link: '#0045ac', primary: '#d93a00', primaryInk: '#ffffff', danger: '#ea0027' },
    },
    gen: {
      dark: { surface: '#1e1e1e', raised: 'rgba(255,255,255,.1)', raisedHover: 'rgba(255,255,255,.18)', border: 'rgba(255,255,255,.14)', ink: '#f2f2f2', muted: '#a0a0a0', link: '#6ab0ff', primary: '#f2f2f2', primaryInk: '#111111', danger: '#ff6b6b' },
      light: { surface: '#ffffff', raised: 'rgba(0,0,0,.06)', raisedHover: 'rgba(0,0,0,.12)', border: 'rgba(0,0,0,.14)', ink: '#111111', muted: '#666666', link: '#0b57d0', primary: '#111111', primaryInk: '#ffffff', danger: '#c62828' },
    },
  };

  const SHAPE = {
    yt: { card: '12px', control: '18px', chip: '8px', weight: 500, size: '14px', line: '20px', shadow: '0 4px 32px rgba(0,0,0,.25)' },
    ig: { card: '12px', control: '8px', chip: '8px', weight: 600, size: '14px', line: '18px', shadow: '0 0 5px 1px rgba(0,0,0,.0975)' },
    x: { card: '16px', control: '9999px', chip: '9999px', weight: 700, size: '15px', line: '20px', shadow: '0 0 15px rgba(101,119,134,.2), 0 0 3px 1px rgba(101,119,134,.15)' },
    rd: { card: '16px', control: '9999px', chip: '9999px', weight: 600, size: '14px', line: '20px', shadow: '0 4px 24px rgba(0,0,0,.25)' },
    gen: { card: '12px', control: '8px', chip: '8px', weight: 600, size: '14px', line: '20px', shadow: '0 4px 24px rgba(0,0,0,.3)' },
  };

  const CARD_FONT = "'Inter', 'Segoe UI Variable Text', 'Segoe UI Variable', 'SF Pro Text', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif";

  const SITE = IS_YT ? 'yt' : IS_IG ? 'ig' : IS_X ? 'x' : IS_RD ? 'rd' : 'gen';

  function normColor(raw) {
    const s = (raw || '').trim();
    if (!s) return '';
    if (/^\d+(\.\d+)?[\s,]+\d+(\.\d+)?[\s,]+\d+(\.\d+)?$/.test(s)) {
      return `rgb(${s.split(/[\s,]+/).join(',')})`;
    }
    return s;
  }

  function cssVar(names) {
    const cs = getComputedStyle(document.documentElement);
    for (const n of names || []) {
      const val = normColor(cs.getPropertyValue(n));
      if (val) return val;
    }
    return '';
  }

  function parseRGB(s) {
    const m = (s || '').match(/rgba?\(([^)]+)\)/);
    if (!m) return null;
    const p = m[1].split(/[\s,/]+/).map(parseFloat);
    return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 };
  }

  function pageBg() {
    for (let el = document.body; el; el = el.parentElement) {
      const c = parseRGB(getComputedStyle(el).backgroundColor);
      if (c && c.a > 0.5) return c;
    }
    return { r: 255, g: 255, b: 255, a: 1 };
  }

  function isDark() {
    const { r, g, b } = pageBg();
    return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255 < 0.45;
  }

  function firstLinkColor() {
    const a = document.querySelector('a[href]');
    return a ? getComputedStyle(a).color : '';
  }

  function applyTheme() {
    const mode = isDark() ? 'dark' : 'light';
    const base = FALLBACK[SITE][mode];
    const vars = SITE_VARS[SITE] || {};
    const shape = SHAPE[SITE];
    const body = getComputedStyle(document.body);

    const t = {};
    for (const k of Object.keys(base)) t[k] = cssVar(vars[k]) || base[k];

    if (SITE === 'gen' || SITE === 'x') {
      const bg = pageBg();
      t.surface = `rgb(${bg.r},${bg.g},${bg.b})`;
      t.ink = body.color || t.ink;
    }
    if (SITE === 'gen') t.link = firstLinkColor() || t.link;

    const font = body.fontFamily || 'system-ui, sans-serif';
    const mono = IS_YT ? "'Roboto Mono', Consolas, monospace" : "ui-monospace, 'Cascadia Code', Consolas, monospace";

    const G = mode === 'dark'
      ? { bg: 'rgba(22,22,26,.55)', border: 'rgba(255,255,255,.14)', ink: '#ffffff', muted: 'rgba(255,255,255,.64)', raised: 'rgba(255,255,255,.10)', hover: 'rgba(255,255,255,.18)', shadow: '0 8px 32px rgba(0,0,0,.4)' }
      : { bg: 'rgba(255,255,255,.58)', border: 'rgba(0,0,0,.10)', ink: '#111111', muted: 'rgba(0,0,0,.58)', raised: 'rgba(0,0,0,.06)', hover: 'rgba(0,0,0,.12)', shadow: '0 8px 32px rgba(0,0,0,.18)' };
    const cs = card.style;
    cs.setProperty('--mf-glass', G.bg);
    cs.setProperty('--mf-glass-border', G.border);
    cs.setProperty('--mf-glass-ink', G.ink);
    cs.setProperty('--mf-glass-muted', G.muted);
    cs.setProperty('--mf-glass-raised', G.raised);
    cs.setProperty('--mf-glass-hover', G.hover);
    cs.setProperty('--mf-glass-shadow', G.shadow);
    cs.setProperty('--mf-card-font', CARD_FONT);

    for (const el of [btn, card]) {
      const s = el.style;
      s.setProperty('--mf-surface', t.surface);
      s.setProperty('--mf-raised', t.raised);
      s.setProperty('--mf-raised-hover', t.raisedHover);
      s.setProperty('--mf-border', t.border);
      s.setProperty('--mf-ink', t.ink);
      s.setProperty('--mf-muted', t.muted);
      s.setProperty('--mf-link', t.link);
      s.setProperty('--mf-primary', t.primary);
      s.setProperty('--mf-primary-ink', t.primaryInk);
      s.setProperty('--mf-danger', t.danger);
      s.setProperty('--mf-font', font);
      s.setProperty('--mf-mono', mono);
      s.setProperty('--mf-r-card', shape.card);
      s.setProperty('--mf-r-control', shape.control);
      s.setProperty('--mf-r-chip', shape.chip);
      s.setProperty('--mf-weight', shape.weight);
      s.setProperty('--mf-size', shape.size);
      s.setProperty('--mf-line', shape.line);
      s.setProperty('--mf-shadow', shape.shadow);
    }
  }

  const ICON_CLOSE =
    '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>';

  GM_addStyle(`
    #mf-btn {
      position: fixed; left: 0; top: 0; z-index: 2147483647;
      width: ${SIZE}px; height: ${SIZE}px; padding: 0;
      display: grid; place-items: center;
      border-radius: 50%; border: 1px solid var(--mf-border);
      background: var(--mf-surface); color: var(--mf-ink); cursor: pointer;
      box-shadow: var(--mf-shadow);
      transition: background-color 150ms ease, transform 150ms ease;
    }
    #mf-btn[hidden] { display: none; }

    #mf-btn:hover { background-image: linear-gradient(var(--mf-raised-hover), var(--mf-raised-hover)); }
    #mf-btn:active { transform: scale(.94); }
    #mf-btn:focus-visible, #mf-card button:focus-visible, #mf-card a:focus-visible {
      outline: 2px solid var(--mf-link); outline-offset: 2px;
    }
    #mf-btn.busy { animation: mf-pulse 1s infinite; }
    @keyframes mf-pulse {
      50% { border-color: var(--mf-link); color: var(--mf-link); }
    }

    #mf-card {
      position: fixed; z-index: 2147483647; box-sizing: border-box;
      width: ${CARD_W}px; padding: 16px;
      border-radius: 16px; border: 1px solid var(--mf-glass-border);
      background: var(--mf-glass); color: var(--mf-glass-ink);
      -webkit-backdrop-filter: blur(20px) saturate(1.7); backdrop-filter: blur(20px) saturate(1.7);
      font-family: var(--mf-card-font); font-size: 14px; line-height: 20px;
      letter-spacing: -0.005em; -webkit-font-smoothing: antialiased;
      box-shadow: var(--mf-glass-shadow);
    }
    #mf-card[hidden] { display: none; }
    #mf-card .mf-close {
      position: absolute; top: 8px; right: 8px; width: 28px; height: 28px; padding: 0;
      display: grid; place-items: center; border: 0; border-radius: 50%; cursor: pointer;
      background: transparent; color: var(--mf-glass-muted);
      transition: color 150ms ease, background-color 150ms ease;
    }
    #mf-card .mf-close:hover { color: var(--mf-glass-ink); background: var(--mf-glass-raised); }
    #mf-card .mf-body > :first-child { padding-right: 24px; }
    #mf-card .mf-err { display: block; }
    #mf-card .mf-title { font-weight: 650; font-size: 16px; line-height: 22px; letter-spacing: -0.015em; color: var(--mf-glass-ink); }
    #mf-card .mf-artist { color: var(--mf-glass-muted); margin: 2px 0 6px; }
    #mf-card .mf-hint { color: var(--mf-glass-muted); font-size: 12px; margin-bottom: 8px; }
    #mf-card .mf-err { color: var(--mf-danger); font-weight: 500; }
    #mf-card .mf-load { display: flex; align-items: center; gap: 10px; font-weight: 500; }
    #mf-card .mf-dot {
      width: 8px; height: 8px; border-radius: 50%; flex: none;
      background: var(--mf-primary); animation: mf-dot 1s ease-in-out infinite;
    }
    @keyframes mf-dot { 50% { transform: scale(1.7); opacity: .45; } }

    #mf-card .mf-cmd {
      display: block; margin: 10px 0 8px; padding: 8px 10px;
      border-radius: 10px;
      background: var(--mf-glass-raised); color: var(--mf-glass-muted);
      font: 12px/1.4 var(--mf-mono);
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
      user-select: all;
    }
    #mf-card .mf-copy {
      width: 100%; min-height: 44px; margin-bottom: 8px;
      display: flex; align-items: center; justify-content: center; gap: 8px;
      border: 0; border-radius: var(--mf-r-control); cursor: pointer;
      background: var(--mf-primary); color: var(--mf-primary-ink);
      font-family: var(--mf-card-font); font-size: 14px;
      font-weight: 600; line-height: 1; letter-spacing: -0.005em;
      transition: opacity 150ms ease, transform 150ms ease;
    }
    #mf-card .mf-copy:hover { opacity: .88; }
    #mf-card .mf-copy:active { transform: scale(.98); }
    #mf-card .mf-copy.ok { background: #1f9d55; color: #fff; }
    #mf-card .mf-copy.fail { background: var(--mf-danger); color: #fff; }

    #mf-card .mf-links { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
    #mf-card .mf-links a {
      min-height: 44px; display: flex; align-items: center; justify-content: center;
      border-radius: var(--mf-r-chip);
      background: var(--mf-glass-raised); color: var(--mf-glass-ink);
      text-decoration: none; font-weight: 600; font-size: 13px; padding: 0 4px; white-space: nowrap;
      transition: background-color 150ms ease;
    }
    #mf-card .mf-links a:hover { background: var(--mf-glass-hover); }

    @media (prefers-reduced-motion: reduce) {
      #mf-btn, #mf-card .mf-copy, #mf-card .mf-close, #mf-card .mf-links a { transition: none; }
      #mf-btn.busy { animation: none; }
      #mf-card .mf-dot { animation: none; }
    }
  `);

  const btn = document.createElement('button');
  btn.id = 'mf-btn';
  btn.type = 'button';
  btn.innerHTML = ICON_NOTE;
  btn.title = 'Identify music in the current video';
  btn.setAttribute('aria-label', 'Identify music in the current video');

  const card = document.createElement('div');
  card.id = 'mf-card';
  card.hidden = true;
  card.setAttribute('role', 'status');
  card.setAttribute('aria-live', 'polite');

  document.body.append(btn, card);

  applyTheme();
  let themeTimer = 0;
  const retheme = () => {
    clearTimeout(themeTimer);
    themeTimer = setTimeout(applyTheme, 120);
  };
  new MutationObserver(retheme).observe(document.documentElement, { attributes: true });
  new MutationObserver(retheme).observe(document.body, { attributes: true });
  setInterval(applyTheme, 3000);

  let rootsCache = [];
  let rootsAt = 0;

  function findShadowRoots() {
    const now = Date.now();
    if (now - rootsAt < 1500) return rootsCache;
    rootsAt = now;
    const roots = [];
    const walk = (root) => {
      for (const el of root.querySelectorAll('*')) {
        if (el.shadowRoot) {
          roots.push(el.shadowRoot);
          walk(el.shadowRoot);
        }
      }
    };
    walk(document);
    rootsCache = roots;
    return roots;
  }

  function collectVideos() {
    const out = Array.from(document.querySelectorAll('video'));
    if (IS_YT || IS_IG) return out;
    for (const root of findShadowRoots()) {
      if (!root.host.isConnected) continue;
      root.querySelectorAll('video').forEach((v) => out.push(v));
    }
    return out;
  }

  function pickVideo() {
    let best = null;
    let bestArea = 0;
    for (const v of collectVideos()) {
      const r = v.getBoundingClientRect();
      const w = Math.max(0, Math.min(r.right, innerWidth) - Math.max(r.left, 0));
      const h = Math.max(0, Math.min(r.bottom, innerHeight) - Math.max(r.top, 0));
      if (w * h > bestArea) {
        best = v;
        bestArea = w * h;
      }
    }
    return best;
  }

  const clamp = (n, lo, hi) => Math.max(lo, Math.min(n, hi));

  function placeCard() {
    const b = btn.getBoundingClientRect();
    card.style.left = clamp(b.right - CARD_W, 8, innerWidth - CARD_W - 8) + 'px';
    if (IS_OVERLAY) {
      const h = card.offsetHeight;
      card.style.bottom = 'auto';
      card.style.top = clamp(b.bottom + 12, 8, Math.max(8, innerHeight - h - 8)) + 'px';
    } else {
      card.style.top = 'auto';
      card.style.bottom = Math.max(8, innerHeight - b.top + 12) + 'px';
    }
  }

  function place() {
    if (!btn.isConnected || !card.isConnected) document.body.append(btn, card);

    let left = innerWidth - 18 - SIZE;
    let top = innerHeight - 18 - SIZE;

    if (IS_OVERLAY) {
      const v = pickVideo();
      const r = v && v.getBoundingClientRect();
      const roomy = r && r.width >= 160 && r.bottom - Math.max(r.top, TOP_SAFE) >= SIZE + 24;
      btn.hidden = !roomy;
      if (!roomy) {
        if (!card.hidden) dismissCard();
        return;
      }
      left = Math.min(r.right, innerWidth) - SIZE - 12;
      top = Math.max(r.top, TOP_SAFE) + 12;

      if (IS_X && r.right + OUTSIDE_GAP + SIZE <= innerWidth - 8) left = r.right + OUTSIDE_GAP;
    }

    if (IS_IG) {
      const v = pickVideo();
      if (v) {
        const r = v.getBoundingClientRect();
        left = r.right + IG_OFFSET_X;
        top = Math.min(r.bottom, innerHeight) - IG_OFFSET_Y;
      }
    }

    btn.style.left = clamp(left, 8, innerWidth - SIZE - 8) + 'px';
    btn.style.top = clamp(top, 8, innerHeight - SIZE - 8) + 'px';
    if (!card.hidden) placeCard();
  }

  place();
  addEventListener('scroll', place, { passive: true, capture: true });
  addEventListener('resize', place);
  setInterval(place, 300);

  function metadataHint(video) {
    const scope = video.closest('article') || document;
    const a = scope.querySelector('a[href*="/reels/audio/"]');
    return a && a.textContent.trim() ? a.textContent.trim() : '';
  }

  function record(video, onTick, scan = {}) {
    return new Promise((resolve, reject) => {
      const cap = video.captureStream || video.mozCaptureStream;
      if (!cap) return reject(new Error('captureStream is not supported here'));

      let stream;
      try {
        stream = cap.call(video);
      } catch {
        return reject(new Error('This site does not allow capturing audio from this video.'));
      }
      const tracks = stream.getAudioTracks();
      if (!tracks.length) {
        return reject(new Error('No audio track. Unmute and play the video, then retry.'));
      }

      const mime = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : '';
      const rec = new MediaRecorder(new MediaStream(tracks), mime ? { mimeType: mime } : undefined);
      const chunks = [];

      rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
      rec.onerror = () => reject(new Error('Recording failed'));
      rec.onstop = () => {
        clearInterval(timer);
        resolve(new Blob(chunks, { type: rec.mimeType || 'audio/webm' }));
      };

      let left = Math.round(RECORD_MS / 1000);
      onTick(left);
      const timer = setInterval(() => onTick(--left), 1000);

      rec.start();
      const stopTimer = setTimeout(() => rec.state !== 'inactive' && rec.stop(), RECORD_MS);

      scan.cancel = () => {
        clearInterval(timer);
        clearTimeout(stopTimer);
        rec.onstop = null;
        rec.ondataavailable = null;
        if (rec.state !== 'inactive') rec.stop();
        reject(new Error('cancelled'));
      };
    });
  }

  function send(blob, scan = {}) {
    return new Promise((resolve, reject) => {
      const handle = GM_xmlhttpRequest({
        method: 'POST',
        url: SERVER,
        data: blob,
        headers: { 'Content-Type': 'application/octet-stream' },
        timeout: 40000,
        onload: (res) => {
          try {
            const json = JSON.parse(res.responseText);
            res.status === 200 ? resolve(json) : reject(new Error(json.error || 'Server error'));
          } catch {
            reject(new Error('Bad server response'));
          }
        },
        onerror: () => reject(new Error('Cannot reach local server on 127.0.0.1:5057')),
        ontimeout: () => reject(new Error('Server timed out')),
      });

      scan.cancel = () => {
        try { handle && handle.abort && handle.abort(); } catch {}
        reject(new Error('cancelled'));
      };
    });
  }

  function esc(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function psQuote(s) {
    const clean = s.replace(/\s+/g, ' ').trim().replace(/['\u2018\u2019\u201A\u201B]/g, (m) => m + m);
    return `'${clean}'`;
  }

  function buildCommand(title, artist) {
    const query = psQuote(`ytsearch:${title} ${artist}`);
    return `yt-dlp ${query} -x --audio-format mp3 --embed-metadata --embed-thumbnail -o "${MUSIC_DIR}\\%(title)s.%(ext)s"`;
  }

  async function copyText(text) {
    try {
      if (typeof GM_setClipboard === 'function') {
        GM_setClipboard(text, 'text');
        return true;
      }
    } catch {}
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {}
    return false;
  }

  let dismissed = false;
  let currentScan = null;

  function show(html) {
    if (dismissed) return;
    card.innerHTML =
      `<button type="button" class="mf-close" aria-label="Close">${ICON_CLOSE}</button>` +
      `<div class="mf-body">${html}</div>`;
    card.hidden = false;
    placeCard();
  }

  let cardVideo = null;
  let cardSrc = '';

  function dismissCard() {
    dismissed = true;
    card.hidden = true;
    cardVideo = null;
    if (currentScan) {
      currentScan.cancelled = true;
      if (currentScan.cancel) currentScan.cancel();
      currentScan = null;
    }
    btn.classList.remove('busy');
  }

  card.addEventListener('click', (e) => {
    if (e.target.closest('.mf-close')) dismissCard();
  });

  function checkReelChange() {
    if (card.hidden || !cardVideo) return;
    if (!cardVideo.isConnected || cardVideo.currentSrc !== cardSrc || pickVideo() !== cardVideo) {
      dismissCard();
    }
  }
  addEventListener('scroll', checkReelChange, { passive: true, capture: true });
  addEventListener('wheel', checkReelChange, { passive: true });
  addEventListener('keyup', checkReelChange);
  setInterval(checkReelChange, 300);

  function renderResult(r, hint) {
    const q = encodeURIComponent(`${r.title} ${r.artist}`);
    const cmd = buildCommand(r.title, r.artist);

    show(
      `<div class="mf-title">${esc(r.title)}</div>` +
        `<div class="mf-artist">${esc(r.artist)}</div>` +
        (hint ? `<div class="mf-hint">Page label: ${esc(hint)}</div>` : '') +
        `<code class="mf-cmd"></code>` +
        `<button type="button" class="mf-copy">${ICON_COPY}<span>Copy download command</span></button>` +
        `<div class="mf-links">` +
        `<a href="https://music.youtube.com/search?q=${q}" target="_blank" rel="noopener">YT Music</a>` +
        `<a href="https://open.spotify.com/search/${q}" target="_blank" rel="noopener">Spotify</a>` +
        `<a href="https://soundcloud.com/search?q=${q}" target="_blank" rel="noopener">SoundCloud</a>` +
        `</div>`
    );

    const code = card.querySelector('.mf-cmd');
    code.textContent = cmd;
    code.title = cmd;

    const copyBtn = card.querySelector('.mf-copy');
    copyBtn.addEventListener('click', async () => {
      const ok = await copyText(cmd);
      copyBtn.classList.add(ok ? 'ok' : 'fail');
      copyBtn.innerHTML = ok
        ? `${ICON_CHECK}<span>Copied</span>`
        : `${ICON_COPY}<span>Copy failed, select the command</span>`;
      setTimeout(() => {
        copyBtn.classList.remove('ok', 'fail');
        copyBtn.innerHTML = `${ICON_COPY}<span>Copy download command</span>`;
      }, 1800);
    });
  }

  btn.addEventListener('click', async () => {
    if (btn.classList.contains('busy')) return;

    dismissed = false;
    applyTheme();
    const video = pickVideo();
    if (!video) return show('<span class="mf-err">No video found on screen.</span>');
    if (video.paused) video.play().catch(() => {});

    cardVideo = video;
    cardSrc = video.currentSrc;
    const hint = metadataHint(video);
    btn.classList.add('busy');
    const scan = { cancelled: false, cancel: null };
    currentScan = scan;

    try {
      const blob = await record(video, (s) => !scan.cancelled && show(`<div class="mf-load"><span class="mf-dot"></span>Listening... ${s}s</div>`), scan);
      if (scan.cancelled) return;
      show('<div class="mf-load"><span class="mf-dot"></span>Matching...</div>');
      const r = await send(blob, scan);

      if (!r.found) {
        return show(
          (hint ? `<div class="mf-hint">Page label: ${esc(hint)}</div>` : '') +
            '<div class="mf-msg">No match found. Try again where the music is louder.</div>'
        );
      }

      renderResult(r, hint);
    } catch (err) {
      if (scan.cancelled) return;
      show(`<span class="mf-err">${esc(err.message)}</span>`);
    } finally {
      if (!scan.cancelled) btn.classList.remove('busy');
      if (currentScan === scan) currentScan = null;
    }
  });
})();
