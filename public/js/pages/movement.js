// ============================================
// SWASTHYA YOUTH — Movement Tracker Page
// ============================================
window.MovementPage = (() => {
  let selectedWorkout = '';

  function render() {
    const t = I18n.t.bind(I18n);
    const workouts = [
      { key: 'walk', emoji: '🚶' }, { key: 'run', emoji: '🏃' },
      { key: 'yoga', emoji: '🧘' }, { key: 'gym', emoji: '🏋️' },
      { key: 'sport', emoji: '⚽' }, { key: 'dance', emoji: '💃' },
      { key: 'cycling', emoji: '🚴' }
    ];

    return `
      <div class="tracker-page">
        <div class="tracker-header animate-slide-up">
          <span class="tracker-icon">🏃</span>
          <h2>${t('movement.title')}</h2>
        </div>

        <div class="glass-card no-hover animate-slide-up stagger-1">
          <div class="tracker-form">
            <div class="form-group">
              <label class="form-label">${t('movement.steps')}</label>
              <input type="number" id="mv-steps" class="input" placeholder="${t('movement.stepsPlaceholder')}" min="0" max="100000">
            </div>
            <div class="input-row">
              <div class="form-group">
                <label class="form-label">${t('movement.distanceKm')}</label>
                <input type="number" id="mv-distance" class="input" placeholder="${t('movement.distancePlaceholder')}" min="0" max="100" step="0.1">
              </div>
              <div class="form-group">
                <label class="form-label">${t('movement.duration')}</label>
                <input type="number" id="mv-duration" class="input" placeholder="${t('movement.durationPlaceholder')}" min="0" max="480">
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">${t('movement.workoutType')}</label>
              <div class="chip-group" id="workout-chips">
                ${workouts.map(w => `
                  <button class="workout-chip" data-type="${w.key}">${w.emoji} ${t('movement.' + w.key).replace(/^.+\s/, '')}</button>
                `).join('')}
              </div>
            </div>
            <button id="mv-save" class="btn btn-block btn-lg" style="background: #3ecf8e; color: #12141a; font-weight: 700; border: none; box-shadow: 0 4px 15px rgba(62,207,142,0.3);">${t('movement.logMovement')}</button>
          </div>
        </div>

        <div class="section-header mt-6 animate-slide-up stagger-2">
          <h3 class="section-title">${t('movement.weeklySteps')}</h3>
        </div>
        <div class="chart-container animate-slide-up stagger-3">
          <canvas id="movement-chart"></canvas>
        </div>
      </div>`;
  }

  async function mount() {
    selectedWorkout = '';

    // Workout chip selection
    document.querySelectorAll('#workout-chips .workout-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        document.querySelectorAll('#workout-chips .workout-chip').forEach(c => c.classList.remove('selected'));
        chip.classList.add('selected');
        selectedWorkout = chip.dataset.type;
      });
    });

    // Load today's data
    try {
      const history = await API.movement.history('week');
      const today = Helpers.getToday();
      const todayLog = history.find(m => m.date === today);

      if (todayLog) {
        document.getElementById('mv-steps').value = todayLog.steps || '';
        document.getElementById('mv-distance').value = todayLog.distance_km || '';
        document.getElementById('mv-duration').value = todayLog.workout_duration || '';
        if (todayLog.workout_type) {
          selectedWorkout = todayLog.workout_type;
          const chip = document.querySelector(`[data-type="${todayLog.workout_type}"]`);
          if (chip) chip.classList.add('selected');
        }
      }

      // Render chart
      const weekDates = Helpers.getWeekDates();
      const lang = I18n.getLang();
      const labels = weekDates.map(d => Helpers.formatDay(d, lang));
      const values = weekDates.map(d => {
        const log = history.find(m => m.date === d);
        return log ? log.steps : 0;
      });

      setTimeout(() => Charts.drawLineChart('movement-chart', labels, values, '#3ecf8e'), 100);

    } catch (err) { /* toast shown */ }

    // Save button
    document.getElementById('mv-save').addEventListener('click', async () => {
      const steps = parseInt(document.getElementById('mv-steps').value) || 0;
      const distance = parseFloat(document.getElementById('mv-distance').value) || 0;
      const workout_duration = parseInt(document.getElementById('mv-duration').value) || 0;

      if (steps === 0 && distance === 0 && workout_duration === 0) {
        Helpers.showToast('Please enter some activity data', 'error');
        return;
      }

      try {
        await API.movement.log({
          steps: steps ? Number(steps) : 0,
          distance_km: distance ? Number(distance) : 0,
          workout_type: selectedWorkout,
          workout_duration: workout_duration ? Number(workout_duration) : 0
        });
        Helpers.showToast(I18n.t('common.success'), 'success');

        // Clear form after save
        document.getElementById('mv-steps').value = '';
        document.getElementById('mv-distance').value = '';
        document.getElementById('mv-duration').value = '';
        selectedWorkout = '';
        document.querySelectorAll('#workout-chips .workout-chip').forEach(c => c.classList.remove('selected'));

        // Refresh chart with updated data
        const updatedHistory = await API.movement.history('week');
        const weekDates = Helpers.getWeekDates();
        const lang = I18n.getLang();
        const labels = weekDates.map(d => Helpers.formatDay(d, lang));
        const values = weekDates.map(d => {
          const log = updatedHistory.find(m => m.date === d);
          return log ? log.steps : 0;
        });
        Charts.drawLineChart('movement-chart', labels, values, '#3ecf8e');

      } catch (err) { /* toast shown */ }
    });
  }

  function unmount() { selectedWorkout = ''; }

  return { render, mount, unmount };
})();
