// ============================================
// SWASTHYA YOUTH — Mood Check-in Page
// ============================================
window.MoodPage = (() => {
  let selectedMood = '';

  function render() {
    const t = I18n.t.bind(I18n);
    const moods = [
      { key: 'great', emoji: '😄' },
      { key: 'good', emoji: '😊' },
      { key: 'okay', emoji: '😐' },
      { key: 'low', emoji: '😔' },
      { key: 'bad', emoji: '😢' }
    ];

    return `
      <div class="tracker-page">
        <div class="tracker-header animate-slide-up">
          <span class="tracker-icon">😊</span>
          <h2>${t('mood.title')}</h2>
        </div>

        <div class="glass-card no-hover animate-slide-up stagger-1" style="text-align:center;">
          <p style="color:var(--text-secondary); margin-bottom:var(--space-5); font-size:var(--text-lg);">
            ${t('mood.howFeeling')}
          </p>
          <div class="emoji-selector" id="mood-selector">
            ${moods.map(m => `
              <button class="mood-emoji" data-mood="${m.key}">
                <span style="font-size:2rem;">${m.emoji}</span>
                <span class="mood-label">${t('mood.' + m.key)}</span>
              </button>
            `).join('')}
          </div>
        </div>

        <div class="glass-card no-hover mt-4 animate-slide-up stagger-2">
          <div class="form-group">
            <label class="form-label">${t('mood.addNote')}</label>
            <textarea id="mood-note" class="input" rows="3" placeholder="${t('mood.notePlaceholder')}" style="resize:none;"></textarea>
          </div>
        </div>

        <button id="mood-save" class="btn btn-primary btn-block btn-lg mt-4 animate-slide-up stagger-3">${t('mood.logMood')}</button>

        <div class="section-header mt-6 animate-slide-up stagger-4">
          <h3 class="section-title">${t('mood.weeklyMood')}</h3>
        </div>
        <div id="mood-history" class="animate-slide-up stagger-5"></div>
      </div>`;
  }

  async function mount() {
    selectedMood = '';

    // Emoji selection
    document.querySelectorAll('#mood-selector .mood-emoji').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('#mood-selector .mood-emoji').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        selectedMood = btn.dataset.mood;
      });
    });

    // Load today's data
    try {
      const history = await API.mood.history('week');
      const today = Helpers.getToday();
      const todayLog = history.find(m => m.date === today);

      if (todayLog) {
        selectedMood = todayLog.mood;
        const btn = document.querySelector(`[data-mood="${todayLog.mood}"]`);
        if (btn) btn.classList.add('selected');
        if (todayLog.note) document.getElementById('mood-note').value = todayLog.note;
      }

      // Weekly mood display
      renderWeeklyMood(history);

    } catch (err) { /* toast shown */ }

    // Save
    document.getElementById('mood-save').addEventListener('click', async () => {
      if (!selectedMood) {
        Helpers.showToast('Please select a mood', 'error');
        return;
      }
      const note = document.getElementById('mood-note').value.trim();
      try {
        await API.mood.log({ mood: selectedMood, note });
        Helpers.showToast(I18n.t('common.success'), 'success');
      } catch (err) { /* toast shown */ }
    });
  }

  function renderWeeklyMood(history) {
    const container = document.getElementById('mood-history');
    if (!container) return;
    const moodEmojis = { great: '😄', good: '😊', okay: '😐', low: '😔', bad: '😢' };
    const weekDates = Helpers.getWeekDates();
    const lang = I18n.getLang();

    const html = weekDates.map(date => {
      const log = history.find(m => m.date === date);
      const day = Helpers.formatDay(date, lang);
      const isToday = date === Helpers.getToday();
      return `
        <div class="flex items-center gap-3" style="padding: var(--space-3); border-bottom: 1px solid var(--glass-border); ${isToday ? 'background: var(--glass-bg);border-radius:var(--radius-sm);' : ''}">
          <span style="min-width:40px; font-size:var(--text-sm); color:var(--text-secondary);">${day}</span>
          <span style="font-size:1.5rem;">${log ? moodEmojis[log.mood] : '⬜'}</span>
          <span style="flex:1; font-size:var(--text-sm); color:var(--text-tertiary);">${log && log.note ? log.note : ''}</span>
        </div>`;
    }).join('');

    container.innerHTML = `<div class="glass-card no-hover" style="padding: var(--space-2);">${html}</div>`;
  }

  function unmount() { selectedMood = ''; }

  return { render, mount, unmount };
})();
