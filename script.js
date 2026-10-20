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
    document.querySelector('meta[name="theme-color"]').content = document.documentElement.dataset.theme === 'dark' ? '#171d19' : '#f7f8f5';
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
