// ============================================
// SWASTHYA YOUTH — Dashboard Page
// ============================================
window.DashboardPage = (() => {
  let data = { movement: null, sleep: null, nutrition: null, mood: null, streak: null, restdays: null, profile: null };

  function render() {
    const t = I18n.t.bind(I18n);
    return `
      <div class="dashboard-page">
        <div id="install-banner" class="install-banner glass-card animate-slide-up" style="display:none;">
          <div class="install-banner-content">
            <span style="font-size:1.5rem;">📲</span>
            <div style="flex:1;">
              <div style="font-weight:600;font-size:var(--text-sm);">${t('dashboard.installTitle')}</div>
              <div style="font-size:var(--text-xs);color:var(--text-secondary);">${t('dashboard.installSub')}</div>
            </div>
            <button id="install-now-btn" class="btn btn-primary" style="padding:var(--space-2) var(--space-4);font-size:var(--text-sm);">${t('dashboard.installBtn')}</button>
            <button id="install-dismiss" style="font-size:var(--text-lg);color:var(--text-tertiary);padding:var(--space-1);">&times;</button>
          </div>
        </div>

        <div class="greeting-section animate-slide-up stagger-1" style="display:flex; justify-content:space-between; align-items:center;">
          <div>
            <div class="greeting-text" id="dash-greeting">${t('greeting.' + Helpers.timeGreeting())}</div>
            <div class="greeting-sub" id="dash-name">${t('dashboard.todayProgress')}</div>
          </div>
          <div id="dash-avatar" class="avatar" style="width:48px;height:48px;font-size:1.5rem;cursor:pointer;" onclick="location.hash='#/profile'"></div>
        </div>

        <div class="dashboard-top-row animate-slide-up stagger-2">
          <div id="streak-display">${Streaks.renderStreakBadge(0)}</div>
          <div class="completion-ring-wrapper">
            <div class="completion-ring" id="completion-ring"></div>
            <div class="completion-label">${t('dashboard.completion')}</div>
          </div>
        </div>

        <div class="stats-grid">
          <div class="stat-card stat-primary animate-slide-up stagger-3" onclick="location.hash='#/movement'">
            <div class="stat-icon">🏃</div>
            <div class="stat-value" id="dash-steps">--</div>
            <div class="stat-label">${t('dashboard.steps')}</div>
          </div>
          <div class="stat-card stat-secondary animate-slide-up stagger-4" onclick="location.hash='#/sleep'">
            <div class="stat-icon">😴</div>
            <div class="stat-value" id="dash-sleep">--</div>
            <div class="stat-label">${t('dashboard.sleepHours')}</div>
          </div>
          <div class="stat-card stat-accent animate-slide-up stagger-5" onclick="location.hash='#/nutrition'">
            <div class="stat-icon">🥗</div>
            <div class="stat-value" id="dash-meals">--</div>
            <div class="stat-label">${t('dashboard.mealsLogged')}</div>
          </div>
          <div class="stat-card stat-danger animate-slide-up stagger-6" onclick="location.hash='#/mood'">
            <div class="stat-icon">😊</div>
            <div class="stat-value" id="dash-mood">--</div>
            <div class="stat-label">${t('dashboard.mood')}</div>
          </div>
        </div>

        <div class="rest-day-section glass-card no-hover animate-slide-up stagger-7">
          <span style="font-size:1.3rem;">😌</span>
          <div style="flex:1;">
            <div style="font-weight:600;font-size:var(--text-sm);">${t('dashboard.restDay')}</div>
            <div class="rest-day-info" id="rest-day-info"></div>
          </div>
          <button id="rest-day-btn" class="rest-day-toggle">${t('dashboard.markRestDay')}</button>
        </div>

        <div class="section-header mt-6 animate-slide-up stagger-8">
          <h3 class="section-title">${t('dashboard.quickLog')}</h3>
        </div>
        <div class="quick-actions animate-slide-up stagger-8">
          <button class="quick-action-btn" onclick="location.hash='#/movement'">
            <span class="action-icon">🏃</span>
            <span>${t('nav.movement')}</span>
          </button>
          <button class="quick-action-btn" onclick="location.hash='#/sleep'">
            <span class="action-icon">😴</span>
            <span>${t('nav.sleep')}</span>
          </button>
          <button class="quick-action-btn" onclick="location.hash='#/mood'">
            <span class="action-icon">😊</span>
            <span>${t('mood.title')}</span>
          </button>
          <button class="quick-action-btn" onclick="location.hash='#/events'">
            <span class="action-icon">🏅</span>
            <span>${t('dashboard.viewEvents')}</span>
          </button>
        </div>

        <div class="flex gap-3 mt-6 animate-slide-up stagger-8">
          <button class="btn btn-outline btn-block" onclick="location.hash='#/reports'">📊 ${t('dashboard.viewReports')}</button>
        </div>
      </div>`;
  }

  async function mount() {
    const today = Helpers.getToday();
    const t = I18n.t.bind(I18n);

    // Show install banner if PWA prompt is available and not dismissed
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
    const isDismissed = localStorage.getItem('pp_install_dismissed');
    const banner = document.getElementById('install-banner');

    if (!isStandalone && !isDismissed && banner) {
      banner.style.display = 'block';

      document.getElementById('install-now-btn').addEventListener('click', async () => {
        if (window._pwaInstallPrompt) {
          window._pwaInstallPrompt.prompt();
          const result = await window._pwaInstallPrompt.userChoice;
          if (result.outcome === 'accepted') {
            banner.style.display = 'none';
            Helpers.showToast('App installed! \uD83C\uDF89', 'success');
          }
          window._pwaInstallPrompt = null;
        } else {
          Helpers.showToast('Install prompt unavailable. You might already have it installed, or try using the browser menu to install.', 'info');
        }
      });

      document.getElementById('install-dismiss').addEventListener('click', () => {
        banner.style.display = 'none';
        localStorage.setItem('pp_install_dismissed', '1');
      });
    }

    try {
      const [profile, movement, sleep, nutrition, mood, streak, restdays] = await Promise.allSettled([
        API.auth.profile(),
        API.movement.history('week'),
        API.sleep.history('week'),
        API.nutrition.history('week'),
        API.mood.history('week'),
        API.streaks.get(),
        API.restdays.get()
      ]);

      // Profile greeting
      if (profile.status === 'fulfilled') {
        data.profile = profile.value;
        const el = document.getElementById('dash-name');
        if (el) el.textContent = `${t('greeting.' + Helpers.timeGreeting())}, ${data.profile.name.split(' ')[0]}!`;
        const greet = document.getElementById('dash-greeting');
        if (greet) greet.textContent = t('greeting.' + Helpers.timeGreeting());
        
        const avatar = document.getElementById('dash-avatar');
        if (avatar) avatar.textContent = data.profile.name ? data.profile.name[0].toUpperCase() : 'U';
      }

      // Movement
      let hasMovement = false;
      if (movement.status === 'fulfilled') {
        const todayLog = movement.value.find(m => m.date === today);
        const el = document.getElementById('dash-steps');
        if (el) el.textContent = todayLog ? todayLog.steps.toLocaleString() : '0';
        hasMovement = !!todayLog;
      }

      // Sleep
      let hasSleep = false;
      if (sleep.status === 'fulfilled') {
        const todayLog = sleep.value.find(s => s.date === today);
        const el = document.getElementById('dash-sleep');
        if (el) el.textContent = todayLog ? Helpers.formatDuration(todayLog.duration_hours) : '--';
        hasSleep = !!todayLog;
      }

      // Nutrition
      let hasNutrition = false;
      if (nutrition.status === 'fulfilled') {
        const todayLog = nutrition.value.find(n => n.date === today);
        const el = document.getElementById('dash-meals');
        if (todayLog) {
          const count = (todayLog.breakfast || 0) + (todayLog.lunch || 0) + (todayLog.snacks || 0) + (todayLog.dinner || 0);
          el.textContent = `${count}/4`;
          hasNutrition = true;
        } else {
          el.textContent = '0/4';
        }
      }

      // Mood
      let hasMood = false;
      const moodEmojis = { great: '😄', good: '😊', okay: '😐', low: '😔', bad: '😢' };
      if (mood.status === 'fulfilled') {
        const todayLog = mood.value.find(m => m.date === today);
        const el = document.getElementById('dash-mood');
        if (todayLog) {
          el.textContent = moodEmojis[todayLog.mood] || '😐';
          hasMood = true;
        } else {
          el.textContent = '--';
        }
      }

      // Completion ring
      const completed = [hasMovement, hasSleep, hasNutrition, hasMood].filter(Boolean).length;
      const pct = Math.round((completed / 4) * 100);
      Charts.drawProgressRing('completion-ring', pct, '#3ecf8e', 80);
      const ringText = document.querySelector('.completion-ring');
      if (ringText) {
        const textEl = document.createElement('div');
        textEl.className = 'ring-text';
        textEl.textContent = `${pct}%`;
        ringText.appendChild(textEl);
      }

      // Streak
      if (streak.status === 'fulfilled') {
        data.streak = streak.value;
        const el = document.getElementById('streak-display');
        if (el) el.innerHTML = Streaks.renderStreakBadge(data.streak.current_streak);
      }

      // Rest days
      if (restdays.status === 'fulfilled') {
        data.restdays = restdays.value;
        updateRestDayUI();
      }

    } catch (err) {
      console.error('Dashboard load error:', err);
    }

    // Rest day button
    const restBtn = document.getElementById('rest-day-btn');
    if (restBtn) {
      restBtn.addEventListener('click', async () => {
        try {
          const today = Helpers.getToday();
          const isRest = data.restdays && data.restdays.days && data.restdays.days.some(d => d.date === today);
          if (isRest) {
            await API.restdays.unmark(today);
            Helpers.showToast('Rest day unmarked', 'info');
          } else {
            await API.restdays.mark();
            Helpers.showToast(I18n.t('dashboard.isRestDay'), 'success');
          }
          data.restdays = await API.restdays.get();
          updateRestDayUI();
        } catch (err) { /* toast shown by API */ }
      });
    }
  }

  function updateRestDayUI() {
    const t = I18n.t.bind(I18n);
    const info = document.getElementById('rest-day-info');
    const btn = document.getElementById('rest-day-btn');
    if (!data.restdays) return;

    const today = Helpers.getToday();
    const isRest = data.restdays.days && data.restdays.days.some(d => d.date === today);

    if (info) info.textContent = `${data.restdays.remaining} ${t('dashboard.restDaysLeft')}`;
    if (btn) {
      btn.textContent = isRest ? t('dashboard.unmarkRestDay') : t('dashboard.markRestDay');
      btn.classList.toggle('active', isRest);
    }
  }

  function unmount() { data = { movement: null, sleep: null, nutrition: null, mood: null, streak: null, restdays: null, profile: null }; }

  return { render, mount, unmount };
})();
