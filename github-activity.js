/* Shared validation is used by the browser, data-refresh script and offline tests. */
(function (root) {
  'use strict';
  const DAY = 86400000, CACHE_TTL = 3600000, STALE_AFTER = 48 * 3600000;
  const LEVELS = ['NONE', 'FIRST_QUARTILE', 'SECOND_QUARTILE', 'THIRD_QUARTILE', 'FOURTH_QUARTILE'];
  function dateValue(date) {
    if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error('Invalid contribution date');
    const value = Date.parse(`${date}T00:00:00Z`);
    if (!Number.isFinite(value) || new Date(value).toISOString().slice(0,10) !== date) throw new Error('Invalid contribution date');
    return value;
  }
  function contributionLevel(level) {
    const value = LEVELS.indexOf(level);
    if (value < 0) throw new Error('Invalid contribution intensity');
    return value;
  }
  function validateData(data) {
    if (!data || data.schemaVersion !== 1 || data.username !== 'shnnleiogrmn') throw new Error('Invalid activity data');
    if (typeof data.generatedAt !== 'string' || !Number.isFinite(Date.parse(data.generatedAt))) throw new Error('Missing refresh timestamp');
    if (new Date(data.generatedAt).toISOString().slice(0,10) !== data.windowEnd) throw new Error('Activity window and refresh date disagree');
    const start = dateValue(data.windowStart), end = dateValue(data.windowEnd);
    if (end - start !== 364 * DAY || !Array.isArray(data.days) || data.days.length !== 365) throw new Error('Expected a complete 365-day window');
    let total = 0;
    const days = data.days.map((day, index) => {
      if (dateValue(day.date) !== start + index * DAY || !Number.isSafeInteger(day.count) || day.count < 0 || !Number.isInteger(day.level) || day.level < 0 || day.level > 4 || (day.count === 0) !== (day.level === 0)) throw new Error('Invalid daily contribution');
      total += day.count; return { date: day.date, count: day.count, level: day.level };
    });
    if (!Number.isSafeInteger(data.totalContributions) || data.totalContributions !== total) throw new Error('Contribution total mismatch');
    if (!Array.isArray(data.repositories)) throw new Error('Invalid repositories');
    const repositories = data.repositories.filter(repo => {
      try { const url = new URL(repo.url); return typeof repo.name === 'string' && repo.name.length > 0 && repo.name.length <= 100 && url.protocol === 'https:' && url.hostname === 'github.com' && !url.username && !url.password && url.pathname.toLowerCase() === `/shnnleiogrmn/${repo.name.toLowerCase()}` && Number.isFinite(Date.parse(repo.updatedAt)); } catch { return false; }
    }).slice(0,4).map(repo => ({ name: repo.name, url: repo.url, description: String(repo.description || '').slice(0,500), language: String(repo.language || '').slice(0,100), updatedAt: repo.updatedAt }));
    return { schemaVersion: 1, username: data.username, generatedAt: data.generatedAt, windowStart: data.windowStart, windowEnd: data.windowEnd, totalContributions: total, days, repositories };
  }
  function calendarWeeks(days) {
    const padding = new Date(dateValue(days[0].date)).getUTCDay();
    const cells = [...Array(padding).fill(null), ...days];
    while (cells.length % 7) cells.push(null);
    return Array.from({ length: cells.length / 7 }, (_, week) => cells.slice(week * 7, week * 7 + 7));
  }
  function isStale(data, now = Date.now()) { return now - Date.parse(data.generatedAt) > STALE_AFTER; }
  function readCache(raw, now = Date.now()) {
    try { const cache = JSON.parse(raw); if (!Number.isFinite(cache.cachedAt) || cache.cachedAt > now) return null; return { data: validateData(cache.data), fresh: now - cache.cachedAt < CACHE_TTL }; } catch { return null; }
  }
  async function loadActivity({ source, rawCache, fetcher = fetch, now = Date.now(), timeout = 8000 }) {
    const cache = readCache(rawCache, now);
    if (cache?.fresh) return { data: cache.data, cached: true, offline: false };
    const controller = new AbortController(), timer = setTimeout(() => controller.abort(), timeout);
    try {
      const response = await fetcher(source, { signal: controller.signal, cache: 'no-cache', credentials: 'omit' });
      if (!response.ok) throw new Error('Activity request failed');
      const data = validateData(await response.json());
      if (Date.parse(data.generatedAt) > now + 300000) throw new Error('Invalid future refresh timestamp');
      return { data, cached: false, offline: false };
    } catch (error) { if (cache) return { data: cache.data, cached: true, offline: true }; throw error; }
    finally { clearTimeout(timer); }
  }
  function renderActivity(container, data) {
    const doc = container.ownerDocument, calendar = container.querySelector('.contribution-calendar');
    calendar.replaceChildren();
    const weeks = calendarWeeks(data.days), columns = weeks.length;
    calendar.style.setProperty('--weeks', columns);
    calendar.setAttribute('aria-rowcount','8'); calendar.setAttribute('aria-colcount',String(columns+1));
    const monthRow = doc.createElement('div'); monthRow.className = 'calendar-row'; monthRow.setAttribute('role','row');
    const blank = doc.createElement('span'); blank.setAttribute('role','columnheader'); blank.setAttribute('aria-label','Weekday'); monthRow.append(blank);
    let previousMonth;
    weeks.forEach((week, index) => {
      const date = week.find(Boolean)?.date; const month = date?.slice(0,7);
      const label = doc.createElement('span'); label.className = 'calendar-month'; label.setAttribute('role','columnheader');
      if (month && month !== previousMonth) label.textContent = new Date(`${date}T12:00:00Z`).toLocaleDateString('en',{month:'short',timeZone:'UTC'});
      label.style.gridColumn = index + 2; monthRow.append(label); previousMonth = month;
    });
    calendar.append(monthRow);
    const buttons = new Map();
    const announce = day => `${new Date(`${day.date}T12:00:00Z`).toLocaleDateString('en',{month:'short',day:'numeric',year:'numeric',timeZone:'UTC'})} — ${day.count} contribution${day.count === 1 ? '' : 's'}`;
    for (let weekday = 0; weekday < 7; weekday++) {
      const row = doc.createElement('div'); row.className = 'calendar-row'; row.setAttribute('role','row');
      const label = doc.createElement('span'); label.className = 'calendar-label'; label.setAttribute('role','rowheader'); label.textContent = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][weekday]; row.append(label);
      weeks.forEach(week => {
        const cell = doc.createElement('span'); cell.setAttribute('role','gridcell'); const day = week[weekday];
        if (day) {
          const button = doc.createElement('button'); button.type = 'button'; button.className = 'calendar-cell'; button.dataset.level = day.level;
          button.setAttribute('aria-label', announce(day)); button.title = announce(day); button.tabIndex = day.date === data.windowEnd ? 0 : -1;
          const show = () => { container.querySelector('.calendar-tooltip').textContent = announce(day); };
          button.addEventListener('mouseenter',show); button.addEventListener('focus',() => { buttons.forEach(item => item.tabIndex = item === button ? 0 : -1); show(); });
          button.addEventListener('click',show);
          button.addEventListener('keydown',event => {
            const index = Math.round((dateValue(day.date) - dateValue(data.windowStart)) / DAY);
            const shifts = { ArrowLeft: -7, ArrowRight: 7, ArrowUp: -1, ArrowDown: 1 };
            let next = event.key === 'Home' ? 0 : event.key === 'End' ? 364 : event.key in shifts ? Math.max(0,Math.min(364,index + shifts[event.key])) : null;
            if (next !== null) { event.preventDefault(); buttons.get(data.days[next].date)?.focus(); }
          });
          buttons.set(day.date,button); cell.append(button);
        } else cell.className = 'calendar-padding';
        row.append(cell);
      }); calendar.append(row);
    }
    container.querySelector('.contribution-total').textContent = `${data.totalContributions.toLocaleString()} contributions in the last 365 days`;
    container.querySelector('.activity-updated').textContent = `Updated ${new Date(data.generatedAt).toLocaleString()}`;
    const list = container.querySelector('.repository-list'); list.replaceChildren();
    data.repositories.forEach(repo => {
      const article = doc.createElement('article'); article.className = 'repository';
      const link = doc.createElement('a'); link.href = repo.url; link.target = '_blank'; link.rel = 'noopener noreferrer'; link.textContent = `${repo.name} ↗`;
      const description = doc.createElement('p'); description.textContent = repo.description;
      const meta = doc.createElement('small'); meta.textContent = `${repo.language ? `${repo.language} / ` : ''}Updated ${new Date(repo.updatedAt).toLocaleDateString()}`;
      article.append(link,description,meta); list.append(article);
    });
    if (!data.repositories.length) { const empty = doc.createElement('p'); empty.textContent = 'No public repositories available in this refresh.'; list.append(empty); }
    container.querySelector('.activity-content').hidden = false;
  }
  function initializeActivity(document) {
    const container = document.querySelector('#github-activity'); if (!container) return;
    const cacheKey = `portfolio-github-activity-v1:${container.dataset.source}`;
    async function load() {
      const status = container.querySelector('.activity-status'); status.textContent = 'Loading public GitHub activity…';
      let rawCache; try { rawCache = sessionStorage.getItem(cacheKey); } catch {}
      try {
        const result = await loadActivity({ source: container.dataset.source, rawCache });
        renderActivity(container,result.data);
        if (!result.cached) { try { sessionStorage.setItem(cacheKey,JSON.stringify({cachedAt:Date.now(),data:result.data})); } catch {} }
        status.textContent = result.offline ? `Showing the last available refresh. Live activity is temporarily unavailable.${isStale(result.data) ? ' This snapshot is over 48 hours old.' : ''}` : isStale(result.data) ? 'This activity snapshot is over 48 hours old. A fresh update is pending.' : 'Public activity from GitHub. Refreshed daily; not a real-time feed.';
      } catch { status.textContent = 'GitHub activity is temporarily unavailable or has not been refreshed yet. You can still explore my profile using the link above.'; }
    }
    if ('IntersectionObserver' in root) { const observer = new IntersectionObserver(entries => { if (entries.some(entry => entry.isIntersecting)) { observer.disconnect(); load(); } },{rootMargin:'300px'}); observer.observe(container); } else load();
  }
  const api = { DAY, CACHE_TTL, STALE_AFTER, dateValue, contributionLevel, validateData, calendarWeeks, isStale, readCache, loadActivity, renderActivity, initializeActivity };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else initializeActivity(root.document);
})(typeof window === 'undefined' ? globalThis : window);
