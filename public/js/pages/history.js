// ============================================
// SWASTHYA YOUTH — History Page
// ============================================
window.HistoryPage = (() => {
  let scrollTarget = '';

  function render() {
    const t = I18n.t.bind(I18n);
    return `
      <div class="tracker-page">
        <div class="tracker-header animate-slide-up">
          <div class="flex items-center gap-3">
            <button class="back-btn" onclick="location.hash='#/reports'">←</button>
            <div>
              <span class="tracker-icon">📋</span>
              <h2 style="display:inline;">${t('history.title')}</h2>
            </div>
          </div>
        </div>

        <div class="history-nav animate-slide-up stagger-1" id="history-nav">
          <button class="history-nav-btn active" data-target="sec-movement">🏃 ${t('reports.movementPillar')}</button>
          <button class="history-nav-btn" data-target="sec-sleep">😴 ${t('reports.sleepPillar')}</button>
          <button class="history-nav-btn" data-target="sec-nutrition">🥗 ${t('reports.nutritionPillar')}</button>
          <button class="history-nav-btn" data-target="sec-mood">😊 ${t('reports.moodPillar')}</button>
        </div>

        <!-- Movement Section -->
        <section id="sec-movement" class="history-section animate-slide-up stagger-2">
          <div class="section-header">
            <h3 class="section-title">🏃 ${t('history.movementTitle')}</h3>
            <span class="text-xs text-secondary">${t('history.last7Days')}</span>
          </div>
          <div id="hist-movement" class="history-list"></div>
        </section>

        <!-- Sleep Section -->
        <section id="sec-sleep" class="history-section animate-slide-up stagger-3">
          <div class="section-header">
            <h3 class="section-title">😴 ${t('history.sleepTitle')}</h3>
            <span class="text-xs text-secondary">${t('history.last7Days')}</span>
          </div>
          <div id="hist-sleep" class="history-list"></div>
        </section>

        <!-- Nutrition Section -->
        <section id="sec-nutrition" class="history-section animate-slide-up stagger-4">
          <div class="section-header">
            <h3 class="section-title">🥗 ${t('history.nutritionTitle')}</h3>
            <span class="text-xs text-secondary">${t('history.last7Days')}</span>
          </div>
          <div id="hist-nutrition" class="history-list"></div>
        </section>

        <!-- Mood Section -->
        <section id="sec-mood" class="history-section animate-slide-up stagger-5">
          <div class="section-header">
            <h3 class="section-title">😊 ${t('history.moodTitle')}</h3>
            <span class="text-xs text-secondary">${t('history.last7Days')}</span>
          </div>
          <div id="hist-mood" class="history-list"></div>
        </section>
      </div>`;
  }

  async function mount() {
    const t = I18n.t.bind(I18n);
    const lang = I18n.getLang();
    const today = Helpers.getToday();

    // Parse section from URL query
    const hashParts = window.location.hash.split('?');
    const params = new URLSearchParams(hashParts[1] || '');
    scrollTarget = params.get('section') || '';

    // Section nav buttons
    document.querySelectorAll('#history-nav .history-nav-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('#history-nav .history-nav-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const target = document.getElementById(btn.dataset.target);
        if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });

    // Load all 4 history sections in parallel
    const [movement, sleep, nutrition, mood] = await Promise.allSettled([
      API.movement.history('week'),
      API.sleep.history('week'),
      API.nutrition.history('week'),
      API.mood.history('week')
    ]);

    // --- MOVEMENT ---
    const movEl = document.getElementById('hist-movement');
    if (movement.status === 'fulfilled' && movEl) {
      const data = movement.value;
      const weekDates = Helpers.getWeekDates();
      if (data.length === 0) {
        movEl.innerHTML = emptyState(t('common.noData'));
      } else {
        movEl.innerHTML = weekDates.map(date => {
          const log = data.find(m => m.date === date);
          const day = Helpers.formatDay(date, lang);
          const dateLabel = Helpers.formatDate(date, lang);
          const isToday = date === today;
          if (!log) {
            return historyRow(day, dateLabel, isToday, `
              <span class="text-sm text-tertiary">${t('history.noEntry')}</span>
            `);
          }
          return historyRow(day, dateLabel, isToday, `
            <div class="hist-stats-row">
              <div class="hist-stat">
                <div class="hist-stat-val">${(log.steps || 0).toLocaleString()}</div>
                <div class="hist-stat-lbl">${t('movement.steps')}</div>
              </div>
              <div class="hist-stat">
                <div class="hist-stat-val">${log.active_minutes || 0}</div>
                <div class="hist-stat-lbl">${t('movement.activeMinutes')}</div>
              </div>
              <div class="hist-stat">
                <div class="hist-stat-val">${log.workout_duration || 0}<span class="text-xs">m</span></div>
                <div class="hist-stat-lbl">${t('movement.duration')}</div>
              </div>
            </div>
            ${log.workout_type ? `<div class="hist-tag">${log.workout_type}</div>` : ''}
          `);
        }).join('');
      }
    }

    // --- SLEEP ---
    const slpEl = document.getElementById('hist-sleep');
    if (sleep.status === 'fulfilled' && slpEl) {
      const data = sleep.value;
      const weekDates = Helpers.getWeekDates();
      const qualityLabels = t('sleep.qualityLabels');
      if (data.length === 0) {
        slpEl.innerHTML = emptyState(t('common.noData'));
      } else {
        slpEl.innerHTML = weekDates.map(date => {
          const log = data.find(s => s.date === date);
          const day = Helpers.formatDay(date, lang);
          const dateLabel = Helpers.formatDate(date, lang);
          const isToday = date === today;
          if (!log) {
            return historyRow(day, dateLabel, isToday, `
              <span class="text-sm text-tertiary">${t('history.noEntry')}</span>
            `);
          }
          const qualityText = Array.isArray(qualityLabels) && log.quality
            ? qualityLabels[log.quality - 1] || ''
            : `${log.quality || 0}/5`;
          const stars = '⭐'.repeat(log.quality || 0);
          return historyRow(day, dateLabel, isToday, `
            <div class="hist-stats-row">
              <div class="hist-stat">
                <div class="hist-stat-val">${Helpers.formatDuration(log.duration_hours)}</div>
                <div class="hist-stat-lbl">${t('sleep.duration')}</div>
              </div>
              <div class="hist-stat">
                <div class="hist-stat-val" style="font-size:var(--text-sm);">${log.bedtime || '--'}</div>
                <div class="hist-stat-lbl">${t('sleep.bedtime')}</div>
              </div>
              <div class="hist-stat">
                <div class="hist-stat-val" style="font-size:var(--text-sm);">${log.wake_time || '--'}</div>
                <div class="hist-stat-lbl">${t('sleep.wakeTime')}</div>
              </div>
            </div>
            <div class="hist-quality">${stars} <span class="text-xs text-secondary">${qualityText}</span></div>
          `);
        }).join('');
      }
    }

    // --- NUTRITION ---
    const nutEl = document.getElementById('hist-nutrition');
    if (nutrition.status === 'fulfilled' && nutEl) {
      const data = nutrition.value;
      const weekDates = Helpers.getWeekDates();
      if (data.length === 0) {
        nutEl.innerHTML = emptyState(t('common.noData'));
      } else {
        nutEl.innerHTML = weekDates.map(date => {
          const log = data.find(n => n.date === date);
          const day = Helpers.formatDay(date, lang);
          const dateLabel = Helpers.formatDate(date, lang);
          const isToday = date === today;
          if (!log) {
            return historyRow(day, dateLabel, isToday, `
              <span class="text-sm text-tertiary">${t('history.noEntry')}</span>
            `);
          }
          const mealsEaten = (log.breakfast || 0) + (log.lunch || 0) + (log.snacks || 0) + (log.dinner || 0);
          const mealCheck = (eaten) => eaten ? '✅' : '<span style="opacity:0.3;">❌</span>';
          const notes = [
            log.breakfast && log.breakfast_note ? `🥣 ${log.breakfast_note}` : '',
            log.lunch && log.lunch_note ? `🍛 ${log.lunch_note}` : '',
            log.snacks && log.snacks_note ? `🍎 ${log.snacks_note}` : '',
            log.dinner && log.dinner_note ? `🍽️ ${log.dinner_note}` : '',
          ].filter(Boolean);
          return historyRow(day, dateLabel, isToday, `
            <div class="hist-meals-grid">
              <div class="hist-meal">${mealCheck(log.breakfast)}<span>${t('nutrition.breakfast')}</span></div>
              <div class="hist-meal">${mealCheck(log.lunch)}<span>${t('nutrition.lunch')}</span></div>
              <div class="hist-meal">${mealCheck(log.snacks)}<span>${t('nutrition.snacks')}</span></div>
              <div class="hist-meal">${mealCheck(log.dinner)}<span>${t('nutrition.dinner')}</span></div>
            </div>
            <div class="flex items-center justify-between" style="margin-top:var(--space-2);">
              <span class="text-xs text-secondary">${mealsEaten}/4 ${t('history.mealsEaten')}</span>
              <span class="text-xs text-secondary">💧 ${log.water_glasses || 0} ${t('nutrition.glasses')}</span>
            </div>
            ${notes.length > 0 ? `
              <div style="margin-top:var(--space-2); padding-top:var(--space-2); border-top:1px solid var(--glass-border);">
                ${notes.map(n => `<div class="text-xs text-tertiary" style="line-height:1.6;">${n}</div>`).join('')}
              </div>` : ''}
          `);
        }).join('');
      }
    }

    // --- MOOD ---
    const moodEl = document.getElementById('hist-mood');
    if (mood.status === 'fulfilled' && moodEl) {
      const data = mood.value;
      const weekDates = Helpers.getWeekDates();
      const moodEmojis = { great: '😄', good: '😊', okay: '😐', low: '😔', bad: '😢' };
      if (data.length === 0) {
        moodEl.innerHTML = emptyState(t('common.noData'));
      } else {
        moodEl.innerHTML = weekDates.map(date => {
          const log = data.find(m => m.date === date);
          const day = Helpers.formatDay(date, lang);
          const dateLabel = Helpers.formatDate(date, lang);
          const isToday = date === today;
          if (!log) {
            return historyRow(day, dateLabel, isToday, `
              <span class="text-sm text-tertiary">${t('history.noEntry')}</span>
            `);
          }
          return historyRow(day, dateLabel, isToday, `
            <div class="flex items-center gap-3">
              <span style="font-size:2rem;">${moodEmojis[log.mood] || '😐'}</span>
              <div>
                <div style="font-weight:600; font-size:var(--text-sm); text-transform:capitalize;">${t('mood.' + log.mood)}</div>
                ${log.note ? `<div class="text-xs text-secondary" style="margin-top:2px;">${log.note}</div>` : ''}
              </div>
            </div>
          `);
        }).join('');
      }
    }

    // Scroll to target section if coming from reports
    if (scrollTarget) {
      setTimeout(() => {
        const el = document.getElementById('sec-' + scrollTarget);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        // Highlight the matching nav button
        document.querySelectorAll('#history-nav .history-nav-btn').forEach(b => {
          b.classList.toggle('active', b.dataset.target === 'sec-' + scrollTarget);
        });
      }, 300);
    }
  }

  // --- Helpers ---
  function historyRow(day, dateLabel, isToday, content) {
    return `
      <div class="glass-card no-hover hist-row ${isToday ? 'hist-today' : ''}">
        <div class="hist-row-header">
          <div>
            <span class="hist-day">${day}</span>
            <span class="hist-date">${dateLabel}</span>
            ${isToday ? '<span class="hist-today-badge">Today</span>' : ''}
          </div>
        </div>
        <div class="hist-row-body">${content}</div>
      </div>`;
  }

  function emptyState(msg) {
    return `<div class="empty-state"><div class="empty-icon">📋</div><p>${msg}</p></div>`;
  }

  function unmount() { scrollTarget = ''; }

  return { render, mount, unmount };
})();
