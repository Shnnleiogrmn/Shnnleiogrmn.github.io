(() => {
  'use strict';
  const $ = selector => document.querySelector(selector);
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const read = (key, fallback) => { try { return localStorage.getItem(key) ?? fallback; } catch { return fallback; } };
  const save = (key, value) => { try { localStorage.setItem(key, value); } catch {} };
  const preferences = {
    theme: ['light', 'dark', 'system'].includes(read('portfolio-theme', 'system')) ? read('portfolio-theme', 'system') : 'system',
    sound: read('portfolio-sound', 'off') === 'on',
    volume: Math.max(0, Math.min(100, Number(read('portfolio-volume', '70')) || 0))
  };
  const systemTheme = matchMedia('(prefers-color-scheme: dark)');
  const themeButton = $('.theme'), soundButton = $('.sound'), volume = $('#sound-volume');
  let audio, lastSound = -Infinity;

  // Deliberate interactions only. A short noise transient provides the tactile click;
  // a quiet oscillator adds body rather than a sustained notification tone.
  function playSound(kind = 'click') {
    if (!preferences.sound || !preferences.volume || performance.now() - lastSound < 85) return;
    const Audio = window.AudioContext || window.webkitAudioContext;
    if (!Audio) return;
    try {
      audio ||= new Audio();
      if (audio.state === 'suspended') audio.resume().catch(() => {});
      const now = audio.currentTime;
      const profiles = { click: [900, .045], select: [1200, .055], switch: [650, .06], open: [1450, .05], copy: [1700, .065], success: [1900, .08] };
      const [frequency, length] = profiles[kind] || profiles.click;
      const buffer = audio.createBuffer(1, Math.ceil(audio.sampleRate * length), audio.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (audio.sampleRate * .009));
      const noise = audio.createBufferSource(), filter = audio.createBiquadFilter(), gain = audio.createGain();
      noise.buffer = buffer; filter.type = 'highpass'; filter.frequency.value = frequency;
      gain.gain.setValueAtTime(.23 * preferences.volume / 100, now);
      gain.gain.exponentialRampToValueAtTime(.0001, now + length);
      noise.connect(filter); filter.connect(gain); gain.connect(audio.destination); noise.start(now); noise.stop(now + length);
      const body = audio.createOscillator(), bodyGain = audio.createGain();
      body.type = 'triangle'; body.frequency.setValueAtTime(frequency / 2, now); body.frequency.exponentialRampToValueAtTime(150, now + .025);
      bodyGain.gain.setValueAtTime(.055 * preferences.volume / 100, now); bodyGain.gain.exponentialRampToValueAtTime(.0001, now + .035);
      body.connect(bodyGain); bodyGain.connect(audio.destination); body.start(now); body.stop(now + .04);
      noise.onended = () => { noise.disconnect(); filter.disconnect(); gain.disconnect(); };
      body.onended = () => { body.disconnect(); bodyGain.disconnect(); };
      lastSound = performance.now();
    } catch { /* Unsupported or unavailable audio never blocks navigation. */ }
  }
  document.addEventListener('portfolio:sound', event => playSound(event.detail));
  function syncPreferences() {
    const dark = preferences.theme === 'dark' || preferences.theme === 'system' && systemTheme.matches;
    document.documentElement.dataset.theme = dark ? 'dark' : 'light';
    themeButton.querySelector('span').textContent = preferences.theme[0].toUpperCase() + preferences.theme.slice(1);
    themeButton.setAttribute('aria-label', `Color theme: ${preferences.theme}. Activate to change.`);
    $('meta[name="theme-color"]').content = dark ? '#141414' : '#f8f7f4';
    soundButton.setAttribute('aria-pressed', String(preferences.sound));
    soundButton.setAttribute('aria-label', `${preferences.sound ? 'Disable' : 'Enable'} interface sounds`);
    soundButton.textContent = `Sound ${preferences.sound ? 'on' : 'off'}`;
    volume.value = preferences.volume;
    $('#volume-value').value = `${preferences.volume}%`;
    $('.footer-status').textContent = `THEME: ${preferences.theme.toUpperCase()} / SOUND: ${preferences.sound ? 'ON' : 'OFF'}`;
  }
  syncPreferences();
  systemTheme.addEventListener('change', syncPreferences);
  themeButton.addEventListener('click', () => {
    const modes = ['system', 'light', 'dark']; preferences.theme = modes[(modes.indexOf(preferences.theme) + 1) % modes.length];
    save('portfolio-theme', preferences.theme); syncPreferences(); playSound('switch');
  });
  soundButton.addEventListener('click', () => { preferences.sound = !preferences.sound; save('portfolio-sound', preferences.sound ? 'on' : 'off'); syncPreferences(); playSound('switch'); });
  volume.addEventListener('input', () => { preferences.volume = Number(volume.value); $('#volume-value').value = `${preferences.volume}%`; save('portfolio-volume', preferences.volume); });
  volume.addEventListener('change', () => playSound('select'));
  document.addEventListener('click', event => {
    if (event.target.closest('a,button,summary') && !event.target.closest('.theme,.sound,.copy-email,.project-dots,.previous,.next,.command-open,.command-footer,.command-close,.communication-buttons,.command-results,.send-message')) playSound();
  });
  $('#current-year').textContent = new Date().getFullYear();

  const menu = $('.menu'), navigation = $('#links');
  function closeMenu() { navigation.classList.remove('open'); menu.setAttribute('aria-expanded', 'false'); }
  menu.addEventListener('click', () => menu.setAttribute('aria-expanded', String(navigation.classList.toggle('open'))));
  navigation.addEventListener('click', event => { if (event.target.closest('a')) closeMenu(); });
  document.addEventListener('click', event => { if (!event.target.closest('.nav')) closeMenu(); });
  document.addEventListener('keydown', event => { if (event.key === 'Escape' && navigation.classList.contains('open')) { closeMenu(); menu.focus(); } });
  matchMedia('(min-width: 861px)').addEventListener('change', closeMenu);
  const navLinks = [...navigation.querySelectorAll('a')];
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => { if (entry.isIntersecting) navLinks.forEach(link => {
        const active = link.hash === `#${entry.target.id}`;
        link.classList.toggle('on', active);
        if (active) link.setAttribute('aria-current', 'location'); else link.removeAttribute('aria-current');
      }); });
    }, { rootMargin: '-15% 0px -65% 0px' });
    navLinks.forEach(link => observer.observe($(link.hash)));
    const reveal = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) { if (!reducedMotion.matches) entry.target.classList.add('section-enter'); reveal.unobserve(entry.target); }
    }), { threshold: .08 });
    document.querySelectorAll('section').forEach(section => reveal.observe(section));
  }
  let copyReset;
  $('.copy-email').addEventListener('click', async () => {
    clearTimeout(copyReset);
    try {
      await navigator.clipboard.writeText('shannaleiogrmn@gmail.com');
      $('.copy-email').textContent = 'Copied ✓'; $('#copy-status').textContent = 'Email copied to clipboard.'; playSound('copy');
      copyReset = setTimeout(() => { $('.copy-email').textContent = 'Copy'; $('#copy-status').textContent = ''; }, 2200);
    } catch { $('#copy-status').textContent = 'Select and copy the email above, or open it in your mail app.'; }
  });

  function bindCommunicationDemo(root) {
    root.querySelectorAll('[data-word]').forEach(button => button.addEventListener('click', () => {
      root.querySelectorAll('[data-word]').forEach(choice => choice.setAttribute('aria-pressed', String(choice === button)));
      root.querySelector('.demo-output').textContent = `Spoken output: “${button.dataset.word}.”`;
      playSound('select');
    }));
  }
  bindCommunicationDemo($('#neurocomm'));
  const spotlight = $('.spotlight'), stage = $('.project-stage');
  const sources = ['#dialycare', '#irrigation', '#neurocomm'].map($);
  const cards = sources.map((source, index) => {
    const card = document.createElement('article'); card.className = 'spotlight-card';
    const meta = document.createElement('div'); meta.className = 'spotlight-index';
    const category = document.createElement('span'); category.textContent = source.dataset.category;
    const count = document.createElement('span'); count.textContent = `0${index + 1} / 03`; meta.append(category, count);
    const heading = document.createElement('h3'); heading.textContent = source.querySelector('h3').textContent;
    const status = document.createElement('span'); status.className = 'status'; status.textContent = source.dataset.status;
    const description = document.createElement('p'); description.textContent = index === 0 ? 'Scheduling, session updates and SMS notifications for dialysis-center staff, patients and their companions.' : source.querySelector('.project-description').textContent;
    card.append(meta, heading, status, description);
    const badges = source.querySelector('.badges');
    if (badges) { const clone = badges.cloneNode(true); [...clone.children].slice(4).forEach(tag => tag.remove()); card.append(clone); }
    const demo = source.querySelector('.communication-demo');
    if (demo) { const clone = demo.cloneNode(true); clone.querySelectorAll('[data-word]').forEach(button => button.setAttribute('aria-pressed', 'false')); card.append(clone); bindCommunicationDemo(clone); }
    const action = document.createElement('a'); action.className = 'spotlight-action'; action.href = `#${source.id}`;
    action.append('View project '); const arrow = document.createElement('span'); arrow.textContent = '↗'; arrow.setAttribute('aria-hidden', 'true'); action.append(arrow);
    action.addEventListener('click', () => { const details = source.querySelector('details'); if (details) details.open = true; });
    card.append(action);
    card.addEventListener('click', event => { if (card.dataset.position !== 'active') { event.preventDefault(); select(index); } });
    stage.append(card); return card;
  });
  let selected = 0;
  const dots = sources.map((source, index) => {
    const button = document.createElement('button'); button.type = 'button'; button.setAttribute('aria-label', `Show ${source.querySelector('h3').textContent}`);
    button.addEventListener('click', () => select(index)); $('.project-dots').append(button); return button;
  });
  function select(index) {
    const previous = selected; selected = (index + cards.length) % cards.length;
    cards.forEach((card, i) => {
      const offset = (i - selected + cards.length) % cards.length;
      card.dataset.position = offset === 0 ? 'active' : offset === 1 ? 'next' : 'previous';
      card.setAttribute('aria-hidden', String(offset !== 0));
      card.querySelectorAll('a,button').forEach(control => control.tabIndex = offset === 0 ? 0 : -1);
      dots[i].setAttribute('aria-pressed', String(i === selected));
    });
    $('.spotlight-status').textContent = `${selected + 1} / ${cards.length} — ${sources[selected].querySelector('h3').textContent}`;
    if (previous !== selected) playSound('select');
  }
  $('.previous').addEventListener('click', () => select(selected - 1));
  $('.next').addEventListener('click', () => select(selected + 1));
  spotlight.addEventListener('keydown', event => {
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') { event.preventDefault(); stage.focus(); select(selected + (event.key === 'ArrowRight' ? 1 : -1)); }
  });
  let touchStart;
  stage.addEventListener('touchstart', event => { if (event.touches.length === 1) touchStart = { x: event.touches[0].clientX, y: event.touches[0].clientY }; }, { passive: true });
  stage.addEventListener('touchend', event => {
    if (!touchStart) return;
    const dx = event.changedTouches[0].clientX - touchStart.x, dy = event.changedTouches[0].clientY - touchStart.y;
    if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.3) select(selected + (dx < 0 ? 1 : -1));
    touchStart = null;
  }, { passive: true });
  stage.addEventListener('touchcancel', () => { touchStart = null; });
  select(0); spotlight.hidden = false;

  const dialog = $('.command-dialog'), search = $('#command-search'), results = $('.command-results');
  const go = id => {
    dialog.close(); const target = $(id); target.scrollIntoView({ behavior: reducedMotion.matches ? 'instant' : 'smooth' });
    target.setAttribute('tabindex', '-1'); target.focus({ preventScroll: true });
  };
  const commands = [
    ...[['Projects', '#projects'], ['About', '#about'], ['Stack', '#skills'], ['Education', '#background'], ['Contact', '#contact']].map(([name, id]) => ({ group: 'Navigation', name, run: () => go(id) })),
    { group: 'Actions', name: 'Toggle theme', run: () => themeButton.click() },
    { group: 'Actions', name: 'Toggle sound', run: () => soundButton.click() },
    { group: 'Actions', name: 'Copy email', run: () => { go('#contact'); $('.copy-email').click(); } },
    ...[...$('.clist').querySelectorAll('a')].map(link => ({ group: 'Links', name: link.querySelector('span').textContent, run: () => { window.open(link.href, '_blank', 'noopener,noreferrer'); dialog.close(); } }))
  ];
  function renderCommands() {
    results.replaceChildren(); const query = search.value.trim().toLowerCase();
    const matches = commands.filter(command => `${command.group} ${command.name}`.toLowerCase().includes(query));
    if (query === '/about') matches.push({ group: 'Terminal', name: '> Learning by building. One project at a time.', run: () => go('#about') });
    let group;
    matches.forEach(command => {
      if (group !== command.group) { group = command.group; const label = document.createElement('p'); label.className = 'command-group'; label.textContent = group; results.append(label); }
      const button = document.createElement('button'); button.type = 'button'; button.textContent = command.name; button.addEventListener('click', command.run); results.append(button);
    });
    $('.command-empty').hidden = matches.length > 0;
  }
  function openCommands() { if (!dialog.open) { search.value = ''; renderCommands(); dialog.showModal(); search.focus(); playSound('open'); } }
  document.querySelectorAll('.command-open,.command-footer').forEach(button => button.addEventListener('click', openCommands));
  $('.command-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => playSound('open'));
  search.addEventListener('input', renderCommands);
  dialog.addEventListener('click', event => {
    if (event.target === dialog) { const rect = dialog.getBoundingClientRect(); if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close(); }
  });
  dialog.addEventListener('keydown', event => {
    const buttons = [...results.querySelectorAll('button')];
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      if (event.target === volume) return;
      event.preventDefault(); const index = buttons.indexOf(document.activeElement);
      const next = index === -1 ? (event.key === 'ArrowDown' ? 0 : buttons.length - 1) : (index + (event.key === 'ArrowDown' ? 1 : -1) + buttons.length) % buttons.length;
      buttons[next]?.focus();
    }
    if (event.key === 'Enter' && document.activeElement === search) { event.preventDefault(); buttons[0]?.click(); }
  });
  document.addEventListener('keydown', event => { if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); if (dialog.open) dialog.close(); else openCommands(); } });
})();
