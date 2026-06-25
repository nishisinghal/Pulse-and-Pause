// ============================================
// SWASTHYA YOUTH — Reports Page
// ============================================
window.ReportsPage = (() => {
  let currentRange = 'week';

  function render() {
    const t = I18n.t.bind(I18n);
    return `
      <div class="reports-page">
        <div class="tracker-header animate-slide-up">
          <span class="tracker-icon">📊</span>
          <h2>${t('reports.title')}</h2>
        </div>

        <div class="tab-bar animate-slide-up stagger-1" id="report-range">
          <button class="tab-item active" data-range="week">${t('reports.weekly')}</button>
          <button class="tab-item" data-range="month">${t('reports.monthly')}</button>
        </div>

        <div class="glass-card no-hover report-overview mt-4 animate-slide-up stagger-2">
          <div class="report-score" id="rpt-consistency">--</div>
          <div class="report-score-label">${t('reports.overview')}</div>
          <div class="flex justify-center gap-6 mt-4">
            <div style="text-align:center;">
              <div style="font-size:var(--text-lg);font-weight:700;color:var(--primary);" id="rpt-active">0</div>
              <div style="font-size:var(--text-xs);color:var(--text-secondary);">${t('reports.activeDays')}</div>
            </div>
            <div style="text-align:center;">
              <div style="font-size:var(--text-lg);font-weight:700;color:var(--accent);" id="rpt-rest">0</div>
              <div style="font-size:var(--text-xs);color:var(--text-secondary);">${t('reports.restDays')}</div>
            </div>
          </div>
        </div>

        <div class="section-header mt-6 animate-slide-up stagger-3">
          <h3 class="section-title">${t('reports.pillars')}</h3>
          <span class="text-sm text-secondary" style="cursor:pointer;" onclick="location.hash='#/history'">${t('reports.viewHistory')} →</span>
        </div>

        <div class="pillar-cards mt-2" id="pillar-cards">
          <div class="pillar-card clickable animate-slide-up stagger-3" data-section="movement">
            <div class="pillar-header">
              <div class="pillar-name">🏃 ${t('reports.movementPillar')}</div>
              <div class="pillar-score" id="rpt-steps">--</div>
            </div>
            <div class="flex items-center justify-between">
              <div class="text-sm text-secondary">${t('reports.avgSteps')}</div>
              <div class="text-xs text-tertiary">${t('reports.tapHistory')}</div>
            </div>
          </div>
          <div class="pillar-card clickable animate-slide-up stagger-4" data-section="sleep">
            <div class="pillar-header">
              <div class="pillar-name">😴 ${t('reports.sleepPillar')}</div>
              <div class="pillar-score" id="rpt-sleep">--</div>
            </div>
            <div class="flex items-center justify-between">
              <div class="text-sm text-secondary">${t('reports.avgSleep')}</div>
              <div class="text-xs text-tertiary">${t('reports.tapHistory')}</div>
            </div>
          </div>
          <div class="pillar-card clickable animate-slide-up stagger-5" data-section="nutrition">
            <div class="pillar-header">
              <div class="pillar-name">🥗 ${t('reports.nutritionPillar')}</div>
              <div class="pillar-score" id="rpt-meals">--</div>
            </div>
            <div class="flex items-center justify-between">
              <div class="text-sm text-secondary">${t('reports.mealScore')}</div>
              <div class="text-xs text-tertiary">${t('reports.tapHistory')}</div>
            </div>
          </div>
          <div class="pillar-card clickable animate-slide-up stagger-6" data-section="mood">
            <div class="pillar-header">
              <div class="pillar-name">😊 ${t('reports.moodPillar')}</div>
            </div>
            <div class="flex items-center justify-between">
              <div class="mood-distribution" id="rpt-mood-dist"></div>
              <div class="text-xs text-tertiary">${t('reports.tapHistory')}</div>
            </div>
          </div>
        </div>
      </div>`;
  }

  async function loadReport(range) {
    try {
      const report = await API.reports.get(range);

      const el = document.getElementById('rpt-consistency');
      if (el) el.textContent = `${report.consistency}%`;

      const activeEl = document.getElementById('rpt-active');
      if (activeEl) activeEl.textContent = report.active_days;

      const restEl = document.getElementById('rpt-rest');
      if (restEl) restEl.textContent = report.rest_days;

      const stepsEl = document.getElementById('rpt-steps');
      if (stepsEl) stepsEl.textContent = report.movement.avg_steps.toLocaleString();

      const sleepEl = document.getElementById('rpt-sleep');
      if (sleepEl) sleepEl.textContent = `${report.sleep.avg_hours}h`;

      const mealsEl = document.getElementById('rpt-meals');
      if (mealsEl) mealsEl.textContent = `${report.nutrition.meal_consistency}%`;

      const moodDist = document.getElementById('rpt-mood-dist');
      if (moodDist && report.mood.distribution) {
        const emojis = { great: '😄', good: '😊', okay: '😐', low: '😔', bad: '😢' };
        moodDist.innerHTML = Object.entries(emojis).map(([key, emoji]) => `
          <div class="mood-dist-item">
            <div class="mood-dist-emoji">${emoji}</div>
            <div class="mood-dist-count">${report.mood.distribution[key] || 0}</div>
          </div>
        `).join('');
      }

    } catch (err) { /* toast shown */ }
  }

  async function mount() {
    currentRange = 'week';

    // Range toggle
    document.querySelectorAll('#report-range .tab-item').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('#report-range .tab-item').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        currentRange = tab.dataset.range;
        loadReport(currentRange);
      });
    });

    // Pillar cards → navigate to history page with section
    document.querySelectorAll('.pillar-card.clickable').forEach(card => {
      card.addEventListener('click', () => {
        const section = card.dataset.section;
        window.location.hash = `#/history?section=${section}`;
      });
    });

    await loadReport(currentRange);
  }

  function unmount() { currentRange = 'week'; }

  return { render, mount, unmount };
})();
