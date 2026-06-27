// ============================================
// SWASTHYA YOUTH — Profile Page
// ============================================
window.ProfilePage = (() => {
  let profile = null;

  function render() {
    const t = I18n.t.bind(I18n);
    return `
      <div class="profile-page">
        <div class="glass-card no-hover profile-header animate-slide-up stagger-1">
          <div class="avatar avatar-lg" id="prof-avatar">?</div>
          <div class="profile-name" id="prof-name">...</div>
          <div class="profile-meta" id="prof-meta">...</div>
        </div>

        <div class="profile-stats animate-slide-up stagger-2">
          <div class="glass-card no-hover profile-stat">
            <div class="profile-stat-value" id="prof-streak">0</div>
            <div class="profile-stat-label">${t('profile.currentStreak')}</div>
          </div>
          <div class="glass-card no-hover profile-stat">
            <div class="profile-stat-value" id="prof-longest">0</div>
            <div class="profile-stat-label">${t('profile.longestStreak')}</div>
          </div>
          <div class="glass-card no-hover profile-stat">
            <div class="profile-stat-value" id="prof-age">0</div>
            <div class="profile-stat-label">${t('profile.age')}</div>
          </div>
        </div>

        <div class="section-header animate-slide-up stagger-3">
          <h3 class="section-title">${t('profile.settings')}</h3>
        </div>

        <div class="profile-settings animate-slide-up stagger-4">
          <div class="settings-item" id="setting-name">
            <span class="settings-item-label">${t('auth.name')}</span>
            <span class="settings-item-value" id="setting-name-val">...</span>
          </div>
          <div class="settings-item">
            <span class="settings-item-label">${t('profile.gender')}</span>
            <span class="settings-item-value" id="setting-gender-val">...</span>
          </div>
          <div class="settings-item" id="setting-lang">
            <span class="settings-item-label">${t('profile.language')}</span>
            <span class="settings-item-value" id="setting-lang-val">${I18n.getLang() === 'en' ? 'English' : 'हिंदी'}</span>
          </div>
          <div class="settings-item">
            <span class="settings-item-label">${t('profile.joined')}</span>
            <span class="settings-item-value" id="setting-joined-val">...</span>
          </div>
        </div>

        <div class="section-header mt-6 animate-slide-up stagger-5">
          <h3 class="section-title">📲 ${t('profile.installApp')}</h3>
        </div>
        <div class="install-platforms animate-slide-up stagger-6">
          <button class="install-btn" data-platform="android">
            <span class="install-icon">🤖</span>
            <span>Android</span>
          </button>
          <button class="install-btn" data-platform="iphone">
            <span class="install-icon">🍎</span>
            <span>iPhone</span>
          </button>
          <button class="install-btn" data-platform="mac">
            <span class="install-icon">💻</span>
            <span>Mac</span>
          </button>
          <button class="install-btn" data-platform="windows">
            <span class="install-icon">🪟</span>
            <span>Windows</span>
          </button>
        </div>
        <div id="install-status" class="text-sm text-center text-secondary mt-2 animate-slide-up stagger-6" style="display:none;"></div>

        <button id="prof-logout" class="btn btn-danger btn-block mt-6 animate-slide-up stagger-7">
          ${t('profile.logout')}
        </button>
      </div>`;
  }

  async function mount() {
    const t = I18n.t.bind(I18n);

    try {
      const [profileData, streakData] = await Promise.all([
        API.auth.profile(),
        API.streaks.get()
      ]);

      profile = profileData;

      // Avatar
      const avatar = document.getElementById('prof-avatar');
      if (avatar && profile.name) avatar.textContent = profile.name.charAt(0).toUpperCase();

      // Name & Meta
      const nameEl = document.getElementById('prof-name');
      if (nameEl) nameEl.textContent = profile.name;

      const metaEl = document.getElementById('prof-meta');
      if (metaEl) metaEl.textContent = `${profile.age} ${t('profile.years')} · ${profile.gender === 'male' ? t('auth.male') : t('auth.female')}`;

      // Stats
      const ageEl = document.getElementById('prof-age');
      if (ageEl) ageEl.textContent = profile.age;

      const streakEl = document.getElementById('prof-streak');
      if (streakEl) streakEl.textContent = streakData.current_streak;

      const longestEl = document.getElementById('prof-longest');
      if (longestEl) longestEl.textContent = streakData.longest_streak;

      // Settings
      document.getElementById('setting-name-val').textContent = profile.name;
      document.getElementById('setting-gender-val').textContent = profile.gender === 'male' ? t('auth.male') : t('auth.female');
      document.getElementById('setting-joined-val').textContent = Helpers.formatDate(profile.created_at ? profile.created_at.split('T')[0] : profile.created_at, I18n.getLang());

    } catch (err) { /* toast shown */ }

    // Language Toggle
    const langBtn = document.getElementById('setting-lang');
    if (langBtn) {
      langBtn.addEventListener('click', async () => {
        const newLang = I18n.getLang() === 'en' ? 'hi' : 'en';
        await I18n.setLang(newLang);
        try { await API.auth.updateProfile({ language: newLang }); } catch(e) {}
        window.App.navigate(window.location.hash);
      });
      langBtn.style.cursor = 'pointer';
    }

    // Install App — direct install trigger (no instructions)
    document.querySelectorAll('.install-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const statusEl = document.getElementById('install-status');

        // Already installed
        if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone) {
          statusEl.textContent = '✅ App is already installed!';
          statusEl.style.display = 'block';
          statusEl.style.color = 'var(--primary)';
          return;
        }

        // Direct install
        if (window._pwaInstallPrompt) {
          window._pwaInstallPrompt.prompt();
          const result = await window._pwaInstallPrompt.userChoice;
          if (result.outcome === 'accepted') {
            Helpers.showToast('App installed! 🎉', 'success');
            document.querySelectorAll('.install-btn').forEach(b => {
              b.style.opacity = '0.5';
              b.style.pointerEvents = 'none';
            });
            statusEl.textContent = '✅ Installed!';
            statusEl.style.color = 'var(--primary)';
          }
          statusEl.style.display = 'block';
          window._pwaInstallPrompt = null;
        } else {
          Helpers.showToast('Install prompt unavailable. You might already have it installed, or try using the browser menu to install.', 'info');
        }
      });
    });

    // Logout
    document.getElementById('prof-logout').addEventListener('click', () => {
      localStorage.removeItem('swasthya_token');
      localStorage.removeItem('swasthya_lang');
      Helpers.showToast('Logged out', 'info');
      window.location.hash = '#/login';
    });
  }

  function unmount() { profile = null; }

  return { render, mount, unmount };
})();
