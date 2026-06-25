// ============================================
// SWASTHYA YOUTH — Events Page
// ============================================
window.EventsPage = (() => {
  let events = [];
  let registered = [];
  let activeFilter = 'all';

  function render() {
    const t = I18n.t.bind(I18n);
    return `
      <div class="events-page">
        <div class="tracker-header animate-slide-up">
          <span class="tracker-icon">🏅</span>
          <h2>${t('events.title')}</h2>
        </div>

        <div class="search-bar-container animate-slide-up stagger-1" style="margin-bottom: 1rem;">
          <input type="text" id="event-search" class="input" placeholder="${t('events.searchPlaceholder')}" style="width: 100%;">
        </div>

        <div class="tab-bar animate-slide-up stagger-2" id="event-filters">
          <button class="tab-item active" data-cat="all">${t('events.all')}</button>
          <button class="tab-item" data-cat="marathon">${t('events.marathon')}</button>
          <button class="tab-item" data-cat="yoga">${t('events.yoga')}</button>
          <button class="tab-item" data-cat="sports">${t('events.sports')}</button>
          <button class="tab-item" data-cat="campus">${t('events.campus')}</button>
        </div>

        <div id="events-list" class="events-list mt-4"></div>
      </div>`;
  }

  function renderEvents() {
    const t = I18n.t.bind(I18n);
    const lang = I18n.getLang();
    const container = document.getElementById('events-list');
    if (!container) return;

    const filtered = activeFilter === 'all' ? events : events.filter(e => e.category === activeFilter);

    if (filtered.length === 0) {
      container.innerHTML = `<div class="empty-state"><div class="empty-icon">🏅</div><p>${t('events.noEvents')}</p></div>`;
      return;
    }

    container.innerHTML = filtered.map((evt, i) => {
      const isReg = registered.includes(evt.id);
      const name = lang === 'hi' && evt.name_hi ? evt.name_hi : evt.name;
      const desc = lang === 'hi' && evt.description_hi ? evt.description_hi : evt.description;

      return `
        <div class="event-card animate-slide-up stagger-${Math.min(i+1, 8)}">
          <div class="event-header">
            <span class="event-category cat-${evt.category}">${evt.category}</span>
            <span style="font-size:var(--text-xs); color:var(--text-tertiary);">${evt.type}</span>
          </div>
          <div class="event-title">${name}</div>
          <div class="event-desc">${desc}</div>
          <div class="event-meta">
            <span>📅 ${Helpers.formatDate(evt.date, lang)}</span>
            <span>📍 ${evt.location}</span>
          </div>
          <a href="${evt.url || '#'}" target="_blank" rel="noopener noreferrer" class="btn btn-primary btn-sm mt-4" style="text-decoration: none; text-align: center;">
            ${t('events.view')}
          </a>
        </div>`;
    }).join('');

    // Link is now handled via href
  }

  async function mount() {
    // Tab filters
    document.querySelectorAll('#event-filters .tab-item').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('#event-filters .tab-item').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        activeFilter = tab.dataset.cat;
        renderEvents();
      });
    });

    const searchInput = document.getElementById('event-search');
    let searchTimeout;

    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(async () => {
          const city = e.target.value.trim();
          try {
            const evtData = await API.events.list({ city });
            events = evtData;
            renderEvents();
          } catch (err) {}
        }, 500); // debounce 500ms
      });
    }

    try {
      const [evtData, regData] = await Promise.all([
        API.events.list(),
        API.events.registered()
      ]);
      events = evtData;
      registered = regData;
      renderEvents();
    } catch (err) { /* toast shown */ }
  }

  function unmount() { events = []; registered = []; activeFilter = 'all'; }

  return { render, mount, unmount };
})();
