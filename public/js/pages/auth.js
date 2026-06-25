// ============================================
// SWASTHYA YOUTH — Auth Page (Login / Signup)
// ============================================
window.AuthPage = (() => {
  let mode = 'login';

  function render(m) {
    mode = m || 'login';
    const t = I18n.t.bind(I18n);

    if (mode === 'signup') {
      return `
        <div class="auth-page">
          <div class="auth-card animate-scale-in">
            <div class="auth-logo">
              <img src="/logo.svg" alt="Pulse & Pause" class="auth-logo-img">
              <h2>${t('auth.welcome')}</h2>
              <p>${t('auth.tagline')}</p>
            </div>
            <form id="signup-form" class="auth-form">
              <div class="form-group">
                <label class="form-label">${t('auth.name')}</label>
                <input type="text" id="signup-name" class="input" placeholder="${t('auth.name')}" required>
              </div>
              <div class="form-group">
                <label class="form-label">${t('auth.email')}</label>
                <input type="email" id="signup-email" class="input" placeholder="${t('auth.email')}" required>
              </div>
              <div class="form-group">
                <label class="form-label">${t('auth.password')}</label>
                <input type="password" id="signup-password" class="input" placeholder="${t('auth.password')}" required minlength="6">
              </div>
              <div class="form-group">
                <label class="form-label">${t('auth.dob')}</label>
                <input type="date" id="signup-dob" class="input" required>
              </div>
              <div class="form-group">
                <label class="form-label">${t('auth.gender')}</label>
                <div class="radio-group" id="gender-group">
                  <div class="radio-option" data-value="male">♂ ${t('auth.male')}</div>
                  <div class="radio-option" data-value="female">♀ ${t('auth.female')}</div>
                </div>
              </div>
              <div class="form-group">
                <label class="form-label">${t('auth.country', 'Country')}</label>
                <select id="signup-country" class="input" required>
                  <option value="IN">India</option>
                  <option value="US">United States</option>
                  <option value="GB">United Kingdom</option>
                  <option value="CA">Canada</option>
                  <option value="AU">Australia</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
              <div id="signup-error" class="error-text" style="display:none;"></div>
              <button type="submit" class="btn btn-primary btn-lg btn-block">${t('auth.signupBtn')}</button>
            </form>
            <div class="auth-switch">
              ${t('auth.haveAccount')} <a id="goto-login">${t('auth.login')}</a>
            </div>
          </div>
        </div>`;
    }

    return `
      <div class="auth-page">
        <div class="auth-card animate-scale-in">
          <div class="auth-logo">
            <img src="/logo.svg" alt="Pulse & Pause" class="auth-logo-img">
            <h2>${t('auth.welcome')}</h2>
            <p>${t('auth.tagline')}</p>
          </div>
          <form id="login-form" class="auth-form">
            <div class="form-group">
              <label class="form-label">${t('auth.email')}</label>
              <input type="email" id="login-email" class="input" placeholder="${t('auth.email')}" required>
            </div>
            <div class="form-group">
              <label class="form-label">${t('auth.password')}</label>
              <input type="password" id="login-password" class="input" placeholder="${t('auth.password')}" required>
            </div>
            <div id="login-error" class="error-text" style="display:none;"></div>
            <button type="submit" class="btn btn-primary btn-lg btn-block">${t('auth.loginBtn')}</button>
          </form>
          <div class="auth-switch">
            ${t('auth.noAccount')} <a id="goto-signup">${t('auth.signup')}</a>
          </div>
        </div>
      </div>`;
  }

  function mount() {
    let selectedGender = '';

    if (mode === 'login') {
      const form = document.getElementById('login-form');
      if (form) {
        form.addEventListener('submit', async (e) => {
          e.preventDefault();
          const email = document.getElementById('login-email').value.trim();
          const password = document.getElementById('login-password').value;
          const errEl = document.getElementById('login-error');
          errEl.style.display = 'none';

          try {
            const data = await API.auth.login({ email, password });
            localStorage.setItem('swasthya_token', data.token);
            Helpers.showToast('Welcome back!', 'success');
            window.location.hash = '#/dashboard';
          } catch (err) {
            errEl.textContent = err.message;
            errEl.style.display = 'block';
          }
        });
      }

      const goSignup = document.getElementById('goto-signup');
      if (goSignup) goSignup.addEventListener('click', () => { window.location.hash = '#/signup'; });

    } else {
      // Gender radio buttons
      document.querySelectorAll('#gender-group .radio-option').forEach(opt => {
        opt.addEventListener('click', () => {
          document.querySelectorAll('#gender-group .radio-option').forEach(o => o.classList.remove('selected'));
          opt.classList.add('selected');
          selectedGender = opt.dataset.value;
        });
      });

      const form = document.getElementById('signup-form');
      if (form) {
        form.addEventListener('submit', async (e) => {
          e.preventDefault();
          const name = document.getElementById('signup-name').value.trim();
          const email = document.getElementById('signup-email').value.trim();
          const password = document.getElementById('signup-password').value;
          const dob = document.getElementById('signup-dob').value;
          const country = document.getElementById('signup-country').value;
          const errEl = document.getElementById('signup-error');
          errEl.style.display = 'none';

          if (!selectedGender) {
            errEl.textContent = I18n.t('auth.genderRequired');
            errEl.style.display = 'block';
            return;
          }

          const age = Helpers.calculateAge(dob);
          if (age < 13 || age > 30) {
            errEl.textContent = I18n.t('auth.ageError');
            errEl.style.display = 'block';
            return;
          }

          try {
            const data = await API.auth.signup({ name, email, password, dob, gender: selectedGender, country });
            localStorage.setItem('swasthya_token', data.token);
            Helpers.showToast('Account created!', 'success');
            window.location.hash = '#/dashboard';
          } catch (err) {
            errEl.textContent = err.message;
            errEl.style.display = 'block';
          }
        });
      }

      const goLogin = document.getElementById('goto-login');
      if (goLogin) goLogin.addEventListener('click', () => { window.location.hash = '#/login'; });
    }
  }

  function unmount() {}

  return { render, mount, unmount };
})();
