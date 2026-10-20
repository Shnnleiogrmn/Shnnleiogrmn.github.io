(() => {
  const menu = document.querySelector('.menu');
  const navigation = document.getElementById('links');
  const closeMenu = () => { navigation.classList.remove('open'); menu.setAttribute('aria-expanded', 'false'); };
  menu.addEventListener('click', () => { const open = navigation.classList.toggle('open'); menu.setAttribute('aria-expanded', String(open)); });
  navigation.addEventListener('click', e => { if (e.target.closest('a')) closeMenu(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && navigation.classList.contains('open')) { closeMenu(); menu.focus(); } });
  document.addEventListener('click', e => { if (!e.target.closest('.nav')) closeMenu(); });
  matchMedia('(min-width: 861px)').addEventListener('change', closeMenu);
  const themeButton = document.querySelector('.theme');
  const system = matchMedia('(prefers-color-scheme: dark)');
  let theme = 'system';
  try { const saved = localStorage.getItem('portfolio-theme'); if (['system','light','dark'].includes(saved)) theme = saved; } catch {}
  function applyTheme() {
    document.documentElement.dataset.theme = theme === 'system' ? (system.matches ? 'dark' : 'light') : theme;
    themeButton.querySelector('span').textContent = theme[0].toUpperCase() + theme.slice(1);
    themeButton.setAttribute('aria-label', `Color theme: ${theme}. Activate to change.`);
    document.querySelector('meta[name="theme-color"]').content = document.documentElement.dataset.theme === 'dark' ? '#141414' : '#f7f7f7';
  }
  applyTheme(); system.addEventListener('change', applyTheme);
  themeButton.addEventListener('click', () => { theme = ['system','light','dark'][(['system','light','dark'].indexOf(theme)+1)%3]; try { localStorage.setItem('portfolio-theme', theme); } catch {} applyTheme(); });
  document.querySelector('.copy-email').addEventListener('click', async () => {
    const status = document.getElementById('copy-status');
    try { await navigator.clipboard.writeText('shannaleiogrmn@gmail.com'); status.textContent = 'Email copied to clipboard.'; }
    catch { status.textContent = 'Select and copy the email below, or open it in your mail app.'; }
  });
  const links = [...navigation.querySelectorAll('a')];
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => { entries.forEach(entry => { if (entry.isIntersecting) links.forEach(link => { const active = link.hash === `#${entry.target.id}`; link.classList.toggle('on', active); if (active) link.setAttribute('aria-current','location'); else link.removeAttribute('aria-current'); }); }); }, { rootMargin: '-15% 0px -65% 0px' });
    links.forEach(link => { const section = document.querySelector(link.hash); if (section) observer.observe(section); });
  }
})();
/* Small, optional interactions; the full collection remains usable without JS. */
(() => {
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const soundButton = document.querySelector('.sound');
  let soundEnabled = false, audio, lastSound = 0;
  try { soundEnabled = localStorage.getItem('portfolio-sound') === 'on'; } catch {}
  function syncSound() {
    soundButton.setAttribute('aria-pressed', String(soundEnabled));
    soundButton.setAttribute('aria-label', `${soundEnabled ? 'Disable' : 'Enable'} interface sounds`);
    soundButton.textContent = `Sound ${soundEnabled ? 'on' : 'off'}`;
  }
  function tick() {
    if (!soundEnabled || performance.now() - lastSound < 100) return;
    try {
      const Audio = window.AudioContext || window.webkitAudioContext;
      if (!Audio) return;
      audio ||= new Audio();
      if (audio.state === 'suspended') audio.resume().catch(() => {});
      const oscillator = audio.createOscillator(), gain = audio.createGain();
      oscillator.type = 'triangle'; oscillator.frequency.setValueAtTime(430, audio.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(180, audio.currentTime + .025);
      gain.gain.setValueAtTime(.012, audio.currentTime);
      gain.gain.exponentialRampToValueAtTime(.0001, audio.currentTime + .035);
      oscillator.connect(gain); gain.connect(audio.destination);
      oscillator.start(); oscillator.stop(audio.currentTime + .04); lastSound = performance.now();
    } catch { /* Audio support is optional. */ }
  }
  syncSound();
  soundButton.addEventListener('click', () => { soundEnabled = !soundEnabled; syncSound(); try { localStorage.setItem('portfolio-sound', soundEnabled ? 'on' : 'off'); } catch {} if (soundEnabled) tick(); });
  document.addEventListener('click', e => { if (e.target.closest('a,button,summary') && !e.target.closest('.sound')) tick(); });

  const spotlight = document.querySelector('.spotlight');
  const stage = spotlight.querySelector('.project-stage');
  const sources = [document.querySelector('#dialycare'), document.querySelector('#irrigation'), document.querySelector('#govassist')];
  const categories = ['Capstone · Application development', 'Hardware · Embedded system', 'Concept · AI document assistant'];
  const cards = sources.map((source, index) => {
    const card = document.createElement('article'); card.className = 'spotlight-card';
    const meta = document.createElement('div'); meta.className = 'spotlight-index';
    const category = document.createElement('span'); category.textContent = categories[index];
    const count = document.createElement('span'); count.textContent = `0${index + 1} / 03`;
    meta.append(category, count);
    const heading = document.createElement('h3'); heading.textContent = source.querySelector('h3').textContent;
    const description = document.createElement('p');
    description.textContent = index === 0 ? 'Scheduling, session updates and SMS notifications for dialysis-center staff, patients and their companions.' : source.querySelector('p').textContent;
    const badges = source.querySelector('.badges').cloneNode(true);
    // Keep the spotlight compact; the full stack is in the collection below.
    [...badges.children].slice(4).forEach(tag => tag.remove());
    const action = document.createElement('a'); action.className = 'spotlight-action'; action.href = `#${source.id}`;
    action.append('Explore project '); const arrow = document.createElement('span'); arrow.textContent = '↗'; arrow.setAttribute('aria-hidden','true'); action.append(arrow);
    if (index === 0) action.addEventListener('click', () => source.querySelector('details').open = true);
    card.append(meta,heading,description,badges,action);
    card.addEventListener('click', e => { if (card.dataset.position !== 'active') { e.preventDefault(); select(index); } });
    stage.append(card); return card;
  });
  let selected = 0;
  const dots = sources.map((source, index) => {
    const button = document.createElement('button'); button.type = 'button'; button.setAttribute('aria-label', `Show ${source.querySelector('h3').textContent}`);
    button.addEventListener('click', () => select(index)); spotlight.querySelector('.project-dots').append(button); return button;
  });
  function select(index) {
    const previous = selected; selected = (index + cards.length) % cards.length;
    cards.forEach((card, i) => {
      const offset = (i - selected + cards.length) % cards.length;
      card.dataset.position = offset === 0 ? 'active' : offset === 1 ? 'next' : 'previous';
      card.setAttribute('aria-hidden', String(offset !== 0));
      card.querySelector('a').tabIndex = offset === 0 ? 0 : -1;
      dots[i].setAttribute('aria-pressed', String(i === selected));
    });
    spotlight.querySelector('.spotlight-status').textContent = `${selected + 1} / ${cards.length} — ${sources[selected].querySelector('h3').textContent}`;
    if (previous !== selected) tick();
  }
  spotlight.querySelector('.previous').addEventListener('click', () => select(selected - 1));
  spotlight.querySelector('.next').addEventListener('click', () => select(selected + 1));
  spotlight.addEventListener('keydown', e => { if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') { e.preventDefault(); select(selected + (e.key === 'ArrowRight' ? 1 : -1)); } });
  let touchStart;
  stage.addEventListener('touchstart', e => { if (e.touches.length === 1) touchStart = {x:e.touches[0].clientX,y:e.touches[0].clientY}; }, {passive:true});
  stage.addEventListener('touchend', e => { if (!touchStart) return; const dx = e.changedTouches[0].clientX - touchStart.x, dy = e.changedTouches[0].clientY - touchStart.y; if (Math.abs(dx)>45 && Math.abs(dx)>Math.abs(dy)*1.3) select(selected + (dx<0?1:-1)); touchStart = null; }, {passive:true});
  stage.addEventListener('touchcancel', () => { touchStart = null; });
  select(0); spotlight.hidden = false;

  const dialog = document.querySelector('.command-dialog'), search = document.querySelector('#command-search'), results = document.querySelector('.command-results');
  const go = id => { dialog.close(); document.querySelector(id).scrollIntoView({behavior:reducedMotion.matches?'instant':'smooth'}); document.querySelector(id).setAttribute('tabindex','-1'); document.querySelector(id).focus({preventScroll:true}); };
  const commands = [
    ...[['Projects','#projects'],['About','#about'],['Stack','#skills'],['Education','#background'],['Contact','#contact']].map(([name,id])=>({name:`Go to ${name}`,run:()=>go(id)})),
    {name:'Open GitHub',run:()=>{dialog.close(); location.href='https://github.com/Shnnleiogrmn';}},
    {name:'Copy email',run:()=>{dialog.close(); document.querySelector('.copy-email').click(); go('#contact');}},
    {name:'Toggle theme',run:()=>document.querySelector('.theme').click()},
    {name:'Toggle sound',run:()=>soundButton.click()}
  ];
  function renderCommands() {
    results.replaceChildren(); const query = search.value.trim().toLowerCase();
    const matches = commands.filter(command=>command.name.toLowerCase().includes(query));
    if (query === '/about') matches.push({name:'> Learning by building. One project at a time.',run:()=>go('#about')});
    matches.forEach(command=>{const button=document.createElement('button');button.type='button';button.textContent=command.name;button.addEventListener('click',command.run);results.append(button);});
    document.querySelector('.command-empty').hidden = matches.length > 0;
  }
  function openCommands() { if (!dialog.open) { search.value='';renderCommands();dialog.showModal();search.focus();tick(); } }
  document.querySelectorAll('.command-open,.command-footer').forEach(button => button.addEventListener('click',openCommands));
  document.querySelector('.command-close').addEventListener('click',()=>dialog.close());
  search.addEventListener('input',renderCommands);
  dialog.addEventListener('click',e=>{if(e.target===dialog){const rect=dialog.getBoundingClientRect();if(e.clientX<rect.left||e.clientX>rect.right||e.clientY<rect.top||e.clientY>rect.bottom)dialog.close();}});
  dialog.addEventListener('keydown', e=>{const buttons=[...results.querySelectorAll('button')];if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();let index=buttons.indexOf(document.activeElement);index=(index+(e.key==='ArrowDown'?1:-1)+buttons.length)%buttons.length;buttons[index]?.focus();}if(e.key==='Enter'&&document.activeElement===search){e.preventDefault();buttons[0]?.click();}});
  document.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();if(dialog.open)dialog.close();else openCommands();}});
  if ('IntersectionObserver' in window) {
    const reveal = new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){if(!reducedMotion.matches)entry.target.classList.add('section-enter');reveal.unobserve(entry.target);}}),{threshold:.08});
    document.querySelectorAll('section').forEach(section=>reveal.observe(section));
  }
})();
