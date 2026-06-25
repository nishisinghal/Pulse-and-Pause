// ============================================
// SWASTHYA YOUTH — Streak Display Helpers
// ============================================
window.Streaks = (() => {

  function renderStreakBadge(count) {
    if (!count || count === 0) {
      return `<div class="streak-counter">
        <span class="streak-fire">🔥</span>
        <span class="streak-count">0</span>
        <span class="streak-label">${window.I18n ? window.I18n.t('dashboard.streak') : 'Day Streak'}</span>
      </div>`;
    }
    return `<div class="streak-counter animate-pulse">
      <span class="streak-fire">🔥</span>
      <span class="streak-count">${count}</span>
      <span class="streak-label">${window.I18n ? window.I18n.t('dashboard.streak') : 'Day Streak'}</span>
    </div>`;
  }

  function getStreakMessage(count, lang) {
    if (count === 0) return lang === 'hi' ? 'आज से शुरू करें!' : 'Start today!';
    if (count < 7) return lang === 'hi' ? 'बढ़िया शुरुआत! जारी रखें।' : 'Great start! Keep going.';
    if (count < 14) return lang === 'hi' ? 'एक हफ्ता पूरा! शानदार!' : 'One week done! Amazing!';
    if (count < 30) return lang === 'hi' ? 'आप कमाल कर रहे हैं!' : "You're doing incredible!";
    if (count < 60) return lang === 'hi' ? 'एक महीना! आप अजेय हैं!' : "One month! You're unstoppable!";
    return lang === 'hi' ? 'आप एक स्वास्थ्य चैंपियन हैं! 🏆' : "You're a health champion! 🏆";
  }

  return { renderStreakBadge, getStreakMessage };
})();
