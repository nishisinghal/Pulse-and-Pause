// ============================================
// SWASTHYA YOUTH — App Router & Init
// ============================================
window.App = (() => {
  let currentPage = null;
  let currentRoute = '';

  const routes = {
    '/login': { page: AuthPage, mode: 'login', auth: false },
    '/signup': { page: AuthPage, mode: 'signup', auth: false },
    '/dashboard': { page: DashboardPage, auth: true },
    '/movement': { page: MovementPage, auth: true },
    '/sleep': { page: SleepPage, auth: true },
    '/nutrition': { page: NutritionPage, auth: true },
    '/mood': { page: MoodPage, auth: true },
    '/periods': { page: PeriodsPage, auth: true },
    '/profile': { page: ProfilePage, auth: true },
    '/events': { page: EventsPage, auth: true },
    '/reports': { page: ReportsPage, auth: true },
    '/history': { page: HistoryPage, auth: true },
  };

  // Nav tab mapping
  const navPages = ['dashboard', 'movement', 'sleep', 'nutrition', 'profile'];

  function isAuthenticated() {
    return !!localStorage.getItem('swasthya_token');
  }

  function navigate(hash) {
    const fullRoute = hash.replace('#', '') || '/dashboard';
    const route = fullRoute.split('?')[0];
    const routeConfig = routes[route];

    if (!routeConfig) {
      window.location.hash = '#/dashboard';
      return;
    }

    // Auth guard
    if (routeConfig.auth && !isAuthenticated()) {
      window.location.hash = '#/login';
      return;
    }

    if (!routeConfig.auth && isAuthenticated() && (route === '/login' || route === '/signup')) {
      window.location.hash = '#/dashboard';
      return;
    }

    // Unmount current page
    if (currentPage && currentPage.unmount) {
      currentPage.unmount();
    }

    currentRoute = route;
    currentPage = routeConfig.page;

    // Toggle auth mode on body
    const isAuthPage = !routeConfig.auth;
    document.body.classList.toggle('auth-active', isAuthPage);

    // Render page
    const content = document.getElementById('app-content');
    if (content) {
      const html = routeConfig.mode ? currentPage.render(routeConfig.mode) : currentPage.render();
      content.innerHTML = html;
    }

    // Mount page (attach event listeners)
    if (currentPage.mount) {
      currentPage.mount();
    }

    // Update nav active state
    updateNav(route);

    // Update header greeting
    updateHeader();
  }

  function updateNav(route) {
    const pageName = route.replace('/', '');
    document.body.setAttribute('data-page', pageName);
    document.querySelectorAll('.nav-item').forEach(item => {
      item.classList.toggle('active', item.dataset.page === pageName);
    });
  }

  function updateHeader() {
    if (!isAuthenticated()) return;
    const greetingEl = document.getElementById('header-greeting');
    if (greetingEl) {
      const greeting = I18n.t('greeting.' + Helpers.timeGreeting());
      greetingEl.textContent = greeting;
    }
  }

  function rerender() {
    navigate('#' + currentRoute);
  }

  async function init() {
    // Init i18n
    await I18n.init();

    // Check gender for period tab
    if (isAuthenticated()) {
      try {
        const profile = await API.auth.profile();
        if (profile.gender === 'female') {
          const pTab = document.getElementById('nav-periods');
          if (pTab) pTab.style.display = 'flex';
        }
      } catch(e) {}
    }

    // Update lang toggle label
    const langLabel = document.getElementById('lang-label');
    if (langLabel) langLabel.textContent = I18n.getLang() === 'en' ? 'हिं' : 'EN';

    // Language toggle
    const langToggle = document.getElementById('lang-toggle');
    if (langToggle) {
      langToggle.addEventListener('click', async () => {
        const newLang = I18n.getLang() === 'en' ? 'hi' : 'en';
        await I18n.setLang(newLang);
        // Save preference to server if logged in
        if (isAuthenticated()) {
          try { await API.auth.updateProfile({ language: newLang }); } catch(e) {}
        }
        rerender();
      });
    }

    // Theme toggle — dark/light
    const savedTheme = localStorage.getItem('pp_theme') || 'dark';
    document.body.setAttribute('data-theme', savedTheme);
    const themeIcon = document.getElementById('theme-icon');
    if (themeIcon) themeIcon.textContent = savedTheme === 'light' ? '☀️' : '🌙';

    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
      themeToggle.addEventListener('click', () => {
        const current = document.body.getAttribute('data-theme') || 'dark';
        const next = current === 'dark' ? 'light' : 'dark';
        document.body.setAttribute('data-theme', next);
        localStorage.setItem('pp_theme', next);
        const icon = document.getElementById('theme-icon');
        if (icon) icon.textContent = next === 'light' ? '☀️' : '🌙';
      });
    }

    // Nav click handlers
    document.querySelectorAll('.nav-item').forEach(item => {
      item.addEventListener('click', () => {
        window.location.hash = '#/' + item.dataset.page;
      });
    });

    // Listen for hash changes
    window.addEventListener('hashchange', () => {
      navigate(window.location.hash);
    });

    // Initial route
    const hash = window.location.hash || (isAuthenticated() ? '#/dashboard' : '#/login');
    if (!window.location.hash) {
      window.location.hash = hash;
    } else {
      navigate(hash);
    }
  }

  // Boot
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  return { navigate, rerender, init };
})();
