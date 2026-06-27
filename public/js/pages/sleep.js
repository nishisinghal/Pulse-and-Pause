// ============================================
// SWASTHYA YOUTH — Sleep Tracker Page
// ============================================
window.SleepPage = (() => {
  let selectedQuality = 3;

  function render() {
    const t = I18n.t.bind(I18n);
    return `
      <div class="tracker-page" style="position: relative; z-index: 1;">
        <div class="sleep-header-bg" style="position: absolute; top: -60px; left: -20px; right: -20px; height: 320px; background: url('/img/moon.svg') center/cover; opacity: 0.5; z-index: -1; mask-image: linear-gradient(to bottom, black 30%, transparent 100%); -webkit-mask-image: linear-gradient(to bottom, black 30%, transparent 100%); pointer-events: none;"></div>
        <div class="tracker-header animate-slide-up">
          <span class="tracker-icon">😴</span>
          <h2>${t('sleep.title')}</h2>
        </div>

        <div class="glass-card no-hover animate-slide-up stagger-1">
          <div class="tracker-form">
            <div class="flex gap-2 mb-4">
              <div class="flex-1" style="background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 20px; padding: 0.75rem 0.5rem; transition: all 0.2s ease;">
                <label class="form-label block text-center" style="font-size: 10px; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.5px; color: var(--text-tertiary);">${t('sleep.bedtime')}</label>
                <div class="flex items-center justify-center gap-1">
                  <span style="font-size: 1.1rem;">🌙</span>
                  <input type="time" id="sl-bedtime" value="23:00" style="background:transparent; border:none; box-shadow:none; padding:0; font-size:1.1rem; font-weight:700; outline:none; text-align:center; color: var(--text-primary); width: 100%;">
                </div>
              </div>
              <div class="flex-1" style="background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 20px; padding: 0.75rem 0.5rem; transition: all 0.2s ease;">
                <label class="form-label block text-center" style="font-size: 10px; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.5px; color: var(--text-tertiary);">${t('sleep.wakeTime')}</label>
                <div class="flex items-center justify-center gap-1">
                  <span style="font-size: 1.1rem;">☀️</span>
                  <input type="time" id="sl-wake" value="07:00" style="background:transparent; border:none; box-shadow:none; padding:0; font-size:1.1rem; font-weight:700; outline:none; text-align:center; color: var(--text-primary); width: 100%;">
                </div>
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">${t('sleep.duration')}</label>
              <div id="sl-duration" class="stat-value" style="color: var(--secondary);">8h 0m</div>
            </div>
            <div id="sleep-nudge" style="display:none;"></div>
            <div class="form-group">
              <label class="form-label">${t('sleep.quality')}</label>
              <div class="star-rating" id="sl-stars">
                ${[1,2,3,4,5].map(i => `<span class="star ${i <= 3 ? 'active' : ''}" data-val="${i}">⭐</span>`).join('')}
              </div>
            </div>
            <button id="sl-save" class="btn btn-secondary btn-block btn-lg">${t('sleep.logSleep')}</button>
          </div>
        </div>

        <div class="section-header mt-6 animate-slide-up stagger-2">
          <h3 class="section-title">${t('sleep.weeklySleep')}</h3>
        </div>
        <div class="chart-container animate-slide-up stagger-3">
          <canvas id="sleep-chart"></canvas>
        </div>
      </div>`;
  }

  function calcDisplayDuration() {
    const bed = document.getElementById('sl-bedtime').value;
    const wake = document.getElementById('sl-wake').value;
    if (!bed || !wake) return;
    const [bh, bm] = bed.split(':').map(Number);
    const [wh, wm] = wake.split(':').map(Number);
    let bedMin = bh * 60 + bm;
    let wakeMin = wh * 60 + wm;
    if (wakeMin <= bedMin) wakeMin += 24 * 60;
    const hours = (wakeMin - bedMin) / 60;
    const el = document.getElementById('sl-duration');
    if (el) el.textContent = Helpers.formatDuration(hours);

    // Nudge
    const nudge = document.getElementById('sleep-nudge');
    if (nudge) {
      if (hours < 6) {
        nudge.innerHTML = `<div class="nudge-card"><span class="nudge-icon">💡</span><span class="nudge-text">${I18n.t('sleep.sleepNudgeLow')}</span></div>`;
        nudge.style.display = 'block';
      } else if (hours > 10) {
        nudge.innerHTML = `<div class="nudge-card"><span class="nudge-icon">💡</span><span class="nudge-text">${I18n.t('sleep.sleepNudgeHigh')}</span></div>`;
        nudge.style.display = 'block';
      } else {
        nudge.style.display = 'none';
      }
    }
  }

  async function mount() {
    selectedQuality = 3;

    // Time change listeners
    document.getElementById('sl-bedtime').addEventListener('change', calcDisplayDuration);
    document.getElementById('sl-wake').addEventListener('change', calcDisplayDuration);

    // Star rating
    document.querySelectorAll('#sl-stars .star').forEach(star => {
      star.addEventListener('click', () => {
        selectedQuality = parseInt(star.dataset.val);
        document.querySelectorAll('#sl-stars .star').forEach((s, i) => {
          s.classList.toggle('active', i < selectedQuality);
        });
      });
    });

    // Load today's data
    try {
      const history = await API.sleep.history('week');
      const today = Helpers.getToday();
      const todayLog = history.find(s => s.date === today);

      if (todayLog) {
        if (todayLog.bedtime) document.getElementById('sl-bedtime').value = todayLog.bedtime;
        if (todayLog.wake_time) document.getElementById('sl-wake').value = todayLog.wake_time;
        if (todayLog.quality) {
          selectedQuality = todayLog.quality;
          document.querySelectorAll('#sl-stars .star').forEach((s, i) => {
            s.classList.toggle('active', i < selectedQuality);
          });
        }
      }

      calcDisplayDuration();

      // Chart
      const weekDates = Helpers.getWeekDates();
      const lang = I18n.getLang();
      const labels = weekDates.map(d => Helpers.formatDay(d, lang));
      const values = weekDates.map(d => {
        const log = history.find(s => s.date === d);
        return log ? log.duration_hours : 0;
      });

      setTimeout(() => Charts.drawLineChart('sleep-chart', labels, values, '#5b8cf7'), 100);

    } catch (err) { /* toast shown */ }

    // Save
    document.getElementById('sl-save').addEventListener('click', async () => {
      const bedtime = document.getElementById('sl-bedtime').value;
      const wake_time = document.getElementById('sl-wake').value;

      try {
        await API.sleep.log({ bedtime, wake_time, quality: selectedQuality });
        Helpers.showToast(I18n.t('common.success'), 'success');
      } catch (err) { /* toast shown */ }
    });
  }

  function unmount() { selectedQuality = 3; }

  return { render, mount, unmount };
})();
