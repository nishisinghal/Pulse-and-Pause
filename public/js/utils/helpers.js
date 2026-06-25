// ============================================
// SWASTHYA YOUTH — Utility Helpers
// ============================================
window.Helpers = (() => {

  function getToday() {
    return new Date().toISOString().split('T')[0];
  }

  function formatDate(dateStr, lang) {
    if (!dateStr) return '';
    const d = new Date(dateStr + 'T00:00:00');
    const options = { day: 'numeric', month: 'short', year: 'numeric' };
    return d.toLocaleDateString(lang === 'hi' ? 'hi-IN' : 'en-IN', options);
  }

  function formatDay(dateStr, lang) {
    if (!dateStr) return '';
    const d = new Date(dateStr + 'T00:00:00');
    const options = { weekday: 'short' };
    return d.toLocaleDateString(lang === 'hi' ? 'hi-IN' : 'en-IN', options);
  }

  function calculateAge(dob) {
    if (!dob) return 0;
    const birth = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
  }

  function timeGreeting() {
    const h = new Date().getHours();
    if (h < 12) return 'morning';
    if (h < 17) return 'afternoon';
    return 'evening';
  }

  function formatDuration(hours) {
    if (!hours || hours <= 0) return '0h';
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    if (m === 0) return `${h}h`;
    return `${h}h ${m}m`;
  }

  function debounce(fn, ms) {
    let timer;
    return function (...args) {
      clearTimeout(timer);
      timer = setTimeout(() => fn.apply(this, args), ms);
    };
  }

  function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => {
      if (toast.parentNode) toast.remove();
    }, 3200);
  }

  function getWeekDates() {
    const dates = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      dates.push(d.toISOString().split('T')[0]);
    }
    return dates;
  }

  function getCurrentMonth() {
    return new Date().toISOString().substring(0, 7);
  }

  return {
    getToday,
    formatDate,
    formatDay,
    calculateAge,
    timeGreeting,
    formatDuration,
    debounce,
    showToast,
    getWeekDates,
    getCurrentMonth
  };
})();
