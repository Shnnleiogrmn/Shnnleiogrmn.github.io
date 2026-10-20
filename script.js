(() => {
  'use strict';

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const root = document.documentElement;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const EMAIL = 'shannaleiogrmn@gmail.com';

  const store = {
    get(k) { try { return localStorage.getItem(k); } catch { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch { /* storage unavailable */ } }
  };

  /* ───────── Toast ───────── */
  const toastEl = $('.toast');
  let toastTimer;
  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove('show'), 2200);
  }

  /* ───────── Sound (opt-in, starts muted) ───────── */
  const sound = (() => {
    let ctx = null, last = 0;
    let on = store.get('portfolio-sound') === 'on';

    function audio() {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      if (!ctx) ctx = new AC();
      if (ctx.state === 'suspended') ctx.resume().catch(() => {});
      return ctx;
    }
    // very short filtered noise burst + faint low thump = soft mechanical switch
    function click(t, { freq = 2400, q = 1.4, dur = .03, vol = .05, thump = 150 } = {}) {
      const c = ctx, n = Math.floor(c.sampleRate * dur);
      const buf = c.createBuffer(1, n, c.sampleRate), d = buf.getChannelData(0);
      for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 3);
      const src = c.createBufferSource(); src.buffer = buf;
      const bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = freq; bp.Q.value = q;
      const g = c.createGain(); g.gain.value = vol;
      src.connect(bp).connect(g).connect(c.destination); src.start(t);
      if (thump) {
        const o = c.createOscillator(), og = c.createGain();
        o.frequency.setValueAtTime(thump, t); o.frequency.exponentialRampToValueAtTime(60, t + .04);
        og.gain.setValueAtTime(vol * .45, t); og.gain.exponentialRampToValueAtTime(.0001, t + .05);
        o.connect(og).connect(c.destination); o.start(t); o.stop(t + .06);
      }
    }
    const kinds = {
      click: t => click(t),
      tick: t => click(t, { freq: 3400, dur: .018, vol: .04, thump: 0 }),
      switch: t => { click(t, { freq: 2000, vol: .04 }); click(t + .055, { freq: 1300, vol: .035, thump: 110 }); },
      open: t => { click(t, { freq: 1500, vol: .04 }); click(t + .05, { freq: 2600, vol: .03, thump: 0 }); },
      close: t => { click(t, { freq: 2600, vol: .03, thump: 0 }); click(t + .05, { freq: 1500, vol: .035 }); }
    };
    function play(kind = 'click') {
      if (!on) return;
      const now = performance.now();
      if (now - last < 45) return;           // never stack rapid sounds
      last = now;
      if (!audio()) return;
      (kinds[kind] || kinds.click)(ctx.currentTime + .005);
    }
    function render() {
      $$('[data-sound-toggle]').forEach(b => {
        b.textContent = on ? 'sound: on' : 'sound: off';
        b.setAttribute('aria-pressed', String(on));
        b.setAttribute('aria-label', on ? 'Interface sounds on. Activate to mute.' : 'Interface sounds off. Activate to enable.');
      });
    }
    function set(v) {
      on = v; store.set('portfolio-sound', on ? 'on' : 'off'); render();
      if (on) { last = 0; play('switch'); }
    }
    render();
    return { play, toggle: () => set(!on), get on() { return on; } };
  })();

  document.addEventListener('click', e => {
    const t = e.target.closest('[data-sfx], a, button');
    if (!t || t.matches('[data-sound-toggle], .pcard')) return;
    const kind = t.dataset.sfx || 'click';
    if (kind !== 'none') sound.play(kind);
  });
  $$('[data-sound-toggle]').forEach(b => b.addEventListener('click', () => sound.toggle()));

  /* ───────── Theme: system / light / dark ───────── */
  const system = matchMedia('(prefers-color-scheme: dark)');
  let mode = store.get('portfolio-theme');
  if (!['system', 'light', 'dark'].includes(mode)) mode = 'system';
  let animTimer;
  function applyTheme(animate) {
    const resolved = mode === 'system' ? (system.matches ? 'dark' : 'light') : mode;
    if (animate && !reduce.matches) {
      root.classList.add('theme-anim');
      clearTimeout(animTimer);
      animTimer = setTimeout(() => root.classList.remove('theme-anim'), 320);
    }
    root.dataset.theme = resolved;
    $$('[data-theme-set]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.themeSet === mode)));
    $$('[data-mode-label]').forEach(el => { el.textContent = mode === 'system' ? `system (${resolved})` : mode; });
    const meta = $('meta[name="theme-color"]');
    if (meta) meta.content = resolved === 'dark' ? '#0a0a0b' : '#f6f6f3';
  }
  function setMode(m, animate = true) { mode = m; store.set('portfolio-theme', m); applyTheme(animate); }
  applyTheme(false);
  system.addEventListener('change', () => applyTheme(false));
  $$('[data-theme-set]').forEach(b => b.addEventListener('click', () => setMode(b.dataset.themeSet)));

  /* ───────── Navigation ───────── */
  const menu = $('.menu'), links = $('#links');
  const closeMenu = () => { links.classList.remove('open'); menu.setAttribute('aria-expanded', 'false'); };
  menu.addEventListener('click', () => menu.setAttribute('aria-expanded', String(links.classList.toggle('open'))));
  links.addEventListener('click', e => { if (e.target.closest('a, button')) closeMenu(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && links.classList.contains('open')) { closeMenu(); menu.focus(); } });
  document.addEventListener('click', e => { if (!e.target.closest('.nav')) closeMenu(); });
  matchMedia('(min-width: 861px)').addEventListener('change', closeMenu);

  const navLinks = $$('a[href^="#"]', links);
  if ('IntersectionObserver' in window) {
    const spy = new IntersectionObserver(entries => {
      entries.forEach(en => {
        if (!en.isIntersecting) return;
        navLinks.forEach(a => {
          const on = a.hash === `#${en.target.id}`;
          a.classList.toggle('on', on);
          if (on) a.setAttribute('aria-current', 'location'); else a.removeAttribute('aria-current');
        });
      });
    }, { rootMargin: '-20% 0px -65% 0px' });
    navLinks.forEach(a => { const s = $(a.hash); if (s) spy.observe(s); });
  }

  function goTo(sel) {
    const el = $(sel);
    if (!el) return;
    el.scrollIntoView({ behavior: reduce.matches ? 'auto' : 'smooth', block: 'start' });
    history.replaceState(null, '', sel);
  }

  /* ───────── Section reveal ───────── */
  const revealEls = $$('[data-reveal]');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(entries => entries.forEach(en => {
      if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
    }), { rootMargin: '0px 0px -8% 0px', threshold: .05 });
    revealEls.forEach(el => io.observe(el));
  } else revealEls.forEach(el => el.classList.add('in'));

  /* ───────── Copy email ───────── */
  async function copyEmail() {
    const status = $('#copy-status');
    try {
      await navigator.clipboard.writeText(EMAIL);
      status.textContent = 'Email copied to clipboard.';
      toast('email copied');
      return true;
    } catch {
      status.textContent = `Copy this address manually: ${EMAIL}`;
      toast('copy blocked — address shown in contact');
      return false;
    }
  }
  $('.copy-email').addEventListener('click', copyEmail);

  /* ───────── Featured projects spotlight ───────── */
  (() => {
    const box = $('.spotlight'), stage = $('.stage', box);
    const rows = $$('#all-projects ~ .plist .proj');
    if (!box || !rows.length) return;

    const data = rows.map(r => ({
      id: r.id,
      cat: $('.status', r).textContent.trim(),
      title: $('h3', r).textContent.trim(),
      desc: $('.pdesc', r).textContent.trim(),
      tech: $$('.badges li', r).map(li => li.textContent.trim())
    }));
    const n = data.length;
    const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
    const pad = i => String(i + 1).padStart(2, '0');

    const cards = data.map((p, i) => {
      const card = el('div', 'pcard'); card.setAttribute('role', 'group'); card.setAttribute('aria-label', `${i + 1} of ${n}: ${p.title}`);
      const float = el('div', 'pfloat'), pin = el('div', 'pin');
      const meta = el('div', 'pmeta mono'); meta.append(el('span', null, p.cat), el('span', null, `${pad(i)} / ${pad(n - 1)}`));
      const vis = el('div', 'pvis');
      vis.append(el('i'), el('i'), el('i'), el('i'));
      const inn = el('div', 'pvis-in'); inn.append(el('div', 'pvis-n mono', pad(i)), el('div', 'pvis-s mono', p.tech.slice(0, 3).join(' · ')));
      vis.append(inn);
      const tech = el('ul', 'ptech mono'); p.tech.slice(0, 5).forEach(t => tech.append(el('li', null, t)));
      const act = el('div', 'pact mono');
      const arr = el('span', 'arr', '↗'); arr.setAttribute('aria-hidden', 'true');
      const a = el('a', 'arrow'); a.href = `#${p.id}`; a.append('View details ', arr);
      a.addEventListener('click', e => { e.preventDefault(); const t = document.getElementById(p.id); const d = $('details', t); if (d) d.open = true; goTo(`#${p.id}`); });
      act.append(a);
      pin.append(meta, vis, el('h3', 'ptitle', p.title), el('p', 'pdesc-s', p.desc), tech, act);
      float.append(pin); card.append(float); stage.append(card);
      card.addEventListener('click', () => { if (swiped) { swiped = false; return; } if (i !== active) select(i); });
      return card;
    });

    const dotsEl = $('.dots', box), status = $('.spot-status', box);
    const dots = data.map((p, i) => {
      const b = el('button'); b.type = 'button'; b.dataset.sfx = 'none'; b.setAttribute('aria-label', `Show project ${i + 1}: ${p.title}`);
      b.addEventListener('click', () => { sound.play('tick'); select(i); });
      dotsEl.append(b); return b;
    });

    let active = 0, swiped = false;
    function layout() {
      const small = matchMedia('(max-width: 700px)').matches;
      const step = small ? 58 : 60;
      cards.forEach((c, i) => {
        let o = i - active;
        if (o > n / 2) o -= n;
        if (o < -n / 2) o += n;
        const a = Math.abs(o);
        c.style.setProperty('--x', `${o * step}%`);
        c.style.setProperty('--y', `${a * 14}px`);
        c.style.setProperty('--r', `${o * 3.5}deg`);
        c.style.setProperty('--s', String(1 - a * .06));
        c.style.setProperty('--o', a === 0 ? '1' : a === 1 ? '.85' : a === 2 ? '.45' : '0');
        c.style.setProperty('--z', String(10 - a));
        c.style.visibility = a > 2 ? 'hidden' : '';
        c.classList.toggle('active', o === 0);
        if (o === 0) c.removeAttribute('aria-hidden'); else c.setAttribute('aria-hidden', 'true');
        $$('a', c).forEach(a2 => { a2.tabIndex = o === 0 ? 0 : -1; });
      });
      dots.forEach((d, i) => { if (i === active) d.setAttribute('aria-current', 'true'); else d.removeAttribute('aria-current'); });
      status.textContent = `${pad(active)} / ${pad(n - 1)} — ${data[active].title}`;
    }
    function select(i) { active = (i + n) % n; resetTilt(); layout(); }
    const go = d => select(active + d);

    $('.prev', box).addEventListener('click', () => { sound.play('tick'); go(-1); });
    $('.next', box).addEventListener('click', () => { sound.play('tick'); go(1); });
    stage.addEventListener('keydown', e => {
      if (e.key === 'ArrowLeft') { e.preventDefault(); sound.play('tick'); go(-1); }
      if (e.key === 'ArrowRight') { e.preventDefault(); sound.play('tick'); go(1); }
    });

    // swipe (vertical scrolling is preserved via touch-action: pan-y)
    let sx = 0, sy = 0, down = false;
    stage.addEventListener('pointerdown', e => { if (e.pointerType === 'mouse' && e.button !== 0) return; down = true; sx = e.clientX; sy = e.clientY; swiped = false; });
    stage.addEventListener('pointerup', e => {
      if (!down) return; down = false;
      const dx = e.clientX - sx, dy = e.clientY - sy;
      if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy) * 1.3) { swiped = true; sound.play('tick'); go(dx < 0 ? 1 : -1); }
    });
    stage.addEventListener('pointercancel', () => { down = false; });

    // subtle hover tilt + inner parallax (mouse only, off for reduced motion)
    let raf = 0;
    function resetTilt() { cards.forEach(c => ['--rx', '--ry', '--px', '--py'].forEach(k => c.style.removeProperty(k))); }
    stage.addEventListener('pointermove', e => {
      if (e.pointerType !== 'mouse' || reduce.matches) return;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const c = cards[active], r = c.getBoundingClientRect();
        const nx = (e.clientX - (r.left + r.width / 2)) / (r.width / 2);
        const ny = (e.clientY - (r.top + r.height / 2)) / (r.height / 2);
        if (Math.abs(nx) > 1 || Math.abs(ny) > 1) { resetTilt(); return; }
        c.style.setProperty('--ry', `${(nx * 3).toFixed(2)}deg`);
        c.style.setProperty('--rx', `${(-ny * 2.5).toFixed(2)}deg`);
        c.style.setProperty('--px', `${(nx * 6).toFixed(1)}px`);
        c.style.setProperty('--py', `${(ny * 6).toFixed(1)}px`);
      });
    });
    stage.addEventListener('pointerleave', resetTilt);
    matchMedia('(max-width: 700px)').addEventListener('change', layout);

    box.hidden = false;
    layout();
  })();

  /* ───────── Command palette ───────── */
  (() => {
    const dlg = $('.cmd'), input = $('#cmd-input'), list = $('#cmd-list'), empty = $('.cmd-empty');
    const isMac = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
    $$('[data-kbd]').forEach(k => { k.textContent = isMac ? '⌘ K' : 'Ctrl K'; });

    const open = url => window.open(url, '_blank', 'noopener');
    const cmds = [
      { label: 'Go to About', hint: '01', keys: 'about intro', run: () => goTo('#about') },
      { label: 'Go to Projects', hint: '02', keys: 'projects work featured', run: () => goTo('#projects') },
      { label: 'Go to Stack', hint: '03', keys: 'stack skills tools', run: () => goTo('#skills') },
      { label: 'Go to Education', hint: '04', keys: 'education school background', run: () => goTo('#background') },
      { label: 'Go to Contact', hint: '05', keys: 'contact email hire', run: () => goTo('#contact') },
      { label: 'Open GitHub', hint: '↗', keys: 'github code repos', run: () => open('https://github.com/Shnnleiogrmn') },
      { label: 'Open LinkedIn', hint: '↗', keys: 'linkedin', run: () => open('https://www.linkedin.com/in/shannalei-ogriman-2001523b6') },
      { label: 'Copy email', hint: 'clipboard', keys: 'copy email mail', run: copyEmail },
      { label: 'Theme: system', hint: 'theme', keys: 'theme appearance system auto', run: () => setMode('system') },
      { label: 'Theme: light', hint: 'theme', keys: 'theme appearance light', run: () => setMode('light') },
      { label: 'Theme: dark', hint: 'theme', keys: 'theme appearance dark', run: () => setMode('dark') },
      { label: 'Toggle sound', hint: 'sound', keys: 'sound audio mute', run: () => sound.toggle() }
    ];
    // easter egg: a tiny "terminal" command
    const secret = { label: 'sudo hire shannalei', hint: 'enter', keys: '', run: async () => { await copyEmail(); toast('permission granted — email copied. say hi.'); } };

    let shown = [], sel = 0;
    const norm = s => s.toLowerCase().replace(/^[>/\s]+/, '').trim();
    function render() {
      const q = norm(input.value);
      shown = /^sudo hire/.test(q) ? [secret] : cmds.filter(c => !q || `${c.label} ${c.keys}`.toLowerCase().includes(q));
      sel = Math.min(sel, Math.max(shown.length - 1, 0));
      list.textContent = '';
      shown.forEach((c, i) => {
        const b = document.createElement('button');
        b.type = 'button'; b.className = 'cmd-item'; b.id = `cmd-${i}`; b.tabIndex = -1; b.dataset.sfx = 'none';
        b.setAttribute('role', 'option'); b.setAttribute('aria-selected', String(i === sel));
        const s = document.createElement('span'); s.textContent = c.label;
        const h = document.createElement('small'); h.textContent = c.hint;
        b.append(s, h);
        b.addEventListener('mousemove', () => { if (sel !== i) { sel = i; mark(); } });
        b.addEventListener('click', () => run(i));
        list.append(b);
      });
      empty.hidden = shown.length > 0;
      mark();
    }
    function mark() {
      $$('.cmd-item', list).forEach((b, i) => b.setAttribute('aria-selected', String(i === sel)));
      const cur = $(`#cmd-${sel}`, list);
      if (cur) { input.setAttribute('aria-activedescendant', cur.id); cur.scrollIntoView({ block: 'nearest' }); }
      else input.removeAttribute('aria-activedescendant');
    }
    function run(i) { const c = shown[i]; if (!c) return; dlg.close(); setTimeout(c.run, 30); }
    function openPalette() {
      if (dlg.open) return;
      closeMenu(); input.value = ''; sel = 0; render();
      dlg.showModal(); sound.play('open'); input.focus();
    }
    input.addEventListener('input', () => { sel = 0; render(); });
    input.addEventListener('keydown', e => {
      if (e.key === 'ArrowDown') { e.preventDefault(); sel = (sel + 1) % Math.max(shown.length, 1); mark(); sound.play('tick'); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); sel = (sel - 1 + shown.length) % Math.max(shown.length, 1); mark(); sound.play('tick'); }
      else if (e.key === 'Enter') { e.preventDefault(); run(sel); }
    });
    dlg.addEventListener('click', e => { if (e.target === dlg) dlg.close(); });
    dlg.addEventListener('close', () => sound.play('close'));
    $$('[data-open-palette]').forEach(b => b.addEventListener('click', openPalette));
    document.addEventListener('keydown', e => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); dlg.open ? dlg.close() : openPalette(); }
    });
  })();

  /* ───────── Easter egg: type "grid" for blueprint mode ───────── */
  (() => {
    let buf = '';
    document.addEventListener('keydown', e => {
      if (e.ctrlKey || e.metaKey || e.altKey || e.key.length !== 1) return;
      if (e.target.closest('input, textarea, select, [contenteditable]') || $('.cmd').open) return;
      buf = (buf + e.key.toLowerCase()).slice(-4);
      if (buf === 'grid') {
        const on = root.classList.toggle('blueprint');
        toast(on ? 'blueprint mode on — type "grid" again to exit' : 'blueprint mode off');
        buf = '';
      }
    });
  })();
})();