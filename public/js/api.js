// ============================================
// SWASTHYA YOUTH — API Client
// ============================================
window.API = (() => {
  const BASE = '/api';

  async function request(endpoint, options = {}) {
    const token = localStorage.getItem('swasthya_token');
    const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    try {
      const res = await fetch(BASE + endpoint, { ...options, headers });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 401) {
          localStorage.removeItem('swasthya_token');
          window.location.hash = '#/login';
        }
        const msg = data.error || 'Request failed';
        Helpers.showToast(msg, 'error');
        throw new Error(msg);
      }
      return data;
    } catch (err) {
      if (!err.message.includes('Request failed')) {
        Helpers.showToast('Network error. Please try again.', 'error');
      }
      throw err;
    }
  }

  function get(url) { return request(url); }
  function post(url, data) { 
    if (data && typeof data === 'object' && !data.date) {
      data.date = Helpers.getToday();
    }
    return request(url, { method: 'POST', body: JSON.stringify(data) }); 
  }
  function put(url, data) { return request(url, { method: 'PUT', body: JSON.stringify(data) }); }
  function del(url) { return request(url, { method: 'DELETE' }); }

  return {
    auth: {
      signup: (data) => post('/auth/signup', data),
      login: (data) => post('/auth/login', data),
      profile: () => get('/auth/profile'),
      updateProfile: (data) => put('/auth/profile', data),
    },
    movement: {
      log: (data) => post('/movement', data),
      history: (range = 'week') => get(`/movement?range=${range}`),
    },
    sleep: {
      log: (data) => post('/sleep', data),
      history: (range = 'week') => get(`/sleep?range=${range}`),
    },
    nutrition: {
      log: (data) => post('/nutrition', data),
      history: (range = 'week') => get(`/nutrition?range=${range}`),
    },
    mood: {
      log: (data) => post('/mood', data),
      history: (range = 'week') => get(`/mood?range=${range}`),
    },
    restdays: {
      mark: () => post('/restdays', {}),
      unmark: (date) => del(`/restdays/${date}`),
      get: (month) => get(`/restdays?month=${month || Helpers.getCurrentMonth()}`),
    },
    streaks: {
      get: () => get('/streaks'),
    },
    events: {
      list: (opts = {}) => {
        const params = new URLSearchParams();
        if (opts.category) params.append('category', opts.category);
        if (opts.city) params.append('city', opts.city);
        const qs = params.toString();
        return get(`/events${qs ? '?' + qs : ''}`);
      },
      register: (id) => post(`/events/${id}/register`, {}),
      registered: () => get('/events/registered'),
    },
    periods: {
      get: () => get('/periods'),
      log: (date, flow) => post('/periods', { date, flow }),
      remove: (date) => del(`/periods/${date}`),
    },
    reports: {
      get: (range = 'week') => get(`/reports?range=${range}`),
    }
  };
})();
