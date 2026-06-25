// ============================================
// SWASTHYA YOUTH — Nutrition Tracker Page
// ============================================
window.NutritionPage = (() => {
  let meals = { breakfast: 0, lunch: 0, snacks: 0, dinner: 0 };
  let notes = { breakfast_note: '', lunch_note: '', snacks_note: '', dinner_note: '' };
  let waterGlasses = 0;

  function render() {
    const t = I18n.t.bind(I18n);
    const mealData = [
      { key: 'breakfast', emoji: '🌅', icon: '🥣' },
      { key: 'lunch', emoji: '☀️', icon: '🍛' },
      { key: 'snacks', emoji: '🍿', icon: '🍎' },
      { key: 'dinner', emoji: '🌙', icon: '🍽️' }
    ];

    return `
      <div class="tracker-page">
        <div class="tracker-header animate-slide-up">
          <span class="tracker-icon">🥗</span>
          <h2>${t('nutrition.title')}</h2>
        </div>

        <div class="flex-col gap-3">
          ${mealData.map((m, i) => `
            <div class="meal-card animate-slide-up stagger-${i+1}" id="meal-${m.key}" data-meal="${m.key}">
              <span class="meal-icon">${m.icon}</span>
              <div class="meal-info">
                <div class="meal-name">${t('nutrition.' + m.key)}</div>
                <div class="meal-status">${t('nutrition.skipped')}</div>
                <input type="text" class="meal-note" id="note-${m.key}" placeholder="${t('nutrition.addNote')}" style="display:none;">
              </div>
              <div class="meal-check">✓</div>
            </div>
          `).join('')}
        </div>

        <div class="glass-card no-hover mt-6 animate-slide-up stagger-5">
          <div class="form-group">
            <label class="form-label">${t('nutrition.waterGlasses')}</label>
            <div class="water-counter">
              <div class="water-glasses" id="water-glasses">
                ${Array.from({length: 8}, (_, i) => `<span class="water-glass" data-idx="${i}">💧</span>`).join('')}
              </div>
              <div class="water-count" id="water-count">0</div>
              <span class="text-sm text-secondary">${t('nutrition.glasses')}</span>
            </div>
          </div>
        </div>

        <button id="nut-save" class="btn btn-primary btn-block btn-lg mt-6 animate-slide-up stagger-6">${t('nutrition.logMeals')}</button>

        <div class="section-header mt-6 animate-slide-up stagger-7">
          <h3 class="section-title">${t('nutrition.weeklyConsistency')}</h3>
        </div>
        <div class="chart-container animate-slide-up stagger-8">
          <canvas id="nutrition-chart"></canvas>
        </div>
      </div>`;
  }

  async function mount() {
    meals = { breakfast: 0, lunch: 0, snacks: 0, dinner: 0 };
    notes = { breakfast_note: '', lunch_note: '', snacks_note: '', dinner_note: '' };
    waterGlasses = 0;

    // Meal toggle
    document.querySelectorAll('.meal-card').forEach(card => {
      card.addEventListener('click', (e) => {
        if (e.target.classList.contains('meal-note')) return;
        const key = card.dataset.meal;
        meals[key] = meals[key] ? 0 : 1;
        card.classList.toggle('eaten', meals[key]);
        const status = card.querySelector('.meal-status');
        if (status) status.textContent = meals[key] ? I18n.t('nutrition.ate') : I18n.t('nutrition.skipped');
        const noteInput = card.querySelector('.meal-note');
        if (noteInput) noteInput.style.display = meals[key] ? 'block' : 'none';
      });
    });

    // Note inputs
    document.querySelectorAll('.meal-note').forEach(input => {
      input.addEventListener('input', (e) => {
        const key = input.id.replace('note-', '') + '_note';
        notes[key] = input.value;
      });
      input.addEventListener('click', (e) => e.stopPropagation());
    });

    // Water glasses
    document.querySelectorAll('#water-glasses .water-glass').forEach(glass => {
      glass.addEventListener('click', () => {
        const idx = parseInt(glass.dataset.idx);
        waterGlasses = waterGlasses === idx + 1 ? idx : idx + 1;
        document.querySelectorAll('#water-glasses .water-glass').forEach((g, i) => {
          g.classList.toggle('filled', i < waterGlasses);
        });
        document.getElementById('water-count').textContent = waterGlasses;
      });
    });

    // Load today's data
    try {
      const history = await API.nutrition.history('week');
      const today = Helpers.getToday();
      const todayLog = history.find(n => n.date === today);

      if (todayLog) {
        ['breakfast', 'lunch', 'snacks', 'dinner'].forEach(key => {
          meals[key] = todayLog[key] ? 1 : 0;
          const card = document.getElementById(`meal-${key}`);
          if (card && meals[key]) {
            card.classList.add('eaten');
            card.querySelector('.meal-status').textContent = I18n.t('nutrition.ate');
            const noteInput = card.querySelector('.meal-note');
            if (noteInput && todayLog[key + '_note']) {
              noteInput.value = todayLog[key + '_note'];
              noteInput.style.display = 'block';
              notes[key + '_note'] = todayLog[key + '_note'];
            }
          }
        });
        waterGlasses = todayLog.water_glasses || 0;
        document.getElementById('water-count').textContent = waterGlasses;
        document.querySelectorAll('#water-glasses .water-glass').forEach((g, i) => {
          g.classList.toggle('filled', i < waterGlasses);
        });
      }

      // Chart: meals eaten per day
      const weekDates = Helpers.getWeekDates();
      const lang = I18n.getLang();
      const labels = weekDates.map(d => Helpers.formatDay(d, lang));
      const values = weekDates.map(d => {
        const log = history.find(n => n.date === d);
        return log ? (log.breakfast + log.lunch + log.snacks + log.dinner) : 0;
      });
      setTimeout(() => Charts.drawBarChart('nutrition-chart', labels, values, '#e8a838', 4), 100);

    } catch (err) { /* toast shown */ }

    // Save
    document.getElementById('nut-save').addEventListener('click', async () => {
      try {
        await API.nutrition.log({ ...meals, ...notes, water_glasses: waterGlasses });
        Helpers.showToast(I18n.t('common.success'), 'success');
      } catch (err) { /* toast shown */ }
    });
  }

  function unmount() {}

  return { render, mount, unmount };
})();
