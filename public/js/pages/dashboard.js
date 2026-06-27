// ============================================
// SWASTHYA YOUTH — Dashboard Page
// ============================================
window.DashboardPage = (() => {
  let data = { movement: null, sleep: null, nutrition: null, mood: null, streak: null, restdays: null, profile: null };

  function render() {
    const t = I18n.t.bind(I18n);
    return `
      <div class="dashboard-page" style="position: relative; z-index: 1;">
        <div class="dashboard-header-bg" style="position: absolute; top: -60px; left: calc(50% - 50vw); width: 100vw; height: 320px; z-index: -1; pointer-events: none;"></div>
        
        <div class="greeting-section animate-slide-up stagger-1 mt-4" style="display:flex; justify-content:space-between; align-items:center;">
          <div>
            <div class="greeting-text" style="font-size: 1rem; color: var(--text-secondary);">${t('greeting.' + Helpers.timeGreeting())},</div>
            <div class="greeting-sub" style="font-size: 1.8rem; font-weight: 700; color: #FFF; margin-top: 4px;">Nishi 👋</div>
          </div>
          <div class="completion-ring-wrapper" style="position: relative; width: 80px; height: 80px;">
            <div class="completion-ring" id="completion-ring" style="width: 80px; height: 80px; filter: drop-shadow(0 0 10px rgba(163, 230, 53, 0.5));"></div>
            <div class="completion-label" style="position: absolute; top: 100%; left: 50%; transform: translateX(-50%); font-size: 0.7rem; color: var(--text-secondary); margin-top: 8px; white-space: nowrap;">Day Progress</div>
          </div>
        </div>

        <div class="dashboard-stat-card animate-slide-up stagger-2 mt-6 flex items-center justify-between p-4" style="width: 40%;">
          <div class="flex items-center gap-3">
            <div style="background: rgba(251,146,60,0.1); color: #FB923C; width: 44px; height: 44px; display: flex; align-items: center; justify-content: center; border-radius: 50%; font-size: 1.3rem; flex-shrink: 0;">🔥</div>
            <div>
              <div style="font-size: 1rem; font-weight: 700; white-space: nowrap;" class="text-white">0 Day Streak</div>
              <div style="font-size: 0.8rem; color: var(--text-secondary); white-space: nowrap;">Keep it going!</div>
            </div>
          </div>
        </div>

        <div class="section-header mt-8 mb-4 flex justify-between items-center animate-slide-up stagger-3">
          <h3 class="section-title" style="font-size: 0.8rem; letter-spacing: 1px; color: var(--text-secondary); text-transform: uppercase;">Today at a glance</h3>
          <span style="font-size: 0.8rem; color: var(--text-secondary); cursor: pointer;" onclick="location.hash='#/reports'">View insights →</span>
        </div>

        <div class="stats-stack">
          <!-- Steps Card -->
          <div class="dashboard-stat-card flex items-center justify-between p-4 mb-3 animate-slide-up stagger-4" onclick="location.hash='#/movement'">
            <div class="flex items-center gap-3">
              <div style="background: rgba(163,230,53,0.1); color: #A3E635; width: 44px; height: 44px; display: flex; align-items: center; justify-content: center; border-radius: 50%; font-size: 1.3rem;">🏃</div>
              <div class="flex flex-col">
                <span style="font-size: 0.8rem; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.5px;">${t('dashboard.steps')}</span>
                <span style="font-size: 1.2rem; font-weight: 700;" class="text-white" id="dash-steps">0 <span style="font-size:0.8rem; color:var(--text-secondary); font-weight:500;">steps</span></span>
              </div>
            </div>
            <canvas id="trend-steps" class="mini-trend" width="80" height="30"></canvas>
          </div>

          <!-- Sleep Card -->
          <div class="dashboard-stat-card flex items-center justify-between p-4 mb-3 animate-slide-up stagger-5" onclick="location.hash='#/sleep'">
            <div class="flex items-center gap-3">
              <div style="background: rgba(167,139,250,0.1); color: #A78BFA; width: 44px; height: 44px; display: flex; align-items: center; justify-content: center; border-radius: 50%; font-size: 1.3rem;">🌙</div>
              <div class="flex flex-col">
                <span style="font-size: 0.8rem; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.5px;">${t('dashboard.sleepHours')}</span>
                <span style="font-size: 1.2rem; font-weight: 700;" class="text-white" id="dash-sleep">-- <span style="font-size:0.8rem; color:var(--text-secondary); font-weight:500;">hours</span></span>
              </div>
            </div>
            <span style="font-size: 0.9rem; font-weight: 600; color: #A78BFA; background: rgba(167,139,250,0.1); padding: 4px 10px; border-radius: 12px;">Good</span>
          </div>

          <!-- Meals Card -->
          <div class="dashboard-stat-card flex items-center justify-between p-4 mb-3 animate-slide-up stagger-6" onclick="location.hash='#/nutrition'">
            <div class="flex items-center gap-3">
              <div style="background: rgba(163,230,53,0.1); color: #A3E635; width: 44px; height: 44px; display: flex; align-items: center; justify-content: center; border-radius: 50%; font-size: 1.3rem;">🥗</div>
              <div class="flex flex-col">
                <span style="font-size: 0.8rem; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.5px;">${t('dashboard.mealsLogged')}</span>
                <span style="font-size: 1.2rem; font-weight: 700;" class="text-white" id="dash-meals">0 / 4</span>
              </div>
            </div>
            <div class="flex gap-2" id="dash-meals-dots">
               <div style="width:10px; height:10px; border-radius:50%; background:rgba(128,128,128,0.2);"></div>
               <div style="width:10px; height:10px; border-radius:50%; background:rgba(128,128,128,0.2);"></div>
               <div style="width:10px; height:10px; border-radius:50%; background:rgba(128,128,128,0.2);"></div>
               <div style="width:10px; height:10px; border-radius:50%; background:rgba(128,128,128,0.2);"></div>
            </div>
          </div>

          <!-- Mood Card -->
          <div class="dashboard-stat-card flex items-center justify-between p-4 mb-3 animate-slide-up stagger-7" onclick="location.hash='#/mood'">
            <div class="flex items-center gap-3">
              <div style="background: rgba(251,191,36,0.1); color: #FBBF24; width: 44px; height: 44px; display: flex; align-items: center; justify-content: center; border-radius: 50%; font-size: 1.3rem;">😊</div>
              <div class="flex flex-col">
                <span style="font-size: 0.8rem; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.5px;">${t('dashboard.mood')}</span>
                <span style="font-size: 1.2rem; font-weight: 700;" class="text-white" id="dash-mood">Calm</span>
              </div>
            </div>
            <canvas id="trend-mood" class="mini-trend" width="80" height="30"></canvas>
          </div>

          <!-- Rest Day Card -->
          <div class="dashboard-stat-card flex items-center justify-between p-4 mb-3 animate-slide-up stagger-8">
            <div class="flex items-center gap-3">
              <div style="background: rgba(251,146,60,0.1); color: #FB923C; width: 44px; height: 44px; display: flex; align-items: center; justify-content: center; border-radius: 50%; font-size: 1.3rem;">😌</div>
              <div class="flex flex-col">
                <span style="font-size: 1.1rem; font-weight: 700;" class="text-white">${t('dashboard.restDay')}</span>
                <span style="font-size: 0.85rem; color: var(--text-secondary);" id="rest-day-info">5 rest days left this month</span>
              </div>
            </div>
            <button id="rest-day-btn" style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: var(--text-secondary); width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s ease;">→</button>
          </div>

          <!-- Events Card -->
          <div class="dashboard-stat-card flex items-center justify-between p-4 mb-3 animate-slide-up stagger-9" onclick="location.hash='#/events'">
            <div class="flex items-center gap-3">
              <div style="background: rgba(56,189,248,0.1); color: #38BDF8; width: 44px; height: 44px; display: flex; align-items: center; justify-content: center; border-radius: 50%; font-size: 1.3rem;">🎟️</div>
              <div class="flex flex-col">
                <span style="font-size: 1.1rem; font-weight: 700;" class="text-white">${t('dashboard.viewEvents')}</span>
                <span style="font-size: 0.85rem; color: var(--text-secondary);">Join local fitness events</span>
              </div>
            </div>
            <div style="color: var(--text-secondary); opacity: 0.5;">→</div>
          </div>
        </div>

      </div>
    `;
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
        const dotsContainer = document.getElementById('dash-meals-dots');
        let count = 0;

        if (todayLog) {
          count = (todayLog.breakfast || 0) + (todayLog.lunch || 0) + (todayLog.snacks || 0) + (todayLog.dinner || 0);
          el.textContent = `${count}/4`;
          hasNutrition = true;
        } else {
          el.textContent = '0/4';
        }

        if (dotsContainer) {
          Array.from(dotsContainer.children).forEach((dot, index) => {
            if (index < count) {
              dot.style.background = '#A3E635';
              dot.style.boxShadow = '0 0 8px rgba(163,230,53,0.5)';
            } else {
              dot.style.background = 'rgba(128,128,128,0.2)';
              dot.style.boxShadow = 'none';
            }
          });
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
      btn.innerHTML = isRest ? '✓' : '→';
      btn.style.background = isRest ? '#3ecf8e' : '#475569';
      btn.style.color = isRest ? '#ffffff' : '#f8fafc';
      btn.style.borderColor = isRest ? '#3ecf8e' : '#475569';
      btn.classList.toggle('active', isRest);
    }
  }

  function unmount() { data = { movement: null, sleep: null, nutrition: null, mood: null, streak: null, restdays: null, profile: null }; }

  return { render, mount, unmount };
})();
